import { createSignal, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import "../style/Payment.css";

export const Payment = () => {
  const location = useLocation();
  const baseAmount = () => location.state?.amount ?? 0;
  
  // Generate a random unique code (between 100 and 999) if there's a baseAmount
  const [uniqueCode] = createSignal(
    baseAmount() > 0 ? Math.floor(Math.random() * 900) + 100 : 0
  );
  
  const totalAmount = () => baseAmount() > 0 ? baseAmount() + uniqueCode() : 0;

  const [bankName, setBankName] = createSignal("");
  const [senderName, setSenderName] = createSignal("");
  const [amount, setAmount] = createSignal(
    totalAmount() > 0 ? totalAmount().toString() : ""
  );
  const [imagePreview, setImagePreview] = createSignal(null);
  const [imageFile, setImageFile] = createSignal(null);
  const [isCopiedBCA, setIsCopiedBCA] = createSignal(false);
  const [isSuccess, setIsSuccess] = createSignal(false);

  // local file selection preview handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removePreview = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopiedBCA(true);
    setTimeout(() => setIsCopiedBCA(false), 2000);
  };

  // Dummy submit handler to trigger success state
  const handleSubmit = (e) => {
    e.preventDefault();
    // User will replace this with their actual upload logic and backend API call
    setIsSuccess(true);
  };

  return (
    <div class="pay-page">
      <a href="/cart" class="pay-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Kembali ke Keranjang
      </a>

      <Show
        when={!isSuccess()}
        fallback={
          <div class="pay-form-panel">
            <div class="pay-success-container">
              <div class="pay-success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 class="pay-success-title">Bukti Berhasil Dikirim</h2>
              <p class="pay-success-text">
                Terima kasih! Bukti transfer Anda telah kami terima. Mohon tunggu proses verifikasi oleh Admin Stella.
              </p>
              <a href="/" class="pay-home-btn">Kembali ke Beranda</a>
            </div>
          </div>
        }
      >
        <div class="pay-header">
          <h1 class="pay-title">Konfirmasi Pembayaran</h1>
          <p class="pay-subtitle">Silakan lakukan transfer bank dan unggah bukti transaksi Anda di bawah ini.</p>
        </div>

        <div class="pay-grid">
          {/* Bagian Kiri: Info Rekening & Petunjuk */}
          <div class="pay-info-panel">
            <div class="pay-instruction-card">
              <h3 class="pay-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--pay-blue)">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                Rekening Tujuan
              </h3>

              <div class="pay-bank-item">
                <div class="pay-bank-details">
                  <span class="pay-bank-name">Bank BCA</span>
                  <span class="pay-bank-number">8690987654</span>
                  <span class="pay-bank-owner">a.n. Stella Ricaldi</span>
                </div>
                <button class="pay-copy-btn" onClick={() => copyToClipboard("8690987654")}>
                  <Show when={isCopiedBCA()} fallback={
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Salin
                    </>
                  }>
                    Selesai
                  </Show>
                </button>
              </div>
            </div>

            <div class="pay-instruction-card">
              <h3 class="pay-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--pay-blue)">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Petunjuk Pembayaran BCA
              </h3>

              <div class="pay-combined-instructions">
                <div class="pay-instruction-section">
                  <h4 class="pay-instruction-subtitle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; color: var(--pay-blue)">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    1. Via m-Banking (BCA Mobile)
                  </h4>
                  <ul class="pay-steps">
                    <li class="pay-step-item">
                      <span class="pay-step-num">1</span>
                      <span>Buka aplikasi <strong>BCA Mobile</strong>, pilih menu <strong>m-BCA</strong> dan masukkan kode akses Anda.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">2</span>
                      <span>Pilih menu <strong>m-Transfer</strong> &gt; <strong>Daftar Rekening </strong>&gt;<strong>Antar Rekening</strong>.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">3</span>
                      <span>Masukkan nomor rekening tujuan <strong>8690987654</strong> dan masukkan nominal transfer tepat sebesar <Show when={baseAmount() > 0} fallback={<strong>total belanjaan Anda</strong>}><strong>Rp {totalAmount().toLocaleString("id-ID")}</strong></Show>.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">4</span>
                      <span>Konfirmasi nama penerima harus <strong>a.n. Stella Ricaldi</strong>, lalu pilih <strong>OK/Send</strong> dan masukkan PIN Anda.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">5</span>
                      <span>Simpan tangkapan layar (screenshot) bukti transfer untuk diunggah di formulir sebelah kanan.</span>
                    </li>
                  </ul>
                </div>

                <div class="pay-instruction-divider"></div>

                <div class="pay-instruction-section">
                  <h4 class="pay-instruction-subtitle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; color: var(--pay-blue)">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    2. Via Mesin ATM BCA
                  </h4>
                  <ul class="pay-steps">
                    <li class="pay-step-item">
                      <span class="pay-step-num">1</span>
                      <span>Masukkan kartu ATM BCA Anda dan masukkan 6 digit PIN ATM Anda.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">2</span>
                      <span>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rek BCA</strong>.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">3</span>
                      <span>Masukkan nomor rekening tujuan <strong>8690987654</strong> lalu tekan <strong>Benar</strong>.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">4</span>
                      <span>Masukkan nominal transfer tepat sebesar <Show when={baseAmount() > 0} fallback={<strong>total belanjaan Anda</strong>}><strong>Rp {totalAmount().toLocaleString("id-ID")}</strong></Show> lalu tekan <strong>Benar</strong>.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">5</span>
                      <span>Pada layar konfirmasi transfer, pastikan nama penerima adalah <strong>a.n. Stella Ricaldi</strong>, lalu pilih <strong>Ya</strong>.</span>
                    </li>
                    <li class="pay-step-item">
                      <span class="pay-step-num">6</span>
                      <span>Simpan struk bukti transfer ATM Anda, kemudian foto struk tersebut untuk diunggah di formulir sebelah kanan.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Form Upload Bukti */}
          <div class="pay-form-panel">
            <Show when={baseAmount() > 0}>
              <div class="pay-amount-due-card">
                <span class="pay-due-label">TOTAL YANG HARUS DITRANSFER</span>
                <span class="pay-due-amount">Rp {totalAmount().toLocaleString("id-ID")}</span>
                <div class="pay-due-breakdown">
                  <span>Subtotal: Rp {baseAmount().toLocaleString("id-ID")}</span>
                  <span class="pay-due-plus">+</span>
                  <span>Kode Unik: Rp {uniqueCode()}</span>
                </div>
                <p class="pay-due-note">
                  *Mohon transfer tepat sampai digit terakhir agar memudahkan verifikasi otomatis oleh sistem.
                </p>
              </div>
            </Show>

            <form class="pay-form" onSubmit={handleSubmit}>
              <div class="pay-form-group">
                <label class="pay-label" for="bank">Bank Asal Anda</label>
                <input
                  type="text"
                  id="bank"
                  class="pay-input"
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  value={bankName()}
                  onInput={(e) => setBankName(e.target.value)}
                  required
                />
              </div>

              <div class="pay-form-group">
                <label class="pay-label" for="name">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  id="name"
                  class="pay-input"
                  placeholder="Nama sesuai buku tabungan"
                  value={senderName()}
                  onInput={(e) => setSenderName(e.target.value)}
                  required
                />
              </div>


              <div class="pay-form-group">
                <label class="pay-label">Bukti Transfer (Gambar)</label>
                <Show
                  when={imagePreview()}
                  fallback={
                    <label class="pay-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        style="display: none;"
                        onChange={handleFileChange}
                        required
                      />
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pay-upload-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span class="pay-upload-text">Klik untuk Unggah Gambar</span>
                      <span class="pay-upload-hint">Format JPG, PNG, atau WEBP</span>
                    </label>
                  }
                >
                  <div class="pay-preview-container">
                    <img src={imagePreview()} alt="Receipt Preview" class="pay-preview-img" />
                    <button type="button" class="pay-remove-preview" onClick={removePreview}>
                      &times;
                    </button>
                  </div>
                </Show>
              </div>

              <button type="submit" class="pay-submit-btn" disabled={!imageFile()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Kirim Bukti Pembayaran
              </button>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};
