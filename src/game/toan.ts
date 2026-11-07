// Câu toán nhẩm máy tự sinh: không bao giờ hết câu, không cần kiểm tra sự thật.
// Cấp 1 khảo hạch · 2 thi Hương · 3 thi Hội · 4 thi Đình (2 bước).
import type { McQ } from './thi';

const ri = (rand: () => number, a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

/** Sinh 1 câu toán; 3 đáp án sai là số gần đúng (lệch 1, lệch 10, đảo chữ số...) để không đoán mò được */
export function sinhToan(cap: number, rand: () => number = Math.random): McQ {
  let q: string;
  let kq: number;
  const k = ri(rand, 0, 1);
  if (cap <= 1) {
    const a = ri(rand, 12, 49), b = ri(rand, 11, 39);
    [q, kq] = k ? [`${a} cộng ${b} bằng bao nhiêu?`, a + b] : [`${a + b} trừ ${b} bằng bao nhiêu?`, a];
  } else if (cap === 2) {
    if (k) {
      const a = ri(rand, 12, 29), b = ri(rand, 3, 9);
      [q, kq] = [`${a} nhân ${b} bằng bao nhiêu?`, a * b];
    } else {
      const a = ri(rand, 120, 480), b = ri(rand, 25, 99);
      [q, kq] = [`${a} cộng ${b} bằng bao nhiêu?`, a + b];
    }
  } else if (cap === 3) {
    if (k) {
      const a = ri(rand, 11, 19), b = ri(rand, 11, 19);
      [q, kq] = [`${a} nhân ${b} bằng bao nhiêu?`, a * b];
    } else {
      const b = ri(rand, 6, 9), c = ri(rand, 12, 39);
      [q, kq] = [`${b * c} chia ${b} bằng bao nhiêu?`, c];
    }
  } else {
    const a = ri(rand, 12, 25), b = ri(rand, 3, 9), c = ri(rand, 11, 49);
    [q, kq] = k ? [`${a} nhân ${b} rồi cộng ${c} bằng bao nhiêu?`, a * b + c] : [`${a + c} trừ ${c} rồi nhân ${b} bằng bao nhiêu?`, a * b];
  }
  const sai = new Set<number>();
  const dao = Number(String(kq).split('').reverse().join(''));
  for (const d of [kq + 1, kq - 1, kq + 10, kq - 10, dao, kq + 2, kq - 2, kq + 11]) {
    if (d > 0 && d !== kq && sai.size < 3 && rand() < 0.75) sai.add(d);
  }
  for (let d = 3; sai.size < 3; d++) if (kq + d !== kq) sai.add(kq + d);
  return { id: `toan:${q}`, q, right: String(kq), wrong: [...sai].map(String), level: 'de' };
}
