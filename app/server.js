const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Kết nối CSDL MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'student_user',
  password: process.env.DB_PASSWORD || 'StrongUserPassword123!',
  database: process.env.DB_NAME || 'student_db',
  waitForConnections: true,
  connectionLimit: 10
});

// Khởi tạo các bảng dữ liệu
db.query(`
  CREATE TABLE IF NOT EXISTS lop_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_lop VARCHAR(100) NOT NULL,
    khoa VARCHAR(100) NOT NULL
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS sinh_vien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(255) NOT NULL,
    ngay_sinh DATE,
    lop_id INT,
    FOREIGN KEY (lop_id) REFERENCES lop_hoc(id) ON DELETE SET NULL
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS diem_so (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sinh_vien_id INT NOT NULL,
    ten_mon VARCHAR(100) NOT NULL,
    diem FLOAT NOT NULL,
    FOREIGN KEY (sinh_vien_id) REFERENCES sinh_vien(id) ON DELETE CASCADE
  )
`);

// ==================== CRUD LỚP HỌC ====================
app.post('/api/classes', (req, res) => {
  const { ten_lop, khoa } = req.body;
  db.query('INSERT INTO lop_hoc (ten_lop, khoa) VALUES (?, ?)', [ten_lop, khoa], (err) => {
    if (err) console.error("Lỗi thêm lớp:", err);
    res.redirect('/#tab-lop');
  });
});

app.post('/api/classes/update', (req, res) => {
  const { id, ten_lop, khoa } = req.body;
  db.query('UPDATE lop_hoc SET ten_lop = ?, khoa = ? WHERE id = ?', [ten_lop, khoa, id], (err) => {
    if (err) console.error("Lỗi cập nhật lớp:", err);
    res.redirect('/#tab-lop');
  });
});

app.post('/api/classes/delete', (req, res) => {
  const { id } = req.body;
  db.query('DELETE FROM lop_hoc WHERE id = ?', [id], (err) => {
    if (err) console.error("Lỗi xóa lớp:", err);
    res.redirect('/#tab-lop');
  });
});

// ==================== CRUD SINH VIÊN ====================
app.post('/api/students', (req, res) => {
  const { ho_ten, ngay_sinh, lop_id } = req.body;
  const validLopId = lop_id && lop_id !== '' ? parseInt(lop_id) : null;
  const validNgaySinh = ngay_sinh && ngay_sinh !== '' ? ngay_sinh : null;

  db.query('INSERT INTO sinh_vien (ho_ten, ngay_sinh, lop_id) VALUES (?, ?, ?)', [ho_ten, validNgaySinh, validLopId], (err) => {
    if (err) console.error("Lỗi thêm sinh viên:", err);
    res.redirect('/#tab-sv');
  });
});

app.post('/api/students/update', (req, res) => {
  const { id, ho_ten, ngay_sinh, lop_id } = req.body;
  const validLopId = lop_id && lop_id !== '' ? parseInt(lop_id) : null;
  const validNgaySinh = ngay_sinh && ngay_sinh !== '' ? ngay_sinh : null;

  db.query('UPDATE sinh_vien SET ho_ten = ?, ngay_sinh = ?, lop_id = ? WHERE id = ?', [ho_ten, validNgaySinh, validLopId, id], (err) => {
    if (err) console.error("Lỗi cập nhật sinh viên:", err);
    res.redirect('/#tab-sv');
  });
});

app.post('/api/students/delete', (req, res) => {
  const { id } = req.body;
  db.query('DELETE FROM sinh_vien WHERE id = ?', [id], (err) => {
    if (err) console.error("Lỗi xóa sinh viên:", err);
    res.redirect('/#tab-sv');
  });
});

// ==================== CRUD ĐIỂM SỐ (ĐÃ TỐI ƯU KHÓA NGOẠI) ====================
app.post('/api/scores', (req, res) => {
  const { sinh_vien_id, ten_mon, diem } = req.body;
  const svId = parseInt(sinh_vien_id);
  const diemVal = parseFloat(diem);

  if (!svId || isNaN(diemVal)) {
    return res.redirect('/#tab-diem');
  }

  db.query('INSERT INTO diem_so (sinh_vien_id, ten_mon, diem) VALUES (?, ?, ?)', [svId, ten_mon, diemVal], (err) => {
    if (err) console.error("Lỗi thêm điểm:", err);
    res.redirect('/#tab-diem');
  });
});

