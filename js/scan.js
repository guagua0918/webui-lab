// scan.html 互動：選圖 → 點四點 → 算 CSI
// 流程：Event → Function → DOM Change → UI

const FLAT_THRESHOLD = 62.7;
const STEPS = [
  "第 1 點（綠）：點蹠骨頭最寬處的一端",
  "第 2 點（綠）：點蹠骨頭最寬處的另一端",
  "第 3 點（紅）：點足弓最窄處的一端",
  "第 4 點（紅）：點足弓最窄處的另一端",
  "四點已完成。可撤銷或重新標記。"
];

const picker = document.getElementById("picker");
const changeBtn = document.getElementById("change-photo");
const input = document.getElementById("photo-input");
const stepEl = document.getElementById("step");
const stage = document.getElementById("stage");
const photo = document.getElementById("photo");
const overlay = document.getElementById("overlay");
const undoBtn = document.getElementById("undo");
const resetBtn = document.getElementById("reset");
const resultCard = document.getElementById("result");
const resultToggle = document.getElementById("result-toggle");
const resultHintLabel = document.getElementById("result-hint-label");
const resultDetail = document.getElementById("result-detail");
const outB = document.getElementById("out-b");
const outC = document.getElementById("out-c");
const outCsi = document.getElementById("out-csi");
const outGrade = document.getElementById("out-grade");
const outNote = document.getElementById("out-note");

const points = [];
let objectUrl = "";

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function syncControls() {
  const hasPhoto = Boolean(photo.getAttribute("src"));
  undoBtn.disabled = points.length === 0;
  resetBtn.disabled = !hasPhoto && points.length === 0;
  picker.hidden = hasPhoto;
  changeBtn.hidden = !hasPhoto;
  stepEl.textContent = hasPhoto
    ? STEPS[Math.min(points.length, STEPS.length - 1)]
    : "請先選擇一張足印照片。";
}

function collapseResultDetail() {
  resultDetail.hidden = true;
  resultCard.classList.remove("is-expanded");
  resultToggle.setAttribute("aria-expanded", "false");
  resultHintLabel.textContent = "點這裡查看 b／c／CSI 與判定";
}

function toggleResultDetail() {
  const open = resultDetail.hidden;
  resultDetail.hidden = !open;
  resultCard.classList.toggle("is-expanded", open);
  resultToggle.setAttribute("aria-expanded", open ? "true" : "false");
  resultHintLabel.textContent = open
    ? "點這裡收合評估資訊"
    : "點這裡查看 b／c／CSI 與判定";
}

function hideResult() {
  collapseResultDetail();
  resultCard.hidden = true;
}

function showResult() {
  const widthB = dist(points[0], points[1]);
  const widthC = dist(points[2], points[3]);
  if (widthB < 1) {
    stepEl.textContent = "前足兩點太近，請撤銷後重點。";
    hideResult();
    return;
  }
  const csi = (widthC / widthB) * 100;
  const isFlat = csi > FLAT_THRESHOLD;
  outB.textContent = widthB.toFixed(1) + " px";
  outC.textContent = widthC.toFixed(1) + " px";
  outCsi.textContent = csi.toFixed(1) + "%";
  outGrade.textContent = isFlat ? "扁平足" : "未達扁平足門檻";
  outNote.textContent = isFlat
    ? "CSI 大於 62.7%，依此次標記判為扁平足。僅供居家參考。"
    : "CSI 未大於 62.7%，依此次標記未判為扁平足。僅供居家參考。";
  collapseResultDetail();
  resultCard.hidden = false;
  stepEl.textContent = "四點完成。請點下方綠色區塊查看評估。";
}

function render() {
  const w = photo.naturalWidth || 1;
  const h = photo.naturalHeight || 1;
  overlay.setAttribute("viewBox", "0 0 " + w + " " + h);
  overlay.innerHTML = "";

  function line(a, b, color) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", a.x);
    el.setAttribute("y1", a.y);
    el.setAttribute("x2", b.x);
    el.setAttribute("y2", b.y);
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", Math.max(w, h) / 180);
    el.setAttribute("stroke-linecap", "round");
    overlay.appendChild(el);
  }

  if (points.length >= 2) line(points[0], points[1], "#1f8f3a");
  if (points.length >= 4) line(points[2], points[3], "#d21f1f");

  points.forEach(function (p, i) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", Math.max(w, h) / 90);
    circle.setAttribute("fill", i < 2 ? "#1f8f3a" : "#d21f1f");
    circle.setAttribute("stroke", "#fff");
    circle.setAttribute("stroke-width", Math.max(w, h) / 280);
    overlay.appendChild(circle);
  });

  syncControls();
  if (points.length === 4) showResult();
  else hideResult();
}

input.addEventListener("change", function () {
  const file = input.files && input.files[0];
  if (!file) return;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  points.length = 0;
  hideResult();
  photo.onload = function () {
    stage.hidden = false;
    render();
  };
  photo.src = objectUrl;
});

overlay.addEventListener("click", function (event) {
  if (!photo.naturalWidth || points.length >= 4) return;
  const rect = overlay.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * photo.naturalWidth;
  const y = ((event.clientY - rect.top) / rect.height) * photo.naturalHeight;
  points.push({ x: x, y: y });
  render();
});

undoBtn.addEventListener("click", function () {
  if (!points.length) return;
  points.pop();
  render();
});

resetBtn.addEventListener("click", function () {
  points.length = 0;
  render();
});

changeBtn.addEventListener("click", function () {
  input.click();
});

resultToggle.addEventListener("click", function () {
  toggleResultDetail();
});

syncControls();
