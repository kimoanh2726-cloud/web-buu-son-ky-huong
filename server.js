const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const QRCode = require('qrcode');
const path = require('path');
const compression = require('compression');
const fs = require('fs');
const { spawn } = require('child_process');

const DEFAULT_QUESTIONS = require('./public/js/questions');
const { 
  parseXlsxBuffer, 
  parseDocxBuffer, 
  shuffleQuestionsList,
  exportQuestionsToXlsxBuffer,
  exportQuestionsToDocxBuffer
} = require('./question-parser');
const QUESTIONS_FILE = path.join(__dirname, 'data', 'questions.json');

function loadQuestions() {
  try {
    if (fs.existsSync(QUESTIONS_FILE)) {
      const data = fs.readFileSync(QUESTIONS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Questions] Đã nạp ${parsed.length} câu hỏi từ data/questions.json`);
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Questions] Lỗi đọc questions.json:', err.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
}

function saveQuestionsToDisk(questionsList) {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questionsList, null, 2), 'utf8');
    console.log(`[Questions] Đã lưu ${questionsList.length} câu hỏi vào data/questions.json`);
    return true;
  } catch (err) {
    console.error('[Questions] Lỗi lưu questions.json:', err.message);
    return false;
  }
}

let QUESTIONS = loadQuestions();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const HOST_SECRET = process.env.HOST_SECRET || 'buusonkyhuong2026';
const CLOUD_URL = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null);

function isLocalAddress(ip) {
  if (!ip) return false;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();
const JOIN_URL = CLOUD_URL ? `${CLOUD_URL}/player.html` : `http://${LOCAL_IP}:${PORT}/player.html`;

// ============================================================================
// BẢO MẬT & TỐI ƯU HIỆU NĂNG HTTP (GZIP COMPRESSION & CACHE HEADERS)
// ============================================================================
app.disable('x-powered-by');

// Nén dữ liệu GZIP giúp giảm 70-80% dung lượng HTML, CSS, JS tải về điện thoại người chơi
app.use(compression());

// Gắn tiêu đề bảo vệ chống sniffing, clickjacking, XSS injection
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Cho phép upload file câu hỏi Excel (.xlsx) / Word (.docx) dung lượng lên đến 25MB
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

function isLocalRequest(req) {
  const host = (req.headers.host || '').toLowerCase();
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-forwarded-proto'];
  if (forwarded || host.includes('lhr.life') || host.includes('.app') || host.includes('.onrender.com') || host.includes('.railway.app')) {
    return false;
  }
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

// Middleware kiểm tra quyền quản trị máy chủ (Host)
function requireHostAuth(req, res, next) {
  const isLocal = isLocalRequest(req);
  const token = req.headers['x-host-token'] || req.query.token || req.query.key;
  if (isLocal || (token && token === HOST_SECRET)) {
    return next();
  }
  return res.status(403).json({ error: 'Truy cập bị từ chối: Yêu cầu quyền quản trị (Host Token).' });
}

// Bảo vệ trực tiếp file host.html khỏi người chơi ngoài Internet
app.get('/host.html', (req, res, next) => {
  const isLocal = isLocalRequest(req);
  const token = req.query.key || req.query.token;
  if (isLocal || token === HOST_SECRET) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(path.join(__dirname, 'public', 'host.html'));
  }
  res.redirect('/player.html');
});

// Phục vụ Favicon chú rùa
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Phục vụ tài nguyên tĩnh với bộ nhớ đệm (Cache-Control) giúp người chơi tải cực nhanh
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // File HTML luôn cập nhật mới nhất
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      // CSS, JS, Audio, Font, Ảnh được lưu cache 1 ngày (tải tức thì trong vài mili-giây)
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  }
}));

// ============================================================================
// QUẢN LÝ ĐƯỜNG DẪN THAM GIA TOÀN CẦU (PUBLIC HTTPS TUNNEL) & MÃ QR ĐỘNG
// ============================================================================
let currentJoinUrl = JOIN_URL;
let currentQrDataUrl = '';
let tunnelProcess = null;
let isTunnelActive = false;
let currentTunnelDomain = null;

async function generateQrDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      margin: 1,
      color: { dark: '#731313', light: '#fbf5e8' },
      width: 360
    });
  } catch (err) {
    console.error('Lỗi sinh QR code:', err);
    return '';
  }
}

// Khởi tạo mã QR mặc định ban đầu
generateQrDataUrl(currentJoinUrl).then(url => {
  currentQrDataUrl = url;
});

function startPublicTunnel() {
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch (e) {}
    tunnelProcess = null;
  }

  // Nếu đang chạy trên Cloud (Render, Railway, Fly.io, custom domain)
  if (CLOUD_URL) {
    console.log(`✨ Đang chạy trên Cloud Production trực tiếp: ${CLOUD_URL}`);
    currentTunnelDomain = CLOUD_URL;
    currentJoinUrl = `${CLOUD_URL}/player.html`;
    isTunnelActive = true;
    generateQrDataUrl(currentJoinUrl).then(qr => {
      currentQrDataUrl = qr;
      io.emit('room:qr_updated', {
        joinUrl: currentJoinUrl,
        qrDataUrl: currentQrDataUrl,
        isPublic: true,
        tunnelDomain: currentTunnelDomain
      });
    });
    return;
  }

  isTunnelActive = false;
  console.log('🌐 Đang khởi động Public HTTPS Tunnel (localhost.run)...');

  // Chú ý: dùng 127.0.0.1 để tránh IPv6 ::1 502 Bad Gateway trên Windows
  tunnelProcess = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-R', `80:127.0.0.1:${PORT}`,
    'nokey@localhost.run'
  ]);

  const parseOutput = async (data) => {
    const text = data.toString();
    console.log('[Tunnel]', text.trim());
    // localhost.run output pattern: https://xxxx.lhr.life or https://xxxx.app.lhr.life
    const match = text.match(/https:\/\/[a-zA-Z0-9\-_\.]+\.lhr\.life/);
    if (match) {
      currentTunnelDomain = match[0];
      currentJoinUrl = `${currentTunnelDomain}/player.html`;
      isTunnelActive = true;
      currentQrDataUrl = await generateQrDataUrl(currentJoinUrl);
      console.log(`✨ KẾT NỐI TOÀN CẦU THÀNH CÔNG: ${currentJoinUrl}`);
      io.emit('room:qr_updated', {
        joinUrl: currentJoinUrl,
        qrDataUrl: currentQrDataUrl,
        isPublic: true,
        tunnelDomain: currentTunnelDomain
      });
    }
  };

  tunnelProcess.stdout.on('data', parseOutput);
  tunnelProcess.stderr.on('data', parseOutput);

  tunnelProcess.on('close', async (code) => {
    console.log(`[Tunnel] Tiến trình kết thúc (code ${code})`);
    if (isTunnelActive) {
      isTunnelActive = false;
      currentTunnelDomain = null;
      currentJoinUrl = `http://${LOCAL_IP}:${PORT}/player.html`;
      currentQrDataUrl = await generateQrDataUrl(currentJoinUrl);
      io.emit('room:qr_updated', {
        joinUrl: currentJoinUrl,
        qrDataUrl: currentQrDataUrl,
        isPublic: false,
        tunnelDomain: null
      });
    }
    tunnelProcess = null;
  });

  tunnelProcess.on('error', (err) => {
    console.error('[Tunnel Error]:', err);
  });
}