app.post('/api/scores/update', (req, res) => {
  const { id, sinh_vien_id, ten_mon, diem } = req.body;
  const svId = parseInt(sinh_vien_id);
  const diemVal = parseFloat(diem);

  db.query('UPDATE diem_so SET sinh_vien_id = ?, ten_mon = ?, diem = ? WHERE id = ?', [svId, ten_mon, diemVal, id], (err) => {
    if (err) console.error("Lỗi cập nhật điểm:", err);
    res.redirect('/#tab-diem');
  });
});

app.post('/api/scores/delete', (req, res) => {
  const { id } = req.body;
  db.query('DELETE FROM diem_so WHERE id = ?', [id], (err) => {
    if (err) console.error("Lỗi xóa điểm:", err);
    res.redirect('/#tab-diem');
  });
});

// ==================== TRANG CHÍNH ====================
app.get('/', (req, res) => {
  db.query('SELECT * FROM lop_hoc', (err, lops) => {
    db.query(`
      SELECT sv.*, l.ten_lop 
      FROM sinh_vien sv 
      LEFT JOIN lop_hoc l ON sv.lop_id = l.id
    `, (err, svs) => {
      db.query(`
        SELECT d.*, sv.ho_ten 
        FROM diem_so d 
        LEFT JOIN sinh_vien sv ON d.sinh_vien_id = sv.id
      `, (err, diems) => {

        let rowsLop = (lops || []).map(l => `
          <tr>
            <td>${l.id}</td>
            <td><b>${l.ten_lop}</b></td>
            <td>${l.khoa}</td>
            <td>
              <button onclick="editLop(${l.id}, '${l.ten_lop}', '${l.khoa}')" class="btn-edit">Sửa</button>
              <form action="/api/classes/delete" method="POST" style="display:inline;">
                <input type="hidden" name="id" value="${l.id}">
                <button type="submit" class="btn-del" onclick="return confirm('Xóa lớp này?')">Xóa</button>
              </form>
            </td>
          </tr>
        `).join('');

        let rowsSV = (svs || []).map(s => `
          <tr>
            <td>${s.id}</td>
            <td><b>${s.ho_ten}</b></td>
            <td>${s.ngay_sinh ? new Date(s.ngay_sinh).toISOString().split('T')[0] : '<i>Chưa nhập</i>'}</td>
            <td>${s.ten_lop || '<i style="color:gray;">Chưa xếp lớp</i>'}</td>
            <td>
              <button onclick="editSV(${s.id}, '${s.ho_ten}', '${s.ngay_sinh ? new Date(s.ngay_sinh).toISOString().split('T')[0] : ''}', ${s.lop_id || "''"})" class="btn-edit">Sửa</button>
              <form action="/api/students/delete" method="POST" style="display:inline;">
                <input type="hidden" name="id" value="${s.id}">
                <button type="submit" class="btn-del" onclick="return confirm('Xóa sinh viên?')">Xóa</button>
              </form>
            </td>
          </tr>
        `).join('');

        let optLop = (lops || []).map(l => `<option value="${l.id}">${l.ten_lop}</option>`).join('');
        let optSV = (svs || []).map(s => `<option value="${s.id}">${s.ho_ten} (ID: ${s.id})</option>`).join('');

        let rowsDiem = (diems || []).map(d => `
          <tr>
            <td>${d.id}</td>
            <td><b>${d.ho_ten || 'Sinh viên đã bị xóa'}</b></td>
            <td>${d.ten_mon}</td>
            <td><strong style="color:${d.diem >= 5 ? 'green' : 'red'};">${d.diem}</strong></td>
            <td>
              <button onclick="editDiem(${d.id}, ${d.sinh_vien_id}, '${d.ten_mon}', ${d.diem})" class="btn-edit">Sửa</button>
              <form action="/api/scores/delete" method="POST" style="display:inline;">
                <input type="hidden" name="id" value="${d.id}">
                <button type="submit" class="btn-del" onclick="return confirm('Xóa điểm?')">Xóa</button>
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
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; background-color: #f4f6f9; }
              h1 { color: #2c3e50; text-align: center; margin-bottom: 25px; }
              .tabs { display: flex; border-bottom: 2px solid #ccc; margin-bottom: 20px; }
              .tab-btn { padding: 12px 25px; cursor: pointer; background: #e9ecef; border: none; font-weight: bold; border-radius: 8px 8px 0 0; margin-right: 5px; font-size: 15px; }
              .tab-btn.active { background: #007bff; color: white; }
              .tab-content { display: none; background: white; padding: 25px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .tab-content.active { display: block; }
              .form-box { background: #f8f9fa; padding: 18px; border-radius: 6px; border: 1px solid #e3e6f0; margin-bottom: 20px; }
              input, select { padding: 9px; margin-right: 10px; border: 1px solid #ced4da; border-radius: 4px; }
              button { padding: 9px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
              .btn-add { background: #28a745; color: white; }
              .btn-edit { background: #ffc107; color: #212529; }
              .btn-del { background: #dc3545; color: white; }
              .btn-cancel { background: #6c757d; color: white; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { padding: 12px; border-bottom: 1px solid #e3e6f0; text-align: left; }
              th { background: #f1f3f9; color: #495057; }
            </style>
          </head>
          <body>
            <h1>Hệ Thống Quản Lý Sinh Viên</h1>

            <div class="tabs">
              <button class="tab-btn active" onclick="openTab('tab-sv', this)">1. Quản Lý Sinh Viên</button>
              <button class="tab-btn" onclick="openTab('tab-lop', this)">2. Quản Lý Lớp Học</button>
              <button class="tab-btn" onclick="openTab('tab-diem', this)">3. Quản Lý Điểm Số</button>
            </div>

            <!-- TAB SINH VIÊN -->
            <div id="tab-sv" class="tab-content active">
              <div class="form-box">
                <h3 id="title-sv">Thêm Sinh Viên Mới</h3>
                <form id="form-sv" action="/api/students" method="POST">
                  <input type="hidden" id="sv-id" name="id">
                  <input type="text" id="sv-hoten" name="ho_ten" placeholder="Họ và tên sinh viên" required style="width:250px;">
                  <input type="date" id="sv-ngaysinh" name="ngay_sinh">
                  <select id="sv-lopid" name="lop_id">
                    <option value="">-- Chọn Lớp Học --</option>
                    ${optLop}
                  </select>
                  <button type="submit" id="btn-sv-sub" class="btn-add">Thêm Sinh Viên</button>
                  <button type="button" id="btn-sv-can" onclick="resetSV()" class="btn-cancel" style="display:none;">Hủy Sửa</button>
                </form>
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Họ và Tên</th><th>Ngày Sinh</th><th>Lớp Học</th><th>Thao tác</th></tr>
                </thead>
                <tbody>${rowsSV}</tbody>
              </table>
            </div>

            <!-- TAB LỚP HỌC -->
            <div id="tab-lop" class="tab-content">
              <div class="form-box">
                <h3 id="title-lop">Thêm Lớp Học Mới</h3>
                <form id="form-lop" action="/api/classes" method="POST">
                  <input type="hidden" id="lop-id" name="id">
                  <input type="text" id="lop-ten" name="ten_lop" placeholder="Tên Lớp (ví dụ: KTPM K23A)" required>
                  <input type="text" id="lop-khoa" name="khoa" placeholder="Khoa / Ngành" required>
                  <button type="submit" id="btn-lop-sub" class="btn-add">Thêm Lớp Học</button>
                  <button type="button" id="btn-lop-can" onclick="resetLop()" class="btn-cancel" style="display:none;">Hủy Sửa</button>
                </form>
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Tên Lớp</th><th>Khoa / Ngành</th><th>Thao tác</th></tr>
                </thead>
                <tbody>${rowsLop}</tbody>
              </table>
            </div>

            <!-- TAB ĐIỂM SỐ -->
            <div id="tab-diem" class="tab-content">
              <div class="form-box">
                <h3 id="title-diem">Nhập Điểm Cho Sinh Viên</h3>
                <form id="form-diem" action="/api/scores" method="POST">
                  <input type="hidden" id="diem-id" name="id">
                  <select id="diem-svid" name="sinh_vien_id" required>
                    <option value="">-- Chọn Sinh Viên --</option>
                    ${optSV}
                  </select>
                  <input type="text" id="diem-tenmon" name="ten_mon" placeholder="Tên môn học" required>
                  <input type="number" step="0.1" min="0" max="10" id="diem-so" name="diem" placeholder="Điểm (0 - 10)" required style="width:100px;">
                  <button type="submit" id="btn-diem-sub" class="btn-add">Nhập Điểm</button>
                  <button type="button" id="btn-diem-can" onclick="resetDiem()" class="btn-cancel" style="display:none;">Hủy Sửa</button>
                </form>
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Tên Sinh Viên</th><th>Môn Học</th><th>Điểm Số</th><th>Thao tác</th></tr>
                </thead>
                <tbody>${rowsDiem}</tbody>
              </table>
            </div>

            <script>
              function openTab(tabId, btn) {
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                btn.classList.add('active');
              }

              if(window.location.hash) {
                const targetTab = window.location.hash.substring(1);
                const tabEl = document.getElementById(targetTab);
                if(tabEl) {
                  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                  document.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
                  tabEl.classList.add('active');
                  const idx = ['tab-sv', 'tab-lop', 'tab-diem'].indexOf(targetTab);
                  if(idx !== -1) document.querySelectorAll('.tab-btn')[idx].classList.add('active');
                }
              }

              function editSV(id, hoTen, ngaySinh, lopId) {
                document.getElementById('title-sv').innerText = 'Sửa Thông Tin Sinh Viên (ID: ' + id + ')';
                document.getElementById('form-sv').action = '/api/students/update';
                document.getElementById('sv-id').value = id;
                document.getElementById('sv-hoten').value = hoTen;
                document.getElementById('sv-ngaysinh').value = ngaySinh;
                document.getElementById('sv-lopid').value = lopId;
                document.getElementById('btn-sv-sub').innerText = 'Cập Nhật';
                document.getElementById('btn-sv-sub').className = 'btn-edit';
                document.getElementById('btn-sv-can').style.display = 'inline-block';
              }
              function resetSV() {
                document.getElementById('title-sv').innerText = 'Thêm Sinh Viên Mới';
                document.getElementById('form-sv').action = '/api/students';
                document.getElementById('sv-id').value = '';
                document.getElementById('sv-hoten').value = '';
                document.getElementById('sv-ngaysinh').value = '';
                document.getElementById('sv-lopid').value = '';
                document.getElementById('btn-sv-sub').innerText = 'Thêm Sinh Viên';
                document.getElementById('btn-sv-sub').className = 'btn-add';
                document.getElementById('btn-sv-can').style.display = 'none';
              }

              function editLop(id, tenLop, khoa) {
                document.getElementById('title-lop').innerText = 'Sửa Thông Tin Lớp Học (ID: ' + id + ')';
                document.getElementById('form-lop').action = '/api/classes/update';
                document.getElementById('lop-id').value = id;
                document.getElementById('lop-ten').value = tenLop;
                document.getElementById('lop-khoa').value = khoa;
                document.getElementById('btn-lop-sub').innerText = 'Cập Nhật';
                document.getElementById('btn-lop-sub').className = 'btn-edit';
                document.getElementById('btn-lop-can').style.display = 'inline-block';
              }
              function resetLop() {
                document.getElementById('title-lop').innerText = 'Thêm Lớp Học Mới';
                document.getElementById('form-lop').action = '/api/classes';
                document.getElementById('lop-id').value = '';
                document.getElementById('lop-ten').value = '';
                document.getElementById('lop-khoa').value = '';
                document.getElementById('btn-lop-sub').innerText = 'Thêm Lớp Học';
                document.getElementById('btn-lop-sub').className = 'btn-add';
                document.getElementById('btn-lop-can').style.display = 'none';
              }

              function editDiem(id, svId, tenMon, diem) {
                document.getElementById('title-diem').innerText = 'Sửa Điểm Số (ID: ' + id + ')';
                document.getElementById('form-diem').action = '/api/scores/update';
                document.getElementById('diem-id').value = id;
                document.getElementById('diem-svid').value = svId;
                document.getElementById('diem-tenmon').value = tenMon;
                document.getElementById('diem-so').value = diem;
                document.getElementById('btn-diem-sub').innerText = 'Cập Nhật';
                document.getElementById('btn-diem-sub').className = 'btn-edit';
                document.getElementById('btn-diem-can').style.display = 'inline-block';
              }
              function resetDiem() {
                document.getElementById('title-diem').innerText = 'Nhập Điểm Cho Sinh Viên';
                document.getElementById('form-diem').action = '/api/scores';
                document.getElementById('diem-id').value = '';
                document.getElementById('diem-svid').value = '';
                document.getElementById('diem-tenmon').value = '';
                document.getElementById('diem-so').value = '';
                document.getElementById('btn-diem-sub').innerText = 'Nhập Điểm';
                document.getElementById('btn-diem-sub').className = 'btn-add';
                document.getElementById('btn-diem-can').style.display = 'none';
              }
            </script>
          </body>
          </html>
        `);
      });
    });
  });
});

app.listen(3000, () => console.log('App service running on port 3000'));