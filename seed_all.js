const db = require('./database');

if (db.prepare('SELECT count(*) as count FROM notices').get().count === 0) {
  const ins = db.prepare("INSERT INTO notices (title, content, category, published_date, is_active) VALUES (?, ?, ?, date('now'), 1)");
  ins.run('আসন্ন দ্বিতীয় সাময়িক পরীক্ষার সময়সূচি ঘোষণা', 'আগামী ১৫ ডিসেম্বর হতে দ্বিতীয় সাময়িক পরীক্ষা শুরু হবে। সকল শিক্ষার্থীকে নির্ধারিত সময়ের পূর্বে ফি পরিশোধ করে প্রবেশপত্র সংগ্রহের নির্দেশ দেওয়া হলো।', 'পরীক্ষা');
  ins.run('পবিত্র মাহে রমজান ও ঈদুল ফিতরের দীর্ঘ ছুটি সংক্রান্ত নোটিশ', 'পবিত্র রমজানুল মুবারক উপলক্ষে আগামী ২০ রমজান হতে ঈদুল ফিতরের পর ৫ শাওয়াল পর্যন্ত মাদ্রাসার সকল শিক্ষা কার্যক্রম বন্ধ থাকিবে।', 'ছুটি');
  ins.run('মাদ্রাসার বার্ষিক ওয়াজ মাহফিল ও দস্তারবন্দী সম্মেলন', 'আগামী ২৮ জানুয়ারি রোজ শুক্রবার মাদ্রাসার বার্ষিক ইসলামী মহাসম্মেলন ও কুরআন হিফজ সমাপ্তকারী ছাত্রদের দস্তারবন্দী অনুষ্ঠিত হইবে।', 'মাহফিল');
}

if (db.prepare('SELECT count(*) as count FROM donor_contributions').get().count === 0) {
  const ins = db.prepare("INSERT INTO donor_contributions (donor_id, date, amount, payment_method, receipt_no, remarks, received_by) VALUES (?, date('now'), ?, ?, ?, ?, ?)");
  ins.run(1, 25000, 'BANK', 'DON-2026-001', 'আজীবন সদস্যপদের প্রথম কিস্তির অনুদান', 'মুহতামিম সাহেব');
  ins.run(2, 5000, 'BKASH', 'DON-2026-002', 'নভেম্বর মাসের নিয়মিত মাসিক চাঁদা', 'ক্যাশিয়ার রফিক');
  ins.run(3, 10000, 'BANK', 'DON-2026-003', 'এতিমখানা লিল্লাহ বোর্ডিং ফান্ডে প্রবাসী অনুদান', 'মুহতামিম সাহেব');
}

if (db.prepare('SELECT count(*) as count FROM library_books').get().count === 0) {
  const ins = db.prepare('INSERT INTO library_books (book_title, author, category, total_copies, available_copies, shelf_no, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)');
  ins.run('সহিহ বুখারী শরিফ (পূর্ণাঙ্গ ৪ খণ্ড)', 'ইমাম বুখারী (রহ.)', 'হাদিস', 5, 4, 'SHELF-A1', 'BK-HAD-001');
  ins.run('তাফসিরে জালালাইন', 'জালালুদ্দিন সুয়ূতী (রহ.)', 'তাফসির', 8, 7, 'SHELF-B2', 'BK-TAF-002');
  ins.run('কানযুদ দাকায়িক', 'ইমাম নাসাফী (রহ.)', 'ফিকহ', 10, 9, 'SHELF-C1', 'BK-FIQ-003');
  ins.run('মিজানুস সরফ ও মুনশাইব', 'সিরাজুদ্দিন (রহ.)', 'আরবি ব্যাকরণ', 15, 14, 'SHELF-D3', 'BK-ARB-004');

  const insIssue = db.prepare("INSERT INTO book_issues (book_id, student_id, staff_id, issue_date, due_date, status) VALUES (?, ?, ?, date('now'), date('now', '+15 days'), 'ISSUED')");
  insIssue.run(1, 1, null);
  insIssue.run(2, 4, null);
}

if (db.prepare('SELECT count(*) as count FROM health_records').get().count === 0) {
  const ins = db.prepare("INSERT INTO health_records (student_id, date, symptoms, treatment, medicine_cost, doctor_name, status) VALUES (?, date('now'), ?, ?, ?, ?, ?)");
  ins.run(2, 'তীব্র মৌসুমি সর্দি ও জ্বর (১০২° ফারেনহাইট)', 'প্যারাসিটামল ট্যাবলেট ও ওরাল স্যালাইন প্রদান করা হয়েছে', 150, 'ডা. মুবিন চৌধুরী', 'চিকিৎসাধীন');
  ins.run(3, 'পেটের পীড়া ও গ্যাস্ট্রিক সমস্যা', 'অ্যান্টাসিড ও মেট্রোনিডাজল কোর্স সম্পন্ন', 220, 'ডা. লোকমান হাকিম', 'সুস্থ');
}

if (db.prepare('SELECT count(*) as count FROM loans').get().count === 0) {
  const ins = db.prepare('INSERT INTO loans (person_name, phone, loan_amount, loan_date, due_date, paid_amount, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  ins.run('আলহাজ্ব হাবিবুর রহমান সওদাগর', '01817654321', 50000, '2026-09-01', '2026-12-31', 20000, 'বকেয়া', 'মাদ্রাসার দক্ষিণ ভবনের ৩য় তলার ছাদ ঢালাইয়ের জন্য করজে হাসানা');
  ins.run('মাওলানা মুফতি রফিক আহমদ', '01712987654', 25000, '2026-10-15', '2026-11-30', 25000, 'পরিশোধিত', 'হিফজখানার নতুন সিলিং ফ্যান ও লাইটিং ক্রয়ের সাময়িক ঋণ');
}

if (db.prepare('SELECT count(*) as count FROM staff_leaves').get().count === 0) {
  const ins = db.prepare('INSERT INTO staff_leaves (staff_id, leave_type, start_date, end_date, total_days, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  ins.run(2, 'জরুরি প্রয়োজন', '2026-11-10', '2026-11-12', 3, 'পারিবারিক জরুরি কাজের জন্য গ্রামের বাড়ি সাতকানিয়া গমন', 'APPROVED', 'মুহতামিম সাহেব');
  ins.run(3, 'অসুস্থতা', '2026-11-05', '2026-11-06', 2, 'তীব্র মৌসুমি জ্বরের কারণে বিশ্রাম প্রয়োজন', 'PENDING', null);
}

if (db.prepare('SELECT count(*) as count FROM online_admissions').get().count === 0) {
  const ins = db.prepare('INSERT INTO online_admissions (applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute, birth_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  ins.run('মুহাম্মদ তাওহীদুর রহমান', 'মাওলানা সাইফুল্লাহ', '01855667788', 1, 'আবাসিক', 'পটিয়া, চট্টগ্রাম', 'নূরানি মক্তব চান্দগাঁও', '2014-05-12', 'PENDING');
  ins.run('তাহমিদ আহমেদ সাকিব', 'হাফেজ দেলোয়ার হোসেন', '01733445566', 2, 'অনাবাসিক', 'বহদ্দারহাট, চট্টগ্রাম', 'মডেল স্কুল বহদ্দারহাট', '2016-08-20', 'PENDING');
}

console.log('✅ Seed completed successfully!');
