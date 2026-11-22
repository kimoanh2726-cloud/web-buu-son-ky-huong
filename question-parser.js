const XLSX = require('xlsx');
const AdmZip = require('adm-zip');

/**
 * Xử lý & Chuẩn hóa chuỗi văn bản
 */
function cleanText(val) {
  if (val === undefined || val === null) return '';
  return val.toString().trim();
}

/**
 * Chuyển đổi đáp án dạng chữ hoặc số sang index 0..3 (0: A, 1: B, 2: C, 3: D)
 */
function parseCorrectAnswerIndex(val) {
  if (val === undefined || val === null) return 0;
  const s = val.toString().trim().toUpperCase();
  if (s === 'A' || s === '1') return 0;
  if (s === 'B' || s === '2') return 1;
  if (s === 'C' || s === '3') return 2;
  if (s === 'D' || s === '4') return 3;
  const num = parseInt(s);
  if (!isNaN(num) && num >= 1 && num <= 4) return num - 1;
  return 0;
}

/**
 * 1. Parser cho file Excel (.xlsx, .xls)
 * Hỗ trợ cả định dạng Quizizz (Question Text, Option 1..4, Correct Answer)
 * và định dạng bảng tiêu chuẩn tiếng Việt (Câu hỏi, Lựa chọn A/B/C/D, Đáp án đúng, Lời giải)
 */
function parseXlsxBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('File Excel không có sheet dữ liệu nào.');
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows || rows.length === 0) {
    throw new Error('Sheet đầu tiên trong file Excel không có dòng dữ liệu câu hỏi nào.');
  }

  const questions = [];

  rows.forEach((row, idx) => {
    // Tìm trường câu hỏi
    const questionText = cleanText(
      row['Question Text'] || row['question'] || row['cau_hoi'] || row['Câu Hỏi'] || row['Câu hỏi'] ||
      row['Nội dung câu hỏi'] || row['Noi dung'] || row['DE_BAI'] || row['Đề bài'] || ''
    );

    if (!questionText) return; // Bỏ qua dòng trống

    // Tìm các lựa chọn
    const optA = cleanText(row['Option 1'] || row['A'] || row['opt_a'] || row['Lua chon A'] || row['Lựa chọn A'] || row['Đáp án A'] || '');
    const optB = cleanText(row['Option 2'] || row['B'] || row['opt_b'] || row['Lua chon B'] || row['Lựa chọn B'] || row['Đáp án B'] || '');
    const optC = cleanText(row['Option 3'] || row['C'] || row['opt_c'] || row['Lua chon C'] || row['Lựa chọn C'] || row['Đáp án C'] || '');
    const optD = cleanText(row['Option 4'] || row['D'] || row['opt_d'] || row['Lua chon D'] || row['Lựa chọn D'] || row['Đáp án D'] || '');

    // Tìm đáp án đúng
    const rawAnswer = row['Correct Answer'] || row['dap_an_dung'] || row['Đáp án đúng'] || row['Dap an'] || row['Đáp án'] || row['Answer'] || row['Key'] || 1;
    const dapAnDung = parseCorrectAnswerIndex(rawAnswer);

    // Quẻ số & Chủ đề (nếu có cột riêng, hoặc tự sinh)
    const queSo = cleanText(row['que_so'] || row['Quẻ'] || row['Quẻ số'] || row['Số câu'] || `Quẻ #${idx + 1}`);
    const chuDe = cleanText(row['chu_de'] || row['Chủ đề'] || row['Topic'] || row['Category'] || 'Khảo Nghiệm Bửu Sơn Kỳ Hương');
    const loiGiai = cleanText(row['loi_giai'] || row['Lời giải'] || row['Giải thích'] || row['Explanation'] || '');

    questions.push({
      id: idx + 1,
      que_so: queSo,
      chu_de: chuDe,
      cau_hoi: questionText,
      cac_lua_chon: [optA, optB, optC, optD],
      dap_an_dung: dapAnDung,
      loi_giai: loiGiai
    });
  });

  if (questions.length === 0) {
    throw new Error('Không nhận dạng được câu hỏi nào từ file Excel. Vui lòng kiểm tra tiêu đề cột (Question Text / Option 1..4 / Correct Answer).');
  }

  return questions;
}

/**
 * 2. Parser cho file Word (.docx)
 * Hỗ trợ các mẫu đề thi trắc nghiệm phổ biến tại Việt Nam:
 * Câu 1: [Nội dung câu hỏi]
 * A. [Lựa chọn A]
 * B. [Lựa chọn B]
 * C. [Lựa chọn C]
 * D. [Lựa chọn D]
 * Đáp án: A/B/C/D
 * Lời giải: [Giải thích]
 */
