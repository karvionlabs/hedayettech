const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireVaultKey } = require('../middleware/security');

// ১. সুরক্ষিত ডাটাবেস ব্যাকআপ এপিআই (Stricx Token Guarded)
router.get('/backup', requireVaultKey, (req, res) => {
  try {
    const tables = [
      'institution', 'classes', 'students', 'hifz_logs', 'transactions', 
      'boarding_bazaar', 'attendance', 'staff', 'demo_requests',
      'online_admissions', 'donors', 'donor_contributions', 'notices',
      'staff_leaves', 'library_books', 'book_issues', 'health_records', 'loans',
      'contact_messages', 'qurbani_campaigns', 'qurbani_entries', 'qurbani_expenses', 'qurbani_sales', 'student_gatepasses'
    ];
    const backup = {
      export_timestamp: new Date().toISOString(),
      institution: db.prepare('SELECT name_bn, code FROM institution LIMIT 1').get(),
      tables: {}
    };

    for (const tbl of tables) {
      backup.tables[tbl] = db.prepare(`SELECT * FROM ${tbl}`).all();
    }

    const filename = `madrasa_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
