import { useParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import "../style/Detail.css";

export const Detail = () => {
    // 1. Ambil parameter ID dari URL Router (misal: /detail/123 -> id nya 123)
    const params = useParams(); 
    
    // 2. Buat signal untuk menyimpan data produk yang didapat
    const [product, setProduct] = createSignal(null);
    const [isLoading, setIsLoading] = createSignal(true);

    // 3. Ambil data saat komponen pertama kali dimuat
    onMount(async () => {
        try {
            // Ganti URL ini dengan API endpoint backend Anda
            const response = await fetch(`http://localhost:5000/api/requests/${params.id}`);
            const data = await response.json();
            
            setProduct(data);
        } catch (error) {
            console.error("Gagal mengambil data produk:", error);
        } finally {
            setIsLoading(false);
        }
    });

    return (
        <div class="detail-page-container">
            {/* Tampilkan Loading jika data belum ada */}
            <Show when={isLoading()}>
                <p>Memuat data produk...</p>
            </Show>

            {/* Tampilkan konten jika data product sudah berhasil didapat */}
            <Show when={!isLoading() && product()}>
                <div class="detail-breadcrumb">
                    <span>Beranda</span>
                    <span class="divider">/</span>
                    <span>{product().category}</span>
                    <span class="divider">/</span>
                    <span class="current">{product().name}</span>
                </div>

                <div class="detail-content-wrapper">
                    {/* Bagian Kiri: Gambar Produk */}
                    <div class="detail-image-section">
                        <div class="main-image-container">
                            {/* Gunakan gambar dari database */}
                            <img src={product().product_image_url} alt={product().name} style={{ width: '100%' }} />
                        </div>
                    </div>

                    {/* Bagian Kanan: Info Produk */}
                    <div class="detail-info-section">
                        <div class="category-badge">{product().category}</div>
                        <h1 class="detail-title">{product().name}</h1>
                        
                        <div class="detail-price">
                            {/* Contoh harga statis, jika di DB ada harga, gunakan product().price */}
                            Rp 250.000 
                        </div>

                        {/* Status Bar */}
                        <div class="detail-status-bar">
                            <div class="status-item">
                                <span class="icon">👤</span>
                                <span class="text">Direquest oleh: {product().user_name}</span>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div class="detail-description">
                            <h3>Deskripsi Produk</h3>
                            <p>{product().details}</p>
                        </div>

                        <div class="detail-actions">
                            {/* Buka link barang incaran di tab baru */}
                            <a href={product().item_link} target="_blank" rel="noopener noreferrer" class="btn-primary-jastip" style="text-decoration: none;">
                                <span class="btn-icon">🔗</span>
                                Cek Link Toko Asli
                            </a>
                            <button class="btn-secondary-jastip">
                                <span class="btn-icon">🛍️</span>
                                Titip Barang Ini
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};