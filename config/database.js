const Sequelize = require('sequelize');
const sequelize = new Sequelize('backend_prova','root','',{
    dialect: 'mariadb',
    host: 'localhost' 
});

module.exports = sequelize;