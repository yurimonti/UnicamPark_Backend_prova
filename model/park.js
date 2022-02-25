const { Sequelize, DataTypes, Model, UUID } = require('sequelize');
const sequelize = require('../config/database');
const Location = require('./location');

class Park extends Model {}

Park.init({
    id: {
        type:DataTypes.BIGINT(9).UNSIGNED,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    codeNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isEmpty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:true
    },
    info: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Park'
});

Park.belongsTo(Location,{foreignKey:'location_id',targetKey:'id'});

module.exports = Park;