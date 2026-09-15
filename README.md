# Successful Club — интернет-магазин

## Как добавить новый товар

1. Закинь PNG-картинки в папку `images/`.
   Например: `hoodie-3.png`, `hoodie-4.png`.

2. Открой `js/products.js` и добавь объект в массив `products`:

```js
{
  id: 2,                                   // уникальный номер
  name: "Название товара",
  price: 3990,
  category: "hoodies",                     // hoodies / tshirts / pants / accessories
  images: ["images/hoodie-3.png"],
  sizes: ["M", "L", "XL", "2XL"],
  description: "Описание товара."
}