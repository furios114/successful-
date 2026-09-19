/* ========== STORE ========== */
const store = {
  get cart() { return JSON.parse(localStorage.getItem("cart")) || []; },
  set cart(v) { localStorage.setItem("cart", JSON.stringify(v)); updateBadges(); },
  get favs() { return JSON.parse(localStorage.getItem("favs")) || []; },
  set favs(v) { localStorage.setItem("favs", JSON.stringify(v)); updateBadges(); }
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmt = n => n.toLocaleString("ru-RU") + " ₽";

/* ========== BADGES ========== */
function updateBadges() {
  const c = store.cart.reduce((s, i) => s + i.qty, 0);
  const f = store.favs.length;
  $$("[data-cart-count]").forEach(el => { el.textContent = c; el.classList.toggle("show", c > 0); });
  $$("[data-fav-count]").forEach(el => { el.textContent = f; el.classList.toggle("show", f > 0); });
}

/* ========== CART ========== */
function addToCart(id, size, qty = 1) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const isDaily = isDailyProduct(id);
  const finalPrice = isDaily ? Math.round(p.price * (100 - DAILY_DISCOUNT) / 100) : p.price;

  const cart = store.cart;
  const ex = cart.find(i => i.id === id && i.size === size);
  if (ex) {
    ex.qty += qty;
    ex.price = finalPrice;
    ex.isDaily = isDaily;
    ex.name = p.name + (isDaily ? " (скидка дня)" : "");
  } else {
    cart.push({
      id,
      name: p.name + (isDaily ? " (скидка дня)" : ""),
      price: finalPrice,
      originalPrice: p.price,
      image: p.images[0],
      size,
      qty,
      isDaily
    });
  }
  store.cart = cart;
  openDrawer();
  renderCartDrawer();
}

function removeFromCart(i) { const c = store.cart; c.splice(i, 1); store.cart = c; renderCartDrawer(); }
function changeQty(i, d) { const c = store.cart; c[i].qty += d; if (c[i].qty <= 0) c.splice(i, 1); store.cart = c; renderCartDrawer(); }
function cartTotal() { return store.cart.reduce((s, i) => s + i.price * i.qty, 0); }

/* ========== FAVS ========== */
function toggleFav(id) {
  const f = store.favs;
  const i = f.indexOf(id);
  if (i > -1) f.splice(i, 1); else f.push(id);
  store.favs = f;
  return f.includes(id);
}
function isFav(id) { return store.favs.includes(id); }

/* ========== TELEGRAM ========== */
function orderViaTelegram(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
  window.open(`https://t.me/${TG_USERNAME}?text=${encodeURIComponent(text)}`, "_blank");
}

/* ========== CARD ========== */
function productCard(p) {
  const fav = isFav(p.id);
  const isDaily = isDailyProduct(p.id);
  const finalPrice = isDaily ? Math.round(p.price * (100 - DAILY_DISCOUNT) / 100) : p.price;

  return `
    <article class="card ${isDaily ? "daily" : ""}" data-card>
      ${isDaily ? `<div class="daily-badge">СКИДКА ДНЯ −${DAILY_DISCOUNT}%</div>` : ""}
      <button class="fav-btn ${fav ? "active" : ""}" data-fav="${p.id}" aria-label="В избранное">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.3 2.6 5 6 5c2 0 3.4 1 4 2.2C10.6 6 12 5 14 5c3.4 0 5.1 3.3 3.6 6.7C19.5 16.3 12 21 12 21z"/></svg>
      </button>
      <a href="product.html?id=${p.id}" class="card-img">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
      </a>
      <div class="card-body">
        <div class="card-cat">${p.categoryName || p.category}</div>
        <h3 class="card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="card-price">
          ${isDaily ? `<span class="old-price">${fmt(p.price)}</span>` : ""}
          <span class="${isDaily ? "new-price" : ""}">${fmt(finalPrice)}</span>
        </div>
      </div>
      <button class="btn btn-primary" data-quick-add="${p.id}"><span>Купить</span></button>
    </article>`;
}

/* ========== RENDER ========== */
function renderGrid(container, list) {
  if (!list.length) { container.innerHTML = `<p class="empty">Ничего не найдено</p>`; return; }
  container.innerHTML = list.map(productCard).join("");
  observeCards();
}
function renderFavorites() {
  const wrap = $("#fav-grid");
  if (!wrap) return;
  const list = products.filter(p => isFav(p.id));
  renderGrid(wrap, list);
  const empty = $("#fav-empty");
  if (empty) empty.style.display = list.length ? "none" : "block";
}
function observeCards() {
  const cards = document.querySelectorAll("[data-card]:not(.visible)");
  if (!("IntersectionObserver" in window)) { cards.forEach(c => c.classList.add("visible")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), i * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(c => io.observe(c));
}

/* ========== GLOBAL CLICK ========== */
document.addEventListener("click", e => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) {
    e.preventDefault();
    const active = toggleFav(+favBtn.dataset.fav);
    favBtn.classList.toggle("active", active);
    if (document.body.dataset.page === "favorites") renderFavorites();
    if (document.body.dataset.page === "home") renderDailyBanner();
    return;
  }
  const quick = e.target.closest("[data-quick-add]");
  if (quick) {
    e.preventDefault();
    const id = +quick.dataset.quickAdd;
    const p = products.find(x => x.id === id);
    if (p.sizes.length > 1) location.href = `product.html?id=${id}`;
    else addToCart(id, p.sizes[0]);
  }
});

