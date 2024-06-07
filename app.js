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

// routes
const admin = require('./routes/admin.js');
const client = require('./routes/client.js');
const books = require('./routes/books.js');

const { authenticate, authenticate_admin, authenticate_client_only } = require('./routes/middleware.js');

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


// MySQL DB setup
const mysql = require('mysql2');
const dbConn = require('./database.js');
const run_query = async query => {
    // console.log('Running query: ', query);
    return await dbConn.promise().query(query);
}

app.get('/', authenticate, (req, res) => {

    // 2. View fines due
    const cookie = req.headers.cookie;
    const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

    const admin = decoded.role === 'admin';

    if (!admin) {
        res.render('clientdashboard', { user: decoded });
        return;
    } else {
        res.render('admindashboard');
    }
});

app.post('/ping', async (req, res) => {
    res.send('Pong! 🏓');

    const hashed_pass = await argon2.hash(process.env.GLOBAL_SALT + 'password');
    const escaped_pass = mysql.escape(hashed_pass);
    try {
        const insertUsersQuery = `
            INSERT INTO users (user_name, user_password, user_phone, user_email, user_address) VALUES
            ('John Doe', ${escaped_pass}, '1234567890', 'john.doe@example.com', '123 Main St'),
            ('Jane Smith', ${escaped_pass}, '0987654321', 'jane.smith@example.com', '456 Elm St'),
            ('Alice Johnson', ${escaped_pass}, '2345678901', 'alice.johnson@example.com', '789 Oak St'),
            ('Bob Brown', ${escaped_pass}, '3456789012', 'bob.brown@example.com', '321 Pine St'),
            ('Charlie Davis', ${escaped_pass}, '4567890123', 'charlie.davis@example.com', '654 Cedar St'),
            ('David Wilson', ${escaped_pass}, '5678901234', 'david.wilson@example.com', '987 Maple St'),
            ('Emma Thomas', ${escaped_pass}, '6789012345', 'emma.thomas@example.com', '135 Birch St'),
            ('Frank Miller', ${escaped_pass}, '7890123456', 'frank.miller@example.com', '246 Spruce St'),
            ('Grace Lee', ${escaped_pass}, '8901234567', 'grace.lee@example.com', '357 Ash St'),
            ('Hannah White', ${escaped_pass}, '9012345678', 'hannah.white@example.com', '468 Walnut St'),
            ('Isaac Green', ${escaped_pass}, '1230987654', 'isaac.green@example.com', '579 Chestnut St'),
            ('Jack Harris', ${escaped_pass}, '2341098765', 'jack.harris@example.com', '680 Magnolia St'),
            ('Karen Lewis', ${escaped_pass}, '3452109876', 'karen.lewis@example.com', '791 Fir St'),
            ('Liam Young', ${escaped_pass}, '4563210987', 'liam.young@example.com', '892 Redwood St'),
            ('Mia Hall', ${escaped_pass}, '5674321098', 'mia.hall@example.com', '103 Poplar St'),
            ('Noah Allen', ${escaped_pass}, '6785432109', 'noah.allen@example.com', '214 Beech St'),
            ('Olivia King', ${escaped_pass}, '7896543210', 'olivia.king@example.com', '325 Willow St'),
            ('Paul Scott', ${escaped_pass}, '8907654321', 'paul.scott@example.com', '436 Sycamore St'),
            ('Quinn Baker', ${escaped_pass}, '9018765432', 'quinn.baker@example.com', '547 Dogwood St'),
            ('Rachel Adams', ${escaped_pass}, '1239876543', 'rachel.adams@example.com', '658 Cypress St');
        `;
        await run_query(insertUsersQuery);
    } catch (err) {
        console.error(err);
    }

    const insertBooksQuery = `
        INSERT INTO books (book_title, book_author, book_genre, book_language, book_summary, book_count) VALUES
        ('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction,Classic', 'English', 'A novel set in the Roaring Twenties, exploring themes of wealth, love, and the American Dream.', 10),
        ('To Kill a Mockingbird', 'Harper Lee', 'Fiction,Classic', 'English', 'A story of racial injustice and moral growth in the Deep South.', 8),
        ('1984', 'George Orwell', 'Dystopian,Science Fiction', 'English', 'A chilling depiction of a totalitarian regime and the power of surveillance.', 12),
        ('Pride and Prejudice', 'Jane Austen', 'Fiction,Romance', 'English', 'A romantic novel that also critiques the British landed gentry at the end of the 18th century.', 7),
        ('The Catcher in the Rye', 'J.D. Salinger', 'Fiction,Classic', 'English', 'A story about teenage rebellion and angst in post-war America.', 6),
        ('Moby-Dick', 'Herman Melville', 'Fiction,Adventure', 'English', 'A seafaring adventure and a symbolic exploration of obsession and revenge.', 4),
        ('War and Peace', 'Leo Tolstoy', 'Fiction,Historical', 'English', 'A sweeping narrative of Russian society during the Napoleonic Era.', 3),
        ('The Odyssey', 'Homer', 'Fiction,Classic,Adventure', 'English', 'An epic poem recounting the adventures of Odysseus on his journey home.', 9),
        ('Crime and Punishment', 'Fyodor Dostoevsky', 'Fiction,Philosophical', 'English', 'A psychological drama about guilt and redemption.', 5),
        ('The Brothers Karamazov', 'Fyodor Dostoevsky', 'Fiction,Philosophical', 'English', 'A complex narrative exploring faith, doubt, and morality.', 4),
        ('Brave New World', 'Aldous Huxley', 'Dystopian,Science Fiction', 'English', 'A dystopian vision of a future society driven by technological advancements and control.', 11),
        ('Jane Eyre', 'Charlotte Brontë', 'Fiction,Romance,Gothic', 'English', 'A novel about the struggles of an orphaned girl and her journey to independence.', 7),
        ('Wuthering Heights', 'Emily Brontë', 'Fiction,Romance,Gothic', 'English', 'A tale of passion and revenge set on the Yorkshire moors.', 6),
        ('Great Expectations', 'Charles Dickens', 'Fiction,Classic', 'English', 'A coming-of-age story about a young orphan named Pip.', 8),
        ('The Hobbit', 'J.R.R. Tolkien', 'Fantasy,Adventure', 'English', 'A prelude to the Lord of the Rings, following the journey of Bilbo Baggins.', 10),
        ('The Lord of the Rings', 'J.R.R. Tolkien', 'Fantasy,Adventure', 'English', 'An epic tale of the struggle against the dark lord Sauron.', 7),
        ('Fahrenheit 451', 'Ray Bradbury', 'Dystopian,Science Fiction', 'English', 'A novel about a future society where books are banned and burned.', 6),
        ('The Book Thief', 'Markus Zusak', 'Fiction,Historical', 'English', 'A story set in Nazi Germany, narrated by Death, about a young girl who finds solace in stolen books.', 9),
        ('The Alchemist', 'Paulo Coelho', 'Fiction,Philosophical', 'English', 'A philosophical story about a shepherd boy on a journey to find his personal legend.', 12),
        ('The Catch-22', 'Joseph Heller', 'Fiction,War', 'English', 'A satirical novel set during World War II, exploring the absurdities of war.', 5);
        `;
    await run_query(insertBooksQuery);

});


