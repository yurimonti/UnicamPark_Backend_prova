require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * array that contains all refresh tokens
 */
let refreshTokens = [];

//return jwt access token
function getAccessToken(user) {
    return jwt.sign({id: user.id,admin:user.isAdmin},process.env.ACCESS_TOKEN_SECRET,{expiresIn: process.env.ACCESS_TOKEN_EXPIRESIN});
}

//return jwt refresh token
function getRefreshToken(user){
    return jwt.sign({id: user.id,admin:user.isAdmin},process.env.REFRESH_TOKEN_SECRET,{expiresIn:'1d'});
}

/**
 * @param {String} token to verify
 * @returns user decoded from jwt access token
 */
function getUserByToken(token){
    let user = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    if(!user) return res.status(403).send("Token is not valid!");
    return user;
}

/**
 * @param {String} token to verify
 * @returns user decoded from jwt refresh token
 */
function getUserByRefreshToken(refreshToken){
    let user = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
    if(!user) return res.status(403).send("Token is not valid!");
    return user;
}

// middleware to verify authorization 
function authenticateToken(req,res,next){
    let authHeader = req.headers['authorization'];
    if(authHeader){
        let token = authHeader.split(' ')[1];
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user) => {
            if(err) return res.status(403).send("Token is not valid!");
            req.user = user;
            next();
        })
    } else return res.status(401).send("You are not authenticated!");   
}

module.exports = {getAccessToken,getUserByToken,authenticateToken,refreshTokens,getRefreshToken,getUserByRefreshToken}