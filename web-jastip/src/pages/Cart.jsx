import { Show, For, createSignal, onMount, onCleanup } from "solid-js";
import { io } from "socket.io-client";
import { useNavigate } from "@solidjs/router";
import { users, setCartCount, showNotification } from "../store/WebStore";
import cartIcon from "../assets/Cart.png";
import "../style/Cart.css";
import { API_URL } from "../config";

const socket = io(API_URL);

// =====================================================
// DATA DUMMY - Ganti dengan data asli dari API nanti
// =====================================================


const formatPrice = (price) =>
  `Rp ${Number(price).toLocaleString("id-ID")}`;

export const Cart = () => {
  // =====================================================
  // LOGIC AREA - Silakan diisi sendiri
  // =====================================================
  const [cartItems, setCartItems] = createSignal([]);

  const fetchCartItems = async () => {
    try {
      const user = users();
      if (!user || !user.currUser || !user.currUser.id) return;

      const response = await fetch(`${API_URL}/api/cart?user_id=${user.currUser.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart || []);
        // Sinkronisasi badge keranjang belanja di header
        const totalQty = (data.cart || []).reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  onMount(() => {
    fetchCartItems();

    // Listen to real-time request status changes
    socket.on("request_status_changed", (updatedReq) => {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.type === "request" && item.request_id === updatedReq.id) {
            return { ...item, request_status: updatedReq.status };
          }
          return item;
        })
      );
    });

    // Listen to real-time request price updates
    socket.on("request_price_set", (updatedReq) => {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.type === "request" && item.request_id === updatedReq.id) {
            return { ...item, price: updatedReq.price };
          }
          return item;
        })
      );
    });
  });

  onCleanup(() => {
    socket.off("request_status_changed");
    socket.off("request_price_set");
    socket.disconnect();
  });

  // Total harga semua item
  const subtotal = () =>
    cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0);

  const totalItems = () =>
    cartItems().reduce((acc, item) => acc + item.quantity, 0);

  const handleIncrement = async (itemId) => {
    const item = cartItems().find((i) => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + 1;

    try {
      const response = await fetch(`${API_URL}/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (response.ok) {
        setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
        setCartCount(prev => prev + 1);
      } else {
        console.error("Gagal menambah quantity");
      }
    } catch (error) {
      console.error("Error incrementing:", error);
    }
  };

  const handleDecrement = async (itemId) => {
    const item = cartItems().find((i) => i.id === itemId);
    if (!item) return;

    if (item.quantity <= 1) {
      await handleDelete(itemId);
      return;
    }

    const newQty = item.quantity - 1;

    try {
      const response = await fetch(`${API_URL}/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (response.ok) {
        setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
        setCartCount(prev => prev - 1);
      } else {
        console.error("Gagal mengurangi quantity");
      }
    } catch (error) {
      console.error("Error decrementing:", error);
    }
  };

  const handleDelete = async (itemId) => {
    const item = cartItems().find((i) => i.id === itemId);
    if (!item) return;

    try {
      const response = await fetch(`${API_URL}/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
        setCartCount(prev => prev - item.quantity);
      } else {
        console.error("Gagal menghapus item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const navigate = useNavigate();

  const hasIncompleteItems = () =>
    cartItems().some((item) => item.type === "request" && item.request_status !== "complete");

  const handleCheckout = () => {
    if (hasIncompleteItems()) {
      showNotification(
        "Terdapat barang titipan custom yang belum didapatkan oleh Admin. Harap tunggu hingga didapatkan sebelum checkout.",
        "error"
      );
      return;
    }
    navigate("/payment", { state: { amount: subtotal() } });
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
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
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
                          <Show when={item.type === "request" && item.request_status !== "complete"}>
                            <span class="cart-badge-warning-item">
                              Masa Pencarian
                            </span>
                          </Show>
                        </div>
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

              <Show when={hasIncompleteItems()}>
                <div 
                  class="cart-incomplete-warning" 
                  style="margin-bottom: 16px; padding: 12px; background: #fff1f2; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; font-size: 13px; font-weight: 500; line-height: 1.4; text-align: left;"
                >
                  ⚠️ Beberapa barang titipan custom di keranjang Anda masih dalam status pencarian. Harap tunggu hingga didapatkan oleh Admin sebelum checkout.
                </div>
              </Show>

              <button
                class="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={hasIncompleteItems()}
                style={hasIncompleteItems() ? { opacity: 0.6, cursor: "not-allowed", background: "#cbd5e1", "box-shadow": "none" } : {}}
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
