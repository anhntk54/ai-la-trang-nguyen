// Lõi game Ai Là Trạng Nguyên: không React, thời gian truyền vào (now) để test được.
// Trang stage chạy 1 bản KyThi, trang điều khiển chỉ vẽ lại ảnh chụp view().
import { GAME, type Level, type Vong } from './config';
import { doanGioi, lenhGioi, type Gioi } from './gioiTinh';
import { sinhToan } from './toan';

export interface McQ {
  id: string;
  q: string;
  right: string;
  wrong: string[];
  level: Level;
}

const LEVELS: Level[] = ['de', 'vua', 'kho', 'dinh', 'meo'];

/** Đọc file trắc nghiệm: dòng "[de]" đổi nhóm; mỗi dòng "câu hỏi | đúng | sai | sai | sai" */
export function parseMc(text: string, errors: string[] = []): McQ[] {
  const out: McQ[] = [];
  let level: Level | '' = '';
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const sec = /^\[(\w+)\]$/.exec(line);
    if (sec) {
      level = LEVELS.includes(sec[1] as Level) ? (sec[1] as Level) : '';
      if (!level) errors.push(`dòng ${i + 1}: nhóm lạ ${line}`);
      return;
    }
    const parts = line.split('|').map((s) => s.trim());
    if (!level || parts.length !== 5 || parts.some((p) => !p)) {
      errors.push(`dòng ${i + 1}: sai cú pháp`);
      return;
    }
    const [q, right, ...wrong] = parts;
    out.push({ id: `${q}|${right}`, q, right, wrong, level });
  });
  return out;
}

// "Đáp Án  C." -> "dapanc"
export const plain = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');

/** "a", "C.", "đáp án b", "chọn D", "câu c" -> 0..3; câu nói thường -> null */
export function choiceOf(comment: string): number | null {
  const m = /^(?:dapan|chon|cau)?([abcd])$/.exec(plain(comment));
  return m ? 'abcd'.indexOf(m[1]) : null;
}

/** Điểm 1 câu đúng: đúng ngay = tối đa, sát giờ = diemSan * tối đa */
export function diemDung(max: number, ms: number, totalMs: number) {
  const left = Math.max(0, Math.min(1, 1 - ms / totalMs));
  return Math.round(max * (GAME.diemSan + (1 - GAME.diemSan) * left));
}

export type Phase = 'cho' | 'vong' | 'doc' | 'hoi' | 'dapAn' | 'bangVang' | 'vinhQuy';

export interface SiTu {
  id: string;
  name: string;
  avatar: string;
  diem: number;
  chuoi: number;
  msDung: number; // tổng thời gian các câu đúng, để xếp khi bằng điểm
  vaoLuc: number;
  gain: number; // điểm câu vừa rồi (để hiện +/-)
}

interface Cau {
  q: McQ;
  opts: string[];
  ans: number;
  vong: number;
}

export type Ev =
  | { t: 'cho' }
  | { t: 'vong'; vong: number }
  | { t: 'doc'; text: string }
  | { t: 'dapAn'; chu: string; dap: string; soDung: number; soNop: number; nhanh?: string; msNhanh?: number }
  | { t: 'bangVang'; vong: string; dau?: string }
  | { t: 'vinhQuy'; top: string[] };

export interface Hang {
  hang: number;
  id: string;
  name: string;
  avatar: string;
  diem: number;
  danhHieu: string;
  gain: number;
  gioi: Gioi; // chọn ảnh nhân vật nam / nữ
}

