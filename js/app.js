/* ====== ХРАНИЛИЩЕ ====== */
const store = {
  get cart() { return JSON.parse(localStorage.getItem("cart")) || []; },
  set cart(v) { localStorage.setItem("cart", JSON.stringify(v)); updateBadges(); },
  get favs() { return JSON.parse(localStorage.getItem("favs")) || []; },
  set favs(v) { localStorage.setItem("favs", JSON.stringify(v)); updateBadges(); }
};

/* ====== УТИЛИТЫ ====== */
const fmt = n => n.toLocaleString("ru-RU") + " ₽";
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function updateBadges() {
  const c = store.cart.reduce((s, i) => s + i.qty, 0);
  const f = store.favs.length;
  $$("[data-cart-count]").forEach(el => el.textContent = c);
  $$("[data-fav-count]").forEach(el => el.textContent = f);
}

/* ====== КОРЗИНА ====== */
function addToCart(id, size, qty = 1) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const cart = store.cart;
  const ex = cart.find(i => i.id === id && i.size === size);
  if (ex) ex.qty += qty;
  else cart.push({ id, name: p.name, price: p.price, image: p.images[0], size, qty });
  store.cart = cart;
}

function removeFromCart(index) {
  const cart = store.cart;
  cart.splice(index, 1);
  store.cart = cart;
  renderCart();
}

function changeQty(index, delta) {
  const cart = store.cart;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  store.cart = cart;
  renderCart();
}

function cartTotal() {
  return store.cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/* ====== ИЗБРАННОЕ ====== */
function toggleFav(id) {
  const favs = store.favs;
  const i = favs.indexOf(id);
  if (i > -1) favs.splice(i, 1);
  else favs.push(id);
  store.favs = favs;
  return favs.includes(id);
}
function isFav(id) { return store.favs.includes(id); }

/* ====== TELEGRAM-ЗАКАЗ ====== */
function orderViaTelegram(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
  window.open(`https://t.me/${TG_USERNAME}?text=${encodeURIComponent(text)}`, "_blank");
}

/* ====== КАРТОЧКА ТОВАРА ====== */
function productCard(p) {
  const fav = isFav(p.id);
  return `
    <article class="card">
      <button class="fav-btn ${fav ? "active" : ""}" data-fav="${p.id}" aria-label="В избранное">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.3 2.6 5 6 5c2 0 3.4 1 4 2.2C10.6 6 12 5 14 5c3.4 0 5.1 3.3 3.6 6.7C19.5 16.3 12 21 12 21z"/></svg>
      </button>
      <a href="product.html?id=${p.id}" class="card-img">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
      </a>
      <div class="card-body">
        <h3 class="card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="card-price">${fmt(p.price)}</div>
        <button class="btn btn-primary" data-quick-add="${p.id}">Купить</button>
      </div>
    </article>`;
}

/* ====== СОБЫТИЯ (глобальные) ====== */
document.addEventListener("click", e => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) {
    e.preventDefault();
    const id = +favBtn.dataset.fav;
    const active = toggleFav(id);
    favBtn.classList.toggle("active", active);
    if (document.body.dataset.page === "favorites") renderFavorites();
    if (document.body.dataset.page === "product") {
      const p = products.find(x => x.id === id);
      if (p) renderProduct();
    }
    return;
  }

  const quick = e.target.closest("[data-quick-add]");
  if (quick) {
    const id = +quick.dataset.quickAdd;
    const p = products.find(x => x.id === id);
    if (p.sizes.length > 1) {
      location.href = `product.html?id=${id}`;
    } else {
      addToCart(id, p.sizes[0]);
      quick.textContent = "Добавлено ✓";
      setTimeout(() => quick.textContent = "Купить", 1200);
    }
  }
});

/* ====== ОБЩИЕ РЕНДЕРЫ ====== */
function renderGrid(container, list) {
  if (!list.length) {
    container.innerHTML = `<p class="empty">Ничего не найдено</p>`;
    return;
  }
  container.innerHTML = list.map(productCard).join("");
}

function renderFavorites() {
  const wrap = $("#fav-grid");
  if (!wrap) return;
  const list = products.filter(p => isFav(p.id));
  renderGrid(wrap, list);
  const empty = $("#fav-empty");
  if (empty) empty.style.display = list.length ? "none" : "block";
}

/* ====== INIT ====== */
document.addEventListener("DOMContentLoaded", () => {
  updateBadges();
  const page = document.body.dataset.page;

  if (page === "catalog") initCatalog();
  if (page === "favorites") renderFavorites();
  if (page === "cart") renderCart();
  if (page === "product") renderProduct();
});

