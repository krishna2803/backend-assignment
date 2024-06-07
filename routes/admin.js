const mysql = require('mysql2');
const dbConn = require('../database.js');
const jwt = require('jsonwebtoken');

const run_query = async query => {
    // console.log('Running query: ', query);
    return await dbConn.promise().query(query);
}

const view_admin_requests = async (req, res) => {
    try {        
        const query = `SELECT * FROM users WHERE admin_request IS NOT NULL`;
        const result = await run_query(query);

        res.render('adminrequests', { users: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const deny_admin_request = async (req, res) => {
    try {
        const { id } = req.body;

        const query = `UPDATE users SET admin_request = 'denied' WHERE user_id IN (${mysql.escape(id)});`;

        await run_query(query);

        res.send('Request(s) denied successfully!');

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const make_admin = async (req, res) => {
    try {
        const { id } = req.body;

        const query = `UPDATE users SET user_role = 'admin', admin_request = 'approved' WHERE user_id IN (${mysql.escape(id)});`;

        await run_query(query);

        res.send('User(s) promoted to admin successfully!');

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const view_users = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

        // cannot delete himself super admin
        let result = await run_query(`SELECT * FROM users WHERE user_id <> ${mysql.escape(decoded.id)} AND user_phone <> ${mysql.escape(process.env.ADMIN_PHONE)}`);
        
        const filter = req.query.q;
        
        if (!filter || filter.length === 0) {
            res.render('users', { users: result[0] });
            return;
        }

        const filtered_users = result[0].filter(user => {
            return (
                user.user_name.toLowerCase().includes(filter.toLowerCase()) ||
                user.user_email.toLowerCase().includes(filter.toLowerCase()) ||
                user.user_phone.toLowerCase().includes(filter.toLowerCase()) ||
                user.user_address.toLowerCase().includes(filter.toLowerCase())
            );
        });

        res.render('users', { users: filtered_users });

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const remove_users = async (req, res) => {
    try {
        const { id } = req.body;

        const query = `DELETE FROM users WHERE user_id IN (${mysql.escape(id)});`;
        await run_query(query);

        res.status(200).send('User(s) deleted successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

module.exports = {
    view_admin_requests,
    deny_admin_request,
    make_admin,
    view_users,
    remove_users
}