const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "miyue",
    database: "nodejs"
});

connection.connect(function(error){
    if(error) throw error;
    else console.log("Connection succeeded!");
});
