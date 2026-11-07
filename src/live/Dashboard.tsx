import { useState, type ReactNode } from 'react';
import type { LiveStatus } from './types';
import { emitTest, sendControl } from './page';

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', '𝑵𝒈𝒐̣𝒄 𝑨𝒏𝒉'];
const pick = () => {
  const nickname = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  return { nickname, username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach' };
};

/**
 * Trang điều khiển (http://localhost:3007). Im lặng, không phát tiếng.
 * - Kết nối phòng live
 * - Gõ câu cho giọng đọc trên stage
 * - Nút giả lập sự kiện để test khi chưa live
 * `preview`: bản xem trước của stage (im lặng)
 */
export function Dashboard({
  status,
  channelName,
  preview,
  extra,
}: {
  status: LiveStatus | null;
  channelName: string;
  preview: ReactNode;
  extra?: ReactNode;
}) {
  const [user, setUser] = useState(() => localStorageGet('tiktokUser'));
  const [nameText, setNameText] = useState('');
  const [msg, setMsg] = useState('');
  const [speakText, setSpeakText] = useState('');
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    setMsg('');
    localStorageSet('tiktokUser', user);
    try {
      const r = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user }),
      }).then((x) => x.json());
      setMsg(r.success ? 'Đã kết nối' : r.error);
    } catch (e) {
      setMsg(String(e));
    }
    setBusy(false);
  };

  const disconnect = () => fetch('/api/tiktok/disconnect', { method: 'POST' });

  const speak = async () => {
    const r = await sendControl('speak', speakText);
    setMsg(r.pages > 1 ? `Đã gửi (đang mở ${r.pages} trang)` : 'Đã gửi');
    setSpeakText('');
  };

  const saveName = async () => {
    const r = await sendControl('setName', nameText);
    setMsg(r.success ? `Đã lưu tên kênh: ${nameText.trim()}` : r.error);
    if (r.success) setNameText('');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <Card title="Kết nối TikTok LIVE">
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2"
                placeholder="username TikTok (không cần @)"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
              <Btn onClick={connect} disabled={busy || !user.trim()}>
                {busy ? 'Đang nối...' : 'Kết nối'}
              </Btn>
              <Btn onClick={disconnect} tone="ghost">
                Ngắt
              </Btn>
            </div>
            <div className="mt-3 text-sm">
              Trạng thái:{' '}
              {status?.isConnected ? (
                <span className="text-emerald-400">
                  Đang live @{status.username} · {status.viewerCount} người xem · {status.totalLikes} tim
                </span>
              ) : status?.isConnecting ? (
                <span className="text-amber-400">Đang kết nối...</span>
              ) : (
                <span className="text-slate-400">Chưa kết nối</span>
              )}
            </div>
            {(msg || status?.error) && <div className="mt-1 text-sm text-amber-300">{msg || status?.error}</div>}
            <div className="mt-3 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
              Link cho TikTok LIVE Studio: <b className="text-slate-200">http://lvh.me:3007/?view=stage</b> · 1080 × 1920.
              Chỉ trang đó phát tiếng.
            </div>
          </Card>

          <Card title="Giọng đọc trên stage">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span>
                Tên kênh: <b className="text-amber-300">{channelName}</b>
              </span>
              <input
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2"
                placeholder="Đổi tên kênh mà giọng đọc xưng..."
                maxLength={40}
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nameText.trim() && saveName()}
              />
              <Btn onClick={saveName} disabled={!nameText.trim()}>
                Lưu tên
              </Btn>
            </div>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2"
                placeholder="Gõ câu muốn đọc ngay..."
                value={speakText}
                onChange={(e) => setSpeakText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && speakText.trim() && speak()}
              />
              <Btn onClick={speak} disabled={!speakText.trim()}>
                Đọc ngay
              </Btn>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              Tốc độ:
              {['0.85', '1', '1.15', '1.3'].map((r) => (
                <Btn key={r} tone="ghost" onClick={() => sendControl('setRate', r)}>
                  {r}×
                </Btn>
              ))}
              <Btn tone="danger" onClick={() => confirmReset()}>
                Reset game
              </Btn>
            </div>
          </Card>

          <Card title="Giả lập (test khi chưa live)">
            <div className="flex flex-wrap gap-2">
              <Btn tone="ghost" onClick={() => emitTest('member', pick())}>
                👋 Người vào
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: 'join' })}>
                ✋ Gõ "join"
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: 'Live hay quá' })}>
                💬 Comment
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: 'mong mai thi được điểm cao' })}>
                🙏 Comment cầu chúc
              </Btn>
              <Btn
                tone="ghost"
                onClick={() => emitTest('gift', { ...pick(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 5 })}
              >
                🌹 5 Hoa hồng
              </Btn>
              <Btn
                tone="ghost"
                onClick={() => emitTest('gift', { ...pick(), giftName: 'Sư tử', giftId: 6369, diamondCount: 29999, repeatCount: 1 })}
              >
                🦁 Quà to
              </Btn>
              <Btn tone="ghost" onClick={() => comboSameUser()}>
                🔁 1 người tặng 3 lần liền
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('follow', pick())}>
                ➕ Follow
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('like', { ...pick(), likeCount: 100 })}>
                ❤️ 100 tim
              </Btn>
            </div>
            <p className="mt-2 text-xs text-slate-500">Sự kiện giả đi tới mọi trang đang mở, kể cả stage trong LIVE Studio.</p>
          </Card>

          {extra}
        </div>

        <div className="justify-self-center">
          <div className="mb-2 text-center text-sm text-slate-400">Xem trước (im lặng)</div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-700">{preview}</div>
        </div>
      </div>
    </div>
  );
}

// Cùng 1 người tặng 3 lần cách nhau 1 giây: chỉ được cảm ơn 1 lần
function comboSameUser() {
  const who = pick();
  for (let i = 0; i < 3; i++) {
    setTimeout(() => emitTest('gift', { ...who, giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 1 }), i * 1000);
  }
}

function confirmReset() {
  // không dùng window.confirm để tránh hộp thoại chặn
  void sendControl('reset');
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  tone = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'ghost' | 'danger';
}) {
  const cls = {
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    ghost: 'bg-slate-800 hover:bg-slate-700',
    danger: 'bg-rose-700 hover:bg-rose-600',
  }[tone];
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

function localStorageGet(k: string) {
  try {
    return localStorage.getItem(k) || '';
  } catch {
    return '';
  }
}
function localStorageSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    // bỏ qua
  }
}
