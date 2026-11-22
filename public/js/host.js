/**
 * LOGIC MÀN HÌNH CHÍNH (HOST) - ĐẠO TRÀNG 50 CHỖ BỬU SƠN KỲ HƯƠNG
 * Hiển thị 50 chiếu ngồi cố định, đồng bộ người chơi đi lại tự do & an vị quỳ lạy
 * Quản lý mã QR công khai (Internet 4G/5G), phóng to toàn màn hình & xuất poster A4
 */

const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 10000
});

// DOM
const qrBox = document.getElementById('qrBox');
const qrImage = document.getElementById('qrImage');
const qrLinkText = document.getElementById('qrLinkText');
const qrLiveBadge = document.getElementById('qrLiveBadge');
const playerCountVal = document.getElementById('playerCountVal');
const seatedCountVal = document.getElementById('seatedCountVal');
const seatsLayer = document.getElementById('seatsLayer');
const walkersLayer = document.getElementById('walkersLayer');
const timerDigits = document.getElementById('timerDigits');
const toastNotice = document.getElementById('toastNotice');

// Fullscreen QR Overlay DOM
const fullscreenQrOverlay = document.getElementById('fullscreenQrOverlay');
const btnCloseFullscreenQr = document.getElementById('btnCloseFullscreenQr');
const fullscreenQrImg = document.getElementById('fullscreenQrImg');
const fsQrLinkText = document.getElementById('fsQrLinkText');
const btnCopyFsLink = document.getElementById('btnCopyFsLink');
const btnDownloadPosterFs = document.getElementById('btnDownloadPosterFs');
const btnOpenQrManagerFromFs = document.getElementById('btnOpenQrManagerFromFs');

// QR Manager Modal DOM
const modalQrManager = document.getElementById('modalQrManager');
const btnCloseQrManager = document.getElementById('btnCloseQrManager');
const modalQrImg = document.getElementById('modalQrImg');
const qmStatusPill = document.getElementById('qmStatusPill');
const qmStatusText = document.getElementById('qmStatusText');
const btnOpenFullscreenFromModal = document.getElementById('btnOpenFullscreenFromModal');
const btnDownloadPosterModal = document.getElementById('btnDownloadPosterModal');
const btnToggleTunnel = document.getElementById('btnToggleTunnel');
const btnTunnelIcon = document.getElementById('btnTunnelIcon');
const btnTunnelText = document.getElementById('btnTunnelText');
const tunnelSpinner = document.getElementById('tunnelSpinner');
const inputCustomJoinUrl = document.getElementById('inputCustomJoinUrl');
const btnCopyJoinUrl = document.getElementById('btnCopyJoinUrl');
const btnApplyCustomUrl = document.getElementById('btnApplyCustomUrl');

// Buttons
const btnStartGame = document.getElementById('btnStartGame');
const btnEndGame = document.getElementById('btnEndGame');
const btnTogglePause = document.getElementById('btnTogglePause');
const btnHostBell = document.getElementById('btnHostBell');
const btnFullscreen = document.getElementById('btnFullscreen');
const extendButtons = document.querySelectorAll('.btn-extend-time');
const customMinutesInput = document.getElementById('customMinutesInput');
const btnApplyCustomTime = document.getElementById('btnApplyCustomTime');

// Quiz Board DOM
const hostProgressDigits = document.getElementById('hostProgressDigits');
const hostQuizCard = document.getElementById('hostQuizCard');
const hqProgressText = document.getElementById('hqProgressText');
const hqTopicText = document.getElementById('hqTopicText');
const hqTimerDigits = document.getElementById('hqTimerDigits');
const hqTimerBar = document.getElementById('hqTimerBar');
const hqQuestionText = document.getElementById('hqQuestionText');
const hqOptionsGrid = document.getElementById('hqOptionsGrid');
const hqExplanationWrap = document.getElementById('hqExplanationWrap');
const hqExplanationText = document.getElementById('hqExplanationText');
const hqStatusText = document.getElementById('hqStatusText');
const btnHqNextBell = document.getElementById('btnHqNextBell');

// Quiz Controls & Navigation DOM
const btnToggleQuizBoard = document.getElementById('btnToggleQuizBoard');
const btnToggleQuizDock = document.getElementById('btnToggleQuizDock');
const btnCloseHq = document.getElementById('btnCloseHq');
const btnHqMinimizeBottom = document.getElementById('btnHqMinimizeBottom');
const btnHqPrev = document.getElementById('btnHqPrev');
const btnHqNext = document.getElementById('btnHqNext');
const inputHqCustomSecs = document.getElementById('inputHqCustomSecs');
const btnApplyHqSecs = document.getElementById('btnApplyHqSecs');
const btnRestartGame = document.getElementById('btnRestartGame');

// Top 3 Floating Card DOM
const hostTop3Card = document.getElementById('hostTop3Card');
const btnCloseTop3Host = document.getElementById('btnCloseTop3Host');
const btnOpenTop3Host = document.getElementById('btnOpenTop3Host');
const btnOpenFullLeaderboard = document.getElementById('btnOpenFullLeaderboard');
const btnHostRestartFromTop3 = document.getElementById('btnHostRestartFromTop3');

const hostTop3Name1 = document.getElementById('hostTop3Name1');
const hostTop3Score1 = document.getElementById('hostTop3Score1');
const hostTop3Seat1 = document.getElementById('hostTop3Seat1');

const hostTop3Name2 = document.getElementById('hostTop3Name2');
const hostTop3Score2 = document.getElementById('hostTop3Score2');
const hostTop3Seat2 = document.getElementById('hostTop3Seat2');

const hostTop3Name3 = document.getElementById('hostTop3Name3');
const hostTop3Score3 = document.getElementById('hostTop3Score3');
const hostTop3Seat3 = document.getElementById('hostTop3Seat3');

// Leaderboard Modal
const modalLeaderboard = document.getElementById('modalLeaderboard');
const leaderboardTableBody = document.getElementById('leaderboardTableBody');
const btnPlayAgain = document.getElementById('btnPlayAgain');

// Question Manager Modal DOM
const btnOpenQuestionManager = document.getElementById('btnOpenQuestionManager');
const btnFloatingQuestionManager = document.getElementById('btnFloatingQuestionManager');
const btnTopQuestionManager = document.getElementById('btnTopQuestionManager');
const modalQuestionManager = document.getElementById('modalQuestionManager');
const btnCloseQuestionManager = document.getElementById('btnCloseQuestionManager');
const btnCancelQuestionEdit = document.getElementById('btnCancelQuestionEdit');
const btnAddNewQuestion = document.getElementById('btnAddNewQuestion');
const btnResetDefaultQuestions = document.getElementById('btnResetDefaultQuestions');
const btnSaveQuestion = document.getElementById('btnSaveQuestion');
const btnDeleteCurrentQuestion = document.getElementById('btnDeleteCurrentQuestion');
const qListTotal = document.getElementById('qListTotal');
const questionListItems = document.getElementById('questionListItems');
const qmmEditingTitle = document.getElementById('qmmEditingTitle');
const qmmActiveBadge = document.getElementById('qmmActiveBadge');

const inputQueSo = document.getElementById('inputQueSo');
const inputChuDe = document.getElementById('inputChuDe');
const inputCauHoi = document.getElementById('inputCauHoi');
const inputOpt0 = document.getElementById('inputOpt-0');
const inputOpt1 = document.getElementById('inputOpt-1');
const inputOpt2 = document.getElementById('inputOpt-2');
const inputOpt3 = document.getElementById('inputOpt-3');
const inputLoiGiai = document.getElementById('inputLoiGiai');

// Question Import & Shuffle DOM
const inputQuestionsFile = document.getElementById('inputQuestionsFile');
const btnQrImportFile = document.getElementById('btnQrImportFile');
const btnQrShuffle = document.getElementById('btnQrShuffle');
const btnFloatingImportFile = document.getElementById('btnFloatingImportFile');
const btnFloatingShuffle = document.getElementById('btnFloatingShuffle');

const btnModalImportFile = document.getElementById('btnModalImportFile');
const btnModalShuffle = document.getElementById('btnModalShuffle');
const btnModalOpenQuestionManager = document.getElementById('btnModalOpenQuestionManager');
const qmDropZone = document.getElementById('qmDropZone');

const btnManagerImportFile = document.getElementById('btnManagerImportFile');
const btnManagerShuffle = document.getElementById('btnManagerShuffle');

// 2 Tính năng đặc biệt trong Modal Quản lý QR dành cho Ban Tổ Chức
// Tính năng 1: Đề thi hiện tại & Xuất file
const btnExportDocx = document.getElementById('btnExportDocx');
const btnExportXlsx = document.getElementById('btnExportXlsx');
const btnQmShuffleFeature = document.getElementById('btnQmShuffleFeature');
const btnToggleCurrentQuestions = document.getElementById('btnToggleCurrentQuestions');
const qmCurrentQuestionsWrap = document.getElementById('qmCurrentQuestionsWrap');
const qmCurrentQuestionsCount = document.getElementById('qmCurrentQuestionsCount');
const qmCurrentQuestionsList = document.getElementById('qmCurrentQuestionsList');

// Tính năng 2: Nhập file câu hỏi & tự tìm đáp án đúng
const btnQmUploadFile = document.getElementById('btnQmUploadFile');
const qmUploadDropZone = document.getElementById('qmUploadDropZone');
const qmImportResultBox = document.getElementById('qmImportResultBox');
const qmIrFileName = document.getElementById('qmIrFileName');
const qmIrFileType = document.getElementById('qmIrFileType');
const qmIrCount = document.getElementById('qmIrCount');
const qmIrPreviewList = document.getElementById('qmIrPreviewList');
const btnApplyImportedQuestionsInline = document.getElementById('btnApplyImportedQuestionsInline');

