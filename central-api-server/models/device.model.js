module.exports = (sequelize, Sequelize) => {
  const Device = sequelize.define("device", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    device_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    device_info: {
      type: Sequelize.JSON,
      allowNull: true
    },
    last_seen: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Device;
};