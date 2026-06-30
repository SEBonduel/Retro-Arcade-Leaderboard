CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player VARCHAR(50) NOT NULL,
    game VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_game_score (game, score),
    INDEX idx_player (player),
    INDEX idx_player_game_created (player, game, created_at)
);