// Import Preview Modal DOM
const modalImportPreview = document.getElementById('modalImportPreview');
const btnCloseImportPreview = document.getElementById('btnCloseImportPreview');
const btnCancelImport = document.getElementById('btnCancelImport');
const btnApplyImportedQuestions = document.getElementById('btnApplyImportedQuestions');
const importFileName = document.getElementById('importFileName');
const importFileType = document.getElementById('importFileType');
const importQuestionCount = document.getElementById('importQuestionCount');
const importPreviewList = document.getElementById('importPreviewList');

// Shuffle Modal DOM
const modalShuffleConfirm = document.getElementById('modalShuffleConfirm');
const btnCloseShuffleModal = document.getElementById('btnCloseShuffleModal');
const btnCancelShuffle = document.getElementById('btnCancelShuffle');
const btnConfirmShuffle = document.getElementById('btnConfirmShuffle');
const chkShuffleQuestions = document.getElementById('chkShuffleQuestions');
const chkShuffleOptions = document.getElementById('chkShuffleOptions');

// Local Data
const seatsMap = new Map();
const playersMap = new Map();
let currentJoinUrl = '';
let currentQrDataUrl = '';
let isPublicTunnel = false;
let questionsData = [];
let editingQuestionIndex = 0;
let currentActiveQuestionIdx = -1;
let pendingImportedQuestions = [];

// Host Token xác thực quyền quản trị
const urlParams = new URLSearchParams(window.location.search);
const hostKey = urlParams.get('key') || urlParams.get('token') || localStorage.getItem('buuson_host_key') || 'buusonkyhuong2026';
if (urlParams.get('key') || urlParams.get('token')) {
  localStorage.setItem('buuson_host_key', hostKey);
}

// 1. Khởi tạo Host
async function initHost() {
  try {
    const res = await fetch('/api/room-info');
    const data = await res.json();
    updateQrUI(data);
  } catch (err) {
    console.error('Lỗi lấy room-info:', err);
  }
  socket.emit('host:init', { hostToken: hostKey });
}

socket.on('host:unauthorized', (data) => {
  showToast('⚠️ Cảnh báo: ' + (data.message || 'Không có quyền quản trị máy chủ'));
});

function updateQrUI(data) {
  if (data.joinUrl) currentJoinUrl = data.joinUrl;
  if (data.qrDataUrl) currentQrDataUrl = data.qrDataUrl;
  if (data.isPublic !== undefined) isPublicTunnel = !!data.isPublic;

  if (qrImage && currentQrDataUrl) qrImage.src = currentQrDataUrl;
  if (qrLinkText && currentJoinUrl) qrLinkText.textContent = currentJoinUrl;

  if (fullscreenQrImg && currentQrDataUrl) fullscreenQrImg.src = currentQrDataUrl;
  if (fsQrLinkText && currentJoinUrl) fsQrLinkText.textContent = currentJoinUrl;

  if (modalQrImg && currentQrDataUrl) modalQrImg.src = currentQrDataUrl;
  if (inputCustomJoinUrl && currentJoinUrl) inputCustomJoinUrl.value = currentJoinUrl;

  // Cập nhật nhãn trạng thái (Public 4G/5G vs Local Wi-Fi)
  if (qrLiveBadge) {
    if (isPublicTunnel) {
      qrLiveBadge.className = 'qr-live-badge public';
      qrLiveBadge.textContent = '🌐 4G/5G';
      qrLiveBadge.title = 'Đang hoạt động toàn cầu trên Internet';
    } else {
      qrLiveBadge.className = 'qr-live-badge local';
      qrLiveBadge.textContent = 'LAN Wi-Fi';
      qrLiveBadge.title = 'Đang chạy mạng nội bộ';
    }
  }

  if (qmStatusPill && qmStatusText) {
    if (isPublicTunnel) {
      qmStatusPill.className = 'qm-status-pill public';
      qmStatusText.textContent = '🌐 Mạng Toàn Cầu (Internet 4G/5G HTTPS)';
    } else {
      qmStatusPill.className = 'qm-status-pill local';
      qmStatusText.textContent = '🏠 Mạng Nội Bộ (LAN Wi-Fi)';
    }
  }

  if (btnToggleTunnel && btnTunnelIcon && btnTunnelText) {
    if (isPublicTunnel) {
      btnToggleTunnel.classList.add('active');
      btnTunnelIcon.textContent = '🛑';
      btnTunnelText.textContent = 'Tắt Kết Nối Toàn Cầu';
    } else {
      btnToggleTunnel.classList.remove('active');
      btnTunnelIcon.textContent = '🚀';
      btnTunnelText.textContent = 'Bật Mạng Toàn Cầu (Public HTTPS)';
    }
  }
}

// 2. Vẽ 50 Chiếu Ngồi Lên Sàn Chánh Điện
function render50Seats(seatsList) {
  seatsLayer.innerHTML = '';
  seatsMap.clear();

  let occupiedCount = 0;

  seatsList.forEach(seat => {
    seatsMap.set(seat.id, seat);
    if (seat.occupant) occupiedCount++;

    const el = document.createElement('div');
    el.id = `seat-spot-${seat.id}`;
    el.className = 'seat-spot' + (seat.occupant ? ' occupied' : '');
    el.style.left = `${seat.x}%`;
    el.style.top = `${seat.y}%`;
    el.title = seat.occupant ? `Chiếu #${seat.number} - Đã an vị: ${seat.occupant.name}` : `Chiếu #${seat.number} - Còn trống`;

    el.innerHTML = `
      <span class="seat-number">#${seat.number < 10 ? '0' + seat.number : seat.number}</span>
    `;

    seatsLayer.appendChild(el);
  });

  if (seatedCountVal) seatedCountVal.textContent = occupiedCount;
}

// 3. Tạo Avatar Cư Sĩ Đi Lại (Áo Bà Ba Đen + Khăn Rằn)
function createWalkerElement(player) {
  const div = document.createElement('div');
  div.id = `walker-${player.id}`;
  div.className = 'devotee-walker' + (player.isSeated ? ' seated' : '');
  div.style.left = `${player.x}%`;
  div.style.top = `${player.y}%`;

  const scarfs = ['#ffffff', '#ded2bc', '#caa872'];
  const scarfColor = scarfs[player.avatarIndex % scarfs.length];

  div.innerHTML = `
    <div class="devotee-tag" id="tag-${player.id}">
      <span class="w-name">${escapeHTML(player.name)}</span>
      <span class="w-merit" id="merit-${player.id}" style="color: #ffd700; margin-left: 4px;">${player.score || 0}đ</span>
    </div>

    <!-- SVG Cư Sĩ Áo Bà Ba Đen Truyền Thống -->
    <svg class="devotee-avatar-svg" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Đầu / Khăn quấn -->
      <circle cx="50" cy="22" r="13" fill="#1b120c" />
      <ellipse cx="50" cy="16" rx="10" ry="7" fill="#110a06" />

      <!-- Mặt -->
      <circle cx="45" cy="21" r="1.5" fill="#3a2211" />
      <circle cx="55" cy="21" r="1.5" fill="#3a2211" />
      <path d="M43 25 Q50 31 57 25" stroke="#4a301a" stroke-width="1.2" fill="none" />

      <!-- Khăn Rằn Nam Bộ sọc carô -->
      <path d="M37 34 Q50 40 63 34 L66 52 Q50 56 34 52 Z" fill="${scarfColor}" stroke="#222" stroke-width="1" stroke-dasharray="3,2" />

      <!-- Áo Bà Ba Đen -->
      <path d="M34 38 L22 72 Q50 78 78 72 L66 38 Q50 42 34 38 Z" fill="#181818" stroke="#000" stroke-width="1.5" />
      <circle cx="50" cy="46" r="1.5" fill="#d4af37" />
      <circle cx="50" cy="56" r="1.5" fill="#d4af37" />
      <circle cx="50" cy="66" r="1.5" fill="#d4af37" />

      <!-- Đôi Tay Chắp Lạy -->
      <path d="M24 70 Q34 60 46 54 L46 48 L54 48 L54 54 Q66 60 76 70" stroke="#161616" stroke-width="7" stroke-linecap="round" fill="none" />
      <path d="M47 50 C47 44, 53 44, 53 50 Z" fill="#d9b693" stroke="#8c5828" stroke-width="1" />

      <!-- Hai chân bước đi (ẩn khi ngồi) -->
      <g class="legs-group">
        <rect x="36" y="73" width="9" height="24" rx="4" fill="#1c1c1c" />
        <rect x="55" y="73" width="9" height="24" rx="4" fill="#1c1c1c" />
        <!-- Guốc mộc / dép cao su -->
        <ellipse cx="40" cy="98" rx="6" ry="3" fill="#3e2716" />
        <ellipse cx="60" cy="98" rx="6" ry="3" fill="#3e2716" />
      </g>
    </svg>
  `;

  return div;
}

