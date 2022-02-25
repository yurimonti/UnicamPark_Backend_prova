const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Location extends Model { }

Location.init({
    id: {
        type:DataTypes.BIGINT(9).UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.CHAR,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }},
    {
        sequelize,
        modelName: 'location'
    }
);

module.exports = Location;