/* ====== КАТАЛОГ + ПОИСК ====== */
function initCatalog() {
  const grid = $("#catalog-grid");
  const search = $("#search");
  const sort = $("#sort");
  const cats = $$("[data-cat]");

  let activeCat = "all";
  let query = "";

  function apply() {
    let list = [...products];
    if (activeCat !== "all") list = list.filter(p => p.category === activeCat);
    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (sort.value === "asc") list.sort((a, b) => a.price - b.price);
    if (sort.value === "desc") list.sort((a, b) => b.price - a.price);
    if (sort.value === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    renderGrid(grid, list);
    const count = $("#result-count");
    if (count) count.textContent = list.length;
  }

  search?.addEventListener("input", e => { query = e.target.value; apply(); });
  sort?.addEventListener("change", apply);
  cats.forEach(btn => btn.addEventListener("click", () => {
    cats.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    apply();
  }));

  apply();
}

/* ====== КАРТОЧКА ТОВАРА ====== */
function renderProduct() {
  const id = +new URLSearchParams(location.search).get("id");
  const p = products.find(x => x.id === id);
  const wrap = $("#product-wrap");
  if (!p) { wrap.innerHTML = "<p>Товар не найден</p>"; return; }

  const fav = isFav(p.id);

  wrap.innerHTML = `
    <div class="product">
      <div class="product-gallery">
        <div class="product-main-img">
          <img id="main-img" src="${p.images[0]}" alt="${p.name}">
          <button class="fav-btn large ${fav ? "active" : ""}" data-fav="${p.id}" aria-label="В избранное">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.3 2.6 5 6 5c2 0 3.4 1 4 2.2C10.6 6 12 5 14 5c3.4 0 5.1 3.3 3.6 6.7C19.5 16.3 12 21 12 21z"/></svg>
          </button>
        </div>
        <div class="thumbs">
          ${p.images.map((img, i) => `<img src="${img}" class="thumb ${i===0?'active':''}" data-src="${img}">`).join("")}
        </div>
      </div>
      <div class="product-info">
        <h1>${p.name}</h1>
        <div class="product-price">${fmt(p.price)}</div>
        <p class="product-desc">${p.description}</p>
        <div class="sizes">
          <span class="label">Размер:</span>
          <div class="size-list">
            ${p.sizes.map((s, i) => `<button class="size-btn ${i===0?'active':''}" data-size="${s}">${s}</button>`).join("")}
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="buy-btn">Купить в Telegram</button>
        <button class="btn btn-outline btn-lg" id="add-btn">Добавить в корзину</button>
      </div>
    </div>`;

  let selectedSize = p.sizes[0];
  $$(".size-btn").forEach(b => b.addEventListener("click", () => {
    $$(".size-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    selectedSize = b.dataset.size;
  }));

  $$(".thumb").forEach(t => t.addEventListener("click", () => {
    $("#main-img").src = t.dataset.src;
    $$(".thumb").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
  }));

  $("#add-btn").addEventListener("click", () => {
    addToCart(p.id, selectedSize);
    $("#add-btn").textContent = "Добавлено ✓";
    setTimeout(() => $("#add-btn").textContent = "Добавить в корзину", 1200);
  });

  $("#buy-btn").addEventListener("click", () => {
    const text = [
      "🛍 ЗАКАЗ — SUCCESSFUL CLUB", "",
      `📦 Товар: ${p.name}`,
      `📏 Размер: ${selectedSize}`,
      `💰 Цена: ${fmt(p.price)}`, "",
      "Подтвердите заказ, и я вышлю реквизиты для оплаты."
    ].join("\n");
    orderViaTelegram(text);
  });
}

/* ====== КОРЗИНА ====== */
function renderCart() {
  const wrap = $("#cart-wrap");
  if (!wrap) return;
  const cart = store.cart;
  if (!cart.length) {
    wrap.innerHTML = `<div class="empty-cart">
      <p>Корзина пуста</p>
      <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
    </div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="cart-list">
      ${cart.map((i, idx) => `
        <div class="cart-item">
          <img src="${i.image}" alt="${i.name}">
          <div class="cart-item-info">
            <h3>${i.name}</h3>
            <span class="cart-size">Размер: ${i.size}</span>
            <span class="cart-price">${fmt(i.price)}</span>
          </div>
          <div class="qty">
            <button data-minus="${idx}">−</button>
            <span>${i.qty}</span>
            <button data-plus="${idx}">+</button>
          </div>
          <button class="remove" data-remove="${idx}" aria-label="Удалить">✕</button>
        </div>`).join("")}
    </div>
    <div class="cart-total">
      <span>Итого:</span>
      <strong>${fmt(cartTotal())}</strong>
    </div>
    <button class="btn btn-primary btn-lg" id="checkout">Оформить заказ в Telegram</button>`;

  $$("[data-plus]").forEach(b => b.onclick = () => changeQty(+b.dataset.plus, 1));
  $$("[data-minus]").forEach(b => b.onclick = () => changeQty(+b.dataset.minus, -1));
  $$("[data-remove]").forEach(b => b.onclick = () => removeFromCart(+b.dataset.remove));

  $("#checkout").addEventListener("click", () => {
    const text = [
      "🛍 ЗАКАЗ — SUCCESSFUL CLUB", "",
      ...cart.map(i => `• ${i.name} (${i.size}) × ${i.qty} — ${fmt(i.price * i.qty)}`),
      "", `💰 Итого: ${fmt(cartTotal())}`, "",
      "Подтвердите заказ, и я вышлю реквизиты для оплаты."
    ].join("\n");
    orderViaTelegram(text);
  });
}