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
  if (s === 'A' || s === '1' || s.startsWith('A') || s.includes('A')) return 0;
  if (s === 'B' || s === '2' || s.startsWith('B') || s.includes('B')) return 1;
  if (s === 'C' || s === '3' || s.startsWith('C') || s.includes('C')) return 2;
  if (s === 'D' || s === '4' || s.startsWith('D') || s.includes('D')) return 3;
  const num = parseInt(s);
  if (!isNaN(num) && num >= 1 && num <= 4) return num - 1;
  return 0;
}

/**
 * 1. Parser thông minh cho file Excel (.xlsx, .xls)
 * Tự động tìm đáp án đúng từ các dấu hiệu:
 * - Cột riêng: 'Correct Answer', 'Đáp án đúng', 'Key', 'Answer', 'Đ/A', 'Dap an'
 * - Hoặc dấu hiệu gắn liền trong các lựa chọn: dấu sao (*), [x], (đúng)
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
    // 1. Tìm trường câu hỏi
    const questionText = cleanText(
      row['Question Text'] || row['question'] || row['cau_hoi'] || row['Câu Hỏi'] || row['Câu hỏi'] ||
      row['Nội dung câu hỏi'] || row['Noi dung'] || row['DE_BAI'] || row['Đề bài'] || row['Nội dung'] || ''
    );

    if (!questionText) return; // Bỏ qua dòng trống

    // 2. Tìm các lựa chọn
    let optA = cleanText(row['Option 1'] || row['A'] || row['opt_a'] || row['Lua chon A'] || row['Lựa chọn A'] || row['Đáp án A'] || '');
    let optB = cleanText(row['Option 2'] || row['B'] || row['opt_b'] || row['Lua chon B'] || row['Lựa chọn B'] || row['Đáp án B'] || '');
    let optC = cleanText(row['Option 3'] || row['C'] || row['opt_c'] || row['Lua chon C'] || row['Lựa chọn C'] || row['Đáp án C'] || '');
    let optD = cleanText(row['Option 4'] || row['D'] || row['opt_d'] || row['Lua chon D'] || row['Lựa chọn D'] || row['Đáp án D'] || '');

    // 3. Tự động tìm đáp án đúng từ các dấu hiệu trong file Excel
    let dapAnDung = null;

    // Dấu hiệu A: Cột chỉ định đáp án đúng rõ ràng
    const rawAnswer = row['Correct Answer'] || row['dap_an_dung'] || row['Đáp án đúng'] || row['Dap an'] || 
                      row['Đáp án'] || row['Answer'] || row['Key'] || row['Đ/A'] || row['ĐA'] || row['Kết quả'] || '';

    if (rawAnswer !== '') {
      dapAnDung = parseCorrectAnswerIndex(rawAnswer);
    }

    // Dấu hiệu B: Dấu sao (*) hoặc [x] hoặc (đúng) gắn trong nội dung các phương án
    const opts = [optA, optB, optC, optD];
    opts.forEach((optStr, oIdx) => {
      if (/^\s*\*|\*\s*$|(?:\(\s*đúng\s*\))|\[x\]|(?:\*\s*đáp án đúng)/i.test(optStr)) {
        dapAnDung = oIdx;
        // Xóa dấu hiệu để nội dung hiển thị sạch đẹp
        opts[oIdx] = optStr.replace(/^\s*\*|\*\s*$|(?:\(\s*đúng\s*\))|\[x\]|(?:\*\s*đáp án đúng)/gi, '').trim();
      }
    });

    if (dapAnDung === null) {
      dapAnDung = 0; // Mặc định A nếu hoàn toàn không có dấu hiệu
    }

    // Quẻ số & Chủ đề
    const queSo = cleanText(row['que_so'] || row['Quẻ'] || row['Quẻ số'] || row['Số câu'] || row['STT'] || `Quẻ #${idx + 1}`);
    const chuDe = cleanText(row['chu_de'] || row['Chủ đề'] || row['Topic'] || row['Category'] || 'Khảo Nghiệm Bửu Sơn Kỳ Hương');
    const loiGiai = cleanText(row['loi_giai'] || row['Lời giải'] || row['Giải thích'] || row['Explanation'] || '');

    questions.push({
      id: idx + 1,
      que_so: queSo.startsWith('Quẻ') ? queSo : `Quẻ #${idx + 1}`,
      chu_de: chuDe,
      cau_hoi: questionText,
      cac_lua_chon: opts,
      dap_an_dung: dapAnDung,
      loi_giai: loiGiai
    });
  });

  if (questions.length === 0) {
    throw new Error('Không nhận dạng được câu hỏi nào từ file Excel. Vui lòng kiểm tra tiêu đề các cột.');
  }

  return questions;
}

/**
 * 2. Parser thông minh cho file Word (.docx)
 * Tự động tìm đáp án đúng từ TẤT CẢ các dấu hiệu trong file Word:
 * - Dấu hiệu 1: Dòng đáp án riêng: "Đáp án: A", "Đ/A: B", "Key: C", "Answer: D"
 * - Dấu hiệu 2: Dấu sao (*) ở đầu hoặc cuối lựa chọn: "*A. ...", "A.* ...", "A. ...*"
 * - Dấu hiệu 3: Thẻ XML định dạng in đậm (<w:b/>), gạch chân (<w:u/>), tô màu (<w:highlight/> hoặc <w:color/>) trên phương án đúng
 * - Dấu hiệu 4: Dấu hiệu văn bản: "[x]", "(x)", "(đúng)", "[đáp án đúng]"
 * - Dấu hiệu 5: Bảng đáp án ở cuối văn bản: "1.A 2.B 3.C..." hoặc "1-A, 2-B, 3-C..."
 */
