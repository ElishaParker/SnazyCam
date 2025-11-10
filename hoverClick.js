// hoverClick.js — rectangle hit-test + dwell, no elementFromPoint, no z-index dependency
(() => {
  // ---- Tunables (overridable by controls panel) ----
  window.HOVER_TIME    = window.HOVER_TIME    ?? 1500; // ms to trigger click
  window.CURSOR_RADIUS = window.CURSOR_RADIUS ?? 15;   // px jitter radius
  const HOVER_OUT_GRACE = 10; // px grace when leaving briefly

  // ---- Style for visual feedback ----
  const style = document.createElement("style");
  style.textContent = `
    .gaze-hover {
      outline: 2px solid #00ffff !important;
      box-shadow: 0 0 10px #00ffff88 !important;
      transition: box-shadow 0.08s ease;
    }
  `;
  document.head.appendChild(style);

  // ---- Progress wheel near cursor ----
  const wheel = document.createElement("div");
  Object.assign(wheel.style, {
    position: "fixed",
    width: "40px",
    height: "40px",
    border: "3px solid rgba(0,255,255,0.3)",
    borderTopColor: "#00ffff",
    borderRadius: "50%",
    pointerEvents: "none",
    opacity: 0,
    zIndex: 6, // must be above canvas (z=5)
    transform: "rotate(0deg)",
    transition: "opacity 0.15s ease, transform 0.08s linear",
    left: "-9999px",
    top: "-9999px",
  });
  document.body.appendChild(wheel);

  const updateWheel = (x, y, progress) => {
    wheel.style.left = `${x - 20}px`;
    wheel.style.top  = `${y - 20}px`;
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  };

  // ---- Track dwell per element ----
  let activeEl = null;
  let hoverStart = 0;
  let progress = 0;

  // ---- Collect clickable elements ----
  const CLICK_SELECTOR = "button, [onclick], [data-hover-click], input, .clickable";
  let clickables = [];

  function refreshClickables() {
    clickables = Array.from(document.querySelectorAll(CLICK_SELECTOR))
      .filter(el => el.offsetParent !== null || el === document.body);
  }
  refreshClickables();

  // Observe DOM changes (dynamic UIs)
  const mo = new MutationObserver(refreshClickables);
  mo.observe(document.body, { childList: true, subtree: true, attributes: true });

  // ---- Hit-test helper ----
  function insideRect(x, y, rect, radius) {
    const left   = rect.left   - radius;
    const right  = rect.right  + radius;
    const top    = rect.top    - radius;
    const bottom = rect.bottom + radius;
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  // ---- Main tracking loop ----
  function loop() {
    const sc = window.smoothedCursor;
    if (!sc) {
      requestAnimationFrame(loop);
      return;
    }

    // ✅ Flip horizontally to align with non-mirrored DOM
    const x = window.innerWidth - sc.x;
    const y = sc.y;

    // ✅ Refresh clickable list continuously (for late UI)
    refreshClickables();

    // Always update wheel position
    updateWheel(x, y, progress);

    // --- Continue dwell if still inside active element ---
    if (activeEl) {
      const rect = activeEl.getBoundingClientRect();
      const stillInside = insideRect(x, y, rect, Math.max(window.CURSOR_RADIUS, HOVER_OUT_GRACE));

      if (stillInside) {
        const elapsed = performance.now() - hoverStart;
        progress = Math.min(elapsed / (window.HOVER_TIME || 1500), 1);
        updateWheel(x, y, progress);

        if (progress >= 1) {
          console.log("🟢 Click triggered on:", activeEl.tagName, activeEl.textContent.trim());
          activeEl.click();
          activeEl.classList.remove("gaze-hover");
          activeEl = null;
          hoverStart = 0;
          progress = 0;
          updateWheel(x, y, 0);
        }

        requestAnimationFrame(loop);
        return;
      } else {
        activeEl.classList.remove("gaze-hover");
        activeEl = null;
        hoverStart = 0;
        progress = 0;
        updateWheel(x, y, 0);
      }
    }

    // --- Detect new hover target ---
    let found = null;
    for (const el of clickables) {
      const rect = el.getBoundingClientRect();
      if (insideRect(x, y, rect, window.CURSOR_RADIUS || 15)) {
        found = el;
        break;
      }
    }

    if (found) {
      console.log(
        "Hovering:",
        found.tagName,
        found.textContent.trim() || found.getAttribute("id") || found.className || "(no label)"
      );
      activeEl = found;
      activeEl.classList.add("gaze-hover");
      hoverStart = performance.now();
      progress = 0;
      updateWheel(x, y, 0);
    } else {
      progress = 0;
      updateWheel(x, y, 0);
    }

    requestAnimationFrame(loop);
  }

  loop();
})();
