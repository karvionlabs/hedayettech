const express = require('express');
const router = express.Router();
const db = require('../database');

// ১. হিফজ ও আমল ডায়েরি লগ তালিকা
router.get('/hifz', (req, res) => {
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

// ২. হিফজ সবক, সাত-সবক ও আমোখতা এন্ট্রি
router.post('/hifz', (req, res) => {
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

module.exports = router;
