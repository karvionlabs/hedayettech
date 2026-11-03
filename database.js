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

    -- ১১. অনলাইন শিক্ষার্থী ভর্তি আবেদন (পাবলিক ফরম ও অনুমোদন প্যানেল)
    CREATE TABLE IF NOT EXISTS online_admissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      father_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      desired_class_id INTEGER,
      residential_type TEXT DEFAULT 'আবাসিক',
      address TEXT,
      previous_institute TEXT,
      birth_date TEXT,
      status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (desired_class_id) REFERENCES classes(id)
    );

    -- ১২. আজীবন সদস্য ও নিয়মিত দাতা ফান্ড (কওমি ডোনেশন ও চাঁদা)
    CREATE TABLE IF NOT EXISTS donors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      member_type TEXT DEFAULT 'MONTHLY_DONOR', -- LIFETIME (আজীবন), MONTHLY_DONOR (মাসিক দাতা), GENERAL (সাধারণ)
      pledged_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS donor_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'BKASH',
      receipt_no TEXT UNIQUE,
      remarks TEXT,
      received_by TEXT,
      FOREIGN KEY (donor_id) REFERENCES donors(id)
    );

    -- ১৩. ডিজিটাল নোটিশ বোর্ড
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'সাধারণ', -- সাধারণ, ছুটি, পরীক্ষা, মাহফিল, জরুরি
      published_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ১৪. উস্তাদ ও কর্মচারীদের ছুটির আবেদন ও অনুমোদন
    CREATE TABLE IF NOT EXISTS staff_leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL, -- অসুস্থতা, জরুরি প্রয়োজন, পারিবারিক
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days INTEGER NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
      approved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    -- ১৫. কিতাবখানা (মাদ্রাসার লাইব্রেরি ও কিতাব ইস্যু রেজিস্টার)
    CREATE TABLE IF NOT EXISTS library_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_title TEXT NOT NULL,
      author TEXT,
      category TEXT NOT NULL, -- তাফসির, হাদিস, ফিকহ, আরবি ব্যাকরণ, সাধারণ
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      shelf_no TEXT,
      barcode TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS book_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      student_id INTEGER,
      staff_id INTEGER,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      status TEXT DEFAULT 'ISSUED', -- ISSUED, RETURNED
      FOREIGN KEY (book_id) REFERENCES library_books(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    -- ১৬. ছাত্র স্বাস্থ্য ও চিকিৎসা খাতা (সিক-বে ট্র্যাকার)
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      treatment TEXT,
      medicine_cost REAL DEFAULT 0,
      doctor_name TEXT,
      status TEXT DEFAULT 'সুস্থ', -- চিকিৎসাধীন, সুস্থ
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- ১৭. করজে হাসানা ও ঋণ খাতা (মাদ্রাসা ঋণ ট্র্যাকার)
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      phone TEXT,
      loan_amount REAL NOT NULL,
      loan_date TEXT NOT NULL,
      due_date TEXT,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'বকেয়া', -- বকেয়া, পরিশোধিত
      description TEXT
    );

    -- ১৮. কন্টাক্ট ও ইনকোয়ারি বার্তা (গ্রাহক সহায়তা ও অনুসন্ধান)
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      institution TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ১৯. কোরবানির চামড়া ও কালেকশন ক্যাম্পেইন (QURBANI CAMPAIGN)
    CREATE TABLE IF NOT EXISTS qurbani_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_title TEXT NOT NULL, -- যেমন: 'ঈদুল আজহা ২০২৬ / ১৪৪৭ হি.'
      start_date TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS qurbani_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      team_name TEXT NOT NULL, -- যেমন: 'দল ১ - চকবাজার এলাকা'
      leader_name TEXT NOT NULL, -- দায়িত্বপ্রাপ্ত উস্তাদের নাম
      cow_count INTEGER DEFAULT 0,
      goat_count INTEGER DEFAULT 0,
      sheep_count INTEGER DEFAULT 0,
      area_name TEXT,
      entry_date TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES qurbani_campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS qurbani_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      expense_type TEXT NOT NULL, -- 'লবণ ক্রয়', 'গাড়ি ভাড়া / পরিবহন', 'কুলি ও লেবার মজুরি', 'অন্যান্য'
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (campaign_id) REFERENCES qurbani_campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS qurbani_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      buyer_name TEXT NOT NULL, -- আড়তদার / ট্যানারি প্রতিনিধির নাম
      phone TEXT,
      total_cow_sold INTEGER DEFAULT 0,
      total_goat_sold INTEGER DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL,
      sale_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'CASH',
      FOREIGN KEY (campaign_id) REFERENCES qurbani_campaigns(id)
    );

    -- ২০. আবাসিক ছাত্র খুরুজ ও সিকিউরিটি গেটপাস (STUDENT KHURUJ & GATEPASS)
    CREATE TABLE IF NOT EXISTS student_gatepasses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      pass_no TEXT UNIQUE,
      leave_reason TEXT NOT NULL, -- 'পারিবারিক অনুষ্ঠান', 'চিকিৎসা', 'ছুটি'
      departure_time TEXT NOT NULL,
      expected_return TEXT NOT NULL,
      actual_return TEXT,
      approved_by TEXT NOT NULL,
      guardian_phone TEXT,
      status TEXT DEFAULT 'APPROVED', -- 'APPROVED', 'DEPARTED', 'RETURNED'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );
  `);

  // সেফলি স্টুডেন্ট টেবিলে মুফত / স্পন্সর কলাম চেক ও এড
  try {
    db.prepare("ALTER TABLE students ADD COLUMN free_type TEXT DEFAULT 'GENERAL'").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE students ADD COLUMN sponsor_name TEXT").run();
  } catch (e) {}

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

  // নতুন মডিউলসমূহের জন্য স্যাম্পল ডাটা সিড
  const donorCount = db.prepare('SELECT count(*) as count FROM donors').get();
  if (donorCount.count === 0) {
    // ১. আজীবন সদস্য ও দাতা
    const insDonor = db.prepare('INSERT INTO donors (name, phone, address, member_type, pledged_amount) VALUES (?, ?, ?, ?, ?)');
    insDonor.run('হাজী শামসুল আলম', '01819123456', 'চান্দগাঁও, চট্টগ্রাম', 'LIFETIME', 100000);
    insDonor.run('আলহাজ্ব মো: লোকমান সওদাগর', '01711234567', 'চকবাজার, চট্টগ্রাম', 'MONTHLY_DONOR', 5000);
    insDonor.run('ইঞ্জি. মো: কামরুল ইসলাম', '01912345678', 'দুবাই প্রবাসী (সাতকানিয়া)', 'MONTHLY_DONOR', 10000);

    const insContrib = db.prepare("INSERT INTO donor_contributions (donor_id, date, amount, payment_method, receipt_no, remarks, received_by) VALUES (?, date('now'), ?, ?, ?, ?, ?)");
    insContrib.run(1, 25000, 'BANK', 'DON-2026-001', 'আজীবন সদস্যপদের প্রথম কিস্তির অনুদান', 'মুহতামিম সাহেব');
    insContrib.run(2, 5000, 'BKASH', 'DON-2026-002', 'নভেম্বর মাসের নিয়মিত মাসিক চাঁদা', 'ক্যাশিয়ার রফিক');
    insContrib.run(3, 10000, 'BANK', 'DON-2026-003', 'এতিমখানা লিল্লাহ বোর্ডিং ফান্ডে প্রবাসী অনুদান', 'মুহতামিম সাহেব');

    // ২. অনলাইন ভর্তি আবেদন
    const insAdm = db.prepare('INSERT INTO online_admissions (applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute, birth_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insAdm.run('মুহাম্মদ তাওহীদুর রহমান', 'মাওলানা সাইফুল্লাহ', '01855667788', 1, 'আবাসিক', 'পটিয়া, চট্টগ্রাম', 'নূরানি মক্তব চান্দগাঁও', '2014-05-12', 'PENDING');
    insAdm.run('তাহমিদ আহমেদ সাকিব', 'হাফেজ দেলোয়ার হোসেন', '01733445566', 2, 'অনাবাসিক', 'বহদ্দারহাট, চট্টগ্রাম', 'মডেল স্কুল বহদ্দারহাট', '2016-08-20', 'PENDING');

    // ৩. ডিজিটাল নোটিশ বোর্ড
    const insNotice = db.prepare("INSERT INTO notices (title, content, category, published_date, is_active) VALUES (?, ?, ?, date('now'), 1)");
    insNotice.run('আসন্ন দ্বিতীয় সাময়িক পরীক্ষার সময়সূচি ঘোষণা', 'সকল বিভাগের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ১৫ ডিসেম্বর হতে দ্বিতীয় সাময়িক পরীক্ষা শুরু হবে। সকল শিক্ষার্থীকে নির্ধারিত সময়ের পূর্বে ফি পরিশোধ করে প্রবেশপত্র সংগ্রহের নির্দেশ দেওয়া হলো।', 'পরীক্ষা');
    insNotice.run('পবিত্র মাহে রমজান ও ঈদুল ফিতরের দীর্ঘ ছুটি সংক্রান্ত নোটিশ', 'পবিত্র রমজানুল মুবারক উপলক্ষে আগামী ২০ রমজান হতে ঈদুল ফিতরের পর ৫ শাওয়াল পর্যন্ত মাদ্রাসার সকল শিক্ষা কার্যক্রম বন্ধ থাকিবে।', 'ছুটি');
    insNotice.run('মাদ্রাসার বার্ষিক ওয়াজ মাহফিল ও দস্তারবন্দী সম্মেলন', 'আগামী ২৮ জানুয়ারি রোজ শুক্রবার মাদ্রাসার বার্ষিক ইসলামী মহাসম্মেলন ও কুরআন হিফজ সমাপ্তকারী ছাত্রদের দস্তারবন্দী অনুষ্ঠিত হইবে। সকল ধর্মপ্রাণ মুসলিম ভাইকে উপস্থিত থাকার জন্য দাওয়াত দেওয়া হলো।', 'মাহফিল');

    // ৪. উস্তাদদের ছুটির আবেদন
    const insLeave = db.prepare('INSERT INTO staff_leaves (staff_id, leave_type, start_date, end_date, total_days, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insLeave.run(2, 'জরুরি প্রয়োজন', '2026-11-10', '2026-11-12', 3, 'পারিবারিক জরুরি কাজের জন্য গ্রামের বাড়ি সাতকানিয়া গমন', 'APPROVED', 'মুহতামিম সাহেব');
    insLeave.run(3, 'অসুস্থতা', '2026-11-05', '2026-11-06', 2, 'তীব্র মৌসুমি জ্বরের কারণে বিশ্রাম প্রয়োজন', 'PENDING', null);

    // ৫. কিতাবখানা (লাইব্রেরি)
    const insBook = db.prepare('INSERT INTO library_books (book_title, author, category, total_copies, available_copies, shelf_no, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insBook.run('সহিহ বুখারী শরিফ (পূর্ণাঙ্গ ৪ খণ্ড)', 'ইমাম বুখারী (রহ.)', 'হাদিস', 5, 4, 'SHELF-A1', 'BK-HAD-001');
    insBook.run('তাফসিরে জালালাইন', 'জালালুদ্দিন সুয়ূতী (রহ.)', 'তাফসির', 8, 7, 'SHELF-B2', 'BK-TAF-002');
    insBook.run('কানযুদ দাকায়িক', 'ইমাম নাসাফী (রহ.)', 'ফিকহ', 10, 9, 'SHELF-C1', 'BK-FIQ-003');
    insBook.run('মিজানুস সরফ ও মুনশাইব', 'সিরাজুদ্দিন (রহ.)', 'আরবি ব্যাকরণ', 15, 14, 'SHELF-D3', 'BK-ARB-004');

    const insIssue = db.prepare("INSERT INTO book_issues (book_id, student_id, staff_id, issue_date, due_date, status) VALUES (?, ?, ?, date('now'), date('now', '+15 days'), 'ISSUED')");
    insIssue.run(1, 1, null);
    insIssue.run(2, 4, null);

    // ৬. ছাত্র স্বাস্থ্য ও সিক-বে খাতা
    const insHealth = db.prepare("INSERT INTO health_records (student_id, date, symptoms, treatment, medicine_cost, doctor_name, status) VALUES (?, date('now'), ?, ?, ?, ?, ?)");
    insHealth.run(2, 'তীব্র মৌসুমি সর্দি ও জ্বর (১০২° ফারেনহাইট)', 'প্যারাসিটামল ট্যাবলেট ও ওরাল স্যালাইন প্রদান করা হয়েছে', 150, 'ডা. মুবিন চৌধুরী', 'চিকিৎসাধীন');
    insHealth.run(3, 'পেটের পীড়া ও গ্যাস্ট্রিক সমস্যা', 'অ্যান্টাসিড ও মেট্রোনিডাজল কোর্স সম্পন্ন', 220, 'ডা. লোকমান হাকিম', 'সুস্থ');

    // ৭. করজে হাসানা ও ঋণ খাতা
    const insLoan = db.prepare('INSERT INTO loans (person_name, phone, loan_amount, loan_date, due_date, paid_amount, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insLoan.run('আলহাজ্ব হাবিবুর রহমান সওদাগর', '01817654321', 50000, '2026-09-01', '2026-12-31', 20000, 'বকেয়া', 'মাদ্রাসার দক্ষিণ ভবনের ৩য় তলার ছাদ ঢালাইয়ের জন্য করজে হাসানা');
    insLoan.run('মাওলানা মুফতি রফিক আহমদ', '01712987654', 25000, '2026-10-15', '2026-11-30', 25000, 'পরিশোধিত', 'হিফজখানার নতুন সিলিং ফ্যান ও লাইটিং ক্রয়ের সাময়িক ঋণ');

    // ছাত্রদের মুফত / এতিম স্পন্সরশিপ স্ট্যাটাস আপডেট
    try {
    } catch (e) {}
  }

  // ৮. কোরবানির চামড়া ক্যাম্পেইন স্যাম্পল ডেটা (যদি ফাঁকা থাকে)
  try {
    const qCount = db.prepare('SELECT count(*) as count FROM qurbani_campaigns').get().count;
    if (qCount === 0) {
      const camp = db.prepare(`
        INSERT INTO qurbani_campaigns (year_title, start_date, status, notes)
        VALUES ('ঈদুল আজহা ২০২৬ / ১৪৪৭ হিজরি', date('now'), 'ACTIVE', 'সারাদেশে চামড়া কালেকশন ক্যাম্পেইন ও লিল্লাহ তহবিল সংগ্রহ')
      `).run();
      const campId = camp.lastInsertRowid;

      const insQEntry = db.prepare(`
        INSERT INTO qurbani_entries (campaign_id, team_name, leader_name, cow_count, goat_count, sheep_count, area_name, entry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))
      `);
      insQEntry.run(campId, 'টিম ১ - চকবাজার ও বাদুরতলা', 'মাওলানা কাসেম', 85, 120, 15, 'চকবাজার ওয়ার্ড নং ১৬');
      insQEntry.run(campId, 'টিম ২ - চান্দগাঁও ও বহদ্দারহাট', 'হাফেজ আহমাদুল্লাহ', 110, 95, 8, 'বহদ্দারহাট আবাসিক এলাকা');
      insQEntry.run(campId, 'টিম ৩ - পাঁচলাইশ ও প্রবর্তক', 'মাওলানা উমর ফারুক', 65, 80, 5, 'প্রবর্তক মোড় ও হিলভিউ');

      const insQExp = db.prepare(`
        INSERT INTO qurbani_expenses (campaign_id, expense_type, amount, date, notes)
        VALUES (?, ?, ?, date('now'), ?)
      `);
      insQExp.run(campId, 'লবণ ক্রয়', 14500, '৫০ বস্তা আয়োডিনযুক্ত দানাদার লবণ');
      insQExp.run(campId, 'গাড়ি ভাড়া / পরিবহন', 12000, '৩টি পিকআপ ভ্যান সারাদিনের ভাড়া ও তেল খরচ');
      insQExp.run(campId, 'কুলি ও লেবার মজুরি', 8500, 'চামড়া লোড-আনলোড ও লবণ মাখানোর মজুরি');

      const insQSale = db.prepare(`
        INSERT INTO qurbani_sales (campaign_id, buyer_name, phone, total_cow_sold, total_goat_sold, total_amount, paid_amount, sale_date, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?)
      `);
      insQSale.run(campId, 'মেসার্স চৌধুরী লেদার অ্যান্ড ট্যানারি (হাজী রফিক)', '01711223344', 260, 295, 345000, 300000, 'BANK');
    }

    // ৯. আবাসিক ছাত্র খুরুজ ও সিকিউরিটি গেটপাস
    const gpCount = db.prepare('SELECT count(*) as count FROM student_gatepasses').get().count;
    if (gpCount === 0) {
      const insGP = db.prepare(`
        INSERT INTO student_gatepasses (student_id, pass_no, leave_reason, departure_time, expected_return, approved_by, guardian_phone, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insGP.run(1, 'GP-2026-001', 'পারিবারিক অনুষ্ঠান ও বড় বোনের বিবাহ', '2026-11-04 09:00', '2026-11-07 17:00', 'নাজেমে তালিমাত মাওলানা উমর ফারুক', '01819123456', 'APPROVED', 'অভিভাবক ফোনে সম্মতি নিশ্চিত করেছেন');
      insGP.run(2, 'GP-2026-002', 'জরুরি চিকিৎসা ও ডেন্টাল চেকআপ', '2026-11-03 10:30', '2026-11-03 18:00', 'মুহতামিম সাহেব', '01711234567', 'DEPARTED', 'বিকেলে মাদ্রাসায় রিপোর্ট করবে');
    }
  } catch (e) {
    console.error('Error seeding qurbani/gatepass:', e.message);
  }
}

initDatabase();

module.exports = db;
