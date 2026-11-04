const express = require('express');
const router = express.Router();
const { BACKUP_ADMIN_PIN, BACKUP_SECRET_KEY } = require('../middleware/security');

// অ্যাডমিন পিন ভেরিফিকেশন এপিআই (Stricx Auth Gateway)
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
    if (cleanPin === BACKUP_ADMIN_PIN || cleanPin === BACKUP_SECRET_KEY) {
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

module.exports = router;
