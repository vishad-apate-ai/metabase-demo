const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv").config({ path: "../.env" });
const jwt = require("jsonwebtoken");

// Option 1: Using cors middleware package
// app.use(cors({
//   origin: 'http://localhost:3100',
//   credentials: true,
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With']
// }));

// Option 2: Manual CORS middleware (like in your current code)
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3100');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
//   res.header('Access-Control-Allow-Credentials', 'true');
  
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
  
//   next();
// });


const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:3100",
  "http://localhost:3001",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3100",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
  // Add more common development ports
  "http://localhost:4000",
  "http://localhost:5000",
  "http://localhost:8000",
  "http://localhost:9000",
  "http://127.0.0.1:4000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:9000"
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("===== CORS DEBUG =====");
    console.log("Origin received:", JSON.stringify(origin));
    console.log("Origin type:", typeof origin);
    console.log("Origin length:", origin ? origin.length : 0);
    console.log("Allowed origins:", allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }
    
    // Check for exact match first
    if (allowedOrigins.includes(origin)) {
      console.log("CORS: Allowing request from exact match:", origin);
      return callback(null, true);
    }
    
    // For development, allow all localhost origins (more permissive)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log("CORS: Allowing localhost request from:", origin);
      return callback(null, true);
    }
    
    // Allow any port on localhost for development
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/)) {
      console.log("CORS: Allowing localhost request from:", origin);
      return callback(null, true);
    }
    
    // For development environment, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      console.log("CORS: Development mode - allowing request from:", origin);
      return callback(null, true);
    }
    
    console.log("CORS: Rejecting request from:", origin);
    console.log("CORS: This origin is not in allowed list and not localhost");
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Metabase-Client", 
    "X-Metabase-Client-Version",
    "Origin",
    "Accept",
    "X-Requested-With",
    "Cache-Control",
    "X-Requested-With"
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors(corsOptions));

// Add a simple CORS fallback for any missed requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.get("/", (req, res) => {
  res.send("Hello from our server!");
});

const AUTH_PROVIDER_PORT = process.env.AUTH_PROVIDER_PORT;
const METABASE_INSTANCE_URL = process.env.METABASE_INSTANCE_URL;
const METABASE_JWT_SHARED_SECRET = process.env.METABASE_JWT_SHARED_SECRET;


app.get("/sso/metabase", async (req, res) => {
  // Enhanced debugging for production
  console.log("===== SSO Request Debug =====");
  console.log("Origin:", req.headers.origin);
  console.log("Referer:", req.headers.referer);
  console.log("User-Agent:", req.headers["user-agent"]);
  console.log("Request URL:", req.url);
  console.log("Query params:", req.query);
  console.log("Status Code:", res.statusCode);
  console.log("Method:", req.method);
  console.log("Body:", req.body);

  const user = {
    email: "rene@example.com",
    firstName: "Rene",
    lastName: "Descartes",
    group: "Customer",
  };

  if (!user) {
    console.log("Authentication failed: No user found");
    return res.status(401).json({
      status: "error",
      message: "not authenticated",
    });
  }

  try {
    const token = jwt.sign(
      {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        groups: [user.group],
        exp: Math.round(Date.now() / 1000) + 60 * 10, // 10 minutes expiration
      },
      METABASE_JWT_SHARED_SECRET,
    );

    // SDK requests include 'response=json' query parameter
    if (req.query.response === "json") {
      console.log("Returning JWT token for SDK request");
      return res
        .status(200)
        .set("Content-Type", "application/json")
        .json({ jwt: token });
    }

    // For interactive embedding requests (redirects from Metabase), redirect back to Metabase
    const ssoUrl = `${METABASE_INSTANCE_URL}/auth/sso?token=true&jwt=${token}`;
    console.log("Redirecting to Metabase SSO for interactive embedding:", ssoUrl);
    
    // Remove the manual CORS header setting - let the CORS middleware handle it
    return res.json({ssoUrl});
    
  } catch (error) {
    console.error("SSO Error:", error);
    return res.status(500).json({
      status: "error",
      message: "authentication failed",
      error: error.message,
    });
  }
});

app.listen(AUTH_PROVIDER_PORT, () => {
  console.log(`server listening on port ${AUTH_PROVIDER_PORT}`);
});
