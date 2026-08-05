const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const app = express();

app.use(cors());
app.use(express.json());

const dbPool = new Pool({
    user : 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'jastip'
})

dbPool.connect((err, client, release) => {
    if(err){
        console.error('Gagal terkoneksi ke database', err.stack)
    }else{
        console.log('Suskses terkonkesi ke database');
        release();
    }
});

// Sign Up
app.post('/api/register', async (req, res) =>{
    try{
        const param = req.body;

        const query = `
            INSERT INTO USERS(name, email, password, phone_number)
            VALUES($1, $2, $3, $4) RETURNING *
        `;
        const values = [param.name, param.email, param.password, param.phone];

        await dbPool.query(query, values);
        res.status(201).json({message : 'Data berhasil disimpan'})
    }catch(err){
        res.status(500).json({message: 'Data gagal disimpan'})
    }

})

// Log In
app.post('/api/login', async (req,res) => {
    try{
        const {email, password} = req.body

        const query = `
            SELECT id, name, email, password, phone_number
            FROM users
            WHERE email = $1 AND password = $2
        `;

        const value = [email, password];

        const result = await dbPool.query(query, value);
        
        if(result.rows.length === 0){
            return res.status(401).json({message : 'Email atau password salah!'})
        }

        const userData = result.rows[0];

        res.status(200).json({
            message : "Login Berhasil!",
            user : userData
        });
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Update Profile
app.put('/api/update-profile', async (req, res) => {
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
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        res.status(200).json({
            message: 'Profil berhasil diperbarui',
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal memperbarui profil' });
    }
});

//Update Password
app.put('/api/update-password', async (req, res)=>{
    try {
        const { email, oldPassword, newPassword } = req.body;
        
        // Cek password saat ini
        const checkQuery = `SELECT password FROM users WHERE email = $1`;
        const checkResult = await dbPool.query(checkQuery, [email]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        if (checkResult.rows[0].password !== oldPassword) {
            return res.status(401).json({ message: 'Password saat ini salah' });
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
            message: 'Password berhasil diperbarui',
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal memperbarui password' });
    }
});

// Submit Request Titipan
app.post('/api/request', async (req, res) => {
    try{
        const {name, link, detail, category, imageUrl, user_id} = req.body;

        const query =  `
            INSERT INTO requests(user_id, name, item_link, details, category, product_image_url)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        const values = [user_id, name, link, detail, category, imageUrl];

        const result = await dbPool.query(query, values);
        
        // Mengirimkan response sukses
        res.status(201).json({
            message: 'Request barang berhasil dikirim!',
            request: result.rows[0]
        });
    }catch(error){
        console.error("Error submitting request:", error);
        res.status(500).json({ message: 'Gagal mengirim request titipan' });
    }
});

//GET ALL PRODUCTS
app.get('/api/products', async (_ , res) => {
    try{
        const query = `
            SELECT name, description, price, image_url
            FROM products
            ORDER BY created_at DESC;
        `;

        const result = await dbPool.query(query);
        res.status(201).json({
            product : result
        });
    }catch(error){
        res.status(500).json({ message: 'Gagal mengirim semua produk' });
    }
});
// GET ALL REQUESTS
// GET ALL REQUESTS (Mengambil semua request titipan)
app.get('/api/requests', async (_, res) => {
    try {
        const query = `
            SELECT 
                r.id,
                r.user_id,
                COALESCE(u.name, 'Anonim') AS user_name,        
                r.name,
                r.item_link,
                r.details,
                r.category,
                r.product_image_url,
                r.status,                     -- 'incomplete' atau 'complete'
                r.approval_status,            -- 'pending', 'approved', atau 'denied'
                r.created_at
            FROM requests r
            LEFT JOIN users u ON r.user_id = u.id  -- Menggunakan LEFT JOIN agar request tanpa user tetap muncul
            ORDER BY r.created_at DESC;
        `;

        const result = await dbPool.query(query);

        res.status(200).json({
            requests: result.rows
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Gagal mengambil data request' });
    }
});
const PORT = 5000;
app.listen(PORT, () =>{
    console.log(`Server Listening at PORT:${PORT}...`)
})