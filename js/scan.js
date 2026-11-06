// 掃描流程：選腳 → 拍照粗調 → 上傳 → 輪詢 CV → 確定／修改 → 另一腳
const FLAT_THRESHOLD = 62.7;
const CANVAS_W = 1080;
const CANVAS_H = 1440;
const POLL_MS = 1500;
const STEPS = [
  "第 1 點（綠）：蹠骨頭最寬處的一端",
  "第 2 點（綠）：蹠骨頭最寬處的另一端",
  "第 3 點（紅）：足弓最窄處的一端",
  "第 4 點（紅）：足弓最窄處的另一端",
  "四點完成，可存檔。",
];

const panelSide = document.getElementById("panel-side");
const panelCapture = document.getElementById("panel-capture");
const panelWait = document.getElementById("panel-wait");
const panelReview = document.getElementById("panel-review");
const panelDone = document.getElementById("panel-done");
const captureTitle = document.getElementById("capture-title");
const stepEl = document.getElementById("step");
const waitText = document.getElementById("wait-text");
const reviewStep = document.getElementById("review-step");
const stagePrep = document.getElementById("stage-prep");
const prepCanvas = document.getElementById("prep-canvas");
const footGuideImg = document.getElementById("foot-guide-img");
const prepTools = document.getElementById("prep-tools");
const rotFreeWrap = document.getElementById("rot-free-wrap");
const rotFree = document.getElementById("rot-free");
const rotFreeLabel = document.getElementById("rot-free-label");
const zoomWrap = document.getElementById("zoom-wrap");
const zoomRange = document.getElementById("zoom-range");
const zoomLabel = document.getElementById("zoom-label");
const btnUpload = document.getElementById("btn-upload");
const btnRecenter = document.getElementById("btn-recenter");
const photo = document.getElementById("photo");
const overlay = document.getElementById("overlay");
const outB = document.getElementById("out-b");
const outC = document.getElementById("out-c");
const outCsi = document.getElementById("out-csi");
const outGrade = document.getElementById("out-grade");
const reviewActions = document.getElementById("review-actions");
const modifyActions = document.getElementById("modify-actions");
const btnConfirm = document.getElementById("btn-confirm");
const btnModify = document.getElementById("btn-modify");
const undoBtn = document.getElementById("undo");
const resetBtn = document.getElementById("reset");
const btnSavePoints = document.getElementById("btn-save-points");
const doneText = document.getElementById("done-text");
const btnNextFoot = document.getElementById("btn-next-foot");
const btnFinish = document.getElementById("btn-finish");

const state = {
  sessionId: null,
  footSide: null,
  fid: null,
  footprint: null,
  sourceImage: null,
  quarterTurns: 0,
  freeDeg: 0,
  points: [],
  modifyMode: false,
  pollTimer: null,
  doneSides: { left: false, right: false },
  dragIndex: -1,
  canDrag: false,
  panX: 0,
  panY: 0,
  zoom: 1,
  panDragging: false,
  panLastX: 0,
  panLastY: 0,
  pinchStartDist: 0,
  pinchStartZoom: 1,
};

function setPrepControlsVisible(on) {
  stagePrep.hidden = !on;
  prepTools.hidden = !on;
  rotFreeWrap.hidden = !on;
  zoomWrap.hidden = !on;
  btnUpload.hidden = !on;
  if (!on) btnUpload.disabled = true;
}

function setZoom(value) {
  const z = Math.min(2.5, Math.max(0.5, value));
  state.zoom = z;
  zoomRange.value = String(Math.round(z * 100));
  zoomLabel.textContent = Math.round(z * 100) + "%";
  drawLetterbox();
}

function guideSrc(side) {
  return side === "right" ? "img/guide-foot-right.png" : "img/guide-foot-left.png";
}

function setGuideSide(side) {
  footGuideImg.src = guideSrc(side);
}

function show(panel) {
  [panelSide, panelCapture, panelWait, panelReview, panelDone].forEach(function (el) {
    el.hidden = el !== panel;
  });
}

function distNorm(a, b, w, h) {
  return Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
}

