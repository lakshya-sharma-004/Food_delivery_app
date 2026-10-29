# Gather — Food Delivery Integration

A full-stack food ordering demo built with React, Express, and SQLite. Restaurant and menu data are served from the database through the API; search and filters query that data dynamically. Cart quantities and order totals update immediately in the client.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API runs at `http://localhost:3001`, and SQLite creates `data/food-delivery.sqlite` on first launch.

For a production client build, run `npm run build`. To run the API on its own, use `npm start`.

## Worksheet 5 features

- Browse restaurants loaded from SQLite, search by restaurant or cuisine, and filter cuisine.
- Select a restaurant to fetch its menu from SQLite.
- Search dishes and filter by category.
- Add dishes to the order, increment or decrement quantities, and remove an item by reducing its quantity to zero.
- Automatically calculate subtotal, delivery fee, and total.
- Seeded database includes four restaurants and four menu items per restaurant.

## API

- `GET /api/restaurants?search=&cuisine=` — list/filter restaurants.
- `GET /api/restaurants/:id/menu?search=&category=` — get a restaurant menu with optional filters.
- `GET /api/health` — API status.
