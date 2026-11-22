/**
 * ỨNG DỤNG RÚT QUẺ VẤN ĐẠO BỬU SƠN KỲ HƯƠNG
 * Xử lý logic lắc ống xăm 3D, cảm biến rung lắc di động, gieo keo âm dương & tạo Lòng Phái
 */

class App {
  constructor() {
    this.questions = [...QUE_DATA];
    this.currentQuestion = null;
    this.questionPool = [...this.questions];
    this.answeredCount = 0;
    this.score = 0;
    
    // Trạng thái lắc ống
    this.isShaking = false;
    this.shakeProgress = 0;
    this.shakeInterval = null;
    this.rattleSoundInterval = null;

    // Đếm ngược 45s
    this.timer = null;
    this.secondsLeft = 45;

    // Cảm biến điện thoại
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
    this.shakeThreshold = 14;

    this.initDOMElements();
    this.bindEvents();
    this.updateStats();
  }

  initDOMElements() {
    // Stage elements
    this.cylinder = document.getElementById('bambooCylinder');
    this.emergingStick = document.getElementById('emergingStick');
    this.btnShake = document.getElementById('btnShake');
    this.progressBar = document.getElementById('shakeProgressBar');
    this.progressFill = document.getElementById('shakeProgressFill');
    this.keoLeft = document.getElementById('keoLeft');
    this.keoRight = document.getElementById('keoRight');

    // Stats
    this.statQueCount = document.getElementById('statQueCount');
    this.statCongDuc = document.getElementById('statCongDuc');

    // Question Modal
    this.modalQuestion = document.getElementById('modalQuestion');
    this.modalQueTitle = document.getElementById('modalQueTitle');
    this.modalQueTag = document.getElementById('modalQueTag');
    this.timerFill = document.getElementById('timerFill');
    this.timerDigits = document.getElementById('timerDigits');
    this.questionBody = document.getElementById('questionBody');
    this.optionsGrid = document.getElementById('optionsGrid');
    this.explanationPanel = document.getElementById('explanationPanel');
    this.explanationText = document.getElementById('explanationText');
    this.redSealStamp = document.getElementById('redSealStamp');
    this.stampMainText = document.getElementById('stampMainText');
    this.stampSubText = document.getElementById('stampSubText');
    this.btnNextQue = document.getElementById('btnNextQue');

    // Talisman Modal
    this.modalTalisman = document.getElementById('modalTalisman');
    this.btnShowTalisman = document.getElementById('btnShowTalisman');
    this.btnCloseTalisman = document.getElementById('btnCloseTalisman');
    this.btnDownloadTalisman = document.getElementById('btnDownloadTalisman');
    this.talismanCanvas = document.getElementById('talismanCanvas');

    // Audio & ambient buttons
    this.btnAudioToggle = document.getElementById('btnAudioToggle');
    this.btnBellChime = document.getElementById('btnBellChime');
  }

  bindEvents() {
    // Nút Lắc ống xăm trên Desktop/Mobile (Ấn giữ hoặc click)
    let holdTimer = null;
    const startShakeAction = (e) => {
      e.preventDefault();
      if (this.isShaking) return;
      this.startShakingLoop();
    };

    const stopShakeAction = (e) => {
      e.preventDefault();
      if (!this.isShaking) return;
      // Nếu chưa đầy thanh tiến độ mà thả tay thì giảm dần
      this.cancelShakingLoop();
    };

    this.btnShake.addEventListener('mousedown', startShakeAction);
    window.addEventListener('mouseup', stopShakeAction);
    this.btnShake.addEventListener('touchstart', startShakeAction, { passive: false });
    window.addEventListener('touchend', stopShakeAction);

    // Click đơn giản để lắc (tiện cho người dùng không muốn giữ chuột)
    this.btnShake.addEventListener('click', () => {
      if (!this.isShaking) {
        this.autoShakeOnce();
      }
    });

    // Cảm biến lắc điện thoại thật (DeviceMotionEvent)
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', (e) => this.handleDeviceMotion(e));
    }

