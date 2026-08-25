import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import searchIcon from "../assets/Search.png";



export const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const handleInput = (e) => {
    const value = e.target.value;
    if(value === ""){
      navigate("/");
      return;
    }
    if (location.pathname !== "/search") {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    } else {
      // 2. Jika sudah berada di halaman "/search", perbarui URL secara langsung.
      // Kita gunakan 'replace: true' agar tombol 'Back' di browser langsung kembali ke halaman 
      // sebelum pencarian, bukan kembali per-huruf yang diketik.
      navigate(`/search?q=${encodeURIComponent(value)}`, { replace: true });
    }
  }
  return (
    <>
      <div class="search-container">
        <img class="search-icon" src={searchIcon} />
        <input 
          class="search-input" 
          type="text" 
          placeholder="Mau Titip Apa?" 
          value={searchParams.q || ""}
          onInput={handleInput}
        />
      </div>
    </>
  );
};
