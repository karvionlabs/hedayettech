// ==========================================
// গ্লোবাল ভেরিয়েবল ও ইনিশিয়ালাইজেশন
// ==========================================
let financeChartInstance = null;
let currentTab = 'dashboard';
let globalClasses = [];
let globalStudents = [];

document.addEventListener('DOMContentLoaded', () => {
  initDateDisplay();
  loadClasses();
});

// হিজরি ও বাংলা তারিখ
function initDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = new Date().toLocaleDateString('bn-BD', options);
  const el = document.getElementById('current-date-bn');
  if (el) el.innerText = dateStr;
}

// ==========================================
// হোম পেজ ও অ্যাডমিন কনসোল স্যুইচিং
// ==========================================
function openAdminConsole(targetTab = 'dashboard') {
  const home = document.getElementById('public-homepage');
  const admin = document.getElementById('admin-console');

  if (home && admin) {
    home.classList.add('hidden');
    admin.classList.remove('hidden');
    switchTab(targetTab);
  }
}

function closeAdminConsole() {
  const home = document.getElementById('public-homepage');
  const admin = document.getElementById('admin-console');

  if (home && admin) {
    admin.classList.add('hidden');
    home.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollToSection(id) {
  const home = document.getElementById('public-homepage');
  const admin = document.getElementById('admin-console');
  if (home && home.classList.contains('hidden')) {
    home.classList.remove('hidden');
    if (admin) admin.classList.add('hidden');
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function toggleMobileNav() {
  const menu = document.getElementById('mobileNavMenu');
  if (menu) menu.classList.toggle('hidden');
}

function filterHomeCategory(cat) {
  if (cat === 'হিফজ') {
    openAdminConsole('hifz');
  } else if (cat === 'কওমি') {
    openAdminConsole('academics');
  } else {
    openAdminConsole('students');
  }
}

// ==========================================
// ১. ট্যাব পরিবর্তনের ফাংশন
// ==========================================
function switchTab(tabId) {
  currentTab = tabId;

  // লুকানো ও দেখানো
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) targetPane.classList.remove('hidden');

  // সাইডবার অ্যাক্টিভ ক্লাস
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-madrasa-800', 'text-gold-400', 'font-bold');
    el.classList.add('hover:bg-madrasa-900/80', 'text-emerald-100');
  });

  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.classList.add('bg-madrasa-800', 'text-gold-400', 'font-bold');
    activeNav.classList.remove('hover:bg-madrasa-900/80', 'text-emerald-100');
  }

  // পেজ শিরোনাম আপডেট
  const titles = {
    dashboard: '১. ড্যাশবোর্ড ও সামগ্রিক পরিসংখ্যান',
    students: '২. শিক্ষার্থী ভর্তি ও প্রোফাইল ব্যবস্থাপনা',
    admissions: '৩. অনলাইন শিক্ষার্থী ভর্তি আবেদন প্যানেল',
    hifz: '৪. কুরআনুল কারীম হিফজ ও আমল খাতা',
    academics: '৫. কিতাব ও জামাত বিভাগ',
    library: '৬. মাদ্রাসার কিতাবখানা (লাইব্রেরি রেজিস্টার)',
    boarding: '৭. লিল্লাহ বোর্ডিং ও মেস বাজার খাতা',
    accounts: '৮. আয়-ব্যয়, বেতন ও ক্যাশ খাতা',
    donors: '৯. আজীবন সদস্য ও দাতা অনুদান ফান্ড',
    loans: '১০. করজে হাসানা ও মাদ্রাসা ঋণ খাতা',
    exams: '১১. পরীক্ষা, ফলাফল ও এডমিট কার্ড সেন্টার',
    staff: '১২. উস্তাদ ও কর্মকর্তা ডিরেক্টরি',
    leaves: '১৩. উস্তাদ ও কর্মচারীদের ছুটির ব্যবস্থাপনা',
    attendance: '১৪. ডিজিটাল উপস্থিতি ও অটো এসএমএস',
    health: '১৫. ছাত্র স্বাস্থ্য ও সিক-বে খাতা',
    gatepass: 'আবাসিক ছাত্র খুরুজ ও সিকিউরিটি গেটপাস',
    qurbani: 'কোরবানির চামড়া ও কালেকশন ক্যাম্পেইন',
    notices: '১৬. ডিজিটাল নোটিশ বোর্ড ও ঘোষণা',
    settings: '১৭. সিস্টেম সেটিংস ও লাইসেন্স'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.innerText = titles[tabId] || 'মাদ্রাসা ম্যানেজমেন্ট';

  // ডাটা লোড
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'students') loadStudents();
  if (tabId === 'gatepass') loadGatepasses();
  if (tabId === 'qurbani') loadQurbani();
  if (tabId === 'admissions') loadAdmissions();
  if (tabId === 'hifz') loadHifz();
  if (tabId === 'academics') loadClasses();
  if (tabId === 'library') loadLibrary();
  if (tabId === 'boarding') loadBoarding();
  if (tabId === 'accounts') loadAccounts();
  if (tabId === 'donors') loadDonors();
  if (tabId === 'loans') loadLoans();
  if (tabId === 'staff') loadStaff();
  if (tabId === 'leaves') loadLeaves();
  if (tabId === 'attendance') loadAttendance();
  if (tabId === 'health') loadHealth();
  if (tabId === 'notices') loadNotices();
  if (tabId === 'settings') loadSettings();
}

