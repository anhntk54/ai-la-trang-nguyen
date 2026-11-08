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
const dir = new URL('./cau-hoi/', import.meta.url);
const bank = fs.readdirSync(dir).filter((f) => f.endsWith('.txt')).flatMap((f) => parseMc(fs.readFileSync(new URL(f, dir), 'utf8'), errors));
assert.deepEqual(errors, []);
if (bank.length < 100) { console.log('Chưa đủ câu hỏi để chạy thử ván, bỏ qua phần ván'); }

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
assert.equal(k.phase, 'chot'); // hết giờ: hồi hộp trước khi công bố
assert.equal(k.view(t).dung, -1); // chưa lộ đáp án
assert.ok(k.view(t).top.every((h) => h.gain === 0)); // bảng điểm chưa lộ ai đúng ai sai
assert.equal(k.chat({ id: 'tre', name: 'Trễ', avatar: '', comment: 'a' }, t), false); // hết giờ không nhận bài
step(GAME.chotSec * 1000);
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

// Đoán nam / nữ theo tên + lệnh tự chọn
import { doanGioi, lenhGioi } from './gioiTinh';
assert.equal(doanGioi('Minh_Tuan'), 'nam');
assert.equal(doanGioi('Lan Anh 🌸'), 'nu');
assert.equal(doanGioi('Hoàng Long'), 'nam');
assert.equal(doanGioi('NguyenThiAnh99'), 'nu');
assert.equal(doanGioi('Trần Văn An'), 'nam');
assert.equal(doanGioi('Khánh An'), null);
assert.equal(lenhGioi('Nữ'), 'nu');
assert.equal(lenhGioi('con trai'), 'nam');
assert.equal(lenhGioi('nam định'), null);
const k3 = new KyThi(bank);
k3.chat({ id: 'la', name: 'Lan Anh', avatar: '', comment: 'con trai' }, t);
assert.equal(k3.gioiCua({ id: 'la', name: 'Lan Anh' }), 'nam'); // tự chọn thắng đoán tên
assert.equal(k3.gioiCua({ id: 'mt', name: 'Minh Tuấn' }), 'nam');
console.log('gioiTinh: OK');

// Câu toán tự sinh: 4 đáp án khác nhau, số dương, đáp án đúng tính lại khớp
import { sinhToan } from './toan';
for (let cap = 1; cap <= 4; cap++) {
  for (let i = 0; i < 500; i++) {
    const q = sinhToan(cap);
    const opts = [q.right, ...q.wrong];
    assert.equal(new Set(opts).size, 4, q.q);
    assert.ok(opts.every((o) => Number(o) > 0), q.q);
    const expr = q.q.replace(' bằng bao nhiêu?', '').replace(/ rồi /g, ' ').replace(/cộng/g, '+').replace(/trừ/g, '-').replace(/nhân/g, '*').replace(/chia/g, '/');
    // "a nhân b rồi cộng c" / "a trừ c rồi nhân b": tính tuần tự trái sang phải
    const tok = expr.split(' ');
    let v = Number(tok[0]);
    for (let j = 1; j < tok.length; j += 2) v = eval(`${v}${tok[j]}${tok[j + 1]}`);
    assert.equal(String(v), q.right, q.q);
  }
}
console.log('toan: OK');

// Bỏ câu: không bao giờ được bốc lại trước câu khác
{
  let t2 = 5_000_000;
  const k4 = new KyThi(bank);
  k4.cho(t2);
  t2 += GAME.choSec * 1000; k4.tick(t2);
  t2 += GAME.vongSec * 1000; k4.tick(t2);
  const bi = k4.cau!.q.id;
  k4.boCau(t2);
  assert.equal(k4.used[bi], Number.MAX_SAFE_INTEGER);
  for (let i = 0; i < 30; i++) { k4.batDau(t2 + i); assert.ok(!k4['cauList'].some((c: any) => c.q.id === bi)); }
  console.log('bocau: OK');
}

