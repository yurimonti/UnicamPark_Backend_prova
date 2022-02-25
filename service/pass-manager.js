const bcrypt = require('bcrypt');

function generatePass(password){
    return bcrypt.hashSync(password,10);
}

function comparePass(password,generated){
    return bcrypt.compareSync(password,generated);
}

module.exports = {generatePass,comparePass};