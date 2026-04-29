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
    "You often doubt your decisions even after making them.",
    "You visualize future outcomes so much that it delays your next step.",
    "Even when things go right, your mind keeps searching for what could go wrong."
  ],
  trust: [
    "Once trust is broken, you rarely give second chances.",
    "You value loyalty more than anything.",
    "You need consistency before you fully open up.",
    "You treat small promises like big ones—because you know how it feels to be let down."
  ],
  confidence: [
    "Your confidence sometimes hides inner doubts.",
    "You build confidence through experience, not shortcuts.",
    "You’re strong, but you still evaluate yourself deeply.",
    "When you commit, you follow through even if it takes time."
  ],
  emotional: [
    "You hide your emotions behind a calm face.",
    "You struggle to express feelings openly.",
    "You experience emotions intensely, then try to stay composed.",
    "People may not realize how much you feel until it’s too late to ignore."
  ],
  social: [
    "You avoid unnecessary social interactions.",
    "You prefer meaningful conversations over small talk.",
    "You observe first, then connect when it feels right.",
    "You don’t chase attention—you choose connection with purpose."
  ],

  ambition: [
    "You’re driven by progress, not just results.",
    "Slow growth still feels better to you than sudden unstable success.",
    "You measure success by effort and consistency.",
    "You push yourself when you want to prove your potential."
  ],

  introvert: [
    "You protect your energy and keep your world calm.",
    "You prefer depth over frequency in relationships.",
    "Your best ideas come when you’re alone with your thoughts.",
    "You may seem distant, but you’re actually very attentive."
  ],

  self_doubt: [
    "Your self-doubt comes from caring deeply about doing things the right way.",
    "You question yourself not because you're weak, but because you think ahead.",
    "Even when you're capable, your mind keeps checking if you're enough.",
    "That doubt you feel is actually your mind trying to protect your growth."
  ],

  late_night_thinker: [
    "Your deepest clarity comes when the world goes silent.",
    "At night, your mind connects thoughts you ignore during the day.",
    "You process emotions honestly when there are no distractions.",
    "Those late-night thoughts are shaping your real self quietly."
  ],
  
  silent_observer: [
    "You read people without them realizing it.",
    "Your silence gives you more understanding than most conversations.",
    "You notice patterns in behavior that others miss completely.",
    "You don’t react fast because you already see deeper."
  ],
  
  hidden_strength: [
    "Your strength is built from things you never talk about.",
    "You’ve handled situations alone that could break others.",
    "You stay stable even when everything feels heavy inside.",
    "People see calm, but they don’t see the battles you’ve won."
  ],
    
  people_pleaser: [
    "You naturally understand what makes others feel comfortable.",
    "You adjust yourself to keep peace, even when it's hard.",
    "You carry emotional responsibility without asking for it.",
    "Your kindness often goes deeper than people realize."
  ],
  
  emotional_control: [
    "You’ve trained yourself to stay calm even when emotions rise.",
    "You choose silence over impulsive reactions.",
    "You feel everything, but you show only what’s necessary.",
    "Your control comes from understanding emotions, not avoiding them."
  ],
  
  fear_of_loss: [
    "You value people deeply, which makes losing them feel heavy.",
    "You hold onto connections because they matter to you.",
    "Your fear comes from knowing how rare real bonds are.",
    "You don’t take relationships lightly, and that shows."
  ],
  
  deep_thinker: [
    "Your mind naturally goes beyond what’s visible.",
    "You connect dots others don’t even notice.",
    "You search for meaning instead of accepting surface answers.",
    "Your depth makes you see reality differently."
  ],

  
  attachment_style: [
    "You don’t attach easily, but when you do, it’s real.",
    "Your connections are based on emotional depth, not convenience.",
    "You value stability more than temporary excitement.",
    "Once connected, you invest genuinely."
  ],
  
  inner_conflict: [
    "Your mind balances logic and emotion constantly.",
    "You see both sides, which makes decisions harder.",
    "That conflict comes from your ability to think deeply.",
    "You don’t act fast because you understand consequences."
  ],
  
  validation_seeker: [
    "You notice small reactions because they matter to you.",
    "You read between the lines in people’s behavior.",
    "You don’t just hear words—you observe responses.",
    "That awareness makes you socially sharp."
  ],
  
  past_overthink: [
    "You revisit the past to understand it fully.",
    "You learn from moments others forget.",
    "Your mind holds onto details to avoid repeating mistakes.",
    "Those memories shape your awareness."
  ],
  
  future_anxiety: [
    "You think ahead because you want control over outcomes.",
    "You prepare mentally for what might happen.",
    "Your mind plans multiple paths to stay safe.",
    "That anxiety is actually your brain trying to protect you."
  ],

  
  calm_outside: [
    "You’ve mastered showing calm even in chaos.",
    "People rely on your composed nature.",
    "You don’t let emotions control your outer image.",
    "Your calmness hides a lot of depth inside."
  ],
  
  sensitive_mind: [
    "You pick up emotions that others ignore.",
    "You feel intensity in simple moments.",
    "Your sensitivity makes you more aware of people.",
    "That depth is rare, not weak."
  ],
  
  energy_protection: [
    "You know where your energy should be invested.",
    "You avoid draining situations without explaining much.",
    "You protect your peace like it matters—because it does.",
    "Not everyone gets access to your time and energy."
  ],
  
  loyal_nature: [
    "Once you trust, you stand by people strongly.",
    "You don’t switch sides based on convenience.",
    "Your loyalty is based on values, not situations.",
    "You stay real even when things change."
  ],
  
  trust_issues_deep: [
    "You’ve learned to trust slowly for a reason.",
    "You observe actions before believing words.",
    "You protect yourself from false expectations.",
    "Your trust is earned, not given easily."
  ],

  decision_delay: [
    "You think before acting because outcomes matter to you.",
    "You consider angles others ignore.",
    "You avoid rushing into things blindly.",
    "Your delay is actually calculated thinking."
  ],
  
  over_analysis: [
    "You break situations into details naturally.",
    "You don’t accept things without understanding them.",
    "You go deeper even when it's not required.",
    "That analysis gives you a different perspective."
  ],
  
  self_pressure: [
    "You push yourself because you see your potential.",
    "You expect more because you know you can do more.",
    "You don’t settle for average easily.",
    "That pressure comes from your inner standards."
  ],
  
  fear_of_judgement: [
    "You stay aware of how actions are perceived.",
    "You think before expressing yourself openly.",
    "You observe reactions to avoid negative attention.",
    "That awareness makes you socially careful."
  ],

  
  over_caring: [
    "You think about others even when they don’t.",
    "You adjust your actions to avoid hurting people.",
    "You carry emotional weight quietly.",
    "Your care is deeper than most."
  ],
  
  emotional_memory: [
    "You remember how things felt, not just what happened.",
    "Emotions stay stored in your mind longer.",
    "You connect memories with feelings instantly.",
    "That’s why some moments never leave you."
  ],
  
  silent_expectations: [
    "You expect understanding without explaining everything.",
    "You notice when people don’t meet your silent hopes.",
    "You don’t demand—you observe.",
    "Your expectations are quiet but strong."
  ],
  
  inner_voice: [
    "You trust your inner thoughts more than external noise.",
    "You reflect before making moves.",
    "Your intuition guides you silently.",
    "That voice inside you is sharper than you think."
  ],

  self_reflection: [
    "You constantly evaluate yourself to improve.",
    "You notice your own patterns clearly.",
    "You grow by understanding your actions.",
    "That reflection keeps you evolving."
  ],
  
  unspoken_feelings: [
    "You feel more than you express.",
    "You keep emotions controlled within.",
    "Not everything you feel is shown outside.",
    "There’s always more going on inside you."
  ],
  
  mental_loops: [
    "Your mind replays things to find clarity.",
    "You get stuck because you want answers.",
    "You revisit thoughts until they make sense.",
    "That loop comes from your need to understand."
  ],
  
  connection_depth: [
    "You seek real bonds, not temporary ones.",
    "You connect where there is understanding.",
    "You avoid shallow interactions naturally.",
    "Depth matters more to you than numbers."
  ],
  
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
    "SELECT main_category, is_paid, free_lines FROM results WHERE user_id=?",
    [userId]
  );

  if (!rows.length) return res.status(404).json({ error: "no result" });

  if (rows[0].is_paid !== 1) {
    return res.status(403).json({ error: "not paid" });
  }

  const mainCat = rows[0].main_category;

  const paidPool = paidData[mainCat] || [];

  // Link logic:
  // analysis.js picks exact indices from data[mainCat].free
  // and sends them to backend inside `free_lines` JSON.
  // paidData[mainCat][sameIndex] is shown on unlock.
  let paidLines = paidPool.slice(0, 4);

  try {
    const parsed = JSON.parse(rows[0].free_lines || "null");
    const indices = Array.isArray(parsed?.mainFreeIndices) ? parsed.mainFreeIndices : null;
    if (indices && indices.length) {
      paidLines = indices
        .map((idx) => paidPool[idx])
        .filter(Boolean)
        .slice(0, 4);
    }
  } catch {
    // If older stored rows don't have indices, fallback to first 4.
  }

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