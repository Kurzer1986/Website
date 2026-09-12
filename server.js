const express = require("express");
const session = require("express-session");
const path = require("path");

require("dotenv").config();

const app = express();
const PORT = 8080;

const PIN = process.env.SITE_PIN;

// ================================
// SESSION
// ================================

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict"
    }
  })
);

// ================================
// PIN-SEITE
// ================================

app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title></title>
      <style>
        html, body {
          margin: 0;
          width: 100%;
          height: 100%;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        form {
          display: flex;
        }

        input {
          width: 120px;
          padding: 12px;
          border: 1px solid #444;
          border-radius: 8px;
          background: #111;
          color: white;
          text-align: center;
          font-size: 20px;
          letter-spacing: 6px;
          outline: none;
        }
      </style>
    </head>

    <body>
      <form method="POST" action="/login">
        <input
          type="password"
          name="pin"
          inputmode="numeric"
          autocomplete="off"
          autofocus
        >
      </form>
    </body>
    </html>
  `);
});

// ================================
// PIN PRÜFEN
// ================================

app.use(express.urlencoded({ extended: false }));

app.post("/login", (req, res) => {
  if (req.body.pin === PIN) {
    req.session.eingeloggt = true;
    return res.redirect("/");
  }

  res.redirect("/login");
});

// ================================
// SCHUTZ
// ================================

app.use((req, res, next) => {
  if (req.session.eingeloggt) {
    return next();
  }

  res.redirect("/login");
});

// ================================
// WEBSITE AUSLIEFERN
// ================================

app.use(express.static(__dirname));

// ================================
// SERVER STARTEN
// ================================

app.listen(PORT, () => {
  console.log(`Website läuft auf http://localhost:${PORT}`);
});