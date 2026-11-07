# {TÊN GAME}: ghi chú cho Claude

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\VibeCode\CLAUDE.md` (Claude tự đọc cả hai).
> Khi chủ kênh chốt một quyết định (câu đọc, màu, font, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

{Mô tả game trong 2–3 câu: người xem làm gì, quà làm gì, tim làm gì.}

## Luật chơi

- Tham gia: gõ {từ khóa}
- Comment: {…}
- Quà: {…}
- Tim: đủ {số} tim thì {…}

## File của game này

- `src/game/config.ts`: số liệu, câu đọc, từ khóa. Sửa nhỏ thì sửa ở đây trước.
- `src/game/useGame.ts`: luật chơi (xử lý chat, quà, tim, người vào).
- `src/game/GameStage.tsx`: màn hình trên live, khung 1080×1920.
- `src/game/…`: thêm component riêng của game ở đây.
- `src/live/`, `server.ts`: phần chung lấy từ `_base`, hạn chế sửa.

## Quyết định của chủ kênh

- {ví dụ: Font Lora. Nền public/assets/bg/xxx.webp.}
- {ví dụ: Câu chào: "..." giữ nguyên chữ.}
