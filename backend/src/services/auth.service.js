const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function hashPassword(plain) {
return await bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
return await bcrypt.compare(plain, hash);
}

function signAccessToken(userId) {
return jwt.sign(
{ userId },
process.env.JWT_SECRET,
{
expiresIn: '15m'
}
);
}

function signRefreshToken(userId) {
return jwt.sign(
{ userId },
process.env.JWT_REFRESH_SECRET,
{
expiresIn: '7d'
}
);
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );
    }
    catch {
        return null;
    }
}


module.exports = {
hashPassword,
comparePassword,
signAccessToken,
signRefreshToken,
verifyRefreshToken
};
