'use strict';

// Express
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// midddleware setup
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// MySQL DB setup
const mysql = require('mysql2');
const dbConn = require('./database.js');
const runQuery = async query => {
    return await dbConn.promise().query(query);
}

app.get('/', (req, res) => {
    res.send('Hello Worlds!');
});

app.post('/ping', (req, res) => {
    res.send('Pong! 🏓');
});

app.get('/books', async (req, res) => {
    try {
        let result = await runQuery('SELECT * FROM books');
        res.render('books', {books: result[0]});
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
    
    // res.send('You should now be viewing books :)');
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, phone, email, address } = req.body;

        const query = `INSERT INTO users (user_name, user_password, user_phone, user_email, user_address) VALUES(${mysql.escape(username)}, ${mysql.escape(password)}, ${mysql.escape(phone)}, ${mysql.escape(email)}, ${mysql.escape(address)});`;

        await runQuery(query);

        console.log(`query ran: ${query}`);

        res.send('User created successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

app.post('/books/add', async (req, res) => {
    try {
        const { title, author, genre, language, summary, count } = req.body;

        // TODO: Check for admin privilages

        const query = `INSERT INTO books (book_title, book_author, book_genre, book_language, book_summary, book_count) VALUES(${mysql.escape(title)}, ${mysql.escape(author)}, ${mysql.escape(genre)}, ${mysql.escape(language)}, ${mysql.escape(summary)}, ${mysql.escape(count)});`;

        await runQuery(query);

        console.log(`query ran: ${query}`);

        res.send('Book added successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Some error occured :(');
    }
});

const PORT = 6969;
app.listen(PORT, () => {
    console.log(`Server is listening on port http://127.0.0.1/${PORT}.`);
});
