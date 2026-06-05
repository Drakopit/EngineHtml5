import { Draw } from "../../../src/Core2D/Graphics/Draw.js";
import { PuzzleConfig } from "../data/puzzleConfig.js";

// We will build a custom renderer for HUD to avoid tight coupling with full Engine UI nodes if they don't perfectly fit,
// but the prompt suggests using UILabel/UITextBox if available. 
// However, since we are unsure of the exact UI exports in Core2D (and they often vary), 
// we will draw pure text via Draw API to guarantee it works as a custom HUD entity.
// In GameForgeJS, the UI is often built procedurally on the Canvas.
export class PuzzleHUD {
    constructor() {
        this.p1Score = 0;
        this.p2Score = 0;
        this.p1Next1 = null;
        this.p1Next2 = null;
        this.p2Next1 = null;
        this.p2Next2 = null;
        
        this.floatingTexts = [];
    }

    setNextPieces(p1Gems, p2Gems) {
        this.p1Next1 = p1Gems[0];
        this.p1Next2 = p1Gems[1];
        this.p2Next1 = p2Gems[0];
        this.p2Next2 = p2Gems[1];
    }

    addFloatingText(x, y, text, color = "#ffffff") {
        this.floatingTexts.push({ x, y, text, color, life: 1.0 });
    }

    update(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.y -= 30 * dt; // Float up
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Player 1 HUD
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.textAlign = "left";
        ctx.fillText("P1 SCORE: " + this.p1Score, PuzzleConfig.BOARD_1_POS.x, PuzzleConfig.BOARD_1_POS.y - 40);
        
        ctx.font = "12px Arial";
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText("Controles: W (Girar), A/D (Mover), S (Cair)", PuzzleConfig.BOARD_1_POS.x, PuzzleConfig.BOARD_1_POS.y - 65);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.fillText("NEXT:", PuzzleConfig.BOARD_1_POS.x, PuzzleConfig.BOARD_1_POS.y - 10);
        if (this.p1Next1 && this.p1Next2) {
            this.p1Next1.render(ctx, PuzzleConfig.BOARD_1_POS.x + 70, PuzzleConfig.BOARD_1_POS.y - 30, 20);
            this.p1Next2.render(ctx, PuzzleConfig.BOARD_1_POS.x + 70, PuzzleConfig.BOARD_1_POS.y - 10, 20);
        }

        // Player 2 HUD
        ctx.textAlign = "right";
        const p2RightEnd = PuzzleConfig.BOARD_2_POS.x + (PuzzleConfig.COLS * PuzzleConfig.GEM_SIZE);
        ctx.fillText("CPU SCORE: " + this.p2Score, p2RightEnd, PuzzleConfig.BOARD_2_POS.y - 40);
        ctx.fillText("NEXT:", p2RightEnd - 30, PuzzleConfig.BOARD_2_POS.y - 10);
        if (this.p2Next1 && this.p2Next2) {
            this.p2Next1.render(ctx, p2RightEnd - 20, PuzzleConfig.BOARD_2_POS.y - 30, 20);
            this.p2Next2.render(ctx, p2RightEnd - 20, PuzzleConfig.BOARD_2_POS.y - 10, 20);
        }

        // Floating texts
        ctx.textAlign = "center";
        for (const ft of this.floatingTexts) {
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.font = "bold 24px Arial";
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1.0;
    }
}
