import Database from "better-sqlite3";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const directory = dirname(fileURLToPath(import.meta.url));
const dataDirectory = resolve(directory, "../data");
mkdirSync(dataDirectory, { recursive: true });

const db = new Database(resolve(dataDirectory, "food-delivery.sqlite"));
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    rating REAL NOT NULL,
    delivery_minutes INTEGER NOT NULL,
    delivery_fee REAL NOT NULL,
    image TEXT NOT NULL,
    accent TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    vegetarian INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL
  );
`);

const restaurantCount = db.prepare("SELECT COUNT(*) AS count FROM restaurants").get().count;

if (restaurantCount === 0) {
  const seed = db.transaction(() => {
    const addRestaurant = db.prepare(`
      INSERT INTO restaurants (id, name, cuisine, rating, delivery_minutes, delivery_fee, image, accent)
      VALUES (@id, @name, @cuisine, @rating, @delivery_minutes, @delivery_fee, @image, @accent)
    `);
    const addItem = db.prepare(`
      INSERT INTO menu_items (id, restaurant_id, name, description, category, price, vegetarian, image)
      VALUES (@id, @restaurant_id, @name, @description, @category, @price, @vegetarian, @image)
    `);

    [
      {
        id: 1,
        name: "Saffron & Stone",
        cuisine: "Indian",
        rating: 4.8,
        delivery_minutes: 25,
        delivery_fee: 2.5,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=85",
        accent: "#f3dfbd",
      },
      {
        id: 2,
        name: "Little Napoli",
        cuisine: "Italian",
        rating: 4.7,
        delivery_minutes: 30,
        delivery_fee: 1.99,
        image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85",
        accent: "#e8d7c9",
      },
      {
        id: 3,
        name: "Greenhouse Kitchen",
        cuisine: "Healthy",
        rating: 4.9,
        delivery_minutes: 20,
        delivery_fee: 0,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85",
        accent: "#dce6d1",
      },
      {
        id: 4,
        name: "Umami House",
        cuisine: "Japanese",
        rating: 4.6,
        delivery_minutes: 35,
        delivery_fee: 2.25,
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=85",
        accent: "#eed8d1",
      },
    ].forEach((restaurant) => addRestaurant.run(restaurant));

    [
      [101, 1, "Butter chicken", "Slow-cooked tomato, cream & warming spices", "Mains", 16.5, 0, "photo-1603894584373-5ac82b2ae398"],
      [102, 1, "Paneer tikka", "Charred paneer, peppers & mint chutney", "Mains", 14, 1, "photo-1567188040759-fb8a883dc6d8"],
      [103, 1, "Garlic naan", "Tandoor-baked flatbread with garlic butter", "Sides", 4.5, 1, "photo-1613292443284-8d8d8bfbfb16"],
      [104, 1, "Mango lassi", "Chilled yoghurt blended with sweet mango", "Drinks", 5, 1, "photo-1541658016709-82535e94bc69"],
      [201, 2, "Margherita pizza", "San Marzano tomato, mozzarella & basil", "Mains", 15, 1, "photo-1579751626657-72bc17010498"],
      [202, 2, "Pappardelle ragu", "Fresh ribbon pasta with slow-braised beef", "Mains", 19, 0, "photo-1473093295043-cdd812d0e601"],
      [203, 2, "Burrata salad", "Creamy burrata, heirloom tomato & basil", "Starters", 12.5, 1, "photo-1512621776951-a57141f2eefd"],
      [204, 2, "Tiramisu", "Espresso-soaked sponge, mascarpone & cocoa", "Desserts", 8, 1, "photo-1571877227200-a0d98ea607e9"],
      [301, 3, "Harvest bowl", "Farro, roasted squash, kale & tahini", "Mains", 14, 1, "photo-1512621776951-a57141f2eefd"],
      [302, 3, "Avocado toast", "Sourdough, smashed avocado & chilli crunch", "Mains", 12, 1, "photo-1525351484163-7529414344d8"],
      [303, 3, "Crispy tofu bites", "Sesame-crusted tofu with ginger dip", "Starters", 8.5, 1, "photo-1546069901-ba9599a7e63c"],
      [304, 3, "Green smoothie", "Spinach, pineapple, banana & oat milk", "Drinks", 7, 1, "photo-1553530666-ba11a7da3888"],
      [401, 4, "Salmon poke bowl", "Sushi rice, salmon, edamame & ponzu", "Mains", 17, 0, "photo-1579871494447-9811cf80d66c"],
      [402, 4, "Crispy chicken bao", "Two steamed buns, pickled cucumber & kewpie", "Mains", 13.5, 0, "photo-1563245372-f21724e3856d"],
      [403, 4, "Miso soup", "White miso, silken tofu & wakame", "Starters", 5.5, 1, "photo-1547592180-85f173990554"],
      [404, 4, "Mochi trio", "Three pieces of seasonal ice cream mochi", "Desserts", 7, 1, "photo-1563805042-7684c019e1cb"],
    ].forEach(([id, restaurant_id, name, description, category, price, vegetarian, photo]) =>
      addItem.run({
        id,
        restaurant_id,
        name,
        description,
        category,
        price,
        vegetarian,
        image: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=640&q=80`,
      }),
    );
  });

  seed();
}

export default db;
