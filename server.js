const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ১. ড্যাশবোর্ড এপিআই (Dashboard API)
// ==========================================
app.get('/api/dashboard', (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT count(*) as count FROM students WHERE status = 'ACTIVE'").get().count;
    const residentialCount = db.prepare("SELECT count(*) as count FROM students WHERE residential = 1 AND status = 'ACTIVE'").get().count;
    const nonResidentialCount = totalStudents - residentialCount;

    const totalStaff = db.prepare('SELECT count(*) as count FROM staff').get().count;
    const hifzStudents = db.prepare("SELECT count(*) as count FROM students WHERE class_id = 1 AND status = 'ACTIVE'").get().count;

    // Financial totals (This Month)
    const incomeThisMonth = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE type = 'INCOME' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get().total;

    const expenseThisMonth = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE type = 'EXPENSE' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get().total;

    // Today Attendance
    const todayPresent = db.prepare(`SELECT count(*) as count FROM attendance WHERE date = date('now') AND status = 'PRESENT'`).get().count;
    const todayAbsent = db.prepare(`SELECT count(*) as count FROM attendance WHERE date = date('now') AND status = 'ABSENT'`).get().count;

    // Recent 5 transactions
    const recentTransactions = db.prepare(`
      SELECT t.*, s.name_bn as student_name 
      FROM transactions t 
      LEFT JOIN students s ON t.student_id = s.id 
      ORDER BY t.id DESC LIMIT 5
    `).all();

    // Institution info
    const institution = db.prepare('SELECT * FROM institution LIMIT 1').get();

    res.json({
      success: true,
      stats: {
        totalStudents,
        residentialCount,
        nonResidentialCount,
        totalStaff,
        hifzStudents,
        incomeThisMonth,
        expenseThisMonth,
        balance: incomeThisMonth - expenseThisMonth,
        todayAttendance: {
          present: todayPresent,
          absent: todayAbsent,
          rate: totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0
        }
      },
      recentTransactions,
      institution
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ২. শিক্ষার্থী ও ভর্তি এপিআই (Students API)
// ==========================================
app.get('/api/students', (req, res) => {
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

app.post('/api/students', (req, res) => {
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

// ==========================================
// ৩. হিফজ ও আমল ট্র্যাকার এপিআই (Hifz API)
// ==========================================
app.get('/api/hifz', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT h.*, s.name_bn as student_name, s.admission_no, s.roll_no 
      FROM hifz_logs h
      JOIN students s ON h.student_id = s.id
      ORDER BY h.date DESC, h.id DESC
    `).all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/hifz', (req, res) => {
  try {
    const { student_id, date, sabaq_para, sabaq_page, sabaq_lines, sabaq_status, saat_sabaq_para, amokhta_para, mistake_count, remarks } = req.body;
    const insert = db.prepare(`
      INSERT INTO hifz_logs (student_id, date, sabaq_para, sabaq_page, sabaq_lines, sabaq_status, saat_sabaq_para, amokhta_para, mistake_count, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(student_id, date || new Date().toISOString().slice(0, 10), sabaq_para, sabaq_page, sabaq_lines, sabaq_status || 'মুমতাজ', saat_sabaq_para, amokhta_para, mistake_count || 0, remarks);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ৪. অ্যাকাডেমিক ও জামাত এপিআই (Academics API)
// ==========================================
app.get('/api/academics/classes', (req, res) => {
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

// ==========================================
// ৫. লিল্লাহ বোর্ডিং ও মেস এপিআই (Boarding API)
// ==========================================
app.get('/api/boarding', (req, res) => {
  try {
    const bazaar = db.prepare('SELECT * FROM boarding_bazaar ORDER BY date DESC, id DESC').all();
    const totalCost = db.prepare('SELECT COALESCE(SUM(total_cost), 0) as total FROM boarding_bazaar').get().total;
    const residentialStudents = db.prepare("SELECT count(*) as count FROM students WHERE residential = 1 AND status = 'ACTIVE'").get().count;

    res.json({
      success: true,
      bazaar,
      summary: {
        totalCost,
        residentialStudents,
        averageCostPerStudent: residentialStudents > 0 ? Math.round(totalCost / residentialStudents) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/boarding', (req, res) => {
  try {
    const { date, item_name, category, quantity_kg, unit_price, purchaser_name, memo_no } = req.body;
    const total_cost = (Number(quantity_kg) || 0) * (Number(unit_price) || 0);

    const insert = db.prepare(`
      INSERT INTO boarding_bazaar (date, item_name, category, quantity_kg, unit_price, total_cost, purchaser_name, memo_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(date || new Date().toISOString().slice(0, 10), item_name, category || 'অন্যান্য', quantity_kg, unit_price, total_cost, purchaser_name, memo_no);

    // Also auto-add to expense transactions
    const count = db.prepare('SELECT count(*) as count FROM transactions').get().count;
    db.prepare(`
      INSERT INTO transactions (voucher_no, date, type, category, amount, payment_method, description, received_by)
      VALUES (?, ?, 'EXPENSE', 'বোর্ডিং বাজার', ?, 'CASH', ?, ?)
    `).run(`V-${1000 + count + 1}`, date || new Date().toISOString().slice(0, 10), total_cost, `বোর্ডিং খাদ্যসামগ্রী: ${item_name}`, purchaser_name || 'বাবুর্চি');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ৬. হিসাব ও ক্যাশ খাতা এপিআই (Accounts API)
// ==========================================
app.get('/api/accounts/transactions', (req, res) => {
  try {
    const { type, category } = req.query;
    let query = `
      SELECT t.*, s.name_bn as student_name 
      FROM transactions t 
      LEFT JOIN students s ON t.student_id = s.id 
      WHERE 1=1
    `;
    const params = [];
    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }
    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }
    query += ` ORDER BY t.date DESC, t.id DESC`;

    const transactions = db.prepare(query).all(...params);
    const totalIncome = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'INCOME'`).get().total;
    const totalExpense = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'EXPENSE'`).get().total;

    res.json({
      success: true,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        netCash: totalIncome - totalExpense
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/accounts/transactions', (req, res) => {
  try {
    const { date, type, category, student_id, amount, payment_method, description, received_by } = req.body;
    const count = db.prepare('SELECT count(*) as count FROM transactions').get().count;
    const voucher_no = `V-${1000 + count + 1}`;

    const insert = db.prepare(`
      INSERT INTO transactions (voucher_no, date, type, category, student_id, amount, payment_method, description, received_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(voucher_no, date || new Date().toISOString().slice(0, 10), type, category, student_id || null, amount, payment_method || 'CASH', description, received_by);

    res.json({ success: true, voucher_no });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ৭. উপস্থিতি ও বায়োমেট্রিক এপিআই (Attendance API)
// ==========================================
app.get('/api/attendance', (req, res) => {
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

app.post('/api/attendance', (req, res) => {
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

// ==========================================
// ৮. শিক্ষক ও স্টাফ এপিআই (HR & Staff API)
// ==========================================
app.get('/api/staff', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff ORDER BY id ASC').all();
    const totalSalary = db.prepare('SELECT COALESCE(SUM(salary), 0) as total FROM staff').get().total;
    res.json({ success: true, staff, totalSalary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ৯. সেটিংস ও ব্যাকআপ এপিআই (Settings API)
// ==========================================
app.get('/api/settings', (req, res) => {
  try {
    const institution = db.prepare('SELECT * FROM institution LIMIT 1').get();
    res.json({ success: true, institution });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ১০. ফ্রি ডেমো বুকিং এপিআই (কঠোর ভ্যালিডেশন, অ্যান্টি-বট ও সিকিউরিটি)
// ==========================================
const demoIpRateLimiter = new Map(); // Simple in-memory rate limiter

// ইনপুট স্যানিটাইজার (XSS / SQL Injection প্রিভেনশন)
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>'"`;\\]/g, '') // remove HTML/SQL meta characters
    .trim();
}

app.post('/api/leads/demo', (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // ১. রেট লিমিট চেক (প্রতি ১০ মিনিটে সর্বোচ্চ ৫ বার)
    const now = Date.now();
    const rateData = demoIpRateLimiter.get(clientIp) || { count: 0, firstTime: now };
    if (now - rateData.firstTime > 10 * 60 * 1000) {
      rateData.count = 1;
      rateData.firstTime = now;
    } else {
      rateData.count += 1;
    }
    demoIpRateLimiter.set(clientIp, rateData);

    if (rateData.count > 5) {
      return res.status(429).json({
        success: false,
        error: 'NOT ALLOWED: অতিরিক্ত রিকোয়েস্ট করা হয়েছে! ১০ মিনিট পর পুনরায় চেষ্টা করুন।'
      });
    }

    const { madrasa_name, person_name, phone, institution_type, website_hp } = req.body;

    // ২. অ্যান্টি-বট হানিপট চেক (বট ট্র্যাপ)
    if (website_hp && website_hp.trim() !== '') {
      return res.status(403).json({
        success: false,
        error: 'NOT ALLOWED: স্বয়ংক্রিয় বট বা স্ক্রিপ্ট ব্লক করা হয়েছে!'
      });
    }

    // ৩. মাদরাসা বা স্কুলের নাম কঠোর চেক
    const cleanMadrasa = sanitizeInput(madrasa_name);
    if (!cleanMadrasa || cleanMadrasa.length < 3) {
      return res.status(400).json({
        success: false,
        field: 'demoMadrasaName',
        error: 'NOT ALLOWED: মাদরাসা বা স্কুলের নাম অন্তত ৩ অক্ষরের সঠিক নাম হতে হবে!'
      });
    }

    // ৪. নাম ও পদবী কঠোর চেক
    const cleanPerson = sanitizeInput(person_name);
    if (!cleanPerson || cleanPerson.length < 3) {
      return res.status(400).json({
        success: false,
        field: 'demoPersonName',
        error: 'NOT ALLOWED: আপনার নাম ও পদবী সঠিকভাবে পূরণ করা আবশ্যক!'
      });
    }

    // ৫. মোবাইল নম্বর কঠোর চেক (বাংলাদেশি ১১ সংখ্যার ফরম্যাট 01[3-9]XXXXXXXX)
    const cleanPhone = (phone || '').replace(/\D/g, ''); // শুধু সংখ্যা ফিল্টার
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone) || cleanPhone.length !== 11) {
      return res.status(400).json({
        success: false,
        field: 'demoPhone',
        error: 'NOT ALLOWED: মোবাইল নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 018XXXXXXXX)!'
      });
    }

    // ৬. প্রতিষ্ঠানের ধরণ কঠোর চেক
    const validTypes = ['কওমি মাদ্রাসা', 'আলিয়া মাদ্রাসা', 'হিফজখানা ও নূরানি', 'স্কুল ও কলেজ'];
    if (!institution_type || !validTypes.includes(institution_type.trim())) {
      return res.status(400).json({
        success: false,
        field: 'demoType',
        error: 'NOT ALLOWED: তালিকা থেকে সঠিক প্রতিষ্ঠানের ধরণ নির্বাচন করুন!'
      });
    }

    // ৭. ডাটাবেজে সংরক্ষণ (SQLite WAL)
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

// ডেমো লিডস তালিকা এপিআই (অ্যাডমিনদের জন্য)
app.get('/api/leads/demo', (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM demo_requests ORDER BY id DESC').all();
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/backup', (req, res) => {
  try {
    const tables = ['institution', 'classes', 'students', 'hifz_logs', 'transactions', 'boarding_bazaar', 'attendance', 'staff'];
    const backup = {};
    for (const tbl of tables) {
      backup[tbl] = db.prepare(`SELECT * FROM ${tbl}`).all();
    }
    res.setHeader('Content-Disposition', 'attachment; filename=madrasa_backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🕌 Madrasa Management System is LIVE!`);
  console.log(`🌐 Local Server: http://localhost:${PORT}`);
  console.log(`📁 Database: SQLite (WAL Mode active)`);
  console.log(`======================================================\n`);
});