// 4. Xử Lý Các Sự Kiện Socket.io
socket.on('host:state', (data) => {
  timerDigits.textContent = data.formattedTime || '07:00';
  render50Seats(data.seats || []);

  if (data.joinUrl || data.qrDataUrl) {
    updateQrUI(data);
  }

  walkersLayer.innerHTML = '';
  playersMap.clear();

  data.players.forEach(p => {
    playersMap.set(p.id, p);
    walkersLayer.appendChild(createWalkerElement(p));
  });

  playerCountVal.textContent = playersMap.size;
  if (seatedCountVal) {
    seatedCountVal.textContent = data.totalOccupied !== undefined ? data.totalOccupied : (data.seats || []).filter(s => !!s.occupant).length;
  }

  // Khởi tạo hoặc cập nhật danh sách câu hỏi
  if (data.questions && Array.isArray(data.questions)) {
    questionsData = data.questions;
    renderQuestionList();
    if (typeof renderQmCurrentQuestions === 'function') {
      renderQmCurrentQuestions(questionsData);
    }
  }

  // Khôi phục trạng thái câu hỏi nếu đang diễn ra
  if (data.quizState) {
    if (data.quizState.currentIndex >= 0 && data.quizState.currentQuestion) {
      renderHostQuestion({
        questionNumber: data.quizState.questionNumber,
        totalQuestions: data.quizState.totalQuestions,
        queSo: data.quizState.currentQuestion.queSo,
        chuDe: data.quizState.currentQuestion.chuDe,
        cauHoi: data.quizState.currentQuestion.cauHoi,
        cacLuaChon: data.quizState.currentQuestion.cacLuaChon,
        timeLimit: data.quizState.timeLimit,
        remainingTime: data.quizState.remainingTime
      });

      if (data.quizState.isRevealed) {
        handleAnswerRevealedUI({
          correctAnswer: data.quizState.currentQuestion.correctAnswer,
          loiGiai: data.quizState.currentQuestion.loiGiai,
          hasNextQuestion: data.quizState.currentIndex + 1 < data.quizState.totalQuestions,
          nextQuestionNumber: data.quizState.currentIndex + 2,
          totalQuestions: data.quizState.totalQuestions
        });
      }
    } else if (data.quizState.totalQuestions && hostProgressDigits) {
      hostProgressDigits.textContent = `0 / ${data.quizState.totalQuestions}`;
    }
  }

  if (data.status === 'PLAYING') {
    btnStartGame.style.display = 'none';
    btnEndGame.style.display = 'inline-flex';
  }
});

// Có người chơi mới bước vào cửa
socket.on('host:player_joined', (player) => {
  if (!playersMap.has(player.id)) {
    playersMap.set(player.id, player);
    walkersLayer.appendChild(createWalkerElement(player));
    playerCountVal.textContent = playersMap.size;
    window.zenAudio.playSingingBowl(330, 1.2);
  }
});

// Người chơi rời phòng
socket.on('host:player_left', (data) => {
  playersMap.delete(data.id);
  const el = document.getElementById(`walker-${data.id}`);
  if (el) el.remove();
  playerCountVal.textContent = playersMap.size;
  if (data.totalOccupied !== undefined && seatedCountVal) {
    seatedCountVal.textContent = data.totalOccupied;
  }
});

// Người chơi DI CHUYỂN TRONG CHÁNH ĐIỆN (Cập nhật tọa độ mượt mà)
socket.on('player:moved', (data) => {
  const el = document.getElementById(`walker-${data.id}`);
  if (el) {
    el.style.left = `${data.x}%`;
    el.style.top = `${data.y}%`;

    if (data.isMoving) {
      el.classList.add('walking');
    } else {
      el.classList.remove('walking');
    }
  }
});

// Người chơi AN VỊ VÀO 1 TRONG 50 CHIẾU (Khóa ghế)
socket.on('seat:updated', (data) => {
  // Cập nhật giao diện chiếu
  const seatEl = document.getElementById(`seat-spot-${data.seatId}`);
  if (seatEl) {
    seatEl.classList.add('occupied');
    seatEl.title = `Chiếu #${data.seatId} - Đã an vị: ${data.playerName || (data.occupant && data.occupant.name) || ''}`;
  }

  const s = seatsMap.get(data.seatId);
  if (s) s.occupant = data.occupant;

  if (data.totalOccupied !== undefined && seatedCountVal) {
    seatedCountVal.textContent = data.totalOccupied;
  }

  // Chuyển nhân vật sang trạng thái ngồi quỳ an vị trên chiếu
  const walkerEl = document.getElementById(`walker-${data.playerId}`);
  if (walkerEl) {
    walkerEl.classList.remove('walking');
    walkerEl.classList.add('seated');
    walkerEl.style.left = `${data.x}%`;
    walkerEl.style.top = `${data.y}%`;

    // Chuông mõ gõ nhịp an vị
    window.zenAudio.playWoodBlock();
  }

  const name = data.playerName || (data.occupant && data.occupant.name) || 'Cư sĩ';
  showToastNotice(`Cư sĩ ${name} đã an vị tại Chiếu số #${data.seatId}`);
});

// Người chơi đứng dậy đổi chỗ
socket.on('seat:cleared', (data) => {
  const seatEl = document.getElementById(`seat-spot-${data.seatId}`);
  if (seatEl) {
    seatEl.classList.remove('occupied');
    seatEl.title = `Chiếu #${data.seatId} - Còn trống`;
  }

  const s = seatsMap.get(data.seatId);
  if (s) s.occupant = null;

  if (data.totalOccupied !== undefined && seatedCountVal) {
    seatedCountVal.textContent = data.totalOccupied;
  }

  const walkerEl = document.getElementById(`walker-${data.playerId}`);
  if (walkerEl) {
    walkerEl.classList.remove('seated');
  }
});

// Người chơi chắp tay lạy
socket.on('host:player_kneeling', (data) => {
  const el = document.getElementById(`walker-${data.id}`);
  if (el) {
    el.classList.add('bowing');
    setTimeout(() => el.classList.remove('bowing'), 1300);
  }
});

// Người chơi trả lời câu hỏi tích đức
socket.on('host:player_answered', (data) => {
  const p = playersMap.get(data.id);
  if (p) {
    p.score = data.newScore;
    const meritEl = document.getElementById(`merit-${data.id}`);
    if (meritEl) meritEl.textContent = `${data.newScore}đ`;
  }

  const el = document.getElementById(`walker-${data.id}`);
  if (el && data.correct) {
    el.classList.add('bowing');
    setTimeout(() => el.classList.remove('bowing'), 1300);

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-merit';
    floatEl.textContent = `+${data.pointsEarned} Công Đức`;
    el.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1800);

    window.zenAudio.playSingingBowl(520, 1.0);
  }
});

// Người chơi ngắt kết nối
socket.on('host:player_left', (data) => {
  playersMap.delete(data.id);
  const el = document.getElementById(`walker-${data.id}`);
  if (el) el.remove();
  playerCountVal.textContent = playersMap.size;
});

// Đồng hồ nhịp giây
socket.on('game:tick', (data) => {
  timerDigits.textContent = data.formatted;
});

// GIA HẠN THỜI GIAN
socket.on('time:extended', (data) => {
  timerDigits.textContent = data.formatted;
  showToast(data.notice);
  window.zenAudio.playTempleBell(280);
});

socket.on('game:pause_toggled', (data) => {
  btnTogglePause.textContent = data.isPaused ? '▶ Tiếp Tục' : '⏸ Tạm Dừng';
  showToast(data.notice);
});

socket.on('game:started', (data) => {
  timerDigits.textContent = data.formatted;
  btnStartGame.style.display = 'none';
  btnEndGame.style.display = 'inline-flex';
  showToast('Đại Lễ Khảo Nghiệm Đã Bắt Đầu!');
  window.zenAudio.playTempleBell(220);
});

socket.on('game:over', (data) => {
  toggleQuizCard(false);
  modalLeaderboard.style.display = 'none';

  // Hiển thị Bảng Vàng Top 3 nổi trên màn hình
  renderTop3Card(data.top3 || []);
  if (hostTop3Card) hostTop3Card.style.display = 'block';
  if (btnOpenTop3Host) btnOpenTop3Host.style.display = 'inline-flex';
  if (btnRestartGame) btnRestartGame.style.display = 'inline-flex';

  // Gắn vương miện 👑 và huy chương 🥈🥉 cho 3 cư sĩ trên sàn Chánh Điện
  applyTop3FloorBadges(data.top3 || []);

  renderLeaderboard(data.leaderboard, data.top3);
  window.zenAudio.playTempleBell(180);
  window.zenAudio.playSuccessChime();
  showToast('🏮 Hoàn Mãn Khảo Nghiệm! Hãy quan sát Tam Vị Thủ Khoa trong Chánh Điện.');
});

socket.on('game:restarted', (data) => {
  if (hostTop3Card) hostTop3Card.style.display = 'none';
  if (modalLeaderboard) modalLeaderboard.style.display = 'none';
  toggleQuizCard(false);

  if (btnToggleQuizBoard) btnToggleQuizBoard.style.display = 'none';
  if (btnToggleQuizDock) btnToggleQuizDock.style.display = 'none';
  if (btnOpenTop3Host) btnOpenTop3Host.style.display = 'none';
  if (btnRestartGame) btnRestartGame.style.display = 'none';

  timerDigits.textContent = data.formattedTime || '07:00';
  if (btnStartGame) {
    btnStartGame.style.display = 'inline-flex';
    btnStartGame.textContent = '🔔 THỈNH CHUÔNG (CÂU 1/12)';
  }
  if (btnEndGame) btnEndGame.style.display = 'none';
  if (hostProgressDigits) hostProgressDigits.textContent = '0 / 12';

  // Xóa vương miện và đưa các avatar về lại ban đầu
  document.querySelectorAll('.devotee-walker').forEach(el => {
    el.classList.remove('top-1', 'top-2', 'top-3', 'seated');
  });

  render50Seats(data.seats || []);
  showToast(data.notice || 'Đã khởi động lại đạo tràng từ đầu thành công!');
});

socket.on('temple:bell', () => {
  window.zenAudio.playTempleBell(220);
});

// ============================================================================
// HỆ THỐNG HIỂN THỊ CÂU HỎI ĐỒNG BỘ TRÊN MÀN HÌNH HOST (QUIZ BOARD)
// ============================================================================
function toggleQuizCard(forceState) {
  if (!hostQuizCard) return;
  const isVisible = (hostQuizCard.style.display !== 'none');
  const targetState = (forceState !== undefined) ? forceState : !isVisible;
  hostQuizCard.style.display = targetState ? 'flex' : 'none';

  if (btnToggleQuizBoard) {
    btnToggleQuizBoard.style.display = 'inline-flex';
    btnToggleQuizBoard.textContent = targetState ? '👁️ Ẩn Bảng Câu Hỏi' : '📜 Hiện Bảng Câu Hỏi';
  }
  if (btnToggleQuizDock) {
    btnToggleQuizDock.style.display = 'inline-flex';
    btnToggleQuizDock.textContent = targetState ? '👁️ Ẩn Câu Hỏi' : '📜 Hiện Câu Hỏi';
  }
}

