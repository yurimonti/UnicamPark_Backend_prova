const Sequelize = require('sequelize');
const sequelize = new Sequelize('beckend_prova','root','',{
    dialect: 'mariadb',
    host: 'localhost' 
});

module.exports = sequelize;