const express = require('express');
const mysql = require('mysql2');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3001;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promise = db.promise();

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ "status": "ok" });
});

app.get('/games', async (req, res) => {
    try {
        const [games] = await promise.query('SELECT name, max_score FROM games');
        res.status(200).json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/leaderboard/:game', async (req, res) => {
    const gameName = req.params.game;

    let limit = parseInt(req.query.limit, 10) || 10;
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 10;

    try {
        const [game] = await promise.query('SELECT id FROM games WHERE name = ?', [gameName]);
        if (game.length === 0) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameId = game[0].id;

        const query = `
            SELECT player_name as player, score 
            FROM scores 
            WHERE game_id = ? 
            ORDER BY score DESC 
            LIMIT ?
        `;
        const [leaderboard] = await promise.query(query, [gameId, limit]);

        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/players/:player', async (req, res) => {
    const playerName = req.params.player;

    try {
        const query = `
            SELECT g.name AS game, MAX(s.score) AS max_score
            FROM scores s
            JOIN games g ON s.game_id = g.id
            WHERE s.player_name = ?
            GROUP BY g.name
        `;
        const [playerScores] = await promise.query(query, [playerName]);
        res.status(200).json(playerScores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/scores', async (req, res) => {
    const { player, game, score } = req.body;



    if (!player || !game || score === undefined) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const [gameResult] = await promise.query('SELECT id, max_score FROM games WHERE name = ?', [game]);
        if (gameResult.length === 0) {
            incrementRejectedMetric('unknown_game');
            return res.status(400).json({ error: "Game does not exist" });
        }

        const gameId = gameResult[0].id;
        const maxAllowedScore = gameResult[0].max_score;

        if (score < 0) {
            incrementRejectedMetric('negative_score');
            return res.status(400).json({ error: "Score cannot be negative" });
        }

        if (score > maxAllowedScore) {
            incrementRejectedMetric('score_above_max');
            return res.status(422).json({ error: "Score exceeds maximum allowed for this game" });
        }

        const [cooldownResult] = await promise.query(
            `SELECT id FROM scores 
             WHERE player_name = ? AND game_id = ? 
             AND submitted_at >= NOW() - INTERVAL 2 SECOND 
             LIMIT 1`,
            [player, gameId]
        );

        if (cooldownResult.length > 0) {
            incrementRejectedMetric('cooldown_active');
            return res.status(429).json({ error: "Too many requests. Cooldown of 2 seconds active." });
        }

        await promise.query(
            'INSERT INTO scores (player_name, game_id, score) VALUES (?, ?, ?)',
            [player, gameId, score]
        );

        const [rankResult] = await promise.query(
            'SELECT COUNT(*) + 1 AS rank FROM scores WHERE game_id = ? AND score > ?',
            [gameId, score]
        );

        const rank = rankResult[0].rank;

        res.status(201).json({ rank: rank });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});