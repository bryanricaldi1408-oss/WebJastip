const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const dbPool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: "postgres",
        password: "postgres",
        host: "localhost",
        port: 5432,
        database: "jastip",
      }
);

dbPool.connect((err, client, release) => {
  if (err) {
    console.error("Gagal terkoneksi ke database", err.stack);
  } else {
    console.log("Sukses terkoneksi ke database");
    client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        addresses VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        image_url TEXT,
        category VARCHAR(100) DEFAULT 'Kosmetik',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Kosmetik';

      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        item_link TEXT,
        details TEXT,
        category VARCHAR(100),
        price NUMERIC(12, 2),
        product_image_url TEXT,
        status VARCHAR(50) DEFAULT 'incomplete',
        approval_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        request_id INT REFERENCES requests(id) ON DELETE CASCADE,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        bank_name VARCHAR(100),
        sender_name VARCHAR(150),
        total_price NUMERIC(12, 2) NOT NULL,
        payment_receipt_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(12, 2) DEFAULT 0;

      DO $$ 
      BEGIN
        ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      DO $$ 
      BEGIN
        ALTER TABLE orders ALTER COLUMN product_id DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `).catch(e => console.error("Error auto-creating tables:", e.message));
    release();
  }
});

// Sign Up
app.post("/api/register", async (req, res) => {
  try {
    const param = req.body;

    const query = `
            INSERT INTO USERS(name, email, password, phone_number)
            VALUES($1, $2, $3, $4) RETURNING *
        `;
    const values = [param.name, param.email, param.password, param.phone];

    await dbPool.query(query, values);
    res.status(201).json({ message: "Data berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ message: "Data gagal disimpan" });
  }
});

// Log In
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = `
            SELECT id, name, email, password, phone_number, role
            FROM users
            WHERE email = $1 AND password = $2
        `;

    const value = [email, password];

    const result = await dbPool.query(query, value);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email atau password salah!" });
    }

    const userData = result.rows[0];

    res.status(200).json({
      message: "Login Berhasil!",
      user: userData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

// Update Profile
app.put("/api/update-profile", async (req, res) => {
  try {
    const { email, name, phone_number, addresses } = req.body;

    const query = `
            UPDATE users 
            SET name = $1, phone_number = $2, addresses = $3 
            WHERE email = $4 RETURNING id, name, email, phone_number, addresses
        `;
    const values = [name, phone_number, addresses, email];

    const result = await dbPool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json({
      message: "Profil berhasil diperbarui",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui profil" });
  }
});

//Update Password
app.put("/api/update-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    // Cek password saat ini
    const checkQuery = `SELECT password FROM users WHERE email = $1`;
    const checkResult = await dbPool.query(checkQuery, [email]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (checkResult.rows[0].password !== oldPassword) {
      return res.status(401).json({ message: "Password saat ini salah" });
    }

    // Jika cocok, update password baru
    const query = `
            UPDATE users
            SET password = $1
            WHERE email = $2 RETURNING id, name, email, phone_number, addresses
        `;

    const values = [newPassword, email];
    const result = await dbPool.query(query, values);

    res.status(200).json({
      message: "Password berhasil diperbarui",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui password" });
  }
});

// Send Product
app.post("/api/product", async (req, res) => {
  try {
    const { name, description, price, image_url, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nama produk wajib diisi" });
    }

    const rawPrice = String(price || "").replace(/\./g, "").replace(/\D/g, "");
    const numericPrice = parseFloat(rawPrice) || 0;

    const query = `
      INSERT INTO products (name, description, price, image_url, category)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;

    const result = await dbPool.query(query, [
      name,
      description || "",
      numericPrice,
      image_url || "",
      category || "Kosmetik",
    ]);

    const newProduct = result.rows[0];
    io.emit("new_product", newProduct);

    res.status(201).json({
      message: "Produk berhasil ditambahkan",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: `Gagal menambahkan produk: ${error.message}` });
  }
});

