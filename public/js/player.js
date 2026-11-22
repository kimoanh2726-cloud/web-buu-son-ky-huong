/**
 * LOGIC MÀN HÌNH ĐIỆN THOẠI NGƯỜI CHƠI (PLAYER CONTROLLER)
 * Chánh Điện 50 chỗ Bửu Sơn Kỳ Hương
 * 
 * Tính năng chính:
 * 1. Giao diện Chánh Điện đồng nhất 100% với Máy Chủ (Bàn thờ Tam Bảo, Trần Điều, Sàn 50 Chiếu cói, Cửa ra vào).
 * 2. Cần gạt D-Pad (▲, ◀, ▶, ▼) & Chạm trực tiếp chiếu để rảo bước đi lại tự do trong Chánh Điện.
 * 3. Nút Thao Tác An Vị nổi ("🙏 AN VỊ CHIẾU #...") tự động kích hoạt khi đi lại gần chiếu trống.
 * 4. BẮT BUỘC AN VỊ VÀO CHỖ ĐỂ NHẬN CÂU HỎI: Nếu chưa an vị khi chuông reo, hiện banner cảnh báo; ngay khi an vị sẽ tự động mở bảng câu hỏi.
 * 5. Khảo nghiệm đồng bộ thời gian thực theo tiếng chuông thỉnh của Chủ Tọa.
 */

const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 10000
});

// ============================================================================
// DOM ELEMENTS
// ============================================================================

// View 1: Tham gia
const viewJoin = document.getElementById('viewJoin');
const playerNameInput = document.getElementById('playerNameInput');
const btnJoinTemple = document.getElementById('btnJoinTemple');

// View 2: Chánh Điện
const playerTempleViewport = document.getElementById('playerTempleViewport');
const displayPlayerName = document.getElementById('displayPlayerName');
const mobileScoreVal = document.getElementById('mobileScoreVal');
const playerSeatStatus = document.getElementById('playerSeatStatus');
const playerProgressBadge = document.getElementById('playerProgressBadge');
const unseatedWarningBanner = document.getElementById('unseatedWarningBanner');

// Sàn Chánh Điện
const templeHallFloor = document.getElementById('templeHallFloor');
const seatsLayer = document.getElementById('seatsLayer');
const walkersLayer = document.getElementById('walkersLayer');

// Cần Gạt D-Pad & Nút Thao Tác
const dpadController = document.getElementById('dpadController');
const btnMoveUp = document.getElementById('btnMoveUp');
const btnMoveDown = document.getElementById('btnMoveDown');
const btnMoveLeft = document.getElementById('btnMoveLeft');
const btnMoveRight = document.getElementById('btnMoveRight');
const btnActionSeat = document.getElementById('btnActionSeat');
const actionSeatIcon = document.getElementById('actionSeatIcon');
const actionSeatText = document.getElementById('actionSeatText');

// Bảng Khảo Nghiệm Đồng Bộ
const playerQuizModal = document.getElementById('playerQuizModal');
const mobileQProgress = document.getElementById('mobileQProgress');
const qTopicTag = document.getElementById('qTopicTag');
const mobileQTimer = document.getElementById('mobileQTimer');
const playerTimerBar = document.getElementById('playerTimerBar');
const qTextCard = document.getElementById('qTextCard');
const qOptionsList = document.getElementById('qOptionsList');
const feedbackBox = document.getElementById('feedbackBox');
const feedbackStatus = document.getElementById('feedbackStatus');
const feedbackExpl = document.getElementById('feedbackExpl');
const feedbackWaitBell = document.getElementById('feedbackWaitBell');

// View 3: Kết Thúc & Lòng Phái
const viewFinished = document.getElementById('viewFinished');
const playerTalismanCanvas = document.getElementById('playerTalismanCanvas');
const btnDownloadPlayerTalisman = document.getElementById('btnDownloadPlayerTalisman');
const btnCloseTalisman = document.getElementById('btnCloseTalisman');

// Top 3 Floating Card DOM
const playerTop3Card = document.getElementById('playerTop3Card');
const btnPlayerOpenTop3 = document.getElementById('btnPlayerOpenTop3');
const btnClosePlayerTop3 = document.getElementById('btnClosePlayerTop3');
const btnOpenTalismanFromTop3 = document.getElementById('btnOpenTalismanFromTop3');
const btnWalkTempleFromTop3 = document.getElementById('btnWalkTempleFromTop3');

const pTop3Name1 = document.getElementById('pTop3Name1');
const pTop3Score1 = document.getElementById('pTop3Score1');
const pTop3Seat1 = document.getElementById('pTop3Seat1');

const pTop3Name2 = document.getElementById('pTop3Name2');
const pTop3Score2 = document.getElementById('pTop3Score2');
const pTop3Seat2 = document.getElementById('pTop3Seat2');

const pTop3Name3 = document.getElementById('pTop3Name3');
const pTop3Score3 = document.getElementById('pTop3Score3');
const pTop3Seat3 = document.getElementById('pTop3Seat3');

// Toast
let playerToast = document.getElementById('playerToast');

// ============================================================================
// TRẠNG THÁI CỤC BỘ (LOCAL STATE)
// ============================================================================
let myPlayer = null;
let allSeats = [];
const otherPlayersMap = new Map(); // id -> playerObj
let candidateSeat = null;

// Tọa độ nhân vật của người chơi (Bắt đầu ở Cửa Chánh Điện)
let currentPosX = 50; // Giữa cửa (50%)
let currentPosY = 92; // Đáy sàn (92%)
let isSeated = false;
let isMoving = false;
let moveInterval = null;

// Trạng thái khảo nghiệm
let currentQuizData = null;
let isQuestionActive = false;
let mySelectedOption = -1;
let questionRemainingTime = 25;
let questionTotalTime = 25;

// ============================================================================
// 1. THAM GIA ĐẠO TRÀNG (JOIN TEMPLE)
// ============================================================================
btnJoinTemple.addEventListener('click', handleJoin);
playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleJoin();
});

