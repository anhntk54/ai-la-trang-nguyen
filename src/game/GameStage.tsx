import { AnimatePresence, motion } from 'motion/react';
import type { GameState } from './useGame';
import type { Hang, View } from './thi';
import { GAME } from './config';

/**
 * Màn hình live 1080x1920 vẽ đè lên ảnh nền public/assets/bg/nen.jpg.
 * Toạ độ đo trên ảnh nền: khung câu hỏi x 165-917, y 642-1059; cuộn giấy trong x 150-930, y 265-1390.
 * Chừa 250px dưới cùng và mép phải cho giao diện TikTok.
 */
const INK = '#4a1a0c';
const GOLD = '#d9a441';

export function GameStage({ game }: { game: GameState }) {
  const v = game.view;
  if (!v) return <div className="absolute inset-0" />;
  const bigBoard = v.phase === 'bangVang' || v.phase === 'vinhQuy';
  return (
    <div className="absolute inset-0 select-none" style={{ color: INK }}>
      {/* Tab vòng thi, đè lên chữ in sẵn trên nền */}
      <div
        className="absolute flex items-center justify-center rounded-t-[22px] border-x-[3px] border-t-[3px] text-[34px] font-extrabold tracking-wide"
        style={{ left: 738, top: 556, width: 186, height: 82, borderColor: GOLD, background: 'linear-gradient(#7a2414,#561409)', color: '#ffd977' }}
      >
        {v.phase === 'cho' ? 'SẮP THI' : v.vongNhan}
      </div>

      {bigBoard ? <BangVang v={v} /> : <BangNho v={v} />}

      {!bigBoard && <DongCau v={v} />}
      {!bigBoard && <KhungCau v={v} />}
      {!bigBoard && <DapAn v={v} />}

      {/* Cách chơi + số người nộp */}
      <div className="absolute text-[30px] font-bold" style={{ left: 170, top: 1290, width: 470 }}>
        Gõ <b className="text-[#8a1c0c]">A, B, C, D</b> vào bình luận
        {v.phase === 'hoi' && <div className="text-[26px] font-semibold opacity-80">{v.soNop} sĩ tử đã nộp bài</div>}
      </div>

      {/* Dải tên vừa nộp bài, trên cuộn giấy dưới */}
      <div className="absolute flex items-center gap-2 overflow-hidden whitespace-nowrap text-[28px] font-semibold" style={{ left: 165, top: 1408, width: 470, height: 52 }}>
        {v.recent.length > 0 && v.phase === 'hoi' && (
          <>
            <span>📜</span>
            <span className="truncate">{v.recent.slice(0, 3).join(', ')}</span>
            <span className="shrink-0 opacity-70">vừa nộp</span>
          </>
        )}
      </div>

      <MC v={v} />
    </div>
  );
}

/** Dòng "CÂU 12/20" + tiến độ 4 vòng + đồng hồ */
function DongCau({ v }: { v: View }) {
  const showTimer = v.phase === 'hoi';
  const low = showTimer && v.con <= 5;
  return (
    <>
      <div className="absolute flex items-center gap-4" style={{ left: 170, top: 568, height: 64 }}>
        <span className="text-[36px] font-extrabold">
          {v.phase === 'cho' ? 'ĐỢI VÁN MỚI' : `CÂU ${Math.min(v.cauSo, v.tongCau)} / ${v.tongCau}`}
        </span>
        <span className="flex gap-1.5">
          {GAME.vong.map((_, i) => (
            <span
              key={i}
              className="h-4 w-9 rounded-full"
              style={{ background: v.phase === 'cho' ? '#c9b28a' : i < v.vong ? '#8a1c0c' : i === v.vong ? GOLD : '#c9b28a' }}
            />
          ))}
        </span>
      </div>
      {showTimer && (
        <motion.div
          key={v.cauSo}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute flex items-center justify-center rounded-full border-[5px] text-[52px] font-extrabold"
          style={{
            left: 600, top: 548, width: 118, height: 118, borderColor: GOLD,
            background: low ? '#b3200c' : '#5a1409', color: '#ffe9a8', boxShadow: '0 6px 18px rgba(0,0,0,.35)',
          }}
        >
          {v.con}
        </motion.div>
      )}
    </>
  );
}

