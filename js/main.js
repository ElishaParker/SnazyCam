+import {
+  FaceLandmarker,
+  FilesetResolver,
+} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6";
+
+const ROLLING_BUFFER_FRAMES = 60;
+const BUFFER_DURATION_SECONDS = (ROLLING_BUFFER_FRAMES / 30).toFixed(1);
+
+const videoEl = document.getElementById("cameraFeed");
+const canvasEl = document.getElementById("landmarkOverlay");
+const ctx = canvasEl.getContext("2d");
+const hudLatest = document.getElementById("hudLatest");
+const hudHistory = document.getElementById("hudHistory");
+const toggleButton = document.getElementById("toggleTracking");
+const errorBanner = document.getElementById("errorBanner");
+const stage = document.getElementById("stage");
+
+let mediaStream = null;
+let landmarker = null;
+let animationFrameId = null;
+let trackingPaused = false;
+
+const buffer = new Array(ROLLING_BUFFER_FRAMES);
+let bufferSize = 0;
+let bufferIndex = 0;
+
+let fpsAccumulator = 0;
+let fpsFrameCount = 0;
+let fpsValue = 0;
+let lastFpsTimestamp = performance.now();
+
+async function init() {
+  renderHudSkeleton();
+  try {
+    await startCamera();
+    await initLandmarker();
+    startRenderLoop();
+  } catch (error) {
+    console.error("Failed to initialize", error);
+    showError(
+      "Unable to start webcam face tracking. Please check camera permissions and reload."
+    );
+  }
+}
+
+function renderHudSkeleton() {
+  hudLatest.innerHTML = `
+    <h2>Latest Landmark Snapshot</h2>
+    <p>Waiting for camera…</p>
+  `;
+  hudHistory.innerHTML = `
+    <h2>Rolling Buffer</h2>
+    <p>Buffer size: 0 / ${ROLLING_BUFFER_FRAMES} frames (~${BUFFER_DURATION_SECONDS}s)</p>
+  `;
+}
+
+async function startCamera() {
+  if (!navigator.mediaDevices?.getUserMedia) {
+    throw new Error("getUserMedia not supported");
+  }
+
+  mediaStream = await navigator.mediaDevices.getUserMedia({
+    video: {
+      facingMode: "user",
+      width: { ideal: 1280 },
+      height: { ideal: 720 },
+    },
+    audio: false,
+  });
+
+  videoEl.srcObject = mediaStream;
+  await videoEl.play();
+  await waitForVideoReady();
+  syncCanvasToStage();
+  window.addEventListener("resize", syncCanvasToStage);
+}
+
+function waitForVideoReady() {
+  return new Promise((resolve) => {
+    if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
+      resolve();
+      return;
+    }
+    const onLoaded = () => {
+      videoEl.removeEventListener("loadeddata", onLoaded);
+      resolve();
+    };
+    videoEl.addEventListener("loadeddata", onLoaded);
+  });
+}
+
+function syncCanvasToStage() {
+  const rect = stage.getBoundingClientRect();
+  canvasEl.width = rect.width;
+  canvasEl.height = rect.height;
+}
+
+async function initLandmarker() {
+  const filesetResolver = await FilesetResolver.forVisionTasks(
+    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm"
+  );
+
+  landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
+    baseOptions: {
+      modelAssetPath:
+        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm/face_landmarker.task",
+    },
+    runningMode: "VIDEO",
+    numFaces: 1,
+    outputFaceBlendshapes: false,
+    outputFacialTransformationMatrixes: false,
+  });
+}
+
+function startRenderLoop() {
+  toggleButton.addEventListener("click", () => {
+    trackingPaused = !trackingPaused;
+    toggleButton.textContent = trackingPaused
+      ? "Resume Tracking"
+      : "Pause Tracking";
+    if (!trackingPaused) {
+      lastFpsTimestamp = performance.now();
+      fpsFrameCount = 0;
+      fpsAccumulator = 0;
+    }
+  });
+
+  const loop = () => {
+    animationFrameId = requestAnimationFrame(loop);
+    if (!landmarker) {
+      return;
+    }
+
+    if (trackingPaused) {
+      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
+      updateLatestHud(null, fpsValue, { paused: true });
+      return;
+    }
+
+    if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
+      return;
+    }
+
+    const now = performance.now();
+    const result = landmarker.detectForVideo(videoEl, now);
+
+    accumulateFps(now);
+    drawLandmarks(result);
+    const sample = buildSample(result);
+    pushSample(sample);
+    updateLatestHud(sample, fpsValue, { paused: false });
+    updateHistoryHud();
+  };
+
+  loop();
+}
+
+function accumulateFps(now) {
+  const delta = now - lastFpsTimestamp;
+  fpsFrameCount += 1;
+  fpsAccumulator += delta;
+  if (fpsAccumulator >= 1000) {
+    fpsValue = Math.round((fpsFrameCount / fpsAccumulator) * 1000);
+    fpsAccumulator = 0;
+    fpsFrameCount = 0;
+  }
+  lastFpsTimestamp = now;
+}
+
+function drawLandmarks(result) {
+  ctx.save();
+  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
+  ctx.translate(canvasEl.width, 0);
+  ctx.scale(-1, 1);
+
+  if (!result?.faceLandmarks?.length) {
+    ctx.restore();
+    return;
+  }
+
+  const landmarks = result.faceLandmarks[0];
+  ctx.strokeStyle = "rgba(90, 200, 255, 0.8)";
+  ctx.fillStyle = "rgba(90, 200, 255, 0.9)";
+  ctx.lineWidth = 2;
+
+  for (const point of landmarks) {
+    const x = point.x * canvasEl.width;
+    const y = point.y * canvasEl.height;
+    ctx.beginPath();
+    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
+    ctx.fill();
+  }
+
+  ctx.restore();
+}
+
+function buildSample(result) {
+  if (!result?.faceLandmarks?.length) {
+    return null;
+  }
+
+  const [firstFace] = result.faceLandmarks;
+  const landmarkSummary = firstFace.slice(0, 5).map((lm, index) => ({
+    id: index,
+    x: Number(lm.x.toFixed(4)),
+    y: Number(lm.y.toFixed(4)),
+    z: Number(lm.z.toFixed(4)),
+  }));
+
+  return {
+    ts: Date.now(),
+    fps: fpsValue,
+    landmarkCount: firstFace.length,
+    sample: landmarkSummary,
+    allLandmarks: firstFace.map((lm) => ({
+      x: Number(lm.x.toFixed(4)),
+      y: Number(lm.y.toFixed(4)),
+      z: Number(lm.z.toFixed(4)),
+    })),
+  };
+}
+
+function pushSample(sample) {
+  if (!sample) {
+    return;
+  }
+
+  buffer[bufferIndex] = sample;
+  bufferIndex = (bufferIndex + 1) % ROLLING_BUFFER_FRAMES;
+  if (bufferSize < ROLLING_BUFFER_FRAMES) {
+    bufferSize += 1;
+  }
+}
+
+function getSamples() {
+  const samples = [];
+  for (let i = 0; i < bufferSize; i += 1) {
+    const index = (bufferIndex - bufferSize + i + ROLLING_BUFFER_FRAMES) %
+      ROLLING_BUFFER_FRAMES;
+    samples.push(buffer[index]);
+  }
+  return samples;
+}
+
+function updateLatestHud(sample, fps, { paused }) {
+  if (paused) {
+    hudLatest.innerHTML = `
+      <h2>Latest Landmark Snapshot</h2>
+      <p>Tracking paused. Resume to continue processing frames.</p>
+    `;
+    return;
+  }
+
+  if (!sample) {
+    hudLatest.innerHTML = `
+      <h2>Latest Landmark Snapshot</h2>
+      <p>No face detected yet. Ensure lighting is sufficient.</p>
+    `;
+    return;
+  }
+
+  const timestamp = new Date(sample.ts).toLocaleTimeString();
+  const summary = sample.sample
+    .map((item) => `#${item.id}: (${item.x}, ${item.y}, ${item.z})`)
+    .join("\n");
+
+  hudLatest.innerHTML = `
+    <h2>Latest Landmark Snapshot</h2>
+    <p><strong>Timestamp:</strong> ${timestamp}</p>
+    <p><strong>FPS:</strong> ${fps || "—"}</p>
+    <p><strong>Landmarks:</strong> ${sample.landmarkCount}</p>
+    <pre>${summary}</pre>
+  `;
+}
+
+function updateHistoryHud() {
+  const samples = getSamples();
+  const newest = samples[samples.length - 1];
+  const oldest = samples[0];
+
+  let historyBody = `<p>Buffer size: ${samples.length} / ${ROLLING_BUFFER_FRAMES} frames (~${BUFFER_DURATION_SECONDS}s)</p>`;
+
+  if (samples.length) {
+    historyBody += `<p><strong>Newest:</strong> ${new Date(newest.ts).toLocaleTimeString()}</p>`;
+    historyBody += `<p><strong>Oldest:</strong> ${new Date(oldest.ts).toLocaleTimeString()}</p>`;
+    historyBody += "<p><strong>Preview (last 3 frames):</strong></p>";
+    const preview = samples.slice(-3).map((s) => formatPreviewLine(s)).join("\n");
+    historyBody += `<pre>${preview}</pre>`;
+  } else {
+    historyBody += "<p>No frames captured yet.</p>";
+  }
+
+  hudHistory.innerHTML = `
+    <h2>Rolling Buffer</h2>
+    ${historyBody}
+  `;
+}
+
+function formatPreviewLine(sample) {
+  const { ts, sample: summary } = sample;
+  const coords = summary
+    .map((item) => `#${item.id}: (${item.x}, ${item.y})`)
+    .join("; ");
+  return `${new Date(ts).toLocaleTimeString()} | ${coords}`;
+}
+
+function showError(message) {
+  errorBanner.textContent = message;
+  errorBanner.hidden = false;
+}
+
+window.addEventListener("beforeunload", () => {
+  if (animationFrameId) {
+    cancelAnimationFrame(animationFrameId);
+  }
+  if (mediaStream) {
+    mediaStream.getTracks().forEach((track) => track.stop());
+  }
+});
+
+init();
 
EOF
)
