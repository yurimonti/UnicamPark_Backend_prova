const { Sequelize, DataTypes, Model, UUID } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey:true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull:false
  },
  password: {
    type: DataTypes.STRING,
    allowNull:false
  },
  isAdmin:{
    type:DataTypes.BOOLEAN,
    defaultValue:false,
    allowNull:false
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'User' // We need to choose the model name
});

module.exports = User;