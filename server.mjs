
import express from "express";
import path from "node:path";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const PORT = process.env.PORT || 10000;
const DIST_PATH = path.resolve("dist");

// Proxy hacia el backend (API + archivos de tickets servidos en /uploads)
app.use(
  createProxyMiddleware({
    pathFilter: (pathname) =>
      pathname.startsWith("/api") || pathname.startsWith("/uploads"),
    target: "https://clickear.onrender.com",
    changeOrigin: true,
    secure: true,
  })
);

// Archivos estáticos de React
app.use(express.static(DIST_PATH));

// React Router
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend escuchando en puerto ${PORT}`);
});
