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

  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: process.env.PRICE,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_email: "test@test.com",
          customer_phone: "9999999999"
        }
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01"
        }
      }
    );

    // save in DB
    db.query(
      "INSERT INTO payments (user_id, order_id, status, amount) VALUES (?, ?, ?, ?)",
      [userId, orderId, "PENDING", 1]
    );

    res.json({
      payment_link: response.data.payment_link
    });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).send("Error creating order");
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

db.query(
  "INSERT INTO results (user_id, is_paid) VALUES (?, TRUE) ON DUPLICATE KEY UPDATE is_paid=TRUE",
  [userId]
);


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

// test route
app.get("/", (req, res) => {
  res.send("FaceReveal Server Running 🚀");
});

// server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});