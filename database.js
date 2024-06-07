'use strict';

const mysql = require('mysql2');
const argon2 = require('argon2');

require('dotenv').config();

const dbConn = mysql.createConnection(
    {
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DBDATABASE,
    }
)

dbConn.connect(
    err => {
        if (err) throw err;
        console.log('Database Connected!');
    }
);

// admin user

try {
    dbConn.query(`SELECT * FROM users WHERE user_phone = ${mysql.escape(process.env.ADMIN_PHONE)}`, (err, result) => {
        if (err) throw err;
        const admin = result[0];
        // console.log(admin); 
        if (!admin) {
            
            argon2.hash(process.env.GLOBAL_SALT+process.env.ADMIN_PASSWORD).then(passhash => {
                dbConn.query(`INSERT INTO users (user_phone, user_name, user_email, user_password, user_role, user_address) VALUES (${mysql.escape(process.env.ADMIN_PHONE)}, 'admin', ${mysql.escape(process.env.ADMIN_EMAIL)}, ${mysql.escape(passhash)}, 'admin', 'admin');`, (err, result) => {
                    if (err) throw err;
                    // console.log(result);
                });
            });
        }
    });
} catch (err) {
    console.log(err);
}


module.exports = dbConn;