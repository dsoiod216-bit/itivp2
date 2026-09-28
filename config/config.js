require('dotenv').config();

// Приоритет IPv4 при DNS-резолвинге — решает проблему ENOTFOUND
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const common = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,  // увеличили таймаут установки соединения
    idle: 10000
  },
  retry: {
    match: [/ENOTFOUND/, /ETIMEDOUT/, /ECONNRESET/],
    max: 3
  }
};

module.exports = {
  development: common,
  test:        common,
  production:  common
};