const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Kết nối cơ sở dữ liệu MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'student_user',
  password: process.env.DB_PASSWORD || 'StrongUserPassword123!',
  database: process.env.DB_NAME || 'student_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Khởi tạo bảng dữ liệu nếu chưa tồn tại
db.query(`
  CREATE TABLE IF NOT EXISTS sinh_vien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(255) NOT NULL,
    lop VARCHAR(100) NOT NULL,
    diem_so FLOAT NOT NULL
  )
`, (err) => {
  if (err) console.error("Lỗi khởi tạo bảng:", err);
});

// Lấy danh sách sinh viên
app.get('/api/students', (req, res) => {
  db.query('SELECT * FROM sinh_vien', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Thêm sinh viên mới
app.post('/api/students', (req, res) => {
  const { ho_ten, lop, diem_so } = req.body;
  db.query('INSERT INTO sinh_vien (ho_ten, lop, diem_so) VALUES (?, ?, ?)', [ho_ten, lop, diem_so], (err) => {
    if (err) return res.status(500).send(err);
    res.redirect('/');
  });
});

// Sửa thông tin sinh viên (Cập nhật)
app.post('/api/students/update', (req, res) => {
  const { id, ho_ten, lop, diem_so } = req.body;
  db.query('UPDATE sinh_vien SET ho_ten = ?, lop = ?, diem_so = ? WHERE id = ?', [ho_ten, lop, diem_so, id], (err) => {
    if (err) return res.status(500).send(err);
    res.redirect('/');
  });
});

// Xóa sinh viên
app.post('/api/students/delete', (req, res) => {
  const { id } = req.body;
  db.query('DELETE FROM sinh_vien WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send(err);
    res.redirect('/');
  });
});

// Màn hình giao diện chính
app.get('/', (req, res) => {
  db.query('SELECT * FROM sinh_vien', (err, results) => {
    if (err) return res.status(500).send("Lỗi kết nối cơ sở dữ liệu");
    
    let rows = results.map(sv => `
      <tr>
        <td>${sv.id}</td>
        <td>${sv.ho_ten}</td>
        <td>${sv.lop}</td>
        <td>${sv.diem_so}</td>
        <td style="display:flex; gap: 5px;">
          <button onclick="editStudent(${sv.id}, '${sv.ho_ten}', '${sv.lop}', ${sv.diem_so})" style="background-color:#f0ad4e; color:white; border:none; padding:6px 12px; cursor:pointer; border-radius:4px;">Sửa</button>
          <form action="/api/students/delete" method="POST" style="margin:0;">
            <input type="hidden" name="id" value="${sv.id}">
            <button type="submit" style="background-color:#d9534f; color:white; border:none; padding:6px 12px; cursor:pointer; border-radius:4px;" onclick="return confirm('Bạn có chắc muốn xóa?')">Xóa</button>
          </form>
        </td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Hệ Thống Quản Lý Sinh Viên</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background-color: #f9f9f9; }
          h1, h2 { color: #333; }
          .form-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
          input { padding: 8px; margin-right: 10px; border: 1px solid #ccc; border-radius: 4px; }
          button.btn-add { background-color: #28a745; color: white; border: none; padding: 9px 15px; border-radius: 4px; cursor: pointer; }
          table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Hệ Thống Quản Lý Sinh Viên</h1>

        <div class="form-container">
          <h2 id="form-title">Thêm Sinh Viên Mới</h2>
          <form id="student-form" action="/api/students" method="POST">
            <input type="hidden" id="student-id" name="id">
            <input type="text" id="ho_ten" name="ho_ten" placeholder="Họ và tên" required>
            <input type="text" id="lop" name="lop" placeholder="Lớp học" required>
            <input type="number" step="0.1" id="diem_so" name="diem_so" placeholder="Điểm số" required>
            <button type="submit" id="btn-submit" class="btn-add">Thêm Sinh Viên</button>
            <button type="button" id="btn-cancel" onclick="resetForm()" style="display:none; background-color:#6c757d; color:white; border:none; padding:9px 15px; border-radius:4px; cursor:pointer;">Hủy Sửa</button>
          </form>
        </div>

        <h2>Danh Sách Sinh Viên</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và Tên</th>
              <th>Lớp</th>
              <th>Điểm Số</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <script>
          function editStudent(id, hoTen, lop, diemSo) {
            document.getElementById('form-title').innerText = 'Sửa Thông Tin Sinh Viên (ID: ' + id + ')';
            document.getElementById('student-form').action = '/api/students/update';
            document.getElementById('student-id').value = id;
            document.getElementById('ho_ten').value = hoTen;
            document.getElementById('lop').value = lop;
            document.getElementById('diem_so').value = diemSo;
            document.getElementById('btn-submit').innerText = 'Cập Nhật';
            document.getElementById('btn-submit').style.backgroundColor = '#f0ad4e';
            document.getElementById('btn-cancel').style.display = 'inline-block';
          }

          function resetForm() {
            document.getElementById('form-title').innerText = 'Thêm Sinh Viên Mới';
            document.getElementById('student-form').action = '/api/students';
            document.getElementById('student-id').value = '';
            document.getElementById('ho_ten').value = '';
            document.getElementById('lop').value = '';
            document.getElementById('diem_so').value = '';
            document.getElementById('btn-submit').innerText = 'Thêm Sinh Viên';
            document.getElementById('btn-submit').style.backgroundColor = '#28a745';
            document.getElementById('btn-cancel').style.display = 'none';
          }
        </script>
      </body>
      </html>
    `);
  });
});

app.listen(3000, () => {
  console.log('App service đang chạy tại port 3000');
});