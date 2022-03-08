const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Park = require('../model/park');
const User = require('../model/user');

class Ticket extends Model { }

Ticket.init({
    id: {
        type:DataTypes.BIGINT(9).UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    start: {
        type: DataTypes.DATE,
        allowNull:false
    },
    end: {
        type: DataTypes.DATE,
        allowNull:false
    },
    // targa:{
    //     type: DataTypes.STRING(7),
    //     allowNull:false
    // },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue:true,
        allowNull:false
    }
    },{
    sequelize,
    modelName:'ticket'
});

User.hasMany(Ticket,{foreignKey:'user_id',targetKey:'id'});
Ticket.belongsTo(User,{foreignKey:'user_id',targetKey:'id'});
Ticket.belongsTo(Park,{foreignKey:'park_id',targetKey:'id'});

module.exports = Ticket;

/* type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, */