// Bật/tắt bảng câu hỏi từ các nút
if (btnCloseHq) btnCloseHq.addEventListener('click', () => toggleQuizCard(false));
if (btnHqMinimizeBottom) btnHqMinimizeBottom.addEventListener('click', () => toggleQuizCard(false));
if (btnToggleQuizBoard) btnToggleQuizBoard.addEventListener('click', () => toggleQuizCard());
if (btnToggleQuizDock) btnToggleQuizDock.addEventListener('click', () => toggleQuizCard());

// Chuyển hoặc Quay lại câu hỏi trước
if (btnHqPrev) {
  btnHqPrev.addEventListener('click', () => {
    socket.emit('host:goto_question', { direction: 'prev' });
  });
}

if (btnHqNext) {
  btnHqNext.addEventListener('click', () => {
    socket.emit('host:goto_question', { direction: 'next' });
  });
}

// Chỉnh nhanh thời gian trả lời câu hỏi trực tiếp (Tác động tức thì máy người chơi)
document.querySelectorAll('.btn-hq-time').forEach(btn => {
  btn.addEventListener('click', () => {
    const delta = parseInt(btn.dataset.delta);
    if (!isNaN(delta)) {
      socket.emit('host:adjust_question_time', { deltaSeconds: delta });
    }
  });
});

if (btnApplyHqSecs && inputHqCustomSecs) {
  btnApplyHqSecs.addEventListener('click', () => {
    const secs = parseInt(inputHqCustomSecs.value);
    if (secs && secs >= 3) {
      socket.emit('host:adjust_question_time', { setSeconds: secs });
    }
  });
}

socket.on('quiz:time_adjusted', (data) => {
  if (hqTimerDigits) hqTimerDigits.textContent = data.remainingTime;
  showToast(data.notice);
});

function renderHostQuestion(data) {
  if (!hostQuizCard) return;
  toggleQuizCard(true);

  currentActiveQuestionIdx = (data.questionNumber !== undefined) ? data.questionNumber - 1 : -1;
  if (qmmActiveBadge) {
    qmmActiveBadge.style.display = (editingQuestionIndex === currentActiveQuestionIdx) ? 'inline-block' : 'none';
  }

  if (hostProgressDigits) {
    hostProgressDigits.textContent = `${data.questionNumber} / ${data.totalQuestions}`;
  }
  if (hqProgressText) {
    hqProgressText.textContent = `CÂU ${data.questionNumber < 10 ? '0' + data.questionNumber : data.questionNumber} / ${data.totalQuestions}`;
  }
  if (hqTopicText) {
    hqTopicText.textContent = `${data.queSo || ''} • ${data.chuDe || ''}`;
  }
  if (hqQuestionText) {
    hqQuestionText.textContent = data.cauHoi;
  }
  if (hqTimerDigits) {
    hqTimerDigits.textContent = data.remainingTime !== undefined ? data.remainingTime : data.timeLimit;
  }
  if (inputHqCustomSecs) {
    inputHqCustomSecs.value = data.remainingTime !== undefined ? data.remainingTime : data.timeLimit;
  }
  if (hqTimerBar) {
    hqTimerBar.style.width = '100%';
  }
  if (hqExplanationWrap) {
    hqExplanationWrap.style.display = 'none';
  }
  if (btnHqNextBell) {
    btnHqNextBell.style.display = 'none';
  }
  if (hqStatusText) {
    hqStatusText.textContent = '⏳ Đang mở thời khắc cho các cư sĩ an vị chọn đáp án...';
  }

  // Cập nhật trạng thái nút Prev / Next
  if (btnHqPrev) {
    btnHqPrev.disabled = (data.questionNumber <= 1);
    btnHqPrev.style.opacity = (data.questionNumber <= 1) ? '0.4' : '1';
  }
  if (btnHqNext) {
    btnHqNext.disabled = (data.questionNumber >= data.totalQuestions);
    btnHqNext.style.opacity = (data.questionNumber >= data.totalQuestions) ? '0.4' : '1';
  }

  // Render 4 options A, B, C, D
  if (hqOptionsGrid) {
    hqOptionsGrid.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    data.cacLuaChon.forEach((optText, idx) => {
      const div = document.createElement('div');
      div.id = `hq-opt-${idx}`;
      div.className = 'hq-opt-item';
      div.innerHTML = `
        <span class="hq-opt-letter">${letters[idx]}</span>
        <span>${escapeHTML(optText)}</span>
      `;
      hqOptionsGrid.appendChild(div);
    });
  }

  // Cập nhật nhãn nút Thỉnh Chuông
  if (btnHostBell) {
    btnHostBell.textContent = `🔔 Thỉnh Chuông (Câu ${data.questionNumber}/${data.totalQuestions})`;
  }
  if (btnStartGame) {
    btnStartGame.style.display = 'none';
  }
  if (btnEndGame) {
    btnEndGame.style.display = 'inline-flex';
  }
}

// Bảng Vàng Top 3 Nổi
function renderTop3Card(top3) {
  if (top3 && top3[0]) {
    if (hostTop3Name1) hostTop3Name1.textContent = top3[0].name;
    if (hostTop3Score1) hostTop3Score1.textContent = `${top3[0].score}đ`;
    if (hostTop3Seat1) hostTop3Seat1.textContent = `Chiếu #${top3[0].seatId || '—'}`;
  } else {
    if (hostTop3Name1) hostTop3Name1.textContent = '—';
    if (hostTop3Score1) hostTop3Score1.textContent = '0đ';
  }

  if (top3 && top3[1]) {
    if (hostTop3Name2) hostTop3Name2.textContent = top3[1].name;
    if (hostTop3Score2) hostTop3Score2.textContent = `${top3[1].score}đ`;
    if (hostTop3Seat2) hostTop3Seat2.textContent = `Chiếu #${top3[1].seatId || '—'}`;
  } else {
    if (hostTop3Name2) hostTop3Name2.textContent = '—';
    if (hostTop3Score2) hostTop3Score2.textContent = '0đ';
  }

  if (top3 && top3[2]) {
    if (hostTop3Name3) hostTop3Name3.textContent = top3[2].name;
    if (hostTop3Score3) hostTop3Score3.textContent = `${top3[2].score}đ`;
    if (hostTop3Seat3) hostTop3Seat3.textContent = `Chiếu #${top3[2].seatId || '—'}`;
  } else {
    if (hostTop3Name3) hostTop3Name3.textContent = '—';
    if (hostTop3Score3) hostTop3Score3.textContent = '0đ';
  }
}

function applyTop3FloorBadges(top3) {
  // Xóa cũ
  document.querySelectorAll('.devotee-walker').forEach(el => {
    el.classList.remove('top-1', 'top-2', 'top-3');
  });

  if (top3 && top3[0]) {
    const el1 = document.getElementById(`walker-${top3[0].id}`);
    if (el1) el1.classList.add('top-1');
  }
  if (top3 && top3[1]) {
    const el2 = document.getElementById(`walker-${top3[1].id}`);
    if (el2) el2.classList.add('top-2');
  }
  if (top3 && top3[2]) {
    const el3 = document.getElementById(`walker-${top3[2].id}`);
    if (el3) el3.classList.add('top-3');
  }
}

if (btnCloseTop3Host) {
  btnCloseTop3Host.addEventListener('click', () => {
    if (hostTop3Card) hostTop3Card.style.display = 'none';
  });
}

if (btnOpenTop3Host) {
  btnOpenTop3Host.addEventListener('click', () => {
    if (hostTop3Card) hostTop3Card.style.display = 'block';
  });
}

if (btnOpenFullLeaderboard) {
  btnOpenFullLeaderboard.addEventListener('click', () => {
    if (modalLeaderboard) modalLeaderboard.style.display = 'flex';
  });
}

// Khởi động lại game từ đầu
function triggerHostRestart() {
  if (confirm('Bạn có chắc muốn KHỞI ĐỘNG LẠI GAME TỪ ĐẦU (đặt lại toàn bộ điểm và chiếu của người chơi) không?')) {
    socket.emit('host:restart_game');
  }
}

if (btnRestartGame) btnRestartGame.addEventListener('click', triggerHostRestart);
if (btnHostRestartFromTop3) btnHostRestartFromTop3.addEventListener('click', triggerHostRestart);

function handleAnswerRevealedUI(data) {
  if (hqTimerBar) hqTimerBar.style.width = '0%';
  if (hqTimerDigits) hqTimerDigits.textContent = '0';

  // Highlight đáp án đúng bằng màu xanh ngọc + vàng
  const correctEl = document.getElementById(`hq-opt-${data.correctAnswer}`);
  if (correctEl) {
    correctEl.classList.add('correct');
    const letterSpan = correctEl.querySelector('.hq-opt-letter');
    if (letterSpan && !letterSpan.textContent.includes('✓')) {
      letterSpan.textContent = '✓ ' + letterSpan.textContent;
    }
  }

  // Làm mờ các đáp án sai
  document.querySelectorAll('.hq-opt-item').forEach((item, idx) => {
    if (idx !== data.correctAnswer) item.classList.add('faded');
  });

  // Hiện lời giải nghĩa tâm linh của Đức Phật Thầy
  if (hqExplanationWrap && data.loiGiai) {
    if (hqExplanationText) hqExplanationText.textContent = data.loiGiai;
    hqExplanationWrap.style.display = 'block';
  }

  // Cập nhật trạng thái và nút Thỉnh Chuông sang câu tiếp
  if (data.hasNextQuestion) {
    if (hqStatusText) {
      hqStatusText.textContent = `🔔 Chủ tọa hãy gõ chuông để sang Câu ${data.nextQuestionNumber}/${data.totalQuestions}!`;
    }
    if (btnHqNextBell) {
      btnHqNextBell.textContent = `🔔 THỈNH CHUÔNG SANG CÂU ${data.nextQuestionNumber < 10 ? '0' + data.nextQuestionNumber : data.nextQuestionNumber} / ${data.totalQuestions} ➔`;
      btnHqNextBell.style.display = 'inline-block';
    }
    if (btnHostBell) {
      btnHostBell.textContent = `🔔 Thỉnh Chuông (Câu ${data.nextQuestionNumber}/${data.totalQuestions})`;
    }
  } else {
    if (hqStatusText) {
      hqStatusText.textContent = '🏮 Đã hoàn tất 12/12 câu! Hãy thỉnh chuông để xem Bảng Vàng Công Đức.';
    }
    if (btnHqNextBell) {
      btnHqNextBell.textContent = '🏆 THỈNH CHUÔNG XEM BẢNG VÀNG CÔNG ĐỨC ➔';
      btnHqNextBell.style.display = 'inline-block';
    }
    if (btnHostBell) {
      btnHostBell.textContent = '🏆 Thỉnh Chuông Bảng Vàng';
    }
  }
}

