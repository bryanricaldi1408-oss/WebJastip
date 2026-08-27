import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import "../style/HomeAdmin.css";
import { A, useNavigate } from "@solidjs/router";
import { RequestTable } from "../components/RequestTable";
import { io } from "socket.io-client";
import { setUsers, showNotification } from "../../src/store/WebStore";
import { uploadImage } from "../../src/utils/uploadImage";

const socket = io("http://localhost:5000");

export const HomeAdmin = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = createSignal([]);
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

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

          const response = await fetch("http://localhost:5000/api/product", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newProductName(),
              description: newProductDesc(),
              price: newProductPrice(),
              image_url: imageUrl,
            }),
          });

          const data = await response.json();
          if (response.ok) {
            showNotification("Barang berhasil disimpan", "success");

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
    const response = await fetch("http://localhost:5000/api/requests");
    const data = await response.json();
    setRequests(data.requests); // Menyimpan array data dari backend

    socket.on("new_request", (newReq) => {
      setRequests((prev) => [newReq, ...prev]);
    });
  });

  onCleanup(() => {
    socket.off("new_request");
  });
  return (
    <>
      <div class="admin-layout">
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

          <section class="admin-section">
            <div class="section-header">
              <h3>Catalog Products</h3>
              <button
                class="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Add New Product
              </button>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Harga (Set Harga)</th>
                      <th>Status (Complete/Incomplete)</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="admin-section">
            <div class="section-header">
              <h3>User Requests</h3>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Info Pemesan</th>
                      <th>Gambar Produk</th>
                      <th>Detail Barang Incaran</th>
                      <th>Persetujuan (Approve/Deny)</th>
                      <th>Status Barang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={requests()}>
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
                    type="number"
                    class="form-input"
                    placeholder="Contoh: 150000"
                    value={newProductPrice()}
                    onInput={(e) => setNewProductPrice(e.target.value)}
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
