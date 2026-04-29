require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const app = express();
const axios = require("axios");
const crypto = require("crypto");



// middlewares
app.use(cors());


// Serve ONLY required frontend assets (avoid leaking server code/.env)
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/script.js", (req, res) => res.sendFile(path.join(__dirname, "script.js")));

app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "sitemap.xml"));
});

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "robots.txt"));
});

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/models", express.static(path.join(__dirname, "models")));

  app.use(express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));

// serve pages folder
app.use("/pages", express.static(path.join(__dirname, "pages")));

app.get("/analysis.html", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "analysis.html"));
});

// DB connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const promiseDb = db.promise();

// Paid lines live ONLY on server
const paidData = {
  overthinking: [
    "Your overthinking is linked to past situations where you felt misunderstood.",
    "You often doubt your decisions even after making them."
  ],
  trust: [
    "Once trust is broken, you rarely give second chances.",
    "You value loyalty more than anything."
  ],
  confidence: [
    "Your confidence sometimes hides inner doubts.",
    "You build confidence through experience, not shortcuts."
  ],
  emotional: [
    "You hide your emotions behind a calm face.",
    "You struggle to express feelings openly."
  ],
  social: [
    "You avoid unnecessary social interactions.",
    "You prefer meaningful conversations over small talk."
  ]
};

function verifyCashfreeWebhook(req) {
  const ts = req.header("x-webhook-timestamp");
  const sig = req.header("x-webhook-signature");
  if (!ts || !sig) return false;

  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return false;

  const signedPayload = `${ts}${req.rawBody || ""}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

app.post("/create-order", async (req, res) => {
  const { userId } = req.body;

  const orderId = "order_" + Date.now();

  try {
    const baseUrl = process.env.PUBLIC_BASE_URL || "https://facereveal.onrender.com";
    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: 1,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_phone: "9876543210"
        },
        order_meta: {
          // Never trust URL params for unlocking; only used for UX polling
          return_url: `${baseUrl}/pages/analysis.html?order_id=${orderId}`
        }
      })
    });

    const data = await response.json();

    if (!data.payment_session_id) {
      console.log("❌ FULL ERROR:", data);
      return res.json({
        error: "No session id",
        full: data
      });
    }

    console.log("Cashfree response:", data);

    if (!data.payment_session_id) {
      return res.json({ error: "No session id", data });
    }

    await promiseDb.query(
      "INSERT INTO payments (user_id, order_id, status, amount) VALUES (?, ?, ?, ?)",
      [userId, orderId, "PENDING", 1]
    );

    res.json({
      payment_session_id: data.payment_session_id,
      order_id: orderId
    });

  } catch (err) {
    console.log("Create order error:", err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/webhook", async (req, res) => {
  try {
    // Reject spoofed webhooks
    if (!verifyCashfreeWebhook(req)) {
      console.log("❌ Webhook signature invalid");
      return res.sendStatus(401);
    }

    const data = req.body;

    const orderId = data.data.order.order_id;
    const status = data.data.payment.payment_status;
    if (!orderId || !status) {
      console.log("Invalid webhook data");
      return res.sendStatus(400);
    }

    console.log("Webhook hit:", orderId, status);

    if (status === "SUCCESS") {

      await promiseDb.query(
        "UPDATE payments SET status=? WHERE order_id=?",
        ["SUCCESS", orderId]
      );

      // 👉 user ko paid mark kar
      const [rows] = await promiseDb.query(
        "SELECT user_id FROM payments WHERE order_id=?",
        [orderId]
      );

      const userId = rows[0].user_id;

      await promiseDb.query(
        "UPDATE results SET is_paid=1 WHERE user_id=?",
        [userId]
      );

      console.log("✅ Payment success updated:", userId);
    }

    res.sendStatus(200);

  } catch (err) {
    console.log("Webhook error:", err);
    res.sendStatus(500);
  }
});

app.get("/check-payment/:userId", async (req, res) => {
  const userId = req.params.userId;

  const [rows] = await promiseDb.query(
    "SELECT is_paid FROM results WHERE user_id=?",
    [userId]
  );

  if (rows.length && rows[0].is_paid === 1) {
    return res.json({ paid: true });
  }

  res.json({ paid: false });
});

app.get("/paid-lines/:userId", async (req, res) => {
  const userId = req.params.userId;

  const [rows] = await promiseDb.query(
    "SELECT main_category, is_paid FROM results WHERE user_id=?",
    [userId]
  );

  if (!rows.length) return res.status(404).json({ error: "no result" });

  if (rows[0].is_paid !== 1) {
    return res.status(403).json({ error: "not paid" });
  }

  const mainCat = rows[0].main_category;
  const paidLines = paidData[mainCat] || [];
  res.json({ paidLines });
});

app.post("/save-result", async (req, res) => {
  const { userId, mainCat, freeLines } = req.body;

  await promiseDb.query(
    `INSERT INTO results (user_id, main_category, free_lines, is_paid)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE main_category=?, free_lines=?`,
    [userId, mainCat, JSON.stringify(freeLines), mainCat, JSON.stringify(freeLines)]
  );

  res.json({ success: true });
});



// server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});