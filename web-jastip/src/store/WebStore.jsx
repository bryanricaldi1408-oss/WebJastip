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
