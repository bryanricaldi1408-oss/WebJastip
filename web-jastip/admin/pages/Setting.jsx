import { createSignal, onMount, For, Show } from "solid-js";
import "../style/Setting.css";
import { A, useNavigate } from "@solidjs/router";
import { setUsers, showNotification } from "../../src/store/WebStore";
import { uploadImage } from "../../src/utils/uploadImage";
import { API_URL } from "../../src/config";

export const Setting = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal("banners");

  // Multi-image banner upload state
  const [selectedFiles, setSelectedFiles] = createSignal([]);
  const [isUploading, setIsUploading] = createSignal(false);
  const [isDragOver, setIsDragOver] = createSignal(false);
  
  // Existing banners state from DB
  const [bannersList, setBannersList] = createSignal([]);
  const [isLoadingBanners, setIsLoadingBanners] = createSignal(false);

  const fetchBanners = async () => {
    setIsLoadingBanners(true);
    try {
      const response = await fetch(`${API_URL}/api/banners`);
      if (response.ok) {
        const data = await response.json();
        setBannersList(data.banners || []);
      }
    } catch (error) {
      console.error("Gagal mengambil data banner:", error);
    } finally {
      setIsLoadingBanners(false);
    }
  };

  onMount(() => {
    fetchBanners();
  });

  const handleFilesSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newItems = fileArray.map((file) => {
      // Formatter default title dari nama file
      const rawName = file.name.split(".").slice(0, -1).join(".");
      const formattedTitle = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "Banner Promo";

      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        title: formattedTitle,
        previewUrl: URL.createObjectURL(file),
        status: "pending", // 'pending' | 'uploading' | 'success' | 'error'
        errorMsg: "",
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const handleFileChange = (e) => {
    handleFilesSelect(e.target.files);
    e.target.value = ""; // Reset input file
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files); // ✅ Fix: pakai dataTransfer, bukan e.target
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeSelectedFile = (id) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const updateFileTitle = (id, newTitle) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleUploadBanners = async () => {
    const filesToUpload = selectedFiles().filter(
      (item) => item.status === "pending" || item.status === "error"
    );

    if (filesToUpload.length === 0) {
      showNotification("Pilih minimal satu gambar banner untuk diunggah", "error");
      return;
    }

    setIsUploading(true);
    const uploadedResults = [];

    for (const item of filesToUpload) {
      // Tandai item sedang di-upload
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
      );

      try {
        // Upload gambar ke Cloudinary di folder "banners"
        const imageUrl = await uploadImage(item.file, "banners");

        uploadedResults.push({
          title: item.title,
          image_url: imageUrl,
        });

        // Tandai status sukses
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "success" } : f))
        );
      } catch (err) {
        console.error("Gagal mengunggah banner:", err);
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", errorMsg: err.message || "Gagal upload" }
              : f
          )
        );
        // Tampilkan error spesifik dari Cloudinary ke notifikasi
        showNotification(`Gagal upload "${item.file.name}": ${err.message}`, "error");
      }
    }

    // Simpan banner yang berhasil terunggah ke database backend
    if (uploadedResults.length > 0) {
      try {
        const response = await fetch(`${API_URL}/api/banners`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ banners: uploadedResults }),
        });

        if (response.ok) {
          showNotification(
            `Berhasil mengunggah & menyimpan ${uploadedResults.length} banner!`,
            "success"
          );
          // Hapus item yang sukses dari antrean preview secara perlahan
          setTimeout(() => {
            setSelectedFiles((prev) => prev.filter((f) => f.status !== "success"));
          }, 1200);

          fetchBanners();
        } else {
          const errData = await response.json().catch(() => ({}));
          showNotification(errData.message || "Gagal menyimpan data banner ke database server", "error");
        }
      } catch (dbErr) {
        console.error("Error database save:", dbErr);
        showNotification("Gagal terhubung ke server (Pastikan server backend running di PORT 5000)", "error");
      }
    }

    setIsUploading(false);
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini dari database?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/banners/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("Banner berhasil dihapus", "success");
        fetchBanners();
      } else {
        const data = await response.json();
        showNotification(data.message || "Gagal menghapus banner", "error");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      showNotification("Terjadi kesalahan sistem saat menghapus banner", "error");
    }
  };

  return (
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
          <A href="/admin/payment" class="menu-item">
            Payment
          </A>
          <A href="/admin/settings" class="menu-item active">
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
              <h1>Admin Settings</h1>
              <p class="subtitle">
                Kelola konfigurasi website, banner promo, dan pengaturan admin.
              </p>
            </div>
          </div>
          <div class="admin-profile">
            <div class="avatar">A</div>
            <span>Admin Stella</span>
          </div>
        </header>

        {/* Settings Navigation Tabs */}
        <div class="settings-tabs">
          <button
            class={`tab-btn ${activeTab() === "banners" ? "active" : ""}`}
            onClick={() => setActiveTab("banners")}
          >
            <span>Banner Carousel</span>
            <span class="tab-badge">{bannersList().length}</span>
          </button>
          <button
            class={`tab-btn ${activeTab() === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <span>Pengaturan Umum</span>
          </button>
        </div>

        {/* Tab 1: Banner Management */}
        <Show when={activeTab() === "banners"}>
          <div class="settings-container">
            {/* Section: Upload Multiple Banners */}
            <section class="admin-section">
              <div class="section-header">
                <h3>Upload Multi-Gambar Banner (Cloudinary)</h3>
              </div>

              <div class="card">
                {/* Dropzone Container */}
                <div
                  class={`dropzone-container ${isDragOver() ? "is-dragover" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("multi-banner-input").click()}
                >
                  <input
                    type="file"
                    id="multi-banner-input"
                    class="file-input-hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  <div class="dropzone-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div class="dropzone-title">
                    Tarik & Lepas Banyak Gambar Banner di Sini
                  </div>
                  <div class="dropzone-subtitle">
                    Atau klik area ini untuk memilih beberapa file sekaligus (PNG, JPG, JPEG)
                  </div>
                  <span class="browse-btn">+ Pilih Beberapa Gambar</span>
                </div>

                {/* Selected Files Preview Grid */}
                <Show when={selectedFiles().length > 0}>
                  <div class="preview-section">
                    <div class="preview-header">
                      <h4>
                        Gambar Siap Diunggah ({selectedFiles().length} File Terpilih)
                      </h4>
                      <button
                        class="btn btn-secondary"
                        style="font-size: 12px; padding: 4px 10px;"
                        onClick={() => setSelectedFiles([])}
                        disabled={isUploading()}
                      >
                        Bersihkan Semua
                      </button>
                    </div>

                    <div class="preview-grid">
                      <For each={selectedFiles()}>
                        {(item) => (
                          <div class="preview-card">
                            <div class="preview-image-wrapper">
                              <img
                                src={item.previewUrl}
                                alt={item.title}
                                class="preview-img"
                              />
                              <span class={`status-badge ${item.status}`}>
                                {item.status === "pending" && "Siap"}
                                {item.status === "uploading" && "Uploading..."}
                                {item.status === "success" && "Berhasil"}
                                {item.status === "error" && "Gagal"}
                              </span>
                              <Show when={!isUploading()}>
                                <button
                                  class="remove-btn"
                                  title="Hapus gambar ini"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSelectedFile(item.id);
                                  }}
                                >
                                  ×
                                </button>
                              </Show>
                            </div>
                            <div class="preview-details">
                              <label style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Judul Banner:</label>
                              <input
                                type="text"
                                class="preview-title-input"
                                value={item.title}
                                onInput={(e) =>
                                  updateFileTitle(item.id, e.target.value)
                                }
                                placeholder="Masukkan Judul Banner"
                                disabled={isUploading()}
                              />
                              <span class="preview-filename">{item.file.name}</span>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>

                    <div class="upload-actions">
                      <button
                        class="btn btn-primary"
                        style="padding: 12px 24px; font-size: 15px;"
                        onClick={handleUploadBanners}
                        disabled={isUploading()}
                      >
                        <Show
                          when={isUploading()}
                          fallback={`Upload Multi-Gambar (${selectedFiles().length}) ke Cloudinary`}
                        >
                          Mengunggah Multi-Gambar...
                        </Show>
                      </button>
                    </div>
                  </div>
                </Show>
              </div>
            </section>

            {/* Section: Existing Banners List */}
            <section class="admin-section">
              <div class="section-header">
                <h3>Daftar Banner Aktif Saat Ini</h3>
                <button class="btn btn-secondary" onClick={fetchBanners}>
                  Refresh Banner
                </button>
              </div>

              <Show
                when={!isLoadingBanners()}
                fallback={<div class="empty-state">Memuat daftar banner...</div>}
              >
                <Show
                  when={bannersList().length > 0}
                  fallback={
                    <div class="empty-state">
                      Belum ada gambar banner yang diunggah. Gunakan form di atas untuk mengunggah banner baru.
                    </div>
                  }
                >
                  <div class="banners-gallery">
                    <For each={bannersList()}>
                      {(banner) => (
                        <div class="banner-item-card">
                          <div class="banner-item-img-wrapper">
                            <img
                              src={banner.image_url}
                              alt={banner.title || "Banner"}
                              class="banner-item-img"
                            />
                          </div>
                          <div class="banner-item-body">
                            <div class="banner-item-info">
                              <span class="banner-item-title">
                                {banner.title || "Banner tanpa judul"}
                              </span>
                              <span class="banner-item-date">
                                ID: #{banner.id}
                              </span>
                            </div>
                            <button
                              class="btn-delete-banner"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </Show>
            </section>
          </div>
        </Show>

        {/* Tab 2: General / Future Settings Placeholder */}
        <Show when={activeTab() === "general"}>
          <div class="card" style="padding: 36px; text-align: center;">
            <h3>Pengaturan Fitur Tambahan</h3>
            <p style="color: var(--text-muted); margin-top: 8px;">
              Fitur pengaturan umum toko dan opsi konfigurasi lanjutan akan tersedia di tab ini pada tahap pengembangannya selanjutnya.
            </p>
          </div>
        </Show>
      </main>
    </div>
  );
};
