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
    return props.status === "complete" ? "Complete" : "Incomplete";
  };

  const statusClass = () => {
    return props.status === "complete"
      ? "ur-badge ur-badge--complete"
      : "ur-badge ur-badge--incomplete";
  };

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
    </tr>
  );
};
