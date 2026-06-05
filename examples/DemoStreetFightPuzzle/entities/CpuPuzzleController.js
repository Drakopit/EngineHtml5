import { PuzzleConfig } from "../data/puzzleConfig.js";

// Very simple AI that picks a random column and rotation, then moves there and drops.
export class CpuPuzzleController {
    constructor(board, piece) {
        this.board = board;
        this.piece = piece;
        
        this.targetCol = 2;
        this.targetRot = 0;
        
        this.thinkTimer = 0;
        this.state = "THINKING"; // THINKING, MOVING, DROPPING
    }

    update(dt) {
        if (this.board.gameOver || !this.piece.gem1) return;

        this.thinkTimer -= dt;
        if (this.thinkTimer > 0) return;

        switch(this.state) {
            case "THINKING":
                this.targetCol = Math.floor(Math.random() * PuzzleConfig.COLS);
                this.targetRot = Math.floor(Math.random() * 4);
                this.state = "ROTATING";
                this.thinkTimer = 0.2; // Delay before taking action
                break;
                
            case "ROTATING":
                if (this.piece.rotIndex !== this.targetRot) {
                    this.piece.aiRotate();
                    this.thinkTimer = 0.1;
                } else {
                    this.state = "MOVING";
                    this.thinkTimer = 0.1;
                }
                break;
                
            case "MOVING":
                if (this.piece.col1 > this.targetCol) {
                    this.piece.aiMoveLeft();
                    this.thinkTimer = 0.1;
                } else if (this.piece.col1 < this.targetCol) {
                    this.piece.aiMoveRight();
                    this.thinkTimer = 0.1;
                } else {
                    this.state = "DROPPING";
                    this.thinkTimer = 0.05;
                }
                break;
                
            case "DROPPING":
                this.piece.aiDrop();
                this.thinkTimer = 0.05;
                // Once the piece locks, the Scene will give a new piece and the AI naturally resets
                // because we can check if piece.gem1 is not null and it's high up.
                // We'll reset state in the Scene when giving a new piece.
                break;
        }
    }

    reset() {
        this.state = "THINKING";
        this.thinkTimer = 0.5; // Wait a bit before moving new piece
    }
}
