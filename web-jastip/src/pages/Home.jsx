import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import "../style/Home.css";
import { Request } from "../components/Request";
import { users } from "../store/WebStore";
import { showNotification, products, setProducts, requests, setRequests, fetchProducts, fetchRequests } from "../store/WebStore";
import { io } from "socket.io-client";
import { uploadImage } from "../utils/uploadImage";
import { Product } from "../components/Product";
import { API_URL } from "../config";

const imageModules = import.meta.glob("../images/*.{png, jpeg,jpg}", {
  eager: true,
  import: "default",
});

const localBanners = Object.values(imageModules);
const socket = io(API_URL);

export const Home = () => {
  // State untuk melacak file gambar yang diunggah
  const [fileName, setFileName] = createSignal("");
  const [name, setName] = createSignal("");
  const [link, setLink] = createSignal("");
  const [detail, setDetail] = createSignal("");
  const [selectedFile, setSelectedFile] = createSignal("");
  const [category, setCategory] = createSignal("");
  const [isCustomCategory, setIsCustomCategory] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [imagePreview, setImagePreview] = createSignal(null);

  onMount(() => {
    fetchRequests();
    fetchProducts();
    socket.on("request_status_changed", (updatedItem) => {
      if (updatedItem.approval_status === "approved") {
        // Cek apakah item sudah ada di array
        setRequests((prev) => {
          const exists = prev.some((item) => item.id === updatedItem.id);
          if (exists) return prev; // Sudah ada, jangan tambah lagi
          return [updatedItem, ...prev]; // Belum ada, tambahkan
        });
      } else {
        // Jika denied/pending, hapus dari tampilan client
        setRequests((prev) =>
          prev.filter((item) => item.id !== updatedItem.id),
        );
      }
    });

    socket.on("new_product", (newProduct) => {
      setProducts((prev) => {
        const exists = prev.some((item) => item.id === newProduct.id);
        if (exists) return prev;
        return [newProduct, ...prev]; // Tambahkan ke depan list produk
      });
    });
  });

  onCleanup(() => {
    socket.off("request_status_changed");
    socket.off("new_product");
  });
  const handleRequest = async (e) => {
    e.preventDefault();

    if (isSubmitting()) return;

    const currentName = name();
    const currentLink = link();
    const currentDetail = detail();
    const currentCategory = category();
    const currentSelectedFile = selectedFile();

    if (
      !currentLink &&
      !currentDetail &&
      !currentCategory &&
      !currentSelectedFile &&
      !currentName
    ) {
      showNotification("Mohon isi minimal satu informasi barang!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = "";

      if (currentSelectedFile) {
        try {
          imageUrl = await uploadImage(currentSelectedFile, "requests");
        } catch (imgErr) {
          console.error("Error upload:", imgErr);
          showNotification(
            "Gagal mengunggah gambar. Periksa koneksi internet Anda.",
            "error",
          );
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch(`${API_URL}/api/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentName,
          link: currentLink,
          detail: currentDetail,
          category: currentCategory,
          imageUrl: imageUrl,
          user_id: users().currUser?.id || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification(
          data.message || "Request barang berhasil dikirim!",
          "success",
        );
        setName("");
        setLink("");
        setDetail("");
        setCategory("");
        setIsCustomCategory(false);
        setFileName("");
        setSelectedFile(null);
        setImagePreview(null);
        fetchRequests();
      } else {
        showNotification(
          "Gagal mengirim request: " + (data.message || "Terjadi kesalahan"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error handleRequest:", error);
      showNotification("Error: Tidak bisa menghubungi server.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFileName("");
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  // State untuk banners dari database
  const [dbBanners, setDbBanners] = createSignal([]);

  const activeBanners = () => {
    if (dbBanners().length > 0) {
      return dbBanners().map((b) => b.image_url);
    }
    return localBanners;
  };

  // State untuk melacak slide aktif (dimulai dari index 0)
  const [currentIndex, setCurrentIndex] = createSignal(0);

  // Fungsi navigasi slide berikutnya
  const nextSlide = () => {
    const list = activeBanners();
    if (list.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };
  // Fungsi navigasi slide sebelumnya
  const prevSlide = () => {
    const list = activeBanners();
    if (list.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };
  // Auto-play berpindah otomatis setiap 4 detik & fetch dynamic banners
  onMount(() => {
    fetchRequests();
    fetch(`${API_URL}/api/banners`)
      .then((res) => res.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          setDbBanners(data.banners);
        }
      })
      .catch((err) => console.error("Error fetching banners:", err));

    const timer = setInterval(() => {
      const list = activeBanners();
      if (list.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % list.length);
      }
    }, 4000);

    onCleanup(() => clearInterval(timer));
  });

  return (
    <>
      <div class="hero-container">
        {/* Banner Carousel Card */}
        <div class="banner-card">
          <div class="carousel-wrapper">
            {/* Tampilkan gambar yang sedang aktif jika gambar tersedia */}
            {activeBanners().length > 0 ? (
              <img
                class="carousel-img"
                src={activeBanners()[currentIndex() % activeBanners().length]}
                alt={`Banner ${currentIndex() + 1}`}
              />
            ) : (
              <div class="no-image-card">
                <div class="no-image-icon">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--my-blue)"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h2 class="no-image-title">
                  <span class="blue">Promo & Info</span> Banner
                </h2>
                <p class="no-image-subtitle">
                  Belum ada gambar promo di database atau folder local
                </p>
                <div class="no-image-badge">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Tempat Banner Carousel Promo</span>
                </div>
              </div>
            )}
            {/* Tombol Navigasi Panah Kiri & Kanan */}
            <button class="nav-btn prev-btn" onClick={prevSlide} aria-label="Previous slide">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button class="nav-btn next-btn" onClick={nextSlide} aria-label="Next slide">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            {/* Indikator Halaman (misal: 1 / 3) */}
            <div class="page-indicator">
              {currentIndex() + 1} / {activeBanners().length}
            </div>
          </div>
        </div>
        {/* Request Form Card */}
        <div class="request-card">
          <h2 class="t-req">
            <span class="blue">Request</span> Aja.
          </h2>
          <p class="sub-req">Kalau gak nemu yang kamu mau! :D</p>
          {!users().currUser ? (
            <div class="login-prompt-card">
              <div class="login-prompt-icon">🔒</div>
              <h3>Ingin Titip Barang?</h3>
              <p>
                Silakan <strong>Log In</strong> atau <strong>Sign Up</strong>{" "}
                terlebih dahulu untuk mengajukan request barang impianmu.
              </p>
              <div class="login-prompt-actions">
                <A href="/login" class="btn-prompt-login">
                  Log In
                </A>
                <A href="/signup" class="btn-prompt-signup">
                  Sign Up
                </A>
              </div>
            </div>
          ) : (
            <form class="request-form" onSubmit={handleRequest}>
              <div class="form-group">
                <label>Nama Produk</label>
                <input
                  type="text"
                  placeholder="Nama Barang"
                  class="req-input"
                  value={name()}
                  onInput={(e) => setName(e.target.value)}
                />
              </div>

              <div class="form-group">
                <label>Link Barang Incaran</label>
                <input
                  type="text"
                  placeholder="Link produk di Webstore"
                  class="req-input"
                  value={link()}
                  onInput={(e) => setLink(e.target.value)}
                />
              </div>

              <div class="form-group">
                <label>Detail/Keterangan Barang</label>
                <input
                  type="text"
                  placeholder="Model/Tipe/Warna/Ukuran"
                  class="req-input"
                  value={detail()}
                  onInput={(e) => setDetail(e.target.value)}
                />
              </div>

              <div class="form-group">
                <label>Kategori</label>
                <div class="category-buttons">
                  <For each={["Kosmetik", "Makanan", "Suplementasi", "Fashion"]}>
                    {(catName) => (
                      <button
                        type="button"
                        class={`category-btn ${category() === catName && !isCustomCategory() ? "active" : ""}`}
                        onClick={() => {
                          setCategory(catName);
                          setIsCustomCategory(false);
                        }}
                      >
                        {catName}
                      </button>
                    )}
                  </For>
                  <button
                    type="button"
                    class={`category-btn ${isCustomCategory() ? "active" : ""}`}
                    onClick={() => {
                      setIsCustomCategory(true);
                      if (!category() || ["Kosmetik", "Makanan", "Suplementasi", "Fashion"].includes(category())) {
                        setCategory("Silahkan Ketik category yang baru");
                      }
                    }}
                  >
                    Lainnya
                  </button>
                </div>

                <Show when={isCustomCategory()}>
                  <div class="custom-category-input-wrapper">
                    <input
                      type="text"
                      placeholder={category()}
                      class="req-input"
                      onInput={(e) => setCategory(e.target.value)}
                    />
                  </div>
                </Show>
              </div>

              <div class="form-group">
                <label>Foto Produk</label>
                <label
                  class={`file-upload-card ${imagePreview() ? "has-preview" : ""}`}
                >
                  <Show
                    when={imagePreview()}
                    fallback={
                      <div class="upload-dropzone-content">
                        <svg
                          class="upload-svg-icon"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span class="upload-text">Upload Foto Produk</span>
                        <span class="upload-subtext">Klik untuk pilih gambar</span>
                      </div>
                    }
                  >
                    <div class="req-preview-card">
                      <div class="req-preview-img-wrapper">
                        <img
                          src={imagePreview()}
                          alt="Preview"
                          class="req-preview-img"
                        />
                      </div>
                      <div class="req-preview-details">
                        <span class="req-preview-status">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Gambar Terpilih
                        </span>
                        <span class="req-preview-filename">{fileName()}</span>
                        <span class="req-change-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                          </svg>
                          Ganti Foto
                        </span>
                      </div>
                    </div>
                  </Show>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden-file-input"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <button
                type="submit"
                class="btn-send-req"
                disabled={isSubmitting()}
              >
                {isSubmitting() ? "MENGIRIM..." : "KIRIM REQUEST"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Featured Products Section */}
      <div class="products-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="blue">Featured</span> Products
          </h2>
          <A href="/products" class="see-all">
            See All
          </A>
        </div>

        <Show when={products().length === 0}>
          <div class="no-requests-msg">
            <p>Belum ada produk saat ini.</p>
          </div>
        </Show>

        <Show when={products().length !== 0}>
          <div class="product-container">
            <For each={products()}>
              {(item) => (
                <A href={`/product/${item.id}`} style="text-decoration: none;">
                  <Product 
                    name = {item.name}
                    description = {item.description}
                    price = {item.price}
                    image_url = {item.image_url}
                    category = {item.category}
                  />
                </A>
              )}
            </For>
          </div>
        </Show>
        <div class="section-header">
          <h2 class="section-title">
            <span class="blue">Recent</span> Requests
          </h2>
        </div>
        <Show when={requests().length === 0}>
          <div class="no-requests-msg">
            <p>Belum ada request titipan saat ini.</p>
          </div>
        </Show>
        <Show when={requests().length > 0}>
          <div class="request-container">
            <For each={requests()}>
              {(item) => (
                <A href={`/request/${item.id}`} style="text-decoration: none;">
                  <Request
                    image={item.product_image_url}
                    category={item.category}
                    name={item.name}
                    desc={item.details}
                    user={item.user_name}
                    link={item.item_link}
                    price={item.price}
                  />
                </A>
              )}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
};
