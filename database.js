'use strict';

const mysql = require('mysql2');

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

module.exports = dbConn;