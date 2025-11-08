(() => {
  // ---- Default benchmark settings ----
  const defaults = {
    SMOOTHING_ALPHA: 0.1,
    NOSE_SMOOTH_ALPHA: 0.08,
    CURSOR_ALPHA: 0.2,
    SENSITIVITY_X: 1.0,
    SENSITIVITY_Y: 1.0,
    VIRTUAL_SCALE: 15,
    CLAMP_THRESHOLD: 1.0,
    CLAMP_EASE: 0.05,
    VERTICAL_FINE_TUNE: 15,
    HORIZONTAL_FINE_TUNE: 25,
  };

  // Create the control panel container
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.bottom = "20px";
  panel.style.right = "20px";
  panel.style.background = "rgba(0, 0, 0, 0.7)";
  panel.style.border = "1px solid #00ffff";
  panel.style.borderRadius = "12px";
  panel.style.padding = "12px";
  panel.style.color = "#00ffff";
  panel.style.fontFamily = "monospace";
  panel.style.fontSize = "13px";
  panel.style.zIndex = "9999";
  panel.style.transition = "all 0.3s ease";
  panel.style.maxWidth = "260px";
  panel.style.backdropFilter = "blur(6px)";
  panel.style.overflow = "hidden";

  // Collapsible toggle button
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "⚙️ Controls";
  toggleButton.style.position = "fixed";
  toggleButton.style.bottom = "20px";
  toggleButton.style.right = "20px";
  toggleButton.style.zIndex = "9998";
  toggleButton.style.background = "#00ffff";
  toggleButton.style.color = "#000";
  toggleButton.style.fontWeight = "bold";
  toggleButton.style.border = "none";
  toggleButton.style.borderRadius = "20px";
  toggleButton.style.padding = "8px 14px";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.boxShadow = "0 0 10px #00ffff88";
  toggleButton.style.transition = "0.3s ease";

  let visible = true;
  toggleButton.onclick = () => {
    visible = !visible;
    panel.style.opacity = visible ? "1" : "0";
    panel.style.pointerEvents = visible ? "auto" : "none";
    panel.style.transform = visible ? "scale(1)" : "scale(0.9)";
  };

  document.body.appendChild(panel);
  document.body.appendChild(toggleButton);

  // Helper to create labeled sliders
  function addSlider(label, key, min, max, step) {
    const container = document.createElement("div");
    container.style.marginBottom = "8px";

    const text = document.createElement("label");
    text.textContent = `${label}: `;
    text.style.display = "block";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = window[key] ?? defaults[key];
    slider.style.width = "100%";

    const valLabel = document.createElement("span");
    valLabel.textContent = slider.value;

    slider.oninput = () => {
      const v = parseFloat(slider.value);
      window[key] = v;
      valLabel.textContent = v.toFixed(3);
    };

    text.appendChild(valLabel);
    container.appendChild(text);
    container.appendChild(slider);
    panel.appendChild(container);
  }

  // Create sliders for all tuning variables
  addSlider("Smoothing Alpha", "SMOOTHING_ALPHA", 0.01, 0.5, 0.01);
  addSlider("Nose Smooth Alpha", "NOSE_SMOOTH_ALPHA", 0.01, 0.5, 0.01);
  addSlider("Cursor Alpha", "CURSOR_ALPHA", 0.01, 0.5, 0.01);
  addSlider("Sensitivity X", "SENSITIVITY_X", 0.1, 5, 0.1);
  addSlider("Sensitivity Y", "SENSITIVITY_Y", 0.1, 5, 0.1);
  addSlider("Virtual Scale", "VIRTUAL_SCALE", 1, 30, 1);
  addSlider("Clamp Threshold", "CLAMP_THRESHOLD", 0.1, 10, 0.1);
  addSlider("Clamp Ease", "CLAMP_EASE", 0.01, 1, 0.01);
  addSlider("Vertical Fine Tune", "VERTICAL_FINE_TUNE", -100, 100, 1);
  addSlider("Horizontal Fine Tune", "HORIZONTAL_FINE_TUNE", -100, 100, 1);

  // Add Reset button
  const resetButton = document.createElement("button");
  resetButton.textContent = "🔄 Reset to Default";
  resetButton.style.marginTop = "10px";
  resetButton.style.width = "100%";
  resetButton.style.padding = "6px";
  resetButton.style.border = "none";
  resetButton.style.borderRadius = "6px";
  resetButton.style.cursor = "pointer";
  resetButton.style.background = "#00ffff";
  resetButton.style.color = "#000";
  resetButton.style.fontWeight = "bold";
  resetButton.onmouseenter = () => (resetButton.style.opacity = "0.8");
  resetButton.onmouseleave = () => (resetButton.style.opacity = "1.0");

  resetButton.onclick = () => {
    for (const [key, val] of Object.entries(defaults)) {
      window[key] = val;
    }
    panel.querySelectorAll("input[type=range]").forEach(input => {
      const key = Object.keys(defaults).find(k => k === input.parentElement.textContent.split(":")[0].trim().replace(/ /g, "_").toUpperCase());
      if (key) input.value = defaults[key];
      const label = input.parentElement.querySelector("span");
      if (label) label.textContent = defaults[key];
    });
  };

  panel.appendChild(resetButton);

  console.log("✅ Controls initialized");
})();