function stopPublicTunnel() {
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch (e) {}
    tunnelProcess = null;
  }
  isTunnelActive = false;
  currentTunnelDomain = null;
  currentJoinUrl = `http://${LOCAL_IP}:${PORT}/player.html`;
  generateQrDataUrl(currentJoinUrl).then(url => {
    currentQrDataUrl = url;
    io.emit('room:qr_updated', {
      joinUrl: currentJoinUrl,
      qrDataUrl: currentQrDataUrl,
      isPublic: false,
      tunnelDomain: null
    });
  });
}

// ============================================================================
// KHỞI TẠO 50 CHỖ NGỒI (ĐỆM CHIẾU CÓI) TRONG CHÁNH ĐIỆN BỬU SƠN KỲ HƯƠNG
// Tọa độ chuẩn hóa (x: 0..100%, y: 0..100%)
// Cách đều nhau cả chiều ngang và chiều dọc, không bị dính chùm
// Dãy Tả (x: 7% -> 35%) | Lối đi giữa (38% -> 62%) | Dãy Hữu (x: 65% -> 93%)
// ============================================================================
const TOTAL_SEATS = 50;
const seats = [];

for (let i = 1; i <= TOTAL_SEATS; i++) {
  const isLeft = i <= 25;
  const indexInWing = isLeft ? i - 1 : i - 26;
  const row = Math.floor(indexInWing / 5); // Hàng: 0..4 (5 hàng)
  const col = indexInWing % 5;            // Cột: 0..4 (5 cột)

  // Cách đều khoảng cách ngang (col * 7.2%) và dọc (row * 18%)
  const x = isLeft ? 6.5 + col * 7.2 : 64.7 + col * 7.2;
  const y = 12 + row * 18;

  seats.push({
    id: i,
    number: i,
    wing: isLeft ? 'left' : 'right',
    row: row + 1,
    col: col + 1,
    x: parseFloat(x.toFixed(2)),
    y: parseFloat(y.toFixed(2)),
    occupant: null // { id, name }
  });
}

// Trạng thái phòng chơi
const gameState = {
  status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'ENDED'
  duration: 420,   // Mặc định 7 phút
  remainingTime: 420,
  isPaused: false,
  timerInterval: null,
  players: new Map() // socket.id -> playerObj
};

// ============================================================================
// HỆ THỐNG KHẢO NGHIỆM ĐỒNG BỘ THEO TIẾNG CHUÔNG (HOST-CONTROLLED SYNCHRONIZED QUIZ)
// Mọi câu hỏi đều khởi phát khi Chủ tọa thỉnh chuông Tam Bảo
// Tự động đếm ngược 25s, hết giờ tự hiện đáp án đúng, thỉnh chuông sang câu tiếp
// ============================================================================
const quizState = {
  currentIndex: -1,         // -1: Chưa bắt đầu; 0..11: Câu 1..12
  totalQuestions: QUESTIONS.length, // 12
  timeLimit: 25,            // 25 giây cho mỗi câu hỏi
  remainingTime: 0,
  interval: null,
  isAcceptingAnswers: false,
  isRevealed: false,
  playerAnswers: new Map()  // socket.id -> { optionIndex, isCorrect, pointsEarned }
};

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  gameState.status = 'PLAYING';

  gameState.timerInterval = setInterval(() => {
    if (!gameState.isPaused && gameState.remainingTime > 0) {
      gameState.remainingTime--;
      io.emit('game:tick', {
        remainingTime: gameState.remainingTime,
        formatted: formatTime(gameState.remainingTime)
      });

      if (gameState.remainingTime <= 0) {
        endGame('Hết thời khắc chiêm nghiệm');
      }
    }
  }, 1000);
}

function endGame(reason = 'Kết thúc trận') {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
  if (quizState.interval) {
    clearInterval(quizState.interval);
    quizState.interval = null;
  }
  gameState.status = 'ENDED';

  const leaderboard = getSortedLeaderboard();
  const top3 = leaderboard.slice(0, 3);
  io.emit('game:over', {
    reason,
    leaderboard,
    top3
  });
}

function restartGame() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
  if (quizState.interval) {
    clearInterval(quizState.interval);
    quizState.interval = null;
  }

  gameState.status = 'LOBBY';
  gameState.duration = 420;
  gameState.remainingTime = 420;
  gameState.isPaused = false;

  quizState.currentIndex = -1;
  quizState.remainingTime = 0;
  quizState.isAcceptingAnswers = false;
  quizState.isRevealed = false;
  quizState.playerAnswers.clear();

  // Reset tất cả các ghế
  seats.forEach(s => { s.occupant = null; });

  // Reset điểm và trạng thái người chơi, cho về lại vị trí cửa chánh điện
  gameState.players.forEach(p => {
    p.score = 0;
    p.answeredCount = 0;
    p.correctCount = 0;
    p.isSeated = false;
    p.seatId = null;
    p.x = 50;
    p.y = 92;
    p.isMoving = false;
  });

  io.emit('game:restarted', {
    status: gameState.status,
    duration: gameState.duration,
    remainingTime: gameState.remainingTime,
    formattedTime: formatTime(gameState.remainingTime),
    seats,
    players: Array.from(gameState.players.values()),
    totalQuestions: quizState.totalQuestions,
    notice: 'Chủ tọa đã khởi động lại đại lễ khảo nghiệm từ đầu!'
  });

  io.emit('temple:bell');
}

function getSortedLeaderboard() {
  const list = Array.from(gameState.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    answeredCount: p.answeredCount,
    correctCount: p.correctCount,
    avatarIndex: p.avatarIndex,
    seatId: p.seatId
  }));
  list.sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);
  return list;
}

