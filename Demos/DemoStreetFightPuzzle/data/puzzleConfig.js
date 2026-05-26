export const PuzzleConfig = Object.freeze({
    ROWS: 12,
    COLS: 6,
    GEM_SIZE: 32,
    FALL_SPEED_NORMAL: 1.0, // rows per second (approx)
    FALL_SPEED_FAST: 10.0,
    LOCK_DELAY: 500, // ms before piece locks
    COLORS: ["red", "blue", "green", "yellow"],
    GARBAGE_TIMER_TURNS: 3, // Turns a garbage piece stays as garbage before turning normal
    BOARD_1_POS: { x: 50, y: 100 },
    BOARD_2_POS: { x: 550, y: 100 },
    FIGHTER_1_POS: { x: 300, y: 400 },
    FIGHTER_2_POS: { x: 500, y: 400 }
});
