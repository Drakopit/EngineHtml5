import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { BattleState } from "./BattleState.js";

const W = 640;
const H = 480;

const PHASE = {
    INTRO: "INTRO",
    PLAYER_STRIKE: "PLAYER_STRIKE",
    ENEMY_COUNTER: "ENEMY_COUNTER",
    RETURNING: "RETURNING",
};

export class BattleLevel extends Level {
    constructor() {
        super();
        this.caption = "Tactical RPG - Fire Emblem Battle";
        this.TelaId = "BattleScreen";
    }

    OnStart() {
        this.screen = new Screen("BattleScreen", W, H);
        this.draw = new Draw(this.screen);
        this.assets = AssetManager.instance;

        this.player = BattleState.playerUnit;
        this.enemy = BattleState.enemyUnit;
        this.invalidEncounter = !BattleState.CanStartBattle();
        this.phase = PHASE.INTRO;
        this.stepTimer = this.invalidEncounter ? 0.35 : 0.55;
        this.animTime = 0;
        this.dmg = { value: 0, target: null, timer: 0, color: "#FFEE66" };
        this.log = this.invalidEncounter
            ? "Encontro invalido. Voltando ao mapa..."
            : `${this.player.name} entra em combate contra ${this.enemy.name}.`;

        super.OnStart();
    }

    OnExit() {
        if (this.screen?.Canvas) this.screen.Canvas.remove();
    }

    _calcDamage(attacker, defender) {
        if (!attacker?.IsAlive?.() || !defender?.IsAlive?.()) return 0;
        return defender.TakeDamage(attacker);
    }

    _canCounter() {
        return this.enemy?.IsAlive?.()
            && this.player?.IsAlive?.()
            && this.enemy.DistanceTo(this.player) <= (this.enemy.attackRange ?? 1);
    }

    OnUpdate(dt) {
        super.OnUpdate(dt);
        this.animTime += dt;

        if (this.dmg.timer > 0) this.dmg.timer = Math.max(0, this.dmg.timer - dt);

        this.stepTimer -= dt;
        if (this.stepTimer > 0) return;

        if (this.invalidEncounter) {
            this.Back = true;
            return;
        }

        if (this.phase === PHASE.INTRO) {
            this._playerStrike();
            return;
        }

        if (this.phase === PHASE.PLAYER_STRIKE) {
            if (this._canCounter()) {
                this._enemyCounter();
                return;
            }

            this._finish("ROUND_END", "Ataque resolvido. Voltando ao mapa...");
            return;
        }

        if (this.phase === PHASE.ENEMY_COUNTER) {
            this._finish("ROUND_END", "Troca de golpes resolvida. Voltando ao mapa...");
            return;
        }

        if (this.phase === PHASE.RETURNING) {
            this.Back = true;
        }
    }

    _playerStrike() {
        const dmg = this._calcDamage(this.player, this.enemy);
        this.dmg = { value: dmg, target: "enemy", timer: 1.0, color: "#FFEE66" };
        this.log = `${this.player.name} ataca. ${this.enemy.name} recebe ${dmg} de dano.`;
        this.phase = PHASE.PLAYER_STRIKE;
        this.stepTimer = 0.85;

        if (!this.enemy.IsAlive()) {
            this._finish("PLAYER_WIN", `${this.enemy.name} foi derrotado. Voltando ao mapa...`);
        }
    }

    _enemyCounter() {
        const dmg = this._calcDamage(this.enemy, this.player);
        this.dmg = { value: dmg, target: "player", timer: 1.0, color: "#FF6666" };
        this.log = `${this.enemy.name} contra-ataca. ${this.player.name} recebe ${dmg} de dano.`;
        this.phase = PHASE.ENEMY_COUNTER;
        this.stepTimer = 0.85;

        if (!this.player.IsAlive()) {
            this._finish("ENEMY_WIN", `${this.player.name} caiu em combate. Voltando ao mapa...`);
        }
    }

