import { A, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import "../style/Auth.css";
import { showNotification } from "../store/WebStore";

export const Signup = () => {
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [phone, setPhone] = createSignal("");

  const [nameErr, setNameErr] = createSignal("");
  const [emailErr, setEmailErr] = createSignal("");
  const [passErr, setPassErr] = createSignal("");
  const [phoneErr, setPhoneErr] = createSignal("");

  const navigate = useNavigate();

  function checkName(val) {
    if (val === "") {
      setNameErr("Nama tidak boleh kosong");
      return false;
    } else {
      setNameErr("");
      return true;
    }
  }

  function checkEmail(val) {
    if (val === "") {
      setEmailErr("Email tidak boleh kosong");
      return false;
    } else if (!val.includes("@")) {
      setEmailErr("Email harus memiliki tanda @");
      return false;
    } else {
      setEmailErr("");
      return true;
    }
  }

  function checkPass(val) {
    if (val === "") {
      setPassErr("Password tidak boleh kosong");
      return false;
    } else if (val.length < 8) {
      setPassErr("Password minimal 8 karakter");
      return false;
    } else {
      setPassErr("");
      return true;
    }
  }

  function checkPhone(val) {
    if (val === "") {
      setPhoneErr("Nomor telepon tidak boleh kosong");
      return false;
    } else {
      setPhoneErr("");
      return true;
    }
  }

  function handleNameInput(e) {
    const val = e.target.value;
    setName(val);
    checkName(val);
  }

  function handleEmailInput(e) {
    const val = e.target.value;
    setEmail(val);
    checkEmail(val);
  }

  function handlePassInput(e) {
    const val = e.target.value;
    setPassword(val);
    checkPass(val);
  }

  function handlePhoneInput(e) {
    const val = e.target.value;
    setPhone(val);
    checkPhone(val);
  }

  async function handleAuth(e) {
    e.preventDefault();

    const isNameValid = checkName(name());
    const isEmailValid = checkEmail(email());
    const isPassValid = checkPass(password());
    const isPhoneValid = checkPhone(phone());

    if (!isNameValid || !isEmailValid || !isPassValid || !isPhoneValid) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name(),
          email: email(),
          password: password(),
          phone: phone(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message, "success");
        navigate("/login");
      } else {
        showNotification(data.message, "error");
        console.log(data.message);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showNotification("Error: Tidak bisa menghubungi server.", "error");
    }
  }

  return (
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          Jastip <span class="blue-t">Stella</span>
        </div>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">
          Mulai titip barang incaranmu dari mana saja.
        </p>

        <form class="auth-form" onSubmit={handleAuth}>
          <div>
            <label>Nama</label>
            <input
              type="text"
              placeholder="Nama Anda"
              class="auth-input"
              value={name()}
              onInput={handleNameInput}
            />
            {nameErr() !== "" && <p class="auth-error">{nameErr()}</p>}
          </div>
          <div>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="contoh@email.com"
              class="auth-input"
              value={email()}
              onInput={handleEmailInput}
            />
            {emailErr() !== "" && <p class="auth-error">{emailErr()}</p>}
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              class="auth-input"
              value={password()}
              onInput={handlePassInput}
            />
            {passErr() !== "" && <p class="auth-error">{passErr()}</p>}
          </div>
          <div>
            <label>Nomor Telepon</label>
            <input
              type="tel"
              placeholder="08123456789"
              class="auth-input"
              value={phone()}
              onInput={handlePhoneInput}
            />
            {phoneErr() !== "" && <p class="auth-error">{phoneErr()}</p>}
          </div>

          <button type="submit" class="auth-btn">
            Sign Up
          </button>
        </form>

        <div class="auth-footer">
          Sudah punya akun?{" "}
          <A href="/login" class="auth-link-text">
            Log In di sini
          </A>
        </div>
      </div>
    </div>
  );
};
