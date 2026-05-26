import { Draw } from "../../../Core2D/Graphics/Draw.js";
import { PuzzleConfig } from "../data/puzzleConfig.js";
import { PuzzleGem, GemType } from "./PuzzleGem.js";

export class PuzzleBoard {
    constructor(x, y, isPlayer1 = true) {
        this.x = x;
        this.y = y;
        this.isPlayer1 = isPlayer1;
        this.grid = [];
        this.score = 0;
        this.combo = 0;
        this.gameOver = false;
        
        // Callback to notify the scene about garbage sent
        this.onSendGarbage = null;
        // Callback for visual feedback on fighter
        this.onCombo = null;

        this.initGrid();
    }

    initGrid() {
        this.grid = [];
        for (let r = 0; r < PuzzleConfig.ROWS; r++) {
            let row = [];
            for (let c = 0; c < PuzzleConfig.COLS; c++) {
                row.push(null);
            }
            this.grid.push(row);
        }
    }

    // Attempt to place a piece on the board. Returns false if blocked.
    lockPiece(piece) {
        if (this.gameOver) return false;

        // Gem 1
        if (piece.row1 >= 0 && piece.row1 < PuzzleConfig.ROWS) {
            if (this.grid[piece.row1][piece.col1] !== null) {
                this.gameOver = true;
            } else {
                this.grid[piece.row1][piece.col1] = piece.gem1;
            }
        } else {
            this.gameOver = true;
        }

        // Gem 2
        if (piece.row2 >= 0 && piece.row2 < PuzzleConfig.ROWS) {
            if (this.grid[piece.row2][piece.col2] !== null) {
                this.gameOver = true;
            } else {
                this.grid[piece.row2][piece.col2] = piece.gem2;
            }
        } else {
            this.gameOver = true;
        }

        if (this.gameOver) return false;

        // Start processing logic (gravity -> match -> repeat)
        this.combo = 0;
        this.processBoard();
        
        // Decrease garbage timers
        this.tickGarbage();

        return true;
    }

    tickGarbage() {
        for (let r = 0; r < PuzzleConfig.ROWS; r++) {
            for (let c = 0; c < PuzzleConfig.COLS; c++) {
                const gem = this.grid[r][c];
                if (gem && gem.type === GemType.GARBAGE) {
                    gem.timer--;
                    if (gem.timer <= 0) {
                        gem.type = GemType.NORMAL; // Turns into a normal gem (could randomize color)
                        gem.color = PuzzleConfig.COLORS[Math.floor(Math.random() * PuzzleConfig.COLORS.length)];
                    }
                }
            }
        }
    }

    receiveGarbage(amount) {
        // Drop garbage gems from the top
        let placed = 0;
        for (let c = 0; c < PuzzleConfig.COLS; c++) {
            if (placed >= amount) break;
            // Find highest empty spot
            let r = 0;
            while (r < PuzzleConfig.ROWS && this.grid[r][c] === null) {
                r++;
            }
            if (r > 0) {
                this.grid[r - 1][c] = new PuzzleGem(GemType.GARBAGE, "garbage", PuzzleConfig.GARBAGE_TIMER_TURNS);
                placed++;
            }
        }
        // Force gravity if needed
        this.applyGravity();
    }

    processBoard() {
        let changed = false;
        
        do {
            changed = false;
            if (this.applyGravity()) changed = true;
            if (this.checkMatches()) changed = true;
        } while (changed);
    }