    _finish(result, message) {
        BattleState.FinishEncounter(result);
        this.log = message;
        this.phase = PHASE.RETURNING;
        this.stepTimer = 1.05;
    }

    OnDrawn() {
        this.screen.Refresh();

        this._drawTinySwordsBackdrop();

        if (!this.player || !this.enemy) return;

        this._drawBattleUnit(this.player, 160, 300);
        this._drawBattleUnit(this.enemy, 480, 300);
        this._drawDamageText();
    }

    _drawDamageText() {
        if (this.dmg.timer <= 0) return;

        const isPlayer = this.dmg.target === "player";
        const ux = isPlayer ? 160 : 480;
        const elapsed = 1.0 - this.dmg.timer;
        const floatY = 178 - elapsed * 48;
        const alpha = Math.min(1, this.dmg.timer);

        this.screen.Context.globalAlpha = alpha;
        this.draw.Color = this.dmg.color;
        this.draw.FontSize = "34px";
        this.draw.Font = "monospace";
        this.draw.SetTextAlign("center");
        this.draw.DrawText(`-${this.dmg.value}`, ux, floatY);
        this.screen.Context.globalAlpha = 1;
    }

    _drawBattleUnit(unit, cx, groundY) {
        const image = this._image(unit.asset);
        if (image?.complete && image.naturalWidth) {
            this._drawSpriteBattleUnit(unit, image, cx, groundY);
            return;
        }

        const w = 70;
        const h = 110;
        const x = cx - w / 2;
        const y = groundY - h;

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "rgba(0,0,0,0.3)";
        this.draw.DrawCircle(cx, groundY + 6, 25);

        this.draw.Color = unit.IsAlive() ? unit.color : "#555555";
        this.draw.DrawRect(x, y, w, h);

        this.draw.Color = "rgba(255,255,255,0.15)";
        this.draw.DrawRect(x + 4, y + 4, w / 3, h - 8);

        this.draw.Color = "rgba(0,0,0,0.7)";
        this.draw.DrawRect(cx - 52, y - 32, 104, 22);

        this.draw.Color = "#FFFFFF";
        this.draw.FontSize = "13px";
        this.draw.Font = "monospace";
        this.draw.SetTextAlign("center");
        this.draw.DrawText(unit.name, cx, y - 15);

        const barW = 120;
        const barX = cx - barW / 2;
        const barY = y - 52;
        const pct = Math.max(0, unit.hp / unit.maxHp);

        this.draw.Color = "#222222";
        this.draw.DrawRect(barX, barY, barW, 14);

        this.draw.Color = pct > 0.5 ? "#44DD44" : pct > 0.25 ? "#FFAA00" : "#FF3333";
        this.draw.DrawRect(barX, barY, barW * pct, 14);

        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.Color = "#888888";
        this.draw.DrawRect(barX, barY, barW, 14);

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "#FFFFFF";
        this.draw.FontSize = "11px";
        this.draw.DrawText(`${unit.hp} / ${unit.maxHp}`, cx, barY + 11);
    }

    _drawTinySwordsBackdrop() {
        const ctx = this.screen.Context;
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
        sky.addColorStop(0, "#11223b");
        sky.addColorStop(1, "#273f4f");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H * 0.65);

        const tilemap = this._image("tactical_tilemap_color1");
        if (tilemap?.complete && tilemap.naturalWidth) {
            for (let y = Math.floor(H * 0.62); y < 420; y += 64) {
                for (let x = 0; x < W; x += 64) {
                    ctx.drawImage(tilemap, 64, 64, 64, 64, x, y, 64, 64);
                }
            }
        } else {
            this.draw.Style = this.draw.TYPES.FILLED;
            this.draw.Color = "#2d4a1e";
            this.draw.DrawRect(0, H * 0.65, W, H * 0.35);
            this.draw.Color = "#1e3414";
            this.draw.DrawRect(0, H * 0.72, W, H * 0.28);
        }

