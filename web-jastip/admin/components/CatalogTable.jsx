import { createSignal } from "solid-js";

const CatalogTable = (props) => {
  const [price, setPrice] = createSignal("");

  const handlePrice = (e) => {
    setPrice(e.target.value);
  };
  return (
    <>
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-info">
              <strong>{props.name}</strong>
              <span class="desc">{props.description}</span>
            </div>
          </div>
        </td>
        <td>
          <input
            type="text"
            class="input-price"
            value={price()}
            onInput={handlePrice}
          />
        </td>
        <td>
          <select class="select-status status-complete">
            <option value="complete" selected>
              Complete (Sudah Dibelikan)
            </option>
            <option value="incomplete">Incomplete (Belum Dibelikan)</option>
          </select>
        </td>
        <td>
          <button class="btn btn-danger">Remove</button>
        </td>
      </tr>
    </>
  );
};
