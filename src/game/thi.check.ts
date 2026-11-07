// Kiểm tra luật chơi: npx tsx src/game/thi.check.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { choiceOf, diemDung, KyThi, parseMc } from './thi';
import { GAME } from './config';

// Đọc đáp án
assert.equal(choiceOf('a'), 0);
assert.equal(choiceOf('C.'), 2);
assert.equal(choiceOf('đáp án b'), 1);
assert.equal(choiceOf('Chọn D'), 3);
assert.equal(choiceOf('ab'), null);
assert.equal(choiceOf('anh ơi'), null);

// Điểm tốc độ
assert.equal(diemDung(100, 0, 10_000), 100);
assert.equal(diemDung(100, 10_000, 10_000), 50);
assert.equal(diemDung(100, 5_000, 10_000), 75);

// Bộ câu đọc được, đủ câu cho 1 ván
const errors: string[] = [];
const bank = parseMc(fs.readFileSync(new URL('./cau-hoi/trac-nghiem.txt', import.meta.url), 'utf8'), errors);
assert.deepEqual(errors, []);

// Chạy 1 ván với đồng hồ giả
let t = 1_000_000;
const k = new KyThi(bank, {}, () => 0.42);
k.cho(t);
const step = (ms: number) => {
  t += ms;
  k.tick(t);
};
step(GAME.choSec * 1000);
assert.equal(k.phase, 'vong');
assert.equal(k.view(t).tongCau, 20);
step(GAME.vongSec * 1000);
assert.equal(k.phase, 'doc');

// Gõ lúc chưa hiện đáp án: không tính, không mất lượt
const ans = () => k.cau!.ans;
const ch = (c: number) => 'ABCD'[c];
assert.equal(k.chat({ id: 'an', name: 'An', avatar: '', comment: ch(ans()) }, t), false);
k.docXong(t);
assert.equal(k.phase, 'hoi');

// An đúng ngay, Bình đúng sau 5 giây, Chi sai, Dũng nói chuyện
assert.equal(k.chat({ id: 'an', name: 'An', avatar: '', comment: ch(ans()) }, t), true);
assert.equal(k.chat({ id: 'an', name: 'An', avatar: '', comment: ch((ans() + 1) % 4) }, t), false); // chỉ tính lần đầu
t += 5000;
k.chat({ id: 'binh', name: 'Bình', avatar: '', comment: `đáp án ${ch(ans())}` }, t);
k.chat({ id: 'chi', name: 'Chi', avatar: '', comment: ch((ans() + 1) % 4) }, t);
k.chat({ id: 'dung', name: 'Dũng', avatar: '', comment: 'hay quá' }, t);
assert.equal(k.view(t).soNop, 3);
assert.equal(k.view(t).counts, null); // đang hỏi không lộ tỉ lệ

step(GAME.vong[0].giay * 1000);
assert.equal(k.phase, 'dapAn');
const v = k.view(t);
assert.equal(v.ketQua!.soDung, 2);
assert.equal(v.top[0].name, 'An');
assert.equal(v.top[0].diem, 100);
assert.equal(v.top[1].diem, 75);
assert.equal(k.siTu.get('chi')!.diem, 0); // không âm

// Chống gửi sớm theo giờ TikTok: bình luận gửi trước lúc hiện đáp án nhưng tới trễ
step(GAME.dapAnSec * 1000);
assert.equal(k.phase, 'doc');
k.chat({ id: 'x', name: 'X', avatar: '', comment: 'hi', createTime: t - 200 }, t);
k.chat({ id: 'x', name: 'X', avatar: '', comment: 'hi', createTime: t - 200 }, t);
k.docXong(t);
const shown = t; // giờ TikTok = giờ máy - 200ms
t += 1500;
assert.equal(k.chat({ id: 'som', name: 'Sớm', avatar: '', comment: 'a', createTime: shown - 1400 - 200 }, t), false);
assert.equal(k.chat({ id: 'kip', name: 'Kịp', avatar: '', comment: 'a', createTime: shown + 300 - 200 }, t), true);

// Chạy hết ván: An đúng tất cả thì đỗ Trạng Nguyên, có thưởng chuỗi
const kinds: string[] = [];
for (let guard = 0; guard < 3000 && k.phase !== 'cho'; guard++) {
  if (k.phase === 'hoi') k.chat({ id: 'an', name: 'An', avatar: '', comment: ch(ans()) }, t);
  if (k.phase === 'doc') k.docXong(t);
  else step(1000);
  kinds.push(...k.lay().map((e) => e.t));
}
assert.equal(k.phase, 'cho');
assert.ok(kinds.includes('vinhQuy'));
assert.equal(kinds.filter((x) => x === 'bangVang').length, 4);
const an = k.siTu.get('an')!;
assert.ok(an.chuoi >= 18, `chuỗi ${an.chuoi}`);
assert.equal(k.bxh(1)[0].danhHieu, 'Trạng Nguyên');

// 500 người cùng trả lời 1 câu
const k2 = new KyThi(bank);
k2.cho(t);
t += GAME.choSec * 1000;
k2.tick(t);
t += GAME.vongSec * 1000;
k2.tick(t);
k2.docXong(t);
for (let i = 0; i < 500; i++) k2.chat({ id: `u${i}`, name: `U${i}`, avatar: '', comment: 'ABCD'[i % 4] }, t + i * 10);
assert.equal(k2.view(t).soNop, 500);
assert.equal(k2.view(t).recent.length, 5);

console.log('thi.check: OK');
