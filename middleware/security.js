const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('../database');

// ১. Stricx সিকিউরিটি হেডার্স (Helmet - OWASP Hardened)
const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// ২. সাধারণ এপিআই রেট লিমিটার (প্রতি মিনিটে ১২০টি রিকোয়েস্ট)
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

function getActiveAdminPin() {
  try {
    const row = db.prepare('SELECT admin_pin FROM institution LIMIT 1').get();
    if (row && row.admin_pin) {
      return String(row.admin_pin).trim();
    }
  } catch (e) {}
  return process.env.BACKUP_PIN || '2026';
}

function requireVaultKey(req, res, next) {
  const token = req.headers['x-vault-key'] || req.query.token;
  const activePin = getActiveAdminPin();

  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'অননুমোদিত অ্যাক্সেস! ডাটাবেস ব্যাকআপ ডাউনলোড করতে সিক্রেট ভল্ট কি (Vault Key / PIN) প্রদান করুন।'
    });
  }

  // ভেরিফিকেশন: মাস্টার কি অথবা অ্যাডমিন পিন
  if (token === BACKUP_SECRET_KEY || token === activePin) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'প্রদত্ত ভল্ট কি (Security Key / PIN) সঠিক নয়! অ্যাক্সেস ব্লক করা হয়েছে।'
  });
}

// ৫. জিরো-লিক প্রাইভেসি বাউন্ডারি (Zero-Leak Data Privacy Guard)
// কেবলমাত্র সর্বজনীন প্রয়োজনীয় রুটগুলো পাবলিকলি উন্মুক্ত থাকবে; বাকি সকল ডাটা রিড ও রাইট সম্পূর্ণ লকড থাকবে
function isPublicRoute(req) {
  const path = req.path || '';
  const method = req.method;

  // পাবলিক ফর্ম সাবমিশন
  if (method === 'POST') {
    if (path === '/auth/verify' || path.endsWith('/auth/verify')) return true;
    if (path === '/admissions/apply' || path.endsWith('/admissions/apply')) return true;
    if (path === '/contact' || path.endsWith('/contact')) return true;
    if (path === '/leads/demo' || path.endsWith('/leads/demo')) return true;
    return false;
  }

  // পাবলিক ডাটা রিড (কেবলমাত্র ড্রপডাউন ও সাধারণ নোটিশ)
  if (method === 'GET') {
    if (path === '/academics/classes' || path.endsWith('/academics/classes')) return true;
    if (path === '/notices' || path.endsWith('/notices')) return true;
    if (path === '/institution/public' || path.endsWith('/institution/public')) return true;
    if (path === '/public/results' || path.endsWith('/public/results')) return true;
    return false;
  }

  if (method === 'OPTIONS') return true;

  return false;
}

function requireAdminAuth(req, res, next) {
  // যদি রুটটি সর্বজনীন হয়, সরাসরি অনুমতি দিন
  if (isPublicRoute(req)) {
    return next();
  }

  // কাস্টমার ও প্রতিষ্ঠানের সকল সংবেদনশীল তথ্যের জন্য টোকেন যাচাই
  const token = req.headers['x-admin-token'] || 
                (req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : null) || 
                req.query.admin_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'অননুমোদিত অ্যাক্সেস! কাস্টমার ও প্রতিষ্ঠানের গোপনীয় তথ্য সুরক্ষিত রাখতে অ্যাডমিন পিন বা লগইন বাধ্যতামূলক।'
    });
  }

  const activePin = getActiveAdminPin();
  if (token === activePin || token === BACKUP_SECRET_KEY) {
    // সংবেদনশীল তথ্যের ক্ষেত্রে ব্রাউজার ক্যাশ প্রতিরোধ যাতে অন্য কেউ হিস্ট্রি থেকে ডাটা না দেখতে পারে
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'প্রদত্ত অ্যাডমিন পিন বা সিকিউরিটি টোকেন সঠিক নয়! অ্যাক্সেস প্রত্যাখ্যাত হয়েছে।'
  });
}

module.exports = {
  securityHeaders,
  globalApiLimiter,
  strictLeadLimiter,
  requireVaultKey,
  requireAdminAuth,
  getActiveAdminPin,
  BACKUP_SECRET_KEY
};
