module.exports = (sequelize, Sequelize) => {
  const Admin = sequelize.define("admin", {
    admin_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('owner', 'admin'),
      defaultValue: 'admin'
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    last_login: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  return Admin;
};