        this._drawBackdropProp("blue_house1", 22, 210, 92, 138, 0.55);
        this._drawBackdropProp("red_barracks", W - 132, 205, 106, 144, 0.55);
        this._drawBackdropProp("tree_1", 110, 234, 74, 74, 0.8, { width: 256, height: 256 });
        this._drawBackdropProp("tree_2", W - 198, 238, 72, 72, 0.8, { width: 256, height: 256 });
    }

    _drawBackdropProp(asset, x, y, width, height, alpha = 1, frame = null) {
        const image = this._image(asset);
        if (!image?.complete || !image.naturalWidth) return;

        this.screen.Context.save();
        this.screen.Context.globalAlpha = alpha;
        this.screen.Context.drawImage(
            image,
            frame?.x ?? 0,
            frame?.y ?? 0,
            frame?.width ?? image.naturalWidth,
            frame?.height ?? image.naturalHeight,
            x,
            y,
            width,
            height
        );
        this.screen.Context.restore();
    }

    _drawSpriteBattleUnit(unit, image, cx, groundY) {
        const frame = unit.frame ?? {
            x: 0,
            y: 0,
            width: image.naturalHeight,
            height: image.naturalHeight,
        };
        const frameWidth = frame.width ?? image.naturalWidth / (frame.frames ?? 1);
        const frameHeight = frame.height ?? image.naturalHeight;
        const frames = Math.max(1, frame.frames ?? Math.floor(image.naturalWidth / frameWidth));
        const frameIndex = unit.IsAlive() ? Math.floor(this.animTime * 5) % frames : 0;
        const scale = Math.max(0.8, Number(unit.scale ?? 1) * 2.35);
        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        const x = cx - drawWidth / 2;
        const y = groundY - drawHeight + 35;

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "rgba(0,0,0,0.3)";
        this.draw.DrawCircle(cx, groundY + 6, 36);

        this.screen.Context.drawImage(
            image,
            (frame.x ?? 0) + frameIndex * frameWidth,
            frame.y ?? 0,
            frameWidth,
            frameHeight,
            x,
            y,
            drawWidth,
            drawHeight
        );

        this._drawUnitPanel(unit, cx, y);
    }

    _drawUnitPanel(unit, cx, topY) {
        this.draw.Color = "rgba(0,0,0,0.7)";
        this.draw.DrawRect(cx - 58, topY - 28, 116, 22);

        this.draw.Color = "#FFFFFF";
        this.draw.FontSize = "13px";
        this.draw.Font = "monospace";
        this.draw.SetTextAlign("center");
        this.draw.DrawText(unit.name, cx, topY - 11);

        const barW = 120;
        const barX = cx - barW / 2;
        const barY = topY - 48;
        const pct = Math.max(0, unit.hp / unit.maxHp);

        this.draw.Color = "#222222";
        this.draw.DrawRect(barX, barY, barW, 14);

        this.draw.Color = pct > 0.5 ? "#44DD44" : pct > 0.25 ? "#FFAA00" : "#FF3333";
        this.draw.DrawRect(barX, barY, barW * pct, 14);

        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.Color = "#888888";
        this.draw.DrawRect(barX, barY, barW, 14);

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "#FFFFFF";
        this.draw.FontSize = "11px";
        this.draw.DrawText(`${unit.hp} / ${unit.maxHp}`, cx, barY + 11);
    }

    _image(name) {
        return name ? this.assets?.images?.[name] ?? null : null;
    }

    OnGUI() {
        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "rgba(0,0,0,0.88)";
        this.draw.DrawRect(0, 420, W, 60);

        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.Color = "#444444";
        this.draw.DrawRect(0, 420, W, 60);

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "#FFD84A";
        this.draw.FontSize = "12px";
        this.draw.Font = "monospace";
        this.draw.SetTextAlign("left");
        this.draw.DrawText("MODO FIRE EMBLEM", 14, 442);

        this.draw.Color = "#FFFFFF";
        this.draw.FontSize = "14px";
        this.draw.DrawText(this.log, 14, 466);
    }
}
