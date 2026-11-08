// Cắt nhân vật nền trắng trong public/assets/nhan-vat/ -> public/assets/nv/lang/<ten>.webp nền trong suốt.
// Một ảnh có nhiều người (tấm các cụ già) thì mỗi mảng lớn là 1 nhân vật.
// Chạy lại khi thay ảnh:  node tools/cat-nhan-vat.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'public/assets/nhan-vat');
const OUT = path.join(ROOT, 'public/assets/nv/lang');
const TOL = 22;
// tên file gốc -> tên nhân vật (ảnh nhiều người: danh sách theo thứ tự trái sang phải, trên xuống dưới)
const TEN = {
  'Gemini_Generated_Image_4dl3444dl3444dl3.png': ['gia-lang', 'ba-cuoc', 'ba-non', 'ong-gay', 'ba-om-goi', 'ong-quat'],
  'Gemini_Generated_Image_nn55z4nn55z4nn55.png': ['tre-nam'],
  'Gemini_Generated_Image_p0eplsp0eplsp0ep.png': ['si-tu-nu'],
  'Gemini_Generated_Image_pxliikpxliikpxli.png': ['si-tu-nam'],
  'nu-tre-con.png': ['tre-nu'],
  'Gemini_Generated_Image_1fn9tf1fn9tf1fn9.png': ['lung-nam'], // sĩ tử nhìn sau lưng
  'Gemini_Generated_Image_jtwrlojtwrlojtwr.png': ['lung-nu'],
};
const OUT_H = 600;

fs.mkdirSync(OUT, { recursive: true });
for (const [file, names] of Object.entries(TEN)) {
  const { data, info } = await sharp(path.join(SRC, file)).flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const diff = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = px(i);
    diff[i] = 255 - Math.min(p[0], p[1], p[2]); // nền trắng
  }
  // nền = vùng gần trắng nối với mép ảnh
  const isBg = new Uint8Array(W * H);
  const st = [];
  for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  const stack = st.filter((i) => diff[i] <= TOL);
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
  // các mảng người: gom điểm không phải nền
  const comp = new Int32Array(W * H).fill(-1);
  const boxes = [];
  for (let s = 0; s < W * H; s++) {
    if (isBg[s] || comp[s] >= 0) continue;
    const id = boxes.length;
    const b = { id, n: 0, x0: W, y0: H, x1: 0, y1: 0 };
    const q = [s];
    comp[s] = id;
    while (q.length) {
      const i = q.pop();
      b.n++;
      const x = i % W, y = (i / W) | 0;
      if (x < b.x0) b.x0 = x;
      if (x > b.x1) b.x1 = x;
      if (y < b.y0) b.y0 = y;
      if (y > b.y1) b.y1 = y;
      for (const j of [i - W, i + W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1]) {
        if (j >= 0 && j < W * H && !isBg[j] && comp[j] < 0) {
          comp[j] = id;
          q.push(j);
        }
      }
    }
    boxes.push(b);
  }
  const max = Math.max(...boxes.map((b) => b.n));
  // giữ mảng đủ lớn (bỏ vụn); ảnh 1 người chỉ lấy mảng lớn nhất
  let ds = names.length === 1 ? boxes.filter((b) => b.n === max) : boxes.filter((b) => b.n > max * 0.25);
  // xếp theo hàng (trên xuống) rồi trái sang phải
  const hang = (b) => Math.round(((b.y0 + b.y1) / 2) / (H / 2));
  ds.sort((a, b) => hang(a) - hang(b) || a.x0 - b.x0);
  console.log(file, '->', ds.length, 'nhân vật', ds.map((b) => `${b.x0},${b.y0} ${b.x1 - b.x0}x${b.y1 - b.y0}`).join(' | '));
  for (const [k, b] of ds.entries()) {
    const ten = names[k];
    if (!ten) continue;
    const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
    const rgba = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (b.y0 + y) * W + (b.x0 + x);
        const keep = comp[i] === b.id;
        const p = px(i);
        const a = !keep ? 0 : diff[i] < TOL * 2.5 ? Math.round(255 * Math.min(1, Math.max(0.35, (diff[i] - TOL) / (TOL * 1.5)))) : 255;
        rgba.set([p[0], p[1], p[2], a], (y * w + x) * 4);
      }
    }
    await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .resize({ height: OUT_H })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(path.join(OUT, `${ten}.webp`));
  }
}
console.log('xong');
