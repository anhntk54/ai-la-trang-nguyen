import { useEffect, useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import { GAME } from './config';

const HO = ['Minh', 'Lan', 'Tuấn', 'Hoa', 'Long', 'Thảo', 'Nam', 'Vy', 'Khánh', 'An', 'Bình', 'Trang', 'Hùng', 'My', 'Phúc'];

/** Giả lập n người gõ đáp án trong vài giây (chỉ để thử, không cần live) */
function giaLap(n: number, trongMs: number) {
  for (let i = 0; i < n; i++) {
    const id = Math.floor(Math.random() * 100_000);
    setTimeout(() => {
      emitTest('chat', {
        username: `situ${id}`,
        nickname: `${HO[id % HO.length]}_${id % 1000}`,
        comment: 'ABCD'[Math.floor(Math.random() * 4)],
        createTime: Date.now() - 300 - Math.random() * 800, // trễ mạng giả
      });
    }, Math.random() * trongMs);
  }
}

/** Nút riêng của game trên trang điều khiển */
export function GameControls() {
  const btn = 'rounded-xl px-4 py-2 font-semibold';
  const [tieuDe, setTieuDe] = useState('');
  const [tenOngDo, setTenOngDo] = useState('');
  const [daLuu, setDaLuu] = useState('');
  useEffect(() => {
    fetch('/api/cai-dat').then((r) => r.json()).then((c) => {
      setTieuDe(c.tieuDe ?? '');
      setTenOngDo(c.tenOngDo ?? '');
    }).catch(() => {});
  }, []);
  const luu = async () => {
    const r = await fetch('/api/cai-dat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tieuDe, tenOngDo }) });
    setDaLuu(r.ok ? 'Đã lưu, màn hình đổi ngay' : 'Lưu không được');
  };
  const o = 'w-full rounded-lg bg-black/40 px-3 py-2 text-white outline-none ring-1 ring-white/15 focus:ring-amber-400';
  return (
    <div className="space-y-3 rounded-2xl bg-white/5 p-4">
      <div className="font-bold text-amber-300">Ai Là Trạng Nguyên</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm text-white/70">
          Chữ trên mái tranh (tối đa 30 ký tự)
          <input className={o} value={tieuDe} maxLength={30} placeholder={GAME.tieuDeMacDinh} onChange={(e) => setTieuDe(e.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          Tên ông đồ (bảng tên trên đầu)
          <input className={o} value={tenOngDo} maxLength={30} placeholder={GAME.tenOngDoMacDinh} onChange={(e) => setTenOngDo(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className={`${btn} bg-emerald-700 text-white`} onClick={luu}>💾 Lưu tên</button>
        <span className="text-sm text-white/60">{daLuu || 'Để trống là dùng tên mặc định'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={`${btn} bg-amber-600 text-white`} onClick={() => sendControl('custom', 'batdau')}>
          ▶ Bắt đầu ván mới ngay
        </button>
        <button className={`${btn} bg-red-800 text-white`} onClick={() => sendControl('custom', 'bocau')}>
          🚫 Bỏ câu này
        </button>
      </div>
      <div className="text-sm text-white/60">Giả lập (bấm lúc đang hiện 4 đáp án):</div>
      <div className="flex flex-wrap gap-2">
        <button className={`${btn} bg-white/10 text-white`} onClick={() => giaLap(1, 500)}>1 người</button>
        <button className={`${btn} bg-white/10 text-white`} onClick={() => giaLap(60, 6000)}>60 người</button>
        <button className={`${btn} bg-white/10 text-white`} onClick={() => giaLap(500, 8000)}>500 người</button>
      </div>
    </div>
  );
}
