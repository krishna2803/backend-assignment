'use strict';

// deepndencies
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

// Express
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// midddleware setup
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// static files
app.use(express.static(path.join(__dirname, 'public')));


const authenticate = (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        console.log('Not logged in :(');
        console.log('Redirecting to /login');
        res.redirect('/login');
        return;
    }
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
    if (decoded) {
        // print the decoded token
        console.log(decoded);
        next();
    } else {
        res.status(401).send("Unauthorized");
    }
};

const authenticate_admin = (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        console.log('Not logged in :(');
        console.log('Redirecting to /login');
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


// MySQL DB setup
const mysql = require('mysql2');
const dbConn = require('./database.js');
const run_query = async query => {
    return await dbConn.promise().query(query);
}

app.get('/', authenticate, (req, res) => {

    // TODO: If not logged in, redirect to /login [done]
    // If admin, redirect to /admin
    // Show user options
    // 1. Books
    // 2. View fines due
    // 3. View borrow history
    // 4. view profile and logout
    const cookie = req.headers.cookie;
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

    const admin = decoded.role === 'admin';

    console.log('decoded: ', decoded);

    if (!admin) {
        res.render('clientdashboard', {user: decoded});
        return;
    } else {
        res.render('admindashboard');
    }
});

app.post('/ping', (req, res) => {
    res.send('Pong! 🏓');
});


app.get('/users', authenticate_admin, async (req, res) => {
    try {
        let result = await run_query('SELECT * FROM users');
        res.render('users', { users: result[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/users/remove', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.body;

        const query = `DELETE FROM users WHERE user_id IN (${mysql.escape(id)});`;
        await run_query(query);
        
        console.log(`query ran: ${query}`);

        res.send('User(s) deleted successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.get('/profile', authenticate, async (req, res) => {
    const cookie = req.headers.cookie;
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

    const query = `SELECT * FROM users WHERE user_id = ${mysql.escape(decoded.id)}`;
    const result = await run_query(query);

    console.log(`query ran: ${query}`);

    const user_details = result[0][0];

    res.render('profile', {user: user_details});
});

app.post('/profile/update', authenticate, async (req, res) => {
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

    console.log(`query ran: ${query}`);

    console.log('Profile updated successfully!');

    res.redirect('/profile');
});

app.post('/admin/ask', authenticate, async (req, res) => {
    try {
        const { id } = req.body;

        const query = `INSERT INTO admin_requests (user_id) VALUES (${mysql.escape(id)});`;

        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('Request sent successfully!');

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

app.get('/admin/requests', authenticate_admin, async (req, res) => {
    try {
        const query = `SELECT * FROM admin_requests`;
        const result = await run_query(query);

        console.log(`query ran: ${query}`);

        const all_requests = await Promise.all(result[0].map(async (request) => {
            const user_query = `SELECT * FROM users WHERE user_id = ${mysql.escape(request.user_id)}`;
            let user_result = (await run_query(user_query))[0][0];
            user_result["request_status"] = request.status;
            return user_result;
        }));

        res.render('adminrequests', { requests: all_requests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/admin/approve', authenticate_admin, async (req, res) => {
    try {
        // BUG: id must be an array!!!!
        const { id } = req.body;
        const ids = Array.from(new Set(id));

        const request_query = `SELECT * FROM admin_requests WHERE req_id IN (${mysql.escape(ids)})`;
        const request_result = (await run_query(request_query))[0];

        console.log('query ran: ', request_query);
        
        let user_ids = Array.from(new Set(request_result.map(request => request.user_id)));

        const query = `UPDATE admin_requests SET status = 'approved' WHERE req_id IN (${mysql.escape(ids)});`;

        await run_query(query);
        console.log(`query ran: ${query}`);

        const previlage_query = `UPDATE users SET user_role = 'admin' WHERE user_id IN (${mysql.escape(user_ids)});`;
        await run_query(previlage_query);

        console.log(`query ran: ${previlage_query}`);
        console.log('User(s) promoted to admin successfully!');

        res.send('Request(s) approved successfully!');

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/admin/deny', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.body;

        const query = `UPDATE admin_requests SET status = 'denied' WHERE user_id IN (${mysql.escape(id)});`;

        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('Request(s) denied successfully!');

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/admin/make', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.body;

        const query = `UPDATE users SET user_role = 'admin' WHERE user_id IN (${mysql.escape(id)});`;

        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('User promoted to admin successfully!');

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});


app.get('/register', (req, res) => {
    console.log('Incoming register request!');
    console.log(req.body);
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, confpass, phone, email, address } = req.body;

        if (confpass !== password) {
            res.status(500).send("Passwords do not match!");
        }

        const unique_email_query = `SELECT * FROM users WHERE user_email = ${mysql.escape(email)}`;
        const unique_email_result = await run_query(unique_email_query);

        if (unique_email_result[0].length > 0) {
            res.status(409).send("An account associated with that email already exists!");
            return;
        }

        const unique_phone_query = `SELECT * FROM users WHERE user_phone = ${mysql.escape(phone)}`;
        const unique_phone_result = await run_query(unique_phone_query);

        if (unique_phone_result[0].length > 0) {
            res.status(409).send("An account associated with that phone number already exists!");
            return;
        }

        const hashed_pass = await argon2.hash(password);

        const insert_query = `INSERT INTO users (user_name, user_password, user_phone, user_email, user_address) VALUES(${mysql.escape(username)}, ${mysql.escape(hashed_pass)}, ${mysql.escape(phone)}, ${mysql.escape(email)}, ${mysql.escape(address)});`;

        await run_query(insert_query);

        console.log(`query ran: ${insert_query}`);

        res.send('User created successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.get('/login', (req, res) => {
    // res.send('hehe, login now :)');
    // logout first
    res.clearCookie('token');
    res.render('login');
});

app.post('/login', async (req, res) => {
    // logout first
    res.clearCookie('token');

    // console.log('Incoming login request!');
    console.log(req.body);

    try {
        const { creds } = req.body;
        let { email, phone } = req.body;
        if (creds) {
            if (creds.includes('@')) {
                email = creds;
            } else if (creds.length === 10 && !isNaN(creds)) {
                phone = creds;
            }
        }
        const { password } = req.body;

        let email_result = null;
        if (email) {
            const email_query = `SELECT * FROM users WHERE user_email = ${mysql.escape(email)}`;
            email_result = await run_query(email_query);
        }

        let phone_result = null;
        if (phone && !email_result) {
            const phone_query = `SELECT * FROM users WHERE user_phone = ${mysql.escape(phone)}`;
            phone_result = await run_query(phone_query);
        }

        if ((email && email_result[0].length === 0) && (phone && phone_result[0].length === 0)) {
            res.status(409).send("Account does not exist!");
            return;
        }

        let user_query = null;
        if (email_result) {
            user_query = `SELECT * FROM users WHERE user_email = ${mysql.escape(email)}`;
        } else {
            user_query = `SELECT * FROM users WHERE user_phone = ${mysql.escape(phone)}`;
        }

        const result = await run_query(user_query);
        console.log(`query ran: ${user_query}`);

        if (result[0].length === 0) {
            res.status(409).send("Account does not exist!");
            return;
        }

        const hashed_pass = result[0][0].user_password;
        const verify = await argon2.verify(hashed_pass, password);
        if (!verify) {
            res.status(409).send("Incorrect credentials!");
            return;
        }

        const user = result[0][0];
        const user_id = user.user_id;
        const username = user.user_name;
        const user_phone = user.user_phone;
        const user_email = user.user_email;
        const role = user.user_role;

        console.log(`User ${username} logged in!`);

        jwt.sign({ id: user_id, name: username, phone: user_phone, email: user_email, role: role },
            process.env.JWTKEY,
            { expiresIn: '1d' }, // expire after 1 day without login 
            (err, token) => {
                if (err) {
                    res.status(500).send('Some error occored with JWT :(');
                    console.log(err);
                }
                console.log('JWT Signned :)');
                console.log('Token:', token);
                res.set('Authorization', `Bearer ${token}`);
                res.cookie('token', token, { httpOnly: false });
                res.redirect('/');
            });
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

app.get('/books/create', authenticate_admin, (req, res) => {
    res.render('addbook');
});

// CREATE
app.post('/books/create', authenticate_admin, async (req, res) => {
    try {
        const { title, author, genre, language, summary, count } = req.body;

        // TODO: Check for admin privilages

        const query = `INSERT INTO books (book_title, book_author, book_genre, book_language, book_summary, book_count) VALUES(${mysql.escape(title)}, ${mysql.escape(author)}, ${mysql.escape(genre)}, ${mysql.escape(language)}, ${mysql.escape(summary)}, ${mysql.escape(count)});`;
        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('Book added successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

// READ
app.get('/books', authenticate, async (req, res) => {
    try {
        const books = await run_query('SELECT * FROM books');
        const cookie = req.headers.cookie;
        const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
        res.render('books', { books: books[0], user: decoded });
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.get('/book/requests', authenticate_admin, async (req, res) => {
    try {
        const query = `SELECT * FROM reservations`;
        const result = await run_query(query);

        console.log(`query ran: ${query}`);

        const books = await Promise.all(result[0].map(async (reservation) => {
            
        }));

        res.render('bookrequests', { requests: books });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

// request books
app.post('/books/request', authenticate, async (req, res) => {
    try {
        const { id } = req.body;
        const cookie = req.headers.cookie;
        const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
        const user_id = decoded.id;

        const query = `INSERT INTO reservations (user_id, book_id) VALUES(${mysql.escape(user_id)}, ${mysql.escape(id)});`;
        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('Request sent successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/books/approve', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.body;

        const update_query = `UPDATE reservations SET status = 'approved' WHERE res_id IN (${mysql.escape(id)});`;
        await run_query(update_query);
        console.log(`query ran: ${update_query}`);

        const reservations = await run_query(`SELECT * FROM reservations WHERE res_id IN (${mysql.escape(id)})`);
        reservations.forEach(async (reservation) => {
            const book_query = `SELECT * FROM books WHERE book_id = ${mysql.escape(reservation.book_id)}`;
            const book = (await run_query(book_query))[0][0];
            const new_count = book.book_count - 1;
            const update_book_query = `UPDATE books SET book_count = ${mysql.escape(new_count)} WHERE book_id = ${mysql.escape(reservation.book_id)}`;
            await run_query(update_book_query);
            console.log(`query ran: ${update_book_query}`);
        });


        res.send('Request(s) approved successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.get('/books/update', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.query;

        const query = `SELECT * FROM books WHERE book_id = ${mysql.escape(id)}`;
        const result = await run_query(query);

        console.log(`query ran: ${query}`);
        const book = result[0][0];

        if (!book) {
            res.send('Book not found!');
            return;
        }

        res.render('updatebook', { book: book });
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

// UDPDATE
app.post('/books/update', authenticate_admin, async (req, res) => {
    try {
        const { id, title, author, genre, language, summary, count } = req.body;

        // TODO: Check for admin privilages

        if (!title && !author && !genre && !language && !summary && !count) {
            res.status(400).send('Nothing to update!');
            return;
        }

        let query = `UPDATE books SET`;
        if (title) {
            query += ` book_title = ${mysql.escape(title)}`;
        }
        if (author) {
            query += `, book_author = ${mysql.escape(author)}`;
        }
        if (genre) {
            query += `, book_genre = ${mysql.escape(genre)}`;
        }
        if (language) {
            query += `, book_language = ${mysql.escape(language)}`;
        }
        if (summary) {
            query += `, book_summary = ${mysql.escape(summary)}`;
        }
        if (count) {
            query += `, book_count = ${mysql.escape(count)}`;
        }
        query += ` WHERE book_id = ${mysql.escape(id)};`;

        
        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('Book updated successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

// DELETE
app.post('/books/delete', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.body;

        // console.log(`ID: ${id}`);

        // TODO: Check for admin privilages

        const query = `DELETE FROM books WHERE book_id IN (${mysql.escape(id)});`;
        await run_query(query);

        console.log(`query ran: ${query}`);

        res.send('Book(s) deleted successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

// Handle 404s
app.use((req, res, next) => {
    res.status(404).send("Error 404: Not Found.")
})

const PORT = 6969;
app.listen(PORT, () => {
    console.log(`Server is listening on port http://localhost:${PORT}/.`);
});
