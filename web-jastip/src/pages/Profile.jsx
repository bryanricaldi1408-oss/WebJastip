import "../style/Profile.css";
import "../style/Auth.css";
import "../style/UserRequest.css";
import profileIcon from "../assets/ProfileIcon.png";
import { users, setUsers, showNotification } from "../store/WebStore"
import { useNavigate } from "@solidjs/router";
import { onMount, onCleanup, createSignal, Show, For } from "solid-js";
import { UserRequestRow } from "../components/UserRequestRow";
import { io } from "socket.io-client";
export const Profile = () => {
    const [name, setName] = createSignal(users().currUser?.name || "");
    const [phone, setPhone] = createSignal(users().currUser?.phone_number || "");
    const [alamat, setAlamat] = createSignal(users().currUser?.address || "");
    const [password, setPassword] = createSignal("");
    const [newPass, setNewPass] = createSignal("");
    const [confirmPass, setConfirmPass] = createSignal("");
    const [mapQuery, setMapQuery] = createSignal("");
    const [myRequests, setMyRequests] = createSignal([]);

    const socket = io('http://localhost:5000');


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: users().currUser?.email,
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
    };    onMount(async () => {
        // Jika currUser masih kosong (belum login)
        if (users().currUser === null) {
            showNotification("Akses ditolak! Anda harus Log In terlebih dahulu.", "error");
            // Tendang balik ke halaman login, dan replace history agar tidak bisa di-back
            navigate("/login", { replace: true }); 
            return;
        }

        // Fetch requests milik user ini
        try {
            const response = await fetch(`http://localhost:5000/api/requests?email=${encodeURIComponent(users().currUser?.email)}`);
            const data = await response.json();
            if (response.ok) {
                setMyRequests(data.requests || []);
            }
        } catch (err) {
            console.error('Error fetching user requests:', err);
        }

        // Listen for real-time new requests
        socket.on('new_request', (newReq) => {
            // Hanya tambahkan jika request ini milik user yang sedang login
            if (newReq.user_email === users().currUser?.email || newReq.email === users().currUser?.email) {
                setMyRequests((prev) => [newReq, ...prev]);
            }
        });

        // Listen for real-time approval/deny updates
        socket.on('request_status_changed', (updatedReq) => {
            setMyRequests((prev) =>
                prev.map((req) =>
                    req.id === updatedReq.id
                        ? { ...req, approval_status: updatedReq.approval_status, status: updatedReq.status }
                        : req
                )
            );
        });
    });

    onCleanup(() => {
        socket.off('new_request');
        socket.off('request_status_changed');
        socket.disconnect();
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
                    email: users().currUser?.email,
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
                            <input type="email" placeholder={users().currUser?.email} class="profile-input" disabled />
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
                        <button class="profile-btn-danger" onClick={handleLogout}>Log out</button>
                        <Show when={users().currUser?.role === 'admin'}>
                            <button class="profile-btn-admin" onClick={() => navigate('/admin')}>To Admin Panel</button>
                        </Show>
                    </div>
                </div>
            </div>
            
            {/* Section Request Table */}
            <div class="ur-section">
                <div class="ur-section-header">
                    <h2>Riwayat Request Saya</h2>
                    <Show when={myRequests().length > 0}>
                        <span class="ur-count">{myRequests().length}</span>
                    </Show>
                </div>
                <div class="ur-card">
                    <Show 
                        when={myRequests().length > 0}
                        fallback={
                            <div class="ur-empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ccc;">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <p>Belum ada request. Silakan ajukan request titipan Anda!</p>
                            </div>
                        }
                    >
                        <div class="ur-table-responsive">
                            <table class="ur-table">
                                <thead>
                                    <tr>
                                        <th>Info Pemesan</th>
                                        <th>Gambar Produk</th>
                                        <th>Detail Barang</th>
                                        <th>Persetujuan</th>
                                        <th>Status Barang</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={myRequests()}>
                                        {(item) => (
                                            <UserRequestRow
                                                id={item.id}
                                                email={item.user_name}
                                                phone_number={item.phone_number}
                                                item_link={item.item_link}
                                                name={item.name}
                                                details={item.details}
                                                category={item.category}
                                                product_image_url={item.product_image_url}
                                                approval_status={item.approval_status}
                                                status={item.status}
                                            />
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
};