// Khi bắt đầu câu hỏi mới từ máy chủ
socket.on('quiz:question_started', (data) => {
  renderHostQuestion(data);
  window.zenAudio.playTempleBell(220);
});

// Đồng hồ câu hỏi đếm ngược
socket.on('quiz:tick', (data) => {
  if (hqTimerDigits) {
    hqTimerDigits.textContent = data.remainingTime;
  }
  if (hqTimerBar && data.timeLimit) {
    const pct = Math.max(0, (data.remainingTime / data.timeLimit) * 100);
    hqTimerBar.style.width = `${pct}%`;
  }
});

// Tự động công bố đáp án đúng khi hết thời gian
socket.on('quiz:answer_revealed', (data) => {
  handleAnswerRevealedUI(data);
});

// Thống kê cư sĩ đã nộp bài
socket.on('quiz:answered_stat', (data) => {
  if (hqStatusText && !document.querySelector('.hq-opt-item.correct')) {
    hqStatusText.textContent = `⏳ Đã có ${data.answeredCount}/${data.totalSeated} cư sĩ an vị nộp câu trả lời...`;
  }
});

if (btnHqNextBell) {
  btnHqNextBell.addEventListener('click', () => {
    window.zenAudio.init();
    socket.emit('host:bell');
  });
}

btnStartGame.addEventListener('click', () => {
  window.zenAudio.init();
  socket.emit('host:start');
});

btnEndGame.addEventListener('click', () => {
  if (confirm('Bạn có chắc muốn kết thúc sớm buổi khảo nghiệm không?')) {
    socket.emit('host:end_game');
  }
});

btnTogglePause.addEventListener('click', () => {
  socket.emit('host:toggle_pause');
});

// Interactive Chuông Bát Bowl on the Altar (SVG Game Element)
const interactiveBell = document.getElementById('interactiveBellGroup') || document.getElementById('interactiveBellBowl');
if (interactiveBell) {
  interactiveBell.addEventListener('click', () => {
    window.zenAudio.init();
    window.zenAudio.playTempleBell(220);
    socket.emit('host:bell');
    showToast('🔔 Đã thỉnh Chuông Bát Tam Bảo!');
  });
}

btnHostBell.addEventListener('click', () => {
  window.zenAudio.init();
  socket.emit('host:bell');
});

extendButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const seconds = parseInt(btn.dataset.seconds);
    socket.emit('host:add_time', { seconds });
  });
});

btnApplyCustomTime.addEventListener('click', () => {
  const mins = parseInt(customMinutesInput.value);
  if (mins && mins > 0) {
    socket.emit('host:add_time', { seconds: mins * 60 });
  }
});

btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

btnPlayAgain.addEventListener('click', () => {
  modalLeaderboard.style.display = 'none';
  socket.emit('host:start');
});

function showToast(msg) {
  toastNotice.textContent = msg;
  toastNotice.style.display = 'block';
  setTimeout(() => { toastNotice.style.display = 'none'; }, 2800);
}

function renderLeaderboard(list, top3) {
  if (top3 && top3[0]) {
    document.getElementById('podiumName1').textContent = top3[0].name;
    document.getElementById('podiumScore1').textContent = `${top3[0].score} Điểm`;
  }
  if (top3 && top3[1]) {
    document.getElementById('podiumName2').textContent = top3[1].name;
    document.getElementById('podiumScore2').textContent = `${top3[1].score} Điểm`;
  }
  if (top3 && top3[2]) {
    document.getElementById('podiumName3').textContent = top3[2].name;
    document.getElementById('podiumScore3').textContent = `${top3[2].score} Điểm`;
  }

  leaderboardTableBody.innerHTML = '';
  list.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #ebdcc5';
    tr.innerHTML = `
      <td style="padding: 6px; text-align: center; font-weight: 700;">#${idx + 1}</td>
      <td style="padding: 6px; font-weight: 600; color: #731313;">${escapeHTML(p.name)}</td>
      <td style="padding: 6px; text-align: center;">Chiếu #${p.seatId || '—'}</td>
      <td style="padding: 6px; text-align: right; font-weight: 700; color: #b81414;">${p.score}đ</td>
    `;
    leaderboardTableBody.appendChild(tr);
  });
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

// Lắng nghe cập nhật mã QR và trạng thái kết nối từ máy chủ
socket.on('room:qr_updated', (data) => {
  updateQrUI(data);
  showToast(data.isPublic ? '🌐 Đã chuyển sang mã QR mạng toàn cầu (4G/5G)!' : '🏠 Đã cập nhật mã QR phòng!');
});

// ============================================================================
// CÁC SỰ KIỆN QUẢN LÝ MÃ QR & TOÀN MÀN HÌNH
// ============================================================================
// 1. Mở Modal Quản Lý Mã QR khi nhấp vào hộp QR góc trên trái
if (qrBox) {
  qrBox.addEventListener('click', () => {
    openQrManagerModal();
  });
}

function openQrManagerModal() {
  if (modalQrManager) {
    modalQrManager.style.display = 'flex';
    if (typeof renderQmCurrentQuestions === 'function') {
      renderQmCurrentQuestions(questionsData);
    }
  }
}

function closeQrManagerModal() {
  if (modalQrManager) modalQrManager.style.display = 'none';
}

if (btnCloseQrManager) {
  btnCloseQrManager.addEventListener('click', closeQrManagerModal);
}

// 2. Mở / Đóng Toàn Màn Hình Chiếu Mã QR
function openFullscreenQr() {
  closeQrManagerModal();
  if (fullscreenQrOverlay) fullscreenQrOverlay.style.display = 'flex';
}

function closeFullscreenQr() {
  if (fullscreenQrOverlay) fullscreenQrOverlay.style.display = 'none';
}

if (btnOpenFullscreenFromModal) {
  btnOpenFullscreenFromModal.addEventListener('click', openFullscreenQr);
}

if (btnCloseFullscreenQr) {
  btnCloseFullscreenQr.addEventListener('click', closeFullscreenQr);
}

if (btnOpenQrManagerFromFs) {
  btnOpenQrManagerFromFs.addEventListener('click', () => {
    closeFullscreenQr();
    openQrManagerModal();
  });
}

// Bấm phím Escape để đóng nhanh
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFullscreenQr();
    closeQrManagerModal();
  }
});

// 3. Sao chép đường dẫn vào bộ nhớ tạm
async function copyJoinUrlToClipboard() {
  if (!currentJoinUrl) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(currentJoinUrl);
    } else {
      const ta = document.createElement('textarea');
      ta.value = currentJoinUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('📋 Đã sao chép link tham gia vào bộ nhớ tạm!');
  } catch (err) {
    showToast('Đường dẫn: ' + currentJoinUrl);
  }
}

if (btnCopyFsLink) btnCopyFsLink.addEventListener('click', copyJoinUrlToClipboard);
if (btnCopyJoinUrl) btnCopyJoinUrl.addEventListener('click', copyJoinUrlToClipboard);

// 4. Bật / Tắt Tunnel Public HTTPS
if (btnToggleTunnel) {
  btnToggleTunnel.addEventListener('click', async () => {
    if (tunnelSpinner) tunnelSpinner.style.display = 'flex';
    btnToggleTunnel.disabled = true;

    try {
      const res = await fetch('/api/tunnel/toggle', {
        method: 'POST',
        headers: { 'X-Host-Token': hostKey }
      });
      const data = await res.json();
      if (data.status === 'starting') {
        showToast('🚀 Đang khởi động đường truyền Internet toàn cầu...');
      } else {
        showToast('🏠 Đã tắt mạng toàn cầu, quay về mạng nội bộ.');
      }
    } catch (err) {
      console.error('Lỗi toggle tunnel:', err);
      showToast('Lỗi khi thay đổi trạng thái mạng.');
    } finally {
      setTimeout(() => {
        if (tunnelSpinner) tunnelSpinner.style.display = 'none';
        btnToggleTunnel.disabled = false;
      }, 1500);
    }
  });
}

// 5. Cập nhật đường dẫn tùy biến
if (btnApplyCustomUrl) {
  btnApplyCustomUrl.addEventListener('click', async () => {
    const url = (inputCustomJoinUrl.value || '').trim();
    if (!url) {
      alert('Vui lòng nhập đường dẫn hợp lệ!');
      return;
    }
    try {
      const res = await fetch('/api/set-join-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Host-Token': hostKey
        },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        updateQrUI(data);
        showToast('✅ Đã cập nhật mã QR theo đường dẫn mới!');
      } else if (data.error) {
        showToast('⚠️ ' + data.error);
      }
    } catch (err) {
      console.error('Lỗi apply url:', err);
      showToast('Lỗi cập nhật đường dẫn!');
    }
  });
}

function showToastNotice(msg) {
  showToast(msg);
}

