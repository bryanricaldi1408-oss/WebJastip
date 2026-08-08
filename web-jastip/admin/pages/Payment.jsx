import "../style/Payment.css";

export const Payment = () => {
    return (
        <>
            <div class="admin-layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <h2><span class="blue-t">Jastip</span> Stella</h2>
                        <span class="badge">Admin Panel</span>
                    </div>
                    <nav class="sidebar-menu">
                        <a href="index.html" class="menu-item">Dashboard</a>
                        <a href="catalog.html" class="menu-item">Catalog View</a>
                        <a href="payment.html" class="menu-item active">Payment</a>
                        <a href="#" class="menu-item">Settings</a>
                    </nav>
                    <div class="sidebar-footer">
                        <button class="btn-logout">Logout</button>
                    </div>
                </aside>

                <main class="main-content">
                    <header class="topbar">
                        <div>
                            <h1>Payment Verification</h1>
                            <p class="subtitle">Kelola dan verifikasi bukti transfer/pembayaran dari pelanggan.</p>
                        </div>
                        <div class="admin-profile">
                            <div class="avatar">A</div>
                            <span>Admin Stella</span>
                        </div>
                    </header>

                    <section class="admin-section">
                        <div class="card">
                            <div class="table-responsive">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Info Pengirim</th>
                                            <th>Bukti Transfer</th>
                                            <th>Status Pembayaran</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <strong>ORD-10023</strong>
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>Budi Santoso</strong>
                                                    <span class="desc">BCA - 987654321</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="item-info">
                                                    <div class="img-placeholder" style="cursor: pointer; background-color:#E2E8F0; font-size:10px;">BUKTI</div>
                                                    <a href="#" class="item-link">Lihat Gambar</a>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="approval-actions">
                                                    <button class="btn btn-approve">Verify</button>
                                                    <button class="btn btn-deny">Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <strong>ORD-10024</strong>
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>Siti Aminah</strong>
                                                    <span class="desc">Mandiri - 1122334455</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="item-info">
                                                    <div class="img-placeholder" style="cursor: pointer; background-color:#E2E8F0; font-size:10px;">BUKTI</div>
                                                    <a href="#" class="item-link">Lihat Gambar</a>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="approval-actions">
                                                    <button class="btn btn-approve active">Verified</button>
                                                    <button class="btn btn-deny">Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <strong>ORD-10025</strong>
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>Jane Doe</strong>
                                                    <span class="desc">BNI - 0987612345</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="item-info">
                                                    <span class="desc" style="color:var(--danger)">Belum ada bukti</span>
                                                </div>
                                            </td>
                                            <td>
                                                <select class="select-status status-incomplete">
                                                    <option value="pending" selected>Menunggu Pembayaran</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    ) 
}