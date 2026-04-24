# Logic di chuyển Agent


---
*Trang 1 / 2*

Hệ thống Logic Di chuyển Agent (Room
Navigation Logic)
Hệ thống này quy định cách các Agent tự động di chuyển giữa 4 khu vực chức năng dựa trên
trạng thái thời gian thực (agent_state) và loại sự kiện (event_type) nhận được từ WebSocket.
1. Bản đồ ánh xạ Trạng thái - Khu vực (State-to-Room
Mapping)
Trạng thái/Sự kiện Khu vực đích Mô tả hành động
state: idle / state: paused Khu nghỉ ngơi (Lounge) Agent di chuyển đến sofa
hoặc máy pha cà phê khi
không có task.
state: thinking / Task cá Bàn làm việc Di chuyển về chỗ ngồi riêng
nhân (Workstations) để thực hiện xử lý
logic/LLM.
event_type: tool_call / API Kho dữ liệu (Data Vault) Di chuyển đến khu vực máy
Call chủ/tủ hồ sơ khi cần truy
cập dữ liệu ngoại vi.
Sự kiện Collaboration / Phòng họp (Meeting Khi nhiều Agent cùng xử lý
Broadcast Room) một session, chúng tập
trung về bàn tròn.
approval.required Lối đi trung tâm Agent dừng lại giữa đường
hoặc đứng trước phòng
Manager để chờ lệnh.
2. Quy tắc kích hoạt di chuyển (Trigger Rules)
A. Truy cập dữ liệu (Data Vault)
● Điều kiện: Khi Agent phát tín hiệu chuẩn bị thực thi một công cụ (Tool) như web_search,
sql_query, hoặc fetch_api.
● Hành động: Agent rời bàn làm việc, đi đến Data Vault. Tại đây, hoạt ảnh action (đọc ổ


---
*Trang 2 / 2*

cứng/mở tủ) sẽ được kích hoạt kèm theo Smart Bubble.
B. Thảo luận nhóm (Meeting Room)
● Điều kiện: Khi hệ thống nhận diện các task có tính chất phụ thuộc (Dependencies) hoặc
sự kiện broadcast từ SDK.
● Hành động: Tất cả Agent liên quan sẽ di chuyển về phòng họp để "thảo luận" (hiển thị
bubble hội thoại nhóm).
C. Hoàn thành & Nghỉ ngơi (Lounge)
● Điều kiện: Sau khi hoàn thành một mốc quan trọng (Milestone) hoặc khi session ở trạng
thái chờ lệnh tiếp theo quá 30 giây.
● Hành động: Agent di chuyển đến Lounge để tái tạo năng lượng (hành động: uống nước,
ngồi sofa).
3. Logic vận hành kỹ thuật (Technical Movement)
1. Thuật toán đường đi: Sử dụng A (A-Star Pathfinding)* trên lưới pixel (grid-based) để
tránh các vật cản (bàn ghế, tường).
2. Tốc độ di chuyển: * Walk: Tốc độ bình thường khi chuyển giao giữa các task.
○ Run: Khi có lỗi (state: error) - Agent chạy nhanh về khu vực của Developer để "báo
cáo".
3. Xử lý chồng lấp: Nếu nhiều Agent cùng ở một phòng, chúng sẽ tự động tìm các tọa độ
(Slot) trống trong phòng đó để tránh đứng đè lên nhau.
4. Hiệu ứng trực quan khi di chuyển
● Path Trace: Một đường mờ (faint trail) màu theo màu của Agent sẽ xuất hiện ngắn hạn để
CEO dễ dàng theo dõi lộ trình di chuyển của Agent đó.
● Z-Index Dynamic: Agent di chuyển "phía sau" các vật thể cao (tủ sách) và "phía trước" các
vật thể thấp (thảm) để tạo độ sâu 2.5D.
Mục tiêu: Giúp CEO chỉ cần nhìn vào vị trí của Agent là biết chúng đang "nghỉ", "làm việc" hay
đang "truy xuất dữ liệu" mà không cần đọc log.
