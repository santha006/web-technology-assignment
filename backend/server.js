require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'myapp'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL database.');
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: true,
}));

// Serve static files (public/styles.css)
app.use(express.static(path.join(__dirname, 'public')));

// Serve registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Handle registration
app.post('/register', (req, res) => {
    const { firstname, lastname, username, password, cpassword } = req.body;

    if (!firstname || !lastname || !username || !password || !cpassword) {
        return res.status(400).send('<h3 style="color:red;">All fields are required. <a href="/">Try again</a></h3>');
    }

    if (password !== cpassword) {
        return res.send('<h3 style="color:red;">Passwords do not match. <a href="/">Try again</a></h3>');
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            return res.send('<h3 style="color:red;">Username already taken. <a href="/">Try again</a></h3>');
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const insertQuery = 'INSERT INTO users (firstname, lastname, username, password) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [firstname, lastname, username, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Insert error');
            }
            res.send('<h3 style="color:green;">Registration successful! <a href="/">Go to Login</a></h3>');
        });
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
