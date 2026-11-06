"""從雙腳輪廓圖拆左右，輸出高解析、抗鋸齒的半透明 PNG。"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

src = Path(
    r"C:\Users\admin\.cursor\projects\c-Users-admin-code\assets"
    r"\c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"b6d75cf34ea727182b1e787083c6593f_images_image-3717d6b9-6d7f-4bb0-b560-ceae14903e5c.png"
)
out_dir = Path(__file__).resolve().parents[1] / "img"
out_dir.mkdir(parents=True, exist_ok=True)

bgr = cv2.imread(str(src))
if bgr is None:
    raise SystemExit(f"cannot read {src}")
gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
ink = (gray < 200).astype(np.uint8) * 255
cnts, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

parts = []
for c in cnts:
    if cv2.contourArea(c) < 100:
        continue
    moments = cv2.moments(c)
    cx = moments["m10"] / moments["m00"] if moments["m00"] else 0
    parts.append((cx, c))
parts.sort(key=lambda t: t[0])
if len(parts) < 2:
    raise SystemExit(f"expected 2 feet, got {len(parts)}")

# 輸出目標高度（螢幕上較平滑）
OUT_H = 1200
PAD = 40


def render_soft(contour, out_path: Path) -> None:
    x, y, w, h = cv2.boundingRect(contour)
    # 先在放大畫布上畫，再縮回，得到抗鋸齒邊緣
    scale = 4
    canvas_h = (h + PAD * 2) * scale
    canvas_w = (w + PAD * 2) * scale
    canvas = np.zeros((canvas_h, canvas_w), dtype=np.uint8)
    shifted = contour.copy()
    shifted[:, 0, 0] = (contour[:, 0, 0] - x + PAD) * scale
    shifted[:, 0, 1] = (contour[:, 0, 1] - y + PAD) * scale
    cv2.drawContours(canvas, [shifted], -1, 255, thickness=-1)
    # 輕微模糊再二值，柔化鋸齒
    blur = cv2.GaussianBlur(canvas, (0, 0), sigmaX=1.2 * scale)
    # 縮到目標高度
    target_h = OUT_H
    target_w = max(1, int(round(canvas_w * (target_h / canvas_h))))
    alpha = cv2.resize(blur, (target_w, target_h), interpolation=cv2.INTER_AREA)

    rgba = np.zeros((target_h, target_w, 4), dtype=np.uint8)
    # 填色：柔和青綠色，半透明
    fill_a = np.clip(alpha.astype(np.float32) * (0.28 * 255 / 255.0), 0, 255).astype(np.uint8)
    rgba[..., 0] = 94   # R
    rgba[..., 1] = 234  # G
    rgba[..., 2] = 212  # B  teal
    rgba[..., 3] = fill_a

    # 外輪廓描邊（較不刺眼的薄荷色）
    binary = (alpha > 40).astype(np.uint8) * 255
    edges = cv2.Canny(binary, 40, 120)
    edges = cv2.GaussianBlur(edges, (3, 3), 0)
    stroke = edges.astype(np.float32) / 255.0
    for c in range(3):
        rgba[..., c] = np.clip(
            rgba[..., c] * (1 - stroke * 0.85) + np.array([45, 212, 191])[c] * stroke,
            0,
            255,
        ).astype(np.uint8)
    rgba[..., 3] = np.clip(rgba[..., 3].astype(np.float32) + stroke * 200, 0, 255).astype(np.uint8)

    Image.fromarray(rgba, "RGBA").save(out_path, optimize=True)
    print("wrote", out_path, rgba.shape)


render_soft(parts[0][1], out_dir / "guide-foot-left.png")
render_soft(parts[1][1], out_dir / "guide-foot-right.png")