//GET ALL PRODUCTS
app.get("/api/products", async (_, res) => {
  try {
    const query = `
            SELECT id, name, description, price, image_url, category 
            FROM products 
            ORDER BY id DESC;
        `;

    const result = await dbPool.query(query);

    res.status(200).json({
      message: "Berhasil mengambil data produk",
      products: result.rows,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
});

// SET PRODUCT PRICE BY ADMIN
app.put("/api/product-price", async (req, res) => {
  const { price, productId } = req.body;
  try {
    const rawPrice = String(price || "0").replace(/\./g, "").replace(/\D/g, "");
    const numericPrice = parseFloat(rawPrice) || parseFloat(price) || 0;

    const query = `
      UPDATE products
      SET price = $1
      WHERE id = $2 RETURNING *
    `;
    const result = await dbPool.query(query, [numericPrice, productId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const updatedItem = result.rows[0];

    io.emit("product_price_set", updatedItem);

    res.status(200).json({
      message: "Harga produk berhasil diperbarui",
      product: updatedItem,
    });
  } catch (error) {
    console.error("Error updating product price:", error);
    res.status(500).json({ message: "Gagal memperbarui harga produk" });
  }
});
// GET ALL REQUESTS yang udh di approved
app.get("/api/requests/approved", async (_, res) => {
  try {
    const query = `
            SELECT 
                r.id,
                r.user_id,
                COALESCE(u.name, 'Anonim') AS user_name,
                u.phone_number,
                r.name,
                r.item_link,
                r.details,
                r.category,
                r.price,
                r.product_image_url,
                r.status,                     -- 'incomplete' atau 'complete'
                r.approval_status,            -- 'pending', 'approved', atau 'denied'
                r.created_at
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.approval_status = 'approved'
            ORDER BY r.created_at DESC;
        `;

    const result = await dbPool.query(query);

    res.status(200).json({
      requests: result.rows,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Gagal mengambil data request" });
  }
});
// GET ALL REQUESTS (Mengambil semua request titipan)
app.get("/api/requests", async (req, res) => {
  try {
    const email = req.query.email;

    let query;
    let params = [];

    if (email) {
      // Filter request berdasarkan email user
      query = `
                SELECT 
                    r.id,
                    r.user_id,
                    COALESCE(u.name, 'Anonim') AS user_name,
                    u.phone_number,
                    r.name,
                    r.item_link,
                    r.details,
                    r.category,
                    r.price,
                    r.product_image_url,
                    r.status,
                    r.approval_status,
                    r.created_at
                FROM requests r
                JOIN users u ON r.user_id = u.id
                WHERE u.email = $1
                ORDER BY r.created_at DESC;
            `;
      params = [email];
    } else {
      // Tanpa filter — untuk admin (backward compatible)
      query = `
                SELECT 
                    r.id,
                    r.user_id,
                    COALESCE(u.name, 'Anonim') AS user_name,
                    u.phone_number,
                    r.name,
                    r.item_link,
                    r.details,
                    r.category,
                    r.price,
                    r.product_image_url,
                    r.status,
                    r.approval_status,
                    r.created_at
                FROM requests r
                JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC;
            `;
    }

    const result = await dbPool.query(query, params);

    res.status(200).json({
      requests: result.rows,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Gagal mengambil data request" });
  }
});



//WebSocket.io untuk refresh otomatis
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.put("/api/approval", async (req, res) => {
  const { value, reqId } = req.body;
  try {
    const query = `
            UPDATE requests
            SET approval_status = $1
            WHERE id = $2 RETURNING *
        `;

    const values = [value, reqId];
    const result = await dbPool.query(query, values);

    const updatedItem = result.rows[0];

    io.emit("request_status_changed", updatedItem);

    res.status(200).json({
      message: "Status approval berhasil diperbarui",
      request: updatedItem,
    });
  } catch (error) {
    console.error("Error updating approval status:", error);
    res.status(500).json({ message: "Gagal memperbarui status approval" });
  }
});

// GET SINGLE REQUEST BY ID
app.get("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
            SELECT 
                r.id,
                r.user_id,
                COALESCE(u.name, 'Anonim') AS user_name,
                u.phone_number,
                r.name,
                r.item_link,
                r.details,
                r.category,
                r.price,
                r.product_image_url,
                r.status,
                r.approval_status,
                r.created_at
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = $1
        `;

    const result = await dbPool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching single request:", error);
    res.status(500).json({ message: "Gagal mengambil detail barang" });
  }
});

// SET PRICE BY ADMIN
app.put("/api/request-price", async (req, res) => {
  const { price, reqId } = req.body;
  try {
    const query = `
      UPDATE requests
      SET price = $1
      WHERE id = $2 RETURNING *
    `;
    const result = await dbPool.query(query, [price, reqId]);
    const updatedItem = result.rows[0];
    io.emit("request_price_set", updatedItem);
    res.status(200).json({
      message: "Harga berhasil ditetapkan",
      request: updatedItem,
    });
  } catch (error) {
    console.error("Error setting price:", error);
    res.status(500).json({ message: "Gagal menetapkan harga" });
  }
});



//Get product by id
app.get("/api/products/:id", async (req,res) => {
  try {
    const {id} = req.params;

    const query = `
      SELECT *
      FROM products
      WHERE id = $1
    `;

    // Note: Parameter for pg query must be inside an array
    const result = await dbPool.query(query, [id]);

    // Check if the product exists
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // Return the found product
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching single product:", error);
    res.status(500).json({ message: "Gagal mengambil detail produk" });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbPool.query("DELETE FROM cart WHERE product_id = $1", [id]).catch(() => {});
    const result = await dbPool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }
    io.emit("delete_product", { id: Number(id) });
    res.status(200).json({ message: "Produk berhasil dihapus", deleted: result.rows[0] });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Gagal menghapus produk" });
  }
});

// Submit Request Titipan
app.post("/api/request", async (req, res) => {
  try {
    const { name, link, detail, category, imageUrl, user_id } = req.body;

    const query = `
            INSERT INTO requests(user_id, name, item_link, details, category, product_image_url)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
    const values = [user_id, name, link, detail, category, imageUrl];
    const result = await dbPool.query(query, values);

    const fullQuery = `
            SELECT r.*, u.name AS user_name, u.phone_number
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = $1
        `;
    const newReq = await dbPool.query(fullQuery, [result.rows[0].id]);
    io.emit("new_request", newReq.rows[0]);

    res.status(201).json({
      message: "Request barang berhasil dikirim!",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Error submitting request:", error);
    res.status(500).json({ message: "Gagal mengirim request titipan" });
  }
});

// Update Status Barang (Complete/Incomplete)
app.put("/api/request-status", async (req, res) => {
  const { status, reqId } = req.body;
  try {
    const query = `
            UPDATE requests
            SET status = $1
            WHERE id = $2 RETURNING *
        `;
    const values = [status, reqId];
    const result = await dbPool.query(query, values);

    const updatedItem = result.rows[0];

    io.emit("request_status_changed", updatedItem);

    res.status(200).json({
      message: "Status barang berhasil diperbarui",
      request: updatedItem,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Gagal memperbarui status barang" });
  }
});

// ADD TO CART
app.post("/api/add-cart", async (req, res) => {
  try {
    const { user_id, product_id, request_id, quantity } = req.body;
    
    const query = `
      INSERT INTO cart (user_id, product_id, request_id, quantity) 
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const values = [user_id, product_id || null, request_id || null, quantity];
    const result = await dbPool.query(query, values);
    
    res.status(201).json({ message: "Berhasil ditambahkan ke cart", cartItem: result.rows[0] });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Gagal menambahkan ke cart" });
  }
});

//GET QTY IN CART
app.get("/api/cart", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id diperlukan" });
    }

    // Mengambil semua item cart dengan LEFT JOIN ke tabel products dan requests
    const query = `
      SELECT 
        c.id AS id,
        c.quantity,
        c.product_id,
        c.request_id,
        CASE 
          WHEN c.product_id IS NOT NULL THEN 'product'
          ELSE 'request'
        END AS type,
        COALESCE(p.name, r.name) AS name,
        COALESCE(p.image_url, r.product_image_url) AS image_url,
        COALESCE(r.category, 'Katalog') AS category,
        COALESCE(p.price, r.price, 0) AS price,
        r.status AS request_status
      FROM cart c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN requests r ON c.request_id = r.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;

    const result = await dbPool.query(query, [user_id]);

    res.status(200).json({ 
      message: "Data cart berhasil di-retrieve", 
      cart: result.rows
    });
  } catch (error) {
    console.error("Error getting cart items:", error);
    res.status(500).json({ message: "Gagal mendapatkan data cart" });
  }
});

// UPDATE CART ITEM QUANTITY
app.put("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ message: "Quantity tidak valid" });
    }

    const query = `
      UPDATE cart
      SET quantity = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await dbPool.query(query, [quantity, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item keranjang tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Quantity berhasil diperbarui", 
      cartItem: result.rows[0] 
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ message: "Gagal memperbarui quantity" });
  }
});

// DELETE CART ITEM
app.delete("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM cart
      WHERE id = $1
      RETURNING *
    `;
    const result = await dbPool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item keranjang tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Item berhasil dihapus dari keranjang", 
      deletedItem: result.rows[0] 
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Gagal menghapus item dari keranjang" });
  }
});

// BANNERS API
// GET BANNERS
app.get("/api/banners", async (req, res) => {
  try {
    const result = await dbPool.query("SELECT * FROM banners ORDER BY id DESC");
    res.status(200).json({ banners: result.rows });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ message: "Gagal mengambil data banner" });
  }
});

// ADD BANNER(S)
app.post("/api/banners", async (req, res) => {
  try {
    const { banners } = req.body;
    if (Array.isArray(banners) && banners.length > 0) {
      const inserted = [];
      for (const item of banners) {
        const result = await dbPool.query(
          "INSERT INTO banners (title, image_url) VALUES ($1, $2) RETURNING *",
          [item.title || "Banner", item.image_url]
        );
        inserted.push(result.rows[0]);
      }
      return res.status(201).json({ message: "Banner berhasil disimpan", banners: inserted });
    } else if (req.body.image_url) {
      const { title, image_url } = req.body;
      const result = await dbPool.query(
        "INSERT INTO banners (title, image_url) VALUES ($1, $2) RETURNING *",
        [title || "Banner", image_url]
      );
      return res.status(201).json({ message: "Banner berhasil disimpan", banner: result.rows[0] });
    } else {
      return res.status(400).json({ message: "Data banner tidak valid" });
    }
  } catch (error) {
    console.error("Error saving banner:", error);
    res.status(500).json({ message: "Gagal menyimpan banner" });
  }
});

// DELETE BANNER
app.delete("/api/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbPool.query("DELETE FROM banners WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Banner tidak ditemukan" });
    }
    res.status(200).json({ message: "Banner berhasil dihapus", deleted: result.rows[0] });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ message: "Gagal menghapus banner" });
  }
});

// ORDERS / PAYMENT API
// SUBMIT ORDER PAYMENT
app.post("/api/orders", async (req, res) => {
  try {
    const { user_id, bank_name, sender_name, total_price, payment_receipt_url } = req.body;

    const rawPrice = String(total_price || "0").replace(/\./g, "").replace(/\D/g, "");
    const numericPrice = parseFloat(rawPrice) || parseFloat(total_price) || 0;

    const query = `
      INSERT INTO orders (user_id, bank_name, sender_name, total_price, payment_receipt_url, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;

    const parsedUserId = user_id && !isNaN(parseInt(user_id, 10)) ? parseInt(user_id, 10) : null;

    const values = [
      parsedUserId,
      bank_name || "",
      sender_name || "",
      numericPrice,
      payment_receipt_url || ""
    ];

    const result = await dbPool.query(query, values);
    const newOrder = result.rows[0];

    // If parsedUserId is provided, clear the user's cart
    if (parsedUserId) {
      await dbPool.query("DELETE FROM cart WHERE user_id = $1", [parsedUserId]).catch(() => {});
    }

    // Fetch order with user info for broadcasting
    const fullQuery = `
      SELECT o.*, COALESCE(u.name, o.sender_name) AS user_name, u.phone_number
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const fullOrderResult = await dbPool.query(fullQuery, [newOrder.id]);
    const broadcastOrder = fullOrderResult.rows[0] || newOrder;

    io.emit("new_order", broadcastOrder);

    res.status(201).json({
      message: "Bukti pembayaran berhasil dikirim!",
      order: broadcastOrder,
    });
  } catch (error) {
    console.error("Error submitting order payment:", error);
    res.status(500).json({ message: error.message || "Gagal mengirim bukti pembayaran" });
  }
});

// GET ALL ORDERS FOR ADMIN
app.get("/api/orders", async (_, res) => {
  try {
    const query = `
      SELECT 
        o.id,
        o.user_id,
        o.bank_name,
        o.sender_name,
        o.total_price,
        o.payment_receipt_url,
        o.status,
        o.created_at,
        COALESCE(u.name, o.sender_name) AS user_name,
        u.phone_number
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC;
    `;

    const result = await dbPool.query(query);

    res.status(200).json({
      orders: result.rows,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Gagal mengambil data order" });
  }
});

// GET ORDERS BY USER (for profile page)
app.get("/api/orders/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT id, bank_name, sender_name, total_price, status, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY id DESC;
    `;
    const result = await dbPool.query(query, [userId]);
    res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Gagal mengambil data order" });
  }
});

// UPDATE ORDER PAYMENT STATUS
app.put("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const query = `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await dbPool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    const updatedOrder = result.rows[0];

    io.emit("order_status_changed", updatedOrder);

    res.status(200).json({
      message: "Status pembayaran berhasil diperbarui",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Gagal memperbarui status pembayaran" });
  }
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server Listening at PORT:${PORT}...`);
});

