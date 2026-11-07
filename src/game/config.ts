// =====================================================
//  CẤU HÌNH GAME "AI LÀ TRẠNG NGUYÊN" - thay đổi nhỏ chỉ cần sửa file này
//  Câu đọc: `name` = tên người xem (đã làm sạch), `kenh` = tên kênh (ô "Tên kênh" ở trang điều khiển)
// =====================================================

import type { WishTopic } from '../live/chatter';

export type Level = 'de' | 'vua' | 'kho' | 'chuong' | 'phu';

export interface Vong {
  ten: string; // đọc + hiện ở bảng
  nhan: string; // nhãn ngắn trên tab
  cau: number; // số câu
  giay: number; // thời gian trả lời mỗi câu
  diem: number; // điểm tối đa khi đúng ngay giây đầu
  levels: Level[]; // nhóm câu trong trac-nghiem.txt, lấy lần lượt
}

export const GAME = {
  title: 'Ai Là Trạng Nguyên',
  defaultChannelName: 'kênh mình',

  // ---------- Luật thi: 4 vòng, 20 câu ----------
  vong: [
    { ten: 'Khảo hạch trường làng', nhan: 'KHẢO HẠCH', cau: 5, giay: 10, diem: 100, levels: ['de'] },
    { ten: 'Thi Hương', nhan: 'THI HƯƠNG', cau: 5, giay: 15, diem: 200, levels: ['vua'] },
    { ten: 'Thi Hội', nhan: 'THI HỘI', cau: 5, giay: 20, diem: 300, levels: ['kho'] },
    { ten: 'Thi Đình', nhan: 'THI ĐÌNH', cau: 5, giay: 25, diem: 500, levels: ['chuong', 'kho'] },
  ] as Vong[],
  saiTru: 0.5, // sai bị trừ nửa điểm tối đa của vòng; tổng điểm không xuống dưới 0
  diemSan: 0.5, // đúng sát giờ vẫn được 50% điểm tối đa
  chuoiMoi: 3, // đúng liền 3 câu thì thưởng
  chuoiThuong: 100,
  earlySendGraceMs: 500, // gửi trước lúc hiện đáp án quá 0,5 giây thì không tính (không mất lượt)

  // ---------- Nhịp (giây) ----------
  choSec: 15, // đếm ngược trước ván mới
  vongSec: 5, // bảng giới thiệu vòng
  docMaxSec: 25, // giọng đọc đề hỏng thì tối đa chừng này giây là tự hiện đáp án
  dapAnSec: 7,
  bangVangSec: 9, // hết mỗi vòng hiện top 20
  vinhQuySec: 15,

  // Danh hiệu theo hạng trong ván
  danhHieu: (hang: number) =>
    hang === 1 ? 'Trạng Nguyên'
    : hang === 2 ? 'Bảng Nhãn'
    : hang === 3 ? 'Thám Hoa'
    : hang <= 10 ? 'Tiến sĩ'
    : hang <= 15 ? 'Cử nhân'
    : hang <= 20 ? 'Tú tài'
    : 'Sĩ tử',

  // ---------- Lời quan chủ khảo ----------
  loi: {
    cho: [
      'Ván mới sắp bắt đầu. Ai muốn đỗ Trạng thì chuẩn bị gõ A, B, C hoặc D vào bình luận nhé.',
      'Trường thi sắp mở cửa. Mọi người gõ A, B, C hoặc D để trả lời, đúng càng nhanh điểm càng cao.',
    ],
    vong: [
      'Khảo hạch trường làng bắt đầu. Năm câu dễ, mỗi câu mười giây. Gõ A, B, C hoặc D vào bình luận.',
      'Qua được làng rồi, giờ lên thi Hương. Câu khó hơn, mỗi câu mười lăm giây.',
      'Vào thi Hội. Từ đây sai một câu là mất kha khá điểm đấy, nghĩ kỹ rồi hãy gõ.',
      'Thi Đình, năm câu cuối cùng. Mỗi câu tối đa năm trăm điểm, ai đỗ Trạng sẽ có ngay sau đây.',
    ],
    dapAn: (chu: string, dap: string) => `Đáp án ${chu}, ${dap}.`,
    dungNhieu: [
      (n: number, name: string) => `${n} người trả lời đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `Có ${n} người đúng. ${name} bấm nhanh nhất câu này.`,
    ],
    dungMot: (name: string) => `Chỉ một mình ${name} trả lời đúng.`,
    khongAi: ['Câu này chưa ai trả lời đúng.', 'Câu này làm khó cả trường thi rồi.'],
    bangVang: (vong: string, name: string) => `Hết ${vong}. Đang đứng đầu bảng vàng là ${name}.`,
    bangVangTrong: (vong: string) => `Hết ${vong}.`,
    vinhQuy: (tn: string, bn?: string, th?: string) =>
      `Xin chúc mừng ${tn} đỗ Trạng Nguyên!` +
      (bn ? ` Bảng Nhãn là ${bn}.` : '') +
      (th ? ` Thám Hoa là ${th}.` : '') +
      ' Vinh quy bái tổ thôi!',
    khongAiThi: 'Ván này chưa có sĩ tử nào. Ván sau mọi người vào thi cùng nhé.',
  },

  // ---------- Chào người vào ----------
  greetEveryMs: 8000,
  namesPerGreeting: 3,
  greeting: (names: string) => `Chào ${names} vào trường thi.`,

  // ---------- Cảm ơn quà (quà KHÔNG cho lợi thế gì trong game) ----------
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 99,
  thankGift: (name: string, gift: string, kenh: string) => `${kenh} cảm ơn ${name} đã tặng ${gift}.`,
  giftWishes: ['Chúc bạn thi đâu đỗ đó.', 'Chúc bạn một ngày thật vui.', 'Chúc bạn làm gì cũng suôn sẻ nha.'],

  thankFollow: (name: string, kenh: string) => `${kenh} cảm ơn ${name} đã theo dõi kênh nha.`,

  // Comment có lời cầu chúc: đọc 1 câu chúc soạn sẵn, KHÔNG BAO GIỜ đọc nguyên văn comment
  wishPerUserMs: 10 * 60_000,
  wishGlobalMs: 20_000,
  wishReplies: {
    exam: [
      (name: string) => `Chúc ${name} ôn bài vô đầu, vào phòng thi thật bình tĩnh.`,
      (name: string) => `Chúc ${name} học đâu nhớ đó, thi đâu đỗ đó.`,
    ],
    health: [(name: string) => `Chúc ${name} với người nhà mau khỏe, ăn ngon ngủ yên.`],
    love: [(name: string) => `Chúc ${name} sớm gặp người thương mình thật lòng.`],
    family: [(name: string) => `Chúc nhà ${name} luôn êm ấm, ai cũng khỏe.`],
    work: [(name: string) => `Chúc ${name} công việc thuận lợi, sớm được như ý.`],
    wealth: [(name: string) => `Chúc ${name} làm ăn phát đạt, tiền vô đều tay.`],
    peace: [(name: string) => `Chúc ${name} mọi chuyện bình an, thuận lợi.`],
  } as Record<WishTopic, ((name: string) => string)[]>,

  // Nhắc chia sẻ live mỗi 5 phút
  shareReminderEveryMs: 5 * 60_000,
  shareLines: [
    'Ai thấy vui thì bấm chia sẻ live, rủ bạn bè vào thi cùng nha.',
    'Rủ thêm bạn vào thi cho đông, bấm chia sẻ live giúp kênh nhé.',
  ],
};
