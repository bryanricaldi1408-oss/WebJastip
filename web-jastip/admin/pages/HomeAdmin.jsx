import { createSignal, For, onMount } from "solid-js";
import "../style/HomeAdmin.css";
import { A } from "@solidjs/router"
import { RequestTable } from "../components/RequestTable";



export const HomeAdmin = () => {
  const [ requests, setRequests ]= createSignal([]);

  
  onMount(async () => {
    const response = await fetch('http://localhost:5000/api/requests');
    const data = await response.json();
    setRequests(data.requests); // Menyimpan array data dari backend
  });

  return (
    <>
      <div class="admin-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2><span class="blue-t">Jastip</span> Stella</h2>
            <span class="badge">Admin Panel</span>
          </div>
          <nav class="sidebar-menu">
            <A href="/admin" class="menu-item active">Dashboard</A>
            <a href="/catalogs" class="menu-item">Catalog View</a>
            <a href="/payment" class="menu-item">Payment</a>
            <a href="#" class="menu-item">Settings</a>
          </nav>
          <div class="sidebar-footer">
            <button class="btn-logout">Logout</button>
          </div>
        </aside>

        <main class="main-content">
          <header class="topbar">
            <div>
              <h1>Overview Management</h1>
              <p class="subtitle">Kelola produk katalog dan request titipan pelanggan.</p>
            </div>
            <div class="admin-profile">
              <div class="avatar">A</div>
              <span>Admin Stella</span>
            </div>
          </header>

          <section class="admin-section">
            <div class="section-header">
              <h3>Catalog Products</h3>
              <button class="btn btn-primary">+ Add New Product</button>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Harga (Set Harga)</th>
                      <th>Status (Complete/Incomplete)</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="admin-section">
            <div class="section-header">
              <h3>User Requests</h3>
            </div>
            <div class="card">
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Info Pemesan</th>
                      <th>Gambar Produk</th>
                      <th>Detail Barang Incaran</th>
                      <th>Persetujuan (Approve/Deny)</th>
                      <th>Status Barang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={requests()}>
                      {(item) => (
                        <RequestTable
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
            </div>
          </section>
        </main>
      </div>
    </>
  );
};