function handleJoin() {
  const name = playerNameInput.value.trim();
  if (!name) {
    showToastNotice('Vui lòng nhập Họ Tên hoặc Pháp Danh để bước vào Chánh Điện');
    playerNameInput.focus();
    return;
  }

  if (window.zenAudio && window.zenAudio.init) {
    window.zenAudio.init();
  }

  btnJoinTemple.disabled = true;
  btnJoinTemple.textContent = '⏳ Đang bước vào Chánh Điện...';

  socket.emit('player:join', { name });
}

// Máy chủ xác nhận tham gia thành công
socket.on('player:joined_success', (data) => {
  myPlayer = data.player;
  allSeats = data.seats || [];
  currentPosX = myPlayer.x || 50;
  currentPosY = myPlayer.y || 92;
  isSeated = !!myPlayer.isSeated;

  // Cập nhật thông tin trên thanh tiêu đề
  if (displayPlayerName) displayPlayerName.textContent = myPlayer.name;
  if (mobileScoreVal) mobileScoreVal.textContent = myPlayer.score || 0;

  // Chuyển sang View Chánh Điện
  viewJoin.style.display = 'none';
  playerTempleViewport.style.display = 'flex';

  // Vẽ 50 chiếc chiếu cói lên sàn
  render50FloorSeats(allSeats);

  // Vẽ các cư sĩ khác đang có mặt trong chánh điện
  walkersLayer.innerHTML = '';
  otherPlayersMap.clear();

  if (data.players && Array.isArray(data.players)) {
    data.players.forEach(p => {
      if (p.id !== myPlayer.id) {
        otherPlayersMap.set(p.id, p);
        walkersLayer.appendChild(createDevoteeWalker(p, false));
      }
    });
  }

  // Tạo Avatar chính mình tại vị trí hiện tại
  const myWalkerEl = createDevoteeWalker(myPlayer, true);
  walkersLayer.appendChild(myWalkerEl);

  // Nếu người chơi này đã có sẵn chỗ ngồi
  if (isSeated && myPlayer.seatId) {
    applySeatSuccess(myPlayer.seatId, myPlayer.seatId);
  } else {
    updateSeatStatusBadge(false);
  }

  // Kiểm tra xem phòng có câu hỏi nào đang mở sẵn không
  if (data.quizState && data.quizState.currentIndex >= 0 && data.quizState.currentQuestion) {
    const qState = data.quizState;
    handleQuestionStarted({
      questionIndex: qState.currentIndex,
      questionNumber: qState.questionNumber,
      totalQuestions: qState.totalQuestions,
      queSo: qState.currentQuestion.queSo,
      chuDe: qState.currentQuestion.chuDe,
      cauHoi: qState.currentQuestion.cauHoi,
      cacLuaChon: qState.currentQuestion.cacLuaChon,
      timeLimit: qState.timeLimit,
      remainingTime: qState.remainingTime
    });

    if (qState.isRevealed) {
      handleAnswerRevealed({
        questionIndex: qState.currentIndex,
        questionNumber: qState.questionNumber,
        totalQuestions: qState.totalQuestions,
        correctAnswer: qState.currentQuestion.correctAnswer,
        loiGiai: qState.currentQuestion.loiGiai
      });
    }
  }

  showToastNotice(`🎋 Chào mừng ${myPlayer.name} đến với Đạo Tràng Chánh Điện!`);
  if (window.zenAudio && window.zenAudio.playTempleBell) {
    window.zenAudio.playTempleBell(260);
  }
});

socket.on('player:error', (data) => {
  btnJoinTemple.disabled = false;
  btnJoinTemple.textContent = '🎋 BƯỚC VÀO CHÁNH ĐIỆN';
  showToastNotice(data.message || 'Lỗi khi bước vào phòng');
});

// ============================================================================
// 2. VẼ 50 CHIẾU CÓI & TẠO AVATAR CƯ SĨ
// ============================================================================

function render50FloorSeats(seatsList) {
  seatsLayer.innerHTML = '';

  seatsList.forEach(seat => {
    const isOccupied = !!seat.occupant;
    const el = document.createElement('div');
    el.id = `player-seat-${seat.id}`;
    el.className = 'seat-spot' + (isOccupied ? ' occupied' : '');
    el.style.left = `${seat.x}%`;
    el.style.top = `${seat.y}%`;
    el.dataset.seatId = seat.id;

    el.innerHTML = `
      <span class="seat-number">#${seat.number < 10 ? '0' + seat.number : seat.number}</span>
    `;

    // Chạm trực tiếp vào chiếu trên sàn điện thoại
    el.addEventListener('click', () => {
      handleSeatClicked(seat);
    });

    seatsLayer.appendChild(el);
  });
}

function createDevoteeWalker(player, isSelf = false) {
  const div = document.createElement('div');
  div.id = `walker-${player.id}`;
  div.className = 'devotee-walker' + (player.isSeated ? ' seated' : '') + (isSelf ? ' self-player' : '');
  div.style.left = `${player.x}%`;
  div.style.top = `${player.y}%`;

  const scarfs = ['#ffffff', '#ded2bc', '#caa872'];
  const scarfColor = scarfs[(player.avatarIndex || 0) % scarfs.length];

  div.innerHTML = `
    <div class="devotee-tag" id="tag-${player.id}">
      <span class="w-name">${escapeHTML(player.name)}${isSelf ? ' (Bạn)' : ''}</span>
      <span class="w-merit" id="merit-${player.id}" style="color: #ffd700; margin-left: 3px;">${player.score || 0}đ</span>
    </div>

    <!-- SVG Cư Sĩ Áo Bà Ba Đen Truyền Thống -->
    <svg class="devotee-avatar-svg" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Đầu / Khăn quấn -->
      <circle cx="50" cy="22" r="13" fill="#1b120c" />
      <ellipse cx="50" cy="16" rx="10" ry="7" fill="#110a06" />

      <!-- Mắt & Miệng -->
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
        <ellipse cx="40" cy="98" rx="6" ry="3" fill="#3e2716" />
        <ellipse cx="60" cy="98" rx="6" ry="3" fill="#3e2716" />
      </g>
    </svg>
  `;

  return div;
}

