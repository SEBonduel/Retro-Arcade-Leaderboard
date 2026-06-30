const express = require('express')
const app = express()
require('dotenv').config();

const port = process.env.API_PORT

app.use(express.json())

app.get('/health', (req, res) => [
    res.status(200).json({
        "status": "ok"
    })
]);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})