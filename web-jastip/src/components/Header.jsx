import "../style/Header.css";
import { SearchBar } from "./SearchBar";
import cartIcon from "../assets/Cart.png";
import waIcon from "../assets/WAIcon.png";
import profileIcon from "../assets/ProfileIcon.png";
import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { users, setUsers, cartCount, setCartCount} from "../store/WebStore";
import { onMount } from "solid-js";
import { API_URL } from "../config";
export const Header = () => {
  
  onMount(() => {
    fetchQty();
  });

  const fetchQty = async () => {
    try {
      const user = users();
      if (!user || !user.currUser || !user.currUser.id) return;

      const response = await fetch(`${API_URL}/api/cart?user_id=${user.currUser.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Karena server mengembalikan array 'cart', kita jumlahkan seluruh 'quantity' dari tiap item
        const totalQty = data.cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      }
      console.log(data.message);
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <>
      <header>
        <div class="upper-h">
          {/* 1. Title Web */}
          <p class="title">
            Jastip <span class="blue-t">Stella</span>
          </p>
          {/* 2. SearchBar */}
          <SearchBar />
          {/* 3. Contacts Us */}
          <div class="right-container">
            <a
              href="https://wa.me/628122040228"
              target="_blank"
              rel="noopener noreferrer"
              class="contact-container"
            >
              <span class="contact-text">Kontak di Sini</span>
              <img class="wa-icon" src={waIcon} />
            </a>
            {/* 4. Cart */}
            <A href="/cart" class="cart-link">
              <div class="cart-container">
                <img class="cart-icon" src={cartIcon} />
                <Show when={cartCount() > 0}>
                  <span class="cart-bubble">{cartCount()}</span>
                </Show>
              </div>
            </A>
            {/* 5. Profile */}
            {/* Hanya muncul kalau belum login */}
            <Show when={users().currUser === null}>
              <div class="auth-buttons">
                <A href="/signup" class="auth-link">
                  Sign Up
                </A>
                <A href="/login" class="auth-link">
                  Log In
                </A>
              </div>
            </Show>

            {/* Hanya muncul kalau SUDAH login */}
            <Show when={users().currUser !== null}>
              <A href="/profile" class="profile-link">
                <img src={profileIcon} class="profile-icon" />
              </A>
            </Show>
          </div>
        </div>
        <div class="category-container">
          <div class="left-categories">
            <A href="/" end class="category-item">
              Beranda
            </A>
          </div>
          <div class="right-categories">
            <A href="/kategori/semua" class="category-item">
              Semua Kategori
            </A>
            <A href="/kategori/kosmetik" class="category-item">
              Kosmetik
            </A>
            <A href="/kategori/makanan" class="category-item">
              Makanan
            </A>
            <A href="/kategori/suplementasi" class="category-item">
              Suplementasi
            </A>
            <A href="/kategori/fashion" class="category-item">
              Fashion
            </A>
            <A href="/kategori/others" class="category-item">
              Others
            </A>
          </div>
        </div>
      </header>
    </>
  );
};
