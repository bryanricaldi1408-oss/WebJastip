import { useLocation, useParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import "../style/Detail.css";
import { cartCount, setCartCount, showNotification } from "../store/WebStore";
import { users } from "../store/WebStore";
export const Detail = () => {
  const params = useParams();
  const location = useLocation();
  const [product, setProduct] = createSignal(null);
  const [request, setRequest] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isAdded, setIsAdded] = createSignal(false);
  const [wishlistCount, setWishlistCount] = createSignal(Math.floor(Math.random() * 50) + 10); // Dummy value

  const isProductType = location.pathname.includes("/product");

  onMount(async () => {
    setIsLoading(true);
    if (isProductType) {
      await fetchProductById();
    } else {
      await fetchRequestById();
    }
    setIsLoading(false);
  });

  const fetchProductById = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${params.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  const fetchRequestById = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/${params.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      }
    } catch (error) {
      console.error("Error fetching request:", error);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Harga belum ditentukan oleh Admin";
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  const handleCart = async () => {
    if (!users().currUser) {
      showNotification("Tolong login/signup terlebih dahulu", "error")
      return;
    }

    // Naikkan angka bubble merah secara instan
    setCartCount(cartCount() + 1);
    
    // Tentukan payload apakah ini produk katalog atau request titipan
    const payload = {
      quantity: 1, // Kita menambahkan 1 barang setiap kali klik
      user_id: users().currUser.id,
    };
    
    if (isProductType) {
      payload.product_id = parseInt(params.id);
    } else {
      payload.request_id = parseInt(params.id);
    }

    try {
      const response = await fetch('http://localhost:5000/api/add-cart', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if(response.ok){
        showNotification("Item berhasil dimasukan ke dalam cart", "success")
        setIsAdded(true); // Tandai tombol sudah diklik
      }
      else{
        alert("Gagal menambahkan ke keranjang, coba lagi.");
        // Kembalikan angka bubble merah kalau error
        setCartCount(cartCount() - 1);
      }

    } catch (error) {
      console.error("Terjadi kesalahan:", error);
      setCartCount(cartCount() - 1);
    }
  };
  return (
    <div class="aest-detail-page">
      {/* LOADING STATE */}
      <Show when={isLoading()}>
        <div class="aest-loading-wrapper">
          <div class="aest-spinner"></div>
          <p>Memuat detail produk...</p>
        </div>
      </Show>

      {/* ========================================= */}
      {/* DETAIL PRODUCT VIEW                       */}
      {/* ========================================= */}
      <Show when={!isLoading() && isProductType && product()}>
        <div class="aest-container">
          <div class="aest-breadcrumb">
            <span>Beranda</span> <span class="aest-sep">/</span>
            <span>Katalog</span> <span class="aest-sep">/</span>
            <span class="aest-current">{product().name}</span>
          </div>

          <div class="aest-grid">
            {/* Bagian Kiri: Gambar Product */}
            <div class="aest-left-panel">
              <div class="aest-image-showcase">
                <Show when={product().image_url} fallback={
                  <div class="aest-no-image">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <span>Tidak ada gambar</span>
                  </div>
                }>
                  <img src={product().image_url} alt={product().name} class="aest-main-img" />
                </Show>
              </div>
            </div>

            {/* Bagian Kanan: Info Product */}
            <div class="aest-right-panel">
              <div class="aest-badge aest-badge-blue">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px;flex-shrink:0">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
                Tersedia di Katalog
              </div>

              <h1 class="aest-title">{product().name}</h1>

              <div class="aest-price-section">
                <span class="aest-price-label">Harga</span>
                <div class="aest-price-tag">
                  {formatPrice(product().price)}
                </div>
              </div>

              <div class="aest-wishlist-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span><strong>{wishlistCount()}</strong> orang memasukkan ke wishlist</span>
              </div>

              <div class="aest-divider"></div>

              <div class="aest-info-card">
                <div class="aest-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <h3>Deskripsi Produk</h3>
                </div>
                <div class="aest-card-body">
                  <p>{product().description || "Produk ini tidak memiliki deskripsi khusus."}</p>
                </div>
              </div>

              <div class="aest-trust-strip">
                <div class="aest-trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Terpercaya</span>
                </div>
                <div class="aest-trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Estimasi 7–14 hari</span>
                </div>
                <div class="aest-trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>CS Responsif</span>
                </div>
              </div>

              <div class="aest-actions">
                <button
                  class={`aest-btn aest-btn-primary ${isAdded() ? "aest-btn-added" : ""}`}
                  onClick={handleCart}
                  disabled={isAdded()}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {isAdded() ? "Sudah di Keranjang" : "Beli Produk Ini"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </Show>

      {/* ========================================= */}
      {/* DETAIL REQUEST VIEW                       */}
      {/* ========================================= */}
      <Show when={!isLoading() && !isProductType && request()}>
        <div class="aest-container">
          <div class="aest-breadcrumb">
            <span>Beranda</span> <span class="aest-sep">/</span>
            <span>Request</span> <span class="aest-sep">/</span>
            <span class="aest-current">{request().category}</span>
          </div>

          <div class="aest-grid">
            {/* Bagian Kiri: Gambar Request */}
            <div class="aest-left-panel">
              <div class="aest-image-showcase request-theme">
                <Show when={request().product_image_url} fallback={
                  <div class="aest-no-image">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <span>Tidak ada gambar</span>
                  </div>
                }>
                  <img src={request().product_image_url} alt={request().name} class="aest-main-img" />
                </Show>
              </div>
            </div>

            {/* Bagian Kanan: Info Request */}
            <div class="aest-right-panel">
              <div class="aest-badge aest-badge-pink">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px;flex-shrink:0">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Titipan Custom
              </div>

              <h1 class="aest-title">{request().name}</h1>

              <Show when={request().price !== 0}>
                <div class="aest-price-section">
                  <span class="aest-price-label">Estimasi Harga</span>
                  <div class="aest-price-tag">
                    {formatPrice(request().price)}
                  </div>
                </div>
              </Show>

              <div class="aest-divider"></div>

              {/* Requester Info */}
              <div class="aest-requester-info-right">
                <div class="aest-avatar">
                  {request().user_name ? request().user_name.charAt(0).toUpperCase() : "A"}
                </div>
                <div class="aest-req-text">
                  <span class="aest-req-label">Barang incaran dari</span>
                  <span class="aest-req-name">{request().user_name || "Anonim"}</span>
                </div>
              </div>

              <div class="aest-info-card">
                <div class="aest-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <h3>Detail Titipan</h3>
                </div>
                <div class="aest-card-body">
                  <p>{request().details || "Tidak ada detail spesifik untuk titipan ini."}</p>
                </div>
              </div>

              <div class="aest-actions">
                <Show when={request().item_link}>
                  <a href={request().item_link} target="_blank" rel="noopener noreferrer" class="aest-btn aest-btn-outline">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Cek Link Asli
                  </a>
                </Show>
                <button
                  class={`aest-btn aest-btn-primary aest-btn-glow ${isAdded() ? "aest-btn-added" : ""}`}
                  onClick={handleCart}
                  disabled={isAdded()}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {isAdded() ? "Sudah di Keranjang" : "Ikut Titip (Add to Cart)"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </Show>

      {/* ERROR / NOT FOUND */}
      <Show when={!isLoading() && !product() && !request()}>
        <div class="aest-empty-state">
          <div class="aest-empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="12"/>
              <line x1="11" y1="16" x2="11.01" y2="16"/>
            </svg>
          </div>
          <h2>Data Tidak Ditemukan</h2>
          <p>Sepertinya barang ini sudah tidak ada atau URL-nya salah.</p>
          <a href="/" class="aest-btn aest-btn-primary">Kembali ke Beranda</a>
        </div>
      </Show>
    </div>
  );
};
