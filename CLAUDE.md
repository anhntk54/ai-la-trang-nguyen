# Ai Là Trạng Nguyên: ghi chú cho Claude

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\01_Projects\VibeCode\CLAUDE.md`.
> Khi chủ kênh chốt một quyết định (câu đọc, màu, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

Game show trắc nghiệm cho TikTok LIVE theo không khí khoa cử xưa. Ông đồ cầm mic làm quan chủ khảo, người xem gõ A, B, C, D vào bình luận. Một ván 20 câu qua 4 kỳ thi, cuối ván 3 người cao điểm nhất đỗ Trạng Nguyên, Bảng Nhãn, Thám Hoa. Lấy cảm hứng từ Ai là triệu phú nhưng không dùng tên, giao diện, nhạc hay câu thoại của show đó.

## Luật chơi

- Ai cũng chơi được, không cần gõ từ khoá tham gia. Gõ đáp án là có tên trong trường thi.
- 4 kỳ thi, mỗi kỳ 5 câu (`GAME.vong` trong config.ts):
  Khảo hạch trường làng 10 giây +100 / −50 · Thi Hương 15 giây +200 / −100 · Thi Hội 20 giây +300 / −150 · Thi Đình 25 giây +500 / −250.
- Mỗi kỳ: 4 câu viết sẵn + 1 câu toán tự sinh ở vị trí thứ 3 (khó dần: cộng trừ 2 chữ số, nhân/cộng số lớn, nhân 2 chữ số/chia, phép tính 2 bước). Thi Đình: 2 câu [dinh] + 2 câu đố mẹo [meo] + 1 toán.
- Điểm tốc độ: đúng ngay giây đầu được tối đa, sát giờ được 50% (`diemSan`). Tính theo giờ TikTok gắn lúc gửi (`createTime`), không theo lúc server nhận.
- Sai bị trừ nửa điểm tối đa của kỳ; tổng điểm không xuống dưới 0. Không trả lời thì 0 điểm.
- Đúng liền 3 câu thì +100 (`chuoiMoi`, `chuoiThuong`); sai hoặc bỏ câu thì chuỗi tính lại.
- Mỗi người chỉ tính lần trả lời đầu tiên của câu. Nhận "a", "C.", "đáp án b", "chọn D", "câu c".
- Quan chủ khảo đọc xong đề và 4 đáp án thì 4 ô mới hiện và mới tính giờ. Gửi trước lúc hiện quá 0,5 giây thì không tính, không mất lượt.
- Đang hỏi không hiện tỉ lệ từng đáp án (tránh người vào sau chép số đông), chỉ hiện số người đã nộp. Tỉ lệ hiện lúc công bố đáp án.
- Bằng điểm: ai có tổng thời gian trả lời đúng ngắn hơn xếp trên, rồi tới ai vào trước.
- Danh hiệu theo hạng: 1 Trạng Nguyên, 2 Bảng Nhãn, 3 Thám Hoa, 4-10 Tiến sĩ, 11-15 Cử nhân, 16-20 Tú tài.
- Hết mỗi kỳ thi hiện Bảng vàng top 20 (9 giây, "Người mới vào vẫn kịp thi kỳ sau"). Hết ván: màn Vinh quy bái tổ 15 giây, rồi đếm ngược 15 giây sang ván mới (game tự chạy cả buổi).
- Quà KHÔNG cho lợi thế gì trong game (TikTok cấm khuyến khích tặng quà), chỉ cảm ơn.
- Một ván khoảng 11-12 phút (ước lượng, chưa đo trên live).

## File

- `src/game/thi.ts`: lõi luật chơi (không React). Test: `npx tsx src/game/thi.check.ts`.
- `src/game/config.ts`: số liệu + lời quan chủ khảo (`GAME.loi`).
- `src/game/useGame.ts`: nối sự kiện TikTok với lõi, giọng đọc. Trang stage chạy game và gửi ảnh chụp lên `/api/game/state`; trang điều khiển chỉ vẽ lại.
- `src/game/GameStage.tsx`: màn hình 1080x1920 vẽ đè lên `public/assets/bg/nen.jpg`. Toạ độ khung câu hỏi x 165-917, y 642-1059.
- `src/game/sfx.ts`: âm thanh tự tạo kiểu khoa cử (trống chầu mở kỳ, đàn tranh rải khi hiện đáp án, gảy nhỏ khi có người nộp, mõ 5 giây cuối, chiêng công bố, vuốt đàn lên/xuống đúng/không ai đúng, pháo + chiêng vinh quy) và nhạc nền ngũ cung Rê 92 BPM (nhỏ khi ông đồ nói, dồn 5 giây cuối, tắt lúc vinh quy). Bỏ mp3 cùng tên vào public/assets/sfx/ là dùng file thay.
- `src/game/GameControls.tsx`: nút "Bắt đầu ván mới", "Bỏ câu này", giả lập 1 / 60 / 500 người.
- `src/game/cau-hoi/*.txt`: 4975 câu, 14 file theo chủ đề (cách viết: `cau-hoi/HUONG-DAN.md`). Nhóm [de] [vua] [kho] [dinh] [meo]. Kiểm tra: `node tools/kiem-tra-cau-hoi.mjs`. Câu toán do `src/game/toan.ts` tự sinh. Nút "Bỏ câu này" đẩy câu xuống cuối hàng vĩnh viễn (lưu data/da-hoi.json).
- `data/da-hoi.json`: câu nào hỏi lúc nào, game ưu tiên câu lâu chưa hỏi.
- Ông đồ MC: ảnh gốc `public/assets/MC/` (nền trắng), tách nền bằng `node tools/tach-nen.mjs` ra `public/assets/nv/mc/` (mung, suy-nghi, chi, cuoi, tiec).
- Ảnh nền gốc `ai-la-trang-nguyen.png` (1536x2752, đã xoá logo sao Gemini góc phải dưới khi xuất `nen.jpg`).
- Giọng đọc: VieNeu-TTS giọng "Adam bựa" (E:_AIVieNeu-TTS, server cổng 8000, BAT-LIVE tự mở cửa sổ "Giọng VieNeu"). VieNeu tắt hoặc lỗi thì tự dùng giọng Edge NamMinh. Đổi giọng: biến VIENEU_VOICE; để trống = chỉ Edge.
- Cổng **3007** (BAT-LIVE.bat). Link LIVE Studio: http://lvh.me:3007/?view=stage. Thử trong khung preview của Claude: cổng 3507, mở `?view=stage&mute=1` (không phát tiếng).

## Quyết định của chủ kênh

- Tên game "Ai Là Trạng Nguyên", 20 câu, 4 kỳ: Khảo hạch trường làng, Thi Hương, Thi Hội, Thi Đình (2026-11-07).
- Ảnh nền và nhân vật ông đồ do chủ kênh vẽ (2026-11-07).
- Bộ câu hỏi bàn riêng, chưa làm (2026-11-07).
- Màn cuối ván: tiêu đề "Hiền tài là nguyên khí của quốc gia" thay chữ Vinh quy bái tổ (2026-11-07). Tam khôi dùng ảnh public/assets/top/ (tách nền ra public/assets/nv/top/), nam hay nữ cố định theo tên tài khoản.
- Ảnh nữ hạng 2 (Bảng Nhãn) và hạng 3 (Thám Hoa) chủ kênh đã vẽ lại đúng chữ, dùng đủ nam/nữ cho cả tam khôi (2026-11-07).
- Giọng quan chủ khảo: VieNeu "Adam bựa" (2026-11-07).
- Lời ông đồ có cảm xúc (thẻ [cười] [thở dài] [hắng giọng] của VieNeu), đổi theo tỉ lệ đúng: >=75% cười, <30% trêu, 0 người thở dài; đúng trong 2 giây đầu khen thần đồng. Chủ kênh duyệt (2026-11-07).
- Nam/nữ của tam khôi: người chơi gõ "nam"/"nữ" (nhớ cả buổi) > đoán theo tên tiếng Việt (src/game/gioiTinh.ts: Thị = nữ, Văn = nam, danh sách tên) > cố định theo tài khoản. Màn trao giải có avatar TikTok cạnh tên (2026-11-07).
- Bộ câu hỏi (chủ kênh chốt 2026-11-07): khán giả là người thích kiến thức; bỏ hết câu mượn của Lớp Học Chữ, viết mới; mỗi kỳ 1 câu toán máy tự sinh, khó dần; Thi Đình trộn câu khó và đố mẹo. Không dùng câu đọc lên nghe giống nhau (chính tả, dấu hỏi ngã). Đáp án ngắn (≤ 22 ký tự), lịch sử theo sách giáo khoa, không dùng chi tiết còn tranh cãi. Claude viết từng đợt, chủ kênh duyệt.
- Quà (2026-11-07): băng rôn cảm ơn đè lên biển tên game phía trên (không che câu hỏi): avatar, tên, "tặng N × món quà". Quà nhỏ 4 giây nền đỏ + tiếng đàn; quà từ 99 xu 8 giây nền vàng + pháo giấy + tiếng pháo, chen lên trước. Cùng người tặng liên tục thì gộp; hàng chờ tối đa 6. Quà KHÔNG cho lợi thế trong game. Lõi: `KyThi.tangQua`.
- Bảng vàng tuần (2026-11-07): hết mỗi ván cộng điểm vào data/bang-tuan.json (tuần tính từ thứ Hai, sang tuần mới tự làm lại; server chặn điểm 1 ván quá 20.000). Hiện top 10 lúc đếm ngược chờ ván mới; ông đồ thỉnh thoảng nhắc tên người dẫn đầu tuần.
