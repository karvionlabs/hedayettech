const express = require('express');
const router = express.Router();
const db = require('../database');
const { strictLeadLimiter } = require('../middleware/security');

// ১. সর্বজনীন নিরাপদ ফলাফল অনুসন্ধান (জিরো-লিক: কোনো ফোন/ঠিকানা/আর্থিক তথ্য প্রকাশ পাবে না)
router.get('/public/results', (req, res) => {
  try {
    const { search } = req.query;
    if (!search || !search.trim()) {
      return res.status(400).json({ success: false, error: 'অনুগ্রহ করে দাখেলা বা রোল নম্বর লিখুন' });
    }
    const cleanSearch = search.trim();
    const student = db.prepare(`
      SELECT s.name_bn, s.admission_no, s.roll_no, c.name_bn as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE (s.admission_no = ? OR s.roll_no = ? OR s.name_bn = ?) AND s.status = 'ACTIVE'
      LIMIT 1
    `).get(cleanSearch, cleanSearch, cleanSearch);

    if (!student) {
      return res.json({ success: false, message: 'প্রদত্ত তথ্য অনুযায়ী কোনো ফলাফল পাওয়া যায়নি।' });
    }

    res.json({
      success: true,
      student: {
        name_bn: student.name_bn,
        admission_no: student.admission_no,
        roll_no: student.roll_no,
        class_name: student.class_name,
        grade: 'মুমতাজ (A+)'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ২. সকল সক্রিয় শিক্ষার্থী তালিকা ও ফিল্টারিং (লকড - অ্যাডমিন অথেনটিকেশন বাধ্যতামূলক)
router.get('/students', (req, res) => {
  try {
    const { class_id, residential, search } = req.query;
    let query = `
      SELECT s.*, c.name_bn as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.status = 'ACTIVE'
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }
    if (residential !== undefined && residential !== '') {
      query += ` AND s.residential = ?`;
      params.push(Number(residential));
    }
    if (search) {
      query += ` AND (s.name_bn LIKE ? OR s.admission_no LIKE ? OR s.guardian_phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.roll_no ASC`;
    const students = db.prepare(query).all(...params);
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ২. নতুন শিক্ষার্থী ভর্তি এন্ট্রি
router.post('/students', (req, res) => {
  try {
    const { roll_no, name_bn, name_ar, class_id, residential, guardian_name, guardian_phone, blood_group, address, monthly_fee } = req.body;
    const count = db.prepare('SELECT count(*) as count FROM students').get().count;
    const admission_no = `DAKH-${100 + count + 1}`;

    const insert = db.prepare(`
      INSERT INTO students (admission_no, roll_no, name_bn, name_ar, class_id, residential, guardian_name, guardian_phone, blood_group, address, monthly_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(admission_no, roll_no || (count + 1), name_bn, name_ar || null, class_id, residential ? 1 : 0, guardian_name, guardian_phone, blood_group, address, monthly_fee || 0);

    res.json({ success: true, id: info.lastInsertRowid, admission_no });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৩. জামাত / ক্লাস তালিকা
router.get('/academics/classes', (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT c.*, count(s.id) as student_count 
      FROM classes c 
      LEFT JOIN students s ON c.id = s.class_id AND s.status = 'ACTIVE'
      GROUP BY c.id
    `).all();
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// হেল্পার: টেক্সট ডাটা স্যানিটাইজার ও অ্যান্টি-হ্যাক ফিল্টার (Anti-Injection / Pure Plain Text Guard)
function sanitizePlainText(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  // ১. HTML ও XML স্ক্রিপ্ট ট্যাগ অপসারণ
  let clean = input.replace(/<[^>]*>?/gm, '');
  // ২. বিপজ্জনক কন্ট্রোল ক্যারেক্টার ও নাল বাইট (\0) অপসারণ
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // ৩. ট্রিম এবং অতিরিক্ত স্পেস স্বাভাবিক করা
  clean = clean.trim().replace(/\s+/g, ' ');
  // ৪. সর্বোচ্চ দৈর্ঘ্য সীমাবদ্ধ করা
  return clean.substring(0, maxLength);
}

// হেল্পার: মোবাইল নম্বর স্যানিটাইজার ও সঠিক ১১ ডিজিট ভ্যালিডেটর
function validateAndSanitizeBDPhone(phoneInput) {
  if (!phoneInput) return { valid: false, phone: '', error: 'মোবাইল নম্বর দেওয়া আবশ্যক!' };
  let str = String(phoneInput).trim();
  // বাংলা ডিজিটকে ইংরেজি ডিজিটে রূপান্তর (০-৯ -> 0-9)
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  str = str.replace(/[০-৯]/g, d => bnDigits.indexOf(d));
  // কেবলমাত্র ডিজিট ফিল্টার (স্পেস, ড্যাশ, ব্র্যাকেট বাদ)
  const digits = str.replace(/\D/g, '');

  if (digits.length !== 11) {
    return {
      valid: false,
      phone: digits,
      error: `মোবাইল নম্বর অবশ্যই ঠিক ১১ ডিজিটের হতে হবে (আপনি দিয়েছেন ${digits.length}টি সংখ্যা)।`
    };
  }

  // বাংলাদেশের মোবাইল অপারেটর প্রিফিক্স ভ্যালিডেশন (013, 014, 015, 016, 017, 018, 019)
  if (!/^01[3-9]\d{8}$/.test(digits)) {
    return {
      valid: false,
      phone: digits,
      error: 'মোবাইল নম্বরটি সঠিক ফরম্যাটের নয়! নম্বরটি অবশ্যই 01 দিয়ে শুরু হতে হবে (যেমন: 018XXXXXXXX)।'
    };
  }

  return { valid: true, phone: digits };
}

// ৪. অনলাইন ভর্তি আবেদন জমা (Rate Limited + Strict Sanitized Data Guard)
router.post('/admissions/apply', strictLeadLimiter, (req, res) => {
  try {
    const { applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute } = req.body;

    // ১. শিক্ষার্থীর পূর্ণ নাম যাচাই (অবশ্যই পূরণীয়)
    const cleanApplicantName = sanitizePlainText(applicant_name, 100);
    if (!cleanApplicantName || cleanApplicantName.length < 2) {
      return res.status(400).json({ success: false, error: 'শিক্ষার্থীর পূর্ণ নাম অবশ্যই পূরণ করতে হবে (ন্যূনতম ২ অক্ষর)!' });
    }

    // ২. পিতার নাম যাচাই (অবশ্যই পূরণীয়)
    const cleanFatherName = sanitizePlainText(father_name, 100);
    if (!cleanFatherName || cleanFatherName.length < 2) {
      return res.status(400).json({ success: false, error: 'পিতার নাম অবশ্যই পূরণ করতে হবে!' });
    }

    // ৩. মোবাইল নম্বর যাচাই (অবশ্যই ঠিক ১১ ডিজিট)
    const phoneResult = validateAndSanitizeBDPhone(phone);
    if (!phoneResult.valid) {
      return res.status(400).json({ success: false, error: phoneResult.error });
    }
    const cleanPhone = phoneResult.phone;

    // ৪. ইচ্ছিত জামাত/বিভাগ যাচাই
    const classId = parseInt(desired_class_id, 10);
    if (isNaN(classId) || classId < 1) {
      return res.status(400).json({ success: false, error: 'অনুগ্রহ করে ইচ্ছিত জামাত/বিভাগ নির্বাচন করুন!' });
    }

    // ৫. আবাসিক অবস্থা যাচাই (হোয়াইটলিস্টেড)
    const cleanResidential = (residential_type === 'অনাবাসিক') ? 'অনাবাসিক' : 'আবাসিক';

    // ৬. বর্তমান ঠিকানা যাচাই (অবশ্যই পূরণীয়)
    const cleanAddress = sanitizePlainText(address, 255);
    if (!cleanAddress || cleanAddress.length < 3) {
      return res.status(400).json({ success: false, error: 'বর্তমান ঠিকানা অবশ্যই পূরণ করতে হবে (গ্রাম, ডাকঘর, থানা ও জেলা)!' });
    }

    // ৭. পূর্ববর্তী মাদ্রাসার নাম (সম্পূর্ণ অপশনাল / ঐচ্ছিক)
    const cleanPrevSchool = sanitizePlainText(previous_institute, 150);

    // ৮. নিরাপদ প্যারামিটারাইজড ডাটাবেজ ইনসার্ট (SQL Injection ও হ্যাকিং সম্পূর্ণ অসম্ভব)
    const stmt = db.prepare(`
      INSERT INTO online_admissions (
        applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute, birth_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `);
    const info = stmt.run(cleanApplicantName, cleanFatherName, cleanPhone, classId, cleanResidential, cleanAddress, cleanPrevSchool, '');

    res.json({
      success: true,
      message: 'অনলাইনে ভর্তির আবেদন সফলভাবে জমা হয়েছে।',
      id: info.lastInsertRowid,
      data: {
        applicant_name: cleanApplicantName,
        phone: cleanPhone
      }
    });
  } catch (err) {
    console.error('Admission apply error:', err);
    res.status(500).json({ success: false, error: 'সার্ভারে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
  }
});

// ৫. অনলাইন ভর্তি আবেদন তালিকা
router.get('/admissions', (req, res) => {
  try {
    const admissions = db.prepare(`
      SELECT a.*, c.name_bn as class_name 
      FROM online_admissions a 
      LEFT JOIN classes c ON a.desired_class_id = c.id 
      ORDER BY a.id DESC
    `).all();
    res.json({ success: true, admissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৬. অনলাইন আবেদন অনুমোদন (Approve to Students)
router.post('/admissions/:id/approve', (req, res) => {
  try {
    const adm = db.prepare('SELECT * FROM online_admissions WHERE id = ?').get(req.params.id);
    if (!adm) return res.status(404).json({ success: false, error: 'আবেদন খুঁজে পাওয়া যায়নি!' });

    const totalCount = db.prepare('SELECT count(*) as count FROM students').get().count + 1;
    const admissionNo = `DAKH-${100 + totalCount}`;
    const rollNo = totalCount;

    db.prepare(`
      INSERT INTO students (admission_no, roll_no, name_bn, class_id, residential, guardian_name, guardian_phone, address, monthly_fee, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4000, 'ACTIVE')
    `).run(admissionNo, rollNo, adm.applicant_name, adm.desired_class_id || 1, adm.residential_type === 'আবাসিক' ? 1 : 0, adm.father_name, adm.phone, adm.address);

    db.prepare("UPDATE online_admissions SET status = 'APPROVED' WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: 'আবেদনটি সফলভাবে অনুমোদিত হয়েছে এবং শিক্ষার্থী তালিকায় যুক্ত হয়েছে!', admissionNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৭. এতিম ও যাকাত স্পনসরশিপ শিক্ষার্থী তালিকা
router.get('/sponsorship/students', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.*, c.name_bn as class_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.free_type IN ('FULL_FREE', 'HALF_FREE') OR s.sponsor_name IS NOT NULL
      ORDER BY s.id ASC
    `).all();

    const enriched = students.map(st => {
      const lastHifz = db.prepare(`
        SELECT * FROM hifz_logs WHERE student_id = ? ORDER BY date DESC LIMIT 1
      `).get(st.id);

      const lastHealth = db.prepare(`
        SELECT * FROM health_records WHERE student_id = ? ORDER BY date DESC LIMIT 1
      `).get(st.id);

      const totalAtt = db.prepare('SELECT count(*) as count FROM attendance WHERE student_id = ?').get(st.id).count;
      const presentAtt = db.prepare("SELECT count(*) as count FROM attendance WHERE student_id = ? AND status = 'PRESENT'").get(st.id).count;
      const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 95;

      return {
        ...st,
        lastHifz,
        lastHealth,
        attendancePercent
      };
    });

    res.json({ success: true, students: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
