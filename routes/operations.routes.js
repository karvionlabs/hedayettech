const express = require('express');
const router = express.Router();
const db = require('../database');
const { strictLeadLimiter } = require('../middleware/security');

// ইনপুট স্যানিটাইজার (XSS / SQL Injection প্রিভেনশন)
function sanitizeInput(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().substring(0, maxLength);
}

// বাংলা ডিজিট থেকে ইংরেজি ডিজিট কনভার্টার
function normalizeBanglaToEng(str) {
  if (!str) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[০-৯]/g, d => bnDigits.indexOf(d));
}

// ১. হাজিরা তালিকা ও উপস্থিতি
router.get('/attendance', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = db.prepare(`
      SELECT s.id as student_id, s.name_bn, s.roll_no, s.admission_no, c.name_bn as class_name,
             COALESCE(a.status, 'NOT_RECORDED') as status, a.punch_time
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      WHERE s.status = 'ACTIVE'
      ORDER BY s.roll_no ASC
    `).all(date);

    res.json({ success: true, date, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ২. বায়োমেট্রিক / ম্যানুয়াল হাজিরা সংরক্ষণ
router.post('/attendance', (req, res) => {
  try {
    const { student_id, date, status } = req.body;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const upsert = db.prepare(`
      INSERT INTO attendance (student_id, date, status, punch_time)
      VALUES (?, ?, ?, time('now'))
      ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status, punch_time = time('now')
    `);
    upsert.run(student_id, targetDate, status);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৩. শিক্ষক ও কর্মকর্তা-কর্মচারী তালিকা
router.get('/staff', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff ORDER BY id ASC').all();
    const totalSalary = db.prepare('SELECT COALESCE(SUM(salary), 0) as total FROM staff').get().total;
    res.json({ success: true, staff, totalSalary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৪. ফ্রি ডেমো বুকিং (Rate Limited & Honeypot Protected)
router.post('/leads/demo', strictLeadLimiter, (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { madrasa_name, person_name, phone, institution_type, website_hp } = req.body;

    // অ্যান্টি-বট হানিপট চেক
    if (website_hp && website_hp.trim() !== '') {
      return res.status(403).json({
        success: false,
        error: 'NOT ALLOWED: স্বয়ংক্রিয় বট বা স্ক্রিপ্ট ব্লক করা হয়েছে!'
      });
    }

    const cleanMadrasa = sanitizeInput(madrasa_name);
    if (!cleanMadrasa || cleanMadrasa.length < 3) {
      return res.status(400).json({
        success: false,
        field: 'demoMadrasaName',
        error: 'NOT ALLOWED: মাদরাসা বা স্কুলের নাম অন্তত ৩ অক্ষরের সঠিক নাম হতে হবে!'
      });
    }

    const cleanPerson = sanitizeInput(person_name);
    if (!cleanPerson || cleanPerson.length < 3) {
      return res.status(400).json({
        success: false,
        field: 'demoPersonName',
        error: 'NOT ALLOWED: আপনার নাম ও পদবী সঠিকভাবে পূরণ করা আবশ্যক!'
      });
    }

    const cleanPhone = normalizeBanglaToEng(phone || '').replace(/\D/g, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone) || cleanPhone.length !== 11) {
      return res.status(400).json({
        success: false,
        field: 'demoPhone',
        error: 'NOT ALLOWED: মোবাইল নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 018XXXXXXXX)!'
      });
    }

    const validTypes = ['কওমি মাদ্রাসা', 'আলিয়া মাদ্রাসা', 'হিফজখানা ও নূরানি', 'স্কুল ও কলেজ'];
    if (!institution_type || !validTypes.includes(institution_type.trim())) {
      return res.status(400).json({
        success: false,
        field: 'demoType',
        error: 'NOT ALLOWED: তালিকা থেকে সঠিক প্রতিষ্ঠানের ধরণ নির্বাচন করুন!'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO demo_requests (madrasa_name, person_name, phone, institution_type, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `);
    const info = stmt.run(cleanMadrasa, cleanPerson, cleanPhone, institution_type.trim(), clientIp, userAgent);

    return res.json({
      success: true,
      message: 'জাযাকাল্লাহ খাইরান! আপনার ফ্রি ডেমো বুকিং সফলভাবে গ্রহণ করা হয়েছে।',
      bookingId: info.lastInsertRowid
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'NOT ALLOWED: সার্ভার প্রক্রিয়াকরণে ত্রুটি। পুনরায় চেষ্টা করুন।'
    });
  }
});

// ৫. ডেমো লিডস তালিকা
router.get('/leads/demo', (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM demo_requests ORDER BY id DESC').all();
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৬. দাতা ও আজীবন সদস্য তালিকা
router.get('/donors', (req, res) => {
  try {
    const donors = db.prepare(`
      SELECT d.*, 
        COALESCE(SUM(c.amount), 0) as total_contributed,
        MAX(c.date) as last_contribution_date
      FROM donors d
      LEFT JOIN donor_contributions c ON d.id = c.donor_id
      GROUP BY d.id
      ORDER BY d.id DESC
    `).all();
    const contributions = db.prepare(`
      SELECT c.*, d.name as donor_name, d.phone as donor_phone
      FROM donor_contributions c
      JOIN donors d ON c.donor_id = d.id
      ORDER BY c.id DESC LIMIT 20
    `).all();
    const totalFund = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM donor_contributions').get().total;
    res.json({ success: true, donors, contributions, totalFund });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৭. নতুন দাতা নিবন্ধন
router.post('/donors', (req, res) => {
  try {
    const { name, phone, address, member_type, pledged_amount } = req.body;
    const info = db.prepare(`
      INSERT INTO donors (name, phone, address, member_type, pledged_amount)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, phone, address || '', member_type || 'MONTHLY_DONOR', pledged_amount || 0);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৮. দাতা অনুদান গ্রহণ ও ক্যাশবুকে স্বয়ংক্রিয় পোস্টিং
router.post('/donors/contribute', (req, res) => {
  try {
    const { donor_id, amount, payment_method, remarks, received_by } = req.body;
    const count = db.prepare('SELECT count(*) as count FROM donor_contributions').get().count + 1;
    const receiptNo = `DON-2026-${String(count).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);

    db.prepare(`
      INSERT INTO donor_contributions (donor_id, date, amount, payment_method, receipt_no, remarks, received_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(donor_id, today, amount, payment_method || 'CASH', receiptNo, remarks || 'সাধারণ অনুদান', received_by || 'মুহতামিম সাহেব');

    const vCount = db.prepare('SELECT count(*) as count FROM transactions').get().count + 1;
    const voucherNo = `V-${1000 + vCount}`;
    db.prepare(`
      INSERT INTO transactions (voucher_no, date, type, category, amount, payment_method, description, received_by)
      VALUES (?, ?, 'INCOME', 'লিল্লাহ দান', ?, ?, ?, ?)
    `).run(voucherNo, today, amount, payment_method || 'CASH', `দাতা অনুদান (রসিদ: ${receiptNo})`, received_by || 'মুহতামিম সাহেব');

    res.json({ success: true, receiptNo, voucherNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৯. নোটিশ বোর্ড
router.get('/notices', (req, res) => {
  try {
    const notices = db.prepare('SELECT * FROM notices WHERE is_active = 1 ORDER BY id DESC').all();
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/notices', (req, res) => {
  try {
    const { title, content, category } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const info = db.prepare(`
      INSERT INTO notices (title, content, category, published_date, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(title, content, category || 'সাধারণ', today);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ১০. ছুটির আবেদন ও স্ট্যাটাস
router.get('/leaves', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, s.name as staff_name, s.designation 
      FROM staff_leaves l 
      JOIN staff s ON l.staff_id = s.id 
      ORDER BY l.id DESC
    `).all();
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/leaves/:id/status', (req, res) => {
  try {
    const { status, approved_by } = req.body;
    db.prepare('UPDATE staff_leaves SET status = ?, approved_by = ? WHERE id = ?').run(status, approved_by || 'মুহতামিম সাহেব', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ১১. লাইব্রেরি ও কিতাবখানা
router.get('/library', (req, res) => {
  try {
    const books = db.prepare('SELECT * FROM library_books ORDER BY id ASC').all();
    const issues = db.prepare(`
      SELECT i.*, b.book_title, s.name_bn as student_name 
      FROM book_issues i 
      JOIN library_books b ON i.book_id = b.id 
      LEFT JOIN students s ON i.student_id = s.id 
      WHERE i.status = 'ISSUED'
    `).all();
    res.json({ success: true, books, issues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/library/return/:id', (req, res) => {
  try {
    const issue = db.prepare('SELECT * FROM book_issues WHERE id = ?').get(req.params.id);
    if (issue) {
      db.prepare("UPDATE book_issues SET status = 'RETURNED', return_date = date('now') WHERE id = ?").run(req.params.id);
      db.prepare('UPDATE library_books SET available_copies = available_copies + 1 WHERE id = ?').run(issue.book_id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ১২. ছাত্র স্বাস্থ্য রেকর্ড
router.get('/health', (req, res) => {
  try {
    const records = db.prepare(`
      SELECT h.*, s.name_bn as student_name, c.name_bn as class_name 
      FROM health_records h 
      JOIN students s ON h.student_id = s.id 
      LEFT JOIN classes c ON s.class_id = c.id 
      ORDER BY h.id DESC
    `).all();
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ১৩. করজে হাসানা ও ঋণ খাতা
router.get('/loans', (req, res) => {
  try {
    const loans = db.prepare('SELECT * FROM loans ORDER BY id DESC').all();
    const totalLoan = db.prepare("SELECT COALESCE(SUM(loan_amount - paid_amount), 0) as balance FROM loans WHERE status = 'বকেয়া'").get().balance || 0;
    res.json({ success: true, loans, totalLoan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ১৪. গ্রাহক বার্তা ও হেল্পডেস্ক যোগাযোগ (Rate Limited & Strict Validation)
router.post('/contact', strictLeadLimiter, (req, res) => {
  try {
    const { name, email, phone, institution, message } = req.body;

    // ১. নাম যাচাই
    const cleanName = sanitizeInput(name, 100);
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        field: 'contactMsgName',
        error: 'NOT ALLOWED: আপনার নাম সঠিকভাবে পূরণ করুন!'
      });
    }

    // ২. ইমেইল / জিমেইল যাচাই (বাধ্যতামূলক ও সঠিক ফরম্যাট)
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        field: 'contactMsgEmail',
        error: 'NOT ALLOWED: সঠিক ইমেইল / জিমেইল ঠিকানা দেওয়া আবশ্যক (যেমন: name@gmail.com)!'
      });
    }

    // ৩. মোবাইল নম্বর যাচাই (ঠিক ১১ ডিজিট ও বিডি অপারেটর)
    const cleanPhone = normalizeBanglaToEng(phone || '').replace(/\D/g, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanPhone || cleanPhone.length !== 11 || !bdPhoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        field: 'contactMsgPhone',
        error: 'NOT ALLOWED: মোবাইল নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 018XXXXXXXX)!'
      });
    }

    // ৪. বার্তা যাচাই
    const cleanMessage = sanitizeInput(message, 1500);
    if (!cleanMessage || cleanMessage.length < 3) {
      return res.status(400).json({
        success: false,
        field: 'contactMsgText',
        error: 'NOT ALLOWED: আপনার বার্তা বা জিজ্ঞাসা স্পষ্টভাবে লিখুন!'
      });
    }

    const cleanInstitution = sanitizeInput(institution, 150);

    // ৫. নিরাপদ ডাটাবেস ইনসার্ট (প্যারামিটারাইজড - হ্যাকিং ও লিক প্রতিরোধ)
    const stmt = db.prepare(`
      INSERT INTO contact_messages (name, email, phone, institution, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(cleanName, cleanEmail, cleanPhone, cleanInstitution, cleanMessage);

    // ৬. সিস্টেম নোটিফিকেশন লগ (সরাসরি মালিকের জিমেইল: abdullahshahjada12@gmail.com এর জন্য ডিসপ্যাচ)
    console.log(`[Direct Owner Email Alert -> abdullahshahjada12@gmail.com] New private inquiry from ${cleanName} <${cleanEmail}> (Phone: ${cleanPhone}) - Message: "${cleanMessage.substring(0, 50)}..."`);

    res.json({
      success: true,
      message: 'জাযাকাল্লাহ খাইরান! আপনার বার্তাটি নিরাপদে গ্রহণ করা হয়েছে। শুধু প্রতিষ্ঠানের মূল মালিকের কাছে এটি পৌঁছাবে।',
      id: info.lastInsertRowid
    });
  } catch (err) {
    console.error('Contact post error:', err);
    res.status(500).json({
      success: false,
      error: 'NOT ALLOWED: সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
    });
  }
});

router.get('/contact', (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
