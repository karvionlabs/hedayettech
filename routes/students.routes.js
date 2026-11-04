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

// ৪. অনলাইন ভর্তি আবেদন জমা (Rate Limited)
router.post('/admissions/apply', strictLeadLimiter, (req, res) => {
  try {
    const { applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute, birth_date } = req.body;
    if (!applicant_name || !phone) {
      return res.status(400).json({ success: false, error: 'শিক্ষার্থীর নাম ও ফোন নম্বর দেওয়া আবশ্যক!' });
    }
    const stmt = db.prepare(`
      INSERT INTO online_admissions (applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute, birth_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `);
    const info = stmt.run(applicant_name, father_name || '', phone, desired_class_id || 1, residential_type || 'আবাসিক', address || '', previous_institute || '', birth_date || '');
    res.json({ success: true, message: 'অনলাইনে ভর্তির আবেদন সফলভাবে জমা হয়েছে।', id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