// 6. XUẤT POSTER A4 CHUẨN IN ẤN (HD 1414 x 2000 px)
function downloadA4Poster() {
  if (!currentQrDataUrl) {
    alert('Chưa có mã QR để tạo poster!');
    return;
  }

  showToast('🎨 Đang kết xuất Poster A4 HD chất lượng cao...');

  const qrImg = new Image();
  qrImg.crossOrigin = 'anonymous';
  qrImg.onload = () => {
    const W = 1414;
    const H = 2000;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Nền gỗ sậm & giấy trúc chỉ cổ truyền
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#2d140b');
    bgGrad.addColorStop(0.3, '#1c0c06');
    bgGrad.addColorStop(0.7, '#1f0d07');
    bgGrad.addColorStop(1, '#0e0503');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Vầng hào quang đỏ tâm linh
    const glowGrad = ctx.createRadialGradient(W / 2, H * 0.43, 100, W / 2, H * 0.43, 750);
    glowGrad.addColorStop(0, 'rgba(163, 20, 20, 0.45)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // Khung viền thếp vàng kép
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, W - 108, H - 108);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(66, 66, W - 132, H - 132);

    // Tiêu đề
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 44px "Noto Serif", serif';
    ctx.fillText('🪷 🪷 🪷', W / 2, 135);

    ctx.fillStyle = '#f8e6c8';
    ctx.font = '600 32px "Cinzel", "Noto Serif", serif';
    ctx.fillText('ĐẠO TRÀNG CHIÊM BÁI NAM BỘ', W / 2, 195);

    ctx.fillStyle = '#ffd700';
    ctx.font = '900 68px "Cinzel", "Noto Serif", serif';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 24;
    ctx.fillText('BỬU SƠN KỲ HƯƠNG', W / 2, 285);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e8c99b';
    ctx.font = 'italic 34px "Noto Serif", serif';
    ctx.fillText('“Học Phật Tu Nhân • Tứ Ân Vẹn Giữ • Vấn Đạo Tích Đức”', W / 2, 350);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 280, 390);
    ctx.lineTo(W / 2 + 280, 390);
    ctx.stroke();

    // Khung QR
    const qrBoxSize = 780;
    const qrBoxX = (W - qrBoxSize) / 2;
    const qrBoxY = 430;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.strokeStyle = '#8b1414';
    ctx.lineWidth = 3;
    ctx.strokeRect(qrBoxX + 16, qrBoxY + 16, qrBoxSize - 32, qrBoxSize - 32);

    const qrInnerSize = 680;
    ctx.drawImage(qrImg, qrBoxX + (qrBoxSize - qrInnerSize) / 2, qrBoxY + (qrBoxSize - qrInnerSize) / 2, qrInnerSize, qrInnerSize);

    // Link Text
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(currentJoinUrl, W / 2, qrBoxY + qrBoxSize + 60);

    // Các bước hướng dẫn
    const stepBoxY = qrBoxY + qrBoxSize + 110;
    const steps = [
      '1. Mở Camera điện thoại hoặc Zalo quét mã QR trên',
      '2. Nhập Pháp Danh hoặc Họ Tên để bước vào Chánh Điện',
      '3. Chọn 1 trong 50 chiếu cói để an vị và tham gia vấn đạo'
    ];

    steps.forEach((text, i) => {
      const lineY = stepBoxY + i * 70;
      ctx.fillStyle = 'rgba(25, 12, 7, 0.85)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 460, lineY - 42, 920, 56, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#a31414';
      ctx.beginPath();
      ctx.arc(W / 2 - 425, lineY - 14, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 22px "Noto Serif", serif';
      ctx.textAlign = 'center';
      ctx.fillText((i + 1).toString(), W / 2 - 425, lineY - 6);

      ctx.fillStyle = '#ffeedd';
      ctx.font = '600 26px "Noto Serif", serif';
      ctx.textAlign = 'left';
      ctx.fillText(text.replace(/^[0-9]\.\s*/, ''), W / 2 - 390, lineY - 6);
    });

    // Chân trang Poster
    ctx.textAlign = 'center';
    ctx.fillStyle = '#caa88b';
    ctx.font = 'italic 24px "Noto Serif", serif';
    ctx.fillText('Đạo tràng khai hoang Nam Bộ • Tín ngưỡng Vô Vi • Chánh Điện 50 Chỗ', W / 2, H - 110);

    ctx.fillStyle = 'rgba(229, 184, 92, 0.6)';
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillText('BUU SON KY HUONG — PHẬT THẦY TÂY AN', W / 2, H - 75);

    // Kích hoạt tải ảnh về
    const link = document.createElement('a');
    link.download = 'Poster_Quet_Ma_Buu_Son_Ky_Huong.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ Đã xuất và tải Poster A4 HD thành công!');
  };
  qrImg.src = currentQrDataUrl;
}

if (btnDownloadPosterFs) btnDownloadPosterFs.addEventListener('click', downloadA4Poster);
if (btnDownloadPosterModal) btnDownloadPosterModal.addEventListener('click', downloadA4Poster);

// ============================================================================
// HỆ THỐNG SOẠN THẢO & QUẢN LÝ CÂU HỎI (QUESTION MANAGER & EDITOR)
// ============================================================================
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openQuestionManagerModal() {
  if (modalQuestionManager) {
    modalQuestionManager.style.display = 'flex';
    if (questionsData.length === 0) {
      socket.emit('host:get_questions');
    } else {
      renderQuestionList();
      selectQuestionToEdit(editingQuestionIndex);
    }
  }
}

function closeQuestionManagerModal() {
  if (modalQuestionManager) {
    modalQuestionManager.style.display = 'none';
  }
}

function getSelectedCorrectChoice() {
  const selected = document.querySelector('input[name="qmmCorrectChoice"]:checked');
  return selected ? parseInt(selected.value) : 0;
}

function setSelectedCorrectChoice(idx) {
  const radio = document.querySelector(`input[name="qmmCorrectChoice"][value="${idx}"]`);
  if (radio) radio.checked = true;
  updateCorrectChoiceHighlight(idx);
}

function updateCorrectChoiceHighlight(idx) {
  for (let i = 0; i < 4; i++) {
    const row = document.getElementById(`qmmOptRow-${i}`);
    const tag = document.getElementById(`qmmCorrectTag-${i}`);
    if (row) {
      if (i === idx) {
        row.classList.add('correct');
        if (tag) tag.style.display = 'inline-block';
      } else {
        row.classList.remove('correct');
        if (tag) tag.style.display = 'none';
      }
    }
  }
}

document.querySelectorAll('input[name="qmmCorrectChoice"]').forEach(r => {
  r.addEventListener('change', () => {
    updateCorrectChoiceHighlight(parseInt(r.value));
  });
});

function renderQuestionList() {
  if (!questionListItems) return;
  questionListItems.innerHTML = '';
  if (qListTotal) qListTotal.textContent = questionsData.length;

  questionsData.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'qmm-item-card' + (idx === editingQuestionIndex ? ' active' : '');
    card.id = `qmm-card-${idx}`;
    card.onclick = () => selectQuestionToEdit(idx);

    const letter = ['A', 'B', 'C', 'D'][q.dap_an_dung || 0] || 'A';
    card.innerHTML = `
      <div class="qmm-item-header">
        <span class="qmm-item-badge">#${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}</span>
        <span class="qmm-item-answer" title="Đáp án đúng: ${letter}">✓ Đáp án: ${letter}</span>
      </div>
      <div class="qmm-item-title">${escapeHtml(q.que_so || '')} • ${escapeHtml(q.chuDe || q.chu_de || '')}</div>
      <div class="qmm-item-snippet">${escapeHtml(q.cau_hoi || '')}</div>
    `;
    questionListItems.appendChild(card);
  });
}

function selectQuestionToEdit(index) {
  if (index < 0 || index >= questionsData.length) {
    if (questionsData.length > 0) index = 0;
    else return;
  }
  editingQuestionIndex = index;

  document.querySelectorAll('.qmm-item-card').forEach((c, i) => {
    c.classList.toggle('active', i === index);
  });

  const q = questionsData[index];
  if (!q) return;

  if (qmmEditingTitle) {
    qmmEditingTitle.textContent = `Chỉnh Sửa Câu Hỏi #${index + 1 < 10 ? '0' + (index + 1) : index + 1}`;
  }
  if (qmmActiveBadge) {
    qmmActiveBadge.style.display = (index === currentActiveQuestionIdx) ? 'inline-block' : 'none';
  }

  if (inputQueSo) inputQueSo.value = q.que_so || '';
  if (inputChuDe) inputChuDe.value = q.chu_de || q.chuDe || '';
  if (inputCauHoi) inputCauHoi.value = q.cau_hoi || '';

  const opts = q.cac_lua_chon || q.cacLuaChon || ['', '', '', ''];
  if (inputOpt0) inputOpt0.value = opts[0] || '';
  if (inputOpt1) inputOpt1.value = opts[1] || '';
  if (inputOpt2) inputOpt2.value = opts[2] || '';
  if (inputOpt3) inputOpt3.value = opts[3] || '';

  setSelectedCorrectChoice(q.dap_an_dung !== undefined ? q.dap_an_dung : 0);
  if (inputLoiGiai) inputLoiGiai.value = q.loi_giai || q.loiGiai || '';
}

function saveCurrentQuestionForm() {
  const queSo = inputQueSo ? inputQueSo.value.trim() : '';
  const chuDe = inputChuDe ? inputChuDe.value.trim() : '';
  const cauHoi = inputCauHoi ? inputCauHoi.value.trim() : '';
  const opt0 = inputOpt0 ? inputOpt0.value.trim() : '';
  const opt1 = inputOpt1 ? inputOpt1.value.trim() : '';
  const opt2 = inputOpt2 ? inputOpt2.value.trim() : '';
  const opt3 = inputOpt3 ? inputOpt3.value.trim() : '';
  const dapAnDung = getSelectedCorrectChoice();
  const loiGiai = inputLoiGiai ? inputLoiGiai.value.trim() : '';

  if (!cauHoi) {
    alert('Vui lòng nhập nội dung câu hỏi!');
    if (inputCauHoi) inputCauHoi.focus();
    return;
  }
  if (!opt0 || !opt1) {
    alert('Vui lòng nhập ít nhất lựa chọn A và B!');
    return;
  }

  const updatedQ = {
    id: (editingQuestionIndex >= 0 && questionsData[editingQuestionIndex]) ? questionsData[editingQuestionIndex].id : (editingQuestionIndex + 1),
    que_so: queSo || `Quẻ #${editingQuestionIndex + 1}`,
    chu_de: chuDe || 'Giáo Lý Bửu Sơn Kỳ Hương',
    cau_hoi: cauHoi,
    cac_lua_chon: [opt0, opt1, opt2, opt3],
    dap_an_dung: dapAnDung,
    loi_giai: loiGiai
  };

  socket.emit('host:save_question', {
    index: editingQuestionIndex,
    question: updatedQ
  });
}

