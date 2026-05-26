import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { Input } from "../../CoreCross/Input/Input.js";

import { PuzzleConfig } from "./data/puzzleConfig.js";
import { Characters } from "./data/characters.js";
import { PuzzleGem, GemType } from "./entities/PuzzleGem.js";
import { PuzzleBoard } from "./entities/PuzzleBoard.js";
import { FallingPiece } from "./entities/FallingPiece.js";
import { PuzzleFighter, FighterState } from "./entities/PuzzleFighter.js";
import { CpuPuzzleController } from "./entities/CpuPuzzleController.js";
import { PuzzleHUD } from "./ui/PuzzleHUD.js";

export class StreetFightPuzzleScene extends Level {
    constructor() {
        super();
        this.caption = "Street Fight Puzzle Demo";
        this.TelaId = "StreetFightPuzzle";
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, 800, 600);
        this.draw = new Draw(this.screen);

        if (this.screen.Canvas) {
            this.screen.Canvas.tabIndex = 0;
            this.screen.Canvas.focus();
        }

        // P1 Setup
        this.board1 = new PuzzleBoard(PuzzleConfig.BOARD_1_POS.x, PuzzleConfig.BOARD_1_POS.y, true);
        this.piece1 = new FallingPiece(this.board1, { left: 'KeyA', right: 'KeyD', rotate: 'KeyW', drop: 'KeyS' }, false);
        this.fighter1 = new PuzzleFighter(PuzzleConfig.FIGHTER_1_POS.x, PuzzleConfig.FIGHTER_1_POS.y, Characters.BLAZE);
        
        // P2 Setup (CPU)
        this.board2 = new PuzzleBoard(PuzzleConfig.BOARD_2_POS.x, PuzzleConfig.BOARD_2_POS.y, false);
        this.piece2 = new FallingPiece(this.board2, null, true);
        this.fighter2 = new PuzzleFighter(PuzzleConfig.FIGHTER_2_POS.x, PuzzleConfig.FIGHTER_2_POS.y, Characters.KIRA);
        this.cpuController = new CpuPuzzleController(this.board2, this.piece2);

        this.hud = new PuzzleHUD();
        
        this.p1NextGems = [];
        this.p2NextGems = [];
        
        this.gameEnded = false;
        
        this.bindEvents();

        // Generate initial next pieces
        this.p1NextGems = [this.generateRandomGem(), this.generateRandomGem()];
        this.p2NextGems = [this.generateRandomGem(), this.generateRandomGem()];
        
        this.spawnPiece(1);
        this.spawnPiece(2);

        super.OnStart();
    }

    bindEvents() {
        this.board1.onSendGarbage = (amount) => {
            this.board2.receiveGarbage(amount);
        };
        this.board1.onCombo = (combo, amt) => {
            this.fighter1.setState(FighterState.ATTACK, 0.5);
            this.fighter2.setState(FighterState.HIT, 0.5);
            this.hud.addFloatingText(PuzzleConfig.FIGHTER_1_POS.x, PuzzleConfig.FIGHTER_1_POS.y - 50, `Combo x${combo}!`, "#ff0000");
        };

        this.board2.onSendGarbage = (amount) => {
            this.board1.receiveGarbage(amount);
        };
        this.board2.onCombo = (combo, amt) => {
            this.fighter2.setState(FighterState.ATTACK, 0.5);
            this.fighter1.setState(FighterState.HIT, 0.5);
            this.hud.addFloatingText(PuzzleConfig.FIGHTER_2_POS.x, PuzzleConfig.FIGHTER_2_POS.y - 50, `Combo x${combo}!`, "#4444ff");
        };
    }

    generateRandomGem() {
        const isCrash = Math.random() < 0.15; // 15% chance of crash gem
        const type = isCrash ? GemType.CRASH : GemType.NORMAL;
        const color = PuzzleConfig.COLORS[Math.floor(Math.random() * PuzzleConfig.COLORS.length)];
        return new PuzzleGem(type, color);
    }

    spawnPiece(playerNum) {
        if (playerNum === 1) {
            this.piece1.setGems(this.p1NextGems[0], this.p1NextGems[1]);
            this.p1NextGems = [this.generateRandomGem(), this.generateRandomGem()];
        } else {
            this.piece2.setGems(this.p2NextGems[0], this.p2NextGems[1]);
            this.p2NextGems = [this.generateRandomGem(), this.generateRandomGem()];
            this.cpuController.reset();
        }
        this.hud.setNextPieces(this.p1NextGems, this.p2NextGems);
    }

    OnUpdate(dt) {
        // Fallback for dt if undefined
        const delta = dt ?? 0.016;

        if (this.gameEnded) {
            if (Input.GetKeyDown('KeyR')) {
                window.location.reload();
            }
            return;
        }

        // Logic P1
        if (!this.piece1.locked && !this.board1.gameOver) {
            this.piece1.update(delta);
        } else if (this.piece1.locked && !this.board1.gameOver) {
            this.spawnPiece(1);
        }

        // Logic P2
        if (!this.piece2.locked && !this.board2.gameOver) {
            this.piece2.update(delta);
            this.cpuController.update(delta);
        } else if (this.piece2.locked && !this.board2.gameOver) {
            this.spawnPiece(2);
        }

        this.fighter1.update(delta);
        this.fighter2.update(delta);
        this.hud.update(delta);

        this.hud.p1Score = this.board1.score;
        this.hud.p2Score = this.board2.score;

        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.board1.gameOver && !this.gameEnded) {
            this.gameEnded = true;
            this.fighter1.setState(FighterState.LOSE);
            this.fighter2.setState(FighterState.WIN);
        } else if (this.board2.gameOver && !this.gameEnded) {
            this.gameEnded = true;
            this.fighter1.setState(FighterState.WIN);
            this.fighter2.setState(FighterState.LOSE);
        }
    }

    OnDrawn() {
        if (!this.screen) return;
        this.screen.Refresh();
        
        const ctx = this.screen.Context;

        this.board1.draw(ctx);
        this.piece1.draw(ctx);

        this.board2.draw(ctx);
        this.piece2.draw(ctx);

        this.fighter1.draw(ctx);
        this.fighter2.draw(ctx);

        this.hud.draw(ctx);

        if (this.gameEnded) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, 800, 600); // Overlay

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            const msg = this.board1.gameOver ? "CPU WINS!" : "PLAYER 1 WINS!";
            ctx.fillText(msg, 400, 300);

            ctx.font = "20px Arial";
            ctx.fillText("Press R to Restart", 400, 350);
            ctx.textAlign = "left";
        }
    }
}