function parseDocxBuffer(buffer) {
  const zip = new AdmZip(buffer);
  const docEntry = zip.getEntry('word/document.xml');
  if (!docEntry) {
    throw new Error('File .docx không hợp lệ hoặc bị lỗi cấu trúc (thiếu word/document.xml).');
  }

  const docXml = zip.readAsText(docEntry);

  // Trích xuất các đoạn văn bản (paragraphs)
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
  const paragraphs = [];
  let pMatch;
  while ((pMatch = pRegex.exec(docXml)) !== null) {
    const pContent = pMatch[1];
    let text = '';
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      text += tMatch[1];
    }
    const clean = text.trim();
    if (clean) paragraphs.push(clean);
  }

  if (paragraphs.length === 0) {
    throw new Error('File Word trống hoặc không có nội dung chữ.');
  }

  const questions = [];
  let currentQ = null;

  for (let i = 0; i < paragraphs.length; i++) {
    const line = paragraphs[i].trim();
    if (!line) continue;

    // Nhận dạng bắt đầu câu hỏi mới: "Câu 1:", "Câu 1.", "1.", "Quẻ 1:", v.v.
    const qHeaderMatch = line.match(/^(?:Câu|Quẻ|Bài|Question)\s*([0-9]+)\s*[:\.]\s*(.*)$/i) || line.match(/^([0-9]+)\s*[\.\:\)]\s*(.*)$/);

    if (qHeaderMatch) {
      if (currentQ && currentQ.cau_hoi) {
        questions.push(finalizeQuestion(currentQ, questions.length + 1));
      }
      currentQ = {
        que_so: `Quẻ #${qHeaderMatch[1]}`,
        chu_de: 'Khảo Nghiệm Giáo Lý',
        cau_hoi: qHeaderMatch[2] ? qHeaderMatch[2].trim() : '',
        cac_lua_chon: ['', '', '', ''],
        dap_an_dung: 0,
        loi_giai: ''
      };
      continue;
    }

    if (!currentQ) continue;

    // Nhận dạng lựa chọn A, B, C, D
    const optMatch = line.match(/^([A-D])\s*[\.\:\)]\s*(.*)$/i);
    if (optMatch) {
      const letter = optMatch[1].toUpperCase();
      const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
      if (idx !== -1) {
        currentQ.cac_lua_chon[idx] = optMatch[2].trim();
      }
      continue;
    }

    // Nhận dạng dòng chứa nhiều lựa chọn trên 1 dòng (ví dụ: "A. Xxx   B. Yyy   C. Zzz   D. Ttt")
    const multiOptMatches = [...line.matchAll(/([A-D])\s*[\.\:\)]\s*([^\s][^A-D\.\:\)]*?)(?=(?:[A-D]\s*[\.\:\)])|$)/gi)];
    if (multiOptMatches.length >= 2) {
      multiOptMatches.forEach(m => {
        const letter = m[1].toUpperCase();
        const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
        if (idx !== -1) currentQ.cac_lua_chon[idx] = m[2].trim();
      });
      continue;
    }

    // Nhận dạng Đáp án đúng: "Đáp án: A", "Đáp án đúng: C", "Key: B", v.v.
    const ansMatch = line.match(/^(?:Đáp\s*án(?:\s*đúng)?|Answer|Key)\s*[:\.]\s*([A-D0-9])/i);
    if (ansMatch) {
      currentQ.dap_an_dung = parseCorrectAnswerIndex(ansMatch[1]);
      continue;
    }

    // Nhận dạng Lời giải nghĩa: "Lời giải: ...", "Giải thích: ..."
    const expMatch = line.match(/^(?:Lời\s*giải|Giải\s*thích|Explanation)\s*[:\.]\s*(.*)$/i);
    if (expMatch) {
      currentQ.loi_giai = expMatch[1].trim();
      continue;
    }

    // Nếu không khớp các mẫu trên:
    // Nếu chưa có lựa chọn nào, đây là dòng nối tiếp của câu hỏi dài
    if (currentQ.cac_lua_chon[0] === '') {
      currentQ.cau_hoi += ' ' + line;
    } else if (currentQ.loi_giai) {
      currentQ.loi_giai += ' ' + line;
    }
  }

  // Đóng câu cuối cùng
  if (currentQ && currentQ.cau_hoi) {
    questions.push(finalizeQuestion(currentQ, questions.length + 1));
  }

  if (questions.length === 0) {
    throw new Error('Không trích xuất được câu hỏi nào từ file Word. Vui lòng định dạng: "Câu 1: ...", "A. ...", "B. ...", "C. ...", "D. ...", "Đáp án: ..."');
  }

  return questions;
}

function finalizeQuestion(q, id) {
  return {
    id,
    que_so: q.que_so || `Quẻ #${id}`,
    chu_de: q.chu_de || 'Giáo Lý Bửu Sơn Kỳ Hương',
    cau_hoi: cleanText(q.cau_hoi),
    cac_lua_chon: q.cac_lua_chon.map((c, i) => cleanText(c) || `Lựa chọn ${['A','B','C','D'][i]}`),
    dap_an_dung: Math.max(0, Math.min(3, parseInt(q.dap_an_dung) || 0)),
    loi_giai: cleanText(q.loi_giai)
  };
}

/**
 * 3. Thuật toán Trộn Đề Thi (Fisher-Yates Shuffle)
 * @param {Array} questions Danh sách câu hỏi
 * @param {Object} options { shuffleQuestions: true, shuffleOptions: true }
 */
function shuffleQuestionsList(questions, options = { shuffleQuestions: true, shuffleOptions: true }) {
  let list = JSON.parse(JSON.stringify(questions));

  // Trộn thứ tự các câu hỏi
  if (options.shuffleQuestions) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  // Trộn các lựa chọn A, B, C, D của từng câu và bảo toàn chỉ số đáp án đúng
  if (options.shuffleOptions) {
    list.forEach(q => {
      const originalOptions = [...q.cac_lua_chon];
      const correctText = originalOptions[q.dap_an_dung];

      // Đảo thứ tự lựa chọn
      for (let i = originalOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
      }

      q.cac_lua_chon = originalOptions;
      // Cập nhật lại dap_an_dung trỏ đúng lựa chọn đúng mới
      q.dap_an_dung = originalOptions.indexOf(correctText);
      if (q.dap_an_dung === -1) q.dap_an_dung = 0;
    });
  }

  // Cập nhật lại ID và Quẻ số theo thứ tự mới
  list.forEach((q, idx) => {
    q.id = idx + 1;
    q.que_so = `Quẻ #${idx + 1}`;
  });

  return list;
}

module.exports = {
  parseXlsxBuffer,
  parseDocxBuffer,
  shuffleQuestionsList
};
