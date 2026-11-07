import { emitTest, sendControl } from '../live/page';

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
  return (
    <div className="space-y-3 rounded-2xl bg-white/5 p-4">
      <div className="font-bold text-amber-300">Ai Là Trạng Nguyên</div>
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
