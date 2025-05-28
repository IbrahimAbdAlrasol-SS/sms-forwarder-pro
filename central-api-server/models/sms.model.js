module.exports = (sequelize, Sequelize) => {
  const Sms = sequelize.define("sms", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    device_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    sender: {
      type: Sequelize.STRING,
      allowNull: false
    },
    message_body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    timestamp: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    received_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Sms;
};