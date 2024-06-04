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
    `user_role`     ENUM('client', 'admin') DEFAULT 'client'
);

-- dynamic search will search and try to find text content from
-- title, author, genre and summary
CREATE TABLE books(
    `book_id`       INT PRIMARY KEY AUTO_INCREMENT,
    `book_title`    VARCHAR(255) NOT NULL,
    `book_author`   VARCHAR(255) NOT NULL,
    `book_genre`    VARCHAR(255) NOT NULL, -- comma seperated
    `book_language` VARCHAR(255) NOT NULL,
    `book_summary`  TEXT,
    `book_count`    INT NOT NULL
--  `book_thumb`    VARCHAR(255) NOT NULL, -- book thumbnail path, TODO
--   also store files as: md5(file) to gaurantee unique files or is it? ;)
);

-- also use this to retrieve the history of the users' reservations
-- i pray this works as intended
CREATE TABLE reservations(
    `res_id`        INT PRIMARY KEY AUTO_INCREMENT,
    `user_id`       INT NOT NULL,
    `book_id`       INT NOT NULL,
    `status`        ENUM('approved','pending'),
    `start_date`    TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (`user_id`)   REFERENCES users(user_id),
    FOREIGN KEY (`book_id`)   REFERENCES books(book_id)
);

-- fine management
CREATE TABLE fines(
    `fine_id`       INT PRIMARY KEY AUTO_INCREMENT,
    `res_id`        INT NOT NULL,
    `fine_amount`   FLOAT NOT NULL DEFAULT 0.0,
    FOREIGN KEY (`res_id`)   REFERENCES reservations(res_id)
);

