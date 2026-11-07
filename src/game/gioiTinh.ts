// Đoán nam / nữ từ tên hiển thị (TikTok không cho biết giới tính).
// Chỉ để chọn ảnh nhân vật cho vui; người chơi gõ "nam" / "nữ" thì theo ý họ.
export type Gioi = 'nam' | 'nu';

// Tên bỏ dấu. Tên dùng cho cả hai giới (anh, an, khanh, thanh, tu...) hoặc trùng khi bỏ dấu
// (Vân/Văn, Dung/Dũng, Tiên/Tiến) thì không đưa vào.
const NU = new Set(
  ('lan hoa huong mai linh trang thao ngoc hanh phuong thu ha hang nga nhung yen vy vi my nhi trinh quyen oanh uyen chi ' +
    'hien hue huyen loan ly nhu diep tram tuyet xuan thuy ngan kieu cuc dao hong nhien suong bich cam diem duyen giao ' +
    'thoa tham thuong tra le nguyet nhan tho thom').split(' '),
);
const NAM = new Set(
  ('tuan hung nam long hai son quang duc huy khang khoa kien phong phuc quan quoc tai thang thinh tri trung tung vinh vu bao ' +
    'cuong dat dang dinh hieu hoang luan manh nghia nhat phat sang toan truong viet loc hiep khai khiem kiet lap thuan cong ' +
    'chien chinh duy hao tuong khoi kha bach').split(' '),
);

/** "Minh_Tuan", "lan anh 🌸", "NguyenThiHoa99" -> các từ không dấu */
function tach(name: string): string[] {
  return name
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** Đoán theo tên; không chắc thì trả về null */
export function doanGioi(name: string): Gioi | null {
  let diem = 0;
  for (const w of tach(name)) {
    if (w === 'thi') diem += 3;
    else if (w === 'van') diem -= 3;
    else if (NU.has(w)) diem += 1;
    else if (NAM.has(w)) diem -= 1;
  }
  return diem > 0 ? 'nu' : diem < 0 ? 'nam' : null;
}

/** Bình luận "nam", "nữ", "con trai", "con gái" -> lựa chọn của người chơi */
export function lenhGioi(comment: string): Gioi | null {
  const w = tach(comment).join('');
  if (w === 'nam' || w === 'contrai' || w === 'trai') return 'nam';
  if (w === 'nu' || w === 'congai' || w === 'gai') return 'nu';
  return null;
}