/* ========== DRAWER ========== */
function openDrawer() {
  $("#cart-drawer")?.classList.add("open");
  $("#drawer-overlay")?.classList.add("open");
}
function closeDrawer() {
  $("#cart-drawer")?.classList.remove("open");
  $("#drawer-overlay")?.classList.remove("open");
}
function renderCartDrawer() {
  const body = $("#drawer-body");
  const foot = $("#drawer-foot");
  if (!body) return;
  const cart = store.cart;
  if (!cart.length) {
    body.innerHTML = `<div class="empty-cart"><p>Корзина пуста</p></div>`;
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = cart.map((i, idx) => `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}">
      <div class="cart-item-info">
        <h3>${i.name}</h3>
        <span class="cart-size">Размер: ${i.size}</span>
        <div class="cart-price">${fmt(i.price)}</div>
        <div class="qty">
          <button data-minus="${idx}">−</button>
          <span>${i.qty}</span>
          <button data-plus="${idx}">+</button>
        </div>
      </div>
      <button class="remove" data-remove="${idx}">✕</button>
    </div>`).join("");
  foot.innerHTML = `
    <div class="cart-total"><span>Итого</span><strong>${fmt(cartTotal())}</strong></div>
    <button class="btn btn-primary btn-lg" id="checkout"><span>Оформить в Telegram</span></button>`;
  $$("[data-plus]").forEach(b => b.onclick = () => changeQty(+b.dataset.plus, 1));
  $$("[data-minus]").forEach(b => b.onclick = () => changeQty(+b.dataset.minus, -1));
  $$("[data-remove]").forEach(b => b.onclick = () => removeFromCart(+b.dataset.remove));
  $("#checkout")?.addEventListener("click", () => {
    const text = [
      "🛍 ЗАКАЗ — SUCCESSFUL CLUB", "",
      ...cart.map(i => `• ${i.name} (${i.size}) × ${i.qty} — ${fmt(i.price * i.qty)}`),
      "", `💰 Итого: ${fmt(cartTotal())}`, "",
      "Подтвердите заказ, и я вышлю реквизиты."
    ].join("\n");
    orderViaTelegram(text);
  });
}

/* ========== DAILY BANNER ========== */
function renderDailyBanner() {
  const wrap = $("#daily-banner");
  if (!wrap) return;
  const p = getDailyProduct();
  if (!p) { wrap.style.display = "none"; return; }
  const fav = isFav(p.id);
  wrap.innerHTML = `
    <div class="daily-banner">
      <div class="daily-banner-left">
        <div class="daily-label">🔥 СКИДКА ДНЯ</div>
        <h2 class="daily-title">${p.name}</h2>
        <p class="daily-desc">Только сегодня − ${DAILY_DISCOUNT}% на этот товар. Завтра будет другой.</p>
        <div class="daily-prices">
          <span class="old-price">${fmt(p.originalPrice)}</span>
          <span class="new-price">${fmt(p.price)}</span>
          <span class="discount-chip">−${DAILY_DISCOUNT}%</span>
        </div>
        <div class="daily-actions">
          <a href="product.html?id=${p.id}" class="btn btn-primary"><span>Забрать со скидкой</span></a>
          <button class="btn" data-fav="${p.id}"><span>${fav ? "♥ В избранном" : "♡ В избранное"}</span></button>
        </div>
      </div>
      <a href="product.html?id=${p.id}" class="daily-banner-img">
        <img src="${p.images[0]}" alt="${p.name}">
      </a>
    </div>`;
}

/* ========== CATALOG ========== */
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
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (sort.value === "asc") list.sort((a, b) => a.price - b.price);
    if (sort.value === "desc") list.sort((a, b) => b.price - a.price);
    if (sort.value === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    renderGrid(grid, list);
    const c = $("#result-count"); if (c) c.textContent = list.length;
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

/* ========== PRODUCT PAGE ========== */
function renderProduct() {
  const id = +new URLSearchParams(location.search).get("id");
  const p = products.find(x => x.id === id);
  const wrap = $("#product-wrap");
  if (!p) { wrap.innerHTML = "<p class='empty'>Товар не найден</p>"; return; }
  const fav = isFav(p.id);
  const isDaily = isDailyProduct(p.id);
  const finalPrice = isDaily ? Math.round(p.price * (100 - DAILY_DISCOUNT) / 100) : p.price;

  wrap.innerHTML = `
    <div class="product">
      <div class="product-gallery">
        <div class="product-main-img">
          <img id="main-img" src="${p.images[0]}" alt="${p.name}">
          ${isDaily ? `<div class="daily-badge">СКИДКА ДНЯ −${DAILY_DISCOUNT}%</div>` : ""}
          <button class="fav-btn large ${fav ? "active" : ""}" data-fav="${p.id}">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.3 2.6 5 6 5c2 0 3.4 1 4 2.2C10.6 6 12 5 14 5c3.4 0 5.1 3.3 3.6 6.7C19.5 16.3 12 21 12 21z"/></svg>
          </button>
          ${p.images.length > 1 ? `
            <button class="gallery-arrow prev" id="img-prev" aria-label="Назад">
              <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="gallery-arrow next" id="img-next" aria-label="Вперёд">
              <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="gallery-counter"><span id="img-current">1</span> / ${p.images.length}</div>
          ` : ""}
        </div>
        <div class="thumbs">
          ${p.images.map((img, i) => `<img src="${img}" class="thumb ${i===0?'active':''}" data-idx="${i}">`).join("")}
        </div>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.categoryName || p.category}</div>
        <h1>${p.name}</h1>
        <div class="product-price">
          ${isDaily ? `<span class="old-price">${fmt(p.price)}</span>` : ""}
          <span class="${isDaily ? "new-price" : ""}">${fmt(finalPrice)}</span>
        </div>
        <p class="product-desc">${p.description}</p>
        <div class="sizes">
          <span class="label">Размер</span>
          <div class="size-list">
            ${p.sizes.map((s, i) => `<button class="size-btn ${i===0?'active':''}" data-size="${s}">${s}</button>`).join("")}
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="buy-btn"><span>Купить в Telegram</span></button>
        <button class="btn btn-lg" id="add-btn"><span>В корзину</span></button>
      </div>
    </div>`;

  let currentIdx = 0;
  const mainImg = $("#main-img");
  const counter = $("#img-current");

  function setImage(idx) {
    currentIdx = (idx + p.images.length) % p.images.length;
    mainImg.src = p.images[currentIdx];
    if (counter) counter.textContent = currentIdx + 1;
    $$(".thumb").forEach((t, i) => t.classList.toggle("active", i === currentIdx));
  }

  $("#img-prev")?.addEventListener("click", () => setImage(currentIdx - 1));
  $("#img-next")?.addEventListener("click", () => setImage(currentIdx + 1));
  $$(".thumb").forEach(t => t.addEventListener("click", () => setImage(+t.dataset.idx)));

  let touchStartX = 0;
  mainImg?.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  mainImg?.addEventListener("touchend", e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) setImage(diff > 0 ? currentIdx + 1 : currentIdx - 1);
  });

  let selectedSize = p.sizes[0];
  $$(".size-btn").forEach(b => b.addEventListener("click", () => {
    $$(".size-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    selectedSize = b.dataset.size;
  }));
  $("#add-btn").addEventListener("click", () => addToCart(p.id, selectedSize));
  $("#buy-btn").addEventListener("click", () => {
    const text = [
      "🛍 ЗАКАЗ — SUCCESSFUL CLUB", "",
      `📦 Товар: ${p.name}${isDaily ? " 🔥 СКИДКА ДНЯ −10%" : ""}`,
      `📏 Размер: ${selectedSize}`,
      isDaily ? `💰 Цена: ${fmt(finalPrice)} (было ${fmt(p.price)})` : `💰 Цена: ${fmt(p.price)}`,
      "", "Подтвердите заказ."
    ].join("\n");
    orderViaTelegram(text);
  });
}

/* ========== CURSOR ========== */
function initCursor() {
  if (window.matchMedia("(hover:none)").matches) return;
  const c = document.createElement("div");
  c.className = "cursor";
  document.body.appendChild(c);
  document.addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; });
  document.addEventListener("mouseover", e => { if (e.target.closest("a,button,.card,.btn,.fav-btn,.gallery-arrow")) c.classList.add("hover"); });
  document.addEventListener("mouseout", e => { if (e.target.closest("a,button,.card,.btn,.fav-btn,.gallery-arrow")) c.classList.remove("hover"); });
}

