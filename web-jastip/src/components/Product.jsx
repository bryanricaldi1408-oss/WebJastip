import "../style/Product.css";
import { Show } from "solid-js";

const truncateText = (text, maxLength = 50) => {
  if (!text) return "Tidak ada deskripsi";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

export const Product = (props) => {
  return (
    <div class="product-card">
      {/* Bagian Gambar Produk */}
      <div class="product-img-wrapper">
        <img
          src={props.image_url || props.image || "https://via.placeholder.com/300?text=No+Image"}
          alt={props.name || "Nama Produk"}
          class="product-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/300?text=Gagal+Dimuat";
          }}
        />
        <Show when={props.category}>
          <span class="product-badge">{props.category}</span>
        </Show>
      </div>

      {/* Bagian Detail Informasi Produk */}
      <div class="product-info">
        <h3 class="product-name">{props.name || "Nama"}</h3>
        <p class="product-desc">{truncateText(props.description)}</p>
        <p class="product-price">
          {props.price ? `Rp ${Number(props.price).toLocaleString("id-ID")}` : "Err"}
        </p>
      </div>
    </div>
  );
};
