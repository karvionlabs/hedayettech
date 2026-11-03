// ==========================================
// গ্লোবাল ভেরিয়েবল ও ইনিশিয়ালাইজেশন
// ==========================================
let financeChartInstance = null;
let currentTab = 'dashboard';
let globalClasses = [];
let globalStudents = [];

document.addEventListener('DOMContentLoaded', () => {
  initDateDisplay();
  loadDashboard();
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
    hifz: '৩. কুরআনুল কারীম হিফজ তথ্য খাতা',
    academics: '৪. কিতাব ও জামাত বিভাগ',
    boarding: '৫. লিল্লাহ বোর্ডিং ও মেস বাজার খাতা',
    accounts: '৬. আয়-ব্যয়, বেতন ও ক্যাশ খাতা',
    exams: '৭. পরীক্ষা ও ইসলামিক গ্রেডিং পদ্ধতি',
    staff: '৮. উস্তাদ ও কর্মকর্তা ডিরেক্টরি',
    attendance: '৯. ডিজিটাল উপস্থিতি ও অটো এসএমএস',
    settings: '১০. সিস্টেম সেটিংস ও লাইসেন্স'
  };
  document.getElementById('page-title').innerText = titles[tabId] || 'মাদ্রাসা ম্যানেজমেন্ট';

  // ডাটা লোড
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'students') loadStudents();
  if (tabId === 'hifz') loadHifz();
  if (tabId === 'academics') loadClasses();
  if (tabId === 'boarding') loadBoarding();
  if (tabId === 'accounts') loadAccounts();
  if (tabId === 'staff') loadStaff();
  if (tabId === 'attendance') loadAttendance();
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
    document.getElementById('dash-total-students').innerText = s.totalStudents.toLocaleString('bn-BD');
    document.getElementById('dash-residential-students').innerText = s.residentialCount.toLocaleString('bn-BD');
    document.getElementById('dash-non-residential').innerText = s.nonResidentialCount.toLocaleString('bn-BD');
    document.getElementById('dash-hifz-students').innerText = s.hifzStudents.toLocaleString('bn-BD');

    document.getElementById('dash-income').innerText = `৳ ${s.incomeThisMonth.toLocaleString('bn-BD')}`;
    document.getElementById('dash-expense').innerText = `৳ ${s.expenseThisMonth.toLocaleString('bn-BD')}`;
    document.getElementById('dash-balance').innerText = `৳ ${s.balance.toLocaleString('bn-BD')}`;

    document.getElementById('dash-att-rate').innerText = `${s.todayAttendance.rate.toLocaleString('bn-BD')}%`;
    document.getElementById('dash-att-present').innerText = s.todayAttendance.present.toLocaleString('bn-BD');
    document.getElementById('dash-att-absent').innerText = s.todayAttendance.absent.toLocaleString('bn-BD');

    if (data.institution) {
      document.getElementById('sidebar-inst-name').innerText = data.institution.name_bn;
    }

    // চার্ট
    renderFinanceChart(s.incomeThisMonth, s.expenseThisMonth, s.balance);

    // সাম্প্রতিক ট্রানজেকশন
    const tbody = document.getElementById('dash-recent-tx-body');
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

    // মডাল ও ফিল্টার সিলেক্ট আপডেট
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

    // হিফজ মডালের জন্য ড্রপডাউন প্রস্তুত
    const hifzStudentSelect = document.getElementById('modalHifzStudentSelect');
    if (hifzStudentSelect) {
      hifzStudentSelect.innerHTML = '<option value="">শিক্ষার্থী বেছে নিন</option>';
      data.students.forEach(s => {
        hifzStudentSelect.innerHTML += `<option value="${s.id}">[${s.admission_no}] ${s.name_bn} (রোল: ${s.roll_no})</option>`;
      });
    }

    const tbody = document.getElementById('students-table-body');
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
// ৫. হিফজ ট্র্যাকার ডাটা লোড
// ==========================================
async function loadHifz() {
  try {
    const res = await fetch('/api/hifz');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('hifz-table-body');
    tbody.innerHTML = '';

    if (data.logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">কোনো হিফজ রেকর্ড পাওয়া যায়নি</td></tr>`;
      return;
    }

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

    document.getElementById('boarding-total-cost').innerText = `৳ ${data.summary.totalCost.toLocaleString('bn-BD')}`;

    const tbody = document.getElementById('boarding-table-body');
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

    document.getElementById('acc-total-income').innerText = `৳ ${data.summary.totalIncome.toLocaleString('bn-BD')}`;
    document.getElementById('acc-total-expense').innerText = `৳ ${data.summary.totalExpense.toLocaleString('bn-BD')}`;
    document.getElementById('acc-net-cash').innerText = `৳ ${data.summary.netCash.toLocaleString('bn-BD')}`;

    const tbody = document.getElementById('accounts-table-body');
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

    document.getElementById('staff-total-salary').innerText = `৳ ${data.totalSalary.toLocaleString('bn-BD')}`;

    const grid = document.getElementById('staff-grid');
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
    document.getElementById('set-name-bn').innerText = inst.name_bn;
    document.getElementById('set-name-ar').innerText = inst.name_ar || '-';
    document.getElementById('set-muhtamim').innerText = inst.muhtamim_name;
    document.getElementById('set-phone').innerText = inst.phone;
    document.getElementById('set-address').innerText = inst.address;
    document.getElementById('set-license').innerText = inst.license_expiry;
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

// ==========================================
// মোডাল হ্যান্ডলার ও ফর্ম সাবমিট
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
            <h3>উম্মে কুলসুম মাদরাসা</h3>
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
