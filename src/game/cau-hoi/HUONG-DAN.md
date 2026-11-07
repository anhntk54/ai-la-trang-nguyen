# Hướng dẫn viết câu hỏi cho "Ai Là Trạng Nguyên"

Game show trắc nghiệm trên TikTok LIVE. Ông đồ (giọng máy) **đọc to câu hỏi và cả 4 đáp án**, người xem gõ A/B/C/D vào bình luận. Khán giả là **người Việt thích kiến thức**. Mỗi ván 20 câu qua 4 kỳ thi.

## Định dạng file

Mỗi file 1 chủ đề, mã hoá UTF-8. Dòng `#` là ghi chú. Dòng `[nhóm]` đổi nhóm. Mỗi câu 1 dòng:

```
câu hỏi | ĐÁP ÁN ĐÚNG | sai | sai | sai
```

Luôn ghi đáp án đúng ở vị trí thứ 2 (game tự xáo A B C D). Không đánh số câu.

## Nhóm (độ khó)

- `[de]` Khảo hạch trường làng, 10 giây: kiến thức phổ thông ai học hết cấp 2 cũng biết, đọc là trả lời được ngay.
- `[vua]` Thi Hương, 15 giây: người hay đọc sách, xem tin tức mới chắc chắn.
- `[kho]` Thi Hội, 20 giây: phải thật sự có kiến thức, đáp án sai rất "na ná" đáp án đúng.
- `[dinh]` Thi Đình, 25 giây: khó nhất. Khoa cử xưa, danh nhân, chi tiết sâu nhưng có thật và chắc chắn.
- `[meo]` Đố mẹo ở Thi Đình: chơi chữ, lừa logic, câu đố dân gian. Đáp án phải rõ ràng, ai nghe giải thích cũng gật gù, không gây cãi nhau.

## Luật bắt buộc

1. **Đúng sự thật là quan trọng nhất.** Chỉ viết điều chắc chắn ≥ 99%, có trong sách giáo khoa hoặc kiến thức phổ biến đã kiểm chứng. Không chắc thì bỏ, đừng đoán. Lịch sử Việt Nam theo sách giáo khoa; không dùng chi tiết còn tranh cãi giữa các nguồn (tác giả còn tranh cãi, năm tháng các sách ghi khác nhau, truyền thuyết bị hỏi như sự thật).
2. **Không hỏi điều thay đổi theo thời gian:** dân số, kỷ lục, "lớn nhất hiện nay", người đương nhiệm, giá cả, xếp hạng. Không dùng chữ "hiện nay", "mới nhất".
3. **Không hỏi "địa danh X thuộc tỉnh nào"**: Việt Nam sáp nhập tỉnh từ 1/7/2025, dễ sai. Hỏi về núi, sông, vịnh, danh thắng, vùng miền thì được.
4. **Toàn tiếng Việt.** Không có câu thuần tiếng Anh, không hỏi "từ tiếng Anh nghĩa là gì". Tên riêng nước ngoài viết như sách báo Việt Nam hay dùng (Niu Di-lân hoặc New Zealand đều được, Isaac Newton, Ai Cập...).
5. **Đọc to vẫn phân biệt được:** 4 đáp án phải nghe khác nhau rõ khi đọc thành tiếng. Cấm câu chính tả, dấu hỏi/ngã, câu chỉ khác nhau một dấu thanh.
6. **Ngắn:** câu hỏi ≤ 100 ký tự, mỗi đáp án ≤ 22 ký tự. Không ký hiệu (%, ×, ÷, =, <, >); viết "phần trăm", "nhân"... Số thì viết chữ số bình thường.
7. **Đáp án sai hợp lý:** cùng loại với đáp án đúng (cùng là năm, cùng là tên vua, cùng là tỉnh...), không có đáp án ngớ ngẩn. Không dùng "Tất cả đều đúng", "Cả A và B".
8. **Không nhảm:** không câu tục, không chính trị gây tranh cãi, không tôn giáo nhạy cảm, không người nổi tiếng còn sống dễ đổi thông tin, không trend mạng.
9. **Mỗi câu một ý khác nhau.** Không lặp cùng một sự kiện bằng hai cách hỏi trong cùng file.
10. Câu viết tự nhiên như người Việt hỏi nhau, không văn dịch.

## Ví dụ

```
[de]
Đại dương nào lớn nhất thế giới? | Thái Bình Dương | Đại Tây Dương | Ấn Độ Dương | Bắc Băng Dương
"Ăn quả nhớ kẻ ..." - từ còn thiếu là gì? | trồng cây | hái quả | bán quả | tưới cây
[vua]
Đỉnh núi cao nhất Việt Nam là đỉnh nào? | Phan Xi Păng | Ngọc Linh | Bạch Mã | Bà Đen
Kim tự tháp Giza nằm ở nước nào? | Ai Cập | Mexico | Hy Lạp | Ấn Độ
[kho]
Vua nào dời đô từ Hoa Lư ra Thăng Long năm 1010? | Lý Thái Tổ | Lý Thánh Tông | Lê Đại Hành | Trần Thái Tông
Kim loại nào ở thể lỏng ở nhiệt độ phòng? | Thủy ngân | Chì | Thiếc | Nhôm
[dinh]
Văn Miếu ở Thăng Long được xây dưới triều vua nào? | Lý Thánh Tông | Lý Thái Tổ | Lý Nhân Tông | Trần Nhân Tông
Người đỗ đầu kỳ thi Hương ngày xưa gọi là gì? | Giải nguyên | Hội nguyên | Đình nguyên | Bảng nhãn
[meo]
Cái gì càng lau càng ướt? | Cái khăn lau | Mặt bàn | Sàn nhà | Tấm gương
Bố mẹ có 6 con trai, mỗi người con trai có một em gái. Nhà đó có mấy người con? | 7 | 12 | 6 | 13
```

## Kiểm tra

Viết xong chạy `node tools/kiem-tra-cau-hoi.mjs src/game/cau-hoi/<file>.txt` và sửa hết lỗi.
