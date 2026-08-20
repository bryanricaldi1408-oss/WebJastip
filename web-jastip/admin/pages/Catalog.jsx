import "../style/Catalog.css";
import { useNavigate } from "@solidjs/router";
import { setUsers } from "../../src/store/WebStore";

export const Catalog = () => {
  const navigate = useNavigate();

  return (
    <>
      <div class="admin-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>
              <span class="blue-t">Jastip</span> Stella
            </h2>
            <span class="badge">Admin Panel</span>
          </div>
          <nav class="sidebar-menu">
            <a href="index.html" class="menu-item">
              Dashboard
            </a>
            <a href="catalog.html" class="menu-item active">
              Catalog View
            </a>
            <a href="payment.html" class="menu-item">
              Payment
            </a>
            <a href="#" class="menu-item">
              Settings
            </a>
          </nav>
          <div class="sidebar-footer">
            <button
              class="btn-logout"
              onClick={() => {
                setUsers("currUser", null);
                navigate("/login");
              }}
            >
              Logout
            </button>
            <button class="btn-main-website" onClick={() => navigate("/")}>
              Main Website
            </button>
          </div>
        </aside>

        <main class="main-content">
          <header class="topbar">
            <div>
              <h1>Catalog Products</h1>
              <p class="subtitle">
                Tampilan grid produk mirip dengan halaman depan web (Home).
              </p>
            </div>
            <div class="admin-profile">
              <div class="avatar">A</div>
              <span>Admin Stella</span>
            </div>
          </header>

          <section class="admin-section">
            <div class="products-grid"></div>
          </section>
        </main>
      </div>
    </>
  );
};
