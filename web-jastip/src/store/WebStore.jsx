import { createSignal } from "solid-js";

const storedUser = localStorage.getItem("currUser");
const initialUser = storedUser ? JSON.parse(storedUser) : null;
const [cartCount, setCartCount]= createSignal(0);

const [users, setUsersSignal] = createSignal({
  currUser: initialUser,
});

const [notification, setNotification] = createSignal([]);
const [product, setProduct] = createSignal([]);

export { users };
export { notification };
export { product, setProduct };
export { cartCount, setCartCount};

export const [products, setProducts] = createSignal([]);
export const [requests, setRequests] = createSignal([]);

export const fetchRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/requests/approved",
      );
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Gagal mengambil data request:", error);
    }
  };

export const fetchProducts = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/products");
    const data = await response.json();

    if (response.ok) {
      setProducts(data.products || []);
    }
  } catch (error) {
    console.error("Gagal mengambil data produk: ", error);
  }
};

export const setUsers = (key, value) => {
  setUsersSignal((prev) => ({ ...prev, [key]: value }));
  if (key === "currUser") {
    if (value) {
      localStorage.setItem("currUser", JSON.stringify(value));
    } else {
      localStorage.removeItem("currUser");
    }
  }
};

export const showNotification = (
  message,
  type = "success",
  duration = 2000,
) => {
  const id = Date.now();
  setNotification((prev) => [...prev, { id, message, type }]);

  setTimeout(() => {
    setNotification((prev) => prev.filter((notif) => notif.id !== id));
  }, duration);
};