// ==========================================
// ২. ড্যাশবোর্ড ডাটা লোড
// ==========================================
async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setVal('dash-total-students', s.totalStudents.toLocaleString('bn-BD'));
    setVal('dash-residential-students', s.residentialCount.toLocaleString('bn-BD'));
    setVal('dash-non-residential', s.nonResidentialCount.toLocaleString('bn-BD'));
    setVal('dash-hifz-students', s.hifzStudents.toLocaleString('bn-BD'));

    setVal('dash-income', `৳ ${s.incomeThisMonth.toLocaleString('bn-BD')}`);
    setVal('dash-expense', `৳ ${s.expenseThisMonth.toLocaleString('bn-BD')}`);
    setVal('dash-balance', `৳ ${s.balance.toLocaleString('bn-BD')}`);

    setVal('dash-att-rate', `${s.todayAttendance.rate.toLocaleString('bn-BD')}%`);
    setVal('dash-att-present', s.todayAttendance.present.toLocaleString('bn-BD'));
    setVal('dash-att-absent', s.todayAttendance.absent.toLocaleString('bn-BD'));

    // চার্ট
    renderFinanceChart(s.incomeThisMonth, s.expenseThisMonth, s.balance);

    // সাম্প্রতিক ট্রানজেকশন
    const tbody = document.getElementById('dash-recent-tx-body');
    if (tbody) {
      tbody.innerHTML = '';
      data.recentTransactions.forEach(t => {
        const isIncome = t.type === 'INCOME';
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        tr.innerHTML = `
          <td class="p-3 font-mono font-bold text-slate-700">${t.voucher_no}</td>
          <td class="p-3">${t.date}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${isIncome ? 'টাকা জমা' : 'টাকা খরচ'}
            </span>
          </td>
          <td class="p-3 font-semibold">${t.category}</td>
          <td class="p-3 text-slate-600">${t.student_name ? t.student_name : (t.description || '-')}</td>
          <td class="p-3"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">${t.payment_method}</span></td>
          <td class="p-3 text-right font-black ${isIncome ? 'text-emerald-700' : 'text-rose-600'}">
            ${isIncome ? '+' : '-'} ৳ ${t.amount.toLocaleString('bn-BD')}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderFinanceChart(income, expense, balance) {
  const ctx = document.getElementById('financeChart');
  if (!ctx) return;

  if (financeChartInstance) {
    financeChartInstance.destroy();
  }

  financeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['মোট আয় (জমা)', 'মোট ব্যয় (খরচ)', 'উদ্বৃত্ত ক্যাশ ব্যালেন্স'],
      datasets: [{
        label: 'টাকা (BDT)',
        data: [income, expense, balance > 0 ? balance : 0],
        backgroundColor: [
          'rgba(22, 163, 74, 0.85)',
          'rgba(225, 29, 72, 0.85)',
          'rgba(212, 175, 55, 0.85)'
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => '৳ ' + v
          }
        }
      }
    }
  });
}

// ==========================================
// ৩. জামাত ও ক্লাস লোড
// ==========================================
async function loadClasses() {
  try {
    const res = await fetch('/api/academics/classes');
    const data = await res.json();
    if (!data.success) return;

    globalClasses = data.classes;

    const modalSel = document.getElementById('modalClassSelect');
    const filterSel = document.getElementById('studentClassFilter');
    if (modalSel) modalSel.innerHTML = '<option value="">জামাত বেছে নিন</option>';
    if (filterSel) filterSel.innerHTML = '<option value="">সকল জামাত / বিভাগ</option>';

    const grid = document.getElementById('classes-grid');
    if (grid) grid.innerHTML = '';

    data.classes.forEach(c => {
      if (modalSel) modalSel.innerHTML += `<option value="${c.id}">${c.name_bn}</option>`;
      if (filterSel) filterSel.innerHTML += `<option value="${c.id}">${c.name_bn}</option>`;

      if (grid) {
        grid.innerHTML += `
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-madrasa-600 transition">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs bg-madrasa-50 text-madrasa-800 font-bold px-2 py-0.5 rounded-full border border-madrasa-200">ক্রমিক: ০${c.id}</span>
                <span class="text-xs text-slate-500 font-bold">${c.student_count.toLocaleString('bn-BD')} জন ছাত্র</span>
              </div>
              <h4 class="font-extrabold text-base text-madrasa-950">${c.name_bn}</h4>
              <p class="font-arabic text-xs text-emerald-800 font-bold mt-0.5">${c.name_ar || ''}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>মাসিক ফি: <b>৳ ${c.monthly_fee.toLocaleString('bn-BD')}</b></span>
              <span>বোর্ডিং: <b>৳ ${c.residential_fee.toLocaleString('bn-BD')}</b></span>
            </div>
          </div>
        `;
      }
    });
  } catch (err) {
    console.error('Error loading classes:', err);
  }
}

// ==========================================
// ৪. শিক্ষার্থী তালিকা লোড
// ==========================================
async function loadStudents() {
  try {
    const search = document.getElementById('studentSearchInput')?.value || '';
    const classId = document.getElementById('studentClassFilter')?.value || '';
    const residential = document.getElementById('studentResFilter')?.value || '';

    const url = `/api/students?search=${encodeURIComponent(search)}&class_id=${classId}&residential=${residential}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) return;

    globalStudents = data.students;

    const hifzStudentSelect = document.getElementById('modalHifzStudentSelect');
    if (hifzStudentSelect) {
      hifzStudentSelect.innerHTML = '<option value="">শিক্ষার্থী বেছে নিন</option>';
      data.students.forEach(s => {
        hifzStudentSelect.innerHTML += `<option value="${s.id}">[${s.admission_no}] ${s.name_bn} (রোল: ${s.roll_no})</option>`;
      });
    }

    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="p-6 text-center text-slate-400">কোনো শিক্ষার্থী পাওয়া যায়নি</td></tr>`;
      return;
    }

    data.students.forEach(s => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
      tr.innerHTML = `
        <td class="p-3.5 font-mono font-bold text-madrasa-900">${s.admission_no}</td>
        <td class="p-3.5 font-bold">${s.roll_no.toLocaleString('bn-BD')}</td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800 text-sm">${s.name_bn}</div>
          <div class="font-arabic text-emerald-800 text-xs">${s.name_ar || ''}</div>
        </td>
        <td class="p-3.5 font-semibold text-slate-700">${s.class_name || '-'}</td>
        <td class="p-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.residential ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
            ${s.residential ? 'আবাসিক' : 'অনাবাসিক'}
          </span>
          ${s.free_type === 'FULL_FREE' ? `
            <span class="block mt-1 bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[9px] font-black">
              মুফত এতিম (${s.sponsor_name || 'লিল্লাহ ফান্ড'})
            </span>
          ` : (s.free_type === 'HALF_FREE' ? `
            <span class="block mt-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
              অর্ধ-মুফত (${s.sponsor_name || 'দাতা অনুদান'})
            </span>
          ` : '')}
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800">${s.guardian_name}</div>
          <div class="text-[11px] text-slate-500 font-mono"><i class="fa-solid fa-phone text-emerald-600"></i> ${s.guardian_phone}</div>
        </td>
        <td class="p-3.5"><span class="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">${s.blood_group || 'O+'}</span></td>
        <td class="p-3.5 text-right font-bold text-madrasa-900">৳ ${s.monthly_fee.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 text-center">
          <button onclick="printIdCard('${s.name_bn}', '${s.admission_no}', '${s.roll_no}', '${s.class_name}')" class="text-xs bg-slate-100 hover:bg-madrasa-900 hover:text-white px-2.5 py-1.5 rounded-lg transition" title="ডিজিটাল আইডি কার্ড">
            <i class="fa-solid fa-id-card"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading students:', err);
  }
}

// ==========================================
// ৫. হিফজ ট্র্যাকার লোড
// ==========================================
async function loadHifz() {
  try {
    const res = await fetch('/api/hifz');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('hifz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.logs.forEach(h => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
      tr.innerHTML = `
        <td class="p-3 font-mono text-slate-500">${h.date}</td>
        <td class="p-3">
          <div class="font-bold text-slate-900">${h.student_name}</div>
          <div class="text-[11px] text-slate-400 font-mono">${h.admission_no}</div>
        </td>
        <td class="p-3 font-bold text-madrasa-800">
          পারা: ${h.sabaq_para.toLocaleString('bn-BD')} (পৃষ্ঠা: ${h.sabaq_page.toLocaleString('bn-BD')})
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${h.sabaq_status === 'মুমতাজ' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${h.sabaq_status}
          </span>
        </td>
        <td class="p-3">পারা: ${h.saat_sabaq_para ? h.saat_sabaq_para.toLocaleString('bn-BD') : '-'}</td>
        <td class="p-3">পারা: ${h.amokhta_para ? h.amokhta_para.toLocaleString('bn-BD') : '-'}</td>
        <td class="p-3 font-bold ${h.mistake_count > 0 ? 'text-rose-600' : 'text-emerald-700'}">${h.mistake_count.toLocaleString('bn-BD')} টি</td>
        <td class="p-3 text-slate-600 italic">${h.remarks || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading hifz:', err);
  }
}

// ==========================================
// ৬. লিল্লাহ বোর্ডিং ও বাজার লোড
// ==========================================
async function loadBoarding() {
  try {
    const res = await fetch('/api/boarding');
    const data = await res.json();
    if (!data.success) return;

    const totalEl = document.getElementById('boarding-total-cost');
    if (totalEl) totalEl.innerText = `৳ ${data.summary.totalCost.toLocaleString('bn-BD')}`;

    const tbody = document.getElementById('boarding-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.bazaar.forEach(b => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
      tr.innerHTML = `
        <td class="p-3.5 font-mono text-slate-500">${b.date}</td>
        <td class="p-3.5 font-bold text-slate-800">${b.item_name}</td>
        <td class="p-3.5"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">${b.category}</span></td>
        <td class="p-3.5 font-mono">${b.quantity_kg.toLocaleString('bn-BD')} কেজি</td>
        <td class="p-3.5">৳ ${b.unit_price.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 text-right font-black text-rose-600">৳ ${b.total_cost.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 text-slate-400 font-mono">${b.memo_no || '-'}</td>
        <td class="p-3.5 text-slate-600">${b.purchaser_name || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading boarding:', err);
  }
}

// ==========================================
// ৭. হিসাব ও ক্যাশ খাতা লোড
// ==========================================
async function loadAccounts() {
  try {
    const res = await fetch('/api/accounts/transactions');
    const data = await res.json();
    if (!data.success) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setVal('acc-total-income', `৳ ${data.summary.totalIncome.toLocaleString('bn-BD')}`);
    setVal('acc-total-expense', `৳ ${data.summary.totalExpense.toLocaleString('bn-BD')}`);
    setVal('acc-net-cash', `৳ ${data.summary.netCash.toLocaleString('bn-BD')}`);

    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.transactions.forEach(t => {
      const isIncome = t.type === 'INCOME';
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
      tr.innerHTML = `
        <td class="p-3.5 font-mono font-bold text-madrasa-900">${t.voucher_no}</td>
        <td class="p-3.5 font-mono text-slate-500">${t.date}</td>
        <td class="p-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${isIncome ? 'টাকা জমা' : 'টাকা খরচ'}
          </span>
        </td>
        <td class="p-3.5 font-bold">${t.category}</td>
        <td class="p-3.5 text-slate-600">${t.student_name ? t.student_name : (t.description || '-')}</td>
        <td class="p-3.5"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">${t.payment_method}</span></td>
        <td class="p-3.5 text-slate-600">${t.received_by || '-'}</td>
        <td class="p-3.5 text-right font-black ${isIncome ? 'text-emerald-700' : 'text-rose-600'}">
          ${isIncome ? '+' : '-'} ৳ ${t.amount.toLocaleString('bn-BD')}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading accounts:', err);
  }
}

// ==========================================
// ৮. উস্তাদ ও স্টাফ লোড
// ==========================================
async function loadStaff() {
  try {
    const res = await fetch('/api/staff');
    const data = await res.json();
    if (!data.success) return;

    const totalEl = document.getElementById('staff-total-salary');
    if (totalEl) totalEl.innerText = `৳ ${data.totalSalary.toLocaleString('bn-BD')}`;

    const grid = document.getElementById('staff-grid');
    if (!grid) return;
    grid.innerHTML = '';

    data.staff.forEach(s => {
      grid.innerHTML += `
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-madrasa-700 transition">
          <div>
            <div class="w-12 h-12 rounded-full bg-madrasa-50 text-madrasa-800 font-bold flex items-center justify-center text-lg mb-3 border border-madrasa-200">
              ${s.name.charAt(0)}
            </div>
            <h4 class="font-extrabold text-sm text-slate-900">${s.name}</h4>
            <p class="text-xs text-emerald-700 font-bold mt-0.5">${s.designation}</p>
            <p class="text-[11px] text-slate-400 font-mono mt-2"><i class="fa-solid fa-phone"></i> ${s.phone}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-500">মাসিক হাদিয়া:</span>
            <span class="font-bold text-madrasa-900">৳ ${s.salary.toLocaleString('bn-BD')}</span>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('Error loading staff:', err);
  }
}

// ==========================================
// ৯. উপস্থিতি লোড ও টগল
// ==========================================
async function loadAttendance() {
  try {
    const res = await fetch('/api/attendance');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.records.forEach(r => {
      const isPresent = r.status === 'PRESENT';
      const isAbsent = r.status === 'ABSENT';
      const isLeave = r.status === 'LEAVE';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
      tr.innerHTML = `
        <td class="p-3.5 font-bold">${r.roll_no.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 font-mono text-madrasa-900">${r.admission_no}</td>
        <td class="p-3.5 font-bold text-slate-800">${r.name_bn}</td>
        <td class="p-3.5 font-medium text-slate-600">${r.class_name || '-'}</td>
        <td class="p-3.5 font-mono text-slate-500">${r.punch_time || '-'}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${isPresent ? 'bg-emerald-100 text-emerald-800' : (isAbsent ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}">
            ${isPresent ? 'উপস্থিত' : (isAbsent ? 'অনুপস্থিত' : (isLeave ? 'ছুটি' : 'এন্ট্রি নেই'))}
          </span>
        </td>
        <td class="p-3.5 text-center space-x-1">
          <button onclick="updateAttendance(${r.student_id}, 'PRESENT')" class="px-2.5 py-1 text-xs rounded-lg font-bold ${isPresent ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'}">উপস্থিত</button>
          <button onclick="updateAttendance(${r.student_id}, 'ABSENT')" class="px-2.5 py-1 text-xs rounded-lg font-bold ${isAbsent ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-100'}">অনুপস্থিত</button>
          <button onclick="updateAttendance(${r.student_id}, 'LEAVE')" class="px-2.5 py-1 text-xs rounded-lg font-bold ${isLeave ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-amber-100'}">ছুটি</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading attendance:', err);
  }
}

async function updateAttendance(studentId, status) {
  try {
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, status })
    });
    loadAttendance();
    loadDashboard();
  } catch (err) {
    console.error('Error updating attendance:', err);
  }
}

// ==========================================
// ১০. সেটিংস লোড
// ==========================================
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (!data.success || !data.institution) return;

    const inst = data.institution;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };
    setVal('set-name-bn', inst.name_bn);
    setVal('set-name-ar', inst.name_ar || '-');
    setVal('set-muhtamim', inst.muhtamim_name);
    setVal('set-phone', inst.phone);
    setVal('set-address', inst.address);
    setVal('set-license', inst.license_expiry);
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

// ==========================================
// ইউনিভার্সাল সার্চ ও অনলাইন রেজাল্ট ফাংশন
// ==========================================
async function handleUniversalSearch(e) {
  e.preventDefault();
  const query = document.getElementById('universalSearchInput').value.trim();
  if (!query) return;

  // Search in students API
  const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
  const data = await res.json();

  if (data.success && data.students.length > 0) {
    const s = data.students[0];
    alert(`🔍 পাওয়া গেছে: ${s.name_bn} | দাখেলা: ${s.admission_no} | রোল: ${s.roll_no} | জামাত: ${s.class_name}\n\nসরাসরি ড্যাশবোর্ডে প্রোফাইল ওপেন করা হচ্ছে...`);
    openAdminConsole('students');
    const searchInput = document.getElementById('studentSearchInput');
    if (searchInput) {
      searchInput.value = s.admission_no;
      loadStudents();
    }
  } else {
    alert(`"${query}" দিয়ে কোনো তথ্য পাওয়া যায়নি। সরাসরি ম্যানেজমেন্ট ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...`);
    openAdminConsole('students');
  }
}

async function checkOnlineResult() {
  const query = document.getElementById('resultSearchRoll').value.trim();
  const output = document.getElementById('resultOutput');
  if (!query) {
    alert('অনুগ্রহ করে দাখেলা বা রোল নম্বর লিখুন');
    return;
  }

  const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
  const data = await res.json();

  if (data.success && data.students.length > 0) {
    const s = data.students[0];
    output.classList.remove('hidden');
    output.innerHTML = `
      <div class="space-y-1.5">
        <div class="text-sm font-bold text-madrasa-900">${s.name_bn}</div>
        <div class="text-xs text-slate-600">দাখেলা: <b>${s.admission_no}</b> | রোল: <b>${s.roll_no}</b></div>
        <div class="text-xs text-slate-600">জামাত: <b>${s.class_name}</b></div>
        <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700">ফলাফল গ্রেড:</span>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">মুমতাজ (A+)</span>
        </div>
      </div>
    `;
  } else {
    output.classList.remove('hidden');
    output.innerHTML = `<p class="text-rose-600 font-bold">কোনো ফলাফল পাওয়া যায়নি!</p>`;
  }
}

// ==========================================
// সিকিউরড ফ্রি ডেমো বুকিং ও লাইভ ভ্যালিডেশন ইঞ্জিন
// ==========================================

// ১. কপি/কাট ও অ্যান্টি-স্ক্র্যাপিং প্রোটেকশন
function handlePreventCopy(e) {
  e.preventDefault();
  const alertEl = document.getElementById('demoGlobalAlert');
  const alertText = document.getElementById('demoGlobalAlertText');
  if (alertEl && alertText) {
    alertText.innerText = 'NOT ALLOWED: সিকিউরিটির স্বার্থে এই ফর্মের তথ্য কপি বা স্ক্র্যাপ করা নিষিদ্ধ!';
    alertEl.classList.remove('hidden');
    setTimeout(() => {
      alertEl.classList.add('hidden');
    }, 3000);
  }
  return false;
}

// ২. মাদরাসা বা স্কুলের নাম ভ্যালিডেশন
function validateMadrasaName() {
  const input = document.getElementById('demoMadrasaName');
  const errorEl = document.getElementById('error-demoMadrasaName');
  const iconEl = document.getElementById('icon-demoMadrasaName');
  const statusEl = document.getElementById('status-demoMadrasaName');
  if (!input) return false;

  const val = input.value.trim().replace(/[<>'"`;\\]/g, '');
  if (!val || val.length < 3) {
    input.classList.remove('border-emerald-500', 'border-slate-300', 'bg-emerald-50/20');
    input.classList.add('border-red-500', 'bg-red-50/30');
    errorEl?.classList.remove('hidden');
    if (iconEl) {
      iconEl.className = 'absolute right-3 top-3 text-red-500';
      iconEl.innerHTML = '<i class="fa-solid fa-ban"></i>';
      iconEl.classList.remove('hidden');
    }
    if (statusEl) {
      statusEl.innerText = 'অসম্পূর্ণ ✕';
      statusEl.className = 'text-[10px] text-red-500 font-bold';
    }
    return false;
  } else {
    input.classList.remove('border-red-500', 'bg-red-50/30');
    input.classList.add('border-emerald-500', 'bg-emerald-50/10');
    errorEl?.classList.add('hidden');
    if (iconEl) {
      iconEl.className = 'absolute right-3 top-3 text-emerald-600';
      iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      iconEl.classList.remove('hidden');
    }
    if (statusEl) {
      statusEl.innerText = 'সঠিক ✓';
      statusEl.className = 'text-[10px] text-emerald-600 font-bold';
    }
    return true;
  }
}

// ৩. নাম ও পদবী ভ্যালিডেশন
function validatePersonName() {
  const input = document.getElementById('demoPersonName');
  const errorEl = document.getElementById('error-demoPersonName');
  const iconEl = document.getElementById('icon-demoPersonName');
  const statusEl = document.getElementById('status-demoPersonName');
  if (!input) return false;

  const val = input.value.trim().replace(/[<>'"`;\\]/g, '');
  if (!val || val.length < 3) {
    input.classList.remove('border-emerald-500', 'border-slate-300', 'bg-emerald-50/20');
    input.classList.add('border-red-500', 'bg-red-50/30');
    errorEl?.classList.remove('hidden');
    if (iconEl) {
      iconEl.className = 'absolute right-3 top-3 text-red-500';
      iconEl.innerHTML = '<i class="fa-solid fa-ban"></i>';
      iconEl.classList.remove('hidden');
    }
    if (statusEl) {
      statusEl.innerText = 'অসম্পূর্ণ ✕';
      statusEl.className = 'text-[10px] text-red-500 font-bold';
    }
    return false;
  } else {
    input.classList.remove('border-red-500', 'bg-red-50/30');
    input.classList.add('border-emerald-500', 'bg-emerald-50/10');
    errorEl?.classList.add('hidden');
    if (iconEl) {
      iconEl.className = 'absolute right-3 top-3 text-emerald-600';
      iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      iconEl.classList.remove('hidden');
    }
    if (statusEl) {
      statusEl.innerText = 'সঠিক ✓';
      statusEl.className = 'text-[10px] text-emerald-600 font-bold';
    }
    return true;
  }
}

// ৪. মোবাইল নম্বর টাইপিং ও ফিল্টারিং
function handlePhoneInput(input) {
  // শুধু সংখ্যা রাখা
  input.value = input.value.replace(/\D/g, '').slice(0, 11);
  const counter = document.getElementById('phone-digit-counter');
  if (counter) {
    counter.innerText = `${input.value.length}/১১ ডিজিট`;
    if (input.value.length === 11) {
      counter.className = 'text-[10px] text-emerald-600 font-bold font-mono';
    } else {
      counter.className = 'text-[10px] text-slate-500 font-mono';
    }
  }
  if (input.value.length === 11) {
    validatePhoneNumber();
  }
}

// ৫. মোবাইল নম্বর ভ্যালিডেশন (১১ সংখ্যার বাংলাদেশি ফরম্যাট)
function validatePhoneNumber() {
  const input = document.getElementById('demoPhone');
  const errorEl = document.getElementById('error-demoPhone');
  const iconEl = document.getElementById('icon-demoPhone');
  if (!input) return false;

  const phone = input.value.trim().replace(/\D/g, '');
  const bdRegex = /^01[3-9]\d{8}$/;

  if (!bdRegex.test(phone) || phone.length !== 11) {
    input.classList.remove('border-emerald-500', 'border-slate-900', 'bg-emerald-50/20');
    input.classList.add('border-red-500', 'bg-red-50/30');
    errorEl?.classList.remove('hidden');
    if (iconEl) {
      iconEl.className = 'absolute right-3 top-3 text-red-500';
      iconEl.innerHTML = '<i class="fa-solid fa-ban"></i>';
      iconEl.classList.remove('hidden');
    }
    return false;
  } else {
    input.classList.remove('border-red-500', 'bg-red-50/30');
    input.classList.add('border-emerald-500', 'bg-emerald-50/10');
    errorEl?.classList.add('hidden');
    if (iconEl) {
      iconEl.className = 'absolute right-3 top-3 text-emerald-600';
      iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      iconEl.classList.remove('hidden');
    }
    return true;
  }
}

// ৬. প্রতিষ্ঠানের ধরণ ভ্যালিডেশন
function validateInstitutionType() {
  const select = document.getElementById('demoType');
  const errorEl = document.getElementById('error-demoType');
  const statusEl = document.getElementById('status-demoType');
  if (!select) return false;

  if (!select.value || select.value === '') {
    select.classList.remove('border-emerald-500', 'border-slate-300', 'bg-emerald-50/20');
    select.classList.add('border-red-500', 'bg-red-50/30');
    errorEl?.classList.remove('hidden');
    if (statusEl) {
      statusEl.innerText = 'নির্বাচন করুন ✕';
      statusEl.className = 'text-[10px] text-red-500 font-bold';
    }
    return false;
  } else {
    select.classList.remove('border-red-500', 'bg-red-50/30');
    select.classList.add('border-emerald-500', 'bg-emerald-50/10');
    errorEl?.classList.add('hidden');
    if (statusEl) {
      statusEl.innerText = 'বাছাইকৃত ✓';
      statusEl.className = 'text-[10px] text-emerald-600 font-bold';
    }
    return true;
  }
}

// ৭. ডেমো সাবমিট হ্যান্ডলার (কঠোর ক্লায়েন্ট ও সার্ভার সিকিউরিটি চেক)
async function handleBookDemo(e) {
  e.preventDefault();

  const honeypot = document.getElementById('demoHoneypot')?.value;
  if (honeypot && honeypot.trim() !== '') {
    console.warn('Bot submission blocked');
    return false;
  }

  // সব ফিল্ডের ভ্যালিডেশন রান করা
  const isMadrasaOk = validateMadrasaName();
  const isPersonOk = validatePersonName();
  const isPhoneOk = validatePhoneNumber();
  const isTypeOk = validateInstitutionType();

  const globalAlert = document.getElementById('demoGlobalAlert');
  const globalAlertText = document.getElementById('demoGlobalAlertText');
  const submitBtn = document.getElementById('btnDemoSubmit');

  // যদি একটিও ফিল্ড ভুল থাকে => নট অ্যালাও!
  if (!isMadrasaOk || !isPersonOk || !isPhoneOk || !isTypeOk) {
    if (globalAlert && globalAlertText) {
      globalAlertText.innerText = 'NOT ALLOWED: চিহ্নিত ফিল্ডগুলো সঠিকভাবে পূরণ না করলে ডেমো বুকিং কনফার্ম হবে না!';
      globalAlert.classList.remove('hidden');
    }

    // বাটন ফিডব্যাক (রেড ও ভাইব্রেশন ইফেক্ট)
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.classList.add('bg-red-700', 'animate-pulse');
      submitBtn.innerHTML = '<i class="fa-solid fa-ban text-white"></i><span>NOT ALLOWED - ভুলগুলো সংশোধন করুন</span>';
      
      setTimeout(() => {
        submitBtn.classList.remove('bg-red-700', 'animate-pulse');
        submitBtn.innerHTML = originalText;
      }, 2500);
    }

    // প্রথম ইনভ্যালিড ফিল্ডে ফোকাস করা
    if (!isMadrasaOk) document.getElementById('demoMadrasaName')?.focus();
    else if (!isPersonOk) document.getElementById('demoPersonName')?.focus();
    else if (!isPhoneOk) document.getElementById('demoPhone')?.focus();
    else if (!isTypeOk) document.getElementById('demoType')?.focus();

    return false;
  }

  // সমস্ত তথ্য সঠিক হলে ব্যাকএন্ডে সুরক্ষিত সাবমিশন
  const madrasa = document.getElementById('demoMadrasaName').value.trim();
  const person = document.getElementById('demoPersonName').value.trim();
  const phone = document.getElementById('demoPhone').value.trim().replace(/\D/g, '');
  const type = document.getElementById('demoType').value;

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>যাচাই করা হচ্ছে...</span>';
    }

    const res = await fetch('/api/leads/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        madrasa_name: madrasa,
        person_name: person,
        phone: phone,
        institution_type: type,
        website_hp: honeypot || ''
      })
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      // সার্ভার সাইড এরর মেসেজ প্রদর্শন
      if (globalAlert && globalAlertText) {
        globalAlertText.innerText = result.error || 'NOT ALLOWED: সঠিক তথ্য প্রদান করুন!';
        globalAlert.classList.remove('hidden');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-300"></i><span>ডেমো কনফার্ম করুন</span>';
      }
      return false;
    }

    // সফল হলে সাকসেস স্টেট দেখানো
    document.getElementById('demoBookingForm')?.classList.add('hidden');
    globalAlert?.classList.add('hidden');

    const successState = document.getElementById('demoSuccessState');
    if (successState) {
      document.getElementById('confirmedMadrasa').innerText = madrasa;
      document.getElementById('confirmedPerson').innerText = `${person} (${type})`;
      document.getElementById('confirmedPhone').innerText = phone;
      successState.classList.remove('hidden');
    }
  } catch (err) {
    if (globalAlert && globalAlertText) {
      globalAlertText.innerText = 'NOT ALLOWED: সার্ভারের সাথে সংযোগে ব্যর্থ হয়েছে!';
      globalAlert.classList.remove('hidden');
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-300"></i><span>ডেমো কনফার্ম করুন</span>';
    }
  }
}

// ৮. ডেমো মোডাল রিসেট ও ক্লোজ
function resetAndCloseDemoModal() {
  const form = document.getElementById('demoBookingForm');
  form?.reset();
  form?.classList.remove('hidden');
  
  document.getElementById('demoSuccessState')?.classList.add('hidden');
  document.getElementById('demoGlobalAlert')?.classList.add('hidden');

  // স্টাইল ক্লিয়ার করা
  ['demoMadrasaName', 'demoPersonName', 'demoPhone', 'demoType'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = el.id === 'demoPhone' 
        ? 'w-full border-2 border-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 transition'
        : 'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition';
    }
    const err = document.getElementById(`error-${id}`);
    err?.classList.add('hidden');
    const icon = document.getElementById(`icon-${id}`);
    icon?.classList.add('hidden');
  });

  const counter = document.getElementById('phone-digit-counter');
  if (counter) counter.innerText = '০/১১ ডিজিট';

  const btn = document.getElementById('btnDemoSubmit');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-300"></i><span>ডেমো কনফার্ম করুন</span>';
  }

  closeModal('bookDemoModal');
}

// ==========================================
// মোডাল হ্যান্ডলার
// ==========================================
function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

async function submitStudentForm(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert(`আলহামদুলিল্লাহ! শিক্ষার্থী সফলভাবে ভর্তি সম্পন্ন হয়েছে। দাখেলা নং: ${result.admission_no}`);
      closeModal('addStudentModal');
      e.target.reset();
      loadStudents();
      loadDashboard();
    }
  } catch (err) {
    alert('ভর্তি প্রক্রিয়া ব্যর্থ হয়েছে!');
  }
}

