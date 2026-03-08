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