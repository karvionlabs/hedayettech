const express = require('express');
const path = require('path');
const db = require('./database');
const { securityHeaders, globalApiLimiter, requireAdminAuth } = require('./middleware/security');

// মডুলার ডোমেইন রাউটারসমূহ (Nestrix Decoupled Architecture)
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const studentsRoutes = require('./routes/students.routes');
const hifzRoutes = require('./routes/hifz.routes');
const financeRoutes = require('./routes/finance.routes');
const boardingRoutes = require('./routes/boarding.routes');
const qurbaniRoutes = require('./routes/qurbani.routes');
const gatepassRoutes = require('./routes/gatepass.routes');
const operationsRoutes = require('./routes/operations.routes');
const backupRoutes = require('./routes/backup.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// প্রক্সি ট্রাস্ট সক্রিয়করণ (Cloudflare ও রিভার্স প্রক্সির জন্য)
app.set('trust proxy', 1);

// ১. Stricx সিকিউরিটি হেডার্স সক্রিয়করণ (Helmet)
app.use(securityHeaders);

// ২. সাধারণ এপিআই রেট লিমিটিং (Denial of Service প্রতিরোধ)
app.use('/api/', globalApiLimiter);

// ৩. বডি পার্সার ও স্ট্যাটিক ফাইল সার্ভিসিং
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ৪. অথেনটিকেশন রুট (লগইন ভেরিফিকেশন)
app.use('/api', authRoutes);

// ৫. অ্যাডমিন রাইট অথেনটিকেশন গার্ড (OWASP Broken Access Control প্রতিরোধ)
app.use('/api', requireAdminAuth);

// ৬. মডুলার এপিআই রাউটস মাউন্টিং
app.use('/api', dashboardRoutes);
app.use('/api', studentsRoutes);
app.use('/api', hifzRoutes);
app.use('/api', financeRoutes);
app.use('/api', boardingRoutes);
app.use('/api', qurbaniRoutes);
app.use('/api', gatepassRoutes);
app.use('/api', operationsRoutes);
app.use('/api', backupRoutes);

// ৭. সেন্ট্রালাইজড এরর হ্যান্ডলার (Sensitive Data Leakage প্রতিরোধ)
app.use((err, req, res, next) => {
  console.error('[Internal Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    error: 'সার্ভারে অভ্যন্তরীণ ত্রুটি ঘটেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
  });
});

// ৮. স্টিলথ অ্যাডমিন ও পোর্টাল রিডাইরেক্ট রুট
app.get(['/admin', '/portal', '/control', '/owner'], (req, res) => {
  res.redirect('/#admin');
});

// ৯. ৪MD স্পা ফলব্যাক রাউটিং
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ৯. সার্ভার স্টার্ট
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🕌 Madrasa Management System is LIVE (Nestrix Hardened)!`);
  console.log(`🌐 Local Server: http://localhost:${PORT}`);
  console.log(`🛡️  Security: Helmet + Rate Limit + Admin PIN Auth Guard`);
  console.log(`📁 Database: SQLite (WAL Mode active)`);
  console.log(`======================================================\n`);
});

module.exports = { app, server };
