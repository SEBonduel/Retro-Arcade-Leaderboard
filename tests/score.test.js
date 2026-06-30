const { validateScore, sortLeaderboard } = require('../score');

describe('Règles Métier - Anti-triche et Classement', () => {

    test('un score valide est accepté', () => {
        const result = validateScore({
            score: 500,
            maxAllowedScore: 999999,
            lastSubmissionTime: null
        });

        expect(result.valid).toBe(true);
    });

    test('un score supérieur au maximum du jeu est rejeté (422)', () => {
        const result = validateScore({
            score: 1500000,
            maxAllowedScore: 999999, // Max Pacman
            lastSubmissionTime: null
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('score_above_max');
        expect(result.status).toBe(422);
    });

    test('le cooldown rejette une soumission trop rapprochée (< 2s) (429)', () => {
        const uneSecondeAuparavant = Date.now() - 1000;

        const result = validateScore({
            score: 500,
            maxAllowedScore: 999999,
            lastSubmissionTime: uneSecondeAuparavant
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('cooldown_active');
        expect(result.status).toBe(429);
    });

    test('le classement est bien trié du meilleur au moins bon', () => {
        const scoresBruts = [
            { player: 'BBB', score: 300 },
            { player: 'AAA', score: 900 },
            { player: 'CCC', score: 600 }
        ];

        const resultatTrie = sortLeaderboard(scoresBruts);

        expect(resultatTrie[0].score).toBe(900);
        expect(resultatTrie[1].score).toBe(600);
        expect(resultatTrie[2].score).toBe(300);
    });
});