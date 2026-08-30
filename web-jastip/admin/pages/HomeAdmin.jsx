import { createSignal, createMemo, For, onCleanup, onMount, Show } from "solid-js";
import "../style/HomeAdmin.css";
import { A, useNavigate } from "@solidjs/router";
import { RequestTable } from "../components/RequestTable";
import { CatalogRow } from "../components/CatalogRow";
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

  // Price Baseline
  const CURRENCIES = [
    { code: "JPY", label: "Yen Jepang",          symbol: "¥",   defaultKurs: 105   },
    { code: "KRW", label: "Won Korea Selatan",    symbol: "₩",   defaultKurs: 11    },
    { code: "CNY", label: "Yuan China",           symbol: "¥",   defaultKurs: 2250  },
    { code: "HKD", label: "Dolar Hong Kong",      symbol: "HK$", defaultKurs: 2100  },
    { code: "TWD", label: "Dolar Taiwan",         symbol: "NT$", defaultKurs: 505   },
    { code: "SGD", label: "Dolar Singapura",      symbol: "S$",  defaultKurs: 12200 },
    { code: "MYR", label: "Ringgit Malaysia",     symbol: "RM",  defaultKurs: 3500  },
    { code: "THB", label: "Baht Thailand",        symbol: "฿",   defaultKurs: 455   },
    { code: "USD", label: "Dolar AS",             symbol: "$",   defaultKurs: 16300 },
    { code: "EUR", label: "Euro",                 symbol: "€",   defaultKurs: 17500 },
    { code: "GBP", label: "Poundsterling",        symbol: "£",   defaultKurs: 21000 },
    { code: "AUD", label: "Dolar Australia",      symbol: "A$",  defaultKurs: 10600 },
  ];



  const [priceInput, setPriceInput] = createSignal("");
  const [selectedCurrency, setSelectedCurrency] = createSignal("JPY");
  const [kurs, setKurs] = createSignal(105);
  const [marginPct, setMarginPct] = createSignal(40);
  const [isEditingFormula, setIsEditingFormula] = createSignal(false);
  const [tempKurs, setTempKurs] = createSignal("105");
  const [tempMargin, setTempMargin] = createSignal("40");

  const currentCurrency = createMemo(() =>
    CURRENCIES.find((c) => c.code === selectedCurrency()) || CURRENCIES[0]
  );

  const idrBase = createMemo(() => {
    const a = parseFloat(priceInput());
    if (isNaN(a) || priceInput() === "") return null;
    return a * kurs();
  });

  const pbResult = createMemo(() => {
    if (idrBase() === null) return null;
    return idrBase() * (1 + marginPct() / 100);
  });

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatForeign = (val) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(val);

  const handleCurrencyChange = (code) => {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (cur) {
      setSelectedCurrency(code);
      setKurs(cur.defaultKurs);
      setTempKurs(String(cur.defaultKurs));
    }
  };

  const openFormulaEditor = () => {
    setTempKurs(String(kurs()));
    setTempMargin(String(marginPct()));
    setIsEditingFormula(true);
  };

  const saveFormula = () => {
    const k = parseFloat(tempKurs());
    const m = parseFloat(tempMargin());
    if (!isNaN(k) && k > 0) setKurs(k);
    if (!isNaN(m) && m >= 0) setMarginPct(m);
    setIsEditingFormula(false);
  };

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
  const [newProductCategory, setNewProductCategory] = createSignal("Kosmetik");
  const [isCustomCategory, setIsCustomCategory] = createSignal(false);
  const [customCategoryInput, setCustomCategoryInput] = createSignal("");
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
          const finalCategory = isCustomCategory()
            ? (customCategoryInput().trim() || "Lainnya")
            : newProductCategory();

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
              category: finalCategory,
            }),
          });

          const data = await response.json();
          if (response.ok) {
            showNotification("Barang berhasil disimpan", "success");
            if (data.product) {
              setProductsList((prev) => [data.product, ...prev.filter((p) => p.id !== data.product.id)]);
            }

            setNewProductName("");
            setNewProductCategory("Kosmetik");
            setIsCustomCategory(false);
            setCustomCategoryInput("");
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

    socket.on("product_price_set", (updatedItem) => {
      setProductsList((prev) =>
        prev.map((p) => (p.id === updatedItem.id ? { ...p, price: updatedItem.price } : p))
      );
    });
  });

  onCleanup(() => {
    socket.off("new_request");
    socket.off("new_product");
    socket.off("delete_product");
    socket.off("product_price_set");
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
            <A href="/admin/orders" class="menu-item">
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

          <section class="price-baseline-section">
            <div class="pb-card">

              {/* Header */}
              <div class="pb-header">
                <div class="pb-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div class="pb-title-group">
                  <h2 class="pb-title">Price Baseline</h2>
                  <p class="pb-subtitle">Harga asing × kurs IDR, ditambah margin {marginPct()}%</p>
                </div>
                <div class="pb-header-right">
                  <div class="pb-formula-badge">
                    <span class="pb-formula-text">( a × kurs ) × {(1 + marginPct() / 100).toFixed(2)}</span>
                  </div>
                  <button class="pb-edit-btn" onClick={openFormulaEditor} title="Edit kurs &amp; margin">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Formula
                  </button>
                </div>
              </div>

              {/* Formula Editor */}
              {isEditingFormula() && (
                <div class="pb-formula-editor">
                  <div class="pb-formula-editor-title">Edit Formula: ( a × Kurs ) × ( 1 + Margin% )</div>
                  <div class="pb-formula-editor-fields">
                    <div class="pb-formula-field">
                      <label class="pb-label">Kurs IDR per {selectedCurrency()}</label>
                      <input
                        type="number"
                        class="pb-formula-input"
                        value={tempKurs()}
                        onInput={(e) => setTempKurs(e.target.value)}
                        placeholder="contoh: 105"
                        min="0"
                      />
                    </div>
                    <div class="pb-formula-sep">×</div>
                    <div class="pb-formula-field">
                      <label class="pb-label">Margin (%)</label>
                      <div class="pb-formula-input-pct">
                        <input
                          type="number"
                          class="pb-formula-input"
                          value={tempMargin()}
                          onInput={(e) => setTempMargin(e.target.value)}
                          placeholder="40"
                          min="0"
                          max="1000"
                        />
                        <span class="pb-pct-label">%</span>
                      </div>
                    </div>
                    <div class="pb-formula-actions">
                      <button class="pb-save-btn" onClick={saveFormula}>Simpan</button>
                      <button class="pb-cancel-btn" onClick={() => setIsEditingFormula(false)}>Batal</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Currency Selector + Input */}
              <div class="pb-body">
                <div class="pb-input-group">
                  <label class="pb-label" for="pb-price-input">Harga Asing</label>
                  <div class="pb-input-wrapper">
                    <select
                      class="pb-currency-select"
                      value={selectedCurrency()}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                    >
                      {CURRENCIES.map((c) => (
                        <option value={c.code}>{c.symbol} {c.code} — {c.label}</option>
                      ))}
                    </select>
                    <input
                      id="pb-price-input"
                      type="number"
                      class="pb-input"
                      placeholder={`Masukkan harga dalam ${selectedCurrency()}...`}
                      min="0"
                      value={priceInput()}
                      onInput={(e) => setPriceInput(e.target.value)}
                    />
                  </div>
                </div>

                <div class="pb-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>

                <div class="pb-result-group">
                  <label class="pb-label">Harga Jual Estimasi (IDR)</label>
                  <div class={`pb-result ${pbResult() !== null ? "pb-result--active" : ""}`}>
                    {pbResult() !== null
                      ? formatIDR(pbResult())
                      : <span class="pb-result-placeholder">— Masukkan harga asing —</span>
                    }
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              {pbResult() !== null && (
                <div class="pb-breakdown">
                  <div class="pb-breakdown-item">
                    <span class="pb-breakdown-label">Harga Asing ({selectedCurrency()})</span>
                    <span class="pb-breakdown-value">{currentCurrency().symbol} {formatForeign(parseFloat(priceInput()))}</span>
                  </div>
                  <div class="pb-breakdown-item">
                    <span class="pb-breakdown-label">× Kurs IDR (1 {selectedCurrency()} = Rp {formatForeign(kurs())})</span>
                    <span class="pb-breakdown-value">{formatIDR(idrBase())}</span>
                  </div>
                  <div class="pb-breakdown-item pb-breakdown-margin">
                    <span class="pb-breakdown-label">+ Margin {marginPct()}% dari hasil konversi</span>
                    <span class="pb-breakdown-value">+{formatIDR(idrBase() * (marginPct() / 100))}</span>
                  </div>
                  <div class="pb-breakdown-divider"></div>
                  <div class="pb-breakdown-item pb-breakdown-total">
                    <span class="pb-breakdown-label">Total Estimasi</span>
                    <span class="pb-breakdown-value">{formatIDR(pbResult())}</span>
                  </div>
                </div>
              )}

            </div>
          </section>

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
                        <CatalogRow
                          item={item}
                          onDeleteProduct={handleDeleteProduct}
                        />
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
                      <th>Harga</th>
                      <th>Persetujuan (Approve/Deny)</th>
                      <th>Status Barang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For
                      each={filteredRequests()}
                      fallback={
                        <tr>
                          <td colspan="6" class="empty-search-td">
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
                          price={item.price}
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
                  <label>Kategori Produk</label>
                  <select
                    class="form-input"
                    value={isCustomCategory() ? "Lainnya" : newProductCategory()}
                    onChange={(e) => {
                      if (e.target.value === "Lainnya") {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setNewProductCategory(e.target.value);
                      }
                    }}
                  >
                    <option value="Kosmetik">Kosmetik</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Suplementasi">Suplementasi</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Lainnya">Kategori Lainnya...</option>
                  </select>
                  <Show when={isCustomCategory()}>
                    <input
                      type="text"
                      class="form-input"
                      style="margin-top: 8px;"
                      placeholder="Ketik nama kategori baru..."
                      value={customCategoryInput()}
                      onInput={(e) => setCustomCategoryInput(e.target.value)}
                      required
                    />
                  </Show>
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
