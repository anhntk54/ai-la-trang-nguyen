// Kiểm tra bộ câu hỏi: node tools/kiem-tra-cau-hoi.mjs [file...]
// Báo lỗi cú pháp, đáp án trùng/dài, câu trùng giữa các file, câu thuần tiếng Anh, từ dễ sai theo thời gian.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '../src/game/cau-hoi');
const LEVELS = ['de', 'vua', 'kho', 'dinh', 'meo'];
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(DIR).filter((f) => f.endsWith('.txt')).map((f) => path.join(DIR, f));
const plain = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
// chữ tiếng Việt có dấu: câu không có chữ nào có dấu thì nghi là tiếng Anh
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const NHAY_CAM = /(hiện nay|mới nhất|năm nay|gần đây nhất|tính đến)/i;

const seen = new Map();
const dem = Object.fromEntries(LEVELS.map((l) => [l, 0]));
let loi = 0;
const bao = (f, i, msg, line) => {
  loi++;
  console.log(`${path.basename(f)}:${i + 1}  ${msg}\n    ${line}`);
};
for (const f of files) {
  let level = '';
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const sec = /^\[(\w+)\]$/.exec(line);
    if (sec) {
      level = LEVELS.includes(sec[1]) ? sec[1] : '';
      if (!level) bao(f, i, 'nhóm lạ', line);
      return;
    }
    const p = line.split('|').map((s) => s.trim());
    if (!level || p.length !== 5 || p.some((x) => !x)) return bao(f, i, 'sai cú pháp (cần: câu | đúng | sai | sai | sai, nằm dưới [nhóm])', line);
    const [q, ...opts] = p;
    if (new Set(opts.map(plain)).size !== 4) bao(f, i, 'đáp án trùng nhau (kể cả khi bỏ dấu)', line);
    if (opts.some((o) => o.length > 24)) bao(f, i, 'đáp án dài quá 24 ký tự', line);
    if (q.length > 110) bao(f, i, 'câu hỏi dài quá 110 ký tự', line);
    if (!VI.test(q)) bao(f, i, 'câu hỏi không có chữ tiếng Việt có dấu', line);
    if (NHAY_CAM.test(q)) bao(f, i, 'câu có "hiện nay / mới nhất..." dễ sai theo thời gian', line);
    if (/[%×÷=<>]|\d\/\d/.test(line)) bao(f, i, 'có ký hiệu ông đồ khó đọc', line);
    const key = plain(q) + '|' + plain(opts[0]);
    if (seen.has(key)) bao(f, i, `trùng câu với ${seen.get(key)}`, line);
    else seen.set(key, `${path.basename(f)}:${i + 1}`);
    dem[level]++;
  });
}
console.log('\nSố câu theo nhóm:', dem, 'tổng', Object.values(dem).reduce((a, b) => a + b, 0));
console.log(loi ? `${loi} lỗi` : 'Không có lỗi');
process.exitCode = loi ? 1 : 0;
