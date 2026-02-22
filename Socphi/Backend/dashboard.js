/* ============================================================
   PrivaShield — dashboard.js
   All logic for the Dashboard page modules
   ============================================================ */

/* ============================================================
   SIDEBAR
   ============================================================ */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

/* ============================================================
   PANEL SWITCHING
   ============================================================ */
const PANEL_TITLES = {
  passwords : '🔑 Password Checker',
  phishing  : '🎣 Phishing Detector',
  quiz      : '📊 Privacy Score',
  tips      : '💡 Protection Tips',
  vault     : '🔒 Secure Vault',
};

function showPanel(id) {
  // Hide all panels & deactivate all nav items
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show selected panel
  document.getElementById('panel-' + id).classList.add('active');

  // Mark active nav item
  const navItem = document.querySelector(`[data-panel="${id}"]`);
  if (navItem) navItem.classList.add('active');

  // Update topbar title
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = PANEL_TITLES[id] || '';

  closeSidebar();
}

/* ============================================================
   MODULE 1 — PASSWORD CHECKER
   ============================================================ */
const COMMON_PASSWORDS = [
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234567', 'iloveyou', 'admin', 'letmein',
  'monkey', 'dragon', 'master', 'sunshine', 'princess',
  'welcome', 'shadow', 'abc123', 'pass', '1234', '111111', 'password1',
];

function checkPassword() {
  const pw = document.getElementById('pwInput').value;

  const checks = {
    len      : pw.length >= 12,
    upper    : /[A-Z]/.test(pw),
    lower    : /[a-z]/.test(pw),
    num      : /[0-9]/.test(pw),
    sym      : /[^A-Za-z0-9]/.test(pw),
    nocommon : pw.length > 0 && !COMMON_PASSWORDS.includes(pw.toLowerCase()),
  };

  // Update check indicators
  Object.keys(checks).forEach(k => {
    const el = document.getElementById('chk-' + k);
    if (el) el.classList.toggle('pass', checks[k]);
  });

  const score = Object.values(checks).filter(Boolean).length;
  const bar   = document.getElementById('strengthBar');
  const label = document.getElementById('strengthLabel');

  if (!pw) {
    bar.style.width = '0%';
    label.textContent = 'Waiting for input...';
    label.style.color = 'var(--muted)';
    return;
  }

  const pct = Math.round((score / 6) * 100);
  bar.style.width = pct + '%';

  const levels = [
    { min: 0, color: 'var(--danger)',  text: '🔴 Very Weak — Change immediately!'   },
    { min: 2, color: 'var(--danger)',  text: '🔴 Weak — Easily cracked'             },
    { min: 3, color: 'var(--warning)', text: '🟡 Moderate — Needs improvement'      },
    { min: 4, color: 'var(--warning)', text: '🟡 Good — Getting there!'             },
    { min: 5, color: 'var(--success)', text: '🟢 Strong — Well done!'               },
    { min: 6, color: 'var(--accent)',  text: '💪 Very Strong — Excellent password!' },
  ];

  // Pick highest matching level
  const lvl = [...levels].reverse().find(l => score >= l.min) || levels[0];
  bar.style.background = lvl.color;
  label.textContent    = lvl.text;
  label.style.color    = lvl.color;
}

