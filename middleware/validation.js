const { z } = require('zod');

// ১. ইনপুট স্যানিটাইজার (OWASP A05: Cross-Site Scripting (XSS) প্রতিরোধ)
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // HTML ট্যাগ অ্যাঙ্গেল ব্র্যাকেট নিষ্ক্রিয়
    .replace(/javascript:/gi, '') // javascript: প্রোটোকল ব্লক
    .replace(/data:/gi, '') // data: URI এক্সপ্লয়েট ব্লক
    .replace(/on\w+=/gi, '') // ইনলাইন ইভেন্ট হ্যান্ডলার ব্লক (onerror, onload, onclick)
    .trim();
}

function deepSanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      cleaned[key] = sanitizeString(val);
    } else if (typeof val === 'object' && val !== null) {
      cleaned[key] = deepSanitize(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// ২. জড ভ্যালিডেশন মিডলওয়্যার জেনারেটর
function validateBody(schema) {
  return (req, res, next) => {
    try {
      // প্রথমে বডি স্যানিটাইজেশন
      req.body = deepSanitize(req.body);

      // এরপর Zod স্কিমা ভ্যালিডেশন
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        const errorMessage = firstIssue ? firstIssue.message : 'প্রদত্ত তথ্য সঠিক নয়।';
        return res.status(400).json({
          success: false,
          error: errorMessage,
          validation_errors: parsed.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        });
      }

      req.body = parsed.data;
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'ইনপুট ভ্যালিডেশনে ত্রুটি ঘটেছে: ' + err.message
      });
    }
  };
}