function addNewQuestion() {
  const newIdx = questionsData.length;
  const newQ = {
    id: newIdx + 1,
    que_so: `Quẻ #${newIdx + 1}`,
    chu_de: 'Chủ Đề Khảo Nghiệm Mới',
    cau_hoi: 'Nhập nội dung câu hỏi mới tại đây...',
    cac_lua_chon: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
    dap_an_dung: 0,
    loi_giai: 'Lời giải nghĩa tâm linh của Đức Phật Thầy...'
  };

  socket.emit('host:save_question', {
    index: -1,
    question: newQ
  });
}

function deleteCurrentQuestion() {
  if (questionsData.length <= 1) {
    alert('Không thể xóa! Cần duy trì tối thiểu 1 câu hỏi.');
    return;
  }
  const q = questionsData[editingQuestionIndex];
  if (confirm(`Bạn có chắc muốn xóa vĩnh viễn Câu #${editingQuestionIndex + 1}: "${q ? q.que_so : ''}" không?`)) {
    socket.emit('host:delete_question', { index: editingQuestionIndex });
  }
}

function resetDefaultQuestions() {
  if (confirm('Bạn có chắc muốn KHÔI PHỤC BỘ 12 CÂU HỎI GỐC ban đầu của Đức Phật Thầy không? Toàn bộ câu hỏi tự tạo thêm sẽ được đặt lại.')) {
    socket.emit('host:reset_questions');
  }
}

// Event Listeners cho Question Manager
if (btnOpenQuestionManager) {
  btnOpenQuestionManager.addEventListener('click', (e) => {
    e.stopPropagation();
    openQuestionManagerModal();
  });
}
if (btnFloatingQuestionManager) {
  btnFloatingQuestionManager.addEventListener('click', (e) => {
    e.stopPropagation();
    openQuestionManagerModal();
  });
}
if (btnTopQuestionManager) {
  btnTopQuestionManager.addEventListener('click', () => openQuestionManagerModal());
}
if (btnCloseQuestionManager) {
  btnCloseQuestionManager.addEventListener('click', closeQuestionManagerModal);
}
if (btnCancelQuestionEdit) {
  btnCancelQuestionEdit.addEventListener('click', closeQuestionManagerModal);
}
if (btnSaveQuestion) {
  btnSaveQuestion.addEventListener('click', saveCurrentQuestionForm);
}
if (btnAddNewQuestion) {
  btnAddNewQuestion.addEventListener('click', addNewQuestion);
}
if (btnDeleteCurrentQuestion) {
  btnDeleteCurrentQuestion.addEventListener('click', deleteCurrentQuestion);
}
if (btnResetDefaultQuestions) {
  btnResetDefaultQuestions.addEventListener('click', resetDefaultQuestions);
}

// Socket response events
socket.on('host:questions_data', (data) => {
  if (data && data.questions) {
    questionsData = data.questions;
    renderQuestionList();
    selectQuestionToEdit(editingQuestionIndex);
  }
});

socket.on('host:save_question_success', (data) => {
  showToast(data.message || '✅ Đã lưu câu hỏi thành công!');
  if (data.questions) {
    questionsData = data.questions;
    renderQuestionList();
    if (typeof data.index === 'number') {
      selectQuestionToEdit(data.index);
    }
  }
});

socket.on('host:question_error', (data) => {
  showToast('⚠️ ' + (data.message || 'Lỗi thao tác câu hỏi'));
});

// ============================================================================
// LOGIC NHẬN CÂU HỎI TỪ FILE (.XLSX / .DOCX) & TRỘN ĐỀ THI (SHUFFLE)
// ============================================================================

function openImportPreviewModal() {
  if (modalImportPreview) modalImportPreview.style.display = 'flex';
}

function closeImportPreviewModal() {
  if (modalImportPreview) modalImportPreview.style.display = 'none';
}

function openShuffleModal() {
  if (modalShuffleConfirm) modalShuffleConfirm.style.display = 'flex';
}

function closeShuffleModal() {
  if (modalShuffleConfirm) modalShuffleConfirm.style.display = 'none';
}

function triggerFileInput(e) {
  if (e) e.stopPropagation();
  if (inputQuestionsFile) {
    inputQuestionsFile.value = '';
    inputQuestionsFile.click();
  }
}

function handleQuestionFile(file) {
  if (!file) return;
  const filename = file.name;
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.docx') {
    alert(`Định dạng "${ext}" không được hỗ trợ!\nVui lòng chọn file Excel (.xlsx) hoặc Word (.docx).`);
    return;
  }

  showToast(`⏳ Đang nhận dạng cấu trúc câu hỏi từ ${filename}...`);

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    socket.emit('host:parse_file', {
      filename,
      base64
    });
  };
  reader.onerror = function() {
    alert('Không thể đọc file đã chọn!');
  };
  reader.readAsDataURL(file);
}

// Lắng nghe chọn file từ input
if (inputQuestionsFile) {
  inputQuestionsFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleQuestionFile(e.target.files[0]);
    }
  });
}

// 1. Gắn sự kiện các nút "Nhận File" ở mọi vị trí
if (btnQrImportFile) {
  btnQrImportFile.addEventListener('click', triggerFileInput);
}
if (btnFloatingImportFile) {
  btnFloatingImportFile.addEventListener('click', triggerFileInput);
}
if (btnModalImportFile) {
  btnModalImportFile.addEventListener('click', triggerFileInput);
}
if (btnManagerImportFile) {
  btnManagerImportFile.addEventListener('click', triggerFileInput);
}

// 2. Gắn sự kiện các nút "Trộn Đề" ở mọi vị trí
function triggerShuffleClick(e) {
  if (e) e.stopPropagation();
  openShuffleModal();
}

if (btnQrShuffle) {
  btnQrShuffle.addEventListener('click', triggerShuffleClick);
}
if (btnFloatingShuffle) {
  btnFloatingShuffle.addEventListener('click', triggerShuffleClick);
}
if (btnModalShuffle) {
  btnModalShuffle.addEventListener('click', triggerShuffleClick);
}
if (btnManagerShuffle) {
  btnManagerShuffle.addEventListener('click', triggerShuffleClick);
}

if (btnModalOpenQuestionManager) {
  btnModalOpenQuestionManager.addEventListener('click', (e) => {
    e.stopPropagation();
    closeQrManagerModal();
    openQuestionManagerModal();
  });
}

// 3. Kéo thả file câu hỏi trực tiếp (Drag & Drop)
if (qmDropZone) {
  qmDropZone.addEventListener('click', triggerFileInput);
  qmDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    qmDropZone.classList.add('dragover');
  });
  qmDropZone.addEventListener('dragleave', () => {
    qmDropZone.classList.remove('dragover');
  });
  qmDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    qmDropZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQuestionFile(e.dataTransfer.files[0]);
    }
  });
}

// Hỗ trợ kéo thả file câu hỏi vào bất kỳ đâu trên màn hình máy chủ
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const f = e.dataTransfer.files[0];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.docx') {
      e.preventDefault();
      handleQuestionFile(f);
    }
  }
});

