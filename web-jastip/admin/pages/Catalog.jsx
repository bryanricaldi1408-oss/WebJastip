import { createSignal } from "solid-js";
import "../style/Catalog.css";
import { A, useNavigate } from "@solidjs/router";
import { setUsers } from "../../src/store/WebStore";

export const Catalog = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  return (
    <>
      <div class="admin-layout">
        <div
          class={`sidebar-overlay ${sidebarOpen() ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        ></div>
        <aside class={`sidebar ${sidebarOpen() ? "open" : ""}`}>
          <div class="sidebar-header">
            <h2>
              <span class="blue-t">Jastip</span> Stella
            </h2>
            <span class="badge">Admin Panel</span>
          </div>
          <nav class="sidebar-menu">
            <A href="/admin" class="menu-item">
              Dashboard
            </A>
            <A href="/catalogs" class="menu-item active">
              Catalog View
            </A>
            <A href="/admin/payment" class="menu-item">
              Payment
            </A>
            <A href="/admin/settings" class="menu-item">
              Settings
            </A>
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
            <div class="topbar-left">
              <button
                class="hamburger-btn"
                onClick={() => setSidebarOpen(!sidebarOpen())}
              >
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
              </button>
              <div>
                <h1>Catalog Products</h1>
                <p class="subtitle">
                  Tampilan grid produk mirip dengan halaman depan web (Home).
                </p>
              </div>
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