// Quà: gộp cùng người, quà to chen lên trước, mỗi lần 1 băng rôn
{
  let t3 = 9_000_000;
  const k5 = new KyThi(bank);
  const q = (id: string, coins: number, count = 1) => ({ id, name: id, avatar: '', gift: 'Hoa hồng', count, coins, big: coins >= GAME.bigGiftCoins });
  k5.tangQua(q('an', 1), t3);
  k5.tangQua(q('an', 5, 5), t3 + 100); // An tặng tiếp: gộp vào băng rôn đang hiện
  assert.equal(k5.qua!.count, 6);
  k5.tangQua(q('binh', 1), t3 + 200);
  k5.tangQua(q('chi', 500), t3 + 300); // quà to chen trước Bình
  t3 += GAME.quaSec * 1000 + 1;
  k5.tick(t3);
  assert.equal(k5.qua!.id, 'chi');
  t3 += GAME.quaToSec * 1000 + 1;
  k5.tick(t3);
  assert.equal(k5.qua!.id, 'binh');
  t3 += GAME.quaSec * 1000 + 1;
  k5.tick(t3);
  assert.equal(k5.qua, null);
  for (let i = 0; i < 50; i++) k5.tangQua(q('u' + i, 1), t3); // 50 người cùng tặng: hàng chờ có trần
  assert.ok(k5['quaCho'].length <= 6);
  console.log('qua: OK');
}

// Thi đua miền, cứu trợ bằng tim, câu nước rút, dấu hiệu trên tên
{
  let t4 = 20_000_000;
  const k6 = new KyThi(bank, {}, () => 0.3);
  const go = (ms: number) => { t4 += ms; k6.tick(t4); };
  k6.chat({ id: 'a', name: 'An', avatar: '', comment: 'miền Bắc' }, t4);
  k6.chat({ id: 'b', name: 'Bình', avatar: '', comment: 'Nam' }, t4);
  k6.chat({ id: 'c', name: 'Chi', avatar: '', comment: 'trung bộ' }, t4);
  assert.equal(k6.mienChon.get('b'), 'nam');
  assert.equal(k6.gioiChon.has('b'), false); // "Nam" là chọn miền, không phải chọn nhân vật
  k6.cho(t4);
  go(GAME.choSec * 1000);
  go(GAME.vongSec * 1000);
  const ch = () => 'ABCD'[k6.cau!.ans];
  // chạy tới câu cuối, An luôn đúng, Bình luôn sai
  let kinds: string[] = [];
  for (let g = 0; g < 4000 && k6.phase !== 'vinhQuy'; g++) {
    if (k6.phase === 'doc') k6.docXong(t4);
    if (k6.phase === 'hoi') {
      // Thi Đình: thả đủ tim -> loại 2 đáp án sai, không bao giờ loại đáp án đúng
      if (k6.cau!.vong === 3 && !k6.view(t4).cuu?.loai.length) {
        k6.tim(GAME.cuuTroTim);
        const cu = k6.view(t4).cuu!;
        assert.equal(cu.loai.length, 2);
        assert.ok(!cu.loai.includes(k6.cau!.ans));
      }
      const diemTruoc = k6.siTu.get('a')?.diem ?? 0;
      const latKeo = k6.laLatKeo;
      k6.chat({ id: 'a', name: 'An', avatar: '', comment: ch() }, t4);
      k6.chat({ id: 'b', name: 'Bình', avatar: '', comment: 'ABCD'[(k6.cau!.ans + 1) % 4] }, t4);
      go(k6['vong'].giay * 1000);
      go(GAME.chotSec * 1000);
      if (latKeo) assert.ok(k6.siTu.get('a')!.diem - diemTruoc >= 2 * k6['vong'].diem * GAME.diemSan * 0.99); // điểm nhân đôi
    } else go(1000);
    kinds.push(...k6.lay().map((e) => e.t));
  }
  assert.ok(kinds.includes('latKeo'));
  assert.ok(kinds.includes('cuuTro'));
  const vq = kinds.length; // event vinhQuy có phe miền thắng
  const m = k6.diemMien();
  assert.ok(m.bac.diem > 0 && m.nam.diem === 0 && m.bac.nguoi === 1);
  const an = k6.bxh(3).find((h) => h.id === 'a')!;
  assert.equal(an.mien, 'bac');
  assert.ok(an.chuoi >= 3);
  // ván sau: An mang dấu Trạng Nguyên ván trước
  go(GAME.vinhQuySec * 1000);
  go(GAME.choSec * 1000);
  go(GAME.vongSec * 1000);
  k6.docXong(t4);
  k6.chat({ id: 'a', name: 'An', avatar: '', comment: ch() }, t4);
  go(k6['vong'].giay * 1000);
  go(GAME.chotSec * 1000);
  assert.equal(k6.bxh(5).find((h) => h.id === 'a')!.trangTruoc, true);
  void vq;
  console.log('mien + cuuTro + latKeo + dau hieu: OK');
}

