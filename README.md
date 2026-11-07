# Ai Là Trạng Nguyên

Game show đố vui cho **TikTok LIVE**, theo không khí khoa cử ngày xưa. Ông đồ cầm mic đọc câu hỏi và 4 đáp án, người xem gõ **A, B, C hoặc D** vào bình luận. Mỗi ván 20 câu qua 4 kỳ thi: khảo hạch trường làng, thi Hương, thi Hội, thi Đình. Hết ván, ba người điểm cao nhất đỗ Trạng Nguyên, Bảng Nhãn, Thám Hoa và được vinh danh trên màn hình.

Game chạy trên máy tính của bạn, gắn vào TikTok LIVE Studio như một nguồn Link. Không cần biết lập trình, chỉ cần làm theo các bước bên dưới.

## Game có gì

- **Gần 5.000 câu hỏi tiếng Việt** chia 14 chủ đề: lịch sử Việt Nam, địa lý, văn học, ca dao tục ngữ, khoa học, sức khoẻ, động thực vật, văn hoá ẩm thực, thế giới, phát minh, nghệ thuật, thể thao, khoa cử và danh nhân, đố mẹo. Câu khó dần theo kỳ thi. Mỗi kỳ có thêm một câu toán nhẩm máy tự ra nên không bao giờ hết.
- **Điểm theo tốc độ**: đúng càng nhanh điểm càng cao, sai bị trừ. Tốc độ tính theo giờ TikTok ghi lúc người xem bấm gửi, không phụ thuộc mạng chậm hay nhanh. Câu cuối ván điểm nhân đôi.
- **Thi đua 3 miền**: gõ Bắc, Trung hoặc Nam để vào phe, điểm cả phe cộng dồn.
- **Cứu trợ bằng tim**: ở thi Đình, cả phòng thả đủ tim thì ông đồ loại 2 đáp án sai.
- **Bảng vàng** sau mỗi kỳ, **bảng vàng tuần** cộng điểm nhiều ván, dấu 🏆 🎓 🔥 cạnh tên người chơi giỏi.
- **Ông đồ biết nói chuyện**: đọc đề, công bố đáp án có cười có thở dài, trêu người than khó, hô tên người vừa vượt lên dẫn đầu, cảm ơn quà theo từng món. Ông **không bao giờ đọc nguyên văn bình luận**, chỉ dùng câu soạn sẵn có chèn tên, nên không ai bắt ông nói bậy được.
- **Quà**: băng rôn có avatar và tên người tặng, quà từ 99 xu có pháo giấy. Quà **không cho lợi thế gì trong game**, đúng quy định TikTok.
- **Âm thanh tự tạo**: nhạc nền đàn tranh, trống dồn lúc hết giờ, chiêng lúc công bố, pháo lúc vinh quy. Không dùng nhạc có bản quyền.
- **Chạy cả buổi**: hết ván tự sang ván mới; mất kết nối TikTok thì tự kết nối lại.

## Cần chuẩn bị

1. Máy tính **Windows 10 hoặc 11**, có mạng.
2. **TikTok LIVE Studio** và tài khoản được phép phát trực tiếp.
3. **Node.js** bản LTS (bản 20 trở lên). Chỉ cài một lần.

## Cài đặt từng bước

### Bước 1: Cài Node.js

