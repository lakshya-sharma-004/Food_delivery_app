import { useEffect, useMemo, useState } from "react";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const categories = ["All", "Starters", "Mains", "Sides", "Drinks", "Desserts"];

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Unable to load data. Please try again.");
  }
  return response.json();
}

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [cuisine, setCuisine] = useState("All cuisines");
  const [menuSearch, setMenuSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (restaurantSearch.trim()) params.set("search", restaurantSearch.trim());
    if (cuisine !== "All cuisines") params.set("cuisine", cuisine);

    getJson(`/api/restaurants?${params}`)
      .then((data) => {
        if (!active) return;
        setRestaurants(data);
        setError("");
        if (selectedRestaurant && !data.some((restaurant) => restaurant.id === selectedRestaurant.id)) {
          setSelectedRestaurant(null);
          setMenuItems([]);
        }
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [restaurantSearch, cuisine]);

  useEffect(() => {
    if (!selectedRestaurant) {
      setMenuItems([]);
      return undefined;
    }

    let active = true;
    const params = new URLSearchParams();
    if (menuSearch.trim()) params.set("search", menuSearch.trim());
    if (category !== "All") params.set("category", category);

    getJson(`/api/restaurants/${selectedRestaurant.id}/menu?${params}`)
      .then(({ items }) => {
        if (active) {
          setMenuItems(items);
          setError("");
        }
      })
      .catch((requestError) => active && setError(requestError.message));

    return () => {
      active = false;
    };
  }, [selectedRestaurant, menuSearch, category]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = itemCount && cartRestaurant ? cartRestaurant.delivery_fee : 0;
  const total = subtotal + deliveryFee;
  const cuisines = ["All cuisines", ...new Set(restaurants.map((restaurant) => restaurant.cuisine))];

  function addItem(item) {
    setCartRestaurant((current) => current ?? selectedRestaurant);
    setCart((current) => {
      const existing = current[item.id];
      return {
        ...current,
        [item.id]: { ...item, quantity: (existing?.quantity ?? 0) + 1 },
      };
    });
  }

  function updateQuantity(itemId, change) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[itemId]?.quantity ?? 0) + change;
      if (quantity <= 0) delete next[itemId];
      else next[itemId] = { ...next[itemId], quantity };
      return next;
    });
  }

  function chooseRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
    setMenuSearch("");
    setCategory("All");
    setError("");
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      setCart({});
    }
    setCartRestaurant(restaurant);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function placeOrder() {
    if (!itemCount) return;
    window.alert(`Order placed! Your total is ${money.format(total)}.`);
    setCart({});
    setCartRestaurant(null);
    setCartOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setSelectedRestaurant(null)} aria-label="Gather home">
          <span className="brand-mark">g</span>
          <span>gather<span className="brand-period">.</span></span>
        </a>
        <div className="delivery-location">
          <span className="location-dot" />
          <span>Delivering to</span>
          <strong>Brooklyn, NY</strong>
          <span className="chevron">⌄</span>
        </div>
        <button className="cart-button" onClick={() => setCartOpen(true)}>
          <span className="bag-icon">▱</span>
          <span>Your order</span>
          <span className="cart-count">{itemCount}</span>
        </button>
      </header>

      <main>
        {!selectedRestaurant ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">GOOD FOOD, GOOD MOOD</p>
                <h1>A little joy,<br />right to your door.</h1>
                <p className="hero-subtitle">The neighborhood's best, brought to your table.</p>
                <div className="hero-proof"><span>✳</span> Thoughtfully picked. Always delicious.</div>
              </div>
              <div className="hero-photo" role="img" aria-label="A colorful table of fresh food">
                <div className="photo-sticker">made with<br /><strong>love</strong> & a<br />little extra<br />olive oil <span>♡</span></div>
              </div>
            </section>

            <section className="browse-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR NEXT FAVORITE</p>
                  <h2>Restaurants nearby</h2>
                </div>
                <span className="results-label">{restaurants.length} lovely places</span>
              </div>
              <div className="browse-controls">
                <label className="search-field">
                  <span aria-hidden="true">⌕</span>
                  <input
                    aria-label="Search restaurants"
                    placeholder="Search restaurants or cuisines"
                    value={restaurantSearch}
                    onChange={(event) => setRestaurantSearch(event.target.value)}
                  />
                </label>
                <label className="select-wrap">
                  <span className="sr-only">Filter by cuisine</span>
                  <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
                    {cuisines.map((choice) => <option key={choice}>{choice}</option>)}
                  </select>
                  <span className="select-arrow">⌄</span>
                </label>
              </div>

              {error && <div className="error-message" role="alert">{error}</div>}
              {loading ? (
                <div className="loading-state">Finding something delicious…</div>
              ) : restaurants.length ? (
                <div className="restaurant-grid">
                  {restaurants.map((restaurant) => (
                    <button
                      className="restaurant-card"
                      key={restaurant.id}
                      onClick={() => chooseRestaurant(restaurant)}
                    >
                      <div className="restaurant-image-wrap">
                        <img src={restaurant.image} alt="" className="restaurant-image" />
                        <span className="menu-count">{restaurant.menu_count} dishes</span>
                      </div>
                      <div className="restaurant-info">
                        <div className="restaurant-title-row">
                          <h3>{restaurant.name}</h3>
                          <span className="rating">★ {restaurant.rating.toFixed(1)}</span>
                        </div>
                        <p>{restaurant.cuisine} <span>·</span> {restaurant.delivery_minutes} min</p>
                        <div className="restaurant-foot">
                          <span>{restaurant.delivery_fee === 0 ? "Free delivery" : `${money.format(restaurant.delivery_fee)} delivery`}</span>
                          <span className="card-arrow">↗</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><span>⌕</span><h3>No places found</h3><p>Try another name or cuisine.</p></div>
              )}
            </section>
          </>
        ) : (
          <section className="menu-page">
            <button className="back-link" onClick={() => setSelectedRestaurant(null)}>← All restaurants</button>
            <div className="menu-banner" style={{ backgroundColor: selectedRestaurant.accent }}>
              <div className="menu-banner-copy">
                <p className="eyebrow">{selectedRestaurant.cuisine.toUpperCase()} · NEIGHBORHOOD FAVORITE</p>
                <h1>{selectedRestaurant.name}</h1>
                <p className="banner-meta">★ {selectedRestaurant.rating.toFixed(1)} <span>·</span> {selectedRestaurant.delivery_minutes} min <span>·</span> {selectedRestaurant.delivery_fee === 0 ? "Free delivery" : `${money.format(selectedRestaurant.delivery_fee)} delivery`}</p>
              </div>
              <img src={selectedRestaurant.image} alt="" />
            </div>
            <div className="menu-heading">
              <div>
                <p className="eyebrow">MADE FRESH FOR YOU</p>
                <h2>On the menu</h2>
              </div>
              <label className="search-field menu-search">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Search menu"
                  placeholder="Find a dish"
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                />
              </label>
            </div>
            <div className="category-tabs" aria-label="Filter menu by category">
              {categories.map((choice) => (
                <button
                  className={category === choice ? "category-tab active" : "category-tab"}
                  key={choice}
                  onClick={() => setCategory(choice)}
                >{choice}</button>
              ))}
            </div>
            {error && <div className="error-message" role="alert">{error}</div>}
            <div className="menu-grid">
              {menuItems.map((item) => (
                <article className="menu-item" key={item.id}>
                  <img src={item.image} alt="" />
                  <div className="menu-item-copy">
                    <div className="dish-name-row">
                      <h3>{item.name}</h3>
                      {item.vegetarian ? <span className="veg-indicator" aria-label="Vegetarian" title="Vegetarian" /> : null}
                    </div>
                    <p>{item.description}</p>
                    <div className="dish-foot">
                      <strong>{money.format(item.price)}</strong>
                      <button className="add-button" onClick={() => addItem(item)} aria-label={`Add ${item.name} to order`}>+</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!menuItems.length && !error && <div className="empty-state"><span>⌕</span><h3>No dishes found</h3><p>Try another search or category.</p></div>}
          </section>
        )}
      </main>

      {itemCount > 0 && !cartOpen && (
        <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
          <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
          <span>View order</span>
          <strong>{money.format(total)}　→</strong>
        </button>
      )}

      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(event) => event.stopPropagation()} aria-label="Your order">
            <div className="drawer-heading">
              <div><p className="eyebrow">THE GOOD STUFF</p><h2>Your order</h2></div>
              <button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close order">×</button>
            </div>
            {cartItems.length ? (
              <>
                {selectedRestaurant && <p className="cart-restaurant">From {selectedRestaurant.name}</p>}
                <div className="cart-lines">
                  {cartItems.map((item) => (
                    <div className="cart-line" key={item.id}>
                      <div className="cart-line-info"><strong>{item.name}</strong><span>{money.format(item.price)} each</span></div>
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="totals">
                  <div><span>Subtotal</span><span>{money.format(subtotal)}</span></div>
                  <div><span>Delivery</span><span>{deliveryFee ? money.format(deliveryFee) : "Free"}</span></div>
                  <div className="total-line"><strong>Total</strong><strong>{money.format(total)}</strong></div>
                </div>
                <button className="checkout-button" onClick={placeOrder}>Place order <span>·</span> {money.format(total)} <span>→</span></button>
                <p className="checkout-note">A little deliciousness is on its way.</p>
              </>
            ) : (
              <div className="empty-cart"><span>♡</span><h3>Your order is waiting</h3><p>Add something delicious from a restaurant menu.</p><button onClick={() => { setCartOpen(false); setSelectedRestaurant(null); }}>Explore restaurants</button></div>
            )}
          </aside>
        </div>
      )}

      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">g</span><span>gather<span className="brand-period">.</span></span></a><span>Good food makes a good day.</span><span>Made for your neighborhood ♡</span></footer>
    </div>
  );
}

export default App;