function parseDocxBuffer(buffer) {
  const zip = new AdmZip(buffer);
  const docEntry = zip.getEntry('word/document.xml');
  if (!docEntry) {
    throw new Error('File .docx không hợp lệ hoặc bị lỗi cấu trúc (thiếu word/document.xml).');
  }

  const docXml = zip.readAsText(docEntry);

  // 1. Phân tích từng đoạn văn bản (<w:p>) cùng thông tin định dạng (in đậm, gạch chân)
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  const rRegex = /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g;
  const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

  const parsedParagraphs = [];
  let pMatch;

  while ((pMatch = pRegex.exec(docXml)) !== null) {
    const pContent = pMatch[1];
    let fullText = '';
    let hasBold = false;
    let hasUnderline = false;
    let hasHighlight = false;

    let rMatch;
    while ((rMatch = rRegex.exec(pContent)) !== null) {
      const rContent = rMatch[1];
      let rText = '';
      let tMatch;
      while ((tMatch = tRegex.exec(rContent)) !== null) {
        rText += tMatch[1];
      }
      fullText += rText;

      // Kiểm tra định dạng trên run
      if (/<w:b(?:\s|\/|>)/i.test(rContent)) hasBold = true;
      if (/<w:u\s/i.test(rContent)) hasUnderline = true;
      if (/<w:highlight\s/i.test(rContent) || /<w:color\s+w:val="(?:FF0000|008000|15803D|22C55E|D97706)"/i.test(rContent)) {
        hasHighlight = true;
      }
    }

    const clean = fullText.trim();
    if (clean) {
      parsedParagraphs.push({
        text: clean,
        hasBold,
        hasUnderline,
        hasHighlight
      });
    }
  }

  if (parsedParagraphs.length === 0) {
    throw new Error('File Word trống hoặc không có nội dung chữ.');
  }

  // 2. Tìm bảng đáp án ở cuối đề thi (nếu có) dạng: "1.A 2.B 3.C..." hoặc "1-A, 2-C..."
  const fullDocumentText = parsedParagraphs.map(p => p.text).join('\n');
  const endTableAnswers = new Map();
  const endTableMatch = [...fullDocumentText.matchAll(/(?:^|\s)([0-9]+)\s*[\.\:\-\/]\s*([A-D])(?:\s|$|,|;)/gi)];
  if (endTableMatch.length >= 3) {
    endTableMatch.forEach(m => {
      const qNum = parseInt(m[1]);
      const letter = m[2].toUpperCase();
      const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
      if (idx !== -1) endTableAnswers.set(qNum, idx);
    });
  }

  const questions = [];
  let currentQ = null;

  for (let i = 0; i < parsedParagraphs.length; i++) {
    const pObj = parsedParagraphs[i];
    const line = pObj.text.trim();
    if (!line) continue;

    // Nhận dạng câu hỏi mới: "Câu 1:", "Câu 1.", "Câu 1 (Quẻ 1):", "1.", "Question 1:"
    const qHeaderMatch = line.match(/^(?:Câu|Quẻ|Bài|Question)\s*([0-9]+)(?:\s*\([^)]*\))?\s*[\:\.\-]\s*(.*)$/i) 
                      || line.match(/^([0-9]+)\s*[\.\:\)\/]\s*(.*)$/);

    if (qHeaderMatch) {
      if (currentQ && currentQ.cau_hoi) {
        questions.push(finalizeQuestion(currentQ, questions.length + 1, endTableAnswers));
      }
      currentQ = {
        qNumber: parseInt(qHeaderMatch[1]) || (questions.length + 1),
        que_so: `Quẻ #${qHeaderMatch[1]}`,
        chu_de: 'Khảo Nghiệm Giáo Lý',
        cau_hoi: qHeaderMatch[2] ? qHeaderMatch[2].trim() : '',
        cac_lua_chon: ['', '', '', ''],
        foundCorrectIndex: null,
        loi_giai: ''
      };
      continue;
    }

    if (!currentQ) continue;

    // Nhận dạng lựa chọn A, B, C, D (hỗ trợ cả dấu sao *A, A*, A.*, [x] A)
    const optMatch = line.match(/^([\*\s]*[A-D][\*\s]*)\s*[\.\:\)]\s*(.*)$/i);
    if (optMatch) {
      const rawLetterPart = optMatch[1].toUpperCase();
      const letter = rawLetterPart.replace(/[^A-D]/g, '');
      const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
      if (idx !== -1) {
        let optText = optMatch[2].trim();
        // Kiểm tra dấu hiệu đáp án đúng:
        let isCorrect = false;

        // Dấu hiệu 1: Dấu sao ở chữ cái A, B, C, D (ví dụ: *A. hoặc A*. hoặc A.*)
        if (rawLetterPart.includes('*')) isCorrect = true;

        // Dấu hiệu 2: Dấu sao ở cuối text hoặc dấu hiệu [x], (đúng)
        if (/\*|\[x\]|\(x\)|\(đúng\)|\*đáp án đúng\*|\(✓ đáp án đúng\)/i.test(optText)) {
          isCorrect = true;
          optText = optText.replace(/\*|\[x\]|\(x\)|\(đúng\)|\*đáp án đúng\*|\(✓ đáp án đúng\)/gi, '').trim();
        }

        // Dấu hiệu 3: Đoạn văn có gạch chân hoặc highlight màu
        if (pObj.hasUnderline || pObj.hasHighlight) {
          isCorrect = true;
        }

        currentQ.cac_lua_chon[idx] = optText;
        if (isCorrect) currentQ.foundCorrectIndex = idx;
      }
      continue;
    }

    // Nhận dạng nhiều lựa chọn trên 1 dòng (ví dụ: "A. Xxx   B. Yyy   C. Zzz   D. Ttt")
    const multiOptMatches = [...line.matchAll(/(\*?\s*[A-D]\s*\*?)\s*[\.\:\)]\s*([^\s][^A-D\.\:\)]*?)(?=(?:(?:\*?\s*[A-D]\s*\*?)\s*[\.\:\)])|$)/gi)];
    if (multiOptMatches.length >= 2) {
      multiOptMatches.forEach(m => {
        const rawLetterPart = m[1].toUpperCase();
        const letter = rawLetterPart.replace(/[^A-D]/g, '');
        const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
        if (idx !== -1) {
          let optText = m[2].trim();
          let isCorrect = rawLetterPart.includes('*');
          if (/\*|\[x\]|\(x\)|\(đúng\)/i.test(optText)) {
            isCorrect = true;
            optText = optText.replace(/\*|\[x\]|\(x\)|\(đúng\)/gi, '').trim();
          }
          currentQ.cac_lua_chon[idx] = optText;
          if (isCorrect) currentQ.foundCorrectIndex = idx;
        }
      });
      continue;
    }

    // Nhận dạng dòng Đáp án riêng: "Đáp án: A", "Đ/A: B", "Key: C", "Answer: D"
    const ansMatch = line.match(/^(?:Đáp\s*án(?:\s*đúng)?|Answer|Key|Đ\/A|ĐA)\s*[:\.]\s*([A-D0-9])/i);
    if (ansMatch) {
      currentQ.foundCorrectIndex = parseCorrectAnswerIndex(ansMatch[1]);
      continue;
    }

    // Nhận dạng Lời giải nghĩa: "Lời giải: ...", "Giải thích: ..."
    const expMatch = line.match(/^(?:Lời\s*giải|Giải\s*thích|Explanation)\s*[:\.]\s*(.*)$/i);
    if (expMatch) {
      currentQ.loi_giai = expMatch[1].trim();
      continue;
    }

    // Nếu không khớp:
    // Nếu chưa có lựa chọn A, đây là dòng nối tiếp của đề câu hỏi dài
    if (currentQ.cac_lua_chon[0] === '') {
      currentQ.cau_hoi += ' ' + line;
    } else if (currentQ.loi_giai) {
      currentQ.loi_giai += ' ' + line;
    }
  }

  // Đóng câu cuối cùng
  if (currentQ && currentQ.cau_hoi) {
    questions.push(finalizeQuestion(currentQ, questions.length + 1, endTableAnswers));
  }

  if (questions.length === 0) {
    throw new Error('Không trích xuất được câu hỏi nào từ file Word. Vui lòng kiểm tra định dạng câu hỏi (Ví dụ: "Câu 1: ...", "A. ...", "B. ...", "Đáp án: ...").');
  }

  return questions;
}

