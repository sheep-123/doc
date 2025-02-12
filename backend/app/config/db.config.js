module.exports = {
  HOST: "192.168.1.136",
  USER: "postgres",
  PASSWORD: "qs@123456",
  DB: "ship_ais",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
