const TG_USERNAME = "Dr1lly52";

/* ====== СКИДКА ДНЯ ====== */
const DAILY_DISCOUNT = 10;

function getDailyDiscountId() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const x = Math.sin(seed) * 10000;
  const rnd = x - Math.floor(x);
  return Math.floor(rnd * products.length);
}

function getDailyProduct() {
  if (!products.length) return null;
  const idx = getDailyDiscountId();
  const p = products[idx];
  return {
    ...p,
    originalPrice: p.price,
    price: Math.round(p.price * (100 - DAILY_DISCOUNT) / 100)
  };
}

function isDailyProduct(id) {
  const daily = getDailyProduct();
  return daily && daily.id === id;
}

function getProductPrice(id) {
  const p = products.find(x => x.id === id);
  if (!p) return 0;
  if (isDailyProduct(id)) return Math.round(p.price * (100 - DAILY_DISCOUNT) / 100);
  return p.price;
}

/* ====== ТОВАРЫ ====== */
const products = [
  {
    id: 1,
    name: "Худи Successful Club",
    price: 3990,
    category: "hoodies",
    categoryName: "Худи",
    images: ["hoodie-1.png", "hoodie-2.png"],
    sizes: ["M", "L", "XL", "2XL"],
    description: "Первый и неповторимый худак нового поколения. 50% хлопок, 50% полиэстер — сочетание максимально удерживает форму и позволяет забыть про катышки после стирки. Плотность 350 г/м² — комфортно осенью, весной и летними вечерами. Зимой рекомендуем носить сверху курточку, чтобы не заболеть."
  },
  {
    id: 2,
    name: "Штаны Successful Club 001",
    price: 3990,
    category: "pants",
    categoryName: "Штаны",
    images: ["pants-1.png", "pants-2.png"],
    sizes: ["M", "L", "XL", "2XL"],
    description: "Уникальный принт сзади выделит вас среди серой массы. Состав ткани: 50% хлопок, 50% полиэстер — сочетание максимально сохраняет форму штанов и позволяет забыть про катышки после стирки. Плотность 350 г/м² — комфортно осенью, весной, летом, зимой до −10°."
  }
  {
    id: 3,
    name: "Футболка Successful Club — Purple Vibe",
    price: 2490,
    category: "tshirts",
    categoryName: "Футболки",
    images: ["tshirt-1.png", "tshirt-2.png"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    description: "У каждого из нас есть свой невидимый штрихкод. В нем зашифрованы не цифры на ценнике, а реальная стоимость наших решений, пройденных испытаний и поступков. Successful Club — это комьюнити тех, кто сам определяет свою ценность, а не ждет оценки со стороны. Лимитированный дроп в глубоком фиолетовом цвете. Тираж строго ограничен и перевыпускаться не будет. Крой: свободный оверсайз (unisex), правильная геометрия посадки со спущенным плечом. Материал: 100% премиальный хлопок высокой плотности — 240 г/м². Держит форму, не деформируется после стирок, дышит и ощущается монументально на теле. Принт: износостойкая печать в эксклюзивном фиолетовом оттенке. Цвет: чистый белый (True White). Твои поступки — твой настоящий код. Вступай в клуб."
  }
];