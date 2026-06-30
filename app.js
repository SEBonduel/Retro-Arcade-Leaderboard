const express = require('express')
const mysql = require('mysql2')
const app = express()
require('dotenv').config();

const port = process.env.PORT || 3001

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(express.json())

app.get('/health', (req, res) => {
    res.status(200).json({
        "status": "ok"
    })
});

app.get('/scores', (req, res) => {
    db.query('SELECT * FROM scores', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.status(200).json(results)
    })
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})