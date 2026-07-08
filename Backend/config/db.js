const { Sequelize } = require("sequelize");

// Agar DATABASE_URL maujood hai (Neon/Render ke liye), toh string use karega, warna local variables
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Neon/Cloud DB ke liye yeh line lazmi hai
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        dialect: "postgres",
      }
    );

module.exports = sequelize;