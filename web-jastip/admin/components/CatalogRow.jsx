import { createSignal } from "solid-js";
import { showNotification } from "../../src/store/WebStore";
import { API_URL } from "../../src/config";
import { useNavigate } from "@solidjs/router";

export const CatalogRow = (props) => {
  const navigate = useNavigate();

  const formatThousand = (val) => {
    if (!val && val !== 0) return "";
    return String(Math.round(val)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const [price, setPrice] = createSignal(props.item.price ?? 0);
  const [priceInput, setPriceInput] = createSignal(
    props.item.price ? formatThousand(props.item.price) : ""
  );
  const [isSavingPrice, setIsSavingPrice] = createSignal(false);
  const [isEditingPrice, setIsEditingPrice] = createSignal(false);

  async function handleSavePrice() {
    const raw = priceInput().replace(/\./g, "");
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 0) {
      showNotification("Masukkan harga yang valid", "error");
      return;
    }
    setIsSavingPrice(true);
    try {
      const response = await fetch(`${API_URL}/api/product-price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parsed, productId: props.item.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setPrice(parsed);
        setPriceInput(formatThousand(parsed));
        setIsEditingPrice(false);
        showNotification(data.message || "Harga produk berhasil diperbarui", "success");
      } else {
        showNotification(data.message || "Gagal memperbarui harga produk", "error");
      }
    } catch (error) {
      console.error("Error saving product price:", error);
      showNotification("Terjadi kesalahan pada server", "error");
    } finally {
      setIsSavingPrice(false);
    }
  }

  function handleCancelPrice() {
    setPriceInput(price() ? formatThousand(price()) : "");
    setIsEditingPrice(false);
  }

  return (
    <tr class="catalog-row">
      {/* Gambar */}
      <td class="catalog-cell catalog-cell--image">
        <div
          class="request-img-thumb"
          style="cursor: pointer;"
          onClick={() => navigate(`/product/${props.item.id}`)}
          title="Lihat detail produk"
        >
          {props.item.image_url ? (
            <img
              src={props.item.image_url}
              alt={props.item.name}
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

      {/* Info Produk */}
      <td class="catalog-cell catalog-cell--info" data-label="Produk">
        <div class="product-info">
          <strong style="font-size: 15px; color: var(--text-dark);">
            {props.item.name}
          </strong>
          <span class="desc">
            {props.item.description || "Tidak ada deskripsi"}
          </span>
          {props.item.category && (
            <span
              class="badge"
              style="margin-top: 4px; font-size: 10px; padding: 2px 8px; width: fit-content;"
            >
              {props.item.category}
            </span>
          )}
        </div>
      </td>

      {/* Harga Edit Admin */}
      <td class="catalog-cell catalog-cell--price" data-label="Harga">
        {isEditingPrice() ? (
          <div class="price-edit-wrapper">
            <div class="price-input-row">
              <span class="price-input-prefix">Rp</span>
              <input
                type="text"
                class="price-input"
                placeholder="0"
                value={priceInput()}
                onInput={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                  setPriceInput(formatted);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSavePrice();
                  if (e.key === "Escape") handleCancelPrice();
                }}
                autofocus
              />
            </div>
            <div class="price-edit-actions">
              <button
                class="price-save-btn"
                onClick={handleSavePrice}
                disabled={isSavingPrice()}
              >
                {isSavingPrice() ? "..." : "✓"}
              </button>
              <button
                class="price-cancel-btn"
                onClick={handleCancelPrice}
                disabled={isSavingPrice()}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div
            class="price-display"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingPrice(true);
            }}
          >
            <span class="price-value">{formatIDR(price())}</span>
            <button class="price-set-btn" title="Edit harga produk">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        )}
      </td>

      {/* Aksi Hapus */}
      <td class="catalog-cell catalog-cell--action" data-label="Aksi">
        <button
          class="btn btn-danger"
          style="font-size: 13px; padding: 8px 12px;"
          onClick={() => props.onDeleteProduct(props.item.id)}
        >
          Hapus Produk
        </button>
      </td>
    </tr>
  );
};
