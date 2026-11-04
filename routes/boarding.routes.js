const express = require('express');
const router = express.Router();
const db = require('../database');

// ১. লিল্লাহ বোর্ডিং ও মেস বাজার তালিকা
router.get('/boarding', (req, res) => {
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

// ২. বোর্ডিং বাজার এন্ট্রি ও স্বয়ংক্রিয় ক্যাশবুকে খরচ পোস্টিং
router.post('/boarding', (req, res) => {
  try {
    const { date, item_name, category, quantity_kg, unit_price, purchaser_name, memo_no } = req.body;
    const total_cost = (Number(quantity_kg) || 0) * (Number(unit_price) || 0);

    const insert = db.prepare(`
      INSERT INTO boarding_bazaar (date, item_name, category, quantity_kg, unit_price, total_cost, purchaser_name, memo_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(date || new Date().toISOString().slice(0, 10), item_name, category || 'অন্যান্য', quantity_kg, unit_price, total_cost, purchaser_name, memo_no);

    // Auto-add to expense transactions
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

module.exports = router;