// ============================================================================
// 3. ĐIỀU KHIỂN DI CHUYỂN: D-PAD & CHẠM TRỰC TIẾP VÀO CHIẾU
// ============================================================================

function moveMyAvatar(dx, dy) {
  if (isSeated) {
    // Nếu đang ngồi thì thông báo cho người chơi biết cần đứng dậy mới đi được
    showToastNotice('Bạn đang an vị. Hãy bấm nút "Đứng dậy" nếu muốn di chuyển sang chiếu khác.');
    return;
  }

  // Giới hạn biên độ sàn Chánh Điện (X: 6%..94%, Y: 12%..92%)
  currentPosX = Math.max(6, Math.min(94, currentPosX + dx));
  currentPosY = Math.max(12, Math.min(92, currentPosY + dy));

  updateMyAvatarDOM(true);

  // Phát tọa độ cho máy chủ
  socket.emit('player:move', {
    x: parseFloat(currentPosX.toFixed(2)),
    y: parseFloat(currentPosY.toFixed(2)),
    isMoving: true
  });

  // Kiểm tra cự ly gần nhất tới các chiếu trống
  checkSeatProximity();
}

function stopMyAvatar() {
  updateMyAvatarDOM(false);
  socket.emit('player:move', {
    x: parseFloat(currentPosX.toFixed(2)),
    y: parseFloat(currentPosY.toFixed(2)),
    isMoving: false
  });
}

function updateMyAvatarDOM(moving) {
  if (!myPlayer) return;
  const myEl = document.getElementById(`walker-${myPlayer.id}`);
  if (myEl) {
    myEl.style.left = `${currentPosX}%`;
    myEl.style.top = `${currentPosY}%`;
    if (moving) {
      myEl.classList.add('walking');
    } else {
      myEl.classList.remove('walking');
    }
  }
}

// Gắn sự kiện cho các nút D-Pad (Hỗ trợ cả Chạm ngón tay Touch & Nhấp Chuột)
function bindDPadButton(btn, dx, dy) {
  if (!btn) return;

  const startMove = (e) => {
    e.preventDefault();
    if (moveInterval) clearInterval(moveInterval);
    moveMyAvatar(dx, dy);
    moveInterval = setInterval(() => {
      moveMyAvatar(dx, dy);
    }, 70);
  };

  const endMove = (e) => {
    if (moveInterval) {
      clearInterval(moveInterval);
      moveInterval = null;
    }
    stopMyAvatar();
  };

  btn.addEventListener('mousedown', startMove);
  window.addEventListener('mouseup', endMove);

  btn.addEventListener('touchstart', startMove, { passive: false });
  window.addEventListener('touchend', endMove);
  window.addEventListener('touchcancel', endMove);
}

bindDPadButton(btnMoveUp, 0, -2.4);
bindDPadButton(btnMoveDown, 0, 2.4);
bindDPadButton(btnMoveLeft, -2.0, 0);
bindDPadButton(btnMoveRight, 2.0, 0);

