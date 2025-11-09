// hoverClick.js
(function () {
  const HOVER_TIME = 1500; // ms to trigger click
  const CHECK_INTERVAL = 50; // how often to check position
  const CURSOR_RADIUS = 15; // radius to consider "hovering"

  let hoverTarget = null;
  let hoverStart = 0;
  let progressEl = null;

  // Create loading circle overlay
  progressEl = document.createElement("div");
  progressEl.id = "hoverProgress";
  progressEl.style.cssText = `
    position: fixed;
    width: 40px; height: 40px;
    border-radius: 50%;
    border: 3px solid #00FFFF;
    border-top-color: transparent;
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
  document.body.appendChild(progressEl);

  // Animation for the circular loader
  let rotation = 0;
  function updateProgress(percent) {
    rotation += 8;
    progressEl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 + percent * 0.3})`;
    progressEl.style.borderTopColor = percent > 0.7 ? "#0F0" : "#00FFFF";
  }

  function isHovering(element, cursorX, cursorY) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - cursorX;
    const dy = cy - cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < CURSOR_RADIUS + Math.min(rect.width, rect.height) / 2;
  }

  // Check cursor vs DOM elements
  setInterval(() => {
    if (!window.smoothedCursor) return;

    const cursorX = window.smoothedCursor.x;
    const cursorY = window.smoothedCursor.y;

    // Find the topmost clickable element
    const elements = [...document.querySelectorAll("button, a, [data-hoverclick]")];
    const target = elements.find(el => isHovering(el, cursorX, cursorY));

    if (target) {
      if (hoverTarget !== target) {
        hoverTarget = target;
        hoverStart = Date.now();
        progressEl.style.opacity = "1";
      } else {
        const elapsed = Date.now() - hoverStart;
        const percent = Math.min(1, elapsed / HOVER_TIME);
        updateProgress(percent);

        // Update progress circle position
        progressEl.style.left = `${cursorX}px`;
        progressEl.style.top = `${cursorY}px`;

        if (elapsed >= HOVER_TIME) {
          hoverTarget.click(); // Trigger the click
          progressEl.style.opacity = "0";
          hoverTarget = null;
        }
      }
    } else {
      hoverTarget = null;
      progressEl.style.opacity = "0";
    }
  }, CHECK_INTERVAL);
})();
