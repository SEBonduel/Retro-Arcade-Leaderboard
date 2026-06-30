import http from 'k6/http';
import { check, sleep } from 'k6';

// Monte progressivement en charge puis redescend
export const options = {
    stages: [
        { duration: '15s', target: 10 },   // monte a 10 utilisateurs en 15s
        { duration: '30s', target: 50 },   // monte a 50 utilisateurs en 30s
        { duration: '30s', target: 50 },   // reste a 50 pendant 30s
        { duration: '15s', target: 0 },    // redescend a 0
    ],
};

const BASE_URL = 'http://localhost:3001';

const GAMES = ['pacman', 'tetris', 'snake', 'breakout', 'donkeykong'];
const PLAYERS = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomScore(game) {
    const maxScores = {
        pacman: 999999,
        tetris: 9999999,
        snake: 99999,
        breakout: 896980,
        donkeykong: 1247700,
    };
    return Math.floor(Math.random() * maxScores[game]);
}

export default function () {
    // 1. Soumettre un score
    const game = randomItem(GAMES);
    const payload = JSON.stringify({
        player: randomItem(PLAYERS),
        game: game,
        score: randomScore(game),
    });

    const postRes = http.post(`${BASE_URL}/scores`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    check(postRes, {
        'score soumis (201)': (r) => r.status === 201,
    });

    // 2. Consulter le classement
    const getRes = http.get(`${BASE_URL}/leaderboard/${game}?limit=10`);

    check(getRes, {
        'leaderboard ok (200)': (r) => r.status === 200,
    });

    // 3. Consulter un joueur
    const playerRes = http.get(`${BASE_URL}/players/${randomItem(PLAYERS)}`);

    check(playerRes, {
        'joueur ok (200 ou 404)': (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.5);
}
