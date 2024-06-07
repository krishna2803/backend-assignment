const mysql = require('mysql2');
const dbConn = require('../database.js');
const jwt = require('jsonwebtoken');

const run_query = async query => {
    // console.log('Running query: ', query);
    return await dbConn.promise().query(query);
}

const view_books = async (req, res) => {
    try {
        const books = await run_query('SELECT * FROM books');
        const cookie = req.headers.cookie;
        const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);

        const filter = req.query.q;
        
        if (!filter || filter.length === 0) {
            res.render('books', { books: books[0], user: decoded });
            return;
        }

        const filtered_books = books[0].filter(book => {
            return (
                book.book_title.toLowerCase().includes(filter.toLowerCase()) ||
                book.book_author.toLowerCase().includes(filter.toLowerCase()) ||
                book.book_language.toLowerCase().includes(filter.toLowerCase()) ||
                book.book_genre.toLowerCase().includes(filter.toLowerCase()) ||
                book.book_summary.toLowerCase().includes(filter.toLowerCase())
            );
        });
        res.render('books', { books: filtered_books, user: decoded });

    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const create = async (req, res) => {
    try {
        const { title, author, genre, language, summary, count } = req.body;

        if (count <= 0) {
            res.status(409).send(`<script>alert("Please add a postive integer number of books"); window.location.href = "/books/create"; </script>`);
            return;
        }

        const query = `INSERT INTO books (book_title, book_author, book_genre, book_language, book_summary, book_count) VALUES(${mysql.escape(title)}, ${mysql.escape(author)}, ${mysql.escape(genre)}, ${mysql.escape(language)}, ${mysql.escape(summary)}, ${mysql.escape(count)});`;
        await run_query(query);

        res.status(409).send(`<script>alert("Book added successfully!"); window.location.href = "/books/create"; </script>`);
        // res.send('Book added successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const request_books = async (req, res) => {
    try {
        const { id } = req.body;
        const cookie = req.headers.cookie;
        const decoded = jwt.verify(cookie.split('token=')[1], process.env.JWTKEY);
        const user_id = decoded.id;

        const query = `INSERT INTO reservations (user_id, book_id, count) SELECT ${mysql.escape(user_id)}, ${mysql.escape(id)}, book_count FROM books where book_id = ${mysql.escape(id)};`;
        await run_query(query);

        res.send('Request sent successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const view_requests = async (req, res) => {
    try {
        const query = `SELECT * FROM reservations r JOIN users u ON r.user_id = u.user_id JOIN books b ON r.book_id = b.book_id;`;
        const result = await run_query(query);

        res.render('bookrequests', { requests: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const return_books = async (req, res) => {
    try {
        const { id } = req.body;

        const query = `UPDATE reservations SET status = 'returned' WHERE res_id IN (${mysql.escape(id)});`;
        await run_query(query);

        // increase book count
        const reservations = (await run_query(`SELECT * FROM reservations WHERE res_id IN (${mysql.escape(id)}) AND status = 'returned';`))[0];
        reservations.forEach(async (reservation) => {
            const book_query = `SELECT * FROM books WHERE book_id = ${mysql.escape(reservation.book_id)}`;
            const book = (await run_query(book_query))[0][0];
            const new_count = book.book_count + 1;
            const update_book_query = `UPDATE books SET book_count = ${mysql.escape(new_count)} WHERE book_id = ${mysql.escape(reservation.book_id)}`;
            await run_query(update_book_query);
        });

        res.send('Book(s) returned successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const approve_requests = async (req, res) => {
    try {
        const { id } = req.body;

        // decrease book count
        const reservations = (await run_query(`SELECT * FROM reservations WHERE res_id IN (${mysql.escape(id)})`))[0];
        reservations.forEach(async (reservation) => {
            const book_query = `SELECT * FROM books WHERE book_id = ${mysql.escape(reservation.book_id)}`;
            const book = (await run_query(book_query))[0][0];
            if (book.book_count <= 0) {
                res.send('Book not available!');
                return;
            }
            const new_count = book.book_count - 1;
            const update_book_query = `UPDATE books SET book_count = ${mysql.escape(new_count)} WHERE book_id = ${mysql.escape(reservation.book_id)}`;
            await run_query(update_book_query);
        });
        
        const update_query = `UPDATE reservations SET status = 'approved' WHERE res_id IN (${mysql.escape(id)});`;
        await run_query(update_query);


        res.send('Request(s) approved successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const deny_requests = async (req, res) => {
    try {
        const { id } = req.body;

        const update_query = `UPDATE reservations SET status = 'denied' WHERE res_id IN (${mysql.escape(id)});`;
        await run_query(update_query);

        res.send('Request(s) denied successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

const delete_books = async (req, res) => {
    try {
        const { id } = req.body;

        const check_reservations_query = `SELECT * FROM reservations WHERE book_id IN (${mysql.escape(id)}) AND (status = 'pending' OR status = 'approved');`;
        const check_reservations_result = await run_query(check_reservations_query);
        if (check_reservations_result[0].length > 0) {
            res.status(409).send('Cannot delete books with pending or approved reservations');
            return;
        }

        const query = `DELETE FROM books WHERE book_id IN (${mysql.escape(id)});`;
        await run_query(query);

        res.send('Book(s) deleted successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Some error occured :(');
    }
};

module.exports = {
    view_books,
    create,
    request_books,
    view_requests,
    return_books,
    approve_requests,
    deny_requests,
    delete_books
}
