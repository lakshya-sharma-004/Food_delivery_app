import express from "express";
import db from "./database.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/api/restaurants", (request, response) => {
  const search = String(request.query.search ?? "").trim();
  const cuisine = String(request.query.cuisine ?? "").trim();
  const restaurants = db
    .prepare(`
      SELECT r.*,
        (SELECT COUNT(*) FROM menu_items m WHERE m.restaurant_id = r.id) AS menu_count
      FROM restaurants r
      WHERE (@search = '' OR r.name LIKE @pattern OR r.cuisine LIKE @pattern)
        AND (@cuisine = '' OR r.cuisine = @cuisine)
      ORDER BY r.rating DESC, r.name COLLATE NOCASE
    `)
    .all({ search, pattern: `%${search}%`, cuisine });
  response.json(restaurants);
});

app.get("/api/restaurants/:id/menu", (request, response) => {
  const restaurantId = Number(request.params.id);
  if (!Number.isInteger(restaurantId) || restaurantId < 1) {
    return response.status(400).json({ error: "Restaurant ID must be a positive integer." });
  }

  const restaurant = db.prepare("SELECT * FROM restaurants WHERE id = ?").get(restaurantId);
  if (!restaurant) {
    return response.status(404).json({ error: "Restaurant not found." });
  }

  const search = String(request.query.search ?? "").trim();
  const category = String(request.query.category ?? "").trim();
  const items = db
    .prepare(`
      SELECT * FROM menu_items
      WHERE restaurant_id = @restaurantId
        AND (@search = '' OR name LIKE @pattern OR description LIKE @pattern)
        AND (@category = '' OR category = @category)
      ORDER BY category, name COLLATE NOCASE
    `)
    .all({ restaurantId, search, pattern: `%${search}%`, category });

  response.json({ restaurant, items });
});

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.use((error, _request, response, _next) => {
  console.error("Unhandled API error:", error);
  response.status(500).json({ error: "The server could not complete the request." });
});

app.listen(port, () => {
  console.log(`Food delivery API listening on http://localhost:${port}`);
});
