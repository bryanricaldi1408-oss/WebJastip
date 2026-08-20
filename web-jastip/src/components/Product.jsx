import "../style/Product.css";

export const Product = (props) => {
  return (
    <div class="product-card">
      {/* Bagian Gambar Produk */}
      <div class="product-img-wrapper">
        <img
          src={props.image || "https://via.placeholder.com/300"}
          alt={props.name || "Nama Produk"}
          class="product-img"
        />
      </div>

      {/* Bagian Detail Informasi Produk */}
      <div class="product-info">
        <h3 class="product-name">{props.name || "Nama"}</h3>
        <p class="product-desc">{props.desc || "desc"}</p>
        <p class="product-price">
          {props.price ? `Rp ${props.price.toLocaleString("id-ID")}` : "Err"}
        </p>
      </div>
    </div>
  );
};
