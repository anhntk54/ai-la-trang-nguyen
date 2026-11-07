import type { View } from './thi';

/**
 * Âm thanh kiểu khoa cử, trình duyệt tự tạo (không cần file, không lo bản quyền). Chỉ phát ở trang stage.
 * Muốn tiếng thật hơn: bỏ file mp3 cùng tên vào public/assets/sfx/ (vd chieng.mp3), game tự dùng file thay.
 *   trong   trống chầu dồn: mở mỗi kỳ thi
 *   hien    đàn tranh rải 4 nốt: hiện 4 đáp án, bắt đầu tính giờ
 *   nop     tiếng gảy nhỏ: có người nộp bài (giới hạn, phòng đông không rối)
 *   mo      mõ gỗ: 5 giây cuối
 *   chieng  chiêng đồng: hết giờ, công bố đáp án
 *   dung    đàn tranh vuốt lên: có người đúng
 *   truot   vuốt xuống buồn: không ai đúng
 *   phao    pháo nổ + trống: vinh quy Trạng Nguyên
 * Nhạc nền: đàn tranh ngũ cung + mõ + trống, nhỏ hẳn khi ông đồ nói, dồn dập 5 giây cuối.
 */
export type SfxName = 'trong' | 'hien' | 'nop' | 'mo' | 'chieng' | 'dung' | 'truot' | 'phao';
const NAMES: SfxName[] = ['trong', 'hien', 'nop', 'mo', 'chieng', 'dung', 'truot', 'phao'];

// Ngũ cung Rê: Rê Fa Sol La Đô (2 quãng tám)
const NGU_CUNG = [293.7, 349.2, 392, 440, 523.3, 587.3, 698.5, 784, 880, 1046.5];
// Giai điệu nhạc nền: chỉ số nốt trong NGU_CUNG theo từng phách, -1 = nghỉ (16 phách 1 câu)
const GIAI_DIEU = [
  [4, -1, 3, 4, 7, -1, 6, 4, 3, -1, 2, 3, 4, -1, -1, -1],
  [2, -1, 3, 2, 0, -1, 1, 2, 3, -1, 4, 3, 2, -1, -1, -1],
  [4, -1, 6, 7, 8, -1, 7, 6, 4, -1, 6, 4, 3, -1, -1, -1],
  [3, -1, 2, 1, 0, -1, 2, 3, 0, -1, -1, -1, 0, -1, -1, -1],
];
const BPM = 92;

class Sfx {
  volume = 0.35; // nhỏ hơn giọng ông đồ
  musicVolume = 0.22;
  private ctx: AudioContext | null = null;
  private files: Partial<Record<SfxName, HTMLAudioElement>> = {};
  private lastAt: Partial<Record<SfxName, number>> = {};

