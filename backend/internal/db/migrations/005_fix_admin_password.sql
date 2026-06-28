-- Fix default admin password hash (README: Admin123!)
UPDATE admin_users
SET password_hash = '$2b$10$C/eDydHlKT0KhvH4LIT0Je/wpoi/fgmTRof5nswsW1yOQ8XXD9k8S'
WHERE email = 'admin@ticketon.kz';