const shuffle = <T,>(a: T[], rand: () => number) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class KyThi {
  phase: Phase = 'cho';
  endsAt = 0;
  private cauList: Cau[] = [];
  private idx = 0;
  private shownAt = 0;
  private answers = new Map<string, { chon: number; ms: number }>();
  private counts = [0, 0, 0, 0];
  private recent: string[] = []; // tên vừa nộp bài (không lộ đáp án)
  private ketQua: { soDung: number; nhanh: { name: string; ms: number; diem: number }[] } | null = null;
  private skew = 0;
  private skewN = 0;
  private events: Ev[] = [];
  siTu = new Map<string, SiTu>();
  /** Người chơi tự gõ "nam" / "nữ": nhớ cả buổi, qua nhiều ván */
  gioiChon = new Map<string, Gioi>();

  constructor(
    private bank: McQ[],
    /** id câu -> lúc hỏi gần nhất; game ưu tiên câu lâu chưa hỏi */
    public used: Record<string, number> = {},
    private rand: () => number = Math.random,
  ) {}

  /** Bắt đầu đếm ngược tới ván mới */
  cho(now: number) {
    this.phase = 'cho';
    this.endsAt = now + GAME.choSec * 1000;
    this.events.push({ t: 'cho' });
  }

  batDau(now: number) {
    this.siTu.clear();
    this.cauList = this.chonCau(now);
    this.idx = 0;
    this.moVong(now);
  }

  /** Lấy các sự kiện cần đọc từ lần gọi trước */
  lay(): Ev[] {
    return this.events.splice(0);
  }

  get cau(): Cau | undefined {
    return this.cauList[this.idx];
  }

  private get vong(): Vong {
    return GAME.vong[this.cau?.vong ?? 0];
  }

  private chonCau(now: number): Cau[] {
    const taken = new Set<string>();
    const out: Cau[] = [];
    GAME.vong.forEach((v, vi) => {
      const ds: McQ[] = [];
      for (const [level, n] of v.phan) {
        // câu lâu chưa hỏi nhất trước, cùng mức thì ngẫu nhiên; nhóm thiếu câu thì lấy nhóm khác
        const lay = (cung: boolean) =>
          shuffle(this.bank.filter((q) => (cung ? q.level === level : true) && !taken.has(q.id)), this.rand)
            .sort((a, b) => (this.used[a.id] ?? 0) - (this.used[b.id] ?? 0));
        let pool = lay(true);
        if (pool.length < n) pool = [...pool, ...lay(false).filter((q) => !pool.includes(q))];
        for (const q of pool.slice(0, n)) {
          taken.add(q.id);
          this.used[q.id] = now;
          ds.push(q);
        }
      }
      shuffle(ds, this.rand);
      if (v.toan) ds.splice(Math.min(2, ds.length), 0, sinhToan(v.toan, this.rand)); // câu toán ở vị trí thứ 3
      for (const q of ds) {
        const opts = shuffle([q.right, ...q.wrong], this.rand);
        out.push({ q, opts, ans: opts.indexOf(q.right), vong: vi });
      }
    });
    return out;
  }

  private moVong(now: number) {
    this.phase = 'vong';
    this.endsAt = now + GAME.vongSec * 1000;
    this.events.push({ t: 'vong', vong: this.cau?.vong ?? 0 });
  }

  private moCau(now: number) {
    const c = this.cau!;
    this.phase = 'doc';
    this.endsAt = now + GAME.docMaxSec * 1000;
    this.answers.clear();
    this.counts = [0, 0, 0, 0];
    this.recent = [];
    this.ketQua = null;
    const opts = c.opts.map((o, i) => `${'ABCD'[i]}, ${o}.`).join(' ');
    this.events.push({ t: 'doc', text: `Câu ${this.idx + 1}. ${c.q.q} ${opts}` });
  }

  /** Giọng đọc xong đề: hiện 4 đáp án, bắt đầu tính giờ */
  docXong(now: number) {
    if (this.phase !== 'doc') return;
    this.phase = 'hoi';
    this.shownAt = now;
    this.endsAt = now + this.vong.giay * 1000;
  }

  /** Bỏ câu đang hỏi (câu lỗi): không ai được điểm, sang câu tiếp */
  boCau(now: number) {
    if (this.phase !== 'doc' && this.phase !== 'hoi') return;
    this.answers.clear();
    this.sauDapAn(now);
  }

  /**
   * 1 bình luận. createTime = giờ TikTok gắn lúc người xem gửi.
   * Trả về true nếu được tính là bài nộp.
   */
  chat(e: { id: string; name: string; avatar: string; comment: string; createTime?: number }, now: number) {
    if (e.createTime) {
      const d = now - e.createTime;
      this.skew = this.skewN ? Math.min(this.skew + 5, d) : d;
      this.skewN++;
    }
    const g = lenhGioi(e.comment);
    if (g) {
      this.gioiChon.set(e.id, g);
      return false;
    }
    if (this.phase !== 'hoi') return false;
    const chon = choiceOf(e.comment);
    if (chon === null || this.answers.has(e.id)) return false;
    const sentAt = e.createTime && this.skewN > 1 ? e.createTime + this.skew : now;
    if (sentAt < this.shownAt - GAME.earlySendGraceMs) return false; // gửi lúc đáp án chưa hiện: không tính, không mất lượt
    const total = this.vong.giay * 1000;
    this.answers.set(e.id, { chon, ms: Math.max(0, Math.min(total, sentAt - this.shownAt)) });
    this.counts[chon]++;
    const s = this.siTu.get(e.id);
    if (s) {
      s.name = e.name;
      s.avatar = e.avatar || s.avatar;
    } else {
      this.siTu.set(e.id, { id: e.id, name: e.name, avatar: e.avatar, diem: 0, chuoi: 0, msDung: 0, vaoLuc: now, gain: 0 });
    }
    this.recent = [e.name, ...this.recent.filter((n) => n !== e.name)].slice(0, 5);
    return true;
  }

  tick(now: number) {
    if (now < this.endsAt) return;
    switch (this.phase) {
      case 'cho':
        return this.batDau(now);
      case 'vong':
        return this.moCau(now);
      case 'doc':
        return this.docXong(now);
      case 'hoi':
        return this.chamCau(now);
      case 'dapAn':
        return this.sauDapAn(now);
      case 'bangVang':
        return this.idx < this.cauList.length ? this.moVong(now) : this.moVinhQuy(now);
      case 'vinhQuy':
        return this.cho(now);
    }
  }

  private chamCau(now: number) {
    const c = this.cau!;
    const v = this.vong;
    const total = v.giay * 1000;
    const nhanh: { name: string; ms: number; diem: number }[] = [];
    for (const s of this.siTu.values()) s.gain = 0;
    for (const s of this.siTu.values()) {
      const a = this.answers.get(s.id);
      if (!a) {
        s.chuoi = 0; // bỏ câu thì mất chuỗi
        continue;
      }
      if (a.chon === c.ans) {
        let p = diemDung(v.diem, a.ms, total);
        s.chuoi++;
        if (s.chuoi % GAME.chuoiMoi === 0) p += GAME.chuoiThuong;
        s.diem += p;
        s.gain = p;
        s.msDung += a.ms;
        nhanh.push({ name: s.name, ms: a.ms, diem: p });
      } else {
        const tru = Math.min(s.diem, Math.round(v.diem * GAME.saiTru));
        s.diem -= tru;
        s.gain = -tru;
        s.chuoi = 0;
      }
    }
    nhanh.sort((a, b) => a.ms - b.ms);
    this.ketQua = { soDung: nhanh.length, nhanh: nhanh.slice(0, 3) };
    this.phase = 'dapAn';
    this.endsAt = now + GAME.dapAnSec * 1000;
    this.events.push({
      t: 'dapAn', chu: 'ABCD'[c.ans], dap: c.opts[c.ans], soDung: nhanh.length, soNop: this.answers.size,
      nhanh: nhanh[0]?.name, msNhanh: nhanh[0]?.ms,
    });
  }

  private sauDapAn(now: number) {
    const vongCu = this.cau?.vong ?? 0;
    this.idx++;
    if (this.idx < this.cauList.length && this.cau!.vong === vongCu) return this.moCau(now);
    this.phase = 'bangVang';
    this.endsAt = now + GAME.bangVangSec * 1000;
    this.events.push({ t: 'bangVang', vong: GAME.vong[vongCu].ten, dau: this.bxh(1)[0]?.name });
  }

  private moVinhQuy(now: number) {
    this.phase = 'vinhQuy';
    this.endsAt = now + GAME.vinhQuySec * 1000;
    this.events.push({ t: 'vinhQuy', top: this.bxh(3).map((h) => h.name) });
  }

  /** Bảng vàng: điểm cao trước; bằng điểm thì tổng thời gian đúng ngắn hơn, rồi ai vào trước */
  bxh(n = 20): Hang[] {
    return [...this.siTu.values()]
      .filter((s) => s.diem > 0 || s.gain !== 0)
      .sort((a, b) => b.diem - a.diem || a.msDung - b.msDung || a.vaoLuc - b.vaoLuc)
      .slice(0, n)
      .map((s, i) => ({ hang: i + 1, id: s.id, name: s.name, avatar: s.avatar, diem: s.diem, danhHieu: GAME.danhHieu(i + 1), gain: s.gain, gioi: this.gioiCua(s) }));
  }

  /** Nam / nữ: người chơi tự chọn > đoán theo tên > cố định theo tài khoản */
  gioiCua(s: { id: string; name: string }): Gioi {
    return this.gioiChon.get(s.id) ?? doanGioi(s.name) ?? ([...s.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 2 ? 'nu' : 'nam');
  }

  /** Ảnh chụp cho màn hình (gửi cả sang trang điều khiển) */
  view(now: number) {
    const c = this.cau;
    const v = c ? GAME.vong[c.vong] : GAME.vong[0];
    const lo = this.phase === 'dapAn';
    return {
      phase: this.phase,
      vong: c?.vong ?? 0,
      vongTen: v.ten,
      vongNhan: v.nhan,
      vongInfo: { cau: v.cau, giay: v.giay, diem: v.diem, tru: Math.round(v.diem * GAME.saiTru) },
      cauSo: this.idx + 1,
      tongCau: this.cauList.length || GAME.vong.reduce((n, x) => n + x.cau, 0),
      q: c?.q.q ?? '',
      opts: this.phase === 'hoi' || lo ? c?.opts ?? [] : [],
      con: Math.max(0, Math.ceil((this.endsAt - now) / 1000)),
      tongGiay: v.giay,
      soNop: this.answers.size,
      counts: lo ? this.counts : null,
      dung: lo ? c?.ans ?? -1 : -1,
      ketQua: lo ? this.ketQua : null,
      recent: this.recent,
      soSiTu: this.siTu.size,
      top: this.bxh(this.phase === 'bangVang' || this.phase === 'vinhQuy' ? 20 : lo ? 10 : 5),
    };
  }
}

export type View = ReturnType<KyThi['view']>;
