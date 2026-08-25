import { useSearchParams, A } from "@solidjs/router";
import { createEffect, createSignal, onMount, Show, For } from "solid-js";
import { Product } from "../components/Product";
import { Request } from "../components/Request";
import { fetchProducts, fetchRequests, products, requests } from "../store/WebStore";

export const Search = () => {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [filteredProducts, setFilteredProducts] = createSignal([]);
    const [filteredRequests, setFilteredRequests] = createSignal([]);

    onMount(async () => {
        try {
            await Promise.all([fetchProducts(), fetchRequests()]);
        } catch (error) {
            console.error("Gagal memuat data pencarian:", error);
        } finally {
            setIsLoading(false);
        }
    });

    createEffect(() => {
        const query = (searchParams.q || "").toLowerCase().trim();
        if (!query) {
            setFilteredProducts(products());
            setFilteredRequests(requests());
        } else {
            // Filter Produk
            const filteredP = products().filter((item) => 
                item.name.toLowerCase().includes(query) ||
                (item.description && item.description.toLowerCase().includes(query))
            );
            setFilteredProducts(filteredP);

            // Filter Request
            const filteredR = requests().filter((item) => 
                item.name.toLowerCase().includes(query) ||
                (item.details && item.details.toLowerCase().includes(query))
            );
            setFilteredRequests(filteredR);
        }
    });

    return (
        <div class="products-section" style={{ padding: "40px 5%", "min-height": "80vh" }}>
            {/* Judul Halaman Pencarian */}
            <div class="section-header" style={{ "margin-bottom": "30px" }}>
                <h2 class="section-title">
                    Hasil Pencarian untuk: <span class="blue">{searchParams.q || ""}</span>
                </h2>
                <span style={{ color: "#888" }}>
                    ({filteredProducts().length + filteredRequests().length} hasil ditemukan)
                </span>
            </div>

            {/* Tampilan Loading */}
            <Show when={isLoading()}>
                <div style={{ "text-align": "center", "padding": "50px 0" }}>
                    <p>Mencari produk...</p>
                </div>
            </Show>

            {/* Tampilan Jika Selesai Loading */}
            <Show when={!isLoading()}>
                <Show 
                    when={filteredProducts().length > 0 || filteredRequests().length > 0} 
                    fallback={
                        <div style={{ "text-align": "center", "padding": "50px 0", color: "#888" }}>
                            <h3>Produk tidak ditemukan!!</h3>
                            <p>Coba gunakan kata kunci lain.</p>
                        </div>
                    }
                >
                    {/* Bagian Produk Katalog */}
                    <Show when={filteredProducts().length > 0}>
                        <div style={{ "margin-bottom": "40px" }}>
                            <h3 style={{ "margin-bottom": "20px", "border-left": "4px solid #007bff", "padding-left": "10px" }}>
                                Produk Katalog
                            </h3>
                            <div class="product-container">
                                <For each={filteredProducts()}>
                                    {(item) => (
                                        <A href={`/product/${item.id}`} style="text-decoration: none;">
                                            <Product 
                                                name={item.name}
                                                description={item.description}
                                                price={item.price}
                                                image_url={item.image_url}
                                            />
                                        </A>
                                    )}
                                </For>
                            </div>
                        </div>
                    </Show>

                    {/* Bagian Request Titipan */}
                    <Show when={filteredRequests().length > 0}>
                        <div>
                            <h3 style={{ "margin-bottom": "20px", "border-left": "4px solid #ffc107", "padding-left": "10px" }}>
                                Request Jastip
                            </h3>
                            <div class="request-container">
                                <For each={filteredRequests()}>
                                    {(item) => (
                                        <A href={`/request/${item.id}`} style="text-decoration: none;">
                                            <Request
                                                image={item.product_image_url}
                                                category={item.category}
                                                name={item.name}
                                                desc={item.details}
                                                user={item.user_name}
                                                link={item.item_link}
                                            />
                                        </A>
                                    )}
                                </For>
                            </div>
                        </div>
                    </Show>
                </Show>
            </Show>
        </div>
    );
};