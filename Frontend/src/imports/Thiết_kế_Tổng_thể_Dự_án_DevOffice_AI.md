# Thiết kế Tổng thể Dự án DevOffice AI


---
*Trang 1 / 3*

Hồ sơ Thiết kế Tổng thể Dự án DevOffice
AI
Dự án DevOffice AI có một định vị rất độc đáo: "Sản phẩm quan sát AI duy nhất mà CEO cũng
có thể đọc hiểu". Do đó, ngôn ngữ thiết kế cần phải cân bằng giữa tính kỹ thuật chính xác và sự
trực quan sinh động.
1. Phong cách Tổng thể (Visual Concept)
● Chủ đề: "Văn phòng ảo 2D Pixel Art" trên nền "SaaS hiện đại".
● Phong cách đồ họa: Kết hợp giữa giao diện bảng điều khiển sạch sẽ (Shadcn/UI, Tailwind)
và Canvas Game 2D (Phaser.js).
● Kiến trúc Không gian: Canvas được chia thành 4 khu vực chức năng:
○ Phòng họp (Meeting Room): Nơi các Agent tập trung khi có sự kiện broadcast hoặc
thảo luận nhóm.
○ Bàn làm việc (Workstations): Vị trí mặc định của các Agent khi thực thi task cá nhân.
○ Kho dữ liệu (Data Vault): Khu vực hiển thị hiệu ứng khi Agent truy cập database hoặc
gọi API bên ngoài.
○ Khu nghỉ ngơi (Lounge): Nơi các Agent ở trạng thái Idle hoặc Paused sẽ xuất hiện.
2. Thiết kế Nhân vật & Hoạt ảnh Chi tiết (Agent Sprites
& Animations)
Mỗi Agent có các khung hình cơ bản (Idle, Walk, Action) và bộ hoạt ảnh đặc biệt cho các trạng
thái phản hồi từ con người.
A. Nhà nghiên cứu (Researcher Agent)
● Diện mạo: Tông xanh dương, mặc áo blouse trắng, đeo kính cận dày.
● Hoạt ảnh chờ phê duyệt: Nhân vật dừng di chuyển, đẩy gọng kính, giơ bảng kẹp tài liệu
(clipboard). Biểu tượng "Kính lúp" nhấp nháy trên đầu.
● Hoạt ảnh bị từ chối (Reject): Nhân vật cúi đầu (sad), xuất hiện biểu tượng đám mây nhỏ
màu xám trên đầu, sau đó lững thững đi bộ về bàn làm việc.
B. Người viết nội dung (Writer Agent)
● Diện mạo: Tông xanh lá cây, đeo tai nghe lớn, quàng khăn len.
● Hoạt ảnh chờ phê duyệt: Tháo tai nghe xuống cổ, chống cằm suy nghĩ. Tờ giấy cuộn xuất
hiện với dấu hỏi lớn màu vàng.
● Hoạt ảnh bị từ chối (Reject): Thở dài (hiệu ứng "khói"), vò nát tờ giấy ảo và quay trở lại
viết lại bản thảo mới.


---
*Trang 2 / 3*

