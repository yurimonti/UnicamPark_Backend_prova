const bcrypt = require('bcrypt');

/**
 * @param {String} password 
 * @returns {String} crypted password
 */
function generatePass(password){
    return bcrypt.hashSync(password,10);
}

/**
 * @param {String} password 
 * @param {String} generated 
 * @returns {Boolean} true if the encrypted password is comparable to real password, else false;
 */
function comparePass(password,generated){
    return bcrypt.compareSync(password,generated);
}

module.exports = {generatePass,comparePass};