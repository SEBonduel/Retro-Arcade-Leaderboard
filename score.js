/**
 * Valide un score selon les règles métier anti-triche
 * @returns { { valid: boolean, reason?: string, status?: number } }
 */
function validateScore({ score, maxAllowedScore, lastSubmissionTime }) {
    if (score < 0) {
        return { valid: false, reason: 'negative_score', status: 400 };
    }

    if (score > maxAllowedScore) {
        return { valid: false, reason: 'score_above_max', status: 422 };
    }

    if (lastSubmissionTime) {
        const now = Date.now();
        const diffInSeconds = (now - new Date(lastSubmissionTime).getTime()) / 1000;
        if (diffInSeconds < 2) {
            return { valid: false, reason: 'cooldown_active', status: 429 };
        }
    }

    return { valid: true };
}

function sortLeaderboard(scores) {
    return [...scores].sort((a, b) => b.score - a.score);
}

module.exports = { validateScore, sortLeaderboard };