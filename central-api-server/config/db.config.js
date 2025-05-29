module.exports = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "zeus",
  PASSWORD: process.env.DB_PASSWORD || "zeua123A@dk",
  DB: process.env.DB_NAME || "sms_forwarder",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