// 4. Render danh sách câu hỏi xem trước trong Import Preview Modal
function renderImportPreviewCards(list) {
  if (!importPreviewList) return;
  importPreviewList.innerHTML = '';

  list.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'import-q-item';
    const correctIdx = typeof q.dap_an_dung === 'number' ? q.dap_an_dung : 0;
    const opts = Array.isArray(q.cac_lua_chon) ? q.cac_lua_chon : ['', '', '', ''];
    const letter = ['A', 'B', 'C', 'D'];

    let optsHtml = '';
    opts.forEach((optText, oIdx) => {
      const isCorrect = (oIdx === correctIdx);
      optsHtml += `
        <div class="import-q-opt ${isCorrect ? 'is-correct' : ''}">
          <span class="hq-opt-letter" style="${isCorrect ? 'background: #166534; color: #fff; border-color: #4ade80;' : ''}">${letter[oIdx]}</span>
          <span>${escapeHtml(optText || '')}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="import-q-head">
        <span class="import-q-num">#${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}. ${escapeHtml(q.que_so || `Quẻ #${idx + 1}`)}</span>
        <span class="import-q-topic">${escapeHtml(q.chu_de || 'Giáo Lý Bửu Sơn Kỳ Hương')}</span>
      </div>
      <div class="import-q-body">${escapeHtml(q.cau_hoi || '')}</div>
      <div class="import-q-opts">${optsHtml}</div>
      ${q.loi_giai ? `<div class="import-q-expl">💡 Giải nghĩa: ${escapeHtml(q.loi_giai)}</div>` : ''}
    `;
    importPreviewList.appendChild(card);
  });
}

// 4b. Render danh sách câu hỏi của TÍNH NĂNG 1 (Đề thi hiện tại trong Modal QR)
function renderQmCurrentQuestions(questions) {
  const list = (questions && questions.length > 0) ? questions : questionsData;
  if (qmCurrentQuestionsCount) {
    qmCurrentQuestionsCount.textContent = list.length;
  }
  if (!qmCurrentQuestionsList) return;

  qmCurrentQuestionsList.innerHTML = '';
  list.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'qm-cq-item';
    const correctIdx = typeof q.dap_an_dung === 'number' ? q.dap_an_dung : 0;
    const opts = Array.isArray(q.cac_lua_chon) ? q.cac_lua_chon : ['', '', '', ''];
    const letter = ['A', 'B', 'C', 'D'];

    let optsHtml = '';
    opts.forEach((optText, oIdx) => {
      const isCorrect = (oIdx === correctIdx);
      optsHtml += `
        <div class="qm-cq-opt-pill ${isCorrect ? 'is-correct' : ''}">
          <strong>${letter[oIdx]}.</strong> ${escapeHtml(optText || '')} ${isCorrect ? ' (✓ ĐÚNG)' : ''}
        </div>
      `;
    });

    item.innerHTML = `
      <div class="qm-cq-title">Câu ${idx + 1}: ${escapeHtml(q.cau_hoi || '')}</div>
      <div class="qm-cq-topic">${escapeHtml(q.que_so || `Quẻ #${idx + 1}`)} • ${escapeHtml(q.chu_de || 'Giáo Lý')}</div>
      <div class="qm-cq-opts-grid">${optsHtml}</div>
      ${q.loi_giai ? `<div style="font-size: 10px; color: #ffd700; margin-top: 3px; font-style: italic;">💡 Ý nghĩa: ${escapeHtml(q.loi_giai)}</div>` : ''}
    `;
    qmCurrentQuestionsList.appendChild(item);
  });
}

// 4c. Render danh sách xem trước của TÍNH NĂNG 2 (Khung kết quả phân tích file)
function renderQmInlinePreview(list) {
  if (!qmIrPreviewList) return;
  qmIrPreviewList.innerHTML = '';

  list.forEach((q, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'background: rgba(20,10,5,0.8); border: 1px solid rgba(74,222,128,0.3); border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #f7ede2;';
    const letter = ['A', 'B', 'C', 'D'][q.dap_an_dung || 0] || 'A';
    const correctText = (q.cac_lua_chon && q.cac_lua_chon[q.dap_an_dung]) || '';

    row.innerHTML = `
      <div style="font-weight: 700; color: #ffd700;">#${idx + 1}. ${escapeHtml(q.cau_hoi || '')}</div>
      <div style="color: #86efac; margin-top: 2px;">
        ✓ Đáp án đúng tìm thấy: <strong style="color: #ffd700;">${letter}.</strong> ${escapeHtml(correctText)}
      </div>
    `;
    qmIrPreviewList.appendChild(row);
  });
}

// Gắn sự kiện các nút TÍNH NĂNG 1 (Đề)
if (btnExportDocx) {
  btnExportDocx.addEventListener('click', () => {
    showToast('📄 Đang xuất đề thi ra file Word (.docx)...');
    window.location.href = `/api/questions/export/docx?token=${encodeURIComponent(hostKey)}`;
  });
}
if (btnExportXlsx) {
  btnExportXlsx.addEventListener('click', () => {
    showToast('📊 Đang xuất đề thi ra file Excel (.xlsx)...');
    window.location.href = `/api/questions/export/xlsx?token=${encodeURIComponent(hostKey)}`;
  });
}
if (btnQmShuffleFeature) {
  btnQmShuffleFeature.addEventListener('click', triggerShuffleClick);
}
if (btnToggleCurrentQuestions) {
  btnToggleCurrentQuestions.addEventListener('click', () => {
    if (qmCurrentQuestionsWrap) {
      const isVisible = (qmCurrentQuestionsWrap.style.display !== 'none');
      qmCurrentQuestionsWrap.style.display = isVisible ? 'none' : 'block';
      btnToggleCurrentQuestions.textContent = isVisible ? '👁️ Xem Chi Tiết Đề' : '👁️ Thu Gọn Đề';
    }
  });
}

// Gắn sự kiện các nút TÍNH NĂNG 2 (Nhập file)
if (btnQmUploadFile) {
  btnQmUploadFile.addEventListener('click', triggerFileInput);
}
if (qmUploadDropZone) {
  qmUploadDropZone.addEventListener('click', triggerFileInput);
  qmUploadDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    qmUploadDropZone.classList.add('dragover');
  });
  qmUploadDropZone.addEventListener('dragleave', () => {
    qmUploadDropZone.classList.remove('dragover');
  });
  qmUploadDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    qmUploadDropZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQuestionFile(e.dataTransfer.files[0]);
    }
  });
}

// Nút áp dụng thay đổi câu hỏi trực tiếp trong Tính Năng 2
if (btnApplyImportedQuestionsInline) {
  btnApplyImportedQuestionsInline.addEventListener('click', () => {
    if (!pendingImportedQuestions || pendingImportedQuestions.length === 0) {
      alert('Chưa có danh sách câu hỏi nào được nạp!');
      return;
    }
    showToast('🚀 Đang thay đổi bộ câu hỏi hiện tại và đồng bộ sang máy người chơi...');
    socket.emit('host:apply_imported_questions', {
      questions: pendingImportedQuestions,
      mode: 'replace'
    });
  });
}

// 5. Khi Server trả về kết quả phân tích file thành công
socket.on('host:file_parsed', (data) => {
  pendingImportedQuestions = data.questions || [];
  if (importFileName) importFileName.textContent = data.filename || 'Tập tin câu hỏi';
  if (importFileType) importFileType.textContent = data.fileType || 'Excel/Word';
  if (importQuestionCount) importQuestionCount.textContent = `${data.count} Câu Hỏi`;

  // Cập nhật kết quả vào khung Tính Năng 2 trong Modal QR
  if (qmIrFileName) qmIrFileName.textContent = data.filename || '';
  if (qmIrFileType) qmIrFileType.textContent = data.fileType || '';
  if (qmIrCount) qmIrCount.textContent = `${data.count} Câu`;
  renderQmInlinePreview(pendingImportedQuestions);
  if (qmImportResultBox) qmImportResultBox.style.display = 'flex';

  renderImportPreviewCards(pendingImportedQuestions);
  openImportPreviewModal();
  showToast(`✅ Đã nhận dạng thành công ${data.count} câu hỏi và tìm thấy đáp án đúng từ ${data.filename}!`);
});

socket.on('host:file_parse_error', (data) => {
  alert('⚠️ Lỗi nhận dạng file câu hỏi:\n' + (data.message || 'Không thể đọc cấu trúc câu hỏi.'));
  showToast('⚠️ Lỗi nhận dạng file câu hỏi');
});

// 6. Xử lý Nút Áp Dụng Thay Đổi Câu Hỏi Hiện Tại
if (btnApplyImportedQuestions) {
  btnApplyImportedQuestions.addEventListener('click', () => {
    if (!pendingImportedQuestions || pendingImportedQuestions.length === 0) {
      alert('Không có câu hỏi nào để áp dụng!');
      return;
    }

    const selectedRadio = document.querySelector('input[name="importApplyMode"]:checked');
    const mode = selectedRadio ? selectedRadio.value : 'replace';

    showToast('🚀 Đang thay đổi bộ câu hỏi hiện tại và đồng bộ sang máy người chơi...');

    socket.emit('host:apply_imported_questions', {
      questions: pendingImportedQuestions,
      mode
    });

    closeImportPreviewModal();
  });
}

socket.on('host:apply_imported_success', (data) => {
  showToast(data.message || `✅ Đã áp dụng thành công ${data.count} câu hỏi mới!`);
  if (data.questions) {
    questionsData = data.questions;
    renderQuestionList();
    renderQmCurrentQuestions(questionsData); // Cập nhật Tính Năng 1 ngay lập tức!
    selectQuestionToEdit(0);
    if (qmImportResultBox) qmImportResultBox.style.display = 'none';
  }
});

// 7. Xử lý Nút Xác Nhận Trộn Đề Thi
if (btnConfirmShuffle) {
  btnConfirmShuffle.addEventListener('click', () => {
    const shuffleQuestions = chkShuffleQuestions ? chkShuffleQuestions.checked : true;
    const shuffleOptions = chkShuffleOptions ? chkShuffleOptions.checked : true;

    showToast('🔀 Đang tiến hành trộn đề thi và đồng bộ sang người chơi...');

    socket.emit('host:shuffle_questions', {
      shuffleQuestions,
      shuffleOptions
    });

    closeShuffleModal();
  });
}

socket.on('host:shuffle_success', (data) => {
  showToast(data.message || '🔀 Đã trộn đề thi và đảo đáp án thành công!');
  if (data.questions) {
    questionsData = data.questions;
    renderQuestionList();
    renderQmCurrentQuestions(questionsData); // Cập nhật Tính Năng 1 ngay lập tức!
    selectQuestionToEdit(0);
  }
});

// Đóng các Modal
if (btnCloseImportPreview) btnCloseImportPreview.addEventListener('click', closeImportPreviewModal);
if (btnCancelImport) btnCancelImport.addEventListener('click', closeImportPreviewModal);
if (btnCloseShuffleModal) btnCloseShuffleModal.addEventListener('click', closeShuffleModal);
if (btnCancelShuffle) btnCancelShuffle.addEventListener('click', closeShuffleModal);

socket.on('quiz:questions_list_updated', (data) => {
  if (hostProgressDigits && data.totalQuestions) {
    const curNum = (currentActiveQuestionIdx >= 0) ? currentActiveQuestionIdx + 1 : 0;
    hostProgressDigits.textContent = `${curNum} / ${data.totalQuestions}`;
  }
  if (btnHostBell && data.totalQuestions) {
    const curNum = (currentActiveQuestionIdx >= 0) ? currentActiveQuestionIdx + 1 : 1;
    btnHostBell.textContent = `🔔 Thỉnh Chuông (Câu ${curNum}/${data.totalQuestions})`;
  }
});

socket.on('quiz:current_question_updated', (data) => {
  renderHostQuestion(data);
  showToast('🔔 Câu hỏi đang khảo nghiệm đã được cập nhật nội dung mới!');
});

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initHost);
} else {
  initHost();
}