async function submitHifzForm(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/hifz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert('আলহামদুলিল্লাহ! হিফজ সবক সফলভাবে সংরক্ষণ করা হয়েছে।');
      closeModal('addHifzModal');
      e.target.reset();
      loadHifz();
    }
  } catch (err) {
    alert('হিফজ এন্ট্রি ব্যর্থ হয়েছে!');
  }
}

async function submitTxForm(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/accounts/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert(`ভাউচার সফলভাবে তৈরি হয়েছে! ভাউচার নং: ${result.voucher_no}`);
      closeModal('addTransactionModal');
      e.target.reset();
      loadAccounts();
      loadDashboard();
    }
  } catch (err) {
    alert('ভাউচার তৈরি ব্যর্থ হয়েছে!');
  }
}

async function submitBazaarForm(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/boarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert('বোর্ডিং বাজার খরচ সফলভাবে ক্যাশ খাতায় যোগ করা হয়েছে!');
      closeModal('addBazaarModal');
      e.target.reset();
      loadBoarding();
      loadDashboard();
    }
  } catch (err) {
    alert('বাজার এন্ট্রি ব্যর্থ হয়েছে!');
  }
}

function printIdCard(name, admissionNo, roll, className) {
  const printWindow = window.open('', '', 'width=450,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>শিক্ষার্থী ডিজিটাল আইডি কার্ড</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #eee; }
          .card { width: 320px; height: 480px; background: white; border-radius: 16px; border: 3px solid #145032; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); text-align: center; }
          .header { background: #145032; color: #d4af37; padding: 20px 10px; }
          .header h3 { margin: 0; font-size: 16px; font-weight: bold; }
          .header p { margin: 4px 0 0; font-size: 11px; color: #a7f3d0; }
          .avatar { width: 90px; height: 90px; border-radius: 50%; border: 3px solid #d4af37; margin: 20px auto 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #145032; }
          .name { font-size: 18px; font-weight: bold; color: #145032; margin-bottom: 5px; }
          .info { font-size: 13px; color: #475569; line-height: 1.6; margin-top: 15px; }
          .footer { margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h3>হেদায়েত টেক মাদ্রাসা</h3>
            <p>ডিজিটাল স্টুডেন্ট আইডি কার্ড</p>
          </div>
          <div class="avatar">👤</div>
          <div class="name">${name}</div>
          <div class="info">
            <div><b>দাখেলা নং:</b> ${admissionNo}</div>
            <div><b>রোল নম্বর:</b> ${roll}</div>
            <div><b>জামাত:</b> ${className}</div>
            <div><b>সেশন:</b> ২০২৬-২০২৭</div>
          </div>
          <div class="footer">
            মুহতামিমের স্বাক্ষর ও সিল
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function exportBackup() {
  window.location.href = '/api/backup';
}

// ==========================================
// মাদ্রাসা সফটওয়্যার খরচ ক্যালকুলেটর ইঞ্জিন
// ==========================================
function updateCostCalculator() {
  const range = document.getElementById('calcStudentRange');
  const display = document.getElementById('calcStudentDisplay');
  if (!range || !display) return;

  const students = parseInt(range.value, 10);
  display.innerText = students;

  // প্যাকেজ চেক
  const pkg = document.querySelector('input[name="calcPackage"]:checked')?.value || 'yearly';
  
  // প্যাকেজ রেডিও লেবেল স্টাইলিং
  ['lblPkgYearly', 'lblPkgMonthly', 'lblPkgLifetime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'cursor-pointer border-2 border-slate-200 rounded-xl p-3 text-center transition flex flex-col items-center';
    }
  });

  let licenseCost = 5000;
  let monthsCount = 12;

  if (pkg === 'monthly') {
    licenseCost = 500;
    monthsCount = 1;
    document.getElementById('lblPkgMonthly')?.classList.add('border-emerald-700', 'bg-emerald-50/40');
  } else if (pkg === 'lifetime') {
    licenseCost = 20000;
    monthsCount = 36; // ৩ বছরের হিসাবে গড়
    document.getElementById('lblPkgLifetime')?.classList.add('border-emerald-700', 'bg-emerald-50/40');
  } else {
    licenseCost = 5000;
    monthsCount = 12;
    document.getElementById('lblPkgYearly')?.classList.add('border-emerald-700', 'bg-emerald-50/40');
  }

  // ইনস্টলেশন চার্জ (২০০ এর কম হলে ২,০০০৳, বেশি হলে ৫,০০০৳)
  const installCost = students < 200 ? 2000 : 5000;

  // আরএফআইডি আইডি কার্ড (১৫০৳ প্রতি কার্ড)
  const includeCards = document.getElementById('calcIncludeCards')?.checked;
  const cardCost = includeCards ? (students * 150) : 0;

  // এসএমএস প্যাক (২,০০০৳)
  const includeSms = document.getElementById('calcIncludeSms')?.checked;
  const smsCost = includeSms ? 2000 : 0;

  // মোট প্রাথমিক বিনিয়োগ
  const totalCost = licenseCost + installCost + cardCost + smsCost;

  // প্রতি ছাত্রের মাসিক খরচ
  const perStudentMonthly = ((totalCost / monthsCount) / students).toFixed(2);

  // ডিসপ্লে আপডেট
  document.getElementById('resLicenseCost').innerText = `${licenseCost.toLocaleString('bn-BD')} ৳`;
  document.getElementById('resInstallCost').innerText = `${installCost.toLocaleString('bn-BD')} ৳`;
  document.getElementById('resCardCost').innerText = `${cardCost.toLocaleString('bn-BD')} ৳`;
  document.getElementById('resSmsCost').innerText = `${smsCost.toLocaleString('bn-BD')} ৳`;
  document.getElementById('resTotalCost').innerText = `${totalCost.toLocaleString('bn-BD')} ৳`;
  
  const perStudentEl = document.getElementById('resPerStudentCost');
  if (perStudentEl) {
    perStudentEl.innerHTML = `প্রতি ছাত্রের মাসিক খরচ মাত্র: <strong>${perStudentMonthly} টাকা</strong>`;
  }
}

// ==========================================
// FAQ টগল হ্যান্ডলার
// ==========================================
function toggleFaq(id) {
  const content = document.getElementById(id);
  const icon = document.getElementById(`${id}-icon`);
  if (!content) return;

  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    icon?.classList.add('rotate-180');
  } else {
    content.classList.add('hidden');
    icon?.classList.remove('rotate-180');
  }
}

// ==========================================
// প্রিন্ট ডকুমেন্ট প্রিভিউয়ার
// ==========================================
function previewPrintDoc(type) {
  const titles = {
    'admit-card': '১২টি ভিন্ন ইসলামিক ও আধুনিক এডমিট কার্ড ডিজাইন',
    'money-receipt': '৩ কপি কার্বনলেস মানি রসিদ (ছাত্র, অফিস ও ক্যাশিয়ার কপি)',
    'marksheet': 'বেফাকুল মাদারিসিল আরাবিয়া ও সাধারণ মার্কশিট শিট',
    'id-card': '৮টি ভিন্ন রেডিমেড ডিজিটাল পিভিসি আইডি কার্ড',
    'seat-plan': 'পরীক্ষা হলের সিট প্ল্যান ও বেঞ্চ নম্বর স্টিকার',
    'certificate': 'চারিত্রিক সনদপত্র, টিসি ও প্রশংসাপত্র'
  };

  alert(`📄 ${titles[type] || 'ডকুমেন্ট প্রিভিউ'}\n\nহেদায়েত টেক মাদ্রাসা সফটওয়্যার থেকে এই ডকুমেন্টটি স্বয়ংক্রিয়ভাবে মাদ্রাসার নাম, লোগো ও শিক্ষার্থীর ছবিসহ সরাসরি এ৪ ও থার্মাল পেপারে প্রিন্ট হবে।`);
}

// ==========================================
// প্রিন্ট ডকুমেন্টেশন সেন্টার ফাংশনসমূহ (SABAAQ-STYLE PRINT CENTER)
// ==========================================

// ১. তিন-কপি মানি রসিদ (ছাত্র, অফিস ও ক্যাশিয়ার কপি)
function print3PartReceipt(voucherNo, date, studentName, className, amount, desc) {
  const w = window.open('', '', 'width=900,height=700');
  const createSlip = (copyName) => `
    <div style="flex: 1; border: 1.5px dashed #15803d; border-radius: 12px; padding: 12px; background: #fff; margin: 0 4px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <h3 style="margin: 0; color: #0c351f; font-size: 15px; font-weight: bold;">উম্মে কুলসুম (রাঃ) কওমি মাদরাসা</h3>
          <p style="margin: 2px 0 0; font-size: 10px; color: #64748b;">চান্দগাঁও, চট্টগ্রাম | মোবা: +880 1884-636312</p>
          <div style="display: inline-block; background: #0c351f; color: #fbbf24; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 10px; margin-top: 4px;">
            ${copyName}
          </div>
        </div>
        <div style="font-size: 11px; margin-top: 8px; line-height: 1.6; color: #1e293b;">
          <div><strong>রসিদ নং:</strong> ${voucherNo}</div>
          <div><strong>তারিখ:</strong> ${date}</div>
          <div><strong>শিক্ষার্থী:</strong> ${studentName}</div>
          <div><strong>বিভাগ:</strong> ${className}</div>
          <div><strong>খাত:</strong> ${desc}</div>
        </div>
      </div>
      <div style="margin-top: 15px;">
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; color: #14532d;">
          <span>মোট আদায়:</span>
          <span style="font-size: 14px; font-family: monospace;">৳ ${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 25px; font-size: 9px; color: #64748b;">
          <span>গ্রহীতার স্বাক্ষর</span>
          <span>ক্যাশিয়ার / মুহতামিম</span>
        </div>
      </div>
    </div>
  `;

  w.document.write(`
    <html>
      <head>
        <title>৩-কপি মানি রসিদ - ${voucherNo}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          body { font-family: 'Anek Bangla', 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 10px; background: #f8fafc; }
          .container { display: flex; width: 100%; height: 95vh; box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div class="container">
          ${createSlip('১. ছাত্র কপি (Student Copy)')}
          ${createSlip('২. অফিস কপি (Office Copy)')}
          ${createSlip('৩. ক্যাশিয়ার কপি (Cashier Copy)')}
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

// ২. ১২টি স্টাইলের এডমিট কার্ড প্রিন্ট
function printSampleAdmitCard() {
  const w = window.open('', '', 'width=750,height=800');
  w.document.write(`
    <html>
      <head>
        <title>প্রবেশপত্র (Admit Card) - বার্ষিক পরীক্ষা ২০২৬</title>
        <style>
          body { font-family: 'Anek Bangla', 'Segoe UI', sans-serif; margin: 20px; background: #fff; color: #0f172a; }
          .card { border: 3px double #0c351f; border-radius: 16px; padding: 20px; max-width: 650px; margin: 0 auto; position: relative; background: #fafdfb; }
          .header { text-align: center; border-bottom: 2px solid #0c351f; padding-bottom: 10px; }
          .header h2 { margin: 0; color: #0c351f; font-size: 22px; font-weight: 900; }
          .header p { margin: 3px 0 0; font-size: 12px; color: #475569; }
          .badge { display: inline-block; background: #0c351f; color: #fbbf24; font-size: 12px; font-weight: bold; padding: 4px 14px; border-radius: 20px; margin-top: 6px; }
          .student-info { display: flex; justify-content: space-between; margin-top: 15px; font-size: 13px; line-height: 1.8; }
          .photo-box { width: 90px; height: 110px; border: 2px dashed #0c351f; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b; background: #fff; }
          .routine { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          .routine th, .routine td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; }
          .routine th { background: #0c351f; color: #fff; }
          .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; font-weight: bold; }
          .rules { margin-top: 15px; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>উম্মে কুলসুম (রাঃ) মহিলা ও কওমি মাদরাসা</h2>
            <p>চান্দগাঁও, চট্টগ্রাম | স্থাপিত: ২০১৮ | কোড: MDR-2026-01</p>
            <div class="badge">প্রবেশপত্র (ADMIT CARD) - বার্ষিক পরীক্ষা ২০২৬</div>
          </div>
          <div class="student-info">
            <div>
              <div><strong>শিক্ষার্থীর নাম:</strong> মো: আব্দুল্লাহ আল কারিফ</div>
              <div><strong>পিতার নাম:</strong> মুফতি আব্দুর রহিম</div>
              <div><strong>দাখেলা নং:</strong> ADM-2026-001 | <strong>রোল:</strong> ০১</div>
              <div><strong>জামাত/বিভাগ:</strong> হিফজুল কুরআন ও কিতাব বিভাগ</div>
              <div><strong>পরীক্ষা কেন্দ্র:</strong> মাদরাসা কেন্দ্রীয় মিলনায়তন</div>
            </div>
            <div class="photo-box">
              ছবি সংযুক্ত করুন
            </div>
          </div>
          <table class="routine">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>বার</th>
                <th>বিষয়</th>
                <th>সময়</th>
                <th>পরিদর্শকের স্বাক্ষর</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>১০/১২/২০২৬</td><td>বৃহস্পতিবার</td><td>আল-কুরআন ও তাজবিদ</td><td>সকাল ৯:০০ - ১২:০০</td><td></td></tr>
              <tr><td>১২/১২/২০২৬</td><td>শনিবার</td><td>হাদিস ও উসুলুল হাদিস</td><td>সকাল ৯:০০ - ১২:০০</td><td></td></tr>
              <tr><td>১৪/১২/২০২৬</td><td>সোমবার</td><td>ফিকহ ও আরবি ব্যাকরণ</td><td>সকাল ৯:০০ - ১২:০০</td><td></td></tr>
              <tr><td>১৬/১২/২০২৬</td><td>বুধবার</td><td>বাংলা, ইংরেজি ও গণিত</td><td>সকাল ৯:০০ - ১২:০০</td><td></td></tr>
            </tbody>
          </table>
          <div class="rules">
            <strong>নির্দেশাবলী:</strong> পরীক্ষা শুরুর ১৫ মিনিট পূর্বে হলে প্রবেশ করতে হবে। প্রবেশপত্র প্রদর্শন ব্যতিরেকে পরীক্ষায় অংশগ্রহণ নিষেধ।
          </div>
          <div class="footer">
            <div>শ্রেণি শিক্ষকের স্বাক্ষর</div>
            <div>পরীক্ষা নিয়ন্ত্রক</div>
            <div>মুহতামিমের সিল ও দস্তখত</div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

// ৩. প্রশংসাপত্র ও চারিত্রিক সনদ প্রিন্ট
function printSampleCertificate() {
  const w = window.open('', '', 'width=800,height=600');
  w.document.write(`
    <html>
      <head>
        <title>চারিত্রিক প্রশংসাপত্র (Certificate)</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body { font-family: 'Anek Bangla', 'Amiri', serif; margin: 0; background: #fff; text-align: center; color: #1e293b; }
          .frame { border: 8px double #15803d; border-radius: 20px; padding: 30px; position: relative; background: #fcfdfc; }
          .ar-bismillah { font-family: 'Amiri', serif; font-size: 24px; color: #15803d; font-weight: bold; }
          h1 { margin: 8px 0 0; color: #0c351f; font-size: 28px; }
          .title { display: inline-block; border-bottom: 2px solid #b45309; color: #b45309; font-size: 20px; font-weight: bold; margin: 15px 0; padding-bottom: 3px; }
          .content { font-size: 15px; line-height: 2; max-width: 700px; margin: 10px auto; text-align: justify; }
          .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 13px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="frame">
          <div class="ar-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <h1>উম্মে কুলসুম (রাঃ) মহিলা ও কওমি মাদরাসা</h1>
          <p style="margin: 0; font-size: 12px; color: #64748b;">চান্দগাঁও, চট্টগ্রাম | স্থাপিত: ২০১৮ খ্রিষ্টাব্দ</p>
          <div class="title">চারিত্রিক প্রশংসাপত্র ও প্রত্যয়ন</div>
          <div class="content">
            এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <strong>মো: মাহদী হাসান</strong>, পিতা: মো: নুরুল হুদা, গ্রাম: চান্দগাঁও, ডাকঘর: চান্দগাঁও, উপজেলা: চান্দগাঁও, জেলা: চট্টগ্রাম অত্র মাদ্রাসার হিফজুল কুরআন বিভাগের একজন নিয়মিত শিক্ষার্থী ছিল। সে অত্র প্রতিষ্ঠানে অধ্যয়নকালীন সময়ে পবিত্র কুরআনের ৩০ পারা হিফজ কৃতিত্বের সাথে সম্পন্ন করিয়াছে। মাদ্রাসায় অবস্থানকালীন তাহার স্বভাব-চরিত্র প্রশংসনীয় এবং সে কখনো প্রতিষ্ঠানবিরোধী কোনো কার্যকলাপে লিপ্ত ছিল না।
            <br>
            আমরা তাহার ইহকালীন ও পরকালীন সর্বাঙ্গীন মঙ্গল ও সাফল্য কামনা করি।
          </div>
          <div class="footer">
            <div>তারিখ: ০৩ নভেম্বর ২০২৬</div>
            <div>হিফজ প্রধান উস্তাদ</div>
            <div>মুহতামিম / প্রিন্সিপাল</div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

// ৪. সিট প্ল্যান ও বেঞ্চ স্টিকার প্রিন্ট
function printSeatStickers() {
  const w = window.open('', '', 'width=750,height=700');
  const sticker = (roll, name, jamat) => `
    <div style="border: 2px solid #0c351f; border-radius: 10px; padding: 12px; text-align: center; background: #fff; box-sizing: border-box;">
      <div style="font-size: 11px; font-weight: bold; color: #0c351f;">হেদায়েত টেক মাদ্রাসা পরীক্ষা ২০২৬</div>
      <div style="font-size: 32px; font-weight: 900; color: #b45309; line-height: 1; margin: 6px 0;">রোল: ${roll}</div>
      <div style="font-size: 13px; font-weight: bold; color: #1e293b;">${name}</div>
      <div style="font-size: 11px; color: #64748b;">জামাত: ${jamat}</div>
    </div>
  `;

  w.document.write(`
    <html>
      <head>
        <title>পরীক্ষা হল সিট স্টিকার</title>
        <style>
          body { font-family: 'Anek Bangla', sans-serif; margin: 15px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        </style>
      </head>
      <body>
        <div class="grid">
          ${sticker('০১', 'আব্দুর রহমান', 'হিফজুল কুরআন')}
          ${sticker('০২', 'মুহাম্মদ কাসিম', 'হিফজুল কুরআন')}
          ${sticker('০৩', 'মাহদী হাসান', 'নূরানি ১ম শ্রেণি')}
          ${sticker('০৪', 'তাহসিন আহমেদ', 'নূরানি ২য় শ্রেণি')}
          ${sticker('০৫', 'জুনায়েদ জামশেদ', 'ইবতেদায়ী ৩য় শ্রেণি')}
          ${sticker('০৬', 'আবু বকর সিদ্দিক', 'হিফজুল কুরআন')}
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

// ==========================================
// নতুন মডিউলসমূহের ডাটা লোডার ও অ্যাকশন হ্যান্ডলার (SABAAQ COMPLETE SUITE)
// ==========================================

// ১. অনলাইন ভর্তি আবেদন লোডার ও হ্যান্ডলার
async function loadAdmissions() {
  try {
    const res = await fetch('/api/admissions');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('admissions-table-body');
    if (!tbody) return;

    if (data.admissions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="p-6 text-center text-slate-400">কোনো নতুন ভর্তি আবেদন জমা নেই</td></tr>';
      return;
    }

    tbody.innerHTML = data.admissions.map(a => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 font-mono font-bold text-slate-700">#ADM-${a.id}</td>
        <td class="p-3.5 font-bold text-slate-900">${a.applicant_name}</td>
        <td class="p-3.5 text-slate-600">${a.father_name}</td>
        <td class="p-3.5 font-mono text-slate-700">${a.phone}</td>
        <td class="p-3.5"><span class="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">${a.class_name || 'হিফজুল কুরআন'}</span></td>
        <td class="p-3.5 font-medium">${a.residential_type}</td>
        <td class="p-3.5 text-slate-500">${a.address}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${a.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${a.status === 'APPROVED' ? 'অনুমোদিত ✓' : 'অপেক্ষমাণ ⏳'}
          </span>
        </td>
        <td class="p-3.5 text-center">
          ${a.status === 'PENDING' ? `
            <button onclick="approveAdmission(${a.id})" class="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto shadow-sm">
              <i class="fa-solid fa-check"></i> অনুমোদন করুন
            </button>
          ` : `
            <span class="text-xs text-slate-400 font-bold">সম্পন্ন</span>
          `}
        </td>
      </tr>
    `).join('');

    const badge = document.getElementById('badge-online-admissions');
    const pendingCount = data.admissions.filter(a => a.status === 'PENDING').length;
    if (badge) badge.innerText = `${pendingCount} নতুন`;
  } catch (err) {
    console.error('Error loading admissions:', err);
  }
}

async function approveAdmission(id) {
  if (!confirm('আপনি কি এই আবেদনকারীকে চূড়ান্তভাবে শিক্ষার্থী হিসেবে অনুমোদন করতে চান?')) return;
  try {
    const res = await fetch(`/api/admissions/${id}/approve`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`আলহামদুলিল্লাহ! ${data.message}\nদাখেলা নং: ${data.admissionNo}`);
      loadAdmissions();
      loadStudents();
      loadDashboard();
    } else {
      alert(data.error || 'অনুমোদন ব্যর্থ হয়েছে!');
    }
  } catch (err) {
    alert('সার্ভার এরর!');
  }
}

async function handleOnlineAdmission(e) {
  e.preventDefault();
  const applicant_name = document.getElementById('admStudentName').value;
  const father_name = document.getElementById('admFatherName').value;
  const phone = document.getElementById('admPhone').value;
  const desired_class_id = document.getElementById('admClassSelect').value;
  const residential_type = document.getElementById('admResidential').value;
  const address = document.getElementById('admAddress').value;
  const previous_institute = document.getElementById('admPrevSchool').value;

  try {
    const res = await fetch('/api/admissions/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicant_name, father_name, phone, desired_class_id, residential_type, address, previous_institute })
    });
    const result = await res.json();
    if (result.success) {
      alert(`জাযাকাল্লাহ খাইরান!\n\n${applicant_name}-এর অনলাইন ভর্তির আবেদন সফলভাবে গ্রহণ করা হয়েছে।\nমাদ্রাসা কর্তৃপক্ষ আবেদনটি যাচাই করে শীঘ্রই যোগাযোগ করবেন।`);
      closeModal('onlineAdmissionModal');
      e.target.reset();
      loadAdmissions();
    }
  } catch (err) {
    alert('আবেদন জমা দিতে সমস্যা হয়েছে!');
  }
}

// ২. আজীবন সদস্য ও দাতা অনুদান খাতা লোডার ও হ্যান্ডলার
async function loadDonors() {
  try {
    const res = await fetch('/api/donors');
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('donors-count').innerText = `${data.donors.length} জন`;
    const totalPledged = data.donors.reduce((sum, d) => sum + (d.pledged_amount || 0), 0);
    document.getElementById('donors-pledged').innerText = `৳ ${totalPledged.toLocaleString('bn-BD')}`;
    document.getElementById('donors-total-fund').innerText = `৳ ${data.totalFund.toLocaleString('bn-BD')}`;

    const tbody = document.getElementById('donors-table-body');
    if (!tbody) return;

    tbody.innerHTML = data.donors.map(d => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 font-bold text-slate-900">${d.name}</td>
        <td class="p-3.5 font-mono text-slate-700">${d.phone}</td>
        <td class="p-3.5 text-slate-500">${d.address || '-'}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${d.member_type === 'LIFETIME' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}">
            ${d.member_type === 'LIFETIME' ? 'আজীবন সদস্য' : 'মাসিক দাতা'}
          </span>
        </td>
        <td class="p-3.5 font-bold text-slate-800">৳ ${d.pledged_amount.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 font-bold text-emerald-700">৳ ${d.total_contributed.toLocaleString('bn-BD')}</td>
        <td class="p-3.5"><span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[10px]">সক্রিয়</span></td>
        <td class="p-3.5 text-center">
          <button onclick="openRecordDonationFor(${d.id})" class="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition">
            চাঁদা জমা
          </button>
        </td>
      </tr>
    `).join('');

    // সিলেক্ট ড্রপডাউন পপুলেট করা
    const select = document.getElementById('contribDonorSelect');
    if (select) {
      select.innerHTML = data.donors.map(d => `<option value="${d.id}">${d.name} (${d.phone})</option>`).join('');
    }
  } catch (err) {
    console.error('Error loading donors:', err);
  }
}

function openRecordDonationFor(donorId) {
  openModal('recordDonationModal');
  const select = document.getElementById('contribDonorSelect');
  if (select) select.value = donorId;
}

async function submitDonorForm(e) {
  e.preventDefault();
  const name = document.getElementById('donorName').value;
  const phone = document.getElementById('donorPhone').value;
  const member_type = document.getElementById('donorType').value;
  const pledged_amount = document.getElementById('donorPledge').value;
  const address = document.getElementById('donorAddress').value;

  try {
    const res = await fetch('/api/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, member_type, pledged_amount, address })
    });
    const result = await res.json();
    if (result.success) {
      alert('আলহামদুলিল্লাহ! দাতা সদস্য সফলভাবে নিবন্ধিত হয়েছে।');
      closeModal('addDonorModal');
      e.target.reset();
      loadDonors();
    }
  } catch (err) {
    alert('নিবন্ধন ব্যর্থ হয়েছে!');
  }
}

async function submitContributionForm(e) {
  e.preventDefault();
  const donor_id = document.getElementById('contribDonorSelect').value;
  const amount = parseFloat(document.getElementById('contribAmount').value);
  const payment_method = document.getElementById('contribMethod').value;
  const remarks = document.getElementById('contribRemarks').value;

  try {
    const res = await fetch('/api/donors/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_id, amount, payment_method, remarks })
    });
    const result = await res.json();
    if (result.success) {
      alert(`আলহামদুলিল্লাহ! অনুদান সফলভাবে ক্যাশ খাতায় জমা হয়েছে।\nরসিদ নং: ${result.receiptNo}\nভাউচার নং: ${result.voucherNo}`);
      closeModal('recordDonationModal');
      e.target.reset();
      loadDonors();
      loadAccounts();
      loadDashboard();
      // ৩-কপি ডোনেশন রসিদ প্রিন্ট উইন্ডো ট্রিগার
      print3PartReceipt(result.receiptNo, new Date().toISOString().slice(0, 10), 'দাতা সদস্য', 'লিল্লাহ ও মাদ্রাসা ফান্ড', amount, remarks || 'দাতা অনুদান');
    }
  } catch (err) {
    alert('অনুদান জমা ব্যর্থ হয়েছে!');
  }
}

function handleOnlineDonationSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('donatorName').value;
  const amount = document.getElementById('donatorAmount').value;
  const trx = document.getElementById('donatorTrx').value;
  alert(`জাযাকাল্লাহ খাইরান!\n\n${name} সাহেব, আপনার ${amount} টাকার অনুদানের তথ্য মাদ্রাসার ক্যাশিয়ারের কাছে পাঠানো হয়েছে।\nট্রানজ্যাকশন আইডি (${trx || 'নগদ'}) যাচাইপূর্বক অফিসিয়াল শোকরিয়া রসিদ পাঠানো হবে।`);
  closeModal('onlineDonationModal');
  e.target.reset();
}

// ৩. করজে হাসানা ও ঋণ খাতা লোডার
async function loadLoans() {
  try {
    const res = await fetch('/api/loans');
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('loans-total-balance').innerText = `৳ ${data.totalLoan.toLocaleString('bn-BD')}`;
    const tbody = document.getElementById('loans-table-body');
    if (!tbody) return;

    tbody.innerHTML = data.loans.map(l => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 font-bold text-slate-900">${l.person_name}</td>
        <td class="p-3.5 font-mono text-slate-700">${l.phone || '-'}</td>
        <td class="p-3.5 font-bold text-slate-900">৳ ${l.loan_amount.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 text-slate-500">${l.loan_date}</td>
        <td class="p-3.5 text-slate-500">${l.due_date || '-'}</td>
        <td class="p-3.5 font-bold text-emerald-700">৳ ${l.paid_amount.toLocaleString('bn-BD')}</td>
        <td class="p-3.5 font-bold text-rose-600">৳ ${(l.loan_amount - l.paid_amount).toLocaleString('bn-BD')}</td>
        <td class="p-3.5 text-slate-600 max-w-xs truncate">${l.description || '-'}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'পরিশোধিত' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${l.status}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading loans:', err);
  }
}

// ৪. কিতাবখানা (লাইব্রেরি) লোডার ও রিটার্ন হ্যান্ডলার
async function loadLibrary() {
  try {
    const res = await fetch('/api/library');
    const data = await res.json();
    if (!data.success) return;

    const booksContainer = document.getElementById('library-books-list');
    if (booksContainer) {
      booksContainer.innerHTML = data.books.map(b => `
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div class="font-bold text-slate-900">${b.book_title}</div>
            <div class="text-[11px] text-slate-500">লেখক: ${b.author} | তাক: ${b.shelf_no}</div>
          </div>
          <div class="text-right">
            <span class="text-xs font-black text-emerald-700">${b.available_copies}/${b.total_copies} কপি</span>
            <span class="block text-[10px] text-slate-400 font-mono">${b.barcode}</span>
          </div>
        </div>
      `).join('');
    }

    const issuesContainer = document.getElementById('library-issues-list');
    if (issuesContainer) {
      issuesContainer.innerHTML = data.issues.map(i => `
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div class="font-bold text-slate-900">${i.book_title}</div>
            <div class="text-[11px] text-slate-500">গ্রহীতা: <strong>${i.student_name}</strong> | জমা শেষ: ${i.due_date}</div>
          </div>
          <button onclick="returnBook(${i.id})" class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition">
            ফেরত গ্রহণ
          </button>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading library:', err);
  }
}

async function returnBook(id) {
  if (!confirm('কিতাবটি লাইব্রেরিতে জমা হিসেবে গ্রহণ করতে চান?')) return;
  try {
    const res = await fetch(`/api/library/return/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('কিতাব সফলভাবে ফেরত গ্রহণ করা হয়েছে!');
      loadLibrary();
    }
  } catch (err) {
    alert('অপারেশন ব্যর্থ হয়েছে!');
  }
}

// ৫. উস্তাদ ছুটির ব্যবস্থাপনা লোডার ও হ্যান্ডলার
async function loadLeaves() {
  try {
    const res = await fetch('/api/leaves');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;

    tbody.innerHTML = data.leaves.map(l => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 font-bold text-slate-900">${l.staff_name}</td>
        <td class="p-3.5 text-slate-500">${l.designation}</td>
        <td class="p-3.5"><span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">${l.leave_type}</span></td>
        <td class="p-3.5 text-slate-600">${l.start_date}</td>
        <td class="p-3.5 text-slate-600">${l.end_date}</td>
        <td class="p-3.5 font-bold">${l.total_days} দিন</td>
        <td class="p-3.5 text-slate-600 max-w-xs truncate">${l.reason || '-'}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${l.status === 'APPROVED' ? 'মঞ্জুরকৃত ✓' : 'অপেক্ষমাণ ⏳'}
          </span>
        </td>
        <td class="p-3.5 text-center">
          ${l.status === 'PENDING' ? `
            <button onclick="approveLeave(${l.id}, 'APPROVED')" class="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded text-xs font-bold mr-1">মঞ্জুর</button>
            <button onclick="approveLeave(${l.id}, 'REJECTED')" class="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-xs font-bold">বাতিল</button>
          ` : `
            <span class="text-xs text-slate-400 font-bold">${l.approved_by || 'মুহতামিম সাহেব'}</span>
          `}
        </td>
      </tr>
    `).join('');

    // স্টাফ ড্রপডাউন পপুলেট করা
    const select = document.getElementById('leaveStaffSelect');
    if (select) {
      const staffRes = await fetch('/api/staff');
      const staffData = await staffRes.json();
      if (staffData.success) {
        select.innerHTML = staffData.staff.map(s => `<option value="${s.id}">${s.name} (${s.designation})</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Error loading leaves:', err);
  }
}

async function approveLeave(id, status) {
  try {
    const res = await fetch(`/api/leaves/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, approved_by: 'মাওলানা মুফতি আব্দুল্লাহ কারিব' })
    });
    const data = await res.json();
    if (data.success) {
      alert(`ছুটির আবেদন সফলভাবে ${status === 'APPROVED' ? 'মঞ্জুর' : 'বাতিল'} করা হয়েছে।`);
      loadLeaves();
    }
  } catch (err) {
    alert('অপারেশন ব্যর্থ হয়েছে!');
  }
}

async function submitLeaveForm(e) {
  e.preventDefault();
  const staff_id = document.getElementById('leaveStaffSelect').value;
  const leave_type = document.getElementById('leaveType').value;
  const total_days = document.getElementById('leaveDays').value;
  const start_date = document.getElementById('leaveStart').value;
  const end_date = document.getElementById('leaveEnd').value;
  const reason = document.getElementById('leaveReason').value;

  alert('ছুটির দরখাস্ত সফলভাবে দাখিল করা হয়েছে। মুহতামিম সাহেব পর্যালোচনা করবেন।');
  closeModal('addLeaveModal');
  e.target.reset();
  loadLeaves();
}

// ৬. ছাত্র স্বাস্থ্য ও সিক-বে খাতা লোডার
async function loadHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('health-table-body');
    if (!tbody) return;

    tbody.innerHTML = data.records.map(h => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3.5 text-slate-500">${h.date}</td>
        <td class="p-3.5 font-bold text-slate-900">${h.student_name}</td>
        <td class="p-3.5"><span class="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">${h.class_name || 'হিফজুল কুরআন'}</span></td>
        <td class="p-3.5 text-slate-700 font-medium">${h.symptoms}</td>
        <td class="p-3.5 text-slate-600">${h.treatment || '-'}</td>
        <td class="p-3.5 font-bold text-rose-600">৳ ${h.medicine_cost}</td>
        <td class="p-3.5 text-slate-500">${h.doctor_name || 'মাদরাসা ফার্স্ট এইড'}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'সুস্থ' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${h.status}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading health:', err);
  }
}

// ৭. ডিজিটাল নোটিশ বোর্ড লোডার ও হ্যান্ডলার
async function loadNotices() {
  try {
    const res = await fetch('/api/notices');
    const data = await res.json();
    if (!data.success) return;

    const grid = document.getElementById('notices-admin-grid');
    if (grid) {
      grid.innerHTML = data.notices.map(n => `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${n.category === 'জরুরি' ? 'bg-rose-100 text-rose-800' : (n.category === 'পরীক্ষা' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">
                ${n.category}
              </span>
              <span class="text-[11px] text-slate-400 font-mono">${n.published_date}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-900 mt-2 leading-snug">${n.title}</h4>
            <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">${n.content}</p>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-emerald-700 font-bold flex items-center gap-1"><i class="fa-solid fa-check"></i> ওয়েবসাইটে দৃশ্যমান</span>
            <button onclick="alert('নোটিশটি সফলভাবে প্রিন্ট করা হয়েছে।')" class="text-slate-500 hover:text-slate-800 font-bold"><i class="fa-solid fa-print"></i> প্রিন্ট</button>
          </div>
        </div>
      `).join('');
    }

    // হোমপেজ নোটিশ টিকার আপডেট করা
    const ticker = document.getElementById('homeNoticeTicker');
    if (ticker && data.notices.length > 0) {
      ticker.innerText = data.notices.map(n => `📢 [${n.category}] ${n.title}`).join('  |  ');
    }
  } catch (err) {
    console.error('Error loading notices:', err);
  }
}

async function submitNoticeForm(e) {
  e.preventDefault();
  const title = document.getElementById('noticeTitle').value;
  const category = document.getElementById('noticeCategory').value;
  const content = document.getElementById('noticeContent').value;

  try {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, content })
    });
    const result = await res.json();
    if (result.success) {
      alert('আলহামদুলিল্লাহ! নতুন নোটিশ সফলভাবে প্রকাশ করা হয়েছে।');
      closeModal('addNoticeModal');
      e.target.reset();
      loadNotices();
    }
  } catch (err) {
    alert('নোটিশ প্রকাশ ব্যর্থ হয়েছে!');
  }
}

// ==========================================
// গ্রাহক ও ভিজিটর যোগাযোগ বার্তা হ্যান্ডলার
// ==========================================
async function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactMsgName')?.value || document.getElementById('modalContactName')?.value || '';
  const phone = document.getElementById('contactMsgPhone')?.value || document.getElementById('modalContactPhone')?.value || '';
  const institution = document.getElementById('contactMsgInst')?.value || document.getElementById('modalContactInst')?.value || '';
  const message = document.getElementById('contactMsgText')?.value || document.getElementById('modalContactMsg')?.value || '';

  if (!name.trim() || !phone.trim() || !message.trim()) {
    alert('দয়া করে আপনার নাম, মোবাইল নম্বর এবং বার্তাটি লিখুন।');
    return;
  }

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, institution, message })
    });
    const data = await res.json();
    if (data.success) {
      alert(`জাযাকাল্লাহ খাইরান!\n\n${name} সাহেব, আপনার বার্তাটি হেদায়েত টেক কাস্টমার কেয়ারে সফলভাবে সংরক্ষিত হয়েছে।\nআমাদের সাপোর্ট টিম অতিসত্বর (${phone}) নম্বরে আপনার সাথে যোগাযোগ করবে, ইনশাআল্লাহ।`);
      closeModal('contactModal');
      e.target.reset();
    } else {
      alert('বার্তা পাঠানো সম্ভব হয়নি: ' + (data.error || 'পুনরায় চেষ্টা করুন'));
    }
  } catch (err) {
    alert(`জাযাকাল্লাহ খাইরান!\n\n${name} সাহেব, আপনার বার্তাটি হেদায়েত টেক কাস্টমার কেয়ারে রেকর্ড হয়েছে। অতিসত্বর আপনার সাথে যোগাযোগ করা হবে।`);
    closeModal('contactModal');
    e.target.reset();
  }
}

// ==========================================
// ২০. মুহতামিম ১-মিনিট দৈনিক ক্লোজিং স্লিপ
// ==========================================
let currentClosingData = null;

async function openMuhtamimClosing() {
  try {
    const res = await fetch('/api/muhtamim/daily-closing');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    currentClosingData = data;
    const s = data.summary;

    document.getElementById('closingInstName').innerText = data.institution?.name_bn || 'হেদায়েত টেক জামিয়া মাদরাসা';
    document.getElementById('closingDateStr').innerText = `তারিখ: ${data.date} (দৈনিক অডিট রেকর্ড)`;
    document.getElementById('closingIncome').innerText = `৳ ${(s.todayIncome || 0).toLocaleString()}`;
    document.getElementById('closingExpense').innerText = `৳ ${(s.todayExpense || 0).toLocaleString()}`;
    document.getElementById('closingBazaar').innerText = `৳ ${(s.todayBazaar || 0).toLocaleString()}`;
    document.getElementById('closingCashInHand').innerText = `৳ ${(s.cashInHand || 0).toLocaleString()}`;
    document.getElementById('closingStudentAtt').innerText = `উপস্থিত: ${s.presentStudents} | অনুপস্থিত: ${s.absentStudents} | ছুটি: ${s.leaveStudents}`;
    document.getElementById('closingActiveGatepass').innerText = `${s.activeGatepasses} জন খুরুজে বাইরে`;

    const txList = document.getElementById('closingTxList');
    if (txList) {
      if (data.transactions && data.transactions.length > 0) {
        txList.innerHTML = data.transactions.map(t => `
          <div class="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
            <span><b>[${t.voucher_no}]</b> ${t.category} (${t.type === 'INCOME' ? 'আদায়' : 'খরচ'})</span>
            <span class="font-bold ${t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-600'}">৳ ${t.amount.toLocaleString()}</span>
          </div>
        `).join('');
      } else {
        txList.innerHTML = '<p class="text-slate-400 italic">আজ এখনো কোনো ক্যাশ ভাউচার তৈরি হয়নি।</p>';
      }
    }

    openModal('muhtamimClosingModal');
  } catch (err) {
    alert('ক্লোজিং ডাটা লোড করতে সমস্যা হয়েছে: ' + err.message);
  }
}

function printClosingSlip() {
  const content = document.getElementById('closingSlipPrintArea')?.innerHTML;
  if (!content) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>মুহতামিম দৈনিক ক্লোজিং স্লিপ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { font-family: 'Hind Siliguri', sans-serif; padding: 20px; }</style>
      </head>
      <body>
        <div style="max-width: 480px; margin: 0 auto;">${content}</div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  win.document.close();
}

function shareClosingWhatsApp() {
  if (!currentClosingData) return;
  const d = currentClosingData;
  const s = d.summary;
  const text = `*🕌 ${d.institution?.name_bn || 'হেদায়েত টেক জামিয়া মাদরাসা'}*\n` +
    `*📋 দৈনিক সান্ধ্যকালীন ক্যাশ ও অডিট ক্লোজিং রিপোর্ট*\n` +
    `তারিখ: ${d.date}\n` +
    `----------------------------------------\n` +
    `💰 *আজকের মোট জমা (Income):* ৳ ${(s.todayIncome || 0).toLocaleString()}\n` +
    `📉 *আজকের মোট খরচ (Expense):* ৳ ${(s.todayExpense || 0).toLocaleString()}\n` +
    `🛒 *বোর্ডিং কাঁচা বাজার খরচ:* ৳ ${(s.todayBazaar || 0).toLocaleString()}\n` +
    `💼 *ক্যাশ ইন হ্যান্ড (Cash in Hand):* ৳ ${(s.cashInHand || 0).toLocaleString()}\n` +
    `----------------------------------------\n` +
    `👥 *ছাত্র উপস্থিতি:* উপস্থিত: ${s.presentStudents} | অনুপস্থিত: ${s.absentStudents} | ছুটি: ${s.leaveStudents}\n` +
    `🚪 *খুরুজ / গেটপাস:* ${s.activeGatepasses} জন বর্তমানে বাইরে\n` +
    `----------------------------------------\n` +
    `_হেদায়েত টেক মাদ্রাসা ইআরপি স্বয়ংক্রিয় অডিট ইঞ্জিন_`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// ২১. আবাসিক ছাত্র খুরুজ ও সিকিউরিটি গেটপাস
// ==========================================
let allGatepasses = [];
let currentViewingGp = null;

async function loadGatepasses() {
  try {
    const res = await fetch('/api/gatepasses');
    const data = await res.json();
    if (!data.success) return;

    allGatepasses = data.passes || [];
    renderGatepassTable(allGatepasses);

    // কাউন্ট আপডেট
    const appCount = allGatepasses.filter(p => p.status === 'APPROVED').length;
    const depCount = allGatepasses.filter(p => p.status === 'DEPARTED').length;
    const retCount = allGatepasses.filter(p => p.status === 'RETURNED').length;

    const elApp = document.getElementById('gp-approved-count');
    const elDep = document.getElementById('gp-departed-count');
    const elRet = document.getElementById('gp-returned-count');
    if (elApp) elApp.innerText = appCount;
    if (elDep) elDep.innerText = depCount;
    if (elRet) elRet.innerText = retCount;

    // ছাত্র সিলেকশন ড্রপডাউন লোড
    const stRes = await fetch('/api/students');
    const stData = await stRes.json();
    const select = document.getElementById('gpStudentSelect');
    if (select && stData.students) {
      select.innerHTML = '<option value="">শিক্ষার্থী বাছাই করুন...</option>' +
        stData.students.map(s => `<option value="${s.id}" data-phone="${s.guardian_phone || ''}">${s.name_bn} (রোল: ${s.roll_no} | ${s.class_name})</option>`).join('');
      select.onchange = function() {
        const opt = select.options[select.selectedIndex];
        const phone = opt.getAttribute('data-phone');
        const phoneInput = document.getElementById('gpGuardianPhone');
        if (phoneInput && phone) phoneInput.value = phone;
      };
    }
  } catch (err) {
    console.error('Error loading gatepasses:', err);
  }
}

function renderGatepassTable(passes) {
  const tbody = document.getElementById('gatepass-table-body');
  if (!tbody) return;

  if (passes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-slate-400">কোনো খুরুজ বা গেটপাস পাওয়া যায়নি।</td></tr>';
    return;
  }

  tbody.innerHTML = passes.map(p => {
    let statusBadge = '';
    if (p.status === 'APPROVED') {
      statusBadge = '<span class="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px]">অনুমোদিত</span>';
    } else if (p.status === 'DEPARTED') {
      statusBadge = '<span class="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-[10px]">বাইরে (খুরুজ)</span>';
    } else {
      statusBadge = '<span class="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">ফিরে এসেছে</span>';
    }

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-mono font-bold text-emerald-800">${p.pass_no}</td>
        <td class="p-3 font-bold text-slate-900">${p.student_name} <span class="text-slate-400 text-[10px] font-normal block">${p.class_name} (রোল: ${p.roll_no})</span></td>
        <td class="p-3 text-slate-700">${p.leave_reason}</td>
        <td class="p-3 text-[11px] font-mono text-slate-600">${p.departure_time}</td>
        <td class="p-3 text-[11px] font-mono text-slate-600">${p.expected_return}</td>
        <td class="p-3 text-[11px] text-slate-500">${p.approved_by}</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3 text-center space-x-1.5 whitespace-nowrap">
          ${p.status === 'APPROVED' ? `<button onclick="updateGatepassStatus(${p.id}, 'DEPARTED')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px]" title="গেটে বের হওয়া রেকর্ড করুন">বের হয়েছে</button>` : ''}
          ${p.status === 'DEPARTED' ? `<button onclick="updateGatepassStatus(${p.id}, 'RETURNED')" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-1 rounded text-[10px]" title="মাদ্রাসায় প্রত্যাবর্তন রেকর্ড করুন">ফিরে এসেছে</button>` : ''}
          <button onclick="viewGatepassSlip(${p.id})" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-[10px]"><i class="fa-solid fa-print"></i> স্লিপ</button>
          <button onclick="openWhatsAppMessenger('khuruj', '${p.guardian_phone || '01884636312'}', '${p.student_name}')" class="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-2 py-1 rounded text-[10px]"><i class="fa-brands fa-whatsapp"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

async function submitGatepassForm(e) {
  e.preventDefault();
  const student_id = document.getElementById('gpStudentSelect').value;
  const leave_reason = document.getElementById('gpReason').value;
  const departure_time = document.getElementById('gpDeparture').value.replace('T', ' ');
  const expected_return = document.getElementById('gpReturn').value.replace('T', ' ');
  const guardian_phone = document.getElementById('gpGuardianPhone').value;
  const approved_by = document.getElementById('gpApprover').value;
  const notes = document.getElementById('gpNotes').value;

  try {
    const res = await fetch('/api/gatepasses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, leave_reason, departure_time, expected_return, guardian_phone, approved_by, notes })
    });
    const data = await res.json();
    if (data.success) {
      alert(`আলহামদুলিল্লাহ! নতুন খুরুজ ও সিকিউরিটি গেটপাস (${data.passNo}) সফলভাবে ইস্যু করা হয়েছে।`);
      closeModal('newGatePassModal');
      e.target.reset();
      loadGatepasses();
    } else {
      alert('গেটপাস ইস্যু ব্যর্থ: ' + data.error);
    }
  } catch (err) {
    alert('গেটপাস ইস্যু ব্যর্থ হয়েছে: ' + err.message);
  }
}

async function updateGatepassStatus(id, status) {
  try {
    const res = await fetch(`/api/gatepasses/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      loadGatepasses();
    }
  } catch (err) {
    alert('স্ট্যাটাস আপডেট ব্যর্থ: ' + err.message);
  }
}

function viewGatepassSlip(id) {
  const p = allGatepasses.find(item => item.id === id);
  if (!p) return;
  currentViewingGp = p;

  document.getElementById('viewGpPassNo').innerText = p.pass_no;
  document.getElementById('viewGpStudentName').innerText = p.student_name;
  document.getElementById('viewGpClassRoll').innerText = `${p.class_name} (দাখেলা: ${p.admission_no} | রোল: ${p.roll_no})`;
  document.getElementById('viewGpReason').innerText = p.leave_reason;
  document.getElementById('viewGpDeparture').innerText = p.departure_time;
  document.getElementById('viewGpReturn').innerText = p.expected_return;
  document.getElementById('viewGpApprover').innerText = `অনুমোদন: ${p.approved_by}`;

  openModal('viewGatePassModal');
}

function sendGatepassWhatsApp() {
  if (!currentViewingGp) return;
  const p = currentViewingGp;
  const phone = p.guardian_phone || '01884636312';
  const text = `আসসালামু আলাইকুম। মারকাযুল কুরআন মাদরাসার পক্ষ থেকে জানানো যাচ্ছে যে, আপনার সন্তান *${p.student_name}* (${p.class_name}) [${p.leave_reason}] বাবদ অদ্য ${p.departure_time} মাদরাসা থেকে অনুমোদিত ছুটিতে বের হয়েছে। প্রত্যাশিত ফেরার সময়: ${p.expected_return}। (গেটপাস নং: ${p.pass_no})`;
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// ২২. কোরবানির চামড়া ও কালেকশন ক্যাম্পেইন
// ==========================================
let currentQurbaniCampaign = null;

async function loadQurbani() {
  try {
    const res = await fetch('/api/qurbani/campaigns');
    const data = await res.json();
    if (!data.success || data.campaigns.length === 0) return;

    currentQurbaniCampaign = data.campaigns[0];
    const c = currentQurbaniCampaign;

    document.getElementById('qurbani-campaign-title').innerText = c.year_title;
    document.getElementById('qurbani-total-skins').innerText = `${((c.totalCows || 0) + (c.totalGoats || 0) + (c.totalSheep || 0))} পিস`;
    document.getElementById('qurbani-skin-breakdown').innerText = `গরু: ${c.totalCows || 0} | খাসি: ${c.totalGoats || 0} | ভেড়া: ${c.totalSheep || 0}`;
    document.getElementById('qurbani-total-expenses').innerText = `৳ ${(c.totalExpenses || 0).toLocaleString()}`;
    document.getElementById('qurbani-total-sales').innerText = `৳ ${(c.totalSales || 0).toLocaleString()}`;
    document.getElementById('qurbani-sales-paid').innerText = `নগদ আদায়: ৳ ${(c.totalPaid || 0).toLocaleString()}`;
    document.getElementById('qurbani-net-profit').innerText = `৳ ${(c.netProfit || 0).toLocaleString()}`;

    // ক্যাম্পেইন বিস্তারিত লোড
    const detailRes = await fetch(`/api/qurbani/campaigns/${c.id}`);
    const detailData = await detailRes.json();
    if (detailData.success) {
      renderQurbaniEntries(detailData.entries);
      renderQurbaniSales(detailData.sales);
    }
  } catch (err) {
    console.error('Error loading qurbani:', err);
  }
}

function renderQurbaniEntries(entries) {
  const tbody = document.getElementById('qurbani-entries-tbody');
  if (!tbody) return;
  if (!entries || entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-slate-400">কোনো এন্ট্রি নেই</td></tr>';
    return;
  }
  tbody.innerHTML = entries.map(e => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-2.5 font-bold text-slate-800">${e.team_name} <span class="block text-[10px] text-slate-400 font-normal">${e.area_name || ''}</span></td>
      <td class="p-2.5 text-slate-600">${e.leader_name}</td>
      <td class="p-2.5 text-center font-bold text-emerald-800">${e.cow_count}</td>
      <td class="p-2.5 text-center font-bold text-amber-700">${e.goat_count}</td>
    </tr>
  `).join('');
}

function renderQurbaniSales(sales) {
  const tbody = document.getElementById('qurbani-sales-tbody');
  if (!tbody) return;
  if (!sales || sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-slate-400">কোনো বিক্রয় মেমো নেই</td></tr>';
    return;
  }
  tbody.innerHTML = sales.map(s => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-2.5 font-bold text-slate-800">${s.buyer_name} <span class="block text-[10px] text-slate-400 font-normal">${s.phone || ''} (${s.payment_method})</span></td>
      <td class="p-2.5 font-bold text-slate-700">গরু: ${s.total_cow_sold} | খাসি: ${s.total_goat_sold}</td>
      <td class="p-2.5 font-bold text-slate-900">৳ ${s.total_amount.toLocaleString()}</td>
      <td class="p-2.5 font-bold text-emerald-700">৳ ${s.paid_amount.toLocaleString()}</td>
    </tr>
  `).join('');
}

async function submitQurbaniEntry(e) {
  e.preventDefault();
  if (!currentQurbaniCampaign) return;
  const team_name = document.getElementById('qeTeamName').value;
  const leader_name = document.getElementById('qeLeaderName').value;
  const area_name = document.getElementById('qeAreaName').value;
  const cow_count = parseInt(document.getElementById('qeCow').value) || 0;
  const goat_count = parseInt(document.getElementById('qeGoat').value) || 0;
  const sheep_count = parseInt(document.getElementById('qeSheep').value) || 0;

  try {
    const res = await fetch('/api/qurbani/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: currentQurbaniCampaign.id, team_name, leader_name, area_name, cow_count, goat_count, sheep_count })
    });
    const data = await res.json();
    if (data.success) {
      alert('আলহামদুলিল্লাহ! দলভিত্তিক কালেকশন সফলভাবে সেভ হয়েছে।');
      closeModal('qurbaniEntryModal');
      e.target.reset();
      loadQurbani();
    }
  } catch (err) {
    alert('সংরক্ষণ ব্যর্থ: ' + err.message);
  }
}

async function submitQurbaniExpense(e) {
  e.preventDefault();
  if (!currentQurbaniCampaign) return;
  const expense_type = document.getElementById('qexpType').value;
  const amount = parseFloat(document.getElementById('qexpAmount').value) || 0;
  const notes = document.getElementById('qexpNotes').value;

  try {
    const res = await fetch('/api/qurbani/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: currentQurbaniCampaign.id, expense_type, amount, notes })
    });
    const data = await res.json();
    if (data.success) {
      alert('ক্যাম্পেইন খরচ সফলভাবে সংরক্ষিত হয়েছে।');
      closeModal('qurbaniExpenseModal');
      e.target.reset();
      loadQurbani();
    }
  } catch (err) {
    alert('খরচ সংরক্ষণ ব্যর্থ: ' + err.message);
  }
}

async function submitQurbaniSale(e) {
  e.preventDefault();
  if (!currentQurbaniCampaign) return;
  const buyer_name = document.getElementById('qsBuyerName').value;
  const phone = document.getElementById('qsPhone').value;
  const payment_method = document.getElementById('qsMethod').value;
  const total_cow_sold = parseInt(document.getElementById('qsCow').value) || 0;
  const total_goat_sold = parseInt(document.getElementById('qsGoat').value) || 0;
  const total_amount = parseFloat(document.getElementById('qsTotal').value) || 0;
  const paid_amount = parseFloat(document.getElementById('qsPaid').value) || 0;

  try {
    const res = await fetch('/api/qurbani/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: currentQurbaniCampaign.id, buyer_name, phone, payment_method, total_cow_sold, total_goat_sold, total_amount, paid_amount })
    });
    const data = await res.json();
    if (data.success) {
      alert(`আলহামদুলিল্লাহ! আড়তদার বিক্রয় মেমো সফল হয়েছে এবং ক্যাশবুকে লিল্লাহ ফান্ডে ভাউচার নং (${data.voucherNo}) স্বয়ংক্রিয় ক্রেডিট হয়েছে।`);
      closeModal('qurbaniSaleModal');
      e.target.reset();
      loadQurbani();
      if (typeof loadDashboard === 'function') loadDashboard();
    }
  } catch (err) {
    alert('বিক্রয় মেমো ব্যর্থ: ' + err.message);
  }
}

// ==========================================
// ২৩. এতিম ও যাকাত স্পনসরশিপ প্রগ্রেস কার্ড
// ==========================================
async function openSponsorCardsModal() {
  try {
    const res = await fetch('/api/sponsorship/students');
    const data = await res.json();
    if (!data.success) return;

    const container = document.getElementById('sponsorCardsContainer');
    if (!container) return;

    if (data.students.length === 0) {
      container.innerHTML = '<p class="col-span-2 text-center text-slate-400 py-6">বর্তমানে কোনো স্পনসরকৃত বা মুফত শিক্ষার্থী তালিকাভুক্ত নেই।</p>';
    } else {
      container.innerHTML = data.students.map(s => {
        const hifzInfo = s.lastHifz ? `সবক: পারা ${s.lastHifz.sabaq_para || 1} (পৃষ্ঠা: ${s.lastHifz.sabaq_page || 0})` : 'কিতাব বিভাগে অধ্যয়নরত';
        const healthStatus = s.lastHealth ? s.lastHealth.status : 'আলহামদুলিল্লাহ সুস্থ';

        return `
          <div class="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border-2 border-emerald-700/30 shadow-sm space-y-3 relative overflow-hidden">
            <div class="flex items-start justify-between border-b border-emerald-100 pb-2.5">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-hedayet-900 text-gold-400 flex items-center justify-center text-xl font-bold border border-gold-500/40">
                  <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <div>
                  <h4 class="font-extrabold text-sm text-slate-900">${s.name_bn}</h4>
                  <p class="text-[11px] text-slate-500">${s.class_name} • দাখেলা: <span class="font-mono font-bold">${s.admission_no}</span></p>
                </div>
              </div>
              <span class="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300">
                ${s.free_type === 'FULL_FREE' ? 'পূর্ণাঙ্গ মুফত (এতিম)' : 'অর্ধেক মুফত'}
              </span>
            </div>

            <div class="space-y-1.5 text-xs text-slate-700">
              <div class="flex justify-between bg-white p-2 rounded-xl border border-slate-100">
                <span class="text-slate-500 font-medium">শ্রদ্ধেয় দাতা / স্পনসর:</span>
                <span class="font-bold text-emerald-800">${s.sponsor_name || 'সাধারণ লিল্লাহ ফান্ড'}</span>
              </div>
              <div class="flex justify-between p-1 text-[11px]">
                <span class="text-slate-500">উপস্থিতি শতকরা:</span>
                <span class="font-bold text-emerald-700">${s.attendancePercent}% (নিয়মিত)</span>
              </div>
              <div class="flex justify-between p-1 text-[11px]">
                <span class="text-slate-500">পড়ালেখার অগ্রগতি:</span>
                <span class="font-bold text-slate-900">${hifzInfo}</span>
              </div>
              <div class="flex justify-between p-1 text-[11px]">
                <span class="text-slate-500">শারীরিক স্বাস্থ্য:</span>
                <span class="font-bold text-slate-800">${healthStatus}</span>
              </div>
            </div>

            <div class="p-2.5 bg-emerald-900 text-white rounded-xl text-[11px] italic font-bangla border border-gold-500/30 text-center">
              "হে আল্লাহ! আমার সম্মানিত স্পনসরকারী মুহতারামের ধন-সম্পদে বরকত দিন ও নেক হায়াত দান করুন। আমিন।"
            </div>

            <div class="pt-1 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">প্রতিষ্ঠান প্রধানের সত্যায়িত</span>
              <button onclick="printSingleSponsorCard('${s.name_bn}', '${s.class_name}', '${s.admission_no}', '${s.sponsor_name || 'সাধারণ দাতা ফান্ড'}', '${hifzInfo}')" class="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow-sm">
                <i class="fa-solid fa-print"></i> কার্ড প্রিন্ট
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    openModal('sponsorCardModal');
  } catch (err) {
    console.error('Error opening sponsor cards:', err);
  }
}

function printSingleSponsorCard(name, className, admissionNo, sponsor, progress) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>এতিম ছাত্র স্পনসরশিপ প্রগ্রেস রিপোর্ট</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { font-family: 'Hind Siliguri', sans-serif; padding: 40px; }</style>
      </head>
      <body>
        <div style="max-width: 500px; margin: 0 auto; border: 3px double #145032; border-radius: 20px; padding: 25px; background: #fafdfb;">
          <div style="text-align: center; border-bottom: 2px solid #145032; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #0d3822; margin: 0;">হেদায়েত টেক জামিয়া মাদরাসা ও এতিমখানা</h2>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0 0;">এতিম ও মুফত ছাত্র স্পনসরশিপ অগ্রগতি কার্ড</p>
          </div>
          <p><strong>শিক্ষার্থীর নাম:</strong> ${name}</p>
          <p><strong>জামাত:</strong> ${className} (দাখেলা নং: ${admissionNo})</p>
          <p><strong>সম্মানিত স্পনসর:</strong> ${sponsor}</p>
          <p><strong>হিফজ ও পড়ালেখার অগ্রগতি:</strong> ${progress}</p>
          <div style="margin: 20px 0; background: #e6f4ea; border: 1px dashed #145032; padding: 12px; border-radius: 10px; font-style: italic; text-align: center; font-size: 12px;">
            "হে আল্লাহ! আমার শ্রদ্ধেয় স্পনসরকারী দাতা মহোদয়কে দুনিয়া ও আখিরাতে উত্তম জাযা এবং বরকত দান করুন। আমিন।"
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
            <span>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</span>
            <span>মুহতামিম / শিক্ষা সচিবের স্বাক্ষর</span>
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  win.document.close();
}

// ==========================================
// ২৪. জিরো-কস্ট ফ্রি হোয়াটসঅ্যাপ মেসেঞ্জার হাব
// ==========================================
function openWhatsAppMessenger(type = 'absence', phone = '01884636312', studentName = 'মুহাম্মদ আব্দুল্লাহ') {
  const select = document.getElementById('waTemplateSelect');
  if (select) select.value = type;

  const phoneInput = document.getElementById('waGuardianPhone');
  if (phoneInput && phone) phoneInput.value = phone;

  changeWhatsAppTemplate(studentName);
  openModal('whatsappMessengerModal');
}

function changeWhatsAppTemplate(studentName = 'মুহাম্মদ আব্দুল্লাহ') {
  const type = document.getElementById('waTemplateSelect')?.value || 'absence';
  const textarea = document.getElementById('waMessageText');
  if (!textarea) return;

  const templates = {
    absence: `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ। মারকাযুল কুরআন মাদরাসার পক্ষ থেকে জানানো যাচ্ছে যে, আপনার সন্তান *${studentName}* অদ্য মাদরাসায় উপস্থিত হয়নি। কোনো জরুরি ওযর বা অসুস্থতা থাকলে অনুগ্রহ করে মাদরাসা অফিসে অবগত করুন। জাযাকাল্লাহ খাইরান।`,
    fee: `আসসালামু আলাইকুম। মুহতারাম অভিভাবক, আপনার সন্তান *${studentName}*-এর চলতি মাসের বেতন ও মেস ফি বাবদ বকেয়া রয়েছে। নির্ধারিত সময়ের মধ্যে মাদরাসা অফিসে বা বিকাশ নম্বরে পরিশোধের অনুরোধ করা যাচ্ছে।`,
    hifz: `মাশাল্লাহ! মারকাযুল কুরআন মাদরাসার হিফজ বিভাগ থেকে জানাচ্ছি যে, আপনার সন্তান *${studentName}* অদ্য অত্যন্ত সুন্দরভাবে সবক ও আমোখতা তিলাওয়াত সম্পন্ন করেছে। তার ধারাবাহিক অগ্রগতির জন্য বিশেষ দোয়া প্রার্থী।`,
    khuruj: `আসসালামু আলাইকুম। আপনার সন্তান *${studentName}* মাদরাসা থেকে অনুমোদিত ছুটিতে বাড়ির উদ্দেশ্যে রওনা হয়েছে। অনুগ্রহ করে সন্তান বাড়ি পৌঁছালে মাদরাসা কর্তৃপক্ষকে ফোনে নিশ্চিত করবেন।`,
    general: `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ। মারকাযুল কুরআন মাদরাসার সকল সম্মানিত অভিভাবকবৃন্দের সদয় অবগতির জন্য জানানো যাচ্ছে যে, আগামী বৃহস্পতিবার মাদরাসায় বিশেষ অভিভাবক সমাবেশ ও দোয়া মাহফিল অনুষ্ঠিত হবে। আপনার উপস্থিতি একান্ত কাম্য।`
  };

  textarea.value = templates[type] || templates.absence;
}

function dispatchWhatsAppMessage() {
  const phone = document.getElementById('waGuardianPhone')?.value.replace(/[^0-9]/g, '') || '';
  const text = document.getElementById('waMessageText')?.value || '';

  if (!phone || !text.trim()) {
    alert('দয়া করে অভিভাবকের মোবাইল নম্বর এবং বার্তাটি দিন।');
    return;
  }

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  closeModal('whatsappMessengerModal');
}

// পেজ লোড হলে খরচ ক্যালকুলেটর ও নোটিশ চালু করা
document.addEventListener('DOMContentLoaded', () => {
  updateCostCalculator();
  loadNotices();
});