function togglePw() {
  const inp = document.getElementById('pwInput');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function generatePassword() {
  const len   = parseInt(document.getElementById('pwLen').value);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-=[]{}';
  let pw = '';
  for (let i = 0; i < len; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById('genResult').textContent = pw;
}

function copyGenPassword() {
  const txt = document.getElementById('genResult').textContent;
  if (!txt || txt === '—') return;
  copyToClipboard(txt);
}

/* ============================================================
   MODULE 2 — PHISHING DETECTOR
   ============================================================ */
const EMAIL_RED_FLAGS = [
  { pattern: /urgent|immediately|act now|expires|suspended|verify now|click here now/i, msg: '⚠️ Urgency language detected',            weight: 2 },
  { pattern: /dear (customer|user|account holder|member)/i,                             msg: '⚠️ Generic greeting (not your name)',     weight: 1 },
  { pattern: /password|ssn|credit card|bank account|social security/i,                 msg: '🚨 Requesting sensitive data',            weight: 3 },
  { pattern: /won|winner|lottery|prize|claim|congratulations/i,                        msg: '⚠️ Prize / lottery scam language',        weight: 2 },
  { pattern: /click here|click below|follow this link/i,                               msg: '⚠️ Vague link instructions',              weight: 1 },
  { pattern: /free|gift|bonus|limited offer/i,                                         msg: '⚠️ Too-good-to-be-true offers',           weight: 1 },
];

const URL_RED_FLAGS = [
  { pattern: /^http:\/\//i,                                                  msg: '🚨 Not HTTPS — insecure connection',      weight: 2 },
  { pattern: /\d{1,3}(\.\d{1,3}){3}/,                                        msg: '🚨 IP address used instead of domain',   weight: 3 },
  { pattern: /\.(xyz|tk|ml|ga|cf|gq|top|pw|click|link)$/i,                  msg: '⚠️ Suspicious top-level domain',         weight: 2 },
  { pattern: /login|signin|verify|update|secure|account|bank/i,             msg: '⚠️ Sensitive keywords in URL',           weight: 1 },
  { pattern: /[0-9o]{2,}|paypa1|g00gle|faceb00k|arnazon/i,                  msg: '🚨 Spoofed brand name detected',         weight: 3 },
  { pattern: /%[0-9a-f]{2}/i,                                                msg: '⚠️ URL encoding — may hide destination', weight: 1 },
];

function _renderRisk(elId, flags, weight) {
  const el = document.getElementById(elId);
  el.style.display = 'block';

  if (weight === 0) {
    el.className = 'risk-result risk-safe';
    el.innerHTML = '<div class="risk-badge">✅ Looks Safe</div>No major red flags detected. Still verify the sender carefully.';
  } else if (weight <= 2) {
    el.className = 'risk-result risk-warn';
    el.innerHTML = `<div class="risk-badge">⚠️ Suspicious</div>Red flags found:<br>${flags.join('<br>')}`;
  } else {
    el.className = 'risk-result risk-danger';
    el.innerHTML = `<div class="risk-badge">🚨 HIGH RISK — Likely Phishing!</div>Threats detected:<br>${flags.join('<br>')}<br><br><strong>Do NOT click any links or reply.</strong>`;
  }
}

function checkEmail() {
  const text = document.getElementById('emailInput').value.trim();
  if (!text) { showAlert('Please paste some email content first.'); return; }

  let flags = [], weight = 0;
  EMAIL_RED_FLAGS.forEach(rf => {
    if (rf.pattern.test(text)) { flags.push(rf.msg); weight += rf.weight; }
  });
  _renderRisk('emailResult', flags, weight);
}

function checkURL() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) { showAlert('Please enter a URL to check.'); return; }

  let flags = [], weight = 0;
  URL_RED_FLAGS.forEach(rf => {
    if (rf.pattern.test(url)) { flags.push(rf.msg); weight += rf.weight; }
  });
  _renderRisk('urlResult', flags, weight);
}

/* ============================================================
   MODULE 3 — PRIVACY SCORE QUIZ
   ============================================================ */
const quizAnswers = {};

function selectOption(btn) {
  const q = btn.dataset.q;
  document.querySelectorAll(`[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  quizAnswers[q] = parseInt(btn.dataset.v);
}

function calculateScore() {
  if (Object.keys(quizAnswers).length < 6) {
    showAlert('Please answer all 6 questions first!');
    return;
  }

  const total = Object.values(quizAnswers).reduce((a, b) => a + b, 0);
  const pct   = Math.round((total / 18) * 100);

  document.getElementById('scoreDisplay').style.display = 'block';
  document.getElementById('scoreNum').textContent        = pct + '%';
  document.getElementById('calcBtn').style.display       = 'none';

  let color, text, sub;

  if (pct >= 80) {
    color = 'var(--success)';
    text  = '🏆 Privacy Champion!';
    sub   = 'Excellent! You follow strong privacy practices.\nKeep monitoring and updating your habits regularly.';
  } else if (pct >= 55) {
    color = 'var(--warning)';
    text  = '⚠️ Needs Improvement';
    sub   = 'You have some good habits but several gaps.\nFocus on enabling 2FA and using stronger passwords.';
  } else {
    color = 'var(--danger)';
    text  = '🚨 High Risk!';
    sub   = 'Your privacy practices leave you very vulnerable.\nStart with unique passwords and 2FA today.';
  }

  const ring = document.getElementById('scoreRing');
  ring.style.borderColor = color;
  ring.style.color       = color;

  const scoreText = document.getElementById('scoreText');
  scoreText.style.color = color;
  scoreText.textContent = text;
  document.getElementById('scoreSub').textContent = sub;
}

function resetQuiz() {
  Object.keys(quizAnswers).forEach(k => delete quizAnswers[k]);
  document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
  document.getElementById('scoreDisplay').style.display = 'none';
  document.getElementById('calcBtn').style.display      = 'inline-flex';
}

/* ============================================================
   MODULE 5 — SECURE VAULT (XOR + Base64 simulation)
   ============================================================ */
const VAULT_PREFIX = 'ENC::';

function _xorCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

function encryptData() {
  const data = document.getElementById('vaultInput').value;
  const key  = document.getElementById('vaultKey').value;

  if (!data || !key) { showAlert('Please enter text and a secret key.'); return; }

  const encrypted = VAULT_PREFIX + btoa(_xorCipher(data, key));

  const out = document.getElementById('vaultOutput');
  out.style.display = 'block';
  out.textContent   = encrypted;
  showAlert('🔐 Data encrypted successfully!');
}

function decryptData() {
  const data = document.getElementById('vaultInput').value.trim();
  const key  = document.getElementById('vaultKey').value;

  if (!data.startsWith(VAULT_PREFIX)) {
    showAlert('Paste the encrypted text (starts with ENC::) into the text area first.');
    return;
  }

  try {
    const decoded   = atob(data.replace(VAULT_PREFIX, ''));
    const decrypted = _xorCipher(decoded, key);

    const out = document.getElementById('vaultOutput');
    out.style.display = 'block';
    out.textContent   = '✅ DECRYPTED: ' + decrypted;
    showAlert('🔓 Data decrypted!');
  } catch {
    showAlert('❌ Wrong key or invalid encrypted data.');
  }
}

/* ============================================================
   INIT — Run on page load
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Set default active panel
  showPanel('passwords');

  // Attach nav item click events
  document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => showPanel(item.dataset.panel));
  });

  // Range slider display
  const pwLen  = document.getElementById('pwLen');
  const lenVal = document.getElementById('lenVal');
  if (pwLen && lenVal) {
    pwLen.addEventListener('input', () => { lenVal.textContent = pwLen.value; });
  }
});