    // Nút Tiếp tục rút quẻ
    this.btnNextQue.addEventListener('click', () => {
      this.closeQuestionModal();
    });

    // Nút xem & tải Lòng Phái
    this.btnShowTalisman.addEventListener('click', () => this.openTalismanModal());
    this.btnCloseTalisman.addEventListener('click', () => this.closeTalismanModal());
    this.btnDownloadTalisman.addEventListener('click', () => this.downloadTalisman());

    // Nút Bật/Tắt âm thanh & Thỉnh chuông
    this.btnAudioToggle.addEventListener('click', () => {
      const isMuted = window.zenAudio.toggleMute();
      this.btnAudioToggle.innerHTML = isMuted 
        ? '🔇 <span>Âm thanh: Tắt</span>' 
        : '🔔 <span>Âm thanh: Mở</span>';
    });

    this.btnBellChime.addEventListener('click', () => {
      window.zenAudio.playTempleBell(220);
      window.zenAudio.startAmbient();
    });
  }

  // Lắc tự động 1 lần khi người dùng bấm nút
  autoShakeOnce() {
    window.zenAudio.init();
    this.isShaking = true;
    this.cylinder.classList.add('shaking');
    this.progressBar.style.display = 'block';
    this.shakeProgress = 0;

    // Rung điện thoại nếu có
    if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 100]);

    // Âm thanh que tre dồn dập
    window.zenAudio.playBambooRattle();
    const soundInterval = setInterval(() => {
      window.zenAudio.playBambooRattle();
    }, 120);

    const stepInterval = setInterval(() => {
      this.shakeProgress += 8;
      this.progressFill.style.width = Math.min(this.shakeProgress, 100) + '%';
      
      // Thẻ xăm nhô dần lên
      const riseOffset = (this.shakeProgress / 100) * 45;
      this.emergingStick.style.transform = `translateY(-${riseOffset}px)`;

      if (this.shakeProgress >= 100) {
        clearInterval(stepInterval);
        clearInterval(soundInterval);
        this.finishShaking();
      }
    }, 80);
  }

  startShakingLoop() {
    window.zenAudio.init();
    this.isShaking = true;
    this.cylinder.classList.add('shaking');
    this.progressBar.style.display = 'block';

    window.zenAudio.playBambooRattle();
    this.rattleSoundInterval = setInterval(() => {
      window.zenAudio.playBambooRattle();
    }, 130);

    this.shakeInterval = setInterval(() => {
      this.shakeProgress += 6;
      this.progressFill.style.width = Math.min(this.shakeProgress, 100) + '%';
      
      const riseOffset = (this.shakeProgress / 100) * 45;
      this.emergingStick.style.transform = `translateY(-${riseOffset}px)`;

      if (this.shakeProgress >= 100) {
        this.cancelShakingLoop();
        this.finishShaking();
      }
    }, 70);
  }

  cancelShakingLoop() {
    this.isShaking = false;
    this.cylinder.classList.remove('shaking');
    if (this.shakeInterval) clearInterval(this.shakeInterval);
    if (this.rattleSoundInterval) clearInterval(this.rattleSoundInterval);
    
    if (this.shakeProgress < 100) {
      this.shakeProgress = 0;
      this.progressFill.style.width = '0%';
      this.emergingStick.style.transform = 'translateY(0px)';
      this.progressBar.style.display = 'none';
    }
  }

  // Hoàn tất rút 1 quẻ xăm
  finishShaking() {
    this.isShaking = false;
    this.cylinder.classList.remove('shaking');
    this.progressBar.style.display = 'none';

    // Rung mạnh xác nhận thẻ rơi
    if (navigator.vibrate) navigator.vibrate(150);

    // Tiếng thẻ tre rơi
    window.zenAudio.playStickDrop();

    // Lấy 1 câu hỏi từ danh sách (ưu tiên câu chưa trả lời)
    if (this.questionPool.length === 0) {
      // Nếu đã hết thì xáo lại bộ câu hỏi
      this.questionPool = [...this.questions];
    }
    const randIdx = Math.floor(Math.random() * this.questionPool.length);
    this.currentQuestion = this.questionPool.splice(randIdx, 1)[0];

    // Chờ 0.5s rồi mở sớ câu hỏi
    setTimeout(() => {
      this.openQuestionModal(this.currentQuestion);
      this.emergingStick.style.transform = 'translateY(0px)';
      this.shakeProgress = 0;
    }, 600);
  }

  // Cảm biến lắc điện thoại ngoài đời thật
  handleDeviceMotion(event) {
    if (this.isShaking || this.modalQuestion.style.display === 'flex') return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    if (this.lastX !== null) {
      const deltaX = Math.abs(acc.x - this.lastX);
      const deltaY = Math.abs(acc.y - this.lastY);
      const deltaZ = Math.abs(acc.z - this.lastZ);

      if (deltaX + deltaY + deltaZ > this.shakeThreshold) {
        this.autoShakeOnce();
      }
    }

    this.lastX = acc.x;
    this.lastY = acc.y;
    this.lastZ = acc.z;
  }

  // Mở modal hiển thị câu hỏi & bắt đầu đếm ngược 45s
  openQuestionModal(q) {
    this.modalQueTitle.textContent = `${q.que_so} - ${q.chu_de}`;
    this.modalQueTag.textContent = `Câu ${this.answeredCount + 1}/12 Khảo Nghiệm`;
    this.questionBody.textContent = q.cau_hoi;
    this.explanationPanel.style.display = 'none';
    this.btnNextQue.style.display = 'none';

    // Render 4 phương án
    this.optionsGrid.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.cac_lua_chon.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `
        <span class="option-letter">${letters[idx]}</span>
        <span class="option-text">${optText}</span>
      `;
      btn.addEventListener('click', () => this.handleSelectOption(idx, q));
      this.optionsGrid.appendChild(btn);
    });

    this.modalQuestion.style.display = 'flex';

    // Khởi động nén nhang đếm ngược 45s
    this.startIncenseTimer(q.thoi_gian || 45);
  }

  startIncenseTimer(seconds) {
    if (this.timer) clearInterval(this.timer);
    this.secondsLeft = seconds;
    this.updateTimerUI();

    this.timer = setInterval(() => {
      this.secondsLeft--;
      this.updateTimerUI();

      if (this.secondsLeft <= 0) {
        clearInterval(this.timer);
        this.handleTimeOut();
      }
    }, 1000);
  }

  updateTimerUI() {
    this.timerDigits.textContent = `${this.secondsLeft}s`;
    const percent = (this.secondsLeft / 45) * 100;
    this.timerFill.style.width = `${percent}%`;
  }

  // Hết giờ mà chưa chọn
  handleTimeOut() {
    const allBtns = this.optionsGrid.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    
    // Đánh dấu đáp án đúng
    allBtns[this.currentQuestion.dap_an_dung].classList.add('correct');
    
    // Gieo keo Chưa thông
    this.animateKeo(false);
    window.zenAudio.playFailChime();
    this.showExplanation(false, "Đã hết thời khắc chiêm nghiệm!");
  }

  // Người dùng chọn 1 phương án
  handleSelectOption(selectedIdx, q) {
    clearInterval(this.timer);
    const allBtns = this.optionsGrid.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    const isCorrect = (selectedIdx === q.dap_an_dung);

    // Gieo đài âm dương
    this.animateKeo(isCorrect);

    if (isCorrect) {
      allBtns[selectedIdx].classList.add('correct');
      window.zenAudio.playSuccessChime();
      this.score += 100;
      this.showExplanation(true);
    } else {
      allBtns[selectedIdx].classList.add('wrong');
      allBtns[q.dap_an_dung].classList.add('correct');
      window.zenAudio.playFailChime();
      this.showExplanation(false);
    }

    this.answeredCount++;
    this.updateStats();
  }

  // Hiệu ứng gieo 2 đồng keo âm dương
  animateKeo(isSuccess) {
    window.zenAudio.playTossDivinationBlocks();

    // Đặt lại
    this.keoLeft.className = 'keo-piece';
    this.keoRight.className = 'keo-piece';

    setTimeout(() => {
      if (isSuccess) {
        // Nhất Âm Nhất Dương: 1 sấp 1 ngửa -> Đắc quẻ
        this.keoLeft.classList.add('duong'); // Ngửa
        this.keoRight.classList.add('am');   // Sấp
      } else {
        // Cả 2 cùng sấp hoặc cùng ngửa -> Chưa thông
        if (Math.random() > 0.5) {
          this.keoLeft.classList.add('am');
          this.keoRight.classList.add('am');
        } else {
          this.keoLeft.classList.add('duong');
          this.keoRight.classList.add('duong');
        }
      }
    }, 150);
  }

  // Hiển thị lời luận giải & đóng dấu ấn son
  showExplanation(isCorrect, extraNotice = null) {
    this.explanationPanel.style.display = 'block';
    let text = this.currentQuestion.loi_giai;
    if (extraNotice) {
      text = `<em>(${extraNotice})</em><br><br>${text}`;
    }
    this.explanationText.innerHTML = text;

    if (isCorrect) {
      this.redSealStamp.className = 'red-seal-stamp';
      this.stampMainText.textContent = 'ĐẮC QUẺ';
      this.stampSubText.textContent = 'CÁT TƯỜNG';
    } else {
      this.redSealStamp.className = 'red-seal-stamp fail';
      this.stampMainText.textContent = 'CHƯA THÔNG';
      this.stampSubText.textContent = 'TU HỌC';
    }

    this.btnNextQue.style.display = 'inline-flex';
  }

  closeQuestionModal() {
    this.modalQuestion.style.display = 'none';
    if (this.timer) clearInterval(this.timer);

    // Nếu đã hoàn thành đủ 12 quẻ thì tự động mời thỉnh Lòng Phái
    if (this.answeredCount >= 12) {
      setTimeout(() => {
        this.openTalismanModal();
      }, 500);
    }
  }

  updateStats() {
    this.statQueCount.textContent = `${this.answeredCount}/12`;
    this.statCongDuc.textContent = `${this.score} Điểm`;
  }

  // =========================================================================
  // TẠO TÍN VẬT "LÒNG PHÁI BỬU SƠN KỲ HƯƠNG" BẰNG CANVAS
  // =========================================================================
  openTalismanModal() {
    this.modalTalisman.style.display = 'flex';
    this.drawTalismanCanvas();
  }

  closeTalismanModal() {
    this.modalTalisman.style.display = 'none';
  }

  drawTalismanCanvas() {
    const canvas = this.talismanCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 840;

    // 1. Nền giấy vàng cổ (Lòng phái giấy điệp truyền thống)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#f9ebb2');
    bgGrad.addColorStop(0.5, '#edd893');
    bgGrad.addColorStop(1, '#dfc476');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Họa tiết vân giấy cổ
    ctx.fillStyle = 'rgba(120, 80, 20, 0.04)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // 2. Đường viền son đỏ kép (Chu Sa)
    ctx.strokeStyle = '#931313';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    // 4 góc hoa văn cổ
    this.drawCornerDecor(ctx, 36, 36);
    this.drawCornerDecor(ctx, canvas.width - 36, 36);
    this.drawCornerDecor(ctx, 36, canvas.height - 36);
    this.drawCornerDecor(ctx, canvas.width - 36, canvas.height - 36);

    // 3. Tiêu đề đỉnh sớ
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a1111';
    ctx.font = 'bold 22px "Cinzel", "Noto Serif", serif';
    ctx.fillText('ĐẠO NỘI SINH NAM BỘ', canvas.width / 2, 85);

    ctx.font = 'italic 16px "Noto Serif", serif';
    ctx.fillStyle = '#5c3917';
    ctx.fillText('Tứ Đại Trọng Ân • Học Phật Tu Nhân', canvas.width / 2, 115);

    // Đường gạch chỉ vàng
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(140, 135);
    ctx.lineTo(canvas.width - 140, 135);
    ctx.stroke();

    // 4. BỐN CHỮ VÀNG CHU SA CỐT LÕI: "BỬU SƠN KỲ HƯƠNG"
    ctx.fillStyle = '#b81414';
    ctx.font = '900 48px "Noto Serif", serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('BỬU SƠN KỲ HƯƠNG', canvas.width / 2, 215);

    // Chữ Hán Cổ Phù Trợ
    ctx.fillStyle = 'rgba(184, 20, 20, 0.85)';
    ctx.font = 'bold 36px serif';
    ctx.fillText('寶 山 奇 香', canvas.width / 2, 280);

    // 5. Khung Khảo Nghiệm & Điểm Công Đức
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(70, 320, canvas.width - 140, 260);
    ctx.strokeStyle = '#931313';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(70, 320, canvas.width - 140, 260);

    ctx.fillStyle = '#2d180c';
    ctx.font = 'bold 20px "Noto Serif", serif';
    ctx.fillText('CHỨNG MINH QUY Y VẤN ĐẠO', canvas.width / 2, 365);

    ctx.font = '16px "Noto Serif", serif';
    ctx.fillStyle = '#422818';
    ctx.fillText(`Số Quẻ Đã Khảo Nghiệm: ${this.answeredCount} / 12 Quẻ`, canvas.width / 2, 415);

    ctx.font = 'bold 26px "Cinzel", "Noto Serif", serif';
    ctx.fillStyle = '#931313';
    ctx.fillText(`Công Đức Tích Lũy: ${this.score} Điểm`, canvas.width / 2, 465);

    let danhHieu = 'Cư Sĩ Tinh Tấn';
    if (this.score >= 1000) danhHieu = 'Đại Cư Sĩ Thông Tuệ';
    else if (this.score >= 600) danhHieu = 'Thiện Nam Tín Nữ Thuần Thành';

    ctx.font = 'italic 18px "Noto Serif", serif';
    ctx.fillStyle = '#5a3a22';
    ctx.fillText(`Phẩm Vị Đạt: [ ${danhHieu} ]`, canvas.width / 2, 515);

    ctx.font = '13px "Noto Serif", serif';
    ctx.fillStyle = '#6e5138';
    const now = new Date();
    const dateStr = `Thời khắc: Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
    ctx.fillText(dateStr, canvas.width / 2, 550);

    // 6. Con dấu son tròn "PHẬT THẦY TÂY AN CHỨNG TRI"
    this.drawVermilionSeal(ctx, canvas.width - 150, 680, 50);

    // 7. Lời dặn dò chân truyền
    ctx.fillStyle = '#4f1a1a';
    ctx.font = 'italic 14px "Noto Serif", serif';
    ctx.fillText('“Đền đáp Tứ Ân, giang sơn vẹn giữ,', canvas.width / 2 - 40, 675);
    ctx.fillText('Phật tại tâm thành, phúc thọ miên trường.”', canvas.width / 2 - 40, 705);
  }

  drawCornerDecor(ctx, x, y) {
    ctx.fillStyle = '#931313';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawVermilionSeal(ctx, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08);

    ctx.strokeStyle = '#c92a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#c92a2a';
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PHẬT THẦY', 0, -16);
    ctx.font = 'bold 16px serif';
    ctx.fillText('TÂY AN', 0, 4);
    ctx.font = 'bold 11px serif';
    ctx.fillText('CHỨNG TRI', 0, 22);

    ctx.restore();
  }

  downloadTalisman() {
    const link = document.createElement('a');
    link.download = `Long_Phai_Buu_Son_Ky_Huong_${Date.now()}.png`;
    link.href = this.talismanCanvas.toDataURL('image/png');
    link.click();
  }
}

// Khởi tạo app khi trang tải xong
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
