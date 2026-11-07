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
 *   phao    pháo nổ + trống: vinh quy Trạng Nguyên, quà to
 *   qua     đàn rải + chuông nhỏ: băng rôn cảm ơn quà
 *   donTrong trống dồn hồi hộp: hết giờ, chờ công bố đáp án
 * Nhạc nền nhiều lớp: nền ngân + trống, mõ, đàn tranh ngũ cung lúc chờ; nhịp tim + tích tắc lúc hỏi (sáng dần);
 * dồn dập 5 giây cuối; nhỏ lại khi ông đồ nói; tắt lúc vinh quy.
 */
export type SfxName = 'trong' | 'hien' | 'nop' | 'mo' | 'chieng' | 'dung' | 'truot' | 'phao' | 'qua' | 'donTrong';
const NAMES: SfxName[] = ['trong', 'hien', 'nop', 'mo', 'chieng', 'dung', 'truot', 'phao', 'qua', 'donTrong'];

// Ngũ cung Rê: Rê Fa Sol La Đô (2 quãng tám)
const NGU_CUNG = [293.7, 349.2, 392, 440, 523.3, 587.3, 698.5, 784, 880, 1046.5];
// Giai điệu nhạc nền: chỉ số nốt trong NGU_CUNG theo từng phách, -1 = nghỉ (16 phách 1 câu)
const GIAI_DIEU = [
  [4, -1, 3, 4, 7, -1, 6, 4, 3, -1, 2, 3, 4, -1, -1, -1],
  [2, -1, 3, 2, 0, -1, 1, 2, 3, -1, 4, 3, 2, -1, -1, -1],
  [4, -1, 6, 7, 8, -1, 7, 6, 4, -1, 6, 4, 3, -1, -1, -1],
  [3, -1, 2, 1, 0, -1, 2, 3, 0, -1, -1, -1, 0, -1, -1, -1],
];
// Hợp âm nền (ngân dài), đổi mỗi câu nhạc: Rê-La, Đô-Sol, Fa-Đô, Sol-Rê
const HOP_AM = [
  [146.8, 220, 293.7, 349.2],
  [130.8, 196, 261.6, 349.2],
  [174.6, 261.6, 349.2, 440],
  [196, 293.7, 392, 440],
];
type Mode = 'tat' | 'vui' | 'hoi' | 'gap' | 'lang';
const BPM: Record<Exclude<Mode, 'tat'>, number> = { vui: 104, hoi: 116, gap: 132, lang: 90 };

class Sfx {
  volume = 0.35; // nhỏ hơn giọng ông đồ
  musicVolume = 0.3;
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

  // ---------- nhạc nền nhiều lớp ----------
  // nền ngân (pad) chạy suốt + theo kiểu: vui (chờ ván, bảng vàng) · hoi (nhịp tim + tích tắc, sáng dần) · gap (5 giây cuối) · lang (ông đồ đọc, chốt, công bố)
  private musicOut: GainNode | null = null;
  private pad: { osc: OscillatorNode[]; loc: BiquadFilterNode; gain: GainNode } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextAt = 0;
  private step = 0;
  private mode: Mode = 'tat';

  /** tien: 0..1 thời gian câu đã trôi (nhạc sáng dần khi sắp hết giờ) */
  music(mode: Mode, duck: boolean, tien = 0) {
    if (mode === 'tat' || this.musicVolume <= 0) return this.tatNhac();
    try {
      const c = this.c;
      if (!this.musicOut) this.batNhac(c);
      this.mode = mode;
      const t = c.currentTime;
      this.musicOut!.gain.setTargetAtTime(this.musicVolume * (duck ? 0.45 : 1), t, 0.25);
      const pad = this.pad!;
      pad.gain.gain.setTargetAtTime({ vui: 0.07, hoi: 0.12, gap: 0.16, lang: 0.11 }[mode], t, 0.4);
      pad.loc.frequency.setTargetAtTime(mode === 'hoi' ? 500 + tien * 1600 : mode === 'gap' ? 2600 : mode === 'vui' ? 1300 : 700, t, 0.3);
    } catch {
      // trình duyệt không cho phát tiếng: bỏ qua
    }
  }

