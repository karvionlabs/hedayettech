const { z } = require('zod');

// ১. ইনপুট স্যানিটাইজার (OWASP A05: Cross-Site Scripting (XSS) ও Injection প্রতিরোধ)
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

// ৩. জড স্কিমাসমূহ (OWASP Top 10 Compliant)
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

  // ভর্তি আবেদন (অনলাইন ফর্ম)
  admissionApply: z.object({
    applicant_name: z.string().trim().min(2, 'শিক্ষার্থীর নাম কমপক্ষে ২ অক্ষরের হতে হবে।').max(100).optional(),
    name_bn: z.string().trim().min(2, 'শিক্ষার্থীর নাম কমপক্ষে ২ অক্ষরের হতে হবে।').max(100).optional(),
    father_name: z.string().trim().max(100).optional().or(z.literal('')),
    guardian_name: z.string().trim().max(100).optional().or(z.literal('')),
    phone: z.string({ required_error: 'যোগাযোগের মোবাইল নম্বর দিন।' })
      .trim()
      .min(6, 'সঠিক মোবাইল নম্বর দিন (কমপক্ষে ৬ সংখ্যা)।')
      .max(20, 'মোবাইল নম্বর সর্বোচ্চ ২০ সংখ্যার হতে পারবে।'),
    desired_class_id: z.coerce.number().int().positive('সঠিক শ্রেণি নির্বাচন করুন।').optional(),
    class_id: z.coerce.number().int().positive('সঠিক শ্রেণি নির্বাচন করুন।').optional(),
    residential_type: z.string().trim().max(50).optional().default('অনাবাসিক (Non-Residential)'),
    address: z.string().trim().max(250).optional().or(z.literal('')),
    present_address: z.string().trim().max(250).optional().or(z.literal('')),
    previous_institute: z.string().trim().max(150).optional().or(z.literal(''))
  }).refine(data => data.applicant_name || data.name_bn, {
    message: 'শিক্ষার্থীর নাম পূরণ করা আবশ্যক।'
  }),

  // যোগাযোগ বার্তা (কন্টাক্ট ফর্ম)
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
    institution: z.string().trim().max(150).optional().or(z.literal('')),
    subject: z.string().trim().max(150).optional().or(z.literal('')),
    message: z.string({ required_error: 'বার্তার বিবরণ লিখুন।' })
      .trim()
      .min(3, 'বার্তা কমপক্ষে ৩ অক্ষরের হতে হবে।')
      .max(1000, 'বার্তা সর্বোচ্চ ১০০০ অক্ষরের হতে পারবে।')
  }),

  // ফ্রি ডেমো লিড
  demoLead: z.object({
    madrasa_name: z.string({ required_error: 'মাদরাসা বা স্কুলের নাম দিন।' })
      .trim()
      .min(3, 'মাদরাসা বা স্কুলের নাম অন্তত ৩ অক্ষরের হতে হবে।')
      .max(150),
    person_name: z.string().trim().min(2, 'আপনার নাম ও পদবী দিন।').max(100).optional(),
    name: z.string().trim().min(2, 'আপনার নাম ও পদবী দিন।').max(100).optional(),
    phone: z.string({ required_error: 'মোবাইল নম্বর দিন।' })
      .trim()
      .min(6, 'সঠিক মোবাইল নম্বর দিন।')
      .max(20),
    institution_type: z.string().trim().max(60).optional().default('কওমি মাদ্রাসা'),
    website_hp: z.string().trim().max(100).optional().or(z.literal(''))
  }).refine(data => data.person_name || data.name, {
    message: 'আপনার নাম ও পদবী দেওয়া আবশ্যক।'
  }),

  // অনলাইন অনুদান / যাকাত ফান্ড
  publicDonate: z.object({
    name: z.string().trim().min(2, 'দাতার নাম বাধ্যতামূলক।').max(100).optional(),
    donor_name: z.string().trim().min(2, 'দাতার নাম বাধ্যতামূলক।').max(100).optional(),
    phone: z.string().trim().min(6, 'মোবাইল নম্বর বাধ্যতামূলক।').max(20).optional(),
    donor_phone: z.string().trim().min(6, 'মোবাইল নম্বর বাধ্যতামূলক।').max(20).optional(),
    donor_email: z.string().trim().email('সঠিক ইমেইল দিন।').optional().or(z.literal('')),
    amount: z.coerce.number({ required_error: 'দানের পরিমাণ সংখ্যায় দিন।' })
      .positive('দানের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।')
      .max(10000000, 'অনলাইনে সর্বোচ্চ ১ কোটি টাকা পর্যন্ত অনুদান গ্রহণীয়।'),
    category: z.string().trim().max(60).optional().default('লিল্লাহ বোর্ডিং দান'),
    fund_type: z.string().trim().max(60).optional().default('সাধারণ দান ফান্ড'),
    payment_method: z.string().trim().max(30).optional().default('bKash'),
    trx_id: z.string({ required_error: 'ট্রানজ্যাকশন আইডি (TrxID) বাধ্যতামূলক।' })
      .trim()
      .min(3, 'সঠিক ট্রানজ্যাকশন আইডি দিন।')
      .max(50),
    notes: z.string().trim().max(300).optional().or(z.literal(''))
  }).refine(data => (data.name || data.donor_name) && (data.phone || data.donor_phone), {
    message: 'দাতার নাম এবং মোবাইল নম্বর উভয়ই প্রদান করা বাধ্যতামূলক।'
  }),

  // দ্রুত ফি পরিশোধ
  payFee: z.object({
    admission_no: z.string().trim().min(1, 'দাখেলা বা রোল নম্বর দিন।').max(50).optional(),
    student_id: z.union([z.string().trim().min(1), z.number().int().positive()]).optional(),
    amount: z.coerce.number({ required_error: 'পরিশোধের পরিমাণ সংখ্যায় দিন।' })
      .positive('পরিশোধের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।')
      .max(500000, 'অনলাইনে সর্বোচ্চ ৫ লক্ষ টাকা পরিশোধ করা যাবে।'),
    payment_method: z.string().trim().max(30).optional().default('bKash'),
    gateway: z.string().trim().max(30).optional().default('bKash'),
    trx_id: z.string({ required_error: 'ট্রানজ্যাকশন আইডি (TrxID) বাধ্যতামূলক।' })
      .trim()
      .min(3, 'সঠিক ট্রানজ্যাকশন আইডি দিন।')
      .max(50)
  }).refine(data => data.admission_no || data.student_id, {
    message: 'শিক্ষার্থীর দাখেলা বা রোল নম্বর প্রদান করুন।'
  })
};

module.exports = {
  validateBody,
  schemas,
  deepSanitize,
  sanitizeString
};