// ----------------------------------------------------------------------------
// CÁC HÀM XỬ LÝ KHẢO NGHIỆM ĐỒNG BỘ
// ----------------------------------------------------------------------------
function startQuestion(index) {
  if (quizState.interval) clearInterval(quizState.interval);

  // Kích hoạt game sang trạng thái PLAYING nếu đang ở LOBBY
  if (gameState.status !== 'PLAYING') {
    startTimer();
  }

  quizState.currentIndex = index;
  quizState.remainingTime = quizState.timeLimit;
  quizState.isAcceptingAnswers = true;
  quizState.isRevealed = false;
  quizState.playerAnswers.clear();

  const q = QUESTIONS[index];

  // Tiếng chuông Tam Bảo ngân vang
  io.emit('temple:bell');

  // Gửi câu hỏi đồng bộ đến màn hình Host và tất cả Người chơi
  io.emit('quiz:question_started', {
    questionIndex: index,
    questionNumber: index + 1,
    totalQuestions: quizState.totalQuestions,
    queSo: q.que_so,
    chuDe: q.chu_de,
    cauHoi: q.cau_hoi,
    cacLuaChon: q.cac_lua_chon,
    timeLimit: quizState.timeLimit,
    remainingTime: quizState.remainingTime
  });

  // Bắt đầu đếm ngược thời gian cho câu hỏi
  quizState.interval = setInterval(() => {
    if (quizState.remainingTime > 0) {
      quizState.remainingTime--;
      io.emit('quiz:tick', {
        remainingTime: quizState.remainingTime,
        questionIndex: quizState.currentIndex,
        timeLimit: quizState.timeLimit
      });

      if (quizState.remainingTime <= 0) {
        revealAnswer();
      }
    }
  }, 1000);
}

function revealAnswer() {
  if (quizState.interval) {
    clearInterval(quizState.interval);
    quizState.interval = null;
  }

  quizState.isAcceptingAnswers = false;
  quizState.isRevealed = true;

  const q = QUESTIONS[quizState.currentIndex];

  // Xử lý tất cả cư sĩ đã an vị: Ai chưa kịp trả lời -> Tính là BỎ LỠ VÀ TRẢ LỜI SAI (0 điểm)
  gameState.players.forEach((player, socketId) => {
    if (player.isSeated) {
      if (!quizState.playerAnswers.has(socketId)) {
        player.answeredCount++;
        io.to(socketId).emit('quiz:your_result', {
          status: 'MISSED',
          selectedOption: -1,
          isCorrect: false,
          pointsEarned: 0,
          totalScore: player.score,
          correctAnswer: q.dap_an_dung,
          loiGiai: q.loi_giai
        });
      }
    }
  });

  const hasNext = (quizState.currentIndex + 1 < quizState.totalQuestions);

  // Phát tín hiệu tự động hiện đáp án đúng và lời giải
  io.emit('quiz:answer_revealed', {
    questionIndex: quizState.currentIndex,
    questionNumber: quizState.currentIndex + 1,
    totalQuestions: quizState.totalQuestions,
    correctAnswer: q.dap_an_dung,
    loiGiai: q.loi_giai,
    hasNextQuestion: hasNext,
    nextQuestionNumber: quizState.currentIndex + 2
  });
}

function handleHostStrikeBell() {
  // Nếu chưa bắt đầu câu nào hoặc câu hiện tại đã công bố đáp án -> Tiến sang câu kế tiếp
  if (quizState.currentIndex === -1) {
    startQuestion(0);
  } else if (quizState.isRevealed) {
    const nextIdx = quizState.currentIndex + 1;
    if (nextIdx < quizState.totalQuestions) {
      startQuestion(nextIdx);
    } else {
      // Đã hoàn tất cả 12 câu khảo nghiệm
      io.emit('temple:bell');
      endGame('Hoàn mãn 12 câu khảo nghiệm Bửu Sơn Kỳ Hương');
    }
  } else {
    // Nếu chuông gõ khi câu hỏi đang đếm ngược: phát tiếng chuông trợ duyên
    io.emit('temple:bell');
  }
}

// API lấy thông tin phòng
app.get('/api/room-info', async (req, res) => {
  try {
    if (!currentQrDataUrl) {
      currentQrDataUrl = await generateQrDataUrl(currentJoinUrl);
    }

    res.json({
      localIP: LOCAL_IP,
      port: PORT,
      joinUrl: currentJoinUrl,
      qrDataUrl: currentQrDataUrl,
      isPublic: isTunnelActive,
      tunnelDomain: currentTunnelDomain,
      gameState: gameState.status,
      remainingTime: gameState.remainingTime,
      totalPlayers: gameState.players.size,
      seats
    });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy thông tin phòng' });
  }
});

// API cập nhật Join URL tùy biến (chỉ Chủ tọa Host mới có quyền đổi)
app.post('/api/set-join-url', requireHostAuth, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Đường dẫn không hợp lệ' });
  }

  const trimmed = url.trim();
  if (trimmed.length > 300) {
    return res.status(400).json({ error: 'Đường dẫn quá dài (tối đa 300 ký tự)' });
  }

  // Xác thực giao thức an toàn (chống javascript: / data: / XSS)
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Chỉ chấp nhận giao thức http:// hoặc https://' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Định dạng URL không hợp lệ' });
  }

  currentJoinUrl = trimmed;
  currentQrDataUrl = await generateQrDataUrl(currentJoinUrl);
  io.emit('room:qr_updated', {
    joinUrl: currentJoinUrl,
    qrDataUrl: currentQrDataUrl,
    isPublic: currentJoinUrl.startsWith('https://') || !currentJoinUrl.includes('localhost'),
    tunnelDomain: currentTunnelDomain
  });
  res.json({ success: true, joinUrl: currentJoinUrl, qrDataUrl: currentQrDataUrl });
});

// API Bật/Tắt Tunnel (Rate limiting chống spam tiến trình ssh)
let lastTunnelToggle = 0;
app.post('/api/tunnel/toggle', requireHostAuth, (req, res) => {
  const now = Date.now();
  if (now - lastTunnelToggle < 3000) {
    return res.status(429).json({ error: 'Thao tác quá nhanh, vui lòng chờ 3 giây' });
  }
  lastTunnelToggle = now;

  if (isTunnelActive || tunnelProcess) {
    stopPublicTunnel();
    res.json({ status: 'stopped', isPublic: false });
  } else {
    startPublicTunnel();
    res.json({ status: 'starting', isPublic: true });
  }
});

app.get('/api/tunnel/status', (req, res) => {
  res.json({
    isPublic: isTunnelActive,
    joinUrl: currentJoinUrl,
    tunnelDomain: currentTunnelDomain
  });
});

// ============================================================================
// API NHẬN DẠNG & QUẢN LÝ BỘ CÂU HỎI TỪ FILE (.XLSX / .DOCX)
// ============================================================================
app.post('/api/questions/parse-file', requireHostAuth, (req, res) => {
  try {
    const { fileBase64, filename } = req.body;
    if (!fileBase64 || !filename) {
      return res.status(400).json({ error: 'Thiếu dữ liệu file tải lên hoặc tên file.' });
    }

    const ext = path.extname(filename).toLowerCase();
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    let parsedQuestions = [];
    let fileTypeDetected = '';

    if (ext === '.xlsx' || ext === '.xls') {
      fileTypeDetected = 'Excel (' + ext + ')';
      parsedQuestions = parseXlsxBuffer(buffer);
    } else if (ext === '.docx') {
      fileTypeDetected = 'Word (.docx)';
      parsedQuestions = parseDocxBuffer(buffer);
    } else {
      return res.status(400).json({
        error: `Định dạng ${ext} không được hỗ trợ. Hệ thống hỗ trợ 2 loại file câu hỏi: Excel (.xlsx) và Word (.docx).`
      });
    }

    res.json({
      success: true,
      filename,
      fileType: fileTypeDetected,
      count: parsedQuestions.length,
      questions: parsedQuestions
    });
  } catch (err) {
    console.error('[Questions API] Lỗi nhận dạng file câu hỏi:', err.message);
    res.status(400).json({ error: err.message || 'Lỗi xử lý file câu hỏi.' });
  }
});

