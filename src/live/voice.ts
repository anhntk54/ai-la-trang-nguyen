import { IS_STAGE, MUTE } from './page';
import { containsBanned } from './bannedWords';

/**
 * Hàng đợi giọng đọc. Chỉ phát trên trang stage.
 *   voice.say('Chào bạn A')            -> xếp cuối hàng
 *   voice.say('Cảm ơn quà', true)      -> ưu tiên, chen lên đầu (dùng cho quà)
 * Câu nào chờ quá lâu (mặc định 60 giây) thì bỏ, để không đọc chuyện đã cũ.
 */
interface Line {
  text: string;
  at: number;
  done?: () => void; // gọi khi đọc xong, lỗi, hoặc bị bỏ
}

const MAX_WAIT_MS = 60_000;
const MAX_QUEUE = 30;

class Voice {
  private normal: Line[] = [];
  private priority: Line[] = [];
  private playing = false;
  private current: HTMLAudioElement | null = null;
  private lastSpokeAt = Date.now();
  rate = 1;
  volume = 1;
  enabled = IS_STAGE && !MUTE;
  /** Trang stage này có phải trang chính không (lỡ mở 2 trang stage thì trang cũ thành trang phụ: im lặng, không gửi dữ liệu) */
  speaker = true;
  setSpeaker(mine: boolean) {
    if (!mine && this.speaker) this.stop();
    this.speaker = mine;
    this.enabled = IS_STAGE && !MUTE && mine;
  }
  onBlocked?: () => void;

  say(text: string, priority = false, done?: () => void) {
    if (!this.enabled || !text.trim()) return done?.();
    const q = priority ? this.priority : this.normal;
    q.push({ text: text.trim(), at: Date.now(), done });
    if (q.length > MAX_QUEUE) q.shift()?.done?.();
    void this.next();
  }

  /** Tạo giọng trước (server giữ sẵn), tới lúc đọc thì phát ngay không phải chờ */
  private daTao = new Set<string>();
  prefetch(text: string) {
    const t = text.trim();
    if (!this.enabled || !t || this.daTao.has(t)) return;
    this.daTao.add(t);
    if (this.daTao.size > 300) this.daTao.clear();
    fetch(`/api/tts?rate=${this.rate}&text=${encodeURIComponent(t)}`)
      .then((r) => r.arrayBuffer())
      .catch(() => this.daTao.delete(t));
  }

  stop() {
    [...this.normal, ...this.priority].forEach((l) => l.done?.());
    this.normal = [];
    this.priority = [];
    this.current?.pause();
    this.current = null;
    this.playing = false;
  }

  get busy() {
    return this.playing || this.normal.length + this.priority.length > 0;
  }

  /** Số câu thường đang chờ (không tính câu đang đọc) */
  get waiting() {
    return this.normal.length;
  }

  /** Số câu ưu tiên (quà) đang chờ */
  get waitingPriority() {
    return this.priority.length;
  }

  /** Giọng đã im bao lâu (0 khi đang đọc hoặc còn câu chờ) */
  quietForMs(now = Date.now()) {
    return this.busy ? 0 : now - this.lastSpokeAt;
  }

  private async next() {
    if (this.playing) return;
    const now = Date.now();
    let line: Line | undefined;
    while ((line = this.priority.shift() ?? this.normal.shift())) {
      if (now - line.at < MAX_WAIT_MS) break;
      line.done?.();
    }
    if (!line) return;
    this.playing = true;
    try {
      const audio = new Audio(`/api/tts?rate=${this.rate}&text=${encodeURIComponent(line.text)}`);
      audio.volume = this.volume;
      this.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch((e) => {
          // Chrome chặn tự phát tiếng khi chưa bấm vào trang: báo để hiện nút "Bấm để bật tiếng"
          if (e?.name === 'NotAllowedError') this.onBlocked?.();
          resolve();
        });
      });
    } finally {
      line.done?.();
      this.current = null;
      this.playing = false;
      this.lastSpokeAt = Date.now();
      void this.next();
    }
  }
}

export const voice = new Voice();

export { speakableName } from './names';
