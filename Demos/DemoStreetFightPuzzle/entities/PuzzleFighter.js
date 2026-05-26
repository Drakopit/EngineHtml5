import { Draw } from "../../../Core2D/Graphics/Draw.js";

const FIGHTER_SIZE = 64;

export const FighterState = {
    IDLE: 0,
    ATTACK: 1,
    HIT: 2,
    WIN: 3,
    LOSE: 4
};

export class PuzzleFighter {
    constructor(x, y, characterData) {
        this.x = x;
        this.y = y;
        this.data = characterData;
        
        this.state = FighterState.IDLE;
        this.stateTimer = 0;
        
        // Procedural visual variations based on state
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setState(newState, duration = 0.5) {
        if (this.state === FighterState.WIN || this.state === FighterState.LOSE) return;
        this.state = newState;
        this.stateTimer = duration;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    update(dt) {
        if (this.stateTimer > 0) {
            this.stateTimer -= dt;
            
            // Jitter/Shake if hit
            if (this.state === FighterState.HIT) {
                this.offsetX = (Math.random() - 0.5) * 10;
                this.offsetY = (Math.random() - 0.5) * 10;
            } 
            // Lunge forward if attack
            else if (this.state === FighterState.ATTACK) {
                // Determine direction based on side of screen roughly (player 1 vs 2)
                const dir = this.x < 400 ? 1 : -1;
                this.offsetX = dir * 20 * (this.stateTimer / 0.5); // Spring back
            }

            if (this.stateTimer <= 0) {
                this.state = FighterState.IDLE;
                this.offsetX = 0;
                this.offsetY = 0;
            }
        }
        
        if (this.state === FighterState.WIN) {
            this.offsetY = Math.sin(Date.now() / 100) * 10; // Jump up and down
        } else if (this.state === FighterState.LOSE) {
            this.offsetY = FIGHTER_SIZE / 2; // Fall down/squash
        }
    }

    /**
     * Modular render. Swap for Sprite.Draw later.
     */
    draw(ctx) {
        const drawX = this.x + this.offsetX;
        const drawY = this.y + this.offsetY;

        // Base Body
        ctx.fillStyle = this.data.colorMain;
        ctx.fillRect(drawX - FIGHTER_SIZE/2, drawY - FIGHTER_SIZE, FIGHTER_SIZE, FIGHTER_SIZE);
        
        // Face/Visor
        let eyeColor = "#ffffff";
        if (this.state === FighterState.ATTACK) eyeColor = "#ffff00";
        if (this.state === FighterState.HIT || this.state === FighterState.LOSE) eyeColor = "#000000";

        // Which way is it facing
        const faceX = this.x < 400 ? drawX + FIGHTER_SIZE/4 : drawX - FIGHTER_SIZE/4;
        
        ctx.fillStyle = eyeColor;
        ctx.fillRect(faceX - 10, drawY - FIGHTER_SIZE + 10, 20, 10);
        
        // Simple name tag below
        ctx.fillStyle = this.data.colorSecondary;
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.data.name, this.x, this.y + 15);
    }
}
