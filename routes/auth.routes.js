const express = require('express');
const router = express.Router();
const db = require('../database');
const { getActiveAdminPin, BACKUP_SECRET_KEY, requireAdminAuth } = require('../middleware/security');

// ১. অ্যাডমিন পিন ভেরিফিকেশন এপিআই (Stricx Auth Gateway)
router.post('/auth/verify', (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'অনুগ্রহ করে অ্যাডমিন সিকিউরিটি পিন দিন।'
      });
    }

    const cleanPin = String(pin).trim();
    const activePin = getActiveAdminPin();

    if (cleanPin === activePin || cleanPin === BACKUP_SECRET_KEY) {
      return res.json({
        success: true,
        token: cleanPin,
        message: 'আলহামদুলিল্লাহ! অ্যাডমিন কনসোলে সফলভাবে লগইন হয়েছে।'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'ভুল সিকিউরিটি পিন! সঠিক পিন প্রদান করে পুনরায় চেষ্টা করুন।'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ২. কাস্টমাইজেশন: অ্যাডমিন সিকিউরিটি পিন পরিবর্তন (Self-Service PIN Update)
router.post('/auth/change-pin', requireAdminAuth, (req, res) => {
  try {
    const { current_pin, new_pin } = req.body;
    if (!current_pin || !new_pin) {
      return res.status(400).json({
        success: false,
        error: 'বর্তমান পিন এবং নতুন পিন উভয়ই প্রদান করা বাধ্যতামূলক।'
      });
    }

    const cleanCurrent = String(current_pin).trim();
    const cleanNew = String(new_pin).trim();

    if (cleanNew.length < 4 || cleanNew.length > 32) {
      return res.status(400).json({
        success: false,
        error: 'নতুন পিন কোড ৪ থেকে ৩২ অক্ষরের মধ্যে হতে হবে।'
      });
    }

    const activePin = getActiveAdminPin();
    if (cleanCurrent !== activePin && cleanCurrent !== BACKUP_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        error: 'বর্তমান পিনটি সঠিক নয়! যাচাই করে আবার চেষ্টা করুন।'
      });
    }

    db.prepare('UPDATE institution SET admin_pin = ? WHERE id = (SELECT id FROM institution LIMIT 1)').run(cleanNew);

    return res.json({
      success: true,
      token: cleanNew,
      message: 'আলহামদুলিল্লাহ! অ্যাডমিন সিকিউরিটি পিন সফলভাবে আপডেট করা হয়েছে। এখন থেকে এই নতুন পিন কার্যকর থাকবে।'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