/** Khung câu hỏi (in sẵn trên nền), bên trong đổi theo pha */
function KhungCau({ v }: { v: View }) {
  const box = { left: 192, top: 668, width: 696, height: 362 };
  let body: React.ReactNode;
  if (v.phase === 'cho') {
    body = (
      <div className="text-center">
        <div className="text-[46px] font-extrabold">Ván mới sau {v.con} giây</div>
        <div className="mt-5 space-y-2 text-[30px] font-semibold leading-snug">
          <div>4 kỳ thi · 20 câu · gõ A, B, C, D</div>
          <div>Đúng càng nhanh điểm càng cao</div>
          <div>Sai bị trừ điểm, nghĩ kỹ rồi gõ</div>
        </div>
      </div>
    );
  } else if (v.phase === 'vong') {
    const i = v.vongInfo;
    body = (
      <motion.div key={v.vongTen} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="text-[30px] font-bold opacity-75">Kỳ thi {v.vong + 1} / 4</div>
        <div className="text-[72px] font-extrabold leading-tight text-[#8a1c0c]">{v.vongTen}</div>
        <div className="mt-3 text-[32px] font-semibold">
          {i.cau} câu · {i.giay} giây mỗi câu
        </div>
        <div className="text-[32px] font-semibold">
          Đúng tới <b className="text-[#1e6b2a]">+{i.diem}</b> · Sai <b className="text-[#b3200c]">−{i.tru}</b>
        </div>
      </motion.div>
    );
  } else {
    const kq = v.ketQua;
    body = (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className={`${v.q.length > 90 ? 'text-[42px]' : v.q.length > 55 ? 'text-[48px]' : 'text-[54px]'} font-extrabold leading-snug`}>{v.q}</div>
        {v.phase === 'doc' && <div className="mt-4 text-[28px] font-semibold opacity-70">Nghe quan chủ khảo đọc đề…</div>}
        {kq && (
          <div className="mt-4 text-[30px] font-bold">
            {kq.soDung > 0 ? (
              <>
                {kq.soDung} người đúng · nhanh nhất <span className="text-[#8a1c0c]">{kq.nhanh[0].name}</span> {(kq.nhanh[0].ms / 1000).toFixed(2).replace('.', ',')}s
              </>
            ) : (
              'Chưa ai đúng câu này'
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="absolute flex items-center justify-center px-6" style={box}>
      {body}
    </div>
  );
}

/** 4 ô đáp án. Đang hỏi không hiện tỉ lệ (tránh người vào sau chép theo số đông). */
function DapAn({ v }: { v: View }) {
  if (v.phase === 'cho' || v.phase === 'vong') return null;
  const total = v.counts ? v.counts.reduce((a, b) => a + b, 0) : 0;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const text = v.opts[i];
        const right = v.dung === i;
        const dim = v.dung >= 0 && !right;
        const pct = v.counts && total ? Math.round((v.counts[i] / total) * 100) : 0;
        return (
          <motion.div
            key={`${v.cauSo}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: text ? (dim ? 0.55 : 1) : 0.35, y: 0, scale: right ? 1.04 : 1 }}
            transition={{ delay: text && v.phase === 'hoi' ? i * 0.08 : 0 }}
            className="absolute flex flex-col justify-center rounded-[18px] border-[3px] px-5"
            style={{
              left: i % 2 ? 552 : 165, top: i < 2 ? 1072 : 1180, width: 363, height: 96,
              borderColor: right ? '#7dff9a' : GOLD,
              background: right ? 'linear-gradient(#2f7d3a,#1d5a27)' : 'linear-gradient(#7a2414,#4f1309)',
              color: '#fff1cc',
              boxShadow: right ? '0 0 26px rgba(125,255,154,.75)' : '0 4px 12px rgba(0,0,0,.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[36px] font-extrabold" style={{ color: '#ffd977' }}>
                {'ABCD'[i]}.
              </span>
              <span className={`${(text?.length ?? 0) > 16 ? 'text-[26px]' : 'text-[32px]'} font-bold leading-tight`}>{text ?? '…'}</span>
            </div>
            {v.counts && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/35">
                  <motion.div className="h-full rounded-full" style={{ background: right ? '#9dffb3' : '#ff7a5c' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 text-right text-[22px] font-bold">{pct}%</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </>
  );
}

const crown = (h: number) => (h === 1 ? '👑' : h === 2 ? '🥈' : h === 3 ? '🥉' : `${h}.`);

function Dong({ h, big }: { h: Hang; big?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${big ? 'text-[30px]' : 'text-[27px]'} font-bold leading-[1.25]`}>
      <span className="w-11 shrink-0 text-center">{crown(h.hang)}</span>
      <span className="min-w-0 flex-1 truncate">{h.name}</span>
      <AnimatePresence>
        {h.gain !== 0 && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 text-[22px] font-extrabold"
            style={{ color: h.gain > 0 ? '#1e6b2a' : '#b3200c' }}
          >
            {h.gain > 0 ? `+${h.gain}` : h.gain}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="w-[86px] shrink-0 text-right tabular-nums">{h.diem}</span>
    </div>
  );
}

/** Bảng vàng nhỏ phía trên: top 5 lúc hỏi, top 10 (2 cột) lúc hiện đáp án */
function BangNho({ v }: { v: View }) {
  const two = v.top.length > 5;
  return (
    <div className="absolute" style={{ left: 170, top: 282, width: 740, height: 270 }}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[32px] font-extrabold text-[#8a1c0c]">🏮 BẢNG VÀNG</span>
        <span className="text-[24px] font-semibold opacity-75">{v.soSiTu} sĩ tử</span>
      </div>
      {v.top.length === 0 ? (
        <div className="mt-8 text-center text-[30px] font-semibold opacity-70">Chưa ai ghi danh. Gõ đáp án để lên bảng!</div>
      ) : (
        <div className={two ? 'grid grid-cols-2 gap-x-6' : ''}>
          {v.top.map((h) => (
            <Dong key={h.id} h={h} big={!two} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Bảng vàng lớn: hết mỗi kỳ thi (top 20) và vinh quy (tam khôi + bảng) */
function BangVang({ v }: { v: View }) {
  const vinh = v.phase === 'vinhQuy';
  const [tn, bn, th] = v.top;
  const rest = vinh ? v.top.slice(3) : v.top;
  return (
    <div className="absolute" style={{ left: 165, top: 280, width: 750, height: 1000 }}>
      <div className="text-center text-[44px] font-extrabold text-[#8a1c0c]">
        {vinh ? '🎉 VINH QUY BÁI TỔ 🎉' : `BẢNG VÀNG SAU ${v.vongTen.toUpperCase()}`}
      </div>
      {vinh && tn && (
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="mt-4 text-center">
          <div className="text-[34px] font-bold">Trạng Nguyên</div>
          <div className="text-[64px] font-extrabold leading-tight text-[#b3200c]">👑 {tn.name}</div>
          <div className="text-[30px] font-bold">{tn.diem} điểm</div>
          <div className="mt-3 flex justify-center gap-10 text-[28px] font-bold">
            {bn && <div>Bảng Nhãn<div className="text-[34px] text-[#8a1c0c]">{bn.name}</div></div>}
            {th && <div>Thám Hoa<div className="text-[34px] text-[#8a1c0c]">{th.name}</div></div>}
          </div>
        </motion.div>
      )}
      {vinh && !tn && <div className="mt-24 text-center text-[36px] font-bold">Ván này chưa có sĩ tử nào</div>}
      <div className={`mt-5 grid grid-cols-2 gap-x-6 gap-y-1 ${vinh ? 'border-t-2 border-[#c9a46a] pt-4' : ''}`}>
        {rest.map((h, i) => (
          <motion.div key={h.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Dong h={h} />
            <div className="pl-12 text-[20px] font-semibold opacity-70">{h.danhHieu}</div>
          </motion.div>
        ))}
      </div>
      {!vinh && v.top.length === 0 && <div className="mt-24 text-center text-[34px] font-bold">Chưa ai ghi danh</div>}
      {!vinh && v.phase === 'bangVang' && v.cauSo <= v.tongCau && (
        <div className="absolute inset-x-0 bottom-0 text-center text-[30px] font-bold opacity-80">Người mới vào vẫn kịp thi kỳ sau!</div>
      )}
    </div>
  );
}

/** Ông đồ MC: đổi tư thế theo pha */
function MC({ v }: { v: View }) {
  const pose =
    v.phase === 'vinhQuy' ? 'mung'
    : v.phase === 'dapAn' ? (v.ketQua?.soDung ? 'mung' : 'tiec')
    : v.phase === 'hoi' ? 'suy-nghi'
    : v.phase === 'doc' || v.phase === 'bangVang' ? 'chi'
    : 'cuoi';
  return (
    <div className="pointer-events-none absolute" style={{ left: 640, top: 1240, height: 420 }}>
      <AnimatePresence mode="popLayout">
        <motion.img
          key={pose}
          src={`/assets/nv/mc/${pose}.webp`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ height: 420, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.35))' }}
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}
