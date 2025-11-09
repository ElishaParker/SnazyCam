// hoverClick.js
(function() {
  window.HOVER_TIME = window.HOVER_TIME || 1500;   // ms to trigger click
  window.CURSOR_RADIUS = window.CURSOR_RADIUS || 15;

  let hoverTarget = null;
  let hoverStart = null;
  let hoverProgress = 0;

  // --- Loading wheel ---
  const wheel = document.createElement("div");
  Object.assign(wheel.style, {
    position: "fixed",
    width: "40px",
    height: "40px",
    border: "3px solid rgba(0,255,255,0.3)",
    borderTopColor: "#00ffff",
    borderRadius: "50%",
    pointerEvents: "none",
    transition: "opacity 0.2s ease, transform 0.1s linear",
    opacity: 0,
    zIndex: 9999,
    transform: "rotate(0deg)",
  });
  document.body.appendChild(wheel);

  // --- Helper ---
  function updateWheel(x, y, progress) {
    wheel.style.left = `${x - 20}px`;
    wheel.style.top = `${y - 20}px`;
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  }

  // --- Handle cursor hover state updates ---
  function startHover(el) {
    hoverTarget = el;
    hoverStart = performance.now();
    hoverProgress = 0;
  }
  function endHover() {
    hoverTarget = null;
    hoverStart = null;
    hoverProgress = 0;
    wheel.style.opacity = 0;
  }

  // --- Bind to all clickable elements dynamically ---
  function bindHoverEvents() {
    const clickables = document.querySelectorAll(
      "button, [onclick], [data-hover-click], input, .clickable"
    );
    clickables.forEach(el => {
      el.addEventListener("mouseenter", () => startHover(el));
      el.addEventListener("mouseleave", endHover);
    });
  }
  bindHoverEvents();

  // --- MutationObserver to rebind if new buttons appear ---
  const observer = new MutationObserver(bindHoverEvents);
  observer.observe(document.body, { childList: true, subtree: true });

  // --- Main animation loop ---
  function loop() {
    if (!window.smoothedCursor) return requestAnimationFrame(loop);

    const { x, y } = window.smoothedCursor;

    // Update wheel position
    updateWheel(x, y, hoverProgress);

    if (hoverTarget && hoverStart) {
      const elapsed = performance.now() - hoverStart;
      hoverProgress = Math.min(elapsed / window.HOVER_TIME, 1);

      // If we hit full dwell time → click
      if (hoverProgress >= 1) {
        hoverTarget.click();
        endHover();
      }
    }

    requestAnimationFrame(loop);
  }

  // --- Wheel spin CSS (for fallback visual) ---
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    button:hover, [data-hover-click]:hover {
      outline: 2px solid #00ffff;
      box-shadow: 0 0 10px #00ffff88;
    }
  `;
  document.head.appendChild(style);

  loop();
})();
