import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import "../style/HomeAdmin.css";
import { A, useNavigate } from "@solidjs/router";
import { RequestTable } from "../components/RequestTable";
import { io } from "socket.io-client";
import { setUsers, showNotification } from "../../src/store/WebStore";
import { uploadImage } from "../../src/utils/uploadImage";
import { API_URL } from "../../src/config";

const socket = io(API_URL);

export const HomeAdmin = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = createSignal([]);
  const [productsList, setProductsList] = createSignal([]);
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("all");
  const [catalogSearch, setCatalogSearch] = createSignal("");

  const filteredRequests = () => {
    const query = searchQuery().toLowerCase().trim();
    const filter = statusFilter();

    return requests().filter((item) => {
      // 1. Status Filter
      if (filter === "approved" && item.approval_status !== "approved") return false;
      if (filter === "denied" && item.approval_status !== "denied") return false;
      if (filter === "pending" && item.approval_status !== "pending") return false;
      if (filter === "incomplete" && item.status !== "incomplete") return false;
      if (filter === "complete" && item.status !== "complete") return false;

      // 2. Search Query
      if (!query) return true;
      const nameMatch = item.name?.toLowerCase().includes(query);
      const userMatch = item.user_name?.toLowerCase().includes(query);
      const phoneMatch = item.phone_number?.toLowerCase().includes(query);
      const categoryMatch = item.category?.toLowerCase().includes(query);
      const detailsMatch = item.details?.toLowerCase().includes(query);
      return nameMatch || userMatch || phoneMatch || categoryMatch || detailsMatch;
    });
  };

  const filteredProducts = () => {
    const query = catalogSearch().toLowerCase().trim();
    if (!query) return productsList();
    return productsList().filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  };

  const formatCurrency = (val) => {
    if (!val) return "Rp 0";
    const num = Number(val);
    return `Rp ${new Intl.NumberFormat("id-ID").format(num)}`;
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini dari katalog?")) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showNotification("Produk berhasil dihapus dari katalog", "success");
        setProductsList((prev) => prev.filter((p) => p.id !== id));
      } else {
        const errorMsg = data.message || (res.status === 404 ? "Endpoint DELETE belum tersedia di server backend Railway (Silakan redeploy backend Railway)" : `Gagal menghapus produk (Status HTTP ${res.status})`);
        showNotification(errorMsg, "error");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      showNotification("Terjadi kesalahan sistem saat menghapus produk", "error");
    }
  };

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = createSignal(false);
  const [newProductName, setNewProductName] = createSignal("");
  const [newProductPrice, setNewProductPrice] = createSignal("");
  const [newProductDesc, setNewProductDesc] = createSignal("");
  const [newProductImage, setNewProductImage] = createSignal(null);
  const [imagePreview, setImagePreview] = createSignal(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProductImage(file);
      // Create a URL for preview
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (newProductImage()) {
        let imageUrl = "";
        try {
          imageUrl = await uploadImage(newProductImage(), "products");

          const cleanPrice = newProductPrice().replace(/\./g, "");

          const response = await fetch(`${API_URL}/api/product`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newProductName(),
              description: newProductDesc(),
              price: cleanPrice,
              image_url: imageUrl,
            }),
          });

          const data = await response.json();
          if (response.ok) {
            showNotification("Barang berhasil disimpan", "success");
            if (data.product) {
              setProductsList((prev) => [data.product, ...prev.filter((p) => p.id !== data.product.id)]);
            }

            setNewProductName("");
            setNewProductPrice("");
            setNewProductDesc("");
            setNewProductImage(null);
            setImagePreview(null);
            setIsAddModalOpen(false);
          } else {
            showNotification(data.message || "Gagal menyimpan barang", "error");
          }
        } catch (error) {
          console.error("Error upload:", error);
          showNotification(
            "Gagal memproses data. Periksa koneksi internet Anda.",
            "error",
          );
          return;
        }
      } else {
        showNotification("Harap pilih gambar produk terlebih dahulu", "error");
      }
    } catch (error) {
      console.error("Error saat menyimpan produk:", error);
      showNotification("Terjadi kesalahan sistem.", "error");
    }
  };

  onMount(async () => {
    try {
      const resReq = await fetch(`${API_URL}/api/requests`);
      if (resReq.ok) {
        const dataReq = await resReq.json();
        setRequests(dataReq.requests || []);
      }

      const resProd = await fetch(`${API_URL}/api/products`);
      if (resProd.ok) {
        const dataProd = await resProd.json();
        setProductsList(dataProd.products || []);
      }
    } catch (err) {
      console.error("Error fetching initial admin data:", err);
    }

    socket.on("new_request", (newReq) => {
      setRequests((prev) => [newReq, ...prev]);
    });

    socket.on("new_product", (newProd) => {
      setProductsList((prev) => [newProd, ...prev.filter((p) => p.id !== newProd.id)]);
    });

    socket.on("delete_product", ({ id }) => {
      setProductsList((prev) => prev.filter((p) => p.id !== id));
    });
  });

  onCleanup(() => {
    socket.off("new_request");
    socket.off("new_product");
    socket.off("delete_product");
  });
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
            <A href="/admin" class="menu-item active">
              Dashboard
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
                <h1>Overview Management</h1>
                <p class="subtitle">
                  Kelola produk katalog dan request titipan pelanggan.
                </p>
              </div>
            </div>
            <div class="admin-profile">
              <div class="avatar">A</div>
              <span>Admin Stella</span>
            </div>
          </header>

          <section class="admin-section catalog-section">
            <div class="section-header">
              <h3>Catalog Products</h3>
              <button
                class="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Add New Product
              </button>
            </div>

            <div class="admin-search-wrapper">
              <div class="admin-search-container">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="admin-search-icon"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  class="admin-search-input"
                  placeholder="Cari produk katalog..."
                  value={catalogSearch()}
                  onInput={(e) => setCatalogSearch(e.target.value)}
                />
                <Show when={catalogSearch().length > 0}>
                  <button class="admin-clear-search-btn" onClick={() => setCatalogSearch("")}>
                    ×
                  </button>
                </Show>
              </div>
            </div>

            <div class="card catalog-card">
              <div class="table-responsive">
                <table class="admin-table catalog-table">
                  <thead>
                    <tr>
                      <th>Gambar Produk</th>
                      <th>Nama & Deskripsi Produk</th>
                      <th>Harga Produk</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For
                      each={filteredProducts()}
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
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                              <span>
                                {catalogSearch()
                                  ? `Tidak ada produk yang cocok dengan "${catalogSearch()}"`
                                  : "Belum ada produk di katalog. Klik '+ Add New Product' untuk menambahkan."}
                              </span>
                            </div>
                          </td>
                        </tr>
                      }
                    >
                      {(item) => (
                        <tr class="catalog-row">
                          <td class="catalog-cell catalog-cell--image">
                            <div class="request-img-thumb">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  style="width: 100%; height: 100%; object-fit: cover;"
                                />
                              ) : (
                                <svg
                                  width="28"
                                  height="28"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.8"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  style="color: #94A3B8;"
                                >
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              )}
                            </div>
                          </td>
                          <td class="catalog-cell catalog-cell--info" data-label="Produk">
                            <div class="product-info">
                              <strong style="font-size: 15px; color: var(--text-dark);">{item.name}</strong>
                              <span class="desc">{item.description || "Tidak ada deskripsi"}</span>
                            </div>
                          </td>
                          <td class="catalog-cell catalog-cell--price" data-label="Harga">
                            <span class="product-price-badge">
                              {formatCurrency(item.price)}
                            </span>
                          </td>
                          <td class="catalog-cell catalog-cell--action" data-label="Aksi">
                            <button
                              class="btn btn-danger"
                              style="font-size: 13px; padding: 8px 12px;"
                              onClick={() => handleDeleteProduct(item.id)}
                            >
                              Hapus Produk
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="admin-section requests-section">
            <div class="section-header">
              <h3>User Requests</h3>
            </div>
            <div class="admin-search-wrapper">
              <div class="admin-search-container">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="admin-search-icon"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  class="admin-search-input"
                  placeholder="Cari berdasarkan nama barang, pemesan, WA, atau kategori..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.target.value)}
                />
                <Show when={searchQuery().length > 0}>
                  <button class="admin-clear-search-btn" onClick={() => setSearchQuery("")}>
                    ×
                  </button>
                </Show>
              </div>
              <div class="filter-select-container">
                <select
                  class="filter-select"
                  value={statusFilter()}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status Filter</option>
                  <option value="approved">✓ Persetujuan: Approved</option>
                  <option value="denied">✗ Persetujuan: Denied</option>
                  <option value="pending">⏳ Persetujuan: Pending</option>
                  <option value="incomplete">🔍 Status: Masa Pencarian</option>
                  <option value="complete">✅ Status: Berhasil Didapat</option>
                </select>
              </div>
            </div>
            <div class="card requests-card">
              <div class="table-responsive">
                <table class="admin-table requests-table">
                  <thead>
                    <tr>
                      <th>Gambar Produk</th>
                      <th>Info Pemesan</th>
                      <th>Detail Barang Incaran</th>
                      <th>Persetujuan (Approve/Deny)</th>
                      <th>Status Barang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For
                      each={filteredRequests()}
                      fallback={
                        <tr>
                          <td colspan="5" class="empty-search-td">
                            <div class="empty-search-state">
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                              </svg>
                              <span>
                                {searchQuery() || statusFilter() !== "all"
                                  ? "Tidak ada request yang cocok dengan kata kunci atau filter ini"
                                  : "Belum ada request titipan pelanggan"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      }
                    >
                      {(item) => (
                        <RequestTable
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
            </div>
          </section>
        </main>

        {/* Add Product Modal */}
        <div class={`modal-overlay ${isAddModalOpen() ? "active" : ""}`}>
          <div class="modal-content">
            <div class="modal-header">
              <h3>Tambah Produk Baru</h3>
              <button
                class="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div class="modal-body">
                <div class="form-group">
                  <label>Nama Produk</label>
                  <input
                    type="text"
                    class="form-input"
                    placeholder="Masukkan nama produk"
                    value={newProductName()}
                    onInput={(e) => setNewProductName(e.target.value)}
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Harga Produk (Rp)</label>
                  <input
                    type="text"
                    class="form-input"
                    placeholder="Contoh: 150.000"
                    value={newProductPrice()}
                    onInput={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "");
                      const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                      setNewProductPrice(formatted);
                    }}
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Gambar Produk</label>
                  <div class="image-upload-wrapper">
                    <input
                      type="file"
                      id="product-image"
                      class="file-input-hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <label
                      for="product-image"
                      class={`image-upload-label ${imagePreview() ? "has-image" : ""}`}
                    >
                      <Show
                        when={imagePreview()}
                        fallback={
                          <div class="upload-placeholder">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              ></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span>Klik untuk unggah gambar</span>
                          </div>
                        }
                      >
                        <img
                          src={imagePreview()}
                          alt="Preview"
                          class="image-preview"
                        />
                        <div class="change-image-overlay">Ubah Gambar</div>
                      </Show>
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label>Deskripsi Produk</label>
                  <textarea
                    class="form-input form-textarea"
                    placeholder="Masukkan deskripsi produk..."
                    value={newProductDesc()}
                    onInput={(e) => setNewProductDesc(e.target.value)}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewProductImage(null);
                    setImagePreview(null);
                  }}
                >
                  Batal
                </button>
                <button type="submit" class="btn btn-primary">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
