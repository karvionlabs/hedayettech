const express = require('express');
const router = express.Router();
const db = require('../database');

// ১. ড্যাশবোর্ড ও প্রতিষ্ঠানের অবস্থা
router.get('/dashboard', (req, res) => {
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

// ২. প্রতিষ্ঠান সেটিংস
router.get('/settings', (req, res) => {
  try {
    const institution = db.prepare('SELECT * FROM institution LIMIT 1').get();
    res.json({ success: true, institution });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
