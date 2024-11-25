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

        // Ensure the user table exists
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS userinfo (
            userID INT AUTO_INCREMENT PRIMARY KEY,   -- Primary Key
            username VARCHAR(255) NOT NULL UNIQUE,   -- Username (Unique)
            password VARCHAR(255) NOT NULL,          -- Password
            profilepic VARCHAR(255) DEFAULT 'avatar.png' -- Default profile picture
            )`;
        await queryDB(createTableQuery);

        // Insert the new user
        const insertUserQuery = `
            INSERT INTO userinfo (username, password) 
            VALUES (?, ?)`;
        await queryDB(mysql.format(insertUserQuery, [username, password]));

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

app.post('/reserveTable', async (req, res) => {
    try {
        const username = req.cookies.username; // Retrieve username from cookies
        const table = req.body.table; // Retrieve selected table from the request body

        if (!username) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!table) {
            return res.status(400).json({ error: "No table selected" });
        }

        // Get the userID based on the username
        const getUserIDQuery = `SELECT userID FROM userinfo WHERE username = ?`;
        const userResult = await queryDB(mysql.format(getUserIDQuery, [username]));

        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userID = userResult[0].userID;

        // Insert the reservation into the receipt table
        const insertReceiptQuery = `
            INSERT INTO receipt (userID, tableID, totalPrice) VALUES (?, ?, ?)
        `;
        const result = await queryDB(mysql.format(insertReceiptQuery, [userID, table, 0.0])); // Default totalPrice to 0.0 initially

        // Get the receiptID of the newly inserted record
        const receiptID = result.insertId;

        // Send the receiptID back in the response
        res.status(200).json({ success: "Table reserved successfully!", receiptID: receiptID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while reserving the table" });
    }
});

app.post('/addOrder', async (req, res) => {
    try {
        const { receiptID, menuID } = req.body;

        if (!receiptID || !menuID) {
            return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
        }

        // เพิ่มคำสั่งซื้อในตาราง order
        const insertOrderQuery = `
            INSERT INTO \`order\` (receiptID, menuID) 
            VALUES (?, ?)
        `;
        await queryDB(mysql.format(insertOrderQuery, [receiptID, menuID]));

        res.status(200).json({ success: true, message: "เพิ่มคำสั่งซื้อสำเร็จ!" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดขณะเพิ่มคำสั่งซื้อ" });
    }
});

app.get('/getBill/:receiptID', async (req, res) => {
    const receiptID = req.params.receiptID;

    try {
        // ดึงข้อมูลจากตาราง order โดยใช้ receiptID
        const orderQuery = `
            SELECT o.menuID, m.menuName, m.menuPrice
            FROM \`order\` o
            JOIN menu m ON o.menuID = m.menuID
            WHERE o.receiptID = ?
        `;
        
        const orders = await queryDB(mysql.format(orderQuery, [receiptID]));

        if (orders.length === 0) {
            return res.json({ error: "No orders found for this receipt ID" });
        }

        // คำนวณราคาทั้งหมด
        let totalPrice = 0;
        orders.forEach(order => {
            totalPrice += order.menuPrice; // คำนวณรวมราคาเมนูทั้งหมด
        });

        // อัปเดตค่า totalPrice ในตาราง receipt
        const updateReceiptQuery = `
            UPDATE receipt
            SET totalPrice = ?
            WHERE receiptID = ?
        `;
        await queryDB(mysql.format(updateReceiptQuery, [totalPrice, receiptID]));

        // ส่งข้อมูลกลับไปยังคลื่น
        res.json({ orders, totalPrice });
    } catch (error) {
        console.error("Error fetching bill data:", error);
        res.status(500).json({ error: "An error occurred while fetching the bill" });
    }
});

app.get('/getOrderHistory/:username', async (req, res) => {
    const username = req.params.username;

    try {
        // ดึง userID จาก username
        const getUserIDQuery = `SELECT userID FROM userinfo WHERE username = ?`;
        const userResult = await queryDB(mysql.format(getUserIDQuery, [username]));

        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userID = userResult[0].userID;

        // ดึงข้อมูลใบเสร็จจาก receipt table โดยการเชื่อมโยงกับ userID
        const receiptQuery = `
            SELECT r.receiptID, r.tableID, r.totalPrice
            FROM receipt r
            WHERE r.userID = ?
            ORDER BY r.receiptID DESC
            LIMIT 3;
        `;
        
        const receipts = await queryDB(mysql.format(receiptQuery, [userID]));

        // ส่งข้อมูลกลับไปให้ client
        res.json(receipts);
    } catch (error) {
        console.error("Error fetching order history:", error);
        res.status(500).json({ error: "An error occurred while fetching order history" });
    }
});





app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});