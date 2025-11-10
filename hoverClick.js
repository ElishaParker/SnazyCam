// hoverClick.js
(function () {
  // Tunables (can be overridden by controls.js)
  window.HOVER_TIME    = window.HOVER_TIME    || 1500; // ms
  window.CURSOR_RADIUS = window.CURSOR_RADIUS || 15;   // px wobble tolerance

  let hoverTarget = null;
  let hoverStart  = null;
  let hoverProgress = 0;

  // Progress wheel (always above everything)
  const wheel = document.createElement("div");
  Object.assign(wheel.style, {
    position: "fixed",
    width: "40px",
    height: "40px",
    border: "3px solid rgba(0,255,255,0.3)",
    borderTopColor: "#00ffff",
    borderRadius: "50%",
    pointerEvents: "none",
    transition: "opacity 0.2s ease, transform 0.08s linear",
    opacity: 0,
    zIndex: 9999,
    transform: "rotate(0deg)",
    left: "-9999px", top: "-9999px",
  });
  document.body.appendChild(wheel); // ⬅️ keep this line; ensures the wheel overlays correctly

  // Style for simulated hover highlight
  const style = document.createElement("style");
  style.textContent = `
    .gaze-hover {
      outline: 2px solid #00ffff !important;
      box-shadow: 0 0 10px #00ffff88 !important;
    }
  `;
  document.head.appendChild(style);

  // Update progress wheel
  function updateWheel(x, y, progress) {
    wheel.style.left = `${x - 20}px`;
    wheel.style.top  = `${y - 20}px`;
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  }

  // Find a clickable ancestor for an elementFromPoint hit
  function findClickable(el) {
    const selector = "button, [onclick], [data-hover-click], input, .clickable";
    while (el && el !== document.body) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  // Clear previous highlight/timer
  function endHover() {
    if (hoverTarget) hoverTarget.classList.remove("gaze-hover");
    hoverTarget   = null;
    hoverStart    = null;
    hoverProgress = 0;
    wheel.style.opacity = 0;
  }

  function loop() {
    // Need a cursor position (CSS pixels)
    if (!window.smoothedCursor) {
      requestAnimationFrame(loop);
      return;
    }

    const { x, y } = window.smoothedCursor;

    // Get top element under the synthetic cursor
    // (canvas has pointer-events:none, so this reaches real DOM)
    const elUnder = document.elementFromPoint(x, y);
    const clickable = findClickable(elUnder);

    if (!clickable) {
      // Not over anything clickable
      endHover();
      updateWheel(x, y, 0);
      requestAnimationFrame(loop);
      return;
    }

    // New target?
    if (hoverTarget !== clickable) {
      if (hoverTarget) hoverTarget.classList.remove("gaze-hover");
      hoverTarget = clickable;
      hoverTarget.classList.add("gaze-hover");
      hoverStart = performance.now();
      hoverProgress = 0;
    } else {
      // Same target: progress toward dwell time
      const elapsed = performance.now() - hoverStart;
      hoverProgress = Math.min(elapsed / window.HOVER_TIME, 1);
    }

    updateWheel(x, y, hoverProgress);

    // Dwell reached → click
    if (hoverProgress >= 1) {
      hoverTarget.click();
      endHover();
      updateWheel(x, y, 0);
    }

    requestAnimationFrame(loop);
  }

  loop();
})();