1. Vào [nodejs.org](https://nodejs.org), bấm nút tải bản **LTS**.
2. Mở file vừa tải, bấm Next tới hết, giữ nguyên các lựa chọn mặc định.
3. Cài xong thì khởi động lại máy cho chắc.

### Bước 2: Tải game về máy

Cách dễ nhất:

1. Trên trang GitHub này, bấm nút xanh **Code**, chọn **Download ZIP**.
2. Giải nén file ZIP ra một thư mục, ví dụ `D:\ai-la-trang-nguyen`. Đường dẫn nên ngắn và không có dấu tiếng Việt.

Nếu bạn đã dùng Git:

```bash
git clone https://github.com/workaipvlinh-byte/ai-la-trang-nguyen.git
```

### Bước 3: Chạy game

1. Mở thư mục game, **bấm đúp `BAT-LIVE.bat`**.
2. **Lần đầu** máy sẽ tự cài thư viện, mất khoảng 1 đến 3 phút tuỳ mạng. Các lần sau mở ngay.
3. Khoảng 8 giây sau, trình duyệt tự mở **trang điều khiển** ở `http://localhost:3007`.
4. **Để cửa sổ đen của BAT-LIVE mở suốt buổi live.** Đóng cửa sổ đó là tắt game.

### Bước 4: Gắn game vào TikTok LIVE Studio

1. Mở TikTok LIVE Studio, chọn bố cục **dọc**.
2. Thêm nguồn (Add source), chọn **Link** (hoặc Trình duyệt).
3. Dán địa chỉ: `http://lvh.me:3007/?view=stage`
4. Đặt kích thước **1080 × 1920**, kéo cho kín khung hình.

Phải dùng `lvh.me` chứ không dùng `localhost`, vì LIVE Studio không nhận chữ localhost. `lvh.me` vẫn trỏ về chính máy bạn.

### Bước 5: Lên live và kết nối

1. Bấm **Phát trực tiếp** trong LIVE Studio trước.
2. Trên trang điều khiển, nhập **tên TikTok** của bạn (phần sau chữ @), bấm **Kết nối**.
3. Thấy chữ "Đã kết nối" là xong. Game tự đếm ngược và bắt đầu ván đầu tiên.

Server nhớ tài khoản này. Lần sau mở BAT-LIVE là nó tự kết nối lại. Muốn đổi tài khoản thì bấm **Ngắt** rồi nhập tên mới.

### Chưa live mà muốn thử

Trên trang điều khiển có các nút **Giả lập 1 người / 60 người / 500 người**. Bấm lúc màn hình đang hiện 4 đáp án để xem game chạy thế nào. Trang điều khiển có ô xem trước, không phát tiếng.

## Người xem gõ gì

| Gõ vào bình luận | Tác dụng |
|---|---|
| `A`, `b`, `C.`, `đáp án d`, `chọn a` | Trả lời câu hỏi. Chỉ tính lần gõ đầu tiên của mỗi câu, chữ hoa chữ thường đều được |
| `Bắc`, `Trung`, `Nam` (hoặc `miền Bắc`, `nam bộ`) | Vào phe thi đua 3 miền |
| `trai`, `gái` (hoặc `con trai`, `con gái`, `nữ`) | Chọn nhân vật nam hay nữ khi đỗ tam khôi. Không gõ thì game tự đoán theo tên |
| Thả tim | Ở thi Đình, đủ 200 tim trong một câu thì loại 2 đáp án sai |
| `khó quá`, `dễ quá`, `chào ông đồ`, `haha`... | Ông đồ có thể trêu lại vào lúc rảnh |

Đáp án gõ **lúc ông đồ còn đang đọc đề** (4 ô chưa hiện) thì không tính. Người chơi không mất lượt, gõ lại sau khi 4 ô hiện ra là được.

## Nút trên trang điều khiển

- **Bắt đầu ván mới ngay**: bỏ qua phần đếm ngược.
- **Bỏ câu này**: gặp câu sai hoặc câu gây cãi thì bấm. Câu đó bị bỏ qua và không bao giờ được hỏi lại.
- **Đọc ngay**: gõ một câu để ông đồ đọc (ví dụ thông báo giờ live sau).
- **Tốc độ giọng**, **Tên kênh**: tuỳ chỉnh giọng đọc và tên kênh ông đồ nhắc tới.

## Giọng đọc

**Mặc định** game dùng giọng nam **Edge (NamMinh)**: miễn phí, chỉ cần có mạng, không phải cài gì thêm. Edge lỗi thì game tự chuyển sang giọng Google.

**Muốn giọng "Adam bựa" có cười, thở dài** như bản của tác giả, bạn cài thêm [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS), bộ đọc tiếng Việt mã nguồn mở chạy ngay trên máy:

1. Cài VieNeu-TTS theo hướng dẫn trong repo của họ. Máy có card NVIDIA sẽ đọc nhanh; máy chỉ có CPU vẫn chạy được nhưng chậm hơn.
2. Mở `BAT-LIVE.bat` bằng Notepad, sửa dòng `set VIENEU_DIR=E:\02_AI\VieNeu-TTS` thành thư mục bạn đã cài.
3. Lưu lại, bấm đúp BAT-LIVE như bình thường. Nó sẽ tự mở thêm cửa sổ "Giọng VieNeu". Đang live thì đừng tắt cửa sổ đó.

VieNeu tắt hoặc lỗi giữa chừng thì game tự quay về giọng Edge, ông đồ không bị câm.

## Tự chỉnh game

Các file bạn hay sửa nhất đều mở được bằng Notepad. Sửa xong thì làm mới trang stage trong LIVE Studio (chuột phải vào nguồn, chọn Làm mới).

- **Câu hỏi**: `src/game/cau-hoi/*.txt`, mỗi chủ đề một file. Mỗi dòng một câu:
  ```
  câu hỏi | ĐÁP ÁN ĐÚNG | sai | sai | sai
  ```
  Đáp án đúng luôn để ở vị trí thứ hai, game tự xáo A B C D. Dòng `[de]`, `[vua]`, `[kho]`, `[dinh]`, `[meo]` là nhóm độ khó (khảo hạch, thi Hương, thi Hội, thi Đình, đố mẹo). Quy tắc viết câu có ở `src/game/cau-hoi/HUONG-DAN.md`. Viết xong chạy `node tools/kiem-tra-cau-hoi.mjs` để soát lỗi.
- **Lời ông đồ, số liệu luật chơi**: `src/game/config.ts`. Mọi câu ông đồ nói, thời gian từng kỳ, điểm, số tim cứu trợ... đều ở đây.
- **Ảnh**: nền ở `public/assets/bg/nen.jpg` (1080 × 1920). Ảnh ông đồ gốc ở `public/assets/MC/`, ảnh tam khôi ở `public/assets/top/`. Thay ảnh xong chạy `node tools/tach-nen.mjs` để tách nền trắng.

## Gặp lỗi thì sao

- **Không nghe tiếng ông đồ**: nếu mở trang stage bằng Chrome để thử, bấm vào trang một lần (Chrome chặn tự phát tiếng tới lúc bạn bấm). Trong LIVE Studio thì không bị chặn.
- **Nghe hai giọng chồng nhau**: bạn đang mở trang stage ở hai chỗ. Game chỉ cho trang mở sau cùng phát tiếng, nhưng tốt nhất chỉ mở trong LIVE Studio.
- **Không kết nối được TikTok**: phải bấm Phát trực tiếp trong LIVE Studio trước rồi mới kết nối. Server sẽ tự thử lại 15 giây, 30 giây, 1 phút, tối đa 2 phút một lần.
- **Cửa sổ BAT báo cổng 3007 đang bận**: đang có một bản game khác chạy. Đóng hết cửa sổ BAT-LIVE cũ rồi mở lại.
- **Gặp câu hỏi sai**: bấm "Bỏ câu này" ở trang điều khiển. Bộ câu do AI viết rồi soát lại, gần 5.000 câu nên khó tránh sót vài câu.

## Cho người biết code

- Node.js + TypeScript. Server `server.ts` (Express), giao diện React 19 + Vite + Tailwind 4, hiệu ứng `motion`, kết nối TikTok bằng `tiktok-live-connector` 2.x.
- Lõi luật chơi: `src/game/thi.ts` (không phụ thuộc React). Kiểm tra: `npx tsx src/game/thi.check.ts`.
- Màn hình 1080 × 1920: `src/game/GameStage.tsx`. Âm thanh tự tạo bằng Web Audio: `src/game/sfx.ts`.
- Server chỉ nghe `127.0.0.1`, người cùng mạng Wi-Fi không điều khiển được.
- Cổng 3007, đổi được bằng biến `PORT`.

## Giấy phép

Mã nguồn dùng giấy phép [MIT](LICENSE). Ảnh ông đồ, ảnh tam khôi và ảnh nền (`public/assets/`, `ai-la-trang-nguyen.png`) thuộc về tác giả. Muốn dùng cho kênh của mình thì nên thay bằng ảnh riêng.

Game lấy cảm hứng từ các game show đố vui trên truyền hình nhưng không dùng tên, giao diện, nhạc hay câu thoại của chương trình nào.
