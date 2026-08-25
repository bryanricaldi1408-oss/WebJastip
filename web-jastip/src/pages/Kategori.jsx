import { useParams, A } from "@solidjs/router";
import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { Product } from "../components/Product";
import { Request } from "../components/Request";
import { fetchProducts, fetchRequests, products, requests } from "../store/WebStore";
import "../style/Kategori.css";

// Mapping URL param → label tampilan & emoji
const CATEGORY_MAP = {
  semua:       { label: "Semua Kategori",  emoji: "🛍️"  },
  kosmetik:    { label: "Kosmetik",        emoji: "💄"  },
  makanan:     { label: "Makanan",         emoji: "🍜"  },
  suplementasi:{ label: "Suplementasi",    emoji: "💊"  },
  fashion:     { label: "Fashion",         emoji: "👗"  },
  others:      { label: "Lainnya",         emoji: "📦"  },
};

export const Kategori = () => {
  const params = useParams();
  const [isLoading, setIsLoading] = createSignal(true);
  const [activeTab, setActiveTab] = createSignal("products");

  const categoryInfo = createMemo(() => {
    return CATEGORY_MAP[params.type] ?? { label: params.type, emoji: "🏷️" };
  });

  onMount(async () => {
    try {
      await Promise.all([fetchProducts(), fetchRequests()]);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setIsLoading(false);
    }
  });

  const filteredProducts = createMemo(() => {
    if (params.type === "semua") return products();
    return products().filter(
      (p) => p.category?.toLowerCase() === params.type.toLowerCase()
    );
  });

  const filteredRequests = createMemo(() => {
    if (params.type === "semua") return requests();
    return requests().filter(
      (r) => r.category?.toLowerCase() === params.type.toLowerCase()
    );
  });

  const totalCount = createMemo(
    () => filteredProducts().length + filteredRequests().length
  );

  return (
    <div class="kategori-page">
      {/* ── HERO BANNER ─────────────────────────────────── */}
      <div class="kategori-hero">
        <div class="kategori-hero-inner">
          <div class="kategori-emoji">{categoryInfo().emoji}</div>
          <div class="kategori-hero-text">
            <p class="kategori-breadcrumb">
              <A href="/" class="breadcrumb-link">Beranda</A>
              <span class="breadcrumb-sep">›</span>
              <span class="breadcrumb-current">{categoryInfo().label}</span>
            </p>
            <h1 class="kategori-title">
              <span class="blue">{categoryInfo().label}</span>
            </h1>
            <p class="kategori-subtitle">
              Temukan produk &amp; request titipan di kategori ini
            </p>
          </div>
          <div class="kategori-stat">
            <span class="stat-number">{totalCount()}</span>
            <span class="stat-label">Item ditemukan</span>
          </div>
        </div>
      </div>

      {/* ── KATEGORI CHIPS ──────────────────────────────── */}
      <div class="kategori-chips-wrapper">
        <div class="kategori-chips">
          <For each={Object.entries(CATEGORY_MAP)}>
            {([key, val]) => (
              <A
                href={`/kategori/${key}`}
                class={`chip ${params.type === key ? "chip-active" : ""}`}
              >
                <span class="chip-emoji">{val.emoji}</span>
                {val.label}
              </A>
            )}
          </For>
        </div>
      </div>

      {/* ── KONTEN UTAMA ────────────────────────────────── */}
      <div class="kategori-content">
        {/* Tab Switcher */}
        <div class="tab-bar">
          <button
            class={`tab-btn ${activeTab() === "products" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Produk Katalog
            <Show when={!isLoading()}>
              <span class="tab-count">{filteredProducts().length}</span>
            </Show>
          </button>
          <button
            class={`tab-btn ${activeTab() === "requests" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Request Jastip
            <Show when={!isLoading()}>
              <span class="tab-count">{filteredRequests().length}</span>
            </Show>
          </button>
        </div>

        {/* Loading State */}
        <Show when={isLoading()}>
          <div class="kategori-loading">
            <div class="loading-spinner" />
            <p>Memuat data...</p>
          </div>
        </Show>

        {/* Tab: Produk */}
        <Show when={!isLoading() && activeTab() === "products"}>
          <Show
            when={filteredProducts().length > 0}
            fallback={
              <div class="kategori-empty">
                <div class="empty-icon">🛒</div>
                <h3>Belum ada produk</h3>
                <p>
                  Tidak ada produk di kategori{" "}
                  <strong>{categoryInfo().label}</strong> saat ini.
                </p>
                <A href="/" class="btn-back-home">Kembali ke Beranda</A>
              </div>
            }
          >
            <div class="product-container">
              <For each={filteredProducts()}>
                {(item) => (
                  <A href={`/product/${item.id}`} style="text-decoration: none;">
                    <Product
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      image_url={item.image_url}
                    />
                  </A>
                )}
              </For>
            </div>
          </Show>
        </Show>

        {/* Tab: Request */}
        <Show when={!isLoading() && activeTab() === "requests"}>
          <Show
            when={filteredRequests().length > 0}
            fallback={
              <div class="kategori-empty">
                <div class="empty-icon">📋</div>
                <h3>Belum ada request</h3>
                <p>
                  Tidak ada request jastip di kategori{" "}
                  <strong>{categoryInfo().label}</strong> saat ini.
                </p>
                <A href="/" class="btn-back-home">Kembali ke Beranda</A>
              </div>
            }
          >
            <div class="request-container">
              <For each={filteredRequests()}>
                {(item) => (
                  <A href={`/request/${item.id}`} style="text-decoration: none;">
                    <Request
                      image={item.product_image_url}
                      category={item.category}
                      name={item.name}
                      desc={item.details}
                      user={item.user_name}
                      link={item.item_link}
                    />
                  </A>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};
