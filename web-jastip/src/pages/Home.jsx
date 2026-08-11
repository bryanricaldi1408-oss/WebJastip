import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import "../style/Home.css"
import { Request } from "../components/Request";
import { users } from "../store/WebStore"
import { showNotification } from "../store/WebStore";
import { io } from "socket.io-client";

const imageModules = import.meta.glob("../images/*.{png, jpeg,jpg}",{
    eager: true,
    import: "default",
});

const banners = Object.values(imageModules);
const socket = io("http://localhost:5000");


export const Home = () => {
    // State untuk melacak file gambar yang diunggah
    const [fileName, setFileName] = createSignal("");
    const [name, setName] = createSignal("");
    const [link, setLink] = createSignal("");
    const [detail, setDetail] = createSignal("");
    const [selectedFile, setSelectedFile]= createSignal("");
    const [category, setCategory]= createSignal("");    
    const [requests, setRequests] = createSignal([]);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    
    onMount(() => {
        fetchRequests();
        socket.on('request_status_changed', (updatedItem) => {
            if (updatedItem.approval_status === 'approved') {
                // Cek apakah item sudah ada di array
                setRequests((prev) => {
                    const exists = prev.some(item => item.id === updatedItem.id);
                    if (exists) return prev;  // Sudah ada, jangan tambah lagi
                    return [updatedItem, ...prev];  // Belum ada, tambahkan
                });
            } else {
                // Jika denied/pending, hapus dari tampilan client
                setRequests((prev) => prev.filter(item => item.id !== updatedItem.id));
            }
        });
    });
    
    onCleanup(()=>{
        socket.off('request_status_changed');
    });
    const handleRequest = async (e) => {
        e.preventDefault();
        
        if (isSubmitting()) return;
        
        const currentName = name();
        const currentLink = link();
        const currentDetail = detail();
        const currentCategory = category();
        const currentSelectedFile = selectedFile();
        
        if (!currentLink && !currentDetail && !currentCategory && !currentSelectedFile && !currentName) {
            showNotification("Mohon isi minimal satu informasi barang!", "error");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            let imageUrl = "";
            
            if(currentSelectedFile){
                try {
                    const formData = new FormData();
                    formData.append("file", currentSelectedFile); // Cloudinary menggunakan "file"
                    
                    // GANTI 2 BARIS DI BAWAH DENGAN DATA CLOUDINARY KAMU
                    formData.append("upload_preset", "jastip_preset"); 
                    const cloudName = "qbdar9fk"; 
                    
                    const imgRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                        method: "POST",
                        body: formData
                    });
                    const imgData = await imgRes.json();
                    
                    if (imgData.secure_url) {
                        imageUrl = imgData.secure_url;
                    } else {
                        showNotification("Gagal mengunggah gambar ke Cloudinary", "error");
                        setIsSubmitting(false);
                        return;
                    }
                } catch (imgErr) {
                    console.error("Error upload:", imgErr);
                    showNotification("Gagal mengunggah gambar. Periksa koneksi internet Anda.", "error");
                    setIsSubmitting(false);
                    return;
                }
            }
            
            const response = await fetch('http://localhost:5000/api/request', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: currentName,
                    link: currentLink,
                    detail: currentDetail,
                    category: currentCategory,
                    imageUrl: imageUrl,
                    user_id: users.currUser?.id || null
                })
            });
            
            const data = await response.json();
            if(response.ok){
                showNotification(data.message || "Request barang berhasil dikirim!", "success");
                setName("");
                setLink("");
                setDetail("");
                setCategory("");
                setFileName("");
                setSelectedFile(null);
                fetchRequests();
            } else {
                showNotification("Gagal mengirim request: " + (data.message || "Terjadi kesalahan"), "error");
            }
        } catch (error) {
            console.error("Error handleRequest:", error);
            showNotification("Error: Tidak bisa menghubungi server.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            setSelectedFile(file);
        } else {
            setFileName("");
            setSelectedFile(null);
        }
    };
    
    const fetchRequests = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/requests/approved');
            const data = await response.json();
            
            if(response.ok){
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Gagal mengambil data request:", error);
        }
    };
    
    // State untuk melacak slide aktif (dimulai dari index 0)
    const [currentIndex, setCurrentIndex] = createSignal(0);
    // Fungsi navigasi slide berikutnya
    const nextSlide = () => {
        if (banners.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };
    // Fungsi navigasi slide sebelumnya
    const prevSlide = () => {
        if (banners.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };
    // Auto-play berpindah otomatis setiap 4 detik
    onMount(() => {
        fetchRequests();
        if (banners.length === 0) return;
        const timer = setInterval(nextSlide, 4000);
        onCleanup(() => clearInterval(timer));
    });
    return (
        <>
        <div class="hero-container">
        {/* Banner Carousel Card */}
        <div class="banner-card">
        <div class="carousel-wrapper">
        {/* Tampilkan gambar yang sedang aktif jika gambar tersedia */}
        {banners.length > 0 ? (
            <img
            class="carousel-img"
            src={banners[currentIndex()]}
            alt={`Banner ${currentIndex() + 1}`}
            />
        ) : (
            <div class="no-image-card">
            <div class="no-image-icon">🖼️</div>
            <h2 class="no-image-title"><span class="blue">Promo & Info</span> Banner</h2>
            <p class="no-image-subtitle">Belum ada gambar promo di folder <code>/src/images</code></p>
            <div class="no-image-badge">✨ Tempat Banner Carousel Promo</div>
            </div>
        )}
        {/* Tombol Navigasi Panah Kiri & Kanan */}
        <button class="nav-btn prev-btn" onClick={prevSlide}>❮</button>
        <button class="nav-btn next-btn" onClick={nextSlide}>❯</button>
        {/* Indikator Halaman (misal: 1 / 3) */}
        <div class="page-indicator">
        {currentIndex() + 1} / {banners.length}
        </div>
        </div>
        </div>
        {/* Request Form Card */}
        <div class="request-card">
        <h2 class="t-req"><span class="blue">Request</span> Aja.</h2>
        <p class="sub-req">Kalau gak nemu yang kamu mau! :D</p>
        {(!users.currUser) ? (
            <div class="login-prompt-card">
            <div class="login-prompt-icon">🔒</div>
            <h3>Ingin Titip Barang?</h3>
            <p>Silakan <strong>Log In</strong> atau <strong>Sign Up</strong> terlebih dahulu untuk mengajukan request barang impianmu.</p>
            <div class="login-prompt-actions">
            <A href="/login" class="btn-prompt-login">Log In</A>
            <A href="/signup" class="btn-prompt-signup">Sign Up</A>
            </div>
            </div>
        ) : (
            <form class="request-form" onSubmit={handleRequest}>
            <div class="form-group">
            <label>Nama Produk</label>
            <input type="text" placeholder="Nama Barang" class="req-input"
            value={name()}
            onInput={e => setName(e.target.value)}
            />
            </div>
            
            <div class="form-group">
            <label>Link Barang Incaran</label>
            <input type="text" placeholder="Link produk di Webstore" class="req-input"
            value={link()}
            onInput={e => setLink(e.target.value)}
            />
            </div>
            
            <div class="form-group">
            <label>Detail/Keterangan Barang</label>
            <input type="text" placeholder="Model/Tipe/Warna/Ukuran" class="req-input"
            value={detail()}
            onInput={e => setDetail(e.target.value)}
            />
            </div>
            
            <div class="form-group">
            <label>Kategori</label>
            <input type="text" placeholder="Kosmetik/Makanan/Fashion/dll." class="req-input"
            value={category()}
            onInput={e => setCategory(e.target.value)}
            />
            </div>
            
            <div class="form-group">
            <label>Foto Produk</label>
            <label class={`file-upload-card ${fileName() ? 'uploaded' : ''}`}>
            <span class="upload-icon">{fileName() ? "✓" : "+"}</span>
            <span class="upload-text">
            {fileName() ? `Berhasil Unggah: ${fileName()}` : "Upload Foto Produk"}
            </span>
            <input 
            type="file" 
            accept="image/*" 
            class="hidden-file-input"
            onChange={handleFileChange}
            />
            </label>
            </div>
            
            
            <button type="submit" class="btn-send-req" disabled={isSubmitting()}>
            {isSubmitting() ? "MENGIRIM..." : "KIRIM REQUEST"}
            </button>
            </form>
        )}
        </div>
        </div>
        
        {/* Featured Products Section */}
        <div class="products-section">
        <div class="section-header">
        <h2 class="section-title">
        <span class="blue">Featured</span> Products
        </h2>
        <A href="/products" class="see-all">See All</A>
        </div>
        <Show when={requests().length === 0}>
        <div class="no-requests-msg">
        <p>Belum ada request titipan saat ini.</p>
        </div>
        </Show>
        <Show when={requests().length > 0}>
        <div class="section-header">
        <h2 class="section-title">
        <span class="blue">Recent</span> Requests
        </h2>
        </div>
        
        <div class="request-container">
        <For each={requests()}>
        {(item)=> (
            <Request 
            image={item.product_image_url}
            category={item.category}
            name={item.name}
            desc={item.details}
            user={item.user_name}
            link={item.item_link}
            />
        )}
        </For>
        </div>
        </Show>
        </div>
        </>
    );
};
