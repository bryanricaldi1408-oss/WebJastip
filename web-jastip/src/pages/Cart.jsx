import { Show, For } from "solid-js";
import cartIcon from "../assets/Cart.png";
import "../style/Cart.css";

// =====================================================
// DATA DUMMY - Ganti dengan data asli dari API nanti
// =====================================================
const dummyCartItems = [
  {
    id: 1,
    type: "product",       // "product" atau "request"
    name: "Kemeja Flanel Kotak (Biru)",
    category: "Pakaian",
    image_url: null,       // isi dengan URL gambar asli
    price: 350000,
    quantity: 2,
  },
  {
    id: 2,
    type: "request",
    name: "Sepatu Sneaker Canvas Limited Edition",
    category: "Alas Kaki",
    image_url: null,
    price: 850000,
    quantity: 1,
  },
  {
    id: 3,
    type: "product",
    name: "Tas Ransel Kanvas",
    category: "Aksesoris",
    image_url: null,
    price: 600000,
    quantity: 1,
  },
];

const formatPrice = (price) =>
  `Rp ${Number(price).toLocaleString("id-ID")}`;

export const Cart = () => {
  // =====================================================
  // LOGIC AREA - Silakan diisi sendiri
  // =====================================================

  // TODO: Ganti dengan data cart dari API
  const cartItems = () => dummyCartItems;

  // Total harga semua item
  const subtotal = () =>
    cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0);

  const totalItems = () =>
    cartItems().reduce((acc, item) => acc + item.quantity, 0);

  // TODO: Tambahkan handler untuk:
  const handleIncrement = (itemId) => {
    // Tambah quantity item
    console.log("increment", itemId);
  };

  const handleDecrement = (itemId) => {
    // Kurangi quantity item (kalau 1, hapus item)
    console.log("decrement", itemId);
  };

  const handleDelete = (itemId) => {
    // Hapus item dari cart
    console.log("delete", itemId);
  };

  const handleCheckout = () => {
    // Proses checkout
    console.log("checkout");
  };

  return (
    <div class="cart-page">
      {/* ===== HEADER HALAMAN ===== */}
      <div class="cart-header">
        <div class="cart-header-left">
          <div class="cart-header-icon">
            <img src={cartIcon} alt="Cart" class="cart-header-img" />
          </div>
          <div>
            <h1 class="cart-title">Keranjang Belanja</h1>
            <p class="cart-subtitle">
              {totalItems()} item menunggumu
            </p>
          </div>
        </div>
      </div>

      {/* ===== KONTEN UTAMA ===== */}
      <Show
        when={cartItems().length > 0}
        fallback={
          /* ===== EMPTY STATE ===== */
          <div class="cart-empty">
            <div class="cart-empty-emoji">🛒</div>
            <h2 class="cart-empty-title">Keranjang Kamu Masih Kosong!</h2>
            <p class="cart-empty-subtitle">
              Ayo temukan barang impianmu dan titipkan bersama kami.
            </p>
            <a href="/" class="cart-btn-shop">
              Mulai Belanja
            </a>
          </div>
        }
      >
        <div class="cart-layout">
          {/* ===== KIRI: DAFTAR ITEM ===== */}
          <div class="cart-items-section">
            <For each={cartItems()}>
              {(item) => (
                <div class="cart-item-card">
                  {/* Gambar Produk */}
                  <div class="cart-item-img-wrapper">
                    <Show
                      when={item.image_url}
                      fallback={
                        <div class="cart-item-img-placeholder">
                          {item.type === "product" ? "📦" : "🎁"}
                        </div>
                      }
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        class="cart-item-img"
                      />
                    </Show>
                  </div>

                  {/* Info Produk */}
                  <div class="cart-item-info">
                    <div class="cart-item-top">
                      <div>
                        <span
                          class={`cart-badge ${
                            item.type === "request"
                              ? "cart-badge-pink"
                              : "cart-badge-blue"
                          }`}
                        >
                          {item.type === "request"
                            ? "Titipan Custom"
                            : "Katalog"}
                        </span>
                        <h3 class="cart-item-name">{item.name}</h3>
                        <p class="cart-item-category">
                          Kategori: {item.category}
                        </p>
                      </div>

                      {/* Tombol Hapus */}
                      <button
                        class="cart-delete-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus dari keranjang"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round"
                          class="cart-delete-icon"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>

                    <div class="cart-item-bottom">
                      {/* Stepper Quantity */}
                      <div class="cart-stepper">
                        <button
                          class="cart-stepper-btn"
                          onClick={() => handleDecrement(item.id)}
                        >
                          −
                        </button>
                        <span class="cart-stepper-count">{item.quantity}</span>
                        <button
                          class="cart-stepper-btn"
                          onClick={() => handleIncrement(item.id)}
                        >
                          +
                        </button>
                      </div>

                      {/* Harga */}
                      <div class="cart-item-price-block">
                        <span class="cart-item-unit-price">
                          {formatPrice(item.price)} / item
                        </span>
                        <span class="cart-item-total-price">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* ===== KANAN: RINGKASAN PESANAN ===== */}
          <div class="cart-summary-section">
            <div class="cart-summary-card">
              <h2 class="cart-summary-title">Ringkasan Pesanan</h2>

              <div class="cart-summary-rows">
                <div class="cart-summary-row">
                  <span>Subtotal ({totalItems()} item)</span>
                  <span>{formatPrice(subtotal())}</span>
                </div>
                <div class="cart-summary-row">
                  <span>Estimasi Pengiriman</span>
                  <span class="cart-summary-note">Ditentukan admin</span>
                </div>
              </div>

              <div class="cart-summary-divider" />

              <div class="cart-summary-total">
                <span>Total Pembayaran</span>
                <span class="cart-summary-total-price">
                  {formatPrice(subtotal())}
                </span>
              </div>

              <button
                class="cart-checkout-btn"
                onClick={handleCheckout}
              >
                <span>Lanjut ke Pembayaran</span>
                <span class="cart-checkout-arrow">→</span>
              </button>

              <a href="/" class="cart-continue-link">
                ← Lanjut Belanja
              </a>
            </div>

            {/* Info card */}
            <div class="cart-info-card">
              <span class="cart-info-icon">🔒</span>
              <p>Transaksi kamu aman dan terpercaya bersama Jastip Stella.</p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