// Hỗ trợ thêm bàn phím máy tính (Mũi tên hoặc WASD)
window.addEventListener('keydown', (e) => {
  if (viewJoin.style.display !== 'none') return;
  if (playerQuizModal.style.display === 'flex') return;

  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moveMyAvatar(0, -2.4);
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveMyAvatar(0, 2.4);
  else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveMyAvatar(-2.0, 0);
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveMyAvatar(2.0, 0);
  else if (e.key === ' ' || e.key === 'Enter') {
    if (btnActionSeat && !btnActionSeat.disabled) {
      btnActionSeat.click();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
    stopMyAvatar();
  }
});

// Chạm trực tiếp vào một chiếc chiếu trên sàn: Rảo bước tự động tới chiếu đó
function handleSeatClicked(seat) {
  if (seat.occupant && seat.occupant.id !== myPlayer?.id) {
    showToastNotice(`Chiếu số #${seat.number} đã được cư sĩ ${seat.occupant.name} an vị! Vui lòng chọn chiếu khác.`);
    if (window.zenAudio && window.zenAudio.playWoodBlock) window.zenAudio.playWoodBlock();
    return;
  }

  if (isSeated) {
    if (myPlayer && myPlayer.seatId === seat.id) {
      showToastNotice(`Bạn đang an vị tại Chiếu số #${seat.number}.`);
      return;
    } else {
      showToastNotice('Bạn đang an vị. Hãy bấm "Đứng dậy" để di chuyển sang chiếu khác.');
      return;
    }
  }

  // Cho nhân vật rảo bước mượt mà tới vị trí của chiếu
  walkToSeat(seat);
}

function walkToSeat(seat) {
  const startX = currentPosX;
  const startY = currentPosY;
  const targetX = seat.x;
  const targetY = seat.y;

  const steps = 8;
  let currentStep = 0;

  if (moveInterval) clearInterval(moveInterval);

  moveInterval = setInterval(() => {
    currentStep++;
    const progress = currentStep / steps;
    currentPosX = startX + (targetX - startX) * progress;
    currentPosY = startY + (targetY - startY) * progress;

    updateMyAvatarDOM(true);
    socket.emit('player:move', {
      x: parseFloat(currentPosX.toFixed(2)),
      y: parseFloat(currentPosY.toFixed(2)),
      isMoving: true
    });

    if (currentStep >= steps) {
      clearInterval(moveInterval);
      moveInterval = null;
      stopMyAvatar();

      // Đã tới vị trí chiếu: Kích hoạt ứng cử viên an vị
      candidateSeat = seat;
      highlightCandidateSeat(seat.id);
      activateActionSeatButton(seat);
    }
  }, 40);
}

// Kiểm tra xem nhân vật có đang đứng gần chiếc chiếu trống nào không
function checkSeatProximity() {
  if (isSeated) return;

  const threshold = 6.2; // Bán kính % sàn
  let nearestSeat = null;
  let minDistance = 999;

  for (const seat of allSeats) {
    if (!seat.occupant) {
      const dist = Math.hypot(seat.x - currentPosX, seat.y - currentPosY);
      if (dist < threshold && dist < minDistance) {
        minDistance = dist;
        nearestSeat = seat;
      }
    }
  }

  if (nearestSeat) {
    candidateSeat = nearestSeat;
    highlightCandidateSeat(nearestSeat.id);
    activateActionSeatButton(nearestSeat);
  } else {
    candidateSeat = null;
    clearCandidateHighlight();
    deactivateActionSeatButton();
  }
}

function highlightCandidateSeat(seatId) {
  clearCandidateHighlight();
  const seatEl = document.getElementById(`player-seat-${seatId}`);
  if (seatEl) {
    seatEl.classList.add('target-candidate');
  }
}

function clearCandidateHighlight() {
  document.querySelectorAll('.seat-spot.target-candidate').forEach(el => {
    el.classList.remove('target-candidate');
  });
}

function activateActionSeatButton(seat) {
  btnActionSeat.disabled = false;
  btnActionSeat.className = 'btn-action-seat ready-to-sit';
  actionSeatIcon.textContent = '🙏';
  actionSeatText.textContent = `AN VỊ CHIẾU #${seat.number < 10 ? '0' + seat.number : seat.number}`;
}

function deactivateActionSeatButton() {
  if (isSeated) return;
  btnActionSeat.disabled = true;
  btnActionSeat.className = 'btn-action-seat';
  actionSeatIcon.textContent = '🚶';
  actionSeatText.textContent = 'Chạm chiếu hoặc đi lại gần để an vị';
}

// ============================================================================
// 4. AN VỊ VÀO CHIẾU / ĐỨNG DẬY ĐỔI CHỖ
// ============================================================================

btnActionSeat.addEventListener('click', () => {
  if (isSeated) {
    // Đứng dậy đổi chỗ
    socket.emit('player:stand_up');
    return;
  }

  if (!candidateSeat) {
    showToastNotice('Hãy đi lại gần một chiếc chiếu trống để an vị');
    return;
  }

  // Gửi lệnh an vị vào chiếu
  btnActionSeat.disabled = true;
  actionSeatText.textContent = '⏳ Đang an vị...';
  socket.emit('player:select_seat', { seatId: candidateSeat.id });
});

// Máy chủ xác nhận AN VỊ THÀNH CÔNG
socket.on('seat:assigned', (data) => {
  applySeatSuccess(data.seatId, data.seatNumber);
});

function applySeatSuccess(seatId, seatNumber) {
  isSeated = true;
  if (myPlayer) {
    myPlayer.isSeated = true;
    myPlayer.seatId = seatId;
  }

  // Đặt nhân vật ngay ngắn trên chiếu
  const targetSeat = allSeats.find(s => s.id === seatId);
  if (targetSeat) {
    currentPosX = targetSeat.x;
    currentPosY = targetSeat.y;
    targetSeat.occupant = { id: myPlayer.id, name: myPlayer.name };
  }

  const myEl = document.getElementById(`walker-${myPlayer.id}`);
  if (myEl) {
    myEl.style.left = `${currentPosX}%`;
    myEl.style.top = `${currentPosY}%`;
    myEl.classList.remove('walking');
    myEl.classList.add('seated');
    myEl.classList.add('bowing');
    setTimeout(() => myEl.classList.remove('bowing'), 1200);
  }

  // Khóa chiếu này trên sàn
  const seatEl = document.getElementById(`player-seat-${seatId}`);
  if (seatEl) {
    seatEl.classList.add('occupied');
  }
  clearCandidateHighlight();

  // Cập nhật nhãn trạng thái và nút thao tác
  updateSeatStatusBadge(true, seatNumber || seatId);

  btnActionSeat.disabled = false;
  btnActionSeat.className = 'btn-action-seat is-seated';
  actionSeatIcon.textContent = '🧘';
  actionSeatText.textContent = `🎋 ĐÃ AN VỊ #${seatNumber || seatId} (Bấm đứng dậy)`;

  if (window.zenAudio && window.zenAudio.playTempleBell) {
    window.zenAudio.playTempleBell(280);
  }
  if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
  showToastNotice(`🙏 Bạn đã an vị thành công tại Chiếu số #${seatNumber || seatId}!`);

  // BẮT BUỘC: NẾU CÓ CÂU HỎI ĐANG MỞ, LẬP TỨC MỞ BẢNG CÂU HỎI CHO CƯ SĨ
  if (isQuestionActive && currentQuizData) {
    if (unseatedWarningBanner) unseatedWarningBanner.style.display = 'none';
    openQuizModal();
  }
}

// Máy chủ xác nhận ĐỨNG DẬY THÀNH CÔNG
socket.on('seat:released', () => {
  isSeated = false;
  const oldSeatId = myPlayer?.seatId;
  if (myPlayer) {
    myPlayer.isSeated = false;
    myPlayer.seatId = null;
  }

  const myEl = document.getElementById(`walker-${myPlayer?.id}`);
  if (myEl) {
    myEl.classList.remove('seated');
  }

  if (oldSeatId) {
    const oldSeat = allSeats.find(s => s.id === oldSeatId);
    if (oldSeat) oldSeat.occupant = null;
    const seatEl = document.getElementById(`player-seat-${oldSeatId}`);
    if (seatEl) seatEl.classList.remove('occupied');
  }

  updateSeatStatusBadge(false);
  deactivateActionSeatButton();
  showToastNotice('Bạn đã đứng dậy. Hãy bước đi để chọn chiếu khác.');

  // Nếu đang có câu hỏi thì cảnh báo và giấu câu hỏi
  if (isQuestionActive) {
    closeQuizModal();
    if (unseatedWarningBanner) unseatedWarningBanner.style.display = 'block';
  }
});

// Máy chủ TỪ CHỐI AN VỊ VÌ ĐÃ CÓ NGƯỜI NHANH TAY HƠN
socket.on('seat:rejected', (data) => {
  showToastNotice(data.message || 'Chiếu này đã có người an vị trước! Vui lòng chọn chiếu khác.');
  if (window.zenAudio && window.zenAudio.playWoodBlock) window.zenAudio.playWoodBlock();
  if (navigator.vibrate) navigator.vibrate([150, 100, 150]);

  candidateSeat = null;
  clearCandidateHighlight();
  deactivateActionSeatButton();
});

// CẬP NHẬT TRẠNG THÁI CÁC CHIẾU REALTIME TỪ NHỮNG NGƯỜI CHƠI KHÁC
socket.on('seat:updated', (data) => {
  const seat = allSeats.find(s => s.id === data.seatId);
  if (seat) seat.occupant = data.occupant;

  const seatEl = document.getElementById(`player-seat-${data.seatId}`);
  if (seatEl) {
    seatEl.classList.add('occupied');
  }

  // Cập nhật vị trí avatar người đó sang tư thế quỳ lạy an vị
  const walkerEl = document.getElementById(`walker-${data.playerId}`);
  if (walkerEl && data.playerId !== myPlayer?.id) {
    walkerEl.style.left = `${data.x}%`;
    walkerEl.style.top = `${data.y}%`;
    walkerEl.classList.add('seated');
  }

  // Nếu người này đang ngắm chiếc chiếu này mà người khác an vị trước
  if (candidateSeat && candidateSeat.id === data.seatId && data.playerId !== myPlayer?.id) {
    candidateSeat = null;
    clearCandidateHighlight();
    deactivateActionSeatButton();
    const name = data.playerName || 'người khác';
    showToastNotice(`⚠️ Chiếu số #${data.seatId} vừa được cư sĩ ${name} an vị!`);
  }
});

socket.on('seat:cleared', (data) => {
  const seat = allSeats.find(s => s.id === data.seatId);
  if (seat) seat.occupant = null;

  const seatEl = document.getElementById(`player-seat-${data.seatId}`);
  if (seatEl) {
    seatEl.classList.remove('occupied');
  }

  const walkerEl = document.getElementById(`walker-${data.playerId}`);
  if (walkerEl && data.playerId !== myPlayer?.id) {
    walkerEl.classList.remove('seated');
  }
});

function updateSeatStatusBadge(seated, seatNum) {
  if (!playerSeatStatus) return;
  if (seated) {
    playerSeatStatus.className = 'p-seat-pill seated';
    playerSeatStatus.textContent = `🎋 Chiếu #${seatNum < 10 ? '0' + seatNum : seatNum}`;
  } else {
    playerSeatStatus.className = 'p-seat-pill unseated';
    playerSeatStatus.textContent = '🚶 Chưa an vị (Hãy tìm chiếu)';
  }
}

// ============================================================================
// 5. ĐỒNG BỘ CƯ SĨ KHÁC DI CHUYỂN TRONG CHÁNH ĐIỆN
// ============================================================================

socket.on('host:player_joined', (player) => {
  if (myPlayer && player.id === myPlayer.id) return;
  otherPlayersMap.set(player.id, player);

  let walkerEl = document.getElementById(`walker-${player.id}`);
  if (!walkerEl) {
    walkerEl = createDevoteeWalker(player, false);
    walkersLayer.appendChild(walkerEl);
  }
});

socket.on('player:moved', (data) => {
  if (myPlayer && data.id === myPlayer.id) return;

  const walkerEl = document.getElementById(`walker-${data.id}`);
  if (walkerEl) {
    walkerEl.style.left = `${data.x}%`;
    walkerEl.style.top = `${data.y}%`;
    if (data.isMoving) {
      walkerEl.classList.add('walking');
    } else {
      walkerEl.classList.remove('walking');
    }
  }
});

socket.on('host:player_left', (data) => {
  otherPlayersMap.delete(data.id);
  const walkerEl = document.getElementById(`walker-${data.id}`);
  if (walkerEl) walkerEl.remove();
});

socket.on('host:player_answered', (data) => {
  const meritEl = document.getElementById(`merit-${data.id}`);
  if (meritEl) {
    meritEl.textContent = `${data.newScore}đ`;
  }
});

// ============================================================================
// 6. HỆ THỐNG KHẢO NGHIỆM ĐỒNG BỘ: NHẬN CÂU HỎI KHI AN VỊ
// ============================================================================

// Khi Chủ tọa thỉnh chuông bắt đầu câu hỏi mới
socket.on('quiz:question_started', (data) => {
  handleQuestionStarted(data);
});

function handleQuestionStarted(data) {
  isQuestionActive = true;
  currentQuizData = data;
  mySelectedOption = -1;
  questionRemainingTime = data.remainingTime !== undefined ? data.remainingTime : data.timeLimit;
  questionTotalTime = data.timeLimit || 25;

  if (playerProgressBadge) {
    playerProgressBadge.textContent = `📜 Câu: ${data.questionNumber}/${data.totalQuestions}`;
  }

  // KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT: PHẢI AN VỊ MỚI NHẬN ĐƯỢC CÂU HỎI
  if (!isSeated) {
    closeQuizModal();
    if (unseatedWarningBanner) unseatedWarningBanner.style.display = 'block';
    showToastNotice('⚠️ CÂU HỎI ĐÃ MỞ! Hãy nhanh chân an vị vào một chiếc chiếu để nhận câu hỏi!');
    if (window.zenAudio && window.zenAudio.playWoodBlock) window.zenAudio.playWoodBlock();
    if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
    return;
  }

  // Nếu đã an vị: Mở bảng câu hỏi ngay lập tức
  if (unseatedWarningBanner) unseatedWarningBanner.style.display = 'none';
  openQuizModal();
}

function openQuizModal() {
  if (!currentQuizData) return;
  const data = currentQuizData;

  if (mobileQProgress) {
    mobileQProgress.textContent = `CÂU ${data.questionNumber < 10 ? '0' + data.questionNumber : data.questionNumber} / ${data.totalQuestions}`;
  }
  if (qTopicTag) {
    qTopicTag.textContent = `${data.queSo} • ${data.chuDe}`;
  }
  if (mobileQTimer) {
    mobileQTimer.textContent = questionRemainingTime;
  }
  if (playerTimerBar) {
    playerTimerBar.style.width = `${(questionRemainingTime / questionTotalTime) * 100}%`;
  }
  if (qTextCard) {
    qTextCard.textContent = data.cauHoi;
  }

  // Ẩn bảng feedback cũ
  if (feedbackBox) feedbackBox.style.display = 'none';

  // Render 4 lựa chọn A, B, C, D
  renderQuizOptions(data.cacLuaChon);

  playerQuizModal.style.display = 'flex';

  if (window.zenAudio && window.zenAudio.playTempleBell) {
    window.zenAudio.playTempleBell(240);
  }
  if (navigator.vibrate) navigator.vibrate(100);
}

function closeQuizModal() {
  if (playerQuizModal) {
    playerQuizModal.style.display = 'none';
  }
}

function renderQuizOptions(options) {
  if (!qOptionsList) return;
  qOptionsList.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  options.forEach((optText, optIdx) => {
    const btn = document.createElement('button');
    btn.id = `q-opt-btn-${optIdx}`;
    btn.className = 'q-opt-btn';
    btn.innerHTML = `
      <span class="q-opt-letter">${letters[optIdx]}</span>
      <span>${optText}</span>
    `;

    btn.addEventListener('click', () => {
      if (mySelectedOption !== -1) return; // Không cho đổi lựa chọn sau khi đã nộp
      if (!isSeated) {
        showToastNotice('Bạn phải an vị vào chiếu mới có thể trả lời!');
        return;
      }

      mySelectedOption = optIdx;

      // Đổi màu nút đã chọn
      btn.classList.add('selected');
      const allBtns = qOptionsList.querySelectorAll('.q-opt-btn');
      allBtns.forEach(b => b.classList.add('disabled'));

      // Nộp câu trả lời lên máy chủ
      socket.emit('player:submit_answer', { optionIndex: optIdx });
      if (window.zenAudio && window.zenAudio.playWoodBlock) window.zenAudio.playWoodBlock();

      // Hiện thông báo ghi nhận
      if (feedbackBox) feedbackBox.style.display = 'block';
      if (feedbackStatus) {
        feedbackStatus.style.color = 'var(--color-gold-bright)';
        feedbackStatus.textContent = '✓ Đã ghi nhận câu trả lời của bạn!';
      }
      if (feedbackExpl) {
        feedbackExpl.textContent = 'Đang tịnh tâm đếm ngược để công bố đáp án đúng...';
      }
      if (feedbackWaitBell) {
        feedbackWaitBell.textContent = '⏳ Hãy tịnh tâm chờ thời khắc công bố...';
      }
    });

    qOptionsList.appendChild(btn);
  });
}

// Đồng hồ đếm ngược câu hỏi từng giây
socket.on('quiz:tick', (data) => {
  questionRemainingTime = data.remainingTime;
  if (mobileQTimer) {
    mobileQTimer.textContent = data.remainingTime;
  }
  if (playerTimerBar && data.timeLimit) {
    const pct = Math.max(0, (data.remainingTime / data.timeLimit) * 100);
    playerTimerBar.style.width = `${pct}%`;
  }
});

// Khi Chủ tọa điều chỉnh thời gian câu hỏi trong thời gian thực (Cộng/Trừ hoặc Đặt lại)
socket.on('quiz:time_adjusted', (data) => {
  questionRemainingTime = data.remainingTime;
  if (mobileQTimer) {
    mobileQTimer.textContent = data.remainingTime;
  }
  if (playerTimerBar && data.timeLimit) {
    const pct = Math.max(0, (data.remainingTime / data.timeLimit) * 100);
    playerTimerBar.style.width = `${pct}%`;
  }
  showToastNotice(data.notice);
  if (navigator.vibrate) navigator.vibrate(80);
});

// Kết quả của riêng người chơi này (Máy chủ tính điểm và trả về)
socket.on('quiz:your_result', (data) => {
  if (feedbackBox) feedbackBox.style.display = 'block';

  if (data.status === 'CORRECT') {
    if (window.zenAudio && window.zenAudio.playSuccessChime) window.zenAudio.playSuccessChime();
    if (navigator.vibrate) navigator.vibrate(80);
    if (feedbackStatus) {
      feedbackStatus.style.color = '#4ade80';
      feedbackStatus.textContent = `✨ CHÍNH XÁC! (+${data.pointsEarned}đ Công Đức)`;
    }
  } else if (data.status === 'WRONG') {
    if (window.zenAudio && window.zenAudio.playFailChime) window.zenAudio.playFailChime();
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    if (feedbackStatus) {
      feedbackStatus.style.color = '#ef4444';
      feedbackStatus.textContent = '❌ Chưa Chính Xác! (0đ)';
    }
  } else if (data.status === 'MISSED') {
    if (window.zenAudio && window.zenAudio.playFailChime) window.zenAudio.playFailChime();
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
    if (feedbackStatus) {
      feedbackStatus.style.color = '#f59e0b';
      feedbackStatus.textContent = '⌛ HẾT GIỜ! Bạn đã bỏ lỡ câu hỏi này (0đ)';
    }
    const allBtns = qOptionsList ? qOptionsList.querySelectorAll('.q-opt-btn') : [];
    allBtns.forEach(b => b.classList.add('disabled'));
  }

  if (mobileScoreVal) mobileScoreVal.textContent = data.totalScore;
  if (myPlayer) myPlayer.score = data.totalScore;

  const myMeritEl = document.getElementById(`merit-${myPlayer?.id}`);
  if (myMeritEl) myMeritEl.textContent = `${data.totalScore}đ`;
});

// Máy chủ công bố đáp án đúng & Lời giải
socket.on('quiz:answer_revealed', (data) => {
  handleAnswerRevealed(data);
});

function handleAnswerRevealed(data) {
  if (mobileQTimer) mobileQTimer.textContent = '0';
  if (playerTimerBar) playerTimerBar.style.width = '0%';

  // Tô xanh đáp án đúng
  const correctBtn = document.getElementById(`q-opt-btn-${data.correctAnswer}`);
  if (correctBtn) {
    correctBtn.classList.remove('selected');
    correctBtn.classList.add('correct');
  }

  // Tô đỏ đáp án sai nếu người chơi chọn sai
  if (mySelectedOption !== -1 && mySelectedOption !== data.correctAnswer) {
    const wrongBtn = document.getElementById(`q-opt-btn-${mySelectedOption}`);
    if (wrongBtn) wrongBtn.classList.add('wrong');
  }

  if (feedbackBox) feedbackBox.style.display = 'block';
  if (feedbackExpl) feedbackExpl.textContent = data.loiGiai || '';

  if (feedbackWaitBell) {
    if (data.hasNextQuestion) {
      feedbackWaitBell.textContent = '🔔 Đang chờ Chủ tọa thỉnh chuông sang câu tiếp theo...';
    } else {
      feedbackWaitBell.textContent = '🏮 Đã hoàn tất 12 câu khảo nghiệm! Hãy chờ Chủ tọa tổng kết...';
    }
  }
}

// ============================================================================
// 7. TIẾNG CHUÔNG TAM BẢO & KẾT THÚC KHẢO NGHIỆM
// ============================================================================

socket.on('temple:bell', () => {
  if (window.zenAudio && window.zenAudio.playTempleBell) {
    window.zenAudio.playTempleBell(220);
  }
  if (navigator.vibrate) navigator.vibrate(200);
});

// KHI HOÀN THÀNH CÂU HỎI: VẪN ĐI LẠI TRONG CHÁNH ĐIỆN ĐỂ XEM 3 NGƯỜI CAO NHẤT
socket.on('game:over', (data) => {
  closeQuizModal();
  isQuestionActive = false;

  // Giữ nguyên sàn Chánh Điện để cư sĩ có thể rảo bước chiêm bái tự do!
  playerTempleViewport.style.display = 'flex';
  viewFinished.style.display = 'none';

  // Hiển thị nút Top 3 trên thanh điều hướng trên cùng
  if (btnPlayerOpenTop3) btnPlayerOpenTop3.style.display = 'inline-block';

  // Render thông tin Bảng Vàng Top 3 Tam Vị Thủ Khoa
  renderPlayerTop3(data.top3 || []);
  if (playerTop3Card) playerTop3Card.style.display = 'block';

  // Gắn biểu tượng Vương miện 👑, Huy chương 🥈🥉 cho các avatar trên sàn
  applyTop3BadgesToFloor(data.top3 || []);

  if (window.zenAudio && window.zenAudio.playTempleBell) {
    window.zenAudio.playTempleBell(200);
  }
  if (window.zenAudio && window.zenAudio.playSuccessChime) {
    window.zenAudio.playSuccessChime();
  }

  showToastNotice('🏮 Hoàn Mãn Khảo Nghiệm! Hãy rảo bước xem 3 vị Thủ Khoa trong Chánh Điện.');
});

// Máy chủ khởi động lại game từ đầu
socket.on('game:restarted', (data) => {
  closeQuizModal();
  isQuestionActive = false;
  if (playerTop3Card) playerTop3Card.style.display = 'none';
  if (viewFinished) viewFinished.style.display = 'none';
  if (btnPlayerOpenTop3) btnPlayerOpenTop3.style.display = 'none';

  if (myPlayer) {
    myPlayer.score = 0;
    myPlayer.isSeated = false;
    myPlayer.seatId = null;
    currentPosX = 50;
    currentPosY = 92;
  }
  isSeated = false;

  if (mobileScoreVal) mobileScoreVal.textContent = '0';
  if (playerProgressBadge) playerProgressBadge.textContent = '📜 Câu: 0/12';
  updateSeatStatusBadge(false);
  deactivateActionSeatButton();

  // Đưa avatar về cửa Chánh Điện
  updateMyAvatarDOM(false);

  // Xóa danh hiệu Top 3 trên sàn
  document.querySelectorAll('.devotee-walker').forEach(el => {
    el.classList.remove('top-1', 'top-2', 'top-3', 'seated');
  });

  // Vẽ lại 50 ghế trống
  allSeats = data.seats || [];
  render50FloorSeats(allSeats);

  showToastNotice('🎋 Chủ tọa đã khởi động lại đại lễ! Chúc quý cư sĩ một vòng khảo nghiệm mới tinh tấn.');
  if (window.zenAudio && window.zenAudio.playTempleBell) {
    window.zenAudio.playTempleBell(240);
  }
});

function renderPlayerTop3(top3) {
  if (top3 && top3[0]) {
    if (pTop3Name1) pTop3Name1.textContent = top3[0].name;
    if (pTop3Score1) pTop3Score1.textContent = `${top3[0].score}đ`;
    if (pTop3Seat1) pTop3Seat1.textContent = `Chiếu #${top3[0].seatId || '—'}`;
  } else {
    if (pTop3Name1) pTop3Name1.textContent = '—';
    if (pTop3Score1) pTop3Score1.textContent = '0đ';
  }

  if (top3 && top3[1]) {
    if (pTop3Name2) pTop3Name2.textContent = top3[1].name;
    if (pTop3Score2) pTop3Score2.textContent = `${top3[1].score}đ`;
    if (pTop3Seat2) pTop3Seat2.textContent = `Chiếu #${top3[1].seatId || '—'}`;
  } else {
    if (pTop3Name2) pTop3Name2.textContent = '—';
    if (pTop3Score2) pTop3Score2.textContent = '0đ';
  }

  if (top3 && top3[2]) {
    if (pTop3Name3) pTop3Name3.textContent = top3[2].name;
    if (pTop3Score3) pTop3Score3.textContent = `${top3[2].score}đ`;
    if (pTop3Seat3) pTop3Seat3.textContent = `Chiếu #${top3[2].seatId || '—'}`;
  } else {
    if (pTop3Name3) pTop3Name3.textContent = '—';
    if (pTop3Score3) pTop3Score3.textContent = '0đ';
  }
}

function applyTop3BadgesToFloor(top3) {
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

// Điều khiển mở / đóng bảng Top 3 trên điện thoại
if (btnClosePlayerTop3) {
  btnClosePlayerTop3.addEventListener('click', () => {
    if (playerTop3Card) playerTop3Card.style.display = 'none';
    showToastNotice('🎋 Đã thu nhỏ Bảng Vàng. Bạn có thể tự do rảo bước chiêm bái Chánh Điện!');
  });
}

if (btnWalkTempleFromTop3) {
  btnWalkTempleFromTop3.addEventListener('click', () => {
    if (playerTop3Card) playerTop3Card.style.display = 'none';
    showToastNotice('🎋 Hãy dùng cần gạt D-Pad để bước tới gần 3 vị Thủ Khoa!');
  });
}

if (btnPlayerOpenTop3) {
  btnPlayerOpenTop3.addEventListener('click', () => {
    if (playerTop3Card) playerTop3Card.style.display = 'block';
  });
}

// Mở modal Lòng Phái và quay lại Chánh Điện
if (btnOpenTalismanFromTop3) {
  btnOpenTalismanFromTop3.addEventListener('click', () => {
    drawPlayerTalisman();
    if (viewFinished) viewFinished.style.display = 'flex';
  });
}

if (btnCloseTalisman) {
  btnCloseTalisman.addEventListener('click', () => {
    if (viewFinished) viewFinished.style.display = 'none';
    playerTempleViewport.style.display = 'flex';
  });
}

// ============================================================================
// 8. TẠO TÍN VẬT LÒNG PHÁI BỬU SƠN KỲ HƯƠNG (CANVAS TALISMAN)
// ============================================================================

function drawPlayerTalisman() {
  const canvas = playerTalismanCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 540;
  canvas.height = 760;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#fcedb4');
  bgGrad.addColorStop(1, '#dfc476');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#931313';
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a1111';
  ctx.font = 'bold 20px "Cinzel", "Noto Serif", serif';
  ctx.fillText('ĐẠO NỘI SINH NAM BỘ', canvas.width / 2, 75);

  ctx.font = 'italic 14px "Noto Serif", serif';
  ctx.fillStyle = '#5c3917';
  ctx.fillText('Tứ Đại Trọng Ân • Học Phật Tu Nhân', canvas.width / 2, 102);

  ctx.fillStyle = '#b81414';
  ctx.font = '900 40px "Noto Serif", serif';
  ctx.fillText('BỬU SƠN KỲ HƯƠNG', canvas.width / 2, 185);

  ctx.fillStyle = 'rgba(184, 20, 20, 0.8)';
  ctx.font = 'bold 30px serif';
  ctx.fillText('寶 山 奇 香', canvas.width / 2, 240);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(50, 280, canvas.width - 100, 240);
  ctx.strokeStyle = '#931313';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 280, canvas.width - 100, 240);

  ctx.fillStyle = '#2d180c';
  ctx.font = 'bold 18px "Noto Serif", serif';
  ctx.fillText('CHỨNG MINH CÔNG ĐỨC KHẢO NGHIỆM', canvas.width / 2, 320);

  ctx.font = 'bold 22px "Noto Serif", serif';
  ctx.fillStyle = '#931313';
  ctx.fillText(myPlayer ? myPlayer.name : 'Thiện Tín Cư Sĩ', canvas.width / 2, 365);

  ctx.font = '15px "Noto Serif", serif';
  ctx.fillStyle = '#5c3917';
  ctx.fillText(`Vị Trí Đạo Tràng: Chiếu Số #${myPlayer?.seatId || '—'}`, canvas.width / 2, 405);

  const finalScore = myPlayer ? myPlayer.score : 0;
  ctx.font = 'bold 22px "Cinzel", "Noto Serif", serif';
  ctx.fillStyle = '#3a2010';
  ctx.fillText(`Công Đức: ${finalScore} Điểm`, canvas.width / 2, 445);

  let rankStr = 'Cư Sĩ Tinh Tấn';
  if (finalScore >= 800) rankStr = 'Đại Cư Sĩ Thông Tuệ';
  else if (finalScore >= 400) rankStr = 'Thiện Nam Tín Nữ Thuần Thành';

  ctx.font = 'italic 16px "Noto Serif", serif';
  ctx.fillStyle = '#5a3a22';
  ctx.fillText(`Phẩm Vị Đạt: [ ${rankStr} ]`, canvas.width / 2, 485);

  drawVermilionSeal(ctx, canvas.width - 130, 620, 42);

  ctx.fillStyle = '#4f1a1a';
  ctx.font = 'italic 13px "Noto Serif", serif';
  ctx.fillText('“Đền đáp Tứ Ân, giang sơn vẹn giữ,', canvas.width / 2 - 40, 615);
  ctx.fillText('Phật tại tâm thành, phúc thọ miên trường.”', canvas.width / 2 - 40, 642);
}

function drawVermilionSeal(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.06);

  ctx.strokeStyle = '#c92a2a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#c92a2a';
  ctx.font = 'bold 10px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PHẬT THẦY', 0, -13);
  ctx.font = 'bold 13px serif';
  ctx.fillText('TÂY AN', 0, 3);
  ctx.font = 'bold 9px serif';
  ctx.fillText('CHỨNG TRI', 0, 18);

  ctx.restore();
}

btnDownloadPlayerTalisman.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `Long_Phai_${(myPlayer && myPlayer.name) || 'Buu_Son'}.png`;
  link.href = playerTalismanCanvas.toDataURL('image/png');
  link.click();
});

// ============================================================================
// 9. TIỆN ÍCH HỖ TRỢ (HELPERS)
// ============================================================================

function showToastNotice(msg, duration = 3000) {
  if (!playerToast) {
    playerToast = document.createElement('div');
    playerToast.id = 'playerToast';
    playerToast.className = 'player-toast';
    document.body.appendChild(playerToast);
  }
  playerToast.textContent = msg;
  playerToast.style.display = 'block';
  playerToast.style.opacity = '1';

  clearTimeout(playerToast._timeout);
  playerToast._timeout = setTimeout(() => {
    playerToast.style.opacity = '0';
    setTimeout(() => { playerToast.style.display = 'none'; }, 300);
  }, duration);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