C. Người thẩm định (Reviewer Agent)
● Diện mạo: Tông đỏ/tím, mặc vest lịch lãm, cầm con dấu gỗ.
● Hoạt ảnh chờ phê duyệt: Đứng thẳng, khoanh tay, chân nhịp nhẹ. Biểu tượng "Con dấu"
lớn hiện ra phía sau với hào quang nhẹ.
● Hoạt ảnh bị từ chối (Reject): Nhún vai, cất con dấu và quay về tư thế đọc tài liệu để tìm
lỗi sai.
D. Chuyên gia Phân tích (Analyst Agent)
● Diện mạo: Tông vàng kim, mặc bộ suit sắc sảo, đeo kính công nghệ cao (visor).
● Hoạt ảnh chờ phê duyệt: Tung hứng các biểu đồ hologram. Khi chờ, các biểu đồ chuyển
sang màu cam và quay chậm lại.
● Hoạt ảnh bị từ chối (Reject): Các hologram vỡ vụn. Điều chỉnh cà vạt và lấy máy tính bỏ
túi ra tính toán lại.
E. Lập trình viên (Developer Agent)
● Diện mạo: Tông xám than, mặc áo hoodie, tay cầm cốc cà phê bốc khói.
● Hoạt ảnh chờ phê duyệt: Gõ phím cực nhanh với hiệu ứng "ma trận". Khi chờ, nhấp ngụm
cà phê và nhìn màn hình hiện dấu "Loading".
● Hoạt ảnh bị từ chối (Reject): Cốc cà phê đổ. Vò đầu bứt tai, trùm mũ hoodie kín đầu và
gõ phím liên tục để "fix bug".
F. Nhà thiết kế Sáng tạo (Designer Agent)
● Diện mạo: Tông cầu vồng, đội mũ nồi, đeo tạp dề dính vệt sơn.
● Hoạt ảnh chờ phê duyệt: Múa bút vẽ trên bảng vẽ nổi. Khi chờ, xoay bút vẽ và nhìn bức
tranh đầy hy vọng.
● Hoạt ảnh bị từ chối (Reject): Bức vẽ bốc cháy thành bụi màu xám. Bĩu môi, lấy bảng màu
mới và phác thảo lại nét vẽ mới.
3. Tính năng Tương tác Nâng cao cho CEO Replay
3.1. AI Voice Summary (Tóm tắt bằng Giọng nói AI)
● Kịch bản Nội dung: Tóm tắt kết quả kinh doanh, điểm nhấn quản trị (số phê duyệt), hiệu
quả (giờ tiết kiệm) và chi phí thực tế.
● Thiết kế: Giọng đọc trầm ấm, nút kích hoạt dạng sóng âm, tự động làm mờ âm thanh nền
khi bắt đầu nói.
3.2. Smart Bubbles (Bong bóng Thông minh)
● Ngôn ngữ: Chuyển đổi Logs kỹ thuật sang ngôn ngữ kinh doanh (Ví dụ: Executing
web_search -> "Đang tìm hiểu giá đối thủ...").
● Visual: Pixel-art Glassmorphism, màu sắc thay đổi theo trạng thái (Trắng, Vàng nhấp nháy,


---
*Trang 3 / 3*

Xanh lá).
● Tương tác: Chạm để hiện Mini-card chi tiết về công cụ và chi phí.
4. Quy trình Trực quan hóa & Hệ thống Âm thanh
4.1. Quy trình Trạng thái Chờ (The Waiting Loop)
● Highlight: Đường viền nét đứt màu vàng hổ phách quanh khu vực Agent.
● Slow-mo: Agent chờ chuyển sang hoạt ảnh lặp, các Agent khác di chuyển bình thường.
● Z-index: Đưa Agent chờ lên lớp trên cùng.
4.2. Hệ thống Cấp độ Rủi ro (Risk Visualization)
Khi một yêu cầu phê duyệt hiện lên, Modal sẽ hiển thị cấp độ rủi ro bằng màu sắc:
● Thấp (Xanh dương): Các task mang tính thông tin (Ví dụ: Soạn nháp).
● Trung bình (Vàng): Các task ảnh hưởng nội bộ (Ví dụ: Cập nhật tài liệu chung).
● Cao (Đỏ): Các task tác động bên ngoài (Ví dụ: Gửi email khách hàng, thanh toán tiền).
5. Báo cáo Chiến lược CEO (PDF Report Visualization)
Tài liệu PDF được thiết kế với các thành phần trực quan:
● Thẻ ROI (Header): Hiển thị số tiền tiết kiệm được bằng font chữ lớn, màu xanh lá cây đậm.
● Biểu đồ Cột Chồng: So sánh "Chi phí Nhân sự truyền thống" vs "Chi phí AI thực tế".
● Bảng Governance: Danh sách các hành động rủi ro cao đã được phê duyệt, có kèm tên
người duyệt.
● Biểu đồ Đường (Budget Forecast): Dự báo chi phí tuần tới dựa trên tốc độ tiêu thụ hiện
tại.
● QR Code: Nằm ở góc dưới bên phải trang cuối, dẫn về link Replay.
6. Hướng dẫn Onboarding cho CEO
Lần đầu truy cập, CEO sẽ được hướng dẫn qua 3 bước:
1. Giải mã Pixel: Giới thiệu ý nghĩa màu sắc của các Agent.
2. Cơ chế Phê duyệt: Giả lập một tool call để CEO làm quen với nút "Approve".
3. Chuyển đổi View: Hướng dẫn cách gạt nút từ Dev Mode sang Manager Mode.
7. Tính tương thích & Phản hồi Xúc giác
● Haptic: Rung nhẹ khi nhấn Approve trên thiết bị di động.
● Giao diện: Manager Mode tự động chuyển sang dạng "Thẻ ưu tiên" trên màn hình dọc.
Mục tiêu: Biến việc xem báo cáo thành một trải nghiệm giải trí nhưng đầy đủ tính quản trị.
