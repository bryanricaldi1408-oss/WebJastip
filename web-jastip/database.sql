-- =========================================================================
-- ERD & DATABASE SCHEMA FOR JASTIP WEBSITE (PostgreSQL)
-- =========================================================================

-- DROP TABLES (Urutan dibalik agar tidak bentrok foreign key jika dieksekusi ulang)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS banners CASCADE;

-- 1. TABEL: users 
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL, 
    addresses VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL: products (Katalog Barang di Home)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL: requests (Form Request Titipan Kustom)
-- Relasi: 1 User bisa memiliki banyak Request
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    item_link TEXT,
    details TEXT,
    category VARCHAR(100),
    price NUMERIC(12, 2),
    product_image_url TEXT,
    status VARCHAR(50) DEFAULT 'incomplete', -- incomplete, complete
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL: orders (Transaksi Checkout Produk Katalog)
-- Relasi: Menghubungkan 'users' dan 'products'
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    total_price NUMERIC(12, 2) NOT NULL,
    payment_receipt_url TEXT, 
    status VARCHAR(50) DEFAULT 'pending_payment', -- pending_payment, verified, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);  

-- 5. TABEL: banners (Promo Slide dinamis)
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


--account dummy for testing
INSERT INTO users(name, email, phone_number,password)
VALUES ('admin', 'admin@gmail.com', '08', 'admin1234', 'admin')