const config = {
  development: {
    allowedOrigins: [
      "http://localhost:3100",
      "http://localhost:3000",
      "http://localhost:9090"
    ],
    corsOptions: {
      credentials: true,
      optionsSuccessStatus: 200
    }
  },
  production: {
    allowedOrigins: [
      "https://yourdomain.com",
      "https://app.yourdomain.com"
    ],
    corsOptions: {
      credentials: true,
      optionsSuccessStatus: 200
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development']; 