app.get('/profile', authenticate, client.view_profile);

app.get('/history', authenticate_client_only, client.view_history);
app.post('/profile/update', authenticate_client_only, client.update_profile);
app.post('/admin/ask', authenticate_client_only, client.ask_admin);

app.post('/users/remove', authenticate_admin, admin.remove_users);
app.get('/users', authenticate_admin, admin.view_users);
app.get('/admin/requests', authenticate_admin, admin.view_admin_requests);
app.post('/admin/deny', authenticate_admin, admin.deny_admin_request);
app.post('/admin/make', authenticate_admin, admin.make_admin);

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, confpass, phone, email, address } = req.body;

        if (confpass !== password) {
            res.status(409).send(`<script>alert("Your passwords do not match"); window.location.href = "/login"; </script>`);
            // res.status(500).render('goback', { message: ``, status: `Registration Failure` });
        }

        const unique_email_query = `SELECT * FROM users WHERE user_email = ${mysql.escape(email)}`;
        const unique_email_result = await run_query(unique_email_query);

        if (unique_email_result[0].length > 0) {
            res.status(409).send(`<script>alert("An account associated with that email already exists!"); window.location.href = "/login"; </script>`);
            // res.status(409).render('goback', { message: `An account associated with that email already exists!`, status: `Registration Conflict` });
            return;
        }

        const unique_phone_query = `SELECT * FROM users WHERE user_phone = ${mysql.escape(phone)}`;
        const unique_phone_result = await run_query(unique_phone_query);

        if (unique_phone_result[0].length > 0) {
            res.status(409).send(`<script>alert("An account associated with that phone number already exists!"); window.location.href = "/login"; </script>`);
            // res.status(409).render('goback', { message: `An account associated with that phone number already exists!`, status: `Registration Conflict` });
            return;
        }

        const hashed_pass = await argon2.hash(process.env.GLOBAL_SALT + password);

        const insert_query = `INSERT INTO users (user_name, user_password, user_phone, user_email, user_address) VALUES(${mysql.escape(username)}, ${mysql.escape(hashed_pass)}, ${mysql.escape(phone)}, ${mysql.escape(email)}, ${mysql.escape(address)});`;

        await run_query(insert_query);

        res.render('goback', { message: `User ${username} created successfully!`, status: `Registration Success` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

app.get('/login', (req, res) => {
    res.clearCookie('token');
    res.render('login');
});

app.post('/login', async (req, res) => {
    // logout first
    res.clearCookie('token');

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
            res.status(409).send(`<script>alert("Account associated with the phone or email does not exist!"); window.location.href = "/login"; </script>`);
            // res.status(409).render('goback', { message: `Account associated with the phone or email does not exist!`, status: `Login Failure` });
            return;
        }

        let user_query = null;
        if (email_result) {
            user_query = `SELECT * FROM users WHERE user_email = ${mysql.escape(email)}`;
        } else {
            user_query = `SELECT * FROM users WHERE user_phone = ${mysql.escape(phone)}`;
        }

        const result = await run_query(user_query);
        if (result[0].length === 0) {
            res.status(409).send(`<script>alert("Account associated with the phone or email does not exist!"); window.location.href = "/login"; </script>`);
            // res.status(409).render('goback', { message: `Account associated with the phone or email does not exist!`, status: `Login Failure` });
            return;
        }

        const hashed_pass = result[0][0].user_password;
        const verify = await argon2.verify(hashed_pass, process.env.GLOBAL_SALT+password);
        if (!verify) {
            res.status(409).send(`<script>alert("The email/phone or password you entered was incorrect!"); window.location.href = "/login"; </script>`);
            // res.status(409).render('goback', { message: `The email/phone or password you entered was incorrect!`, status: `Login Failure` });
            return;
        }

        const user = result[0][0];
        const user_id = user.user_id;
        const username = user.user_name;
        const user_phone = user.user_phone;
        const user_email = user.user_email;
        const role = user.user_role;

        // console.log(`User ${username} logged in!`);

        jwt.sign({ id: user_id, name: username, phone: user_phone, email: user_email, role: role },
            process.env.JWTKEY,
            { expiresIn: '1d' }, // expire after 1 day without login 
            (err, token) => {
                if (err) {
                    res.status(500).send('Some error occored with JWT :(');
                    console.error(err);
                }

                res.set('Authorization', `Bearer ${token}`);
                res.cookie('token', token, { httpOnly: false });
                res.redirect('/');
            });
    } catch (err) {
        console.error(err);
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

app.post('/books/create', authenticate_admin, books.create);
app.get('/books', authenticate, books.view_books);
app.get('/books/requests', authenticate_admin, books.view_requests);
app.post('/books/request', authenticate_client_only, books.request_books);
app.post('/books/return', authenticate_client_only, books.return_books);
app.post('/books/requests/approve', authenticate_admin, books.approve_requests);
app.post('/books/requests/deny', authenticate_admin, books.deny_requests);
app.post('/books/delete', authenticate_admin, books.delete_books);

app.get('/books/update', authenticate_admin, async (req, res) => {
    try {
        const { id } = req.query;

        const query = `SELECT * FROM books WHERE book_id = ${mysql.escape(id)}`;
        const result = await run_query(query);

        const book = result[0][0];

        if (!book) {
            res.status(409).send(`<script>alert("Book not found!"); window.location.href = "/books"; </script>`);
            return;
        }

        res.render('updatebook', { book: book });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
});

// UPDATE
app.post('/books/update', authenticate_admin, async (req, res) => {
    try {
        const { id, title, author, genre, language, summary, count } = req.body;

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
            if (count <= 0) {
                res.status(409).send(`<script>alert("Count must be a positive integer!"); window.location.href = "/books/update?id=${id}"; </script>`);
                return;
            }
            query += `, book_count = ${mysql.escape(count)}`;
        }
        query += ` WHERE book_id = ${mysql.escape(id)};`;

        await run_query(query);

        console.error(id);

        res.status(409).send(`<script>alert("Book updated successfully!"); window.location.href = "/books/update?id=${id}"; </script>`);
    } catch (err) {
        console.error(err);
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