  private batNhac(c: AudioContext) {
    const out = c.createGain();
    out.gain.value = 0.0001;
    out.connect(c.destination);
    const loc = c.createBiquadFilter();
    loc.type = 'lowpass';
    loc.frequency.value = 900;
    loc.Q.value = 2;
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    loc.connect(gain).connect(out);
    const osc = HOP_AM[0].flatMap((f) =>
      [-7, 7].map((cent) => {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = cent;
        o.connect(loc);
        o.start();
        return o;
      }),
    );
    this.pad = { osc, loc, gain };
    this.musicOut = out;
    this.nextAt = c.currentTime + 0.1;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 30);
  }

  private tatNhac() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.mode = 'tat';
    const out = this.musicOut;
    const pad = this.pad;
    this.musicOut = null;
    this.pad = null;
    if (out && this.ctx) {
      out.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => {
        pad?.osc.forEach((o) => o.stop());
        out.disconnect();
      }, 1500);
    }
  }

  private schedule() {
    const c = this.ctx;
    const out = this.musicOut;
    if (!c || !out || this.mode === 'tat') return;
    const eighth = 60 / BPM[this.mode] / 2;
    while (this.nextAt < c.currentTime + 0.15) {
      const bar = Math.floor(this.step / 16) % HOP_AM.length;
      const pos = this.step % 16;
      if (pos === 0 && this.pad) {
        // đổi hợp âm nền mỗi câu nhạc, luyến nhẹ
        HOP_AM[bar].forEach((f, i) => {
          this.pad!.osc[i * 2].frequency.setTargetAtTime(f, this.nextAt, 0.08);
          this.pad!.osc[i * 2 + 1].frequency.setTargetAtTime(f, this.nextAt, 0.08);
        });
      }
      nhip(c, out, this.mode, pos, bar, this.nextAt);
      this.nextAt += eighth;
      this.step++;
    }
  }

  // ---------- tự phát theo ảnh chụp game ----------
  private lastMo = -1;

  /** So ảnh chụp trước và sau để phát tiếng đúng lúc */
  watch(a: View | null, b: View, speaking: boolean) {
    const mode: Mode =
      b.phase === 'vinhQuy' ? 'tat'
      : b.phase === 'hoi' ? (b.con <= 5 ? 'gap' : 'hoi')
      : b.phase === 'cho' || b.phase === 'vong' || b.phase === 'bangVang' ? 'vui'
      : 'lang';
    this.music(mode, speaking && mode !== 'gap', b.phase === 'hoi' ? 1 - b.con / b.tongGiay : 0);
    if (!a) return;
    if (b.phase === 'vong' && a.phase !== 'vong') this.play('trong', 500);
    if (b.phase === 'hoi' && a.phase !== 'hoi') this.play('hien', 300);
    if (b.phase === 'hoi' && b.soNop > a.soNop) this.play('nop', 180);
    if (b.phase === 'hoi' && b.con <= 5 && b.con >= 1 && b.con !== this.lastMo) {
      this.lastMo = b.con;
      this.play('mo', 0);
    }
    if (b.phase !== 'hoi') this.lastMo = -1;
    if (b.phase === 'chot' && a.phase !== 'chot') this.play('donTrong', 500);
    if (b.phase === 'dapAn' && a.phase !== 'dapAn') {
      this.play('chieng', 300);
      setTimeout(() => this.play(b.ketQua?.soDung ? 'dung' : 'truot', 300), 450);
    }
    if (b.phase === 'vinhQuy' && a.phase !== 'vinhQuy') this.play('phao', 1000);
    if (b.qua && b.qua.at !== a.qua?.at) this.play(b.qua.big ? 'phao' : 'qua', 300);
  }
}

/** 1 nốt móc đơn của nhạc nền theo kiểu */
function nhip(c: AudioContext, out: AudioNode, mode: Mode, pos: number, bar: number, t: number) {
  const goc = HOP_AM[bar][0];
  if (mode === 'lang') {
    if (pos === 0) trongAt(c, out, t, 0.45);
    if (pos === 8) gay(c, out, goc, t, 2, 0.25);
    return;
  }
  if (mode === 'vui') {
    if (pos % 8 === 0) trongAt(c, out, t, 0.9);
    if (pos === 6 || pos === 14) trongAt(c, out, t, 0.45);
    if (pos % 8 === 4) moAt(c, out, t, 0.35);
    if (pos % 4 === 0) gay(c, out, goc / 2, t, 0.9, 0.45);
    const n = GIAI_DIEU[bar][pos];
    if (n >= 0) gay(c, out, NGU_CUNG[n], t, 1.1, 0.42);
    return;
  }
  // hoi / gap: nhịp tim "thình thịch", bass đập, tích tắc đồng hồ
  const gap = mode === 'gap';
  if (pos % (gap ? 4 : 8) === 0) trongAt(c, out, t, 1);
  if (pos % (gap ? 4 : 8) === 1) trongAt(c, out, t, 0.55);
  if (gap || pos % 2 === 0) bassAt(c, out, goc / 2, t, gap ? 0.5 : 0.4);
  moAt(c, out, t, gap ? 0.32 : pos % 2 ? 0.1 : 0.18, pos % 2 ? 2400 : 2000);
  if (!gap && pos === 0 && bar % 2 === 1) gay(c, out, NGU_CUNG[7 + (bar % 3)], t, 1.6, 0.25);
  if (gap && pos === 0) vutAt(c, out, t, 1.8, 0.28);
}

/** Bass ngắn, đục */
function bassAt(c: AudioContext, out: AudioNode, f: number, t: number, gain: number) {
  const o = c.createOscillator();
  const v = c.createGain();
  const lp = c.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.value = f;
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  v.gain.setValueAtTime(0.0001, t);
  v.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  v.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(lp).connect(v).connect(out);
  o.start(t);
  o.stop(t + 0.22);
}

/** Tiếng vút lên (nhiễu quét từ trầm lên cao) */
function vutAt(c: AudioContext, out: AudioNode, t: number, dur: number, gain: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(5000, t + dur);
  const v = c.createGain();
  v.gain.setValueAtTime(0.0001, t);
  v.gain.exponentialRampToValueAtTime(gain, t + dur * 0.9);
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(v).connect(out);
  src.start(t);
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
  // trống dồn 2,4 giây: nhanh dần, to dần
  donTrong: (c, v) => {
    const t = c.currentTime;
    let s = 0;
    for (let i = 0; i < 34 && s < 2.35; i++) {
      const k = s / 2.4;
      noiseAt(c, c.destination, t + s, 0.05, v * (0.35 + k * 0.9), 'bandpass', 1500 + k * 900);
      if (i % 2 === 0) trongAt(c, c.destination, t + s, v * (0.4 + k * 0.6));
      s += 0.12 - k * 0.07;
    }
  },
  // rải đàn đi lên + 2 tiếng chuông nhỏ: cảm ơn quà
  qua: (c, v) => {
    const t = c.currentTime;
    [5, 7, 8, 9].forEach((n, i) => gay(c, c.destination, NGU_CUNG[n], t + i * 0.06, 0.8, v * 0.7));
    [0.3, 0.42].forEach((s) => gay(c, c.destination, NGU_CUNG[9] * 2, t + s, 0.6, v * 0.4));
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
