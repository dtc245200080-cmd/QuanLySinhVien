const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối Cơ sở dữ liệu MySQL từ môi trường (Docker)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'student_user',
  password: process.env.DB_PASSWORD || 'StrongUserPassword123!',
  database: process.env.DB_NAME || 'student_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tự động khởi tạo bảng nếu chưa có
db.query(`
  CREATE TABLE IF NOT EXISTS sinh_vien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(255) NOT NULL,
    lop VARCHAR(100) NOT NULL,
    diem_so FLOAT NOT NULL
  )
`, (err) => {
  if (err) console.error("Lỗi khởi tạo Bảng DB:", err);
  else console.log("Khởi tạo cấu trúc bảng DB thành công!");
});

// Trang chủ Giao diện Management đơn giản
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Hệ thống Quản lý Sinh viên</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; }
        h1, h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; }
        form { margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 5px; }
        input { margin: 5px 0; padding: 8px; width: 200px; display: inline-block; }
        button { padding: 8px 15px; background-color: #28a745; color: white; border: none; cursor: pointer; }
        .btn-delete { background-color: #dc3545; }
      </style>
    </head>
    <body>
      <h1>Hệ Thống Quản Lý Sinh Viên</h1>
      
      <h2>Thêm Sinh Viên Mới</h2>
      <form action="/api/students" method="POST">
        <input type="text" name="ho_ten" placeholder="Họ và tên" required />
        <input type="text" name="lop" placeholder="Lớp học" required />
        <input type="number" step="0.1" name="diem_so" placeholder="Điểm số" required />
        <button type="submit">Thêm Sinh Viên</button>
      </form>

      <h2>Danh Sách Sinh Viên</h2>
      <div id="student-list">Đang tải danh sách...</div>

      <script>
        async function fetchStudents() {
          const res = await fetch('/api/students');
          const data = await res.json();
          let html = '<table><tr><th>ID</th><th>Họ và Tên</th><th>Lớp</th><th>Điểm Số</th><th>Thao tác</th></tr>';
          data.forEach(s => {
            html += \`<tr>
              <td>\${s.id}</td>
              <td>\${s.ho_ten}</td>
              <td>\${s.lop}</td>
              <td>\${s.diem_so}</td>
              <td><button class="btn-delete" onclick="deleteStudent(\${s.id})">Xóa</button></td>
            </tr>\`;
          });
          html += '</table>';
          document.getElementById('student-list').innerHTML = html;
        }

        async function deleteStudent(id) {
          if (confirm('Bạn có chắc muốn xóa sinh viên này?')) {
            await fetch('/api/students/' + id, { method: 'DELETE' });
            fetchStudents();
          }
        }

        fetchStudents();
      </script>
    </body>
    </html>
  `);
});

// REST API Endpoints (CRUD)
app.get('/api/students', (req, res) => {
  db.query('SELECT * FROM sinh_vien', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/students', (req, res) => {
  const { ho_ten, lop, diem_so } = req.body;
  db.query('INSERT INTO sinh_vien (ho_ten, lop, diem_so) VALUES (?, ?, ?)', [ho_ten, lop, diem_so], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect('/');
  });
});

app.delete('/api/students/:id', (req, res) => {
  db.query('DELETE FROM sinh_vien WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Xóa thành công' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});