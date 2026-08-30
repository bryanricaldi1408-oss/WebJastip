import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import "../style/Payment.css";
import { A, useNavigate } from "@solidjs/router";
import { setUsers } from "../../src/store/WebStore";
import { API_URL } from "../../src/config";
import { io } from "socket.io-client";

const socket = io(API_URL);

export const Orders = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [orders, setOrders] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("all");
  const [selectedReceipt, setSelectedReceipt] = createSignal(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetchOrders();

    socket.on("new_order", (newOrd) => {
      setOrders((prev) => [newOrd, ...prev.filter((o) => o.id !== newOrd.id)]);
    });

    socket.on("order_status_changed", (updatedOrd) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrd.id ? { ...o, status: updatedOrd.status } : o))
      );
    });

    onCleanup(() => {
      socket.off("new_order");
      socket.off("order_status_changed");
    });
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      fetchOrders();
    }
  };

  const parseOrderItems = (itemsRaw) => {
    if (!itemsRaw) return [];
    try {
      return typeof itemsRaw === "string" ? JSON.parse(itemsRaw) : itemsRaw;
    } catch (e) {
      console.error("Error parsing items JSON:", e);
      return [];
    }
  };

  const filteredOrders = () => {
    const q = searchQuery().toLowerCase().trim();
    const sf = statusFilter();

    return orders().filter((o) => {
      // 1. Status Filter
      const currentStatus = (o.status || "pending").toLowerCase();
      if (sf === "verified" && currentStatus !== "verified") return false;
      if (sf === "rejected" && currentStatus !== "rejected") return false;
      if (
        sf === "pending" &&
        currentStatus !== "pending" &&
        currentStatus !== "pending_payment"
      )
        return false;

      // 2. Search Query
      if (!q) return true;
      const serialId = `ord-${o.id}`.toLowerCase();
      const rawId = String(o.id);
      const userName = (o.user_name || o.sender_name || "").toLowerCase();
      const phone = (o.phone_number || "").toLowerCase();
      const email = (o.email || "").toLowerCase();
      const address = (o.addresses || "").toLowerCase();
      const priceStr = String(o.total_price || "");

      // Search inside items
      const itemsList = parseOrderItems(o.items);
      const itemsMatch = itemsList.some(
        (it) =>
          (it.name || "").toLowerCase().includes(q) ||
          (it.category || "").toLowerCase().includes(q)
      );

      return (
        serialId.includes(q) ||
        rawId.includes(q) ||
        userName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        address.includes(q) ||
        priceStr.includes(q) ||
        itemsMatch
      );
    });
  };

  const cleanPhoneForWa = (phone) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    return clean;
  };

  return (
    <>
      <div class="admin-layout">
        <div
          class={`sidebar-overlay ${sidebarOpen() ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        ></div>
        <aside class={`sidebar ${sidebarOpen() ? "open" : ""}`}>
          <div class="sidebar-header">
            <h2>
              <span class="blue-t">Jastip</span> Stella
            </h2>
            <span class="badge">Admin Panel</span>
          </div>
          <nav class="sidebar-menu">
            <A href="/admin" class="menu-item">
              Dashboard
            </A>
            <A href="/admin/orders" class="menu-item active">
              Orders
            </A>
            <A href="/admin/payment" class="menu-item">
              Payment
            </A>
            <A href="/admin/settings" class="menu-item">
              Settings
            </A>
          </nav>
          <div class="sidebar-footer">
            <button
              class="btn-logout"
              onClick={() => {
                setUsers("currUser", null);
                navigate("/login");
              }}
            >
              Logout
            </button>
            <button class="btn-main-website" onClick={() => navigate("/")}>
              Main Website
            </button>
          </div>
        </aside>

        <main class="main-content">
          <header class="topbar">
            <div class="topbar-left">
              <button
                class="hamburger-btn"
                onClick={() => setSidebarOpen(!sidebarOpen())}
              >
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
              </button>
              <div>
                <h1>Daftar Pesanan (Orders)</h1>
                <p class="subtitle">
                  Pantau detail pesanan barang, pembeli, nomor telepon, dan alamat pengiriman.
                </p>
              </div>
            </div>
            <div class="admin-profile">
              <div class="avatar">A</div>
              <span>Admin Stella</span>
            </div>
          </header>

          <section class="admin-section">
            {/* Search Bar & Status Filter */}
            <div class="admin-search-wrapper">
              <div class="admin-search-container">
                <svg
                  class="admin-search-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  class="admin-search-input"
                  placeholder="Cari Order ID, Nama Pelanggan, Nomor Telepon, Alamat, atau Barang..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.target.value)}
                />
                <Show when={searchQuery()}>
                  <button
                    class="admin-clear-search-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    &times;
                  </button>
                </Show>
              </div>
              <div class="filter-select-container">
                <select
                  class="filter-select"
                  value={statusFilter()}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status Pesanan</option>
                  <option value="pending">⏳ Menunggu Verifikasi</option>
                  <option value="verified">✓ Verified (Disetujui)</option>
                  <option value="rejected">✗ Rejected (Ditolak)</option>
                </select>
              </div>
            </div>

            {/* List of Orders in Card Format */}
            <Show
              when={!loading()}
              fallback={
                <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
                  Memuat data pesanan...
                </div>
              }
            >
              <Show
                when={filteredOrders().length > 0}
                fallback={
                  <div class="card" style="padding: 48px; text-align: center; color: var(--text-muted);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--my-blue);">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <p style="font-size: 15px; font-weight: 600;">
                      {searchQuery() || statusFilter() !== "all"
                        ? "Tidak ada pesanan yang sesuai dengan pencarian atau filter Anda."
                        : "Belum ada pesanan masuk dari pembeli."}
                    </p>
                  </div>
                }
              >
                <div style="display: flex; flex-direction: column; gap: 20px;">
                  <For each={filteredOrders()}>
                    {(order) => {
                      const itemsList = parseOrderItems(order.items);
                      const statusClass = () => {
                        switch (order.status) {
                          case "verified": return "status-complete";
                          case "rejected": return "btn-danger";
                          default: return "status-incomplete";
                        }
                      };
                      const statusLabel = () => {
                        switch (order.status) {
                          case "verified": return "Verified (Terverifikasi)";
                          case "rejected": return "Rejected (Ditolak)";
                          default: return "Menunggu Verifikasi";
                        }
                      };

                      return (
                        <div class="card" style="padding: 24px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                          {/* Top Card Header */}
                          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
                            <div>
                              <strong style="font-size: 17px; color: var(--text-dark);">
                                ID Pesanan: #ORD-{order.id}
                              </strong>
                              <span style="font-size: 13px; color: var(--text-muted); margin-left: 12px;">
                                Tanggal: {order.created_at ? new Date(order.created_at).toLocaleString("id-ID") : "-"}
                              </span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                              <span class={`select-status ${statusClass()}`} style="font-size: 12px; padding: 6px 12px; border-radius: 20px;">
                                {statusLabel()}
                              </span>
                              <div class="approval-actions">
                                <button
                                  class={`btn btn-approve ${order.status === "verified" ? "active" : ""}`}
                                  style="font-size: 12px; padding: 6px 14px;"
                                  onClick={() => handleUpdateStatus(order.id, "verified")}
                                >
                                  Verify
                                </button>
                                <button
                                  class={`btn btn-deny ${order.status === "rejected" ? "active" : ""}`}
                                  style="font-size: 12px; padding: 6px 14px;"
                                  onClick={() => handleUpdateStatus(order.id, "rejected")}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 2-Column Info: Customer & Items */}
                          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                            {/* Column 1: Customer Info (Alamat & No HP) */}
                            <div style="background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0;">
                              <h4 style="margin: 0 0 12px 0; font-size: 15px; color: var(--my-blue); display: flex; align-items: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Informasi Pembeli
                              </h4>

                              <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
                                <div>
                                  <span style="color: var(--text-muted); font-size: 12px; font-weight: 600; display: block;">Nama Pelanggan</span>
                                  <strong style="color: #1e293b; font-size: 15px;">
                                    {order.user_name || order.sender_name || "Anonim"}
                                  </strong>
                                </div>

                                <div>
                                  <span style="color: var(--text-muted); font-size: 12px; font-weight: 600; display: block;">Nomor Telepon / WA</span>
                                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                                    <span style="font-weight: 600; color: #334155;">
                                      {order.phone_number || "-"}
                                    </span>
                                    <Show when={order.phone_number}>
                                      <a
                                        href={`https://wa.me/${cleanPhoneForWa(order.phone_number)}?text=${encodeURIComponent(`Halo ${order.user_name || "Kak"}, mengenai pesanan Anda #ORD-${order.id} di Jastip Stella.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="aesthetic-wa-btn"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <span>WhatsApp</span>
                                      </a>
                                    </Show>
                                  </div>
                                </div>

                                <div>
                                  <span style="color: var(--text-muted); font-size: 12px; font-weight: 600; display: block;">Email</span>
                                  <span style="color: #334155;">{order.email || "-"}</span>
                                </div>

                                <div>
                                  <span style="color: var(--text-muted); font-size: 12px; font-weight: 600; display: block;">Alamat Pengiriman</span>
                                  <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 4px; color: #1e293b; font-weight: 500; line-height: 1.4;">
                                    📍 {order.addresses || "Alamat pengiriman belum diisi oleh pembeli."}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Items Bought */}
                            <div style="display: flex; flex-direction: column;">
                              <h4 style="margin: 0 0 12px 0; font-size: 15px; color: var(--my-blue); display: flex; align-items: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <circle cx="9" cy="21" r="1"></circle>
                                  <circle cx="20" cy="21" r="1"></circle>
                                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                Barang Yang Dibeli
                              </h4>

                              <Show
                                when={itemsList.length > 0}
                                fallback={
                                  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; color: var(--text-muted); font-size: 14px;">
                                    Detail barang tidak terekam secara spesifik. Total Pesanan: <strong>Rp {Number(order.total_price || 0).toLocaleString("id-ID")}</strong>
                                  </div>
                                }
                              >
                                <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                                  <For each={itemsList}>
                                    {(item) => (
                                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; gap: 12px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                          <div style="width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: #f1f5f9; border: 1px solid #e2e8f0; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                            <Show
                                              when={item.image_url}
                                              fallback={
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                  <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                              }
                                            >
                                              <img src={item.image_url} alt={item.name} style="width: 100%; height: 100%; object-fit: cover;" />
                                            </Show>
                                          </div>
                                          <div>
                                            <strong style="font-size: 14px; color: #1e293b; display: block;">{item.name}</strong>
                                            <span style="font-size: 12px; color: var(--text-muted);">
                                              Qty: <strong>{item.quantity}</strong> × Rp {Number(item.price || 0).toLocaleString("id-ID")}
                                            </span>
                                          </div>
                                        </div>
                                        <div style="text-align: right; flex-shrink: 0;">
                                          <strong style="font-size: 14px; color: var(--text-dark);">
                                            Rp {Number((item.price || 0) * (item.quantity || 1)).toLocaleString("id-ID")}
                                          </strong>
                                        </div>
                                      </div>
                                    )}
                                  </For>

                                  <div style="margin-top: auto; padding-top: 12px; border-top: 1.5px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 14px; color: var(--text-muted); font-weight: 600;">Total Bayar:</span>
                                    <strong style="font-size: 18px; color: var(--my-blue);">
                                      Rp {Number(order.total_price || 0).toLocaleString("id-ID")}
                                    </strong>
                                  </div>
                                </div>
                              </Show>

                              {/* Bukti Transfer Modal Trigger if present */}
                              <Show when={order.payment_receipt_url}>
                                <div style="margin-top: 14px;">
                                  <button
                                    style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-dark); display: inline-flex; align-items: center; gap: 6px;"
                                    onClick={() => setSelectedReceipt(order.payment_receipt_url)}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Lihat Bukti Transfer
                                  </button>
                                </div>
                              </Show>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </Show>
          </section>
        </main>
      </div>

      {/* Modal Lightbox Bukti Transfer */}
      <Show when={selectedReceipt()}>
        <div class="modal-overlay active" onClick={() => setSelectedReceipt(null)}>
          <div
            class="modal-content receipt-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              class="modal-header"
              style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;"
            >
              <h3 style="margin:0; font-size:18px;">Bukti Transfer Pembayaran</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-muted);"
              >
                &times;
              </button>
            </div>
            <div style="text-align:center;">
              <img
                src={selectedReceipt()}
                alt="Bukti Transfer Detail"
                style="max-width:100%; max-height:70vh; border-radius:8px; object-fit:contain; border:1px solid var(--border-color);"
              />
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};