app.post('/api/questions/apply', requireHostAuth, (req, res) => {
  try {
    const { questions, mode } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Danh sách câu hỏi trống hoặc không hợp lệ.' });
    }

    if (mode === 'append') {
      const startId = QUESTIONS.length;
      questions.forEach((q, i) => {
        q.id = startId + i + 1;
        q.que_so = q.que_so || `Quẻ #${q.id}`;
        QUESTIONS.push(q);
      });
    } else {
      // Mặc định thay thế toàn bộ
      questions.forEach((q, i) => {
        q.id = i + 1;
        q.que_so = q.que_so || `Quẻ #${i + 1}`;
      });
      QUESTIONS = questions;
    }

    quizState.totalQuestions = QUESTIONS.length;
    saveQuestionsToDisk(QUESTIONS);

    // Phát sóng đồng bộ thời gian thực sang toàn bộ máy người chơi & máy chủ
    io.emit('quiz:questions_list_updated', {
      totalQuestions: QUESTIONS.length,
      message: `Đã áp dụng ${QUESTIONS.length} câu hỏi mới!`
    });

    if (quizState.currentIndex >= 0 && quizState.currentIndex < QUESTIONS.length) {
      const q = QUESTIONS[quizState.currentIndex];
      io.emit('quiz:current_question_updated', {
        questionIndex: quizState.currentIndex,
        questionNumber: quizState.currentIndex + 1,
        totalQuestions: quizState.totalQuestions,
        queSo: q.que_so,
        chuDe: q.chu_de,
        cauHoi: q.cau_hoi,
        cacLuaChon: q.cac_lua_chon,
        timeLimit: quizState.timeLimit,
        remainingTime: quizState.remainingTime,
        correctAnswer: quizState.isRevealed ? q.dap_an_dung : null,
        loiGiai: quizState.isRevealed ? q.loi_giai : null
      });
    }

    res.json({ success: true, count: QUESTIONS.length, questions: QUESTIONS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions/shuffle', requireHostAuth, (req, res) => {
  try {
    const { shuffleQuestions = true, shuffleOptions = true } = req.body;
    QUESTIONS = shuffleQuestionsList(QUESTIONS, { shuffleQuestions, shuffleOptions });
    saveQuestionsToDisk(QUESTIONS);

    io.emit('quiz:questions_list_updated', {
      totalQuestions: QUESTIONS.length,
      message: 'Bộ câu hỏi đã được trộn ngẫu nhiên!'
    });

    if (quizState.currentIndex >= 0 && quizState.currentIndex < QUESTIONS.length) {
      const q = QUESTIONS[quizState.currentIndex];
      io.emit('quiz:current_question_updated', {
        questionIndex: quizState.currentIndex,
        questionNumber: quizState.currentIndex + 1,
        totalQuestions: quizState.totalQuestions,
        queSo: q.que_so,
        chuDe: q.chu_de,
        cauHoi: q.cau_hoi,
        cacLuaChon: q.cac_lua_chon,
        timeLimit: quizState.timeLimit,
        remainingTime: quizState.remainingTime,
        correctAnswer: quizState.isRevealed ? q.dap_an_dung : null,
        loiGiai: quizState.isRevealed ? q.loi_giai : null
      });
    }

    res.json({ success: true, count: QUESTIONS.length, questions: QUESTIONS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xuất bộ đề thi hiện tại ra file Excel (.xlsx)
app.get('/api/questions/export/xlsx', (req, res) => {
  try {
    const buffer = exportQuestionsToXlsxBuffer(QUESTIONS);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DeThi_KhaoNghiem_BuuSonKyHuong.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Lỗi xuất Excel:', err);
    res.status(500).send('Lỗi xuất file Excel: ' + err.message);
  }
});

// Xuất bộ đề thi hiện tại ra file Word (.docx)
app.get('/api/questions/export/docx', (req, res) => {
  try {
    const buffer = exportQuestionsToDocxBuffer(QUESTIONS);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="DeThi_KhaoNghiem_BuuSonKyHuong.docx"');
    res.send(buffer);
  } catch (err) {
    console.error('Lỗi xuất Word:', err);
    res.status(500).send('Lỗi xuất file Word: ' + err.message);
  }
});

// Điều hướng trang chủ: Nếu là Host trực tiếp hoặc có key thì mở Host; Nếu người chơi ngoài Internet thì tự động vào player.html
app.get('/', (req, res) => {
  const isLocal = isLocalRequest(req);
  const token = req.query.key || req.query.token;
  if (isLocal || token === HOST_SECRET) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(path.join(__dirname, 'public', 'host.html'));
  }
  res.redirect('/player.html');
});

// ============================================================================
// SOCKET.IO REALTIME (VỚI XÁC THỰC HOST & RATE LIMITING BẢO VỆ)
// ============================================================================
function verifyHostAuth(socket, data) {
  const host = (socket.handshake.headers.host || '').toLowerCase();
  const forwarded = socket.handshake.headers['x-forwarded-for'] || socket.handshake.headers['x-forwarded-proto'];
  const isDirectLocal = !forwarded && !host.includes('lhr.life') && !host.includes('.app') && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
  const token = data && (data.hostToken || data.token || data.key);
  if (isDirectLocal || (token && token === HOST_SECRET)) {
    socket.isHost = true;
    return true;
  }
  return false;
}

io.on('connection', (socket) => {
  // 1. Host khởi tạo (Yêu cầu xác thực quyền)
  socket.on('host:init', (data) => {
    if (!verifyHostAuth(socket, data)) {
      console.warn(`[Security] Socket ${socket.id} (${socket.handshake.address}) cố gắng truy cập quyền Host không hợp lệ.`);
      socket.emit('host:unauthorized', { message: 'Yêu cầu Host Token hợp lệ để điều khiển máy chủ.' });
      return;
    }
    socket.isHost = true;

    socket.emit('host:state', {
      status: gameState.status,
      duration: gameState.duration,
      remainingTime: gameState.remainingTime,
      isPaused: gameState.isPaused,
      formattedTime: formatTime(gameState.remainingTime),
      joinUrl: currentJoinUrl,
      qrDataUrl: currentQrDataUrl,
      isPublic: isTunnelActive,
      tunnelDomain: currentTunnelDomain,
      seats,
      totalOccupied: seats.filter(s => !!s.occupant).length,
      players: Array.from(gameState.players.values()),
      questions: QUESTIONS,
      quizState: {
        currentIndex: quizState.currentIndex,
        questionNumber: quizState.currentIndex + 1,
        totalQuestions: quizState.totalQuestions,
        timeLimit: quizState.timeLimit,
        remainingTime: quizState.remainingTime,
        isAcceptingAnswers: quizState.isAcceptingAnswers,
        isRevealed: quizState.isRevealed,
        currentQuestion: quizState.currentIndex >= 0 ? {
          queSo: QUESTIONS[quizState.currentIndex].que_so,
          chuDe: QUESTIONS[quizState.currentIndex].chu_de,
          cauHoi: QUESTIONS[quizState.currentIndex].cau_hoi,
          cacLuaChon: QUESTIONS[quizState.currentIndex].cac_lua_chon,
          correctAnswer: quizState.isRevealed ? QUESTIONS[quizState.currentIndex].dap_an_dung : null,
          loiGiai: quizState.isRevealed ? QUESTIONS[quizState.currentIndex].loi_giai : null
        } : null
      }
    });
  });

  // 2. Host bắt đầu khảo nghiệm (Bảo vệ quyền Host)
  socket.on('host:start', () => {
    if (!socket.isHost) return;
    startTimer();
    if (quizState.currentIndex === -1) {
      startQuestion(0);
    }
    io.emit('game:started', {
      duration: gameState.duration,
      remainingTime: gameState.remainingTime,
      formatted: formatTime(gameState.remainingTime)
    });
  });

  // 3. Host gia hạn thời gian (Bảo vệ quyền Host & Giới hạn biên 10s - 3600s)
  socket.on('host:add_time', (data) => {
    if (!socket.isHost) return;
    const addSecs = Math.max(10, Math.min(3600, parseInt(data.seconds) || 60));
    gameState.remainingTime += addSecs;
    gameState.duration += addSecs;

    io.emit('time:extended', {
      addedSeconds: addSecs,
      addedMinutes: Math.round(addSecs / 60),
      remainingTime: gameState.remainingTime,
      formatted: formatTime(gameState.remainingTime),
      notice: `Chủ tọa đã gia hạn thêm ${Math.round(addSecs / 60)} phút chiêm nghiệm!`
    });
  });

  // 4. Host tạm dừng / tiếp tục (Bảo vệ quyền Host)
  socket.on('host:toggle_pause', () => {
    if (!socket.isHost) return;
    gameState.isPaused = !gameState.isPaused;
    io.emit('game:pause_toggled', {
      isPaused: gameState.isPaused,
      notice: gameState.isPaused ? 'Chủ tọa tạm dừng thời khắc' : 'Tiếp tục thời khắc chiêm nghiệm'
    });
  });

  // 5. Host kết thúc sớm (Bảo vệ quyền Host)
  socket.on('host:end_game', () => {
    if (!socket.isHost) return;
    endGame('Chủ tọa tuyên bố hoàn tất khảo nghiệm');
  });

  // 6. Host thỉnh chuông (Bảo vệ quyền Host)
  socket.on('host:bell', () => {
    if (!socket.isHost) return;
    handleHostStrikeBell();
  });

  // 6b. Host chuyển hoặc quay lại câu hỏi (Trước / Kế tiếp / Chọn cụ thể)
  socket.on('host:goto_question', (data) => {
    if (!socket.isHost) return;
    let targetIdx = -1;
    if (typeof data.index === 'number') {
      targetIdx = data.index;
    } else if (data.direction === 'prev') {
      targetIdx = Math.max(0, (quizState.currentIndex >= 0 ? quizState.currentIndex - 1 : 0));
    } else if (data.direction === 'next') {
      targetIdx = quizState.currentIndex + 1;
    }

    if (targetIdx >= 0 && targetIdx < quizState.totalQuestions) {
      startQuestion(targetIdx);
    }
  });

  // 6c. Host chỉnh thời gian người chơi trả lời câu hỏi trực tiếp trong thời gian thực
  socket.on('host:adjust_question_time', (data) => {
    if (!socket.isHost) return;
    if (quizState.currentIndex < 0) return;

    let newSecs = quizState.remainingTime;
    if (typeof data.deltaSeconds === 'number') {
      newSecs += data.deltaSeconds;
    } else if (typeof data.setSeconds === 'number') {
      newSecs = data.setSeconds;
    }
    quizState.remainingTime = Math.max(3, Math.min(180, newSecs));
    if (data.setSeconds && data.setSeconds > quizState.timeLimit) {
      quizState.timeLimit = data.setSeconds;
    }

    // Tác động trực tiếp ngay lập tức lên máy chủ và toàn bộ máy người chơi
    io.emit('quiz:tick', {
      remainingTime: quizState.remainingTime,
      questionIndex: quizState.currentIndex,
      timeLimit: quizState.timeLimit
    });

    const noticeText = data.deltaSeconds 
      ? (data.deltaSeconds > 0 ? `Chủ tọa đã cộng thêm +${data.deltaSeconds}s trả lời!` : `Chủ tọa đã trừ ${Math.abs(data.deltaSeconds)}s!`)
      : `Thời gian câu hỏi được chỉnh còn ${quizState.remainingTime}s!`;

    io.emit('quiz:time_adjusted', {
      remainingTime: quizState.remainingTime,
      timeLimit: quizState.timeLimit,
      questionIndex: quizState.currentIndex,
      notice: noticeText
    });
  });

  // 6d. Host khởi động lại game từ đầu sau khi hoàn thành
  socket.on('host:restart_game', () => {
    if (!socket.isHost) return;
    restartGame();
  });

  // 6e. Host lấy danh sách câu hỏi để quản lý & soạn thảo
  socket.on('host:get_questions', () => {
    if (!socket.isHost) return;
    socket.emit('host:questions_data', { questions: QUESTIONS });
  });

  // 6f. Host lưu câu hỏi (chỉnh sửa nội dung, thay đổi đáp án hoặc tạo mới)
  socket.on('host:save_question', (data) => {
    if (!socket.isHost || !data || !data.question) return;
    const { index, question } = data;
    
    const cleanQ = {
      id: typeof question.id === 'number' ? question.id : QUESTIONS.length + 1,
      que_so: (question.que_so || 'Quẻ Đệ Nhất').trim(),
      chu_de: (question.chu_de || 'Giáo Lý').trim(),
      cau_hoi: (question.cau_hoi || '').trim(),
      cac_lua_chon: Array.isArray(question.cac_lua_chon) ? question.cac_lua_chon.map(c => (c || '').toString().trim()) : ['', '', '', ''],
      dap_an_dung: Math.max(0, Math.min(3, parseInt(question.dap_an_dung) || 0)),
      loi_giai: (question.loi_giai || '').trim()
    };

    let isNew = false;
    let targetIndex = index;
    if (typeof index === 'number' && index >= 0 && index < QUESTIONS.length) {
      cleanQ.id = QUESTIONS[index].id || (index + 1);
      QUESTIONS[index] = cleanQ;
    } else {
      isNew = true;
      cleanQ.id = QUESTIONS.length + 1;
      QUESTIONS.push(cleanQ);
      targetIndex = QUESTIONS.length - 1;
    }

    quizState.totalQuestions = QUESTIONS.length;
    saveQuestionsToDisk(QUESTIONS);

    socket.emit('host:save_question_success', {
      message: isNew ? '✅ Đã thêm câu hỏi mới thành công!' : '✅ Đã lưu và cập nhật câu hỏi thành công!',
      index: targetIndex,
      questions: QUESTIONS
    });

    // Phát sóng cập nhật tổng số câu tới tất cả người chơi & máy chủ
    io.emit('quiz:questions_list_updated', {
      totalQuestions: QUESTIONS.length
    });

    // Nếu sửa trúng câu đang hiển thị trực tiếp trên màn hình khảo nghiệm
    if (quizState.currentIndex === targetIndex) {
      io.emit('quiz:current_question_updated', {
        questionIndex: quizState.currentIndex,
        questionNumber: quizState.currentIndex + 1,
        totalQuestions: quizState.totalQuestions,
        queSo: cleanQ.que_so,
        chuDe: cleanQ.chu_de,
        cauHoi: cleanQ.cau_hoi,
        cacLuaChon: cleanQ.cac_lua_chon,
        timeLimit: quizState.timeLimit,
        remainingTime: quizState.remainingTime,
        correctAnswer: quizState.isRevealed ? cleanQ.dap_an_dung : null,
        loiGiai: quizState.isRevealed ? cleanQ.loi_giai : null
      });
    }
  });

  // 6g. Host xóa câu hỏi
  socket.on('host:delete_question', (data) => {
    if (!socket.isHost || !data || typeof data.index !== 'number') return;
    if (QUESTIONS.length <= 1) {
      socket.emit('host:question_error', { message: 'Cần duy trì tối thiểu 1 câu hỏi trong hệ thống!' });
      return;
    }
    const idx = data.index;
    if (idx >= 0 && idx < QUESTIONS.length) {
      QUESTIONS.splice(idx, 1);
      QUESTIONS.forEach((q, i) => { q.id = i + 1; });
      quizState.totalQuestions = QUESTIONS.length;
      saveQuestionsToDisk(QUESTIONS);

      socket.emit('host:save_question_success', {
        message: '🗑️ Đã xóa câu hỏi thành công!',
        index: Math.min(idx, QUESTIONS.length - 1),
        questions: QUESTIONS
      });

      io.emit('quiz:questions_list_updated', {
        totalQuestions: QUESTIONS.length
      });
    }
  });

  // 6h. Host khôi phục bộ 12 câu gốc ban đầu
  socket.on('host:reset_questions', () => {
    if (!socket.isHost) return;
    QUESTIONS = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
    quizState.totalQuestions = QUESTIONS.length;
    saveQuestionsToDisk(QUESTIONS);

    socket.emit('host:save_question_success', {
      message: '🔄 Đã khôi phục 12 câu hỏi gốc của Đức Phật Thầy!',
      index: 0,
      questions: QUESTIONS
    });

    io.emit('quiz:questions_list_updated', {
      totalQuestions: QUESTIONS.length
    });

    if (quizState.currentIndex >= 0 && quizState.currentIndex < QUESTIONS.length) {
      const curQ = QUESTIONS[quizState.currentIndex];
      io.emit('quiz:current_question_updated', {
        questionIndex: quizState.currentIndex,
        questionNumber: quizState.currentIndex + 1,
        totalQuestions: quizState.totalQuestions,
        queSo: curQ.que_so,
        chuDe: curQ.chu_de,
        cauHoi: curQ.cau_hoi,
        cacLuaChon: curQ.cac_lua_chon,
        timeLimit: quizState.timeLimit,
        remainingTime: quizState.remainingTime,
        correctAnswer: quizState.isRevealed ? curQ.dap_an_dung : null,
        loiGiai: quizState.isRevealed ? curQ.loi_giai : null
      });
    }
  });

  // 6i. Host yêu cầu phân tích & nhận dạng file câu hỏi (.xlsx / .docx)
  socket.on('host:parse_file', (data) => {
    if (!socket.isHost) return;
    try {
      if (!data || !data.base64 || !data.filename) {
        socket.emit('host:file_parse_error', { message: 'Dữ liệu file không đầy đủ.' });
        return;
      }
      const ext = path.extname(data.filename).toLowerCase();
      const cleanBase64 = data.base64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      let parsed = [];
      let fileType = '';

      if (ext === '.xlsx' || ext === '.xls') {
        fileType = 'Excel (' + ext + ')';
        parsed = parseXlsxBuffer(buffer);
      } else if (ext === '.docx') {
        fileType = 'Word (.docx)';
        parsed = parseDocxBuffer(buffer);
      } else {
        socket.emit('host:file_parse_error', {
          message: `Định dạng ${ext} không được hỗ trợ. Vui lòng tải lên file Excel (.xlsx) hoặc Word (.docx).`
        });
        return;
      }

      socket.emit('host:file_parsed', {
        filename: data.filename,
        fileType,
        count: parsed.length,
        questions: parsed
      });
    } catch (err) {
      console.error('[Socket host:parse_file error]:', err.message);
      socket.emit('host:file_parse_error', { message: err.message || 'Không thể xử lý file.' });
    }
  });

  // 6j. Host bấm nút áp dụng thay đổi bộ câu hỏi hiện tại (Replace hoặc Append)
  socket.on('host:apply_imported_questions', (data) => {
    if (!socket.isHost) return;
    try {
      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        socket.emit('host:question_error', { message: 'Danh sách câu hỏi trống hoặc không hợp lệ.' });
        return;
      }

      const mode = data.mode || 'replace';
      if (mode === 'append') {
        const startId = QUESTIONS.length;
        data.questions.forEach((q, i) => {
          q.id = startId + i + 1;
          q.que_so = q.que_so || `Quẻ #${q.id}`;
          QUESTIONS.push(q);
        });
      } else {
        data.questions.forEach((q, i) => {
          q.id = i + 1;
          q.que_so = q.que_so || `Quẻ #${i + 1}`;
        });
        QUESTIONS = data.questions;
      }

      quizState.totalQuestions = QUESTIONS.length;
      saveQuestionsToDisk(QUESTIONS);

      socket.emit('host:apply_imported_success', {
        message: `✅ Đã áp dụng thành công ${QUESTIONS.length} câu hỏi mới!`,
        count: QUESTIONS.length,
        questions: QUESTIONS
      });

      // Phát sóng cập nhật đồng bộ tức thì sang toàn bộ máy người chơi
      io.emit('quiz:questions_list_updated', {
        totalQuestions: QUESTIONS.length,
        message: `Bộ đề thi đã cập nhật: ${QUESTIONS.length} câu khảo nghiệm.`
      });

      if (quizState.currentIndex >= 0 && quizState.currentIndex < QUESTIONS.length) {
        const curQ = QUESTIONS[quizState.currentIndex];
        io.emit('quiz:current_question_updated', {
          questionIndex: quizState.currentIndex,
          questionNumber: quizState.currentIndex + 1,
          totalQuestions: quizState.totalQuestions,
          queSo: curQ.que_so,
          chuDe: curQ.chu_de,
          cauHoi: curQ.cau_hoi,
          cacLuaChon: curQ.cac_lua_chon,
          timeLimit: quizState.timeLimit,
          remainingTime: quizState.remainingTime,
          correctAnswer: quizState.isRevealed ? curQ.dap_an_dung : null,
          loiGiai: quizState.isRevealed ? curQ.loi_giai : null
        });
      }
    } catch (err) {
      console.error('[Socket host:apply_imported_questions error]:', err.message);
      socket.emit('host:question_error', { message: err.message });
    }
  });

  // 6k. Host bấm nút trộn đề thi (Xáo trộn ngẫu nhiên câu hỏi & đảo thứ tự đáp án)
  socket.on('host:shuffle_questions', (data) => {
    if (!socket.isHost) return;
    try {
      const opts = {
        shuffleQuestions: data && data.shuffleQuestions !== undefined ? !!data.shuffleQuestions : true,
        shuffleOptions: data && data.shuffleOptions !== undefined ? !!data.shuffleOptions : true
      };

      QUESTIONS = shuffleQuestionsList(QUESTIONS, opts);
      saveQuestionsToDisk(QUESTIONS);

      socket.emit('host:shuffle_success', {
        message: '🔀 Đã trộn ngẫu nhiên toàn bộ câu hỏi và đáp án thành công!',
        count: QUESTIONS.length,
        questions: QUESTIONS
      });

      io.emit('quiz:questions_list_updated', {
        totalQuestions: QUESTIONS.length,
        message: 'Bộ câu hỏi đã được trộn ngẫu nhiên.'
      });

      if (quizState.currentIndex >= 0 && quizState.currentIndex < QUESTIONS.length) {
        const curQ = QUESTIONS[quizState.currentIndex];
        io.emit('quiz:current_question_updated', {
          questionIndex: quizState.currentIndex,
          questionNumber: quizState.currentIndex + 1,
          totalQuestions: quizState.totalQuestions,
          queSo: curQ.que_so,
          chuDe: curQ.chu_de,
          cauHoi: curQ.cau_hoi,
          cacLuaChon: curQ.cac_lua_chon,
          timeLimit: quizState.timeLimit,
          remainingTime: quizState.remainingTime,
          correctAnswer: quizState.isRevealed ? curQ.dap_an_dung : null,
          loiGiai: quizState.isRevealed ? curQ.loi_giai : null
        });
      }
    } catch (err) {
      console.error('[Socket host:shuffle_questions error]:', err.message);
      socket.emit('host:question_error', { message: err.message });
    }
  });

  // 7. Người chơi tham gia phòng (Lọc triệt để XSS & Giới hạn tối đa người chơi)
  socket.on('player:join', (data) => {
    if (gameState.players.has(socket.id)) return;
    if (gameState.players.size >= 200) {
      socket.emit('player:error', { message: 'Đạo tràng hiện đã đủ số lượng cư sĩ tham gia.' });
      return;
    }

    const rawName = (data && typeof data.name === 'string') ? data.name : '';
    // Lọc sạch thẻ HTML, ký tự nhúng mã độc
    const cleanedName = rawName.replace(/<[^>]*>?/gm, '').replace(/[<>"'&`\\/]/g, '').trim();
    const name = cleanedName.slice(0, 24) || `Cư Sĩ #${Math.floor(100 + Math.random() * 900)}`;

    const playerObj = {
      id: socket.id,
      name,
      x: 50, // Cửa chánh điện ở giữa đáy màn hình
      y: 92,
      vx: 0,
      vy: 0,
      isMoving: false,
      isSeated: false,
      seatId: null,
      score: 0,
      answeredCount: 0,
      correctCount: 0,
      avatarIndex: Math.floor(Math.random() * 6),
      lastMoveTime: 0,
      joinedAt: Date.now()
    };

    gameState.players.set(socket.id, playerObj);

    socket.emit('player:joined_success', {
      player: playerObj,
      seats,
      players: Array.from(gameState.players.values()),
      gameState: gameState.status,
      remainingTime: gameState.remainingTime,
      formattedTime: formatTime(gameState.remainingTime),
      quizState: {
        currentIndex: quizState.currentIndex,
        questionNumber: quizState.currentIndex + 1,
        totalQuestions: quizState.totalQuestions,
        timeLimit: quizState.timeLimit,
        remainingTime: quizState.remainingTime,
        isAcceptingAnswers: quizState.isAcceptingAnswers,
        isRevealed: quizState.isRevealed,
        currentQuestion: quizState.currentIndex >= 0 ? {
          queSo: QUESTIONS[quizState.currentIndex].que_so,
          chuDe: QUESTIONS[quizState.currentIndex].chu_de,
          cauHoi: QUESTIONS[quizState.currentIndex].cau_hoi,
          cacLuaChon: QUESTIONS[quizState.currentIndex].cac_lua_chon,
          correctAnswer: quizState.isRevealed ? QUESTIONS[quizState.currentIndex].dap_an_dung : null,
          loiGiai: quizState.isRevealed ? QUESTIONS[quizState.currentIndex].loi_giai : null
        } : null
      }
    });

    // Báo cho Host có cư sĩ mới bước qua cửa
    io.emit('host:player_joined', playerObj);
    io.emit('room:players_count', gameState.players.size);
  });

  // 8. NGƯỜI CHƠI DI CHUYỂN TỰ DO TRONG CHÁNH ĐIỆN (Rate limit 50ms & Tọa độ hợp lệ)
  socket.on('player:move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.isSeated) return;

    // Rate limiting di chuyển chống flood mạng
    const now = Date.now();
    if (player.lastMoveTime && now - player.lastMoveTime < 45) return;
    player.lastMoveTime = now;

    const rawX = parseFloat(data.x);
    const rawY = parseFloat(data.y);
    if (isNaN(rawX) || isNaN(rawY)) return;

    // Giới hạn tọa độ hợp lệ trong chánh điện (x: 4%..96%, y: 8%..94%)
    player.x = Math.max(4, Math.min(96, rawX));
    player.y = Math.max(8, Math.min(94, rawY));
    player.isMoving = !!data.isMoving;

    // Phát tọa độ cho Màn hình chính
    io.emit('player:moved', {
      id: socket.id,
      x: player.x,
      y: player.y,
      isMoving: player.isMoving
    });
  });

  // 9. NGƯỜI CHƠI CHỌN CHỖ NGỒI (1 trong 50 chỗ, kiểm tra phạm vi ID)
  socket.on('player:select_seat', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const seatId = parseInt(data.seatId);
    if (isNaN(seatId) || seatId < 1 || seatId > TOTAL_SEATS) return;
    const targetSeat = seats.find(s => s.id === seatId);

    if (!targetSeat) return;

    // Kiểm tra xem chiếu đã có người ngồi chưa
    if (targetSeat.occupant && targetSeat.occupant.id !== socket.id) {
      socket.emit('seat:rejected', { 
        seatId, 
        message: `Chiếu số #${seatId} đã được cư sĩ ${targetSeat.occupant.name} an vị trước! Vui lòng chọn chiếu khác.` 
      });
      return;
    }

    // Nếu người này đang ngồi chiếu khác thì giải phóng chiếu cũ
    if (player.seatId && player.seatId !== seatId) {
      const oldSeat = seats.find(s => s.id === player.seatId);
      if (oldSeat) {
        oldSeat.occupant = null;
        io.emit('seat:cleared', {
          seatId: oldSeat.id,
          playerId: player.id,
          totalOccupied: seats.filter(s => !!s.occupant).length
        });
      }
    }

    // Đăng ký chỗ ngồi mới
    targetSeat.occupant = { id: player.id, name: player.name };
    player.seatId = seatId;
    player.x = targetSeat.x;
    player.y = targetSeat.y;
    player.isSeated = true;
    player.isMoving = false;

    const totalOccupied = seats.filter(s => !!s.occupant).length;

    // Gửi xác nhận độc quyền cho người chơi này
    socket.emit('seat:assigned', {
      seatId: targetSeat.id,
      seatNumber: targetSeat.number,
      x: targetSeat.x,
      y: targetSeat.y
    });

    // Thông báo cho Màn hình chính và tất cả người chơi khác KHÓA ghế này lại ngay lập tức
    io.emit('seat:updated', {
      seatId: targetSeat.id,
      occupant: targetSeat.occupant,
      playerId: player.id,
      playerName: player.name,
      x: targetSeat.x,
      y: targetSeat.y,
      totalOccupied
    });
  });

  // 10. Người chơi đứng dậy đổi chỗ (trước khi bắt đầu)
  socket.on('player:stand_up', () => {
    const player = gameState.players.get(socket.id);
    if (!player || !player.isSeated) return;

    const oldSeatId = player.seatId;
    const oldSeat = seats.find(s => s.id === oldSeatId);
    if (oldSeat) oldSeat.occupant = null;

    player.isSeated = false;
    player.seatId = null;

    const totalOccupied = seats.filter(s => !!s.occupant).length;
    socket.emit('seat:released');
    io.emit('seat:cleared', { seatId: oldSeatId, playerId: player.id, totalOccupied });
  });

  // 11. Người chơi chắp tay lạy
  socket.on('player:kneel', () => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    io.emit('host:player_kneeling', {
      id: socket.id,
      name: player.name,
      seatId: player.seatId
    });
  });

  // 12. Người chơi nộp câu trả lời cho câu hỏi hiện tại
  const handleAnswerSubmit = (socketId, answerIdx) => {
    const player = gameState.players.get(socketId);
    if (!player || !player.isSeated) return;
    if (!quizState.isAcceptingAnswers) return;
    if (quizState.playerAnswers.has(socketId)) return; // Tránh nộp 2 lần

    const selectedOption = parseInt(answerIdx);
    if (isNaN(selectedOption) || selectedOption < 0 || selectedOption > 3) return;
    const q = QUESTIONS[quizState.currentIndex];
    if (!q) return;

    const isCorrect = (selectedOption === q.dap_an_dung);
    let pointsEarned = 0;

    if (isCorrect) {
      const speedBonus = Math.round((quizState.remainingTime / quizState.timeLimit) * 50);
      pointsEarned = 100 + speedBonus;
      player.score += pointsEarned;
      player.correctCount++;
    }

    player.answeredCount++;

    quizState.playerAnswers.set(socketId, {
      selectedOption,
      isCorrect,
      pointsEarned
    });

    // Gửi kết quả cho người chơi
    io.to(socketId).emit('quiz:your_result', {
      status: isCorrect ? 'CORRECT' : 'WRONG',
      selectedOption,
      isCorrect,
      pointsEarned,
      totalScore: player.score,
      correctAnswer: q.dap_an_dung,
      loiGiai: q.loi_giai
    });

    // Báo cho Host biết thống kê số người đã trả lời
    const seatedCount = Array.from(gameState.players.values()).filter(p => p.isSeated).length;
    io.emit('quiz:answered_stat', {
      answeredCount: quizState.playerAnswers.size,
      totalSeated: seatedCount
    });

    if (isCorrect) {
      io.emit('host:player_answered', {
        id: socketId,
        name: player.name,
        seatId: player.seatId,
        correct: true,
        pointsEarned,
        newScore: player.score,
        answeredCount: player.answeredCount
      });
    }
  };

  socket.on('player:submit_answer', (data) => {
    handleAnswerSubmit(socket.id, data.optionIndex);
  });

  socket.on('player:answer', (data) => {
    handleAnswerSubmit(socket.id, data.answerIdx !== undefined ? data.answerIdx : data.optionIndex);
  });

  // 13. Ngắt kết nối
  socket.on('disconnect', () => {
    if (gameState.players.has(socket.id)) {
      const p = gameState.players.get(socket.id);
      if (p.seatId) {
        const s = seats.find(item => item.id === p.seatId);
        if (s) s.occupant = null;
        const totalOccupied = seats.filter(item => !!item.occupant).length;
        io.emit('seat:cleared', { seatId: p.seatId, playerId: p.id, totalOccupied });
      }
      gameState.players.delete(socket.id);
      const totalOccupied = seats.filter(item => !!item.occupant).length;
      io.emit('host:player_left', { id: socket.id, name: p.name, totalOccupied });
      io.emit('room:players_count', gameState.players.size);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏮 CHÁNH ĐIỆN 50 CHỖ BỬU SƠN KỲ HƯƠNG ĐANG CHẠY!`);
  console.log(`🖥️  Màn hình chính (Host):   http://localhost:${PORT}`);
  console.log(`📱 Màn hình điện thoại (QR): http://${LOCAL_IP}:${PORT}/player.html`);
  console.log(`====================================================`);

  // Tự động kích hoạt Public HTTPS Tunnel cho phép quét QR tham gia từ Internet (4G/5G)
  startPublicTunnel();
});
