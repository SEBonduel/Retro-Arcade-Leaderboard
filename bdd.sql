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

INSERT INTO scores (player, game, score) VALUES
('AAA', 'pacman', 500000),
('BBB', 'pacman', 350000),
('CCC', 'tetris', 8000000),
('AAA', 'snake', 75000),
('DDD', 'breakout', 200000),
('BBB', 'donkeykong', 1000000);
