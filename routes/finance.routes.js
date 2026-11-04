const express = require('express');
const router = express.Router();
const db = require('../database');

// ১. ক্যাশ খাতা ও আয়-ব্যয় লেনদেন তালিকা
router.get('/accounts/transactions', (req, res) => {
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

// ২. নতুন আয় বা ব্যয় ভাউচার তৈরি
router.post('/accounts/transactions', (req, res) => {
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

// ৩. মুহতামিম ১-ক্লিক সান্ধ্যকালীন অডিট ও ক্লোজিং স্লিপ
router.get('/muhtamim/daily-closing', (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().slice(0, 10);
    
    const todayIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'INCOME' AND date = ?
    `).get(today).total;

    const todayExpense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'EXPENSE' AND date = ?
    `).get(today).total;

    const todayBazaar = db.prepare(`
      SELECT COALESCE(SUM(total_cost), 0) as total 
      FROM boarding_bazaar 
      WHERE date = ?
    `).get(today).total;

    const totalAllIncome = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'INCOME'`).get().total;
    const totalAllExpense = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'EXPENSE'`).get().total;
    const cashInHand = totalAllIncome - totalAllExpense;

    const totalStudents = db.prepare('SELECT count(*) as count FROM students').get().count;
    const presentStudents = db.prepare("SELECT count(*) as count FROM attendance WHERE date = ? AND status = 'PRESENT'").get(today).count;
    const absentStudents = db.prepare("SELECT count(*) as count FROM attendance WHERE date = ? AND status = 'ABSENT'").get(today).count;
    const leaveStudents = db.prepare("SELECT count(*) as count FROM attendance WHERE date = ? AND status = 'LEAVE'").get(today).count;

    const residentialCount = db.prepare('SELECT count(*) as count FROM students WHERE residential = 1').get().count;
    const activeGatepasses = db.prepare(`
      SELECT count(*) as count 
      FROM student_gatepasses 
      WHERE status IN ('APPROVED', 'DEPARTED')
    `).get().count;

    const transactions = db.prepare(`
      SELECT voucher_no, category, amount, type, payment_method, description, received_by 
      FROM transactions 
      WHERE date = ? 
      ORDER BY id DESC
    `).all(today);

    const bazaarItems = db.prepare(`
      SELECT item_name, quantity_kg, unit_price, total_cost, purchaser_name 
      FROM boarding_bazaar 
      WHERE date = ?
    `).all(today);

    const inst = db.prepare('SELECT name_bn, muhtamim_name, phone FROM institution LIMIT 1').get();

    res.json({
      success: true,
      date: today,
      institution: inst,
      summary: {
        todayIncome,
        todayExpense,
        todayBazaar,
        cashInHand,
        netToday: todayIncome - todayExpense,
        totalStudents,
        presentStudents,
        absentStudents,
        leaveStudents,
        residentialCount,
        activeGatepasses
      },
      transactions,
      bazaarItems
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
