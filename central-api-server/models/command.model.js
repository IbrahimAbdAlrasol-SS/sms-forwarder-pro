module.exports = (sequelize, Sequelize) => {
  const Command = sequelize.define("command", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    device_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    command_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    parameters: {
      type: Sequelize.JSON,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('pending', 'sent', 'executed', 'failed'),
      defaultValue: 'pending'
    },
    result: {
      type: Sequelize.JSON,
      allowNull: true
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

  return Command;
};