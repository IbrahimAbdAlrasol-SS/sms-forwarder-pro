const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config.js");

// إنشاء اتصال Sequelize
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// استيراد النماذج
db.device = require("./device.model.js")(sequelize, Sequelize);
db.sms = require("./sms.model.js")(sequelize, Sequelize);
db.command = require("./command.model.js")(sequelize, Sequelize);

// تعريف العلاقات
db.device.hasMany(db.sms, { foreignKey: 'device_id', sourceKey: 'device_id' });
db.sms.belongsTo(db.device, { foreignKey: 'device_id', targetKey: 'device_id' });

db.device.hasMany(db.command, { foreignKey: 'device_id', sourceKey: 'device_id' });
db.command.belongsTo(db.device, { foreignKey: 'device_id', targetKey: 'device_id' });

module.exports = db;