// ৩. জড স্কিমাসমূহ
const schemas = {
  // অ্যাডমিন পিন ভেরিফিকেশন
  verifyPin: z.object({
    pin: z.string({ required_error: 'অনুগ্রহ করে অ্যাডমিন সিকিউরিটি পিন দিন।' })
      .trim()
      .min(1, 'অনুগ্রহ করে অ্যাডমিন সিকিউরিটি পিন দিন।')
      .max(32, 'পিন সর্বোচ্চ ৩২ অক্ষরের হতে পারবে।')
  }),

  // পিন পরিবর্তন
  changePin: z.object({
    current_pin: z.string({ required_error: 'বর্তমান পিন দেওয়া বাধ্যতামূলক।' })
      .trim()
      .min(1, 'বর্তমান পিন দেওয়া বাধ্যতামূলক।'),
    new_pin: z.string({ required_error: 'নতুন পিন কোড দেওয়া বাধ্যতামূলক।' })
      .trim()
      .min(4, 'নতুন পিন কোড কমপক্ষে ৪ অক্ষরের হতে হবে।')
      .max(32, 'নতুন পিন কোড সর্বোচ্চ ৩২ অক্ষরের হতে পারবে।')
  }),

  // ভর্তি আবেদন
  admissionApply: z.object({
    name_bn: z.string({ required_error: 'শিক্ষার্থীর নাম বাধ্যতামূলক।' })
      .trim()
      .min(2, 'শিক্ষার্থীর নাম কমপক্ষে ২ অক্ষরের হতে হবে।')
      .max(100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারবে।'),
    name_en: z.string().trim().max(100).optional().or(z.literal('')),
    class_id: z.coerce.number({ required_error: 'শ্রেণি নির্বাচন বাধ্যতামূলক।' })
      .int()
      .positive('সঠিক শ্রেণি নির্বাচন করুন।'),
    gender: z.string().trim().max(20).optional().default('MALE'),
    birth_date: z.string().trim().max(30).optional().or(z.literal('')),
    guardian_name: z.string().trim().max(100).optional().or(z.literal('')),
    guardian_relation: z.string().trim().max(50).optional().default('পিতা'),
    phone: z.string({ required_error: 'যোগাযোগের মোবাইল নম্বর দিন।' })
      .trim()
      .min(6, 'সঠিক মোবাইল নম্বর দিন (কমপক্ষে ৬ সংখ্যা)।')
      .max(20, 'মোবাইল নম্বর সর্বোচ্চ ২০ সংখ্যার হতে পারবে।'),
    present_address: z.string().trim().max(250).optional().or(z.literal('')),
    permanent_address: z.string().trim().max(250).optional().or(z.literal('')),
    previous_madrasa: z.string().trim().max(150).optional().or(z.literal('')),
    is_residential: z.union([z.boolean(), z.number(), z.string()]).optional().default(0),
    is_orphan: z.union([z.boolean(), z.number(), z.string()]).optional().default(0),
    blood_group: z.string().trim().max(10).optional().or(z.literal('')),
    notes: z.string().trim().max(500).optional().or(z.literal(''))
  }),

  // যোগাযোগ বার্তা
  contact: z.object({
    name: z.string({ required_error: 'আপনার নাম প্রদান করুন।' })
      .trim()
      .min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।')
      .max(100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারবে।'),
    phone: z.string({ required_error: 'আপনার মোবাইল নম্বর প্রদান করুন।' })
      .trim()
      .min(6, 'সঠিক মোবাইল নম্বর দিন।')
      .max(20, 'মোবাইল নম্বর সর্বোচ্চ ২০ সংখ্যার হতে পারবে।'),
    email: z.string().trim().email('সঠিক ইমেইল ঠিকানা দিন।').optional().or(z.literal('')),
    subject: z.string().trim().max(150).optional().or(z.literal('')),
    message: z.string({ required_error: 'বার্তার বিবরণ লিখুন।' })
      .trim()
      .min(3, 'বার্তা কমপক্ষে ৩ অক্ষরের হতে হবে।')
      .max(1000, 'বার্তা সর্বোচ্চ ১০০০ অক্ষরের হতে পারবে।')
  }),

  // ফ্রি ডেমো লিড
  demoLead: z.object({
    name: z.string({ required_error: 'আপনার নাম দিন।' })
      .trim()
      .min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।')
      .max(100),
    phone: z.string({ required_error: 'মোবাইল নম্বর দিন।' })
      .trim()
      .min(6, 'সঠিক মোবাইল নম্বর দিন।')
      .max(20),
    madrasa_name: z.string().trim().max(150).optional().or(z.literal('')),
    location: z.string().trim().max(100).optional().or(z.literal('')),
    total_students: z.union([z.number(), z.string()]).optional().or(z.literal('')),
    interest: z.string().trim().max(100).optional().or(z.literal(''))
  }),

  // অনলাইন অনুদান / যাকাত
  publicDonate: z.object({
    donor_name: z.string({ required_error: 'দাতার নাম বাধ্যতামূলক।' })
      .trim()
      .min(2, 'দাতার নাম কমপক্ষে ২ অক্ষরের হতে হবে।')
      .max(100),
    donor_phone: z.string({ required_error: 'মোবাইল নম্বর বাধ্যতামূলক।' })
      .trim()
      .min(6, 'সঠিক মোবাইল নম্বর দিন।')
      .max(20),
    donor_email: z.string().trim().email('সঠিক ইমেইল দিন।').optional().or(z.literal('')),
    amount: z.coerce.number({ required_error: 'দানের পরিমাণ সংখ্যায় দিন।' })
      .positive('দানের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।')
      .max(10000000, 'অনলাইনে সর্বোচ্চ ১ কোটি টাকা পর্যন্ত অনুদান গ্রহণীয়।'),
    fund_type: z.string().trim().max(60).optional().default('সাধারণ দান ফান্ড'),
    payment_method: z.string().trim().max(30).optional().default('bKash'),
    trx_id: z.string({ required_error: 'ট্রানজ্যাকশন আইডি (TrxID) বাধ্যতামূলক।' })
      .trim()
      .min(4, 'সঠিক ট্রানজ্যাকশন আইডি দিন।')
      .max(50),
    notes: z.string().trim().max(300).optional().or(z.literal(''))
  }),

  // দ্রুত ফি পরিশোধ
  payFee: z.object({
    student_id: z.union([z.string().trim().min(1, 'দাখেলা বা রোল নম্বর দিন।'), z.number().int().positive()]),
    amount: z.coerce.number({ required_error: 'পরিশোধের পরিমাণ সংখ্যায় দিন।' })
      .positive('পরিশোধের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।')
      .max(500000, 'অনলাইনে সর্বোচ্চ ৫ লক্ষ টাকা পরিশোধ করা যাবে।'),
    gateway: z.string().trim().max(30).optional().default('bKash'),
    trx_id: z.string({ required_error: 'ট্রানজ্যাকশন আইডি (TrxID) বাধ্যতামূলক।' })
      .trim()
      .min(4, 'সঠিক ট্রানজ্যাকশন আইডি দিন।')
      .max(50)
  })
};

module.exports = {
  validateBody,
  schemas,
  deepSanitize,
  sanitizeString
};
