import { Show } from "solid-js";

// Ganti dengan nomor WhatsApp admin yang sebenarnya
const ADMIN_WA = "6281234567890";

export const UserRequestRow = (props) => {
  const approvalLabel = () => {
    switch (props.approval_status) {
      case "approved":
        return "Approved";
      case "denied":
        return "Denied";
      default:
        return "Pending";
    }
  };

  const approvalClass = () => {
    switch (props.approval_status) {
      case "approved":
        return "ur-badge ur-badge--approved";
      case "denied":
        return "ur-badge ur-badge--denied";
      default:
        return "ur-badge ur-badge--pending";
    }
  };

  const statusLabel = () => {
    return props.status === "complete" ? "Complete" : "Masa Pencarian";
  };

  const statusClass = () => {
    return props.status === "complete"
      ? "ur-badge ur-badge--complete"
      : "ur-badge ur-badge--incomplete";
  };

  const paymentStatusLabel = () => {
    switch (props.payment_status) {
      case "verified":
        return "Verified";
      case "rejected":
        return "Rejected";
      case "pending":
      case "pending_payment":
        return "Menunggu Verifikasi";
      default:
        return "Belum Dibayar";
    }
  };

  const paymentStatusClass = () => {
    switch (props.payment_status) {
      case "verified":
        return "ur-badge ur-badge--pay-verified";
      case "rejected":
        return "ur-badge ur-badge--pay-rejected";
      case "pending":
      case "pending_payment":
        return "ur-badge ur-badge--pay-pending";
      default:
        return "ur-badge ur-badge--pay-unpaid";
    }
  };

  const waMessage = () =>
    encodeURIComponent(
      `Halo Admin, saya ingin menanyakan pembayaran saya yang ditolak (Rejected) untuk request barang: "${props.name || "-"}". Mohon bantuannya. Terima kasih.`
    );

  return (
    <tr class="ur-row">
      <td>
        <div class="ur-user-info">
          <strong>{props.user_name || props.email || "Anonim"}</strong>
          <span class="ur-desc">WA: {props.phone_number || "-"}</span>
        </div>
      </td>
      <td>
        <div class="ur-img-thumb">
          {props.product_image_url ? (
            <img src={props.product_image_url} alt={props.name} />
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
      <td>
        <div class="ur-item-info">
          <a
            href={props.item_link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            class="ur-item-link"
          >
            {props.name}
          </a>
          <span class="ur-desc">
            Kategori: {props.category || "-"}. {props.details}
          </span>
        </div>
      </td>
      <td>
        <span class={approvalClass()}>{approvalLabel()}</span>
      </td>
      <td>
        <span class={statusClass()}>{statusLabel()}</span>
      </td>
      <td>
        <div class="ur-payment-cell">
          <span class={paymentStatusClass()}>{paymentStatusLabel()}</span>
          {/* Jika pembayaran ditolak, tampilkan tombol hubungi admin */}
          <Show when={props.payment_status === "rejected"}>
            <a
              href={`https://wa.me/${ADMIN_WA}?text=${waMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              class="ur-contact-admin-btn"
              title="Hubungi Admin via WhatsApp"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style="flex-shrink:0;"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hubungi Admin
            </a>
          </Show>
        </div>
      </td>
    </tr>
  );
};
