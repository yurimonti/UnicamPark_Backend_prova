const { Sequelize, DataTypes, Model, UUID } = require('sequelize');
const sequelize = require('../config/database');

class Token extends Model{
    constructor(token){
        super();
        this.token = token;
    }

    setToken(){
        return this.token+13;
    }

}

Token.init({
    id:{
        type:DataTypes.UUID,
        allowNull:false,
        primaryKey:true,
        defaultValue: DataTypes.UUIDV4
    },
    token:{
        type:DataTypes.STRING,
        allowNull:false
    }},
    {
        sequelize,
        modelName:'Token'
    }
);

module.exports = Token;