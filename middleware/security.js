const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ১. সিকিউরিটি হেডার্স (Helmet)
// Tailwind CDN ও Chart.js এর জন্য CSP false রেখে বাকি সব প্রোডাকশন হেডার্স সক্রিয়
const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});

// ২. সাধারণ এপিআই রেট লিমিটার (প্রতি মিনিটে সর্বোচ্চ ১২০টি রিকোয়েস্ট)
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে (Too Many Requests), অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।'
  }
});

// ৩. স্পর্শকাতর পোস্ট এপিআই রেট লিমিটার (ভর্তি আবেদন ও ডেমো লিড স্প্যাম প্রতিরোধ - প্রতি ১৫ মিনিটে ১৫টি)
const strictLeadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'অল্প সময়ের মধ্যে একাধিক আবেদন পাঠানো হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর চেষ্টা করুন।'
  }
});

// ৪. ডাটাবেস ব্যাকআপ ভল্ট সিকিউরিটি গার্ড (Stricx Token Guard)
const BACKUP_SECRET_KEY = process.env.BACKUP_KEY || 'HedayetTech_Vault_2026_Secure';
const BACKUP_ADMIN_PIN = process.env.BACKUP_PIN || '2026';

function requireVaultKey(req, res, next) {
  const token = req.headers['x-vault-key'] || req.query.token;
  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'অননুমোদিত অ্যাক্সেস! ডাটাবেস ব্যাকআপ ডাউনলোড করতে সিক্রেট ভল্ট কি (Vault Key / PIN) প্রদান করুন।'
    });
  }

  // ভেরিফিকেশন: মাস্টার কি অথবা অ্যাডমিন পিন
  if (token === BACKUP_SECRET_KEY || token === BACKUP_ADMIN_PIN) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'প্রদত্ত ভল্ট কি (Security Key / PIN) সঠিক নয়! অ্যাক্সেস ব্লক করা হয়েছে।'
  });
}

module.exports = {
  securityHeaders,
  globalApiLimiter,
  strictLeadLimiter,
  requireVaultKey
};
