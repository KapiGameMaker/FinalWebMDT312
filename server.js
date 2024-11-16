const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'public/img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// ใส่ค่าตามที่เราตั้งไว้ใน mysql
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "Final"
})

con.connect(err => {
    if(err) throw(err);
    else{
        console.log("MySQL connected");
    }
})

const queryDB = (sql) => {
    return new Promise((resolve,reject) => {
        // query method
        con.query(sql, (err,result, fields) => {
            if (err) reject(err);
            else
                resolve(result)
        })
    })
}

app.post('/regisDB', async (req, res) => {
    try {
        // Input Validation
        const username = req.body.username;
        const password = req.body.password;
        const repassword = req.body.repassword;

        if (password !== repassword) {
            return res.status(400).send("Passwords do not match!");
        }

        // Current Date/Time
        const now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Ensure the user table exists
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS userinfo (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                date DATETIME,
                profilepic VARCHAR(255) DEFAULT 'avatar.png'
            )`;
        await queryDB(createTableQuery);

        // Insert the new user
        const insertUserQuery = `
            INSERT INTO userinfo (username, password, date) 
            VALUES (?, ?, ?)`;
        await queryDB(mysql.format(insertUserQuery, [username, password, now_date]));

        // Redirect to the login page
        res.redirect('/login.html');
    } catch (error) {
        console.error(error);
        res.status(500).send("Registration failed. Please try again.");
    }
});


app.post('/profilepic', (req,res) => {
    let upload = multer({
        storage: storage,
        fileFilter: imageFilter,
    }).single('avatar');

    upload(req, res, async (err) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send("Please send an image to upload!");
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        }

        res.cookie('img', req.file.filename);
        await updateImg(req.cookies.username, req.file.filename);
        return res.redirect('membership.html')
    });
})

const updateImg = async (username, filen) => {
    let query = `UPDATE userinfo SET profilepic = '${filen}' WHERE username = '${username}'`
    await queryDB(query);
}

app.get('/logout', (req,res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('index.html');
})

app.post('/checkLogin', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        // Query to check if the username and password exist in the database
        const query = `SELECT username, password FROM userinfo WHERE username = ? AND password = ?`;
        const result = await queryDB(mysql.format(query, [username, password]));

        if (result.length > 0) {
            // Credentials are correct
            res.cookie('username', username); // Stores the username
            return res.redirect('/membership.html');
        } else {
            // Credentials are incorrect
            return res.redirect('/login.html?error=1');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Login failed. Please try again.");
    }
});

app.get('/getUserData', (req, res) => {
    const username = req.cookies.username;

    if (username) {
        res.json({ username: username });
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
});


app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});