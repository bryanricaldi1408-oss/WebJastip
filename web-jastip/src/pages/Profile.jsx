import "../style/Profile.css";
import "../style/Auth.css";
import "../style/UserRequest.css";
import profileIcon from "../assets/ProfileIcon.png";
import { users, setUsers, showNotification } from "../store/WebStore";
import { useNavigate } from "@solidjs/router";
import { onMount, onCleanup, createSignal, Show, For } from "solid-js";
import { UserRequestRow } from "../components/UserRequestRow";
import { io } from "socket.io-client";
import { API_URL } from "../config";
export const Profile = () => {
  const getInitialAddress = () =>
    users().currUser?.addresses || users().currUser?.address || "";

  const parseAddressString = (fullStr) => {
    if (!fullStr) return { jalan: "", rtRw: "", kelurahan: "", kecamatan: "", kodePos: "" };

    let temp = fullStr;
    let kodePosVal = "";
    let kecamatanVal = "";
    let kelurahanVal = "";
    let rtRwVal = "";

    const kpMatch = temp.match(/,?\s*Kode Pos\s*:?\s*(\d+)/i);
    if (kpMatch) {
      kodePosVal = kpMatch[1];
      temp = temp.replace(kpMatch[0], "");
    }

    const kecMatch = temp.match(/,?\s*Kec\.\s*:?\s*([^,]+)/i);
    if (kecMatch) {
      kecamatanVal = kecMatch[1].trim();
      temp = temp.replace(kecMatch[0], "");
    }

    const kelMatch = temp.match(/,?\s*Kel\.\s*:?\s*([^,]+)/i);
    if (kelMatch) {
      kelurahanVal = kelMatch[1].trim();
      temp = temp.replace(kelMatch[0], "");
    }

    const rtMatch = temp.match(/,?\s*RT\/RW\s*:?\s*([^,]+)/i);
    if (rtMatch) {
      rtRwVal = rtMatch[1].trim();
      temp = temp.replace(rtMatch[0], "");
    }

    return {
      jalan: temp.trim().replace(/^,|,$/g, "").trim(),
      rtRw: rtRwVal,
      kelurahan: kelurahanVal,
      kecamatan: kecamatanVal,
      kodePos: kodePosVal
    };
  };

  const initialAddr = parseAddressString(getInitialAddress());

  const [name, setName] = createSignal(users().currUser?.name || "");
  const [phone, setPhone] = createSignal(users().currUser?.phone_number || "");
  const [jalan, setJalan] = createSignal(initialAddr.jalan);
  const [rtRw, setRtRw] = createSignal(initialAddr.rtRw);
  const [kelurahan, setKelurahan] = createSignal(initialAddr.kelurahan);
  const [kecamatan, setKecamatan] = createSignal(initialAddr.kecamatan);
  const [kodePos, setKodePos] = createSignal(initialAddr.kodePos);
  const [password, setPassword] = createSignal("");
  const [newPass, setNewPass] = createSignal("");
  const [confirmPass, setConfirmPass] = createSignal("");
  const [mapQuery, setMapQuery] = createSignal("");
  const [myRequests, setMyRequests] = createSignal([]);
  const [myOrders, setMyOrders] = createSignal([]);
  const [myCartItems, setMyCartItems] = createSignal([]);

  const socket = io(API_URL);

  const allPaymentItems = () => {
    const list = [];

    // 1. Items currently in cart (Belum Dibayar)
    for (const c of myCartItems()) {
      list.push({
        id: `cart-${c.id}`,
        name: c.name,
        image_url: c.image_url,
        category: c.category || "Katalog",
        quantity: c.quantity,
        price: c.price * c.quantity,
        status: "unpaid",
        type: c.type,
        is_cart: true,
      });
    }

    // 2. Items from orders (Submitted & Paid/Pending/Verified/Rejected)
    for (const o of myOrders()) {
      let parsedItems = [];
      try {
        if (o.items) {
          parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        }
      } catch (e) {
        console.error("Error parsing order items:", e);
      }

      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        for (const it of parsedItems) {
          list.push({
            id: `order-${o.id}-${it.id || it.product_id || it.request_id}`,
            order_id: o.id,
            name: it.name,
            image_url: it.image_url,
            category: it.category || "Katalog",
            quantity: it.quantity,
            price: it.price * it.quantity,
            status: o.status,
            type: it.type,
            is_cart: false,
          });
        }
      } else {
        list.push({
          id: `order-${o.id}`,
          order_id: o.id,
          name: `Pesanan #${String(o.id).padStart(5, "0")}`,
          image_url: null,
          category: "Checkout",
          quantity: 1,
          price: o.total_price || 0,
          status: o.status,
          type: "order",
          is_cart: false,
        });
      }
    }

    return list;
  };

  const getFullAddress = () => {
    const parts = [];
    if (jalan().trim()) parts.push(jalan().trim());
    if (rtRw().trim()) {
      const cleanRt = rtRw().trim();
      parts.push(cleanRt.toLowerCase().startsWith("rt") ? cleanRt : `RT/RW ${cleanRt}`);
    }
    if (kelurahan().trim()) {
      const cleanKel = kelurahan().trim();
      parts.push(cleanKel.toLowerCase().startsWith("kel") ? cleanKel : `Kel. ${cleanKel}`);
    }
    if (kecamatan().trim()) {
      const cleanKec = kecamatan().trim();
      parts.push(cleanKec.toLowerCase().startsWith("kec") ? cleanKec : `Kec. ${cleanKec}`);
    }
    if (kodePos().trim()) {
      const cleanKode = kodePos().trim();
      parts.push(cleanKode.toLowerCase().includes("kode pos") ? cleanKode : `Kode Pos ${cleanKode}`);
    }
    return parts.join(", ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullAddress = getFullAddress();

    try {
      const response = await fetch(`${API_URL}/api/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: users().currUser?.email,
          name: name(),
          phone_number: phone(),
          addresses: fullAddress,
          address: fullAddress,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Profil berhasil disimpan!", "success");
        setUsers("currUser", data.user);
      } else {
        showNotification("Gagal menyimpan profil: " + data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error: Tidak bisa menghubungi server.", "error");
    }
  };
  onMount(async () => {
    // Jika currUser masih kosong (belum login)
    if (users().currUser === null) {
      showNotification(
        "Akses ditolak! Anda harus Log In terlebih dahulu.",
        "error",
      );
      // Tendang balik ke halaman login, dan replace history agar tidak bisa di-back
      navigate("/login", { replace: true });
      return;
    }

    // Fetch requests milik user ini
    try {
      const response = await fetch(
        `${API_URL}/api/requests?email=${encodeURIComponent(users().currUser?.email)}`,
      );
      const data = await response.json();
      if (response.ok) {
        setMyRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching user requests:", err);
    }

    // Fetch orders/payment status milik user ini
    try {
      const userId = users().currUser?.id;
      if (userId) {
        const ordRes = await fetch(`${API_URL}/api/orders/user/${userId}`);
        const ordData = await ordRes.json();
        if (ordRes.ok) {
          setMyOrders(ordData.orders || []);
        }

        const cartRes = await fetch(`${API_URL}/api/cart?user_id=${userId}`);
        const cartData = await cartRes.json();
        if (cartRes.ok) {
          setMyCartItems(cartData.cart || []);
        }
      }
    } catch (err) {
      console.error("Error fetching user orders or cart:", err);
    }

    // Listen for real-time new requests
    socket.on("new_request", (newReq) => {
      // Hanya tambahkan jika request ini milik user yang sedang login
      if (
        newReq.user_email === users().currUser?.email ||
        newReq.email === users().currUser?.email
      ) {
        setMyRequests((prev) => [newReq, ...prev]);
      }
    });

    // Listen for real-time approval/deny updates
    socket.on("request_status_changed", (updatedReq) => {
      setMyRequests((prev) =>
        prev.map((req) =>
          req.id === updatedReq.id
            ? {
              ...req,
              approval_status: updatedReq.approval_status,
              status: updatedReq.status,
            }
            : req,
        ),
      );
    });

    socket.on("order_status_changed", (updatedOrd) => {
      setMyOrders((prev) =>
        prev.map((o) => (o.id === updatedOrd.id ? { ...o, status: updatedOrd.status } : o))
      );
    });
  });

  onCleanup(() => {
    socket.off("new_request");
    socket.off("request_status_changed");
    socket.off("order_status_changed");
    socket.disconnect();
  });

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPass() !== confirmPass()) {
      showNotification(
        "Password baru dan konfirmasi password tidak sama!",
        "error",
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/update-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: users().currUser?.email,
            oldPassword: password(),
            newPassword: newPass(),
          }),
        },
      );
      const data = await response.json();

      if (response.ok) {
        showNotification("Password berhasil diubah!", "success");
        setUsers("currUser", data.user);
        setPassword("");
        setNewPass("");
        setConfirmPass("");
      } else {
        showNotification("Gagal mengubah password: " + data.message, "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Error: Tidak bisa menghubungi server.", "error");
    }
  };
  const navigate = useNavigate();
  const handleLogout = () => {
    setUsers("currUser", null);
    showNotification("Berhasil keluar (Log Out)", "info");
    navigate("/", { replace: true });
  };
  return (
    <div class="profile-container">
      <div class="profile-header">
        <img src={profileIcon} alt="Profile" class="profile-page-icon" />
        <div class="profile-title-area">
          <h1 class="profile-title">Profil Saya</h1>
          <p class="profile-subtitle">
            Atur alamat pengiriman dan keamanan akun Anda.
          </p>
        </div>
      </div>

      <div class="profile-content">
        {/* Bagian Kiri: Informasi Pribadi & Alamat */}
        <div class="profile-section">
          <h2 class="section-heading">Informasi & Pengiriman</h2>
          <form class="profile-form" onSubmit={handleSubmit}>
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.target.value)}
                class="profile-input"
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              {/* Email biasanya tidak bisa diganti (disabled) */}
              <input
                type="email"
                placeholder={users().currUser?.email}
                class="profile-input"
                disabled
              />
            </div>

            <div class="form-group">
              <label>Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={phone()}
                onInput={(e) => setPhone(e.target.value)}
                class="profile-input"
              />
            </div>

            {/* Detail Alamat Pengiriman (Dipecah) */}
            <div class="form-group">
              <label>Nama Jalan / No. Rumah / Gedung</label>
              <input
                type="text"
                placeholder="Contoh: Jl. Sudirman No. 12, Blok A"
                class="profile-input"
                value={jalan()}
                onInput={(e) => setJalan(e.target.value)}
              />
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label>RT / RW</label>
                <input
                  type="text"
                  placeholder="Contoh: 001/002"
                  class="profile-input"
                  value={rtRw()}
                  onInput={(e) => setRtRw(e.target.value)}
                />
              </div>

              <div class="form-group">
                <label>Kelurahan / Desa</label>
                <input
                  type="text"
                  placeholder="Contoh: Sukasari"
                  class="profile-input"
                  value={kelurahan()}
                  onInput={(e) => setKelurahan(e.target.value)}
                />
              </div>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label>Kecamatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Bogor Timur"
                  class="profile-input"
                  value={kecamatan()}
                  onInput={(e) => setKecamatan(e.target.value)}
                />
              </div>

              <div class="form-group">
                <label>Kode Pos</label>
                <input
                  type="text"
                  placeholder="Contoh: 16142"
                  class="profile-input"
                  value={kodePos()}
                  onInput={(e) => setKodePos(e.target.value)}
                />
              </div>
            </div>

            <div class="form-group">
              {/* Tombol pemicu map mencari alamat utuh lengkap */}
              <button
                type="button"
                class="profile-btn-secondary"
                style="margin-top: 8px; width: fit-content;"
                onClick={() => setMapQuery(getFullAddress())}
              >
                Cari Titik di Peta
              </button>

              <Show when={mapQuery() !== ""}>
                <div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #eaeaea;">
                  <iframe
                    width="100%"
                    height="250"
                    style="border:0;"
                    loading="lazy"
                    allowfullscreen
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery())}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
              </Show>
            </div>

            <button type="submit" class="profile-btn-primary">
              Simpan Profil & Alamat
            </button>
          </form>
        </div>

        {/* Bagian Kanan: Ganti Password */}
        <div class="profile-section">
          <h2 class="section-heading">Keamanan Akun</h2>
          <form class="profile-form" onSubmit={changePassword}>
            <div class="form-group">
              <label>Password Saat Ini</label>
              <input
                type="password"
                placeholder="••••••••"
                class="profile-input"
                value={password()}
                onInput={(e) => setPassword(e.target.value)}
              />
            </div>

            <div class="form-group">
              <label>Password Baru</label>
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                class="profile-input"
                value={newPass()}
                onInput={(e) => setNewPass(e.target.value)}
              />
            </div>

            <div class="form-group">
              <label>Konfirmasi Password Baru</label>
              <input
                type="password"
                placeholder="Ulangi password baru"
                class="profile-input"
                value={confirmPass()}
                onInput={(e) => setConfirmPass(e.target.value)}
              />
            </div>

            <button type="submit" class="profile-btn-secondary">
              Ganti Password
            </button>
          </form>

          <div class="logout-area">
            <button class="profile-btn-danger" onClick={handleLogout}>
              Log out
            </button>
            <Show when={users().currUser?.role === "admin"}>
              <button
                class="profile-btn-admin"
                onClick={() => navigate("/admin")}
              >
                To Admin Panel
              </button>
            </Show>
          </div>
        </div>
      </div>

      {/* Section Request Table */}
      <div class="ur-section">
        <div class="ur-section-header">
          <h2>Riwayat Request Saya</h2>
          <Show when={myRequests().length > 0}>
            <span class="ur-count">{myRequests().length}</span>
          </Show>
        </div>
        <div class="ur-card">
          <Show
            when={myRequests().length > 0}
            fallback={
              <div class="ur-empty-state">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="color: #ccc;"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>Belum ada request. Silakan ajukan request titipan Anda!</p>
              </div>
            }
          >
            <div class="ur-table-responsive">
              <table class="ur-table">
                <thead>
                  <tr>
                    <th>Info Pemesan</th>
                    <th>Gambar Produk</th>
                    <th>Detail Barang</th>
                    <th>Persetujuan</th>
                    <th>Status Barang</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={myRequests()}>
                    {(item) => (
                      <UserRequestRow
                        id={item.id}
                        email={item.user_name}
                        phone_number={item.phone_number}
                        item_link={item.item_link}
                        name={item.name}
                        details={item.details}
                        category={item.category}
                        product_image_url={item.product_image_url}
                        approval_status={item.approval_status}
                        status={item.status}
                      />
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </div>

      {/* ===== STICKY REJECTED PAYMENT BANNER ===== */}
      <Show when={allPaymentItems().some((item) => item.status === "rejected")}>
        <div class="o-rejected-banner">
          <div class="o-rejected-banner-left">
            <span class="o-rejected-banner-icon">⚠️</span>
            <div>
              <strong>Pembayaran Ditolak</strong>
              <p>Terdapat pembayaran barang yang ditolak oleh Admin. Silakan hubungi kami via WhatsApp.</p>
            </div>
          </div>
          <a
            href={`https://wa.me/6281234567890?text=${encodeURIComponent("Halo Admin, saya ingin menanyakan pembayaran saya yang ditolak (Rejected). Mohon bantuannya. Terima kasih.")}`}
            target="_blank"
            rel="noopener noreferrer"
            class="o-rejected-wa-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </Show>

      {/* ===== DAFTAR BELANJA & STATUS PEMBAYARAN ===== */}
      <div class="o-section">
        <div class="ur-section-header">
          <h2>Daftar Belanja &amp; Status Pembayaran</h2>
          <Show when={allPaymentItems().length > 0}>
            <span class="ur-count">{allPaymentItems().length}</span>
          </Show>
        </div>
        <div class="ur-card">
          <Show
            when={allPaymentItems().length > 0}
            fallback={
              <div class="ur-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ccc;">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Belum ada barang di keranjang atau pesanan.</p>
              </div>
            }
          >
            <div class="ur-table-responsive">
              <table class="ur-table">
                <thead>
                  <tr>
                    <th>Gambar</th>
                    <th>Nama Barang</th>
                    <th>Jumlah</th>
                    <th>Total Harga</th>
                    <th>Status Pembayaran</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={allPaymentItems()}>
                    {(item) => {
                      const payLabel = () => {
                        switch (item.status) {
                          case "verified": return "Terverifikasi";
                          case "rejected": return "Ditolak";
                          case "pending":
                          case "pending_payment": return "Menunggu Verifikasi";
                          default: return "Belum Dibayar";
                        }
                      };
                      const payClass = () => {
                        switch (item.status) {
                          case "verified": return "ur-badge ur-badge--pay-verified";
                          case "rejected": return "ur-badge ur-badge--pay-rejected";
                          case "pending":
                          case "pending_payment": return "ur-badge ur-badge--pay-pending";
                          default: return "ur-badge ur-badge--pay-unpaid";
                        }
                      };
                      return (
                        <tr class="ur-row">
                          <td>
                            <div class="ur-img-thumb">
                              <Show
                                when={item.image_url}
                                fallback={
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color: #94A3B8;">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                }
                              >
                                <img src={item.image_url} alt={item.name} />
                              </Show>
                            </div>
                          </td>
                          <td>
                            <div class="ur-item-info">
                              <strong style="font-size: 14px; color: #1e293b;">{item.name}</strong>
                              <span class="ur-desc">Kategori: {item.category}</span>
                            </div>
                          </td>
                          <td>
                            <span style="font-weight: 600; color: #475569;">{item.quantity} item</span>
                          </td>
                          <td>
                            <span class="o-order-price">
                              Rp {Number(item.price || 0).toLocaleString("id-ID")}
                            </span>
                          </td>
                          <td>
                            <span class={payClass()}>{payLabel()}</span>
                          </td>
                          <td>
                            <div class="o-pay-status-cell">
                              <Show when={item.is_cart}>
                                <a href="/cart" class="o-receipt-link">
                                  Ke Keranjang 🛒
                                </a>
                              </Show>
                              <Show when={item.status === "rejected"}>
                                <a
                                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin, saya ingin menanyakan pembayaran saya yang ditolak (Rejected) untuk barang "${item.name}". Mohon bantuannya. Terima kasih.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="ur-contact-admin-btn"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  Hubungi Admin
                                </a>
                              </Show>
                              <Show when={!item.is_cart && item.status !== "rejected"}>
                                <span class="ur-desc">-</span>
                              </Show>
                            </div>
                          </td>
                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
