import { createSignal } from "solid-js";
import { showNotification } from "../../src/store/WebStore";
import { API_URL } from "../../src/config";
import { useNavigate } from "@solidjs/router";

export const RequestTable = (props) => {
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = createSignal(
    props.approval_status || "pending",
  );
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [productStatus, setProductStatus] = createSignal(
    props.status || "incomplete",
  );

  // Harga
  const formatThousand = (val) => {
    if (!val && val !== 0) return "";
    return String(Math.round(val)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [price, setPrice] = createSignal(props.price ?? "");
  const [priceInput, setPriceInput] = createSignal(
    props.price ? formatThousand(props.price) : ""
  );
  const [isSavingPrice, setIsSavingPrice] = createSignal(false);
  const [isEditingPrice, setIsEditingPrice] = createSignal(false);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleRowClick = (e) => {
    if (e.target.closest("button, select, a, input")) return;
    navigate(`/request/${props.id}`);
  };

  async function handleApproval(statusValue) {
    if (isProcessing()) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: statusValue, reqId: props.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setApprovalStatus(statusValue);
        showNotification(data.message || "Status berhasil diperbarui", "success");
        if (props.onStatusChange) props.onStatusChange(props.id, statusValue);
      } else {
        showNotification(data.message || "Gagal memperbarui status", "error");
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      showNotification("Terjadi kesalahan pada server", "error");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (isProcessing()) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/request-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reqId: props.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setProductStatus(newStatus);
        showNotification(data.message || "Status barang berhasil diperbarui", "success");
      } else {
        showNotification(data.message || "Gagal memperbarui status barang", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Terjadi kesalahan pada server", "error");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSavePrice() {
    const raw = priceInput().replace(/\./g, "");
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 0) {
      showNotification("Masukkan harga yang valid", "error");
      return;
    }
    setIsSavingPrice(true);
    try {
      const response = await fetch(`${API_URL}/api/request-price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parsed, reqId: props.id }),
      });
      
      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok) {
        setPrice(parsed);
        setPriceInput(formatThousand(parsed));
        setIsEditingPrice(false);
        showNotification(data.message || "Harga berhasil ditetapkan", "success");
      } else {
        const errorMsg = data.message || (response.status === 404 ? "Endpoint API belum tersedia di server backend Railway (Silakan redeploy backend Railway Anda)" : `Gagal menetapkan harga (Status HTTP ${response.status})`);
        showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Error saving price:", error);
      showNotification("Terjadi kesalahan pada server. Pastikan backend Anda sudah dideploy ulang / dijalankan.", "error");
    } finally {
      setIsSavingPrice(false);
    }

  }

  function handleCancelPrice() {
    setPriceInput(price() ? formatThousand(price()) : "");
    setIsEditingPrice(false);
  }

  return (
    <tr class="req-row" onClick={handleRowClick} style="cursor: pointer;">
      {/* Gambar */}
      <td class="req-cell req-cell--image">
        <div class="request-img-thumb">
          {props.product_image_url ? (
            <img
              src={props.product_image_url}
              alt={props.name}
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"
              style="color: #94A3B8;">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          )}
        </div>
      </td>

      {/* Info Pemesan */}
      <td class="req-cell req-cell--user" data-label="Pemesan">
        <div class="user-info">
          <strong>{props.user_name || props.email || "Anonim"}</strong>
          <span class="desc">WA: {props.phone_number || "-"}</span>
        </div>
      </td>

      {/* Detail Barang */}
      <td class="req-cell req-cell--detail" data-label="Barang">
        <div class="item-info">
          <a href={props.item_link || "#"} target="_blank"
            rel="noopener noreferrer" class="item-link">
            {props.name}
          </a>
          <span class="desc">
            Kategori: {props.category || "-"}. {props.details}
          </span>
        </div>
      </td>

      {/* Harga Admin */}
      <td class="req-cell req-cell--price" data-label="Harga">
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
          <div class="price-display" onClick={(e) => { e.stopPropagation(); setIsEditingPrice(true); }}>
            {price() ? (
              <span class="price-value">{formatIDR(price())}</span>
            ) : (
              <span class="price-empty">— Belum ada —</span>
            )}
            <button class="price-set-btn" title="Tetapkan harga">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        )}
      </td>

      {/* Persetujuan */}
      <td class="req-cell req-cell--approval" data-label="Persetujuan">
        <div class="approval-actions">
          <button
            class={`btn btn-approve ${approvalStatus() === "approved" ? "active" : ""}`}
            onClick={() => handleApproval("approved")}
            disabled={isProcessing()}
          >
            {approvalStatus() === "approved" ? "✓ Approved" : "Approve"}
          </button>
          <button
            class={`btn btn-deny ${approvalStatus() === "denied" ? "active" : ""}`}
            onClick={() => handleApproval("denied")}
            disabled={isProcessing()}
          >
            {approvalStatus() === "denied" ? "✗ Denied" : "Deny"}
          </button>
        </div>
      </td>

      {/* Status Barang */}
      <td class="req-cell req-cell--status" data-label="Status">
        <select
          class={`select-status ${productStatus() === "complete" ? "status-complete" : "status-incomplete"}`}
          value={productStatus()}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isProcessing()}
        >
          <option value="incomplete">Masa Pencarian</option>
          <option value="complete">Berhasil Didapat</option>
        </select>
      </td>
    </tr>
  );
};
