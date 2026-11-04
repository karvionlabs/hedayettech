const express = require('express');
const router = express.Router();
const db = require('../database');

// ১. সকল আবাসিক খুরুজ ও সিকিউরিটি গেটপাস তালিকা
router.get('/gatepasses', (req, res) => {
  try {
    const passes = db.prepare(`
      SELECT gp.*, s.name_bn as student_name, s.roll_no, s.admission_no, c.name_bn as class_name
      FROM student_gatepasses gp
      JOIN students s ON gp.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      ORDER BY gp.id DESC
    `).all();
    res.json({ success: true, passes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ২. নতুন আবাসিক ছাত্র গেটপাস ইস্যু
router.post('/gatepasses', (req, res) => {
  try {
    const { student_id, leave_reason, departure_time, expected_return, approved_by, guardian_phone, notes } = req.body;
    const count = db.prepare('SELECT count(*) as count FROM student_gatepasses').get().count + 1;
    const passNo = `GP-2026-${String(count).padStart(3, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO student_gatepasses (student_id, pass_no, leave_reason, departure_time, expected_return, approved_by, guardian_phone, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)
    `);
    const info = stmt.run(student_id, passNo, leave_reason, departure_time, expected_return, approved_by || 'নাজেমে তালিমাত', guardian_phone || '', notes || '');
    res.json({ success: true, id: info.lastInsertRowid, passNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৩. গেটপাস স্ট্যাটাস আপডেট (DEPARTED / RETURNED)
router.put('/gatepasses/:id/status', (req, res) => {
  try {
    const { status, actual_return } = req.body;
    const id = req.params.id;
    if (status === 'RETURNED') {
      const returnTime = actual_return || new Date().toISOString().slice(0, 16).replace('T', ' ');
      db.prepare(`UPDATE student_gatepasses SET status = ?, actual_return = ? WHERE id = ?`).run(status, returnTime, id);
    } else {
      db.prepare(`UPDATE student_gatepasses SET status = ? WHERE id = ?`).run(status, id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
