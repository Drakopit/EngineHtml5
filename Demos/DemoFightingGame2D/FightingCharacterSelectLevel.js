import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import {
    FIGHTING_GAME_CHARACTERS,
    FIGHTING_GAME_FLOW,
    FightingGameSession,
    GoToFightingLevel,
} from "./FightingGameState.js";
import { GetFightingControls } from "./FightingControls.js";
import { anyGamepadButtonDown, anyGamepadDirectionDown, keyboardDown } from "./FightingInput.js";

const SCREEN = Object.freeze({
    width: 960,
    height: 540,
});

const FRAME = Object.freeze({
    width: 64,
    height: 64,
});

export class FightingCharacterSelectLevel extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - Select Fighter";
        this.TelaId = "FightingCharacterSelect";
        this.cursorIndex = 0;
        this.selectionStep = "p1";
        this.pulse = 0;
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, SCREEN.width, SCREEN.height);
        this.FocusCanvas();
        this.cursorIndex = FightingGameSession.p1Index;
        this.selectionStep = "p1";
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
        this.pulse += dt ?? 0.016;

        if (this.IsDirectionPressed("left")) {
            this.MoveCursor(-1);
        }

        if (this.IsDirectionPressed("right")) {
            this.MoveCursor(1);
        }

        if (this.IsDirectionPressed("up")) {
            this.MoveCursor(-2);
        }

        if (this.IsDirectionPressed("down")) {
            this.MoveCursor(2);
        }

        if (this.IsCancelPressed()) {
            this.Cancel();
        }

        if (this.IsConfirmPressed()) {
            this.Confirm();
        }
    }

    MoveCursor(direction) {
        const length = FIGHTING_GAME_CHARACTERS.length;
        this.cursorIndex = (this.cursorIndex + direction + length) % length;
    }

    Cancel() {
        if (FightingGameSession.mode === "versus" && this.selectionStep === "p2") {
            this.selectionStep = "p1";
            this.cursorIndex = FightingGameSession.p1Index;
            return;
        }

        GoToFightingLevel(this, FIGHTING_GAME_FLOW.menuIndex);
    }

    Confirm() {
        if (FightingGameSession.mode === "arcade") {
            FightingGameSession.SetCharacter("p1", this.cursorIndex);
            FightingGameSession.arcadeStage = 0;
            GoToFightingLevel(this, FIGHTING_GAME_FLOW.fightIndex);
            return;
        }

        if (this.selectionStep === "p1") {
            FightingGameSession.SetCharacter("p1", this.cursorIndex);
            this.selectionStep = "p2";
            this.cursorIndex = this.GetNextCharacterIndex(this.cursorIndex);
            return;
        }

        FightingGameSession.SetCharacter("p2", this.cursorIndex);
        GoToFightingLevel(this, FIGHTING_GAME_FLOW.fightIndex);
    }

    GetNextCharacterIndex(index) {
        return (index + 1) % FIGHTING_GAME_CHARACTERS.length;
    }

    IsDirectionPressed(direction) {
        const controls = GetFightingControls().menu;
        return keyboardDown(controls[direction]) || anyGamepadDirectionDown(direction, controls.gamepad?.[direction]);
    }

    IsCancelPressed() {
        const controls = GetFightingControls().menu;
        return keyboardDown(controls.cancel) || anyGamepadButtonDown(controls.gamepad?.cancel);
    }

    IsConfirmPressed() {
        const controls = GetFightingControls().menu;
        return keyboardDown(controls.confirm) || anyGamepadButtonDown(controls.gamepad?.confirm);
    }

    OnDrawn() {
        if (!this.screen) return;

        this.screen.Refresh();
        const ctx = this.screen.Context;
        this.DrawBackdrop(ctx);
        this.DrawHeader(ctx);
        this.DrawCharacterGrid(ctx);
        this.DrawSelectionSummary(ctx);
    }

    DrawBackdrop(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, SCREEN.height);
        gradient.addColorStop(0, "#171F33");
        gradient.addColorStop(0.56, "#26334D");
        gradient.addColorStop(1, "#11141D");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

        ctx.fillStyle = "rgba(244, 210, 106, 0.08)";
        for (let x = -80; x < SCREEN.width; x += 120) {
            ctx.beginPath();
            ctx.moveTo(x, SCREEN.height);
            ctx.lineTo(x + 90, 0);
            ctx.lineTo(x + 130, 0);
            ctx.lineTo(x + 40, SCREEN.height);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = "rgba(6, 9, 16, 0.36)";
        ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
    }

    DrawHeader(ctx) {
        const modeLabel = FightingGameSession.mode === "arcade" ? "ARCADE" : "VERSUS";
        const playerLabel = FightingGameSession.mode === "arcade"
            ? "ESCOLHA SEU LUTADOR"
            : this.selectionStep === "p1"
                ? "PLAYER 1"
                : "PLAYER 2";

        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#F4D26A";
        ctx.font = "700 14px Arial";
        ctx.fillText(modeLabel, 480, 58);

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#0A0E16";
        ctx.lineWidth = 5;
        ctx.font = "900 38px Arial";
        ctx.strokeText(playerLabel, 480, 104);
        ctx.fillText(playerLabel, 480, 104);
        ctx.restore();
    }

    DrawCharacterGrid(ctx) {
        const cardWidth = 172;
        const cardHeight = 220;
        const gap = 26;
        const startX = (SCREEN.width - cardWidth * 4 - gap * 3) / 2;
        const y = 168;

        FIGHTING_GAME_CHARACTERS.forEach((character, index) => {
            const x = startX + index * (cardWidth + gap);
            this.DrawCharacterCard(ctx, character, index, x, y, cardWidth, cardHeight);
        });
    }

    DrawCharacterCard(ctx, character, index, x, y, width, height) {
        const selected = index === this.cursorIndex;
        const p1PreviewIndex = this.GetPreviewP1Index();
        const p2PreviewIndex = this.GetPreviewP2Index(p1PreviewIndex);
        const p1Selected = p1PreviewIndex === index;
        const p2Selected = FightingGameSession.mode === "versus" && p2PreviewIndex === index;
        const cpuSelected = FightingGameSession.mode === "arcade" && p2PreviewIndex === index;
        const pulseAlpha = selected ? 0.16 + Math.sin(this.pulse * 8) * 0.04 : 0;

        ctx.fillStyle = selected ? `rgba(244, 210, 106, ${0.16 + pulseAlpha})` : "rgba(8, 12, 22, 0.78)";
        ctx.strokeStyle = selected ? "#F4D26A" : "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = selected ? 3 : 2;
        this.RoundRect(ctx, x, y, width, height, 8);
        ctx.fill();
        ctx.stroke();

        const image = AssetManager.instance.GetImage(character.asset);
        if (image) {
            const scale = 2.2;
            const drawWidth = FRAME.width * scale;
            const drawHeight = FRAME.height * scale;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                image,
                0,
                0,
                FRAME.width,
                FRAME.height,
                x + width / 2 - drawWidth / 2,
                y + 24,
                drawWidth,
                drawHeight
            );
            ctx.restore();
        }

        ctx.textAlign = "center";
        ctx.font = "800 18px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(character.name, x + width / 2, y + 172);

        ctx.font = "12px Arial";
        ctx.fillStyle = character.tint;
        ctx.fillText(character.title, x + width / 2, y + 194);

        if (p1Selected || p2Selected || cpuSelected) {
            ctx.fillStyle = p1Selected ? "#52A8FF" : "#F4D26A";
            ctx.fillRect(x + 12, y + 12, 42, 20);
            ctx.fillStyle = "#08101B";
            ctx.font = "800 11px Arial";
            ctx.fillText(p1Selected ? "P1" : cpuSelected ? "CPU" : "P2", x + 33, y + 27);
        }
    }

    DrawSelectionSummary(ctx) {
        const p1Index = this.GetPreviewP1Index();
        const p2Index = this.GetPreviewP2Index(p1Index);
        const p1 = FIGHTING_GAME_CHARACTERS[p1Index];
        const p2 = FIGHTING_GAME_CHARACTERS[p2Index];

        ctx.save();
        ctx.fillStyle = "rgba(5, 8, 15, 0.72)";
        this.RoundRect(ctx, 232, 414, 496, 54, 8);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.font = "700 13px Arial";
        ctx.fillStyle = "#BFD1F0";
        ctx.fillText("PLAYER 1", 332, 436);
        ctx.fillStyle = p1.tint;
        ctx.fillText(p1.name, 332, 456);

        ctx.fillStyle = "#F4D26A";
        ctx.font = "900 20px Arial";
        ctx.fillText("VS", 480, 451);

        ctx.font = "700 13px Arial";
        ctx.fillStyle = "#BFD1F0";
        ctx.fillText(FightingGameSession.mode === "arcade" ? "CPU" : "PLAYER 2", 628, 436);
        ctx.fillStyle = p2.tint;
        ctx.fillText(p2.name, 628, 456);
        ctx.restore();
    }

    GetPreviewP1Index() {
        return this.selectionStep === "p1" ? this.cursorIndex : FightingGameSession.p1Index;
    }

    GetPreviewP2Index(p1Index) {
        if (FightingGameSession.mode === "versus") {
            return this.selectionStep === "p2" ? this.cursorIndex : FightingGameSession.p2Index;
        }

        const preferred = FightingGameSession.arcadeOrder[0];
        if (preferred !== p1Index) return preferred;

        return FightingGameSession.arcadeOrder.find(index => index !== p1Index) ?? 1;
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