  private get c() {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Gọi khi người dùng bấm vào trang (Chrome chặn âm thanh tới lúc đó) */
  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  loadFiles() {
    for (const n of NAMES) {
      const a = new Audio(`/assets/sfx/${n}.mp3`);
      a.preload = 'auto';
      a.addEventListener('canplaythrough', () => (this.files[n] = a), { once: true });
    }
  }

  play(name: SfxName, minGapMs = 80) {
    if (this.volume <= 0) return;
    const now = performance.now();
    if (now - (this.lastAt[name] ?? -Infinity) < minGapMs) return;
    this.lastAt[name] = now;
    const file = this.files[name];
    if (file) {
      const a = file.cloneNode() as HTMLAudioElement;
      a.volume = Math.min(1, this.volume * 2);
      void a.play().catch(() => {});
      return;
    }
    try {
      SYNTH[name](this.c, this.volume);
    } catch {
      // trình duyệt không cho phát tiếng: bỏ qua
    }
  }

  // ---------- nhạc nền ----------
  private musicOut: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextAt = 0;
  private step = 0;
  /** 0: ông đồ nói / màn chờ (nhỏ, thưa) · 1: đang chờ trả lời · 2: 5 giây cuối (dồn dập) */
  private level = 0;

  music(on: boolean, level: number) {
    this.level = level;
    if (!on || this.musicVolume <= 0) {
      if (this.musicOut && this.ctx) {
        const old = this.musicOut;
        old.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
        setTimeout(() => old.disconnect(), 1500);
      }
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.musicOut = null;
      return;
    }
    try {
      const c = this.c;
      const target = this.musicVolume * (level === 0 ? 0.45 : 1);
      if (this.musicOut) {
        this.musicOut.gain.setTargetAtTime(target, c.currentTime, 0.25);
        return;
      }
      const out = c.createGain();
      out.gain.value = 0.0001;
      out.gain.setTargetAtTime(target, c.currentTime, 0.6);
      out.connect(c.destination);
      this.musicOut = out;
      this.nextAt = c.currentTime + 0.1;
      this.step = 0;
      this.timer = setInterval(() => this.schedule(), 30);
    } catch {
      // bỏ qua
    }
  }

  private schedule() {
    const c = this.ctx;
    const out = this.musicOut;
    if (!c || !out) return;
    const eighth = 60 / BPM / 2;
    while (this.nextAt < c.currentTime + 0.15) {
      const bar = Math.floor(this.step / 16) % GIAI_DIEU.length;
      const pos = this.step % 16;
      nhip(c, out, GIAI_DIEU[bar][pos], pos, bar, this.nextAt, eighth, this.level);
      this.nextAt += eighth;
      this.step++;
    }
  }

  // ---------- tự phát theo ảnh chụp game ----------
  private lastMo = -1;

  /** So ảnh chụp trước và sau để phát tiếng đúng lúc */
  watch(a: View | null, b: View, speaking: boolean) {
    // nhạc: màn chờ / bảng vàng / ông đang nói thì nhỏ; đang hỏi thì đủ; 5 giây cuối dồn
    const level = b.phase === 'hoi' ? (b.con <= 5 ? 2 : speaking ? 0 : 1) : 0;
    this.music(b.phase !== 'vinhQuy', level);
    if (!a) return;
    if (b.phase === 'vong' && a.phase !== 'vong') this.play('trong', 500);
    if (b.phase === 'hoi' && a.phase !== 'hoi') this.play('hien', 300);
    if (b.phase === 'hoi' && b.soNop > a.soNop) this.play('nop', 180);
    if (b.phase === 'hoi' && b.con <= 5 && b.con >= 1 && b.con !== this.lastMo) {
      this.lastMo = b.con;
      this.play('mo', 0);
    }
    if (b.phase !== 'hoi') this.lastMo = -1;
    if (b.phase === 'dapAn' && a.phase !== 'dapAn') {
      this.play('chieng', 300);
      setTimeout(() => this.play(b.ketQua?.soDung ? 'dung' : 'truot', 300), 450);
    }
    if (b.phase === 'vinhQuy' && a.phase !== 'vinhQuy') this.play('phao', 1000);
  }
}

/** 1 phách nhạc nền: đàn tranh (giai điệu), mõ, trống trầm */
function nhip(c: AudioContext, out: AudioNode, note: number, pos: number, bar: number, t: number, _len: number, level: number) {
  // trống trầm đầu mỗi nửa câu
  if (pos % 8 === 0) trongAt(c, out, t, level === 0 ? 0.5 : 0.9);
  if (level === 0) {
    // ông đồ nói: chỉ vài nốt đàn thưa, không mõ
    if (note >= 0 && pos % 4 === 0) gay(c, out, NGU_CUNG[note], t, 1.4, 0.35);
    return;
  }
  if (note >= 0) gay(c, out, NGU_CUNG[note], t, 1.2, 0.5);
  // nốt trầm giữ nhịp (đàn bầu tưởng tượng)
  if (pos === 0) gay(c, out, NGU_CUNG[[0, 2, 0, 3][bar]] / 2, t, 2.2, 0.35);
  // mõ: phách 2, 4; 5 giây cuối gõ dồn mọi phách
  if (level === 2 || pos % 4 === 2) moAt(c, out, t, level === 2 ? 0.55 : 0.35, level === 2 && pos % 2 ? 1600 : 1250);
  if (level === 2 && pos % 2 === 0) trongAt(c, out, t, 0.6);
}

/** Tiếng gảy dây (giống đàn tranh): sóng tam giác + bội âm, tắt nhanh, hơi luyến xuống */
function gay(c: AudioContext, out: AudioNode, f: number, t: number, dur: number, gain: number) {
  for (const [mul, g] of [[1, 1], [2, 0.35], [3, 0.12]] as const) {
    const o = c.createOscillator();
    const v = c.createGain();
    o.type = mul === 1 ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(f * mul * 1.01, t);
    o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.06);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(gain * g, t + 0.004);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur * (mul === 1 ? 1 : 0.5));
    o.connect(v).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

/** Mõ gỗ: tiếng "cốc" ngắn */
function moAt(c: AudioContext, out: AudioNode, t: number, gain: number, f = 1250) {
  const o = c.createOscillator();
  const v = c.createGain();
  const bp = c.createBiquadFilter();
  o.type = 'sine';
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.06);
  bp.type = 'bandpass';
  bp.frequency.value = f;
  bp.Q.value = 6;
  v.gain.setValueAtTime(gain, t);
  v.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(bp).connect(v).connect(out);
  o.start(t);
  o.stop(t + 0.12);
}

