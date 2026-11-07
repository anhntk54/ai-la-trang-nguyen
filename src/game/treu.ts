// Ông đồ trêu / đáp bình luận vào khoảng lặng.
// KHÔNG BAO GIỜ đọc nguyên văn bình luận: chỉ nhận ra LOẠI bình luận rồi nói câu soạn sẵn có chèn tên.
import { plain } from './thi';

export type LoaiCmt = 'kho' | 'de' | 'chao' | 'goiY' | 'cuoi' | 'yeu' | 'sai';

// so trên chữ đã bỏ dấu, bỏ khoảng trắng; câu ngắn (≤ 24 ký tự) mới tính để khỏi hiểu nhầm câu dài
const MAU: [LoaiCmt, RegExp][] = [
  ['kho', /^(khoqua|khothe|khovay|khoghe|khoqa|khoaiqua|botay|chiu|chiuthua|bitroi|khongbiet|kobiet|kbiet|hoikho)/],
  ['de', /^(dequa|dethe|dexiu|ez|easy|quade|dongian)$/],
  ['chao', /^(chao(ongdo|thay|bac|canha|moinguoi)?|xinchao\w*|hello\w*|hi|alo|helo)$/],
  ['goiY', /(goiy|cuutoi|cuuem|help|nhacbai|xingoiy)/],
  ['cuoi', /^(haha|hihi|hehe|kkk|kaka|hjhj|keke)/],
  ['yeu', /^(yeuongdo|thichongdo|ongdodeuqua|ongdovuiqua|hayqua|vuiqua|gamehay)/],
];

export function loaiCmt(comment: string): LoaiCmt | null {
  const p = plain(comment);
  if (!p || p.length > 24) return null;
  for (const [loai, re] of MAU) if (re.test(p)) return loai;
  return null;
}

/**
 * Hàng chờ câu trêu: mỗi người tối đa 1 lần / 3 phút, giữ 3 câu mới nhất.
 * Chỉ nói khi giọng đang rảnh (do useGame quyết định), tối đa 1 câu / 12 giây.
 */
export class Treu {
  private lan = new Map<string, number>();
  private cho: { id: string; name: string; loai: LoaiCmt; at: number }[] = [];
  private lanCuoi = -Infinity;
  constructor(private moiNguoiMs = 180_000, private cachMs = 12_000) {}

  them(id: string, name: string, loai: LoaiCmt, now: number) {
    if (now - (this.lan.get(id) ?? -Infinity) < this.moiNguoiMs) return;
    if (this.cho.some((x) => x.id === id)) return;
    this.cho.push({ id, name, loai, at: now });
    if (this.cho.length > 3) this.cho.shift();
  }

  /** Lấy 1 câu để nói nếu đã đủ giãn cách; bỏ câu cũ hơn 30 giây (chuyện đã qua) */
  lay(now: number) {
    if (now - this.lanCuoi < this.cachMs) return null;
    this.cho = this.cho.filter((x) => now - x.at < 30_000);
    const x = this.cho.pop();
    if (!x) return null;
    this.lanCuoi = now;
    this.lan.set(x.id, now);
    return x;
  }
}
