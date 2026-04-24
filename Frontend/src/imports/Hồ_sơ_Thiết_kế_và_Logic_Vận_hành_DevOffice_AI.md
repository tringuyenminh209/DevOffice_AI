# Hồ sơ Thiết kế và Logic Vận hành DevOffice AI


---
*Trang 1 / 3*

Hồ sơ Thiết kế và Logic Vận hành Tổng
thể DevOffice AI
Tài liệu này là "Single Source of Truth" cho toàn bộ giao diện và logic vận hành của DevOffice
AI, kết hợp giữa định hướng thẩm mỹ dành cho CEO và các thông số kỹ thuật cho đội ngũ phát
triển.
1. Phong cách Tổng thể (Visual Concept)
● Chủ đề: "Văn phòng ảo 2D Pixel Art" trên nền "SaaS hiện đại".
● Triết lý: Sự cân bằng giữa tính chính xác kỹ thuật và trực quan sinh động.
● Bảng màu:
○ Chủ đạo (Primary): Xanh Navy đậm (#0F172A) – Tin cậy, doanh nghiệp.
○ Hành động (Action): Xanh lục Neon (Thành công), Vàng Hổ phách (Chờ duyệt), Đỏ
Crimson (Lỗi).
○ Nền: Xám nhạt hoặc Dark Mode sâu để làm nổi bật nhân vật Pixel.
2. Thiết kế Nhân vật & Hoạt ảnh Chi tiết (Agent
Sprites)
Mỗi Agent có 3 khung hình cơ bản (Idle, Walk, Action) và các bộ hoạt ảnh đặc trưng cho từng
trạng thái:
A. Nhà nghiên cứu (Researcher Agent)
● Diện mạo: Tông xanh dương, áo blouse trắng, kính cận dày.
● Hoạt ảnh chờ: Đẩy kính, giơ bảng kẹp tài liệu. Biểu tượng "Kính lúp" nhấp nháy vàng.
● Hoạt ảnh từ chối: Cúi đầu (buồn), mây xám trên đầu, lững thững về bàn làm việc.
B. Người viết nội dung (Writer Agent)
● Diện mạo: Tông xanh lá, đeo tai nghe lớn, quàng khăn len.
● Hoạt ảnh chờ: Tháo tai nghe, chống cằm suy nghĩ. Tờ giấy cuộn xuất hiện với dấu hỏi
vàng.
● Hoạt ảnh từ chối: Thở dài (hiệu ứng khói), vò nát tờ giấy ảo, quay lại bàn viết bản thảo mới.
C. Người thẩm định (Reviewer Agent)
● Diện mạo: Tông đỏ/tím, mặc vest công sở, cầm con dấu gỗ.
● Hoạt ảnh chờ: Đứng thẳng, khoanh tay, chân nhịp nhẹ. Biểu tượng "Con dấu" hiện sau
lưng.
● Hoạt ảnh từ chối: Nhún vai, cất con dấu, quay về tư thế đọc tài liệu để tìm lỗi.


---
*Trang 2 / 3*

D. Các vai trò mở rộng (Analyst, Developer, Designer)
● Analyst: Tông vàng kim, kính visor. Hoạt ảnh: Tung hứng biểu đồ hologram. Khi bị từ chối:
Biểu đồ vỡ vụn.
● Developer: Tông xám than, hoodie, cầm ly cà phê. Hoạt ảnh: Gõ phím "ma trận". Khi bị từ
chối: Cốc đổ, trùm mũ hoodie "fix bug".
● Designer: Tông cầu vồng, mũ beret. Hoạt ảnh: Vẽ trên bảng nổi lấp lánh. Khi bị từ chối:
Bức vẽ bốc cháy, bĩu môi vẽ lại.
3. Hệ thống Logic Di chuyển (Room Navigation Logic)
Hệ thống điều hướng tự động dựa trên trạng thái (agent_state) và sự kiện (event_type).
3.1 Hệ tọa độ văn phòng (Grid System)
Lưới 16x16 pixel/ô. Tổng kích thước Canvas: 1280x720 (80x45 ô).
Khu vực Tọa độ Grid (X, Y) Điểm tập trung Mục đích
(Slot)
Khu nghỉ (Lounge) (4, 4) đến (20, 16) (8, 8), (12, 8), (16, 8) Nghỉ ngơi, idle,
paused
Bàn làm việc (24, 20) đến (56, 36) Theo ID của Agent Tập trung thinking,
task cá nhân
Kho dữ liệu (64, 4) đến (76, 16) (70, 10) Truy xuất tool_call,
API Call
Phòng họp (60, 24) đến (76, Ghế quanh bàn Thảo luận nhóm,
40) tròn Broadcast
Lối đi trung tâm (30, 4) đến (50, 16) (40, 10) Chờ duyệt
approval.required
3.2 Quy tắc di chuyển & Hoạt ảnh chuyển cảnh
● Tốc độ: Walking (Bình thường): 180px/s | Running (Lỗi/Khẩn): 360px/s.
● Thuật toán: Sử dụng A (A-Star)*. Khi rẽ hướng, Sprite lật (Flip X) với độ trễ 100ms.
● Hiệu ứng:
○ Data Vault: Khi đến tọa độ (70, 10), Agent thực hiện hoạt ảnh "Cúi người" 500ms.
○ Meeting Room: Ngồi vào ghế giảm Opacity xuống 80% (Hologram).


---
*Trang 3 / 3*

○ Xuất hiện: Fade In từ 0 -> 1 trong 1s kèm hiệu ứng "Glitch".
● Thứ tự hiển thị (Z-Index): Theo Y-Sorting (tọa độ Y lớn hơn hiện đè lên). Agent chờ duyệt
luôn nhận depth = 1000.
4. Tính năng Tương tác Nâng cao (CEO Experience)
4.1 AI Voice Summary (Tóm tắt Giọng nói)
● Kịch bản (15-20s): "Chào sếp, phiên này tập trung soạn thảo Marketing Q2. Đã có 2 yêu
cầu rủi ro cao được duyệt trong 5 phút. Tiết kiệm 4 giờ làm việc. Chi phí 1.24 USD."
● Thiết kế: Giọng trợ lý điều hành trầm ấm. Nút loa có sóng âm. Hiệu ứng Ducking (làm mờ
nhạc nền khi nói).
4.2 Smart Bubbles (Bong bóng Thông minh)
Chuyển đổi kỹ thuật sang ngôn ngữ kinh doanh:
● Executing web_search: "Đang tìm hiểu giá của đối thủ trên thị trường..."
● LLM_Generation: "Đang soạn bản thảo email gửi khách hàng..."
● Waiting for approval: "Đã xong bản thảo, đang chờ sếp kiểm duyệt..."
● Error: "Mạng hơi chậm, tôi đang thử kết nối lại..."
● Task_Completed: "Báo cáo đã sẵn sàng! Sếp xem qua nhé."
● Visual: Glassmorphism pixel. Chạm để hiện Mini-card chi tiết (Công cụ, Chi phí, Độ tin
cậy).
4.3 Dashboard Replay & QR Code
● QR Code: Cuối PDF báo cáo, quét để mở Replay trên Mobile/Tablet.
● Giao diện Replay: Timeline có các điểm chạm vàng (Approval Points). CEO có thể chỉnh
tốc độ x1, x2, x5, x10. Camera tự động smooth-damp theo Agent phát sự kiện.
5. Quản trị & Báo cáo (CEO Strategic Insights)
● AI vs Human ROI: (Giờ tiết kiệm * Lương trung bình) - Tổng chi phí API.
● Quyết định Phê duyệt: Thống kê tỷ lệ Duyệt/Từ chối và thời gian phản hồi.
● Hệ thống Rủi ro: Phân loại màu sắc Modal: Xanh (Thấp), Vàng (Trung bình), Đỏ (Cao - Gửi
email, Thanh toán).
● Âm thanh & Xúc giác: * Approval Ping: Tiếng chuông "Ding" tài chính.
○ Haptic: Rung nhẹ khi nhấn "Approve" trên Tablet.
Mục tiêu: Biến dữ liệu vận hành AI thành một trải nghiệm "Văn phòng sống" minh bạch, an toàn
và dễ hiểu cho mọi cấp lãnh đạo.
