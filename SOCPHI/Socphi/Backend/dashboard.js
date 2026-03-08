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
  const pw = document.getElementById('pwInput').value.trim();
  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');

  if (!pw) {
    alert("Please enter a password first!");
    strengthBar.style.width = '0%';
    strengthLabel.textContent = 'Waiting for input...';
    // Reset all checks
    document.getElementById('chk-len').classList.remove('pass');
    document.getElementById('chk-upper').classList.remove('pass');
    document.getElementById('chk-lower').classList.remove('pass');
    document.getElementById('chk-num').classList.remove('pass');
    document.getElementById('chk-sym').classList.remove('pass');
    document.getElementById('chk-nocommon').classList.remove('pass');
    return;
  }

  // ===== Simple password evaluation =====
  const lengthOk = pw.length >= 12;
  const upper   = /[A-Z]/.test(pw);
  const lower   = /[a-z]/.test(pw);
  const number  = /\d/.test(pw);
  const symbol  = /[^A-Za-z0-9]/.test(pw);

  // Example common passwords check
  const commonPw = ["123456","password","qwerty","iloveyou","admin","letmein"];
  const notCommon = !commonPw.includes(pw.toLowerCase());

  // Update check indicators
  document.getElementById('chk-len').classList.toggle('pass', lengthOk);
  document.getElementById('chk-upper').classList.toggle('pass', upper);
  document.getElementById('chk-lower').classList.toggle('pass', lower);
  document.getElementById('chk-num').classList.toggle('pass', number);
  document.getElementById('chk-sym').classList.toggle('pass', symbol);
  document.getElementById('chk-nocommon').classList.toggle('pass', notCommon);

  // Compute a simple score (0-100)
  let score = 0;
  if(lengthOk) score += 20;
  if(upper)    score += 20;
  if(lower)    score += 20;
  if(number)   score += 20;
  if(symbol)   score += 10;
  if(notCommon)score += 10;

  // Update the strength bar and label
  strengthBar.style.display = 'block';
  strengthBar.style.transition = 'width 0.5s ease';
  strengthBar.style.width = score + '%';
  let label = '';
  if(score <= 30) label = 'Weak';
  else if(score <= 60) label = 'Moderate';
  else if(score <= 90) label = 'Strong';
  else label = 'Very Strong';
  strengthLabel.textContent = label;

  // Update the strength bar color based on the score
  if (score <= 30) {
    strengthBar.style.backgroundColor = 'red';
  } else if (score <= 60) {
    strengthBar.style.backgroundColor = 'orange';
  } else if (score <= 90) {
    strengthBar.style.backgroundColor = 'yellow';
  } else {
    strengthBar.style.backgroundColor = 'green';
  }

  // Save password to database
  console.log('Saving password:', { password: pw, length: pw.length, score: score });
  savePassword(pw, pw.length, score);
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

  // Determine risk level
  let riskLevel = 'low';
  if (weight === 0) riskLevel = 'low';
  else if (weight <= 2) riskLevel = 'medium';
  else riskLevel = 'high';

  // Save to database
  console.log('Saving email phishing scan:', { content: text, risk_level: riskLevel, weight: weight });
  savePhishingScan('email', text, riskLevel);
}

async function savePhishingScan(scanType, content, riskLevel) {
  try {
    const formData = new URLSearchParams();
    formData.append('scan_type', scanType);
    formData.append('content', content);
    formData.append('risk_level', riskLevel);
    formData.append('user_id', null); // user_id can be null as per table schema

    console.log('Sending to server:', { scan_type: scanType, risk_level: riskLevel });

    const response = await fetch('../Backend/phishing_scans.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);

    const result = JSON.parse(text);
    if (result.status === 'success') {
      console.log('Phishing scan saved successfully:', result);
    } else {
      console.error('Failed to save phishing scan:', result);
      showAlert('❌ Error saving scan: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving phishing scan:', error);
    showAlert('❌ Network error: Could not save scan. ' + error.message);
  }
}

function checkURL() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) { showAlert('Please enter a URL to check.'); return; }

  let flags = [], weight = 0;
  URL_RED_FLAGS.forEach(rf => {
    if (rf.pattern.test(url)) { flags.push(rf.msg); weight += rf.weight; }
  });
  _renderRisk('urlResult', flags, weight);

  // Determine risk level
  let riskLevel = 'low';
  if (weight === 0) riskLevel = 'low';
  else if (weight <= 2) riskLevel = 'medium';
  else riskLevel = 'high';

  // Save to database
  console.log('Saving URL phishing scan:', { content: url, risk_level: riskLevel, weight: weight });
  savePhishingScan('url', url, riskLevel);
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

  // Save quiz result to database
  console.log('Saving quiz result:', { score: total, percentage: pct });
  saveQuizResult(total, pct);
}

async function saveQuizResult(score, percentage) {
  try {
    const formData = new URLSearchParams();
    formData.append('score', score);
    formData.append('percentage', percentage);
    formData.append('user_id', null); // user_id can be null as per table schema

    console.log('Sending to server:', { score, percentage });

    const response = await fetch('../Backend/quiz_results.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);

    const result = JSON.parse(text);
    if (result.status === 'success') {
      console.log('Quiz result saved successfully:', result);
    } else {
      console.error('Failed to save quiz result:', result);
      showAlert('❌ Error saving result: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving quiz result:', error);
    showAlert('❌ Network error: Could not save result. ' + error.message);
  }
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

  // Save encrypted data to database
  console.log('Saving encrypted data to vault');
  saveEncryptedData(encrypted);
}

async function saveEncryptedData(encryptedData) {
  try {
    const formData = new URLSearchParams();
    formData.append('encrypted_data', encryptedData);
    formData.append('user_id', null); // user_id can be null as per table schema

    console.log('Sending encrypted data to server');

    const response = await fetch('../Backend/secure_vault.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);

    const result = JSON.parse(text);
    if (result.status === 'success') {
      console.log('Encrypted data saved successfully:', result);
    } else {
      console.error('Failed to save encrypted data:', result);
      showAlert('❌ Error saving to vault: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving encrypted data:', error);
    showAlert('❌ Network error: Could not save to vault. ' + error.message);
  }
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

  // Reset strength bar when password input is cleared
  const pwInput = document.getElementById('pwInput');
  if (pwInput) {
    pwInput.addEventListener('input', () => {
      if (pwInput.value === '') {
        document.getElementById('strengthBar').style.width = '0%';
        document.getElementById('strengthLabel').textContent = 'Waiting for input...';
        // Reset all checks
        document.getElementById('chk-len').classList.remove('pass');
        document.getElementById('chk-upper').classList.remove('pass');
        document.getElementById('chk-lower').classList.remove('pass');
        document.getElementById('chk-num').classList.remove('pass');
        document.getElementById('chk-sym').classList.remove('pass');
        document.getElementById('chk-nocommon').classList.remove('pass');
      }
    });
  }
}); // Ensure proper closure of the DOMContentLoaded event listener

// Function to send password data to save_password.php
async function savePassword(password, length, score) {
  try {
    const formData = new URLSearchParams();
    formData.append('password', password);
    formData.append('length', length);
    formData.append('score', score);

    console.log('Sending to server:', { password, length, score });
    console.log('FormData:', formData.toString());

    const response = await fetch('../Backend/save_password.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);

    const result = JSON.parse(text);
    if (result.status === 'success') {
      console.log('Password saved successfully:', result);
    } else {
      console.error('Failed to save password:', result);
      showAlert('❌ Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving password:', error);
    showAlert('❌ Network error: Could not save password. ' + error.message);
  }
}