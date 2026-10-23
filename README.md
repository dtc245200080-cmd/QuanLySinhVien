# Hệ Thống Quản Lý Sinh Viên

Dự án Triển khai và Quản trị Hệ thống Phần mềm - Quản lý sinh viên bằng Docker Compose.

## Thành phần Hệ thống
- Web App: Node.js (Express)
- Database: MySQL 8.0 & phpMyAdmin
- Reverse Proxy: Nginx (SSL & Security Headers)
- Giám sát: Prometheus + Grafana + cAdvisor
- Log tập trung: Loki + Promtail

## Hướng dẫn Khởi chạy
1. Yêu cầu: Đã cài đặt Docker và Docker Compose.
2. Chạy lệnh khởi động:
   ```bash
   docker-compose up -d