import "../style/Profile.css";
import "../style/Auth.css";
import profileIcon from "../assets/ProfileIcon.png";
import { users, setUsers, showNotification } from "../store/WebStore"
import { useNavigate } from "@solidjs/router";
import { onMount, createSignal, Show } from "solid-js";
export const Profile = () => {
    const [name, setName] = createSignal(users.currUser?.name || "");
    const [phone, setPhone] = createSignal(users.currUser?.phone_number || "");
    const [alamat, setAlamat] = createSignal(users.currUser?.address || "");
    const [password, setPassword] = createSignal("");
    const [newPass, setNewPass] = createSignal("");
    const [confirmPass, setConfirmPass] = createSignal("");
    const [mapQuery, setMapQuery] = createSignal("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: users.currUser?.email,
                    name: name(),
                    phone_number: phone(),
                    address: alamat()
                })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification("Profil berhasil disimpan!", "success");
                setUsers('currUser', data.user);
            } else {
                showNotification("Gagal menyimpan profil: " + data.message, "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("Error: Tidak bisa menghubungi server.", "error");
        }
    };    onMount(() => {
        // Jika currUser masih kosong (belum login)
        if (users.currUser === null) {
            showNotification("Akses ditolak! Anda harus Log In terlebih dahulu.", "error");
            // Tendang balik ke halaman login, dan replace history agar tidak bisa di-back
            navigate("/login", { replace: true }); 
        }
    });


    const changePassword = async (e) =>{
        e.preventDefault();
        if(newPass() !== confirmPass()){
            showNotification("Password baru dan konfirmasi password tidak sama!", 'error');
            return;
        }
        

        try {
            const response = await fetch('http://localhost:5000/api/update-password', {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: users.currUser?.email,
                    oldPassword: password(),
                    newPassword : newPass()
                })
            });
            const data = await response.json();

            if (response.ok) {
                showNotification("Password berhasil diubah!", "success");
                setUsers('currUser', data.user);
                setPassword("");
                setNewPass("");
                setConfirmPass("");
            } else {
                showNotification("Gagal mengubah password: " + data.message, "error");
            }
        } catch (error) {
            console.error(error);
            showNotification("Error: Tidak bisa menghubungi server.", "error");
        }
    };
    const navigate = useNavigate();
    const handleLogout = () =>{
        setUsers('currUser', null)
        showNotification("Berhasil keluar (Log Out)", "info");
        navigate('/', { replace: true})  
    };
    return (
        <div class="profile-container">
            <div class="profile-header">
                <img src={profileIcon} alt="Profile" class="profile-page-icon" />
                <div class="profile-title-area">
                    <h1 class="profile-title">Profil Saya</h1>
                    <p class="profile-subtitle">Atur alamat pengiriman dan keamanan akun Anda.</p>
                </div>
            </div>

            <div class="profile-content">
                {/* Bagian Kiri: Informasi Pribadi & Alamat */}
                <div class="profile-section">
                    <h2 class="section-heading">Informasi & Pengiriman</h2>
                    <form class="profile-form" onSubmit={handleSubmit}>
                        
                        <div class="form-group">
                            <label>Nama Lengkap</label>
                            <input type="text" value={name()} onInput={(e) => setName(e.target.value)} class="profile-input" />
                        </div>
                        
                        <div class="form-group">
                            <label>Email</label>
                            {/* Email biasanya tidak bisa diganti (disabled) */}
                            <input type="email" placeholder={users.currUser?.email} class="profile-input" disabled />
                        </div>

                        <div class="form-group">
                            <label>Nomor Telepon / WhatsApp</label>
                            <input type="text" value={phone()} onInput={(e) => setPhone(e.target.value)} class="profile-input" />
                        </div>

                        <div class="form-group">
                            <label>Alamat Pengiriman Lengkap</label>
                            <textarea 
                                placeholder="Tuliskan nama jalan, RT/RW, kelurahan, kecamatan, dan kode pos dengan jelas..." 
                                class="profile-textarea" 
                                rows="4"
                                value={alamat()}
                                onInput={(e) => setAlamat(e.target.value)}
                            ></textarea>
                            
                            {/* Tombol pemicu map agar tidak berkedip saat ngetik */}
                            <button 
                                type="button" 
                                class="profile-btn-secondary" 
                                style="margin-top: 8px; width: fit-content;" 
                                onClick={() => setMapQuery(alamat())}
                            >
                                Cari Titik di Peta
                            </button>

                            <Show when={mapQuery() !== ""}>
                                <div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #eaeaea;">
                                    <iframe 
                                        width="100%" 
                                        height="250" 
                                        style="border:0;" 
                                        loading="lazy" 
                                        allowfullscreen 
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery())}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                    ></iframe>
                                </div>
                            </Show>
                        </div>

                        <button type="submit" class="profile-btn-primary">Simpan Profil & Alamat</button>
                    </form>
                </div>

                {/* Bagian Kanan: Ganti Password */}
                <div class="profile-section">
                    <h2 class="section-heading">Keamanan Akun</h2>
                    <form class="profile-form" onSubmit={changePassword}>
                        
                        <div class="form-group">
                            <label>Password Saat Ini</label>
                            <input type="password" placeholder="••••••••" class="profile-input" 
                                value = {password()}
                                onInput={e => setPassword(e.target.value)}
                            />
                        </div>

                        <div class="form-group">
                            <label>Password Baru</label>
                            <input type="password" placeholder="Minimal 8 karakter" class="profile-input" 
                                value = {newPass()}
                                onInput={e => setNewPass(e.target.value)}
                            />
                        </div>

                        <div class="form-group">
                            <label>Konfirmasi Password Baru</label>
                            <input type="password" placeholder="Ulangi password baru" class="profile-input" 
                                value={confirmPass()}
                                onInput={e => setConfirmPass(e.target.value)}
                            />
                        </div>
                        
                        <button type="submit" class="profile-btn-secondary">Ganti Password</button>
                    </form>
                    
                    <div class="logout-area">
                        <button class="profile-btn-danger" onClick={handleLogout}>Keluar (Log Out)</button>
                    </div>
                </div>
            </div>
                <div class="req-table">
                    <div class="table-responsive">
                    <table class="admin-table">
                    <thead>
                        <tr>
                        <th>Info Pemesan</th>
                        <th>Gambar Produk</th>
                        <th>Detail Barang Incaran</th>
                        <th>Persetujuan (Approve/Deny)</th>
                        <th>Status Barang</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};