import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import "../style/Payment.css";
import { A, useNavigate } from "@solidjs/router";
import { setUsers } from "../../src/store/WebStore";
import { API_URL } from "../../src/config";
import { io } from "socket.io-client";

const socket = io(API_URL);

export const Payment = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [orders, setOrders] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [selectedReceipt, setSelectedReceipt] = createSignal(null);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("all");

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

  const filteredOrders = () => {
    const q = searchQuery().toLowerCase().trim();
    const sf = statusFilter();

    return orders().filter((o) => {
      // 1. Filter Status Pembayaran
      const currentStatus = (o.status || "pending").toLowerCase();
      if (sf === "verified" && currentStatus !== "verified") return false;
      if (sf === "rejected" && currentStatus !== "rejected") return false;
      if (
        sf === "pending" &&
        currentStatus !== "pending" &&
        currentStatus !== "pending_payment"
      )
        return false;

      // 2. Filter Search Query
      if (!q) return true;
      const serialId = `ord-${o.id}`.toLowerCase();
      const rawId = String(o.id);
      const sender = (o.sender_name || o.user_name || "").toLowerCase();
      const bank = (o.bank_name || "").toLowerCase();
      const priceStr = String(o.total_price || "");

      return (
        serialId.includes(q) ||
        rawId.includes(q) ||
        sender.includes(q) ||
        bank.includes(q) ||
        priceStr.includes(q)
      );
    });
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
            <A href="/admin/orders" class="menu-item">
              Orders
            </A>
            <A href="/admin/payment" class="menu-item active">
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
                <h1>Payment Verification</h1>
                <p class="subtitle">
                  Kelola dan verifikasi bukti transfer/pembayaran dari pelanggan.
                </p>
              </div>
            </div>
            <div class="admin-profile">
              <div class="avatar">A</div>
              <span>Admin Stella</span>
            </div>
          </header>

          <section class="admin-section payment-section">
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
                  placeholder="Cari berdasarkan Order ID, Nama Pengirim, atau Bank..."
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
                  <option value="all">Semua Status Pembayaran</option>
                  <option value="pending">⏳ Menunggu Verifikasi (Pending)</option>
                  <option value="verified">✓ Verified</option>
                  <option value="rejected">✗ Rejected</option>
                </select>
              </div>
            </div>

            <div class="card payment-card">
              <div class="table-responsive">
                <table class="admin-table payment-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Info Pengirim</th>
                      <th>Bukti Transfer</th>
                      <th>Status Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Show
                      when={!loading()}
                      fallback={
                        <tr>
                          <td
                            colspan="4"
                            style="text-align:center; padding: 32px; color: var(--text-muted);"
                          >
                            Memuat data pembayaran...
                          </td>
                        </tr>
                      }
                    >
                      <For
                        each={filteredOrders()}
                        fallback={
                          <tr>
                            <td colspan="4" class="empty-search-td">
                              <div class="empty-search-state">
                                <svg
                                  width="32"
                                  height="32"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <span>
                                  {searchQuery() || statusFilter() !== "all"
                                    ? "Tidak ada data pembayaran yang cocok dengan kata kunci atau filter ini."
                                    : "Belum ada data pembayaran dari pelanggan."}
                                </span>
                              </div>
                            </td>
                          </tr>
                        }
                      >
                        {(order) => (
                          <tr>
                            <td data-label="Order ID">
                              <strong>ORD-{order.id}</strong>
                            </td>
                            <td data-label="Info Pengirim">
                              <div class="user-info">
                                <strong>
                                  {order.sender_name || order.user_name || "Anonim"}
                                </strong>
                                <span class="desc">
                                  {order.bank_name || "Bank"} - {order.sender_name || "-"}
                                </span>
                                <span
                                  class="desc"
                                  style="font-weight: 600; color: var(--text-dark);"
                                >
                                  Total: Rp{" "}
                                  {Number(order.total_price || 0).toLocaleString("id-ID")}
                                </span>
                              </div>
                            </td>
                            <td data-label="Bukti Transfer">
                              <Show
                                when={order.payment_receipt_url}
                                fallback={
                                  <div class="item-info">
                                    <span class="desc" style="color:var(--danger)">
                                      Belum ada bukti
                                    </span>
                                  </div>
                                }
                              >
                                <div
                                  class="item-info"
                                  style="display:flex; align-items:center; gap:10px; flex-direction:row;"
                                >
                                  <div
                                    class="request-img-thumb"
                                    style="cursor: pointer; width:44px; height:44px; flex-shrink:0;"
                                    onClick={() => setSelectedReceipt(order.payment_receipt_url)}
                                  >
                                    <img
                                      src={order.payment_receipt_url}
                                      alt="Bukti Transfer"
                                      style="width:100%; height:100%; object-fit:cover;"
                                    />
                                  </div>
                                  <button
                                    class="item-link"
                                    style="background:none; border:none; padding:0; cursor:pointer; font-size:14px;"
                                    onClick={() => setSelectedReceipt(order.payment_receipt_url)}
                                  >
                                    Lihat Gambar
                                  </button>
                                </div>
                              </Show>
                            </td>
                            <td data-label="Status Pembayaran">
                              <div class="approval-actions">
                                <button
                                  class={`btn btn-approve ${
                                    order.status === "verified" ? "active" : ""
                                  }`}
                                  onClick={() => handleUpdateStatus(order.id, "verified")}
                                >
                                  {order.status === "verified" ? "Verified" : "Verify"}
                                </button>
                                <button
                                  class={`btn btn-deny ${
                                    order.status === "rejected" ? "active" : ""
                                  }`}
                                  onClick={() => handleUpdateStatus(order.id, "rejected")}
                                >
                                  {order.status === "rejected" ? "Rejected" : "Reject"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>
            </div>
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