/** Trống: thân trầm tụt xuống + tiếng da trống */
function trongAt(c: AudioContext, out: AudioNode, t: number, gain: number) {
  const o = c.createOscillator();
  const v = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.35);
  v.gain.setValueAtTime(gain, t);
  v.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(v).connect(out);
  o.start(t);
  o.stop(t + 0.5);
  noiseAt(c, out, t, 0.08, gain * 0.35, 'lowpass', 900);
}

function noiseAt(c: AudioContext, out: AudioNode, t: number, dur: number, gain: number, type: BiquadFilterType, freq: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

/** Chiêng đồng: nhiều tần số không hài hoà, ngân dài */
function chiengAt(c: AudioContext, out: AudioNode, t: number, gain: number, base = 180) {
  for (const [mul, g, d] of [[1, 1, 2.6], [2.13, 0.55, 1.8], [3.42, 0.35, 1.2], [5.1, 0.2, 0.7]] as const) {
    const o = c.createOscillator();
    const v = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * mul, t);
    o.frequency.exponentialRampToValueAtTime(base * mul * 0.985, t + d);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(gain * g, t + 0.01);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v).connect(out);
    o.start(t);
    o.stop(t + d + 0.05);
  }
  noiseAt(c, out, t, 0.05, gain * 0.3, 'bandpass', 2500);
}

type Synth = (c: AudioContext, v: number) => void;
const SYNTH: Record<SfxName, Synth> = {
  // trống chầu dồn: tùng... tùng tùng tùng TÙNG
  trong: (c, v) => {
    const t = c.currentTime;
    [0, 0.42, 0.62, 0.82, 1.08].forEach((s, i) => trongAt(c, c.destination, t + s, v * (i === 4 ? 1.6 : 1.1)));
  },
  // rải 4 nốt đàn đi lên
  hien: (c, v) => {
    const t = c.currentTime;
    [4, 6, 7, 9].forEach((n, i) => gay(c, c.destination, NGU_CUNG[n], t + i * 0.07, 0.9, v * 0.8));
  },
  // gảy 1 nốt nhỏ ngẫu nhiên trong ngũ cung
  nop: (c, v) => gay(c, c.destination, NGU_CUNG[5 + Math.floor(Math.random() * 5)], c.currentTime, 0.5, v * 0.25),
  mo: (c, v) => moAt(c, c.destination, c.currentTime, v * 1.6),
  chieng: (c, v) => chiengAt(c, c.destination, c.currentTime, v * 1.2),
  // vuốt dây đi lên: vui
  dung: (c, v) => {
    const t = c.currentTime;
    [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach((n, i) => gay(c, c.destination, NGU_CUNG[n], t + i * 0.045, 0.8, v * 0.6));
  },
  // vuốt xuống chậm, trầm: tiếc
  truot: (c, v) => {
    const t = c.currentTime;
    [6, 4, 2, 0].forEach((n, i) => gay(c, c.destination, NGU_CUNG[n] / 2, t + i * 0.18, 1.2, v * 0.7));
  },
  // pháo đùng đoàng tràng dài + chiêng + trống
  phao: (c, v) => {
    const t = c.currentTime;
    for (let i = 0; i < 28; i++) noiseAt(c, c.destination, t + i * 0.07 + Math.random() * 0.05, 0.06, v * (0.8 + Math.random() * 0.6), 'highpass', 1200 + Math.random() * 2000);
    chiengAt(c, c.destination, t + 2.1, v * 1.3, 160);
    [2.1, 2.5, 2.9].forEach((s) => trongAt(c, c.destination, t + s, v * 1.4));
    [4, 6, 7, 9, 8, 9].forEach((n, i) => gay(c, c.destination, NGU_CUNG[n], t + 2.4 + i * 0.12, 1, v * 0.6));
  },
};

export const sfx = new Sfx();