function finalizeQuestion(q, id, endTableAnswers = new Map()) {
  let dapAn = 0;
  if (q.foundCorrectIndex !== null && q.foundCorrectIndex !== undefined) {
    dapAn = q.foundCorrectIndex;
  } else if (endTableAnswers.has(q.qNumber || id)) {
    dapAn = endTableAnswers.get(q.qNumber || id);
  }

  return {
    id,
    que_so: q.que_so || `Quẻ #${id}`,
    chu_de: q.chu_de || 'Giáo Lý Bửu Sơn Kỳ Hương',
    cau_hoi: cleanText(q.cau_hoi),
    cac_lua_chon: q.cac_lua_chon.map((c, i) => cleanText(c) || `Lựa chọn ${['A','B','C','D'][i]}`),
    dap_an_dung: Math.max(0, Math.min(3, parseInt(dapAn) || 0)),
    loi_giai: cleanText(q.loi_giai)
  };
}

/**
 * 3. Thuật toán Trộn Đề Thi (Fisher-Yates Shuffle)
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

/**
 * 4. Xuất danh sách câu hỏi ra file Excel (.xlsx) chuẩn Quizizz & Bảng điểm
 */
function exportQuestionsToXlsxBuffer(questions) {
  const rows = questions.map((q, idx) => {
    const opts = q.cac_lua_chon || ['', '', '', ''];
    const letter = ['A', 'B', 'C', 'D'][q.dap_an_dung || 0] || 'A';
    return {
      'STT': idx + 1,
      'Số Câu': `Câu ${idx + 1}`,
      'Chủ Đề': q.chu_de || 'Giáo Lý Bửu Sơn Kỳ Hương',
      'Question Text': q.cau_hoi || '',
      'Question Type': 'Multiple Choice',
      'Option 1': opts[0] || '',
      'Option 2': opts[1] || '',
      'Option 3': opts[2] || '',
      'Option 4': opts[3] || '',
      'Correct Answer': (q.dap_an_dung !== undefined ? q.dap_an_dung + 1 : 1),
      'Đáp Án Đúng': letter,
      'Lời Giải': q.loi_giai || ''
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'DeThi_BuuSonKyHuong');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * 5. Xuất danh sách câu hỏi ra file Word (.docx) chuẩn đề thi Việt Nam
 */
function exportQuestionsToDocxBuffer(questions) {
  const zip = new AdmZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let docBody = '';
  docBody += '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="8B1414"/></w:rPr><w:t>ĐỀ THI KHẢO NGHIỆM GIÁO LÝ BỬU SƠN KỲ HƯƠNG</w:t></w:r></w:p>';
  docBody += '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="555555"/></w:rPr><w:t>“Học Phật Tu Nhân • Tứ Đại Trọng Ân • Đạo Tràng Chánh Điện 50 Chỗ”</w:t></w:r></w:p>';
  docBody += '<w:p/>';

  questions.forEach((q, idx) => {
    const opts = q.cac_lua_chon || ['', '', '', ''];
    const letter = ['A', 'B', 'C', 'D'][q.dap_an_dung || 0] || 'A';

    // Đề bài
    docBody += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="8B1414"/></w:rPr><w:t>Câu ${idx + 1} (${escapeXml(q.chu_de || 'Giáo Lý')}): </w:t></w:r><w:r><w:rPr><w:sz w:val="26"/><w:b/></w:rPr><w:t>${escapeXml(q.cau_hoi || '')}</w:t></w:r></w:p>`;

    // 4 lựa chọn A, B, C, D (đánh dấu đáp án đúng rõ ràng bằng gạch chân và dấu sao)
    ['A', 'B', 'C', 'D'].forEach((l, oIdx) => {
      const isCorrect = (oIdx === (q.dap_an_dung || 0));
      const optText = escapeXml(opts[oIdx] || '');
      if (isCorrect) {
        docBody += `<w:p><w:r><w:rPr><w:b/><w:u w:val="single"/><w:color w:val="166534"/><w:sz w:val="24"/></w:rPr><w:t>*${l}. ${optText}  (✓ Đáp án đúng)</w:t></w:r></w:p>`;
      } else {
        docBody += `<w:p><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>${l}. ${optText}</w:t></w:r></w:p>`;
      }
    });

    // Dòng đáp án và lời giải
    docBody += `<w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/><w:sz w:val="24"/></w:rPr><w:t>Đáp án: ${letter}</w:t></w:r></w:p>`;
    if (q.loi_giai) {
      docBody += `<w:p><w:r><w:rPr><w:i/><w:color w:val="876214"/><w:sz w:val="22"/></w:rPr><w:t>Lời giải: ${escapeXml(q.loi_giai)}</w:t></w:r></w:p>`;
    }
    docBody += '<w:p/>';
  });

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docBody}
  </w:body>
</w:document>`;

  zip.addFile('[Content_Types].xml', Buffer.from(contentTypesXml, 'utf8'));
  zip.addFile('_rels/.rels', Buffer.from(relsXml, 'utf8'));
  zip.addFile('word/document.xml', Buffer.from(docXml, 'utf8'));

  return zip.toBuffer();
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  parseXlsxBuffer,
  parseDocxBuffer,
  shuffleQuestionsList,
  exportQuestionsToXlsxBuffer,
  exportQuestionsToDocxBuffer
};
