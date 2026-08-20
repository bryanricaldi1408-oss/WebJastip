import searchIcon from "../assets/Search.png";

export const SearchBar = () => {
  return (
    <>
      <div class="search-container">
        <img class="search-icon" src={searchIcon} />
        <input class="search-input" type="text" placeholder="Mau Titip Apa?" />
      </div>
    </>
  );
};
