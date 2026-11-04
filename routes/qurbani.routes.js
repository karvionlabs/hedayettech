const express = require('express');
const router = express.Router();
const db = require('../database');

// ১. সকল কোরবানির চামড়া ক্যাম্পেইন ও ব্যালেন্স সামারি
router.get('/qurbani/campaigns', (req, res) => {
  try {
    const campaigns = db.prepare('SELECT * FROM qurbani_campaigns ORDER BY id DESC').all();
    
    const enriched = campaigns.map(camp => {
      const entries = db.prepare(`
        SELECT COALESCE(SUM(cow_count), 0) as totalCows,
               COALESCE(SUM(goat_count), 0) as totalGoats,
               COALESCE(SUM(sheep_count), 0) as totalSheep
        FROM qurbani_entries WHERE campaign_id = ?
      `).get(camp.id);

      const expenses = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as totalExpenses
        FROM qurbani_expenses WHERE campaign_id = ?
      `).get(camp.id);

      const sales = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as totalSales,
               COALESCE(SUM(paid_amount), 0) as totalPaid
        FROM qurbani_sales WHERE campaign_id = ?
      `).get(camp.id);

      return {
        ...camp,
        ...entries,
        totalExpenses: expenses.totalExpenses,
        totalSales: sales.totalSales,
        totalPaid: sales.totalPaid,
        netProfit: sales.totalPaid - expenses.totalExpenses
      };
    });

    res.json({ success: true, campaigns: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ২. নির্দিষ্ট ক্যাম্পেইনের কালেকশন, খরচ ও বিক্রয় অডিট
router.get('/qurbani/campaigns/:id', (req, res) => {
  try {
    const campId = req.params.id;
    const campaign = db.prepare('SELECT * FROM qurbani_campaigns WHERE id = ?').get(campId);
    if (!campaign) return res.status(404).json({ success: false, error: 'ক্যাম্পেইন পাওয়া যায়নি' });

    const entries = db.prepare('SELECT * FROM qurbani_entries WHERE campaign_id = ? ORDER BY id DESC').all(campId);
    const expenses = db.prepare('SELECT * FROM qurbani_expenses WHERE campaign_id = ? ORDER BY id DESC').all(campId);
    const sales = db.prepare('SELECT * FROM qurbani_sales WHERE campaign_id = ? ORDER BY id DESC').all(campId);

    res.json({ success: true, campaign, entries, expenses, sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৩. চামড়া কালেকশন এন্ট্রি
router.post('/qurbani/entries', (req, res) => {
  try {
    const { campaign_id, team_name, leader_name, cow_count, goat_count, sheep_count, area_name } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const stmt = db.prepare(`
      INSERT INTO qurbani_entries (campaign_id, team_name, leader_name, cow_count, goat_count, sheep_count, area_name, entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(campaign_id, team_name, leader_name, cow_count || 0, goat_count || 0, sheep_count || 0, area_name || '', today);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৪. চামড়া প্রক্রিয়াজাতকরণ ও পরিবহন খরচ
router.post('/qurbani/expenses', (req, res) => {
  try {
    const { campaign_id, expense_type, amount, notes } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const stmt = db.prepare(`
      INSERT INTO qurbani_expenses (campaign_id, expense_type, amount, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(campaign_id, expense_type, amount, today, notes || '');
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ৫. ট্যানারি/আড়তদারদের কাছে বিক্রয় ও স্বয়ংক্রিয় ক্যাশবুকে জমা
router.post('/qurbani/sales', (req, res) => {
  try {
    const { campaign_id, buyer_name, phone, total_cow_sold, total_goat_sold, total_amount, paid_amount, payment_method } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const stmt = db.prepare(`
      INSERT INTO qurbani_sales (campaign_id, buyer_name, phone, total_cow_sold, total_goat_sold, total_amount, paid_amount, sale_date, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(campaign_id, buyer_name, phone || '', total_cow_sold || 0, total_goat_sold || 0, total_amount, paid_amount, today, payment_method || 'CASH');

    // স্বয়ংক্রিয়ভাবে ক্যাশবুকে লিল্লাহ দান ফান্ডে জমা ভাউচার তৈরি
    const vCount = db.prepare('SELECT count(*) as count FROM transactions').get().count + 1;
    const voucherNo = `V-${1000 + vCount}`;
    db.prepare(`
      INSERT INTO transactions (voucher_no, date, type, category, amount, payment_method, description, received_by)
      VALUES (?, ?, 'INCOME', 'লিল্লাহ দান', ?, ?, ?, 'মুহতামিম সাহেব')
    `).run(voucherNo, today, paid_amount, payment_method || 'CASH', `কোরবানির চামড়া বিক্রয় বাবদ আয় (${buyer_name})`);

    res.json({ success: true, id: info.lastInsertRowid, voucherNo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