// Ông đồ trêu: nhận loại bình luận, không hiểu nhầm, có giới hạn
import { loaiCmt, Treu } from './treu';
{
  assert.equal(loaiCmt('Khó quá!!'), 'kho');
  assert.equal(loaiCmt('dễ quá'), 'de');
  assert.equal(loaiCmt('chào ông đồ'), 'chao');
  assert.equal(loaiCmt('hi'), 'chao');
  assert.equal(loaiCmt('hiểu rồi'), null);
  assert.equal(loaiCmt('hahaha'), 'cuoi');
  assert.equal(loaiCmt('ông ơi gợi ý đi'), 'goiY');
  assert.equal(loaiCmt('B'), null);
  assert.equal(loaiCmt('câu này khó quá mà tôi nghĩ mãi không ra nổi'), null); // dài: không đoán bừa
  const tr = new Treu(180_000, 12_000);
  tr.them('a', 'An', 'kho', 0);
  tr.them('a', 'An', 'de', 100); // cùng người đang chờ: không thêm
  assert.equal(tr.lay(1000)?.name, 'An');
  tr.them('a', 'An', 'kho', 2000); // vừa trêu An: 3 phút sau mới trêu lại
  tr.them('b', 'Bình', 'cuoi', 2000);
  assert.equal(tr.lay(5000), null); // chưa đủ 12 giây giãn cách
  assert.equal(tr.lay(14_000)?.name, 'Bình');
  assert.equal(tr.lay(40_000), null);
  console.log('treu: OK');
}

// Cổ vũ, thách thức: đổi ngôi đầu bảng, phe miền đang thua, thách trước câu
{
  let t5 = 30_000_000;
  const k7 = new KyThi(bank, {}, Math.random);
  const go = (ms: number) => { t5 += ms; k7.tick(t5); };
  k7.chat({ id: 'a', name: 'An', avatar: '', comment: 'Bắc' }, t5);
  k7.chat({ id: 'b', name: 'Bình', avatar: '', comment: 'Trung' }, t5);
  k7.cho(t5);
  go(GAME.choSec * 1000);
  const ev: any[] = [];
  let n = 0;
  for (let g = 0; g < 4000 && k7.phase !== 'vinhQuy'; g++) {
    if (k7.phase === 'doc') k7.docXong(t5);
    if (k7.phase === 'hoi') {
      n++;
      const dung = 'ABCD'[k7.cau!.ans];
      const sai = 'ABCD'[(k7.cau!.ans + 1) % 4];
      // 5 câu đầu An đúng, Bình sai; sau đó ngược lại để Bình vượt lên
      k7.chat({ id: 'a', name: 'An', avatar: '', comment: n <= 5 ? dung : sai }, t5);
      k7.chat({ id: 'b', name: 'Bình', avatar: '', comment: n <= 5 ? sai : dung }, t5);
      go(k7['vong'].giay * 1000);
      go(GAME.chotSec * 1000);
    } else go(1000);
    ev.push(...k7.lay());
  }
  assert.ok(ev.some((e) => e.t === 'dauBang' && e.name === 'Bình'), 'hô đổi ngôi khi Bình vượt An');
  assert.ok(ev.some((e) => e.t === 'mienKem' && e.mien === 'trung'), 'cổ vũ miền Trung lúc đang thua');
  const thach = ev.filter((e) => e.t === 'thach').length;
  assert.ok(thach >= 2 && thach <= 16, `số câu thách ${thach}`);
  console.log('co vu + thach thuc: OK');
}
