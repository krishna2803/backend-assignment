const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        res.redirect('/login');
        return;
    }
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
    if (decoded) {
        next();
    } else {
        res.status(401).send("Unauthorized");
    }
};
const authenticate_client_only = (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        res.redirect('/login');
        return;
    }
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
    if (decoded) {
        if (decoded.role === 'client') {
            next();
        } else {
            res.status(401).send("Only clients are allowed here.");
        }
    } else {
        res.status(401).send("Unauthorized. Login first.");
    }
};
const authenticate_admin = (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        res.redirect('/login');
        return;
    }
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
    if (decoded) {
        if (decoded.role === 'admin') {
            next();
        } else {
            res.status(401).send("Access Denied. Only admins are allowed here.");
        }
    } else {
        res.status(401).send("Unauthorized. Login first.");
    }
};

module.exports = {
    authenticate,
    authenticate_client_only,
    authenticate_admin
};
