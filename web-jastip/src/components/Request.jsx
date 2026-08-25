import "../style/Request.css";

const truncateText = (text, maxLength = 70) => {
  if (!text) return "Tidak ada detail barang";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

export const Request = (props) => {
  return (
    <div class="request-item-card">
      {/* Bagian Gambar Request Produk */}
      <div class="request-img-wrapper">
        <img
          src={props.image || "https://via.placeholder.com/300?text=No+Image"}
          alt={props.name || "Request Item"}
          class="request-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/300?text=Gagal+Dimuat";
          }}
        />
        {props.category && <span class="request-badge">{props.category}</span>}
      </div>
      {/* Bagian Detail Informasi Request */}
      <div class="request-info">
        <h3 class="request-title">{props.name || "Request Barang"}</h3>
        <p class="request-desc">{truncateText(props.desc, 70)}</p>

        {/* Informasi Request dari Siapa */}
        <div class="request-user-box">
          <span class="user-label">Requested by:</span>
          <span class="user-name">{props.user || "Anonim"}</span>
        </div>

        {/* Optional Link Barang */}
        {props.link && (
          <a
            href={props.link}
            target="_blank"
            rel="noopener noreferrer"
            class="request-link-btn"
          >
            Lihat Link Barang ↗
          </a>
        )}
      </div>
    </div>
  );
};