/* ========== HEADER SCROLL ========== */
function initHeaderScroll() {
  const h = $(".header");
  if (!h) return;
  const onScroll = () => h.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ========== PRELOADER ========== */
function initPreloader() {
  const pre = $(".preloader");
  if (!pre) return;
  window.addEventListener("load", () => setTimeout(() => pre.classList.add("hide"), 400));
}

/* ========== BURGER ========== */
function initBurger() {
  const b = $("#burger"), n = $("#nav");
  if (!b || !n) return;
  b.addEventListener("click", () => { b.classList.toggle("open"); n.classList.toggle("open"); });
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", () => {
  updateBadges();
  renderCartDrawer();
  initCursor();
  initHeaderScroll();
  initPreloader();
  initBurger();

  const page = document.body.dataset.page;
  if (page === "catalog") initCatalog();
  if (page === "favorites") renderFavorites();
  if (page === "product") renderProduct();
  if (page === "home") renderDailyBanner();

  $$("[data-open-cart]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); openDrawer(); renderCartDrawer(); }));
  $("#drawer-close")?.addEventListener("click", closeDrawer);
  $("#drawer-overlay")?.addEventListener("click", closeDrawer);

  const hits = $("#hits-grid");
  if (hits) renderGrid(hits, products.slice(0, 8));
});