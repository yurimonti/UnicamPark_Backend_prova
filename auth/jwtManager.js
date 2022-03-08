require('dotenv').config();
const jwt = require('jsonwebtoken');

let refreshTokens = [];

function getAccessToken(user) {
    return jwt.sign({id: user.id,admin:user.isAdmin},process.env.ACCESS_TOKEN_SECRET,{expiresIn: process.env.ACCESS_TOKEN_EXPIRESIN});
}

function getRefreshToken(user){
    return jwt.sign({id: user.id,admin:user.isAdmin},process.env.REFRESH_TOKEN_SECRET,{expiresIn:'1d'});
}

function getUserByToken(token){
    let user = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    if(!user) return res.status(403).send("Token is not valid!");
    return user;
}

function getUserByRefreshToken(refreshToken){
    let user = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
    if(!user) return res.status(403).send("Token is not valid!");
    return user;
}

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

/* function authenticateToken(req,res,next){
    let authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
        if (token==null) return res.status(401);
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user) => {
            if(err) return res.sendStatus(403);
            req.user = user;
            next();
        })
} */

module.exports = {getAccessToken,getUserByToken,authenticateToken,refreshTokens,getRefreshToken,getUserByRefreshToken}