function updateMetrics(points, w, h) {
  if (!points || points.length < 4) {
    outB.textContent = "—";
    outC.textContent = "—";
    outCsi.textContent = "—";
    outGrade.textContent = "—";
    return;
  }
  const widthB = distNorm(points[0], points[1], w, h);
  const widthC = distNorm(points[2], points[3], w, h);
  if (widthB < 1) {
    outGrade.textContent = "前足兩點太近";
    return;
  }
  const csi = (widthC / widthB) * 100;
  outB.textContent = widthB.toFixed(1) + " px";
  outC.textContent = widthC.toFixed(1) + " px";
  outCsi.textContent = csi.toFixed(1) + "%";
  outGrade.textContent = csi > FLAT_THRESHOLD ? "扁平足" : "未達扁平足門檻";
}

function pointsFromCv(cv) {
  if (!cv) return [];
  return [
    { x: cv.a_x, y: cv.a_y },
    { x: cv.b_x, y: cv.b_y },
    { x: cv.c_x, y: cv.c_y },
    { x: cv.d_x, y: cv.d_y },
  ];
}

function renderOverlay() {
  const fp = state.footprint;
  const w = (fp && fp.canvas_width) || 1;
  const h = (fp && fp.canvas_height) || 1;
  overlay.setAttribute("viewBox", "0 0 " + w + " " + h);
  overlay.innerHTML = "";
  const pts = state.points;
  state.canDrag = pts.length === 4 && !state.modifyMode;

  function line(a, b, color) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", a.x * w);
    el.setAttribute("y1", a.y * h);
    el.setAttribute("x2", b.x * w);
    el.setAttribute("y2", b.y * h);
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", Math.max(w, h) / 180);
    el.setAttribute("stroke-linecap", "round");
    overlay.appendChild(el);
  }

  if (pts.length >= 2) line(pts[0], pts[1], "#1f8f3a");
  if (pts.length >= 4) line(pts[2], pts[3], "#d21f1f");

  const labels = ["a", "b", "c", "d"];
  pts.forEach(function (p, i) {
    const cx = p.x * w;
    const cy = p.y * h;
    const r = Math.max(w, h) / 70;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", i < 2 ? "#1f8f3a" : "#d21f1f");
    circle.setAttribute("stroke", "#fff");
    circle.setAttribute("stroke-width", Math.max(w, h) / 280);
    circle.dataset.index = String(i);
    if (state.canDrag || (state.modifyMode && pts.length === 4)) {
      circle.style.cursor = "grab";
      circle.style.touchAction = "none";
    }
    overlay.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.textContent = labels[i] || String(i + 1);
    label.setAttribute("x", cx);
    label.setAttribute("y", cy);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "central");
    label.setAttribute("fill", "#fff");
    label.setAttribute("font-size", String(Math.max(12, r * 1.1)));
    label.setAttribute("font-weight", "700");
    label.setAttribute("font-family", "Sora, sans-serif");
    label.style.pointerEvents = "none";
    overlay.appendChild(label);
  });

  updateMetrics(pts, w, h);
  undoBtn.disabled = !state.modifyMode || pts.length === 0;
  resetBtn.disabled = !state.modifyMode;
  btnSavePoints.disabled = !state.modifyMode || pts.length !== 4;
  if (state.modifyMode) {
    reviewStep.textContent = STEPS[Math.min(pts.length, STEPS.length - 1)];
  } else if (state.canDrag) {
    reviewStep.textContent = "拖曳微調，或按修改重點。";
  }
}

function eventToNorm(event) {
  const rect = overlay.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  };
}

function drawLetterbox() {
  const ctx = prepCanvas.getContext("2d");
  // 深灰底，避免白底刺眼；剪影另外疊在上面
  ctx.fillStyle = "#12151a";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  if (!state.sourceImage) return;

  const img = state.sourceImage;
  const turns = ((state.quarterTurns % 4) + 4) % 4;
  const rad = (state.freeDeg * Math.PI) / 180;
  const sw = turns % 2 === 0 ? img.naturalWidth : img.naturalHeight;
  const sh = turns % 2 === 0 ? img.naturalHeight : img.naturalWidth;

  const off = document.createElement("canvas");
  off.width = sw;
  off.height = sh;
  const octx = off.getContext("2d");
  octx.translate(sw / 2, sh / 2);
  octx.rotate((turns * Math.PI) / 2 + rad);
  octx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const scale = Math.min(CANVAS_W / sw, CANVAS_H / sh) * state.zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (CANVAS_W - dw) / 2 + state.panX;
  const dy = (CANVAS_H - dh) / 2 + state.panY;
  ctx.drawImage(off, dx, dy, dw, dh);
}

function loadFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = function () {
    state.sourceImage = img;
    state.quarterTurns = 0;
    state.freeDeg = 0;
    state.panX = 0;
    state.panY = 0;
    state.zoom = 1;
    rotFree.value = "0";
    rotFreeLabel.textContent = "0°";
    setPrepControlsVisible(true);
    btnUpload.disabled = false;
    setZoom(1);
    stepEl.textContent = "拖曳／縮放對齊剪影後上傳。";
    URL.revokeObjectURL(url);
  };
  img.onerror = function () {
    stepEl.textContent = "圖片讀取失敗，請另選一張。";
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

async function api(path, options) {
  const response = await fetch(path, Object.assign({ credentials: "same-origin" }, options || {}));
  if (response.status === 401) {
    throw new Error("請先登入");
  }
  if (!response.ok) {
    let detail = "HTTP " + response.status;
    try {
      const body = await response.json();
      if (body.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch (e) { /* ignore */ }
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function ensureSession() {
  if (state.sessionId) return state.sessionId;
  const session = await api("api/scan/sessions", { method: "POST" });
  state.sessionId = session.id;
  return state.sessionId;
}

function stopPoll() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

async function pollFootprint() {
  const fp = await api("api/scan/footprints/" + state.fid);
  state.footprint = fp;
  waitText.textContent = fp.status_message || "分析中…";
  if (fp.processing_status === "cv_keypoints_done" || fp.processing_status === "cv_failed") {
    stopPoll();
    enterReview(fp);
  }
}

function enterReview(fp) {
  show(panelReview);
  state.modifyMode = false;
  reviewActions.hidden = false;
  modifyActions.hidden = true;
  btnConfirm.disabled = !fp.is_cv_available;
  state.points = pointsFromCv(fp.cv);
  photo.onload = function () {
    renderOverlay();
  };
  photo.src = fp.preview_url + "?t=" + Date.now();
  if (fp.is_cv_available) {
    reviewStep.textContent = "拖曳微調，或按修改重點。";
  } else {
    reviewStep.textContent = "請按修改，自行標記四點。";
  }
  renderOverlay();
}

async function startCapture(side) {
  state.footSide = side;
  captureTitle.textContent = (side === "left" ? "左腳" : "右腳") + "：拍攝／選圖";
  state.sourceImage = null;
  state.panX = 0;
  state.panY = 0;
  state.zoom = 1;
  setGuideSide(side);
  setPrepControlsVisible(false);
  stepEl.textContent = "請拍照或從相簿選取。";
  show(panelCapture);
  await ensureSession();
}

document.getElementById("btn-left").addEventListener("click", function () {
  startCapture("left").catch(function (err) {
    stepEl.textContent = err.message;
  });
});
document.getElementById("btn-right").addEventListener("click", function () {
  startCapture("right").catch(function (err) {
    stepEl.textContent = err.message;
  });
});

document.getElementById("photo-camera").addEventListener("change", function (e) {
  loadFile(e.target.files && e.target.files[0]);
});
document.getElementById("photo-gallery").addEventListener("change", function (e) {
  loadFile(e.target.files && e.target.files[0]);
});

document.getElementById("rot-left").addEventListener("click", function () {
  state.quarterTurns -= 1;
  drawLetterbox();
});
document.getElementById("rot-right").addEventListener("click", function () {
  state.quarterTurns += 1;
  drawLetterbox();
});
rotFree.addEventListener("input", function () {
  state.freeDeg = Number(rotFree.value);
  rotFreeLabel.textContent = state.freeDeg + "°";
  drawLetterbox();
});
btnRecenter.addEventListener("click", function () {
  state.panX = 0;
  state.panY = 0;
  setZoom(1);
});
document.getElementById("zoom-in").addEventListener("click", function () {
  setZoom(state.zoom + 0.1);
});
document.getElementById("zoom-out").addEventListener("click", function () {
  setZoom(state.zoom - 0.1);
});
zoomRange.addEventListener("input", function () {
  setZoom(Number(zoomRange.value) / 100);
});

function clientToCanvas(event) {
  const rect = prepCanvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function touchDistance(t0, t1) {
  return Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
}

stagePrep.addEventListener("pointerdown", function (event) {
  if (!state.sourceImage || stagePrep.hidden) return;
  state.panDragging = true;
  const p = clientToCanvas(event);
  state.panLastX = p.x;
  state.panLastY = p.y;
  stagePrep.classList.add("is-dragging");
  stagePrep.setPointerCapture(event.pointerId);
  event.preventDefault();
});
stagePrep.addEventListener("pointermove", function (event) {
  if (!state.panDragging) return;
  const p = clientToCanvas(event);
  state.panX += p.x - state.panLastX;
  state.panY += p.y - state.panLastY;
  state.panLastX = p.x;
  state.panLastY = p.y;
  drawLetterbox();
});
function endPan() {
  state.panDragging = false;
  stagePrep.classList.remove("is-dragging");
}
stagePrep.addEventListener("pointerup", endPan);
stagePrep.addEventListener("pointercancel", endPan);

stagePrep.addEventListener(
  "touchstart",
  function (event) {
    if (!state.sourceImage || event.touches.length !== 2) return;
    state.panDragging = false;
    state.pinchStartDist = touchDistance(event.touches[0], event.touches[1]);
    state.pinchStartZoom = state.zoom;
    event.preventDefault();
  },
  { passive: false }
);
stagePrep.addEventListener(
  "touchmove",
  function (event) {
    if (!state.sourceImage || event.touches.length !== 2 || !state.pinchStartDist) return;
    const dist = touchDistance(event.touches[0], event.touches[1]);
    setZoom(state.pinchStartZoom * (dist / state.pinchStartDist));
    event.preventDefault();
  },
  { passive: false }
);
stagePrep.addEventListener("touchend", function () {
  state.pinchStartDist = 0;
});
stagePrep.addEventListener(
  "wheel",
  function (event) {
    if (!state.sourceImage || stagePrep.hidden) return;
    event.preventDefault();
    setZoom(state.zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  },
  { passive: false }
);

btnUpload.addEventListener("click", async function () {
  if (!state.sourceImage) {
    stepEl.textContent = "請先選擇或拍攝足印照片，再上傳。";
    return;
  }
  try {
    btnUpload.disabled = true;
    await ensureSession();
    const blob = await new Promise(function (resolve) {
      prepCanvas.toBlob(resolve, "image/png");
    });
    if (!blob || blob.size < 2000) {
      throw new Error("畫布沒有有效照片，請重新選圖。");
    }
    const form = new FormData();
    form.append("file", blob, "input.png");
    show(panelWait);
    waitText.textContent = "上傳中…";
    const fp = await api(
      "api/scan/sessions/" + state.sessionId + "/feet/" + state.footSide,
      { method: "POST", body: form }
    );
    state.fid = fp.fid;
    state.footprint = fp;
    waitText.textContent = fp.status_message || "分析中…";
    stopPoll();
    state.pollTimer = setInterval(function () {
      pollFootprint().catch(function (err) {
        waitText.textContent = err.message;
        stopPoll();
      });
    }, POLL_MS);
    await pollFootprint();
  } catch (err) {
    show(panelCapture);
    stepEl.textContent = err.message;
    btnUpload.disabled = !state.sourceImage;
  }
});

btnConfirm.addEventListener("click", async function () {
  try {
    btnConfirm.disabled = true;
    // 若使用者拖過點，送目前四點；否則用空 body 採 CV 建議
    let body = "{}";
    if (state.points.length === 4) {
      const p = state.points;
      body = JSON.stringify({
        points: {
          a_x: p[0].x, a_y: p[0].y,
          b_x: p[1].x, b_y: p[1].y,
          c_x: p[2].x, c_y: p[2].y,
          d_x: p[3].x, d_y: p[3].y,
        },
      });
    }
    const fp = await api("api/scan/footprints/" + state.fid + "/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    });
    afterSaved(fp);
  } catch (err) {
    reviewStep.textContent = err.message;
    btnConfirm.disabled = false;
  }
});

btnModify.addEventListener("click", function () {
  state.modifyMode = true;
  state.points = [];
  state.dragIndex = -1;
  reviewActions.hidden = true;
  modifyActions.hidden = false;
  renderOverlay();
});

overlay.addEventListener("pointerdown", function (event) {
  const target = event.target;
  if (target && target.tagName === "circle" && target.dataset.index != null) {
    if (!(state.canDrag || (state.modifyMode && state.points.length === 4))) return;
    state.dragIndex = Number(target.dataset.index);
    overlay.setPointerCapture(event.pointerId);
    target.style.cursor = "grabbing";
    event.preventDefault();
    return;
  }
  if (!state.modifyMode || !state.footprint || state.points.length >= 4) return;
  const p = eventToNorm(event);
  state.points.push(p);
  renderOverlay();
});

overlay.addEventListener("pointermove", function (event) {
  if (state.dragIndex < 0 || !state.footprint) return;
  const p = eventToNorm(event);
  state.points[state.dragIndex] = p;
  const w = state.footprint.canvas_width;
  const h = state.footprint.canvas_height;
  const circle = overlay.querySelector('circle[data-index="' + state.dragIndex + '"]');
  if (circle) {
    circle.setAttribute("cx", p.x * w);
    circle.setAttribute("cy", p.y * h);
    const label = circle.nextElementSibling;
    if (label && label.tagName === "text") {
      label.setAttribute("x", p.x * w);
      label.setAttribute("y", p.y * h);
    }
  }
  const lines = overlay.querySelectorAll("line");
  const pts = state.points;
  if (lines[0] && pts.length >= 2) {
    lines[0].setAttribute("x1", pts[0].x * w);
    lines[0].setAttribute("y1", pts[0].y * h);
    lines[0].setAttribute("x2", pts[1].x * w);
    lines[0].setAttribute("y2", pts[1].y * h);
  }
  if (lines[1] && pts.length >= 4) {
    lines[1].setAttribute("x1", pts[2].x * w);
    lines[1].setAttribute("y1", pts[2].y * h);
    lines[1].setAttribute("x2", pts[3].x * w);
    lines[1].setAttribute("y2", pts[3].y * h);
  }
  updateMetrics(pts, w, h);
});

overlay.addEventListener("pointerup", function () {
  state.dragIndex = -1;
});
overlay.addEventListener("pointercancel", function () {
  state.dragIndex = -1;
});

undoBtn.addEventListener("click", function () {
  state.points.pop();
  renderOverlay();
});
resetBtn.addEventListener("click", function () {
  state.points = [];
  renderOverlay();
});

btnSavePoints.addEventListener("click", async function () {
  if (state.points.length !== 4) return;
  const p = state.points;
  try {
    btnSavePoints.disabled = true;
    const fp = await api("api/scan/footprints/" + state.fid + "/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: {
          a_x: p[0].x, a_y: p[0].y,
          b_x: p[1].x, b_y: p[1].y,
          c_x: p[2].x, c_y: p[2].y,
          d_x: p[3].x, d_y: p[3].y,
        },
      }),
    });
    afterSaved(fp);
  } catch (err) {
    reviewStep.textContent = err.message;
    btnSavePoints.disabled = false;
  }
});

function afterSaved(fp) {
  state.footprint = fp;
  state.doneSides[fp.foot_side] = true;
  show(panelDone);
  const grade = fp.is_flat ? "扁平足" : "未達扁平足門檻";
  doneText.textContent =
    (fp.foot_side === "left" ? "左腳" : "右腳") +
    " CSI " +
    (fp.csi_value != null ? fp.csi_value.toFixed(1) : "—") +
    "%（" +
    grade +
    "）。";
  const needOther = fp.foot_side === "left" ? "right" : "left";
  if (!state.doneSides[needOther]) {
    btnNextFoot.hidden = false;
    btnNextFoot.dataset.side = needOther;
    btnFinish.hidden = true;
  } else {
    btnNextFoot.hidden = true;
    btnFinish.hidden = false;
  }
}

btnNextFoot.addEventListener("click", function () {
  startCapture(btnNextFoot.dataset.side).catch(function (err) {
    doneText.textContent = err.message;
  });
});

btnFinish.addEventListener("click", async function () {
  try {
    await api("api/scan/sessions/" + state.sessionId + "/complete", { method: "POST" });
    doneText.textContent = "此次左右腳評估已完成。";
    btnFinish.hidden = true;
    btnNextFoot.hidden = true;
  } catch (err) {
    doneText.textContent = err.message;
  }
});

// 登入後才顯示選腳；nav.js 會在 401 時清掉 main，此腳本延遲啟動
async function boot() {
  try {
    const me = await fetch("api/auth/me", { credentials: "same-origin" });
    if (!me.ok) return;
    show(panelSide);
  } catch (e) {
    /* nav 會處理未登入 */
  }
}

boot();