    applyGravity() {
        let moved = false;
        for (let c = 0; c < PuzzleConfig.COLS; c++) {
            for (let r = PuzzleConfig.ROWS - 1; r > 0; r--) {
                if (this.grid[r][c] === null) {
                    // Look up for a gem to pull down
                    for (let above = r - 1; above >= 0; above--) {
                        if (this.grid[above][c] !== null) {
                            this.grid[r][c] = this.grid[above][c];
                            this.grid[above][c] = null;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }
        return moved;
    }

    checkMatches() {
        let matched = false;
        let gemsToDestroy = new Set(); // Using Set to avoid duplicates (store string "r,c")

        for (let r = 0; r < PuzzleConfig.ROWS; r++) {
            for (let c = 0; c < PuzzleConfig.COLS; c++) {
                const gem = this.grid[r][c];
                if (gem && gem.type === GemType.CRASH) {
                    // Flood fill to find all connected normal gems of same color
                    let connected = this.getConnectedGems(r, c, gem.color);
                    // A crash gem destroys itself and connected normal gems
                    if (connected.length > 1) { // 1 is just the crash gem itself
                        connected.forEach(pos => gemsToDestroy.add(`${pos.r},${pos.c}`));
                        matched = true;
                    }
                }
            }
        }

        if (matched) {
            this.combo++;
            let destroyedCount = gemsToDestroy.size;
            
            gemsToDestroy.forEach(posStr => {
                const [r, c] = posStr.split(',').map(Number);
                this.grid[r][c] = null;
            });

            // Score calculation
            const points = destroyedCount * 10 * this.combo;
            this.score += points;

            // Garbage calculation (e.g. 1 garbage per 3 gems destroyed + bonus for combos)
            const garbageAmt = Math.floor(destroyedCount / 3) + (this.combo > 1 ? this.combo : 0);
            
            if (garbageAmt > 0) {
                if (this.onSendGarbage) this.onSendGarbage(garbageAmt);
                if (this.onCombo) this.onCombo(this.combo, garbageAmt);
            }
        }

        return matched;
    }

    getConnectedGems(startR, startC, targetColor) {
        let connected = [];
        let visited = new Set();
        let queue = [{ r: startR, c: startC }];
        
        while (queue.length > 0) {
            const { r, c } = queue.shift();
            const key = `${r},${c}`;
            
            if (visited.has(key)) continue;
            visited.add(key);

            const gem = this.grid[r][c];
            if (!gem || gem.color !== targetColor || gem.type === GemType.GARBAGE) continue;

            // Only normal and crash gems of same color can be linked
            connected.push({ r, c });

            // Check neighbors
            if (r > 0) queue.push({ r: r - 1, c });
            if (r < PuzzleConfig.ROWS - 1) queue.push({ r: r + 1, c });
            if (c > 0) queue.push({ r, c: c - 1 });
            if (c < PuzzleConfig.COLS - 1) queue.push({ r, c: c + 1 });
        }
        
        return connected;
    }

    isValidPos(r, c) {
        return r >= 0 && r < PuzzleConfig.ROWS && c >= 0 && c < PuzzleConfig.COLS && this.grid[r][c] === null;
    }

    draw(ctx) {
        // Draw board background
        const width = PuzzleConfig.COLS * PuzzleConfig.GEM_SIZE;
        const height = PuzzleConfig.ROWS * PuzzleConfig.GEM_SIZE;
        
        ctx.fillStyle = "#222222";
        ctx.fillRect(this.x, this.y, width, height);
        
        ctx.strokeStyle = this.isPlayer1 ? "#4444aa" : "#aa4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 2, this.y - 2, width + 4, height + 4);

        // Draw grid lines
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 1; c < PuzzleConfig.COLS; c++) {
            ctx.moveTo(this.x + c * PuzzleConfig.GEM_SIZE, this.y);
            ctx.lineTo(this.x + c * PuzzleConfig.GEM_SIZE, this.y + height);
        }
        for (let r = 1; r < PuzzleConfig.ROWS; r++) {
            ctx.moveTo(this.x, this.y + r * PuzzleConfig.GEM_SIZE);
            ctx.lineTo(this.x + width, this.y + r * PuzzleConfig.GEM_SIZE);
        }
        ctx.stroke();

        // Draw gems
        for (let r = 0; r < PuzzleConfig.ROWS; r++) {
            for (let c = 0; c < PuzzleConfig.COLS; c++) {
                if (this.grid[r][c] !== null) {
                    const gx = this.x + c * PuzzleConfig.GEM_SIZE;
                    const gy = this.y + r * PuzzleConfig.GEM_SIZE;
                    this.grid[r][c].render(ctx, gx, gy);
                }
            }
        }
    }
}
