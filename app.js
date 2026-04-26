require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const app = express();
const axios = require("axios");

// middlewares
app.use(cors());
app.use(express.json());

// static files serve
app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

// DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("DB Connection Failed ❌", err);
  } else {
    console.log("DB Connected ✅");
  }
});

app.post("/create-order", async (req, res) => {
  const { userId } = req.body;

  const orderId = "order_" + Date.now();
  const amount = Number(process.env.PRICE);

  try {
    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",

        customer_details: {
          customer_id: userId,
          customer_email: "test@test.com",
          customer_phone: "9999999999"
        },

        // 🔥 MOST IMPORTANT
        order_meta: {
          return_url: `https://facereveal.onrender.com/pages/analysis.html?paid=true`,
          notify_url: `https://facereveal.onrender.com/webhook`
        }

      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json"
        }
      }
    );

    db.query(
      "INSERT INTO payments (user_id, order_id, status, amount) VALUES (?, ?, ?, ?)",
      [userId, orderId, "PENDING", amount]
    );

    res.json({
      payment_link: response.data.payment_link
    });

  } catch (err) {
    console.log("❌ CASHFREE ERROR:");
    console.log(err.response?.data || err.message);

    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

app.post("/webhook", express.json(), (req, res) => {

  const data = req.body;

  const orderId = data.order.order_id;
  const status = data.order.order_status;
  const userId = data.order.customer_details.customer_id;

  if (status === "PAID") {

    // update payment
    db.query(
      "UPDATE payments SET status='PAID' WHERE order_id=?",
      [orderId]
    );

    // mark result unlocked
    db.query(
      "UPDATE results SET is_paid=TRUE WHERE user_id=?",
      [userId]
    );
  }

  res.sendStatus(200);
});


app.get("/check-payment/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT is_paid FROM results WHERE user_id=?",
    [userId],
    (err, result) => {
      if (result.length > 0) {
        res.json({ paid: result[0].is_paid });
      } else {
        res.json({ paid: false });
      }
    }
  );
});

app.post("/save-result", (req, res) => {
  const { userId, mainCat, freeLines } = req.body;

  db.query(
    "INSERT INTO results (user_id, main_category, free_lines, is_paid) VALUES (?, ?, ?, FALSE) ON DUPLICATE KEY UPDATE main_category=?, free_lines=?",
    [userId, mainCat, JSON.stringify(freeLines), mainCat, JSON.stringify(freeLines)]
  );

  res.sendStatus(200);
});


// server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});