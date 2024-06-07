const mysql = require('mysql2');
const dbConn = require('../database.js');
const jwt = require('jsonwebtoken');

const run_query = async query => {
    // console.log('Running query: ', query);
    return await dbConn.promise().query(query);
}

const ask_admin = async (req, res) => {
    try {
        const { id } = req.body;

        // update admin_request column from users having id user_ids to "pending"
        const query = `UPDATE users SET admin_request = 'pending' WHERE user_id IN (${mysql.escape(id)});`

        await run_query(query);

        res.status(409).send(`<script>alert('Admin request sent successfully!'); window.location.href = "/profile"; </script>`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const update_profile = async (req, res) => {
    const cookie = req.headers.cookie;
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

    const { username, phone, email, address, password } = req.body;

    // verify password 
    const user_query = `SELECT * FROM users WHERE user_id = ${mysql.escape(decoded.id)}`;
    const user_result = await run_query(user_query);

    const hashed_pass = user_result[0][0].user_password;
    const verify = await argon2.verify(hashed_pass, password);
    if (!verify) {
        res.status(409).send("Incorrect password!");
        return;
    }

    const query = `UPDATE users SET user_name = ${mysql.escape(username)}, user_phone = ${mysql.escape(phone)}, user_email = ${mysql.escape(email)}, user_address = ${mysql.escape(address)} WHERE user_id = ${mysql.escape(decoded.id)}`;

    await run_query(query);

    res.redirect('/profile');
};

const view_history = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
        const user_id = decoded.id;

        const history_query = `SELECT * FROM reservations r JOIN users u ON r.user_id = u.user_id JOIN books b ON r.book_id = b.book_id WHERE u.user_id = ${user_id};`;

        const requests = (await run_query(history_query))[0];

        res.render('history', { requests: requests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const view_profile = async (req, res) => {
    const cookie = req.headers.cookie;
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

    const query = `SELECT * FROM users WHERE user_id = ${mysql.escape(decoded.id)}`;
    const result = await run_query(query);

    const user_details = result[0][0];

    res.render('profile', { user: user_details });
};

module.exports = {
    ask_admin,
    update_profile,
    view_history,
    view_profile
};
