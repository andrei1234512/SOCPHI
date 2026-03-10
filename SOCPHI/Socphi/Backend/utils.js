  /* ============================================================
    PrivaShield — utils.js
    Shared utility functions used across all pages
    ============================================================ */

  /**
   * Show a toast notification at the bottom of the screen
   * @param {string} msg - Message to display
   * @param {number} duration - Duration in ms (default 2800)
   */
  function showAlert(msg, duration = 2800) {
    const bar = document.getElementById('alertBar');
    if (!bar) return;
    bar.textContent = msg;
    bar.style.display = 'block';
    clearTimeout(bar._timer);
    bar._timer = setTimeout(() => { bar.style.display = 'none'; }, duration);
  }

  /**
   * Copy text to clipboard and show a toast
   * @param {string} text
   */
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => showAlert('📋 Copied to clipboard!'))
      .catch(() => showAlert('❌ Copy failed — try manually.'));
  }

  let meter = document.getElementById("phishMeter");
let level = document.getElementById("phishLevel");

/* Example scoring */

let text = document.getElementById("emailInput").value.toLowerCase();

let score = 0;

if(text.includes("verify")) score++;
if(text.includes("urgent")) score++;
if(text.includes("click")) score++;
if(text.includes("account")) score++;
if(text.includes("password")) score++;

let meter = document.getElementById("phishMeter");
let level = document.getElementById("phishLevel");

if(score <= 1){
    meter.style.width = "30%";
    meter.style.background = "#10b981";
    level.innerText = "LOW RISK";
}

else if(score <= 3){
    meter.style.width = "60%";
    meter.style.background = "#f59e0b";
    level.innerText = "MEDIUM RISK";
}

else{
    meter.style.width = "100%";
    meter.style.background = "#ef4444";
    level.innerText = "HIGH RISK";
}