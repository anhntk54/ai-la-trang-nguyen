// Tách nền trắng ảnh MC -> public/assets/nv/mc/<tên>.webp nền trong suốt.
// Chạy lại khi thay ảnh trong public/assets/MC:  node tools/tach-nen.mjs
// Nền = vùng gần trắng NỐI với mép ảnh (râu trắng nằm trong người nên không bị ăn).
// Giữ mảng lớn nhất (bỏ pháo giấy rời rạc). Mọi tư thế cùng chiều cao để đổi tư thế không nhảy.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'public/assets/MC');
const OUT = path.join(ROOT, 'public/assets/nv/mc');
const OUT_H = 760;
const TOL = 22; // lệch tối đa so với màu nền
// Tên file gốc (đoạn đầu) -> tên tư thế
const POSES = [
  ['Elderly_teacher_celebrating', 'mung'],
  ['Elderly_teacher_holding', 'suy-nghi'],
  ['Teacher_holding_microphone_on_stage', 'chi'],
  ['Teacher_holding_microphone_smiling', 'cuoi'],
  ['Teacher_showing_regret', 'tiec'],
];

fs.mkdirSync(OUT, { recursive: true });
for (const file of fs.readdirSync(SRC)) {
  const pose = POSES.find(([p]) => file.startsWith(p))?.[1];
  if (!pose) continue;
  const { data, info } = await sharp(path.join(SRC, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  // màu nền = trung vị viền
  const border = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  const bg = [0, 1, 2].map((c) => border.map((i) => px(i)[c]).sort((a, b) => a - b)[border.length >> 1]);
  const diff = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = px(i);
    diff[i] = Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2]));
    // bóng xám dưới chân (15% dưới cùng): xám nhạt, không màu -> coi là nền
    const sat = Math.max(...p) - Math.min(...p);
    if (i >= W * H * 0.85 && sat < 14 && Math.min(...p) > 150) diff[i] = 0;
  }
  // loang từ mép
  const isBg = new Uint8Array(W * H);
  const stack = border.filter((i) => diff[i] <= TOL);
  stack.forEach((i) => (isBg[i] = 1));
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    for (const j of [i - W, i + W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1]) {
      if (j >= 0 && j < W * H && !isBg[j] && diff[j] <= TOL) {
        isBg[j] = 1;
        stack.push(j);
      }
    }
  }
  // giữ mảng người lớn nhất
  const comp = new Int32Array(W * H).fill(-1);
  let best = -1;
  let bestSize = 0;
  for (let s = 0, id = 0; s < W * H; s++) {
    if (isBg[s] || comp[s] >= 0) continue;
    let size = 0;
    const st = [s];
    comp[s] = id;
    while (st.length) {
      const i = st.pop();
      size++;
      const x = i % W;
      for (const j of [i - W, i + W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1]) {
        if (j >= 0 && j < W * H && !isBg[j] && comp[j] < 0) {
          comp[j] = id;
          st.push(j);
        }
      }
    }
    if (size > bestSize) [best, bestSize] = [id, size];
    id++;
  }
  const rgba = Buffer.alloc(W * H * 4);
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let i = 0; i < W * H; i++) {
    const keep = comp[i] === best;
    const p = px(i);
    // viền mềm: điểm sát nền mà gần màu nền thì trong một phần
    const a = !keep ? 0 : diff[i] < TOL * 2.5 ? Math.round(255 * Math.min(1, Math.max(0.35, (diff[i] - TOL) / (TOL * 1.5)))) : 255;
    rgba.set([p[0], p[1], p[2], a], i * 4);
    if (keep) {
      const x = i % W, y = (i / W) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const out = path.join(OUT, `${pose}.webp`);
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize({ height: OUT_H })
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile(out);
  console.log(pose, '->', path.relative(ROOT, out), `${maxX - minX + 1}x${maxY - minY + 1}`);
}
