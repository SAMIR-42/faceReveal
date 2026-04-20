require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const app = express();

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

// test route
app.get("/", (req, res) => {
  res.send("FaceReveal Server Running 🚀");
});

// server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});