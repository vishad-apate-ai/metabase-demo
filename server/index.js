const express = require("express");
const app = express();
const dotenv = require("dotenv").config({ path: "../.env" });
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.get("/", (req, res) => {
  res.send("Hello from our server!");
});

const AUTH_PROVIDER_PORT = process.env.AUTH_PROVIDER_PORT;
const METABASE_INSTANCE_URL = process.env.METABASE_INSTANCE_URL;
const METABASE_JWT_SHARED_SECRET = process.env.METABASE_JWT_SHARED_SECRET;

const corsOptions = {
  origin: 'http://localhost:3100',
  credentials: true,
};
app.use(cors(corsOptions));
// Handle preflight OPTIONS requests (very important for auth APIs)
app.options('*', cors(corsOptions));

app.get("/sso/metabase", async (req, res) => {
  // --- Add these lines ---
  console.log("===== New /sso/metabase Request =====");
  console.log("Origin header:", req.headers.origin);
  console.log("Request headers:", req.headers);

  const user = {
    email: "rene@example.com",
    firstName: "Rene",
    lastName: "Descartes",
    group: "Customer",
  };

  if (!user) {
    console.log("no user");
    return res.status(401).json({
      status: "error",
      message: "not authenticated",
    });
  }

  const token = jwt.sign(
    {
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      groups: [user.group],
      exp: Math.round(Date.now() / 1000) + 60 * 10, // 10 minutes expiration
    },
    // This is the JWT signing secret in your Metabase JWT authentication setting
    METABASE_JWT_SHARED_SECRET,
  );

  if (req.query.response === "json") {
    return res
      .status(200)
      .set("Content-Type", "application/json")
      .send({ jwt: token });
  }

  const ssoUrl = `${METABASE_INSTANCE_URL}/auth/sso?token=true&jwt=${token}`;
  console.log("Hitting MB SSO endpoint", ssoUrl);

  try {
    const response = await fetch(ssoUrl, { method: "GET" });
    const session = await response.text();

    console.log("Received session", session);
    return res.status(200).set("Content-Type", "application/json").end(session);
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        status: "error",
        message: "authentication failed",
        error: error.message,
      });
    }
  }
});

app.listen(AUTH_PROVIDER_PORT, () => {
  console.log(`server listening on port ${AUTH_PROVIDER_PORT}`);
});
