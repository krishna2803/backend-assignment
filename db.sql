-- REMOVE FROM PROD!
DROP DATABASE IF EXISTS library;
CREATE DATABASE library;

USE library;

CREATE TABLE users(
    `user_id`       INT PRIMARY KEY AUTO_INCREMENT,
    `user_name`     VARCHAR(255) NOT NULL,
    `user_password` VARCHAR(255) NOT NULL,
    `user_phone`    CHAR(10)     NOT NULL UNIQUE,
    `user_email`    VARCHAR(255) NOT NULL UNIQUE,
    `user_address`  VARCHAR(255) NOT NULL,
    `user_role`     VARCHAR(255) NOT NULL DEFAULT 'client',
    `admin_request` VARCHAR(255)
);

-- dynamic search will search and try to find text content from
-- title, author, genre and summary
CREATE TABLE books(
    `book_id`       INT PRIMARY KEY AUTO_INCREMENT,
    `book_title`    VARCHAR(255) NOT NULL,
    `book_author`   VARCHAR(255) NOT NULL,
    `book_genre`    VARCHAR(255) NOT NULL, -- comma seperated
    `book_language` VARCHAR(255) NOT NULL,
    `book_summary`  TEXT NOT NULL,
    `book_count`    INT NOT NULL DEFAULT 1
--  `book_thumb`    VARCHAR(255) NOT NULL, -- book thumbnail path, TODO
--   also store files as: md5(file) to gaurantee unique files or is it? ;)
);

-- also use this to retrieve the history of the users' reservations
-- i pray this works as intended
CREATE TABLE reservations(
    `res_id`        INT PRIMARY KEY AUTO_INCREMENT,
    `user_id`       INT NOT NULL,
    `book_id`       INT NOT NULL,
    `status`        VARCHAR(255) NOT NULL DEFAULT 'pending',
    `count`         INT NOT NULL, -- store the book count of when the book was added
    `time`    TIMESTAMP NOT NULL DEFAULT NOW(),
    `fine`          NUMERIC(8,2) DEFAULT 0.00,
    -- NUMERIC is just an alias for DECIMAL in MySQL
    -- nine decimal digits into 4 bytes
    -- https://dev.mysql.com/doc/refman/8.4/en/precision-math-decimal-characteristics.html
    FOREIGN KEY (`user_id`)   REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (`book_id`)   REFERENCES books(book_id) ON DELETE CASCADE
);
