import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { FIGHTING_GAME_FLOW, FightingGameSession, GoToFightingLevel } from "./FightingGameState.js";
import { GetFightingControls } from "./FightingControls.js";
import { anyGamepadButtonDown, anyGamepadDirectionDown, keyboardDown } from "./FightingInput.js";

const SCREEN = Object.freeze({
    width: 960,
    height: 540,
});

const MENU_OPTIONS = Object.freeze([
    { label: "ARCADE", description: "Lute contra a sequencia de oponentes.", action: "arcade" },
    { label: "VERSUS", description: "Dois jogadores no mesmo teclado.", action: "versus" },
    { label: "SAIR", description: "Voltar para a demo principal.", action: "exit" },
]);

export class FightingGameMenuLevel extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Fighting 2D";
        this.TelaId = "FightingGame2DMenu";
        this.selectedIndex = 0;
        this.pulse = 0;
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, SCREEN.width, SCREEN.height);
        this.FocusCanvas();
        this.selectedIndex = 0;
        this.pulse = 0;
        super.OnStart();
    }

    FocusCanvas() {
        if (!this.screen?.Canvas) return;

        this.screen.Canvas.tabIndex = 0;
        this.screen.Canvas.focus();
        document.body.style.overflow = "hidden";
    }

    OnUpdate(dt) {
        const delta = dt ?? 0.016;
        this.pulse += delta;

        if (this.IsUpPressed()) {
            this.selectedIndex = (this.selectedIndex + MENU_OPTIONS.length - 1) % MENU_OPTIONS.length;
        }

        if (this.IsDownPressed()) {
            this.selectedIndex = (this.selectedIndex + 1) % MENU_OPTIONS.length;
        }

        if (this.IsConfirmPressed()) {
            this.ActivateOption(MENU_OPTIONS[this.selectedIndex]);
        }
    }

    IsUpPressed() {
        const controls = GetFightingControls().menu;
        return keyboardDown(controls.up) || anyGamepadDirectionDown("up", controls.gamepad?.up);
    }

    IsDownPressed() {
        const controls = GetFightingControls().menu;
        return keyboardDown(controls.down) || anyGamepadDirectionDown("down", controls.gamepad?.down);
    }

    IsConfirmPressed() {
        const controls = GetFightingControls().menu;
        return keyboardDown(controls.confirm) || anyGamepadButtonDown(controls.gamepad?.confirm);
    }

    ActivateOption(option) {
        if (option.action === "exit") {
            window.location.href = "Main.html?demo=advanced";
            return;
        }

        FightingGameSession.SetMode(option.action);
        GoToFightingLevel(this, FIGHTING_GAME_FLOW.characterSelectIndex);
    }

    OnDrawn() {
        if (!this.screen) return;

        this.screen.Refresh();
        const ctx = this.screen.Context;
        this.DrawBackdrop(ctx);
        this.DrawTitle(ctx);
        this.DrawOptions(ctx);
    }

    DrawBackdrop(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, SCREEN.height);
        sky.addColorStop(0, "#141B2D");
        sky.addColorStop(0.48, "#2C3D5F");
        sky.addColorStop(1, "#11131B");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

        this.DrawSun(ctx);
        this.DrawCityLayer(ctx, 100, "#1B2740", 0.78);
        this.DrawCityLayer(ctx, 150, "#121B2D", 1);

        const floor = ctx.createLinearGradient(0, 388, 0, SCREEN.height);
        floor.addColorStop(0, "#414B64");
        floor.addColorStop(1, "#171B25");
        ctx.fillStyle = floor;
        ctx.fillRect(0, 388, SCREEN.width, 152);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 2;
        for (let x = -80; x < SCREEN.width + 120; x += 86) {
            ctx.beginPath();
            ctx.moveTo(x, SCREEN.height);
            ctx.lineTo(x + 120, 388);
            ctx.stroke();
        }

        ctx.fillStyle = "rgba(5, 8, 14, 0.32)";
        ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
    }

    DrawSun(ctx) {
        ctx.save();
        ctx.fillStyle = "rgba(244, 210, 106, 0.88)";
        ctx.beginPath();
        ctx.arc(776, 92, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(20, 27, 45, 0.38)";
        ctx.beginPath();
        ctx.arc(760, 80, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    DrawCityLayer(ctx, baseY, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        for (let x = 0; x < SCREEN.width; x += 52) {
            const height = 78 + ((x * 19) % 110);
            ctx.fillRect(x, baseY + (190 - height), 38, height);
            if (x % 104 === 0) {
                ctx.fillRect(x + 12, baseY + (168 - height), 14, 24);
            }
        }
        ctx.restore();
    }

    DrawTitle(ctx) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#F4D26A";
        ctx.font = "700 16px Arial";
        ctx.fillText("GAMEFORGEJS", 480, 108);

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#0B0F18";
        ctx.lineWidth = 6;
        ctx.font = "900 58px Arial";
        ctx.strokeText("2D FIGHT", 480, 172);
        ctx.fillText("2D FIGHT", 480, 172);

        ctx.font = "700 15px Arial";
        ctx.fillStyle = "#CAD6EA";
        ctx.fillText("ARCADE ARENA", 480, 200);
        ctx.restore();
    }

    DrawOptions(ctx) {
        const optionWidth = 340;
        const optionHeight = 68;
        const startY = 242;
        const gap = 12;
        const x = (SCREEN.width - optionWidth) / 2;

        MENU_OPTIONS.forEach((option, index) => {
            const y = startY + index * (optionHeight + gap);
            const selected = index === this.selectedIndex;
            const glow = selected ? 0.18 + Math.sin(this.pulse * 8) * 0.05 : 0;

            ctx.fillStyle = selected ? `rgba(244, 210, 106, ${0.18 + glow})` : "rgba(7, 10, 18, 0.74)";
            ctx.strokeStyle = selected ? "#F4D26A" : "rgba(255, 255, 255, 0.18)";
            ctx.lineWidth = selected ? 3 : 2;
            this.RoundRect(ctx, x, y, optionWidth, optionHeight, 8);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.font = "800 20px Arial";
            ctx.fillStyle = selected ? "#FFFFFF" : "#D8E1F0";
            ctx.fillText(option.label, 480, y + 28);

            ctx.font = "12px Arial";
            ctx.fillStyle = selected ? "#BFD1F0" : "rgba(191, 209, 240, 0.62)";
            ctx.fillText(option.description, 480, y + 50);
        });
    }

    RoundRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }
}
