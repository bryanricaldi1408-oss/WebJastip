import { useLocation, useParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import "../style/Detail.css";

export const Detail = () => {
  const params = useParams();
  const location = useLocation();
  const [product, setProduct] = createSignal(null);
  const [request, setRequest] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Simulasi data jumlah wishlist (bisa diganti logic asli nanti)
  const [wishlistCount] = createSignal(Math.floor(Math.random() * 50) + 15);

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

  return (
    <div class="aest-detail-page">
      {/* LOADING STATE */}
      <Show when={isLoading()}>
        <div class="aest-loading-wrapper">
          <div class="aest-spinner"></div>
          <p>Mempersiapkan tampilan menawan...</p>
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
                <Show when={product().image_url} fallback={<div class="aest-no-image">Tidak ada gambar</div>}>
                  <img src={product().image_url} alt={product().name} class="aest-main-img" />
                </Show>
                
                {/* Floating Wishlist Badge */}
                <div class="aest-floating-wishlist">
                  <span class="aest-heart-icon">❤️</span>
                  <span><strong>{wishlistCount()}</strong> orang memasukkan ke wishlist</span>
                </div>
              </div>
            </div>

            {/* Bagian Kanan: Info Product */}
            <div class="aest-right-panel">
              <div class="aest-badge aest-badge-blue">Tersedia di Katalog</div>
              <h1 class="aest-title">{product().name}</h1>
              
              <div class="aest-price-tag">
                {formatPrice(product().price)}
              </div>

              <div class="aest-info-card">
                <div class="aest-card-header">
                  <span class="aest-icon">📝</span>
                  <h3>Deskripsi Produk</h3>
                </div>
                <div class="aest-card-body">
                  <p>{product().description || "Produk ini tidak memiliki deskripsi khusus."}</p>
                </div>
              </div>

              <div class="aest-actions">
                <button class="aest-btn aest-btn-primary">
                  <span class="aest-btn-icon">🛍️</span>
                  Beli Produk Ini
                </button>
              </div>

              {/* Jaminan Estetik Dihapus */}
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
                <Show when={request().product_image_url} fallback={<div class="aest-no-image">Tidak ada gambar</div>}>
                  <img src={request().product_image_url} alt={request().name} class="aest-main-img" />
                </Show>
              </div>
            </div>

            {/* Bagian Kanan: Info Request */}
            <div class="aest-right-panel">
              <div class="aest-badge aest-badge-pink">Titipan Custom</div>
              <h1 class="aest-title">{request().name}</h1>
              <Show when={request().price !== 0}>
                <div class="aest-price-tag">
                  {formatPrice(request().price)} 
                </div>
              </Show>

              {/* Requester Info dipindah ke kanan */}
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
                  <span class="aest-icon">📋</span>
                  <h3>Detail Titipan</h3>
                </div>
                <div class="aest-card-body">
                  <p>{request().details || "Tidak ada detail spesifik untuk titipan ini."}</p>
                </div>
              </div>

              <div class="aest-actions">
                <Show when={request().item_link}>
                  <a href={request().item_link} target="_blank" rel="noopener noreferrer" class="aest-btn aest-btn-outline">
                    <span class="aest-btn-icon">🔗</span>
                    Cek Link Asli
                  </a>
                </Show>
                <button class="aest-btn aest-btn-primary aest-btn-glow">
                  <span class="aest-btn-icon">🛒</span>
                  Ikut Titip (Add to Cart)
                </button>
              </div>

            </div>
          </div>
        </div>
      </Show>

      {/* ERROR / NOT FOUND */}
      <Show when={!isLoading() && !product() && !request()}>
        <div class="aest-empty-state">
          <div class="aest-empty-emoji">👀</div>
          <h2>Data Tidak Ditemukan</h2>
          <p>Sepertinya barang ini sudah tidak ada atau URL-nya salah.</p>
          <a href="/" class="aest-btn aest-btn-primary">Kembali ke Beranda</a>
        </div>
      </Show>
    </div>
  );
};
