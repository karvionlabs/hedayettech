const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'madrasa.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- ১. প্রতিষ্ঠান সেটিংস
    CREATE TABLE IF NOT EXISTS institution (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_bn TEXT NOT NULL,
      name_ar TEXT,
      name_en TEXT,
      code TEXT UNIQUE,
      muhtamim_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      established TEXT,
      license_expiry TEXT
    );

    -- ২. জামাত ও শ্রেণি
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_bn TEXT NOT NULL,
      name_ar TEXT,
      monthly_fee REAL DEFAULT 0,
      residential_fee REAL DEFAULT 0
    );

    -- ৩. শিক্ষার্থী ও ভর্তি
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admission_no TEXT UNIQUE NOT NULL,
      roll_no INTEGER NOT NULL,
      name_bn TEXT NOT NULL,
      name_ar TEXT,
      class_id INTEGER,
      residential INTEGER DEFAULT 1, -- 1: আবাসিক, 0: অনাবাসিক
      guardian_name TEXT NOT NULL,
      guardian_phone TEXT NOT NULL,
      blood_group TEXT,
      address TEXT,
      monthly_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    -- ৪. হিফজ ও আমল ট্র্যাকার
    CREATE TABLE IF NOT EXISTS hifz_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      sabaq_para INTEGER,
      sabaq_page INTEGER,
      sabaq_lines INTEGER,
      sabaq_status TEXT, -- মুমতাজ, জায়্যিদ জিদ্দান, জায়্যিদ, পুনরাবৃত্তি
      saat_sabaq_para INTEGER,
      amokhta_para INTEGER,
      mistake_count INTEGER DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- ৫. ক্যাশ খাতা ও আয়-ব্যয়
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_no TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL, -- INCOME (আয়), EXPENSE (ব্যয়)
      category TEXT NOT NULL, -- ছাত্র বেতন, লিল্লাহ দান, যাকাত, বোর্ডিং বাজার, উস্তাদ সম্মানী, বিদ্যুৎ বিল
      student_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'CASH', -- CASH, BKASH, NAGAD, BANK
      description TEXT,
      received_by TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- ৬. লিল্লাহ বোর্ডিং ও বাজার খাতা
    CREATE TABLE IF NOT EXISTS boarding_bazaar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL, -- চাল, ডাল, তেল, মাছ/মাংস, সবজি, মসলা
      quantity_kg REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_cost REAL NOT NULL,
      purchaser_name TEXT,
      memo_no TEXT
    );

    -- ৭. দৈনিক উপস্থিতি
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL, -- PRESENT (উপস্থিত), ABSENT (অনুপস্থিত), LEAVE (ছুটি)
      punch_time TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(student_id, date)
    );

    -- ৮. পরীক্ষা ও ফলাফল
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      session TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exam_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      subject_name TEXT NOT NULL,
      marks_obtained REAL NOT NULL,
      total_marks REAL DEFAULT 100,
      grade TEXT,
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- ৯. শিক্ষক ও স্টাফ পেরোল
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      phone TEXT NOT NULL,
      salary REAL NOT NULL,
      joining_date TEXT
    );

    -- ১০. ফ্রি ডেমো বুকিং ও লিডস (অ্যান্টি-স্প্যাম, রেট লিমিট ও সিকিউরড)
    CREATE TABLE IF NOT EXISTS demo_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasa_name TEXT NOT NULL,
      person_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      institution_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed sample data if empty
  const instCount = db.prepare('SELECT count(*) as count FROM institution').get();
  if (instCount.count === 0) {
    db.prepare(`
      INSERT INTO institution (name_bn, name_ar, name_en, code, muhtamim_name, phone, email, address, established, license_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'উম্মে কুলসুম (রাঃ) মহিলা ও কওমি মাদরাসা',
      'جامعة أم كلثوم الإسلامية',
      'Umme Kulsum Islamic Madrasa',
      'MDR-2026-01',
      'মাওলানা মুফতি আব্দুল্লাহ কারিব',
      '+880 1884-636312',
      'info@ummekulsum.edu.bd',
      'চান্দগাঁও, চট্টগ্রাম, বাংলাদেশ',
      '২০১৮',
      '২০২৭-১২-৩১'
    );

    // Classes
    const insertClass = db.prepare('INSERT INTO classes (name_bn, name_ar, monthly_fee, residential_fee) VALUES (?, ?, ?, ?)');
    insertClass.run('হিফজুল কুরআন বিভাগ', 'قسم حفظ القرآن', 1500, 3000);
    insertClass.run('নূরানি ও নাজেরা', 'قسم النوراني والناظرة', 800, 2500);
    insertClass.run('ইবতেদায়ী (১ম-৫ম)', 'القسم الابتدائي', 1000, 2800);
    insertClass.run('মুতাওয়াসসিতাহ (মিজান-নাহবেমীর)', 'المتوسطة', 1200, 3000);
    insertClass.run('ফজিলত ও দাওরায়ে হাদিস', 'فضيلة ودورة الحديث', 1500, 3200);

    // Students
    const insertStudent = db.prepare(`
      INSERT INTO students (admission_no, roll_no, name_bn, name_ar, class_id, residential, guardian_name, guardian_phone, blood_group, address, monthly_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStudent.run('DAKH-101', 1, 'মুহাম্মদ আবু বকর সিদ্দিক', 'محمد أبو بكر الصديق', 1, 1, 'মাওলানা নুরুল হক', '01811223344', 'A+', 'পদুয়া, সাতকানিয়া, চট্টগ্রাম', 4500);
    insertStudent.run('DAKH-102', 2, 'আব্দুর রহমান মারুফ', 'عبد الرحمن معروف', 1, 1, 'হাফেজ দেলোয়ার হোসেন', '01722334455', 'O+', 'চান্দগাঁও, চট্টগ্রাম', 4500);
    insertStudent.run('DAKH-103', 3, 'মুহাম্মদ উমর ফারুক', 'محمد عمر فاروق', 1, 1, 'ডা. লোকমান হাকিম', '01933445566', 'B+', 'লোহাগাড়া, চট্টগ্রাম', 4500);
    insertStudent.run('DAKH-104', 4, 'হাফেজ হাসান মাহমুদ', 'حسن محمود', 1, 1, 'মুহাম্মদ ইউনুস', '01844556677', 'AB+', 'পটিয়া, চট্টগ্রাম', 4500);
    insertStudent.run('DAKH-105', 5, 'মুহাম্মদ আব্দুল্লাহ আল-মামুন', 'عبد الله المأمون', 2, 0, 'মুহাম্মদ হারুন রশীদ', '01755667788', 'A+', 'বহদ্দারহাট, চট্টগ্রাম', 800);
    insertStudent.run('DAKH-106', 6, 'তাহমিদ হাসান তামিম', 'تهميد حسن تميم', 2, 1, 'মাওলানা মোজাম্মেল', '01666778899', 'O+', 'সাতকানিয়া, চট্টগ্রাম', 3300);
    insertStudent.run('DAKH-107', 7, 'মুহাম্মদ যুবায়ের হোসেন', 'محمد زبير حسين', 3, 1, 'কারী শফিকুল ইসলাম', '01877889900', 'B+', 'বাঁশখালী, চট্টগ্রাম', 3800);
    insertStudent.run('DAKH-108', 8, 'আহমদ উল্লাহ কায়সার', 'أحمد الله قيصر', 4, 1, 'মুফতি আলাউদ্দিন', '01788990011', 'A+', 'চকোরিয়া, কক্সবাজার', 4200);

    // Hifz Daily Logs
    const insertHifz = db.prepare(`
      INSERT INTO hifz_logs (student_id, date, sabaq_para, sabaq_page, sabaq_lines, sabaq_status, saat_sabaq_para, amokhta_para, mistake_count, remarks)
      VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertHifz.run(1, 15, 290, 15, 'মুমতাজ', 14, 8, 0, 'মাশাল্লাহ খুব সুন্দর তিলাওয়াত ও হরকতের মাখরাজ');
    insertHifz.run(2, 12, 235, 10, 'জায়্যিদ জিদ্দান', 11, 5, 1, 'সপ্তম আয়াতের গুন্নাহে সামান্য ভুল ছিল');
    insertHifz.run(3, 8, 155, 15, 'মুমতাজ', 7, 3, 0, 'সাবলীল ও চমৎকার মুখস্থ');
    insertHifz.run(4, 25, 490, 15, 'মুমতাজ', 24, 18, 0, 'আলহামদুলিল্লাহ শেষ পারায় পৌঁছাচ্ছে');

    // Transactions
    const insertTx = db.prepare(`
      INSERT INTO transactions (voucher_no, date, type, category, student_id, amount, payment_method, description, received_by)
      VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTx.run('V-1001', 'INCOME', 'ছাত্র বেতন', 1, 4500, 'BKASH', 'কার্তিক মাসের টিউশন ও মেস ফি', 'ক্যাশিয়ার রফিক');
    insertTx.run('V-1002', 'INCOME', 'লিল্লাহ দান', null, 15000, 'CASH', 'হাজী শামসুল আলম সাহেবের লিল্লাহ অনুদান', 'মুহতামিম সাহেব');
    insertTx.run('V-1003', 'INCOME', 'যাকাত তহবিল', null, 25000, 'BANK', 'রমজান পূর্ববর্তী এতিম ছাত্রদের খাদ্য সহায়তা', 'মুহতামিম সাহেব');
    insertTx.run('V-1004', 'EXPENSE', 'বোর্ডিং বাজার', null, 6850, 'CASH', 'সাপ্তাহিক চাল, ডাল, মাছ ও সবজি বাজার', 'বাবুর্চি কাসেম');
    insertTx.run('V-1005', 'EXPENSE', 'বিদ্যুৎ বিল', null, 3200, 'BKASH', 'অক্টোবর মাসের মাদরাসা ও মেস বিদ্যুৎ বিল', 'অফিস সহকারী');
    insertTx.run('V-1006', 'EXPENSE', 'উস্তাদ সম্মানী', null, 18000, 'BANK', 'হিফজ প্রধান উস্তাদের মাসিক হাদিয়া', 'ক্যাশিয়ার রফিক');

    // Boarding Bazaar
    const insertBazaar = db.prepare(`
      INSERT INTO boarding_bazaar (date, item_name, category, quantity_kg, unit_price, total_cost, purchaser_name, memo_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertBazaar.run(new Date().toISOString().slice(0, 10), 'মিনিকেট চাল (২ বস্তা)', 'চাল', 100, 72, 7200, 'মাওলানা কাসেম', 'MEMO-881');
    insertBazaar.run(new Date().toISOString().slice(0, 10), 'মসুর ডাল', 'ডাল', 15, 130, 1950, 'মাওলানা কাসেম', 'MEMO-882');
    insertBazaar.run(new Date().toISOString().slice(0, 10), 'রুই মাছ', 'মাছ/মাংস', 18, 280, 5040, 'মাওলানা কাসেম', 'MEMO-883');
    insertBazaar.run(new Date().toISOString().slice(0, 10), 'সয়াবিন তেল (৫ লিটার)', 'তেল', 10, 185, 1850, 'মাওলানা কাসেম', 'MEMO-884');

    // Attendance
    const insertAtt = db.prepare(`
      INSERT INTO attendance (student_id, date, status, punch_time)
      VALUES (?, date('now'), ?, time('now'))
    `);
    insertAtt.run(1, 'PRESENT');
    insertAtt.run(2, 'PRESENT');
    insertAtt.run(3, 'PRESENT');
    insertAtt.run(4, 'PRESENT');
    insertAtt.run(5, 'ABSENT');
    insertAtt.run(6, 'PRESENT');
    insertAtt.run(7, 'PRESENT');
    insertAtt.run(8, 'LEAVE');

    // Staff
    const insertStaff = db.prepare(`
      INSERT INTO staff (name, designation, phone, salary, joining_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStaff.run('মাওলানা মুফতি আব্দুল্লাহ কারিব', 'মুহতামিম ও শায়খুল হাদিস', '01884636312', 35000, '2019-01-01');
    insertStaff.run('হাফেজ কারী আহমাদুল্লাহ', 'প্রধান হিফজ উস্তাদ', '01712345678', 22000, '2020-03-15');
    insertStaff.run('মাওলানা উমর ফারুক', 'নাজেমে তালিমাত (শিক্ষা সচিব)', '01923456789', 24000, '2019-06-01');
    insertStaff.run('মুহাম্মদ রফিকুল ইসলাম', 'হিসাবরক্ষক ও ক্যাশিয়ার', '01834567890', 18000, '2021-02-10');
  }
}

initDatabase();

module.exports = db;
