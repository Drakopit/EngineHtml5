import { Level } from "../../CoreCross/Level/Level.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Engine } from "../../CoreCross/Engine.js";
import { Fighter2D } from "./Fighter2D.js";
import { GetFightingControls } from "./FightingControls.js";
import { FIGHTING_GAME_FLOW, FightingGameSession, GoToFightingLevel } from "./FightingGameState.js";
import {
    anyGamepadButtonDown,
    gamepadButtonHeld,
    gamepadButtonDown,
    gamepadDirectionDown,
    gamepadDirectionHeld,
    keyboardDown,
    keyboardHeld,
} from "./FightingInput.js";

const SCREEN = Object.freeze({
    width: 960,
    height: 540,
});

const ARENA = Object.freeze({
    left: 58,
    right: 902,
    groundY: 426,
    floorTop: 426,
    floorHeight: 114,
});

const ROUND = Object.freeze({
    startDelay: 0.9,
    endDelay: 2.1,
    maxTime: 99,
    winsToMatch: 2,
});

export class FightingGame2DLevel extends Level {
    constructor() {
        super();
        this.caption = "GameForgeJS - 2D Fighting Demo";
        this.TelaId = "FightingGame2D";
        this.roundState = "intro";
        this.roundStateTimer = ROUND.startDelay;
        this.roundTimer = ROUND.maxTime;
        this.roundNumber = 1;
        this.matchWinner = null;
        this.shakeTimer = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.fighters = [];
        this.arcadeComplete = false;
        this.hitSparks = [];
    }

    OnStart() {
        this.screen = new Screen(this.TelaId, SCREEN.width, SCREEN.height);
        this.draw = new Draw(this.screen);
        this.FocusCanvas();
        this.CreateFighters();
        this.StartRound(true);
        super.OnStart();
    }

    FocusCanvas() {
        if (!this.screen?.Canvas) return;

        this.screen.Canvas.tabIndex = 0;
        this.screen.Canvas.focus();
        document.body.style.overflow = "hidden";
    }

    CreateFighters() {
        const playerOneCharacter = FightingGameSession.GetP1();
        const playerTwoCharacter = FightingGameSession.GetP2();
        const controls = GetFightingControls();
        const isVersus = FightingGameSession.mode === "versus";

        this.playerOne = new Fighter2D({
            id: "p1",
            name: playerOneCharacter.name,
            image: AssetManager.instance.GetImage(playerOneCharacter.asset),
            tint: playerOneCharacter.tint,
            stats: playerOneCharacter.stats,
            x: 272,
            groundY: ARENA.groundY,
            facingRight: true,
            input: controls.playerOne,
            controlledByPlayer: true,
        });

        this.playerTwo = new Fighter2D({
            id: "p2",
            name: playerTwoCharacter.name,
            image: AssetManager.instance.GetImage(playerTwoCharacter.asset),
            tint: playerTwoCharacter.tint,
            stats: playerTwoCharacter.stats,
            x: 688,
            groundY: ARENA.groundY,
            facingRight: false,
            input: controls.playerTwo,
            controlledByPlayer: isVersus ? true : false,
        });

        this.fighters = [this.playerOne, this.playerTwo];
        this.playerOne.opponent = this.playerTwo;
        this.playerTwo.opponent = this.playerOne;
    }

    StartRound(resetMatch = false) {
        if (resetMatch) {
            this.roundNumber = 1;
            this.matchWinner = null;
            this.playerOne.roundWins = 0;
            this.playerTwo.roundWins = 0;
        }

        this.roundState = "intro";
        this.roundStateTimer = ROUND.startDelay;
        this.roundTimer = ROUND.maxTime;
        this.arcadeComplete = false;
        this.playerOne.ResetRound(272, ARENA.groundY, true);
        this.playerTwo.ResetRound(688, ARENA.groundY, false);
    }

    OnUpdate(dt) {
        const delta = Math.min(dt ?? 0.016, 0.05);
        this.UpdateShake(delta);

        this.hitSparks = this.hitSparks.filter(spark => {
            spark.timer -= delta;
            return spark.timer > 0;
        });

        const menuControls = GetFightingControls().menu;
        if (keyboardDown(menuControls.cancel) || anyGamepadButtonDown(menuControls.gamepad?.cancel)) {
            GoToFightingLevel(this, FIGHTING_GAME_FLOW.menuIndex);
            return;
        }

        if (this.matchWinner) {
            this.UpdateMatchOver(delta);
            return;
        }

        if (this.roundState === "intro") {
            this.roundStateTimer -= delta;
            if (this.roundStateTimer <= 0) {
                this.roundState = "fight";
            }
            this.UpdateAnimationOnly(delta);
            return;
        }

        if (this.roundState === "roundOver") {
            this.roundStateTimer -= delta;
            this.UpdateAnimationOnly(delta);
            if (this.roundStateTimer <= 0) {
                this.AdvanceRound();
            }
            return;
        }

        this.roundTimer = Math.max(0, this.roundTimer - delta);
        this.UpdateFighters(delta);
        this.ResolveAttacks();
        this.CheckRoundEnd();
    }

    UpdateMatchOver(delta) {
        this.roundStateTimer -= delta;
        this.UpdateAnimationOnly(delta);

        if (this.roundStateTimer > 0 && !this.IsConfirmPressed()) {
            return;
        }

        if (FightingGameSession.mode === "arcade" && this.matchWinner === this.playerOne) {
            if (FightingGameSession.HasNextArcadeOpponent()) {
                FightingGameSession.AdvanceArcadeOpponent();
                this.CreateFighters();
                this.StartRound(true);
                return;
            }

            GoToFightingLevel(this, FIGHTING_GAME_FLOW.menuIndex);
            return;
        }

        this.StartRound(true);
    }

    UpdateAnimationOnly(delta) {
        this.fighters.forEach(fighter => {
            fighter.FaceOpponent();
            fighter.UpdateAnimation(delta);
        });
    }

    UpdateFighters(delta) {
        this.fighters.forEach(fighter => {
            fighter.FaceOpponent();
            const input = this.ReadFighterInput(fighter, delta);
            fighter.Update(delta, input, ARENA);
        });
    }

    ReadFighterInput(fighter, delta) {
        if (fighter.controlledByPlayer === true) {
            return this.ReadPlayerInput(fighter);
        }

        if (fighter.controlledByPlayer === "hybrid") {
            const playerInput = this.ReadPlayerInput(fighter);
            if (this.HasAnyInput(playerInput)) {
                fighter.humanOverrideTimer = 2;
                return playerInput;
            }

            fighter.humanOverrideTimer = Math.max(0, fighter.humanOverrideTimer - delta);
            if (fighter.humanOverrideTimer > 0) {
                return playerInput;
            }
        }

        return this.ReadCpuInput(fighter, delta);
    }

    ReadPlayerInput(fighter) {
        const keys = fighter.input;

        return {
            left: keyboardHeld(keys.left) || gamepadDirectionHeld("left", keys.gamepad?.index, keys.gamepad?.left),
            right: keyboardHeld(keys.right) || gamepadDirectionHeld("right", keys.gamepad?.index, keys.gamepad?.right),
            up: keyboardDown(keys.up) || gamepadDirectionDown("up", keys.gamepad?.index, keys.gamepad?.up),
            down: keyboardHeld(keys.down) || gamepadDirectionHeld("down", keys.gamepad?.index, keys.gamepad?.down),
            light: this.ReadAttackButton(fighter, "light"),
            heavy: this.ReadAttackButton(fighter, "heavy"),
            special: this.ReadAttackButton(fighter, "special"),
        };
    }

    ReadAttackButton(fighter, attackName) {
        const keys = fighter.input;
        const gamepad = keys.gamepad ?? {};
        const keyboardPressed = keyboardDown(keys[attackName]);
        const gamepadPressed = gamepadButtonDown(gamepad[attackName], gamepad.index);
        const held = keyboardHeld(keys[attackName]) || gamepadButtonHeld(gamepad[attackName], gamepad.index);
        const wasHeld = fighter.attackHeld?.[attackName] ?? false;

        if (!fighter.attackHeld) {
            fighter.attackHeld = {};
        }

        fighter.attackHeld[attackName] = held;
        return keyboardPressed || gamepadPressed || (held && !wasHeld);
    }

    IsConfirmPressed() {
        const menuControls = GetFightingControls().menu;
        return keyboardDown(menuControls.confirm) || anyGamepadButtonDown(menuControls.gamepad?.confirm);
    }

    HasAnyInput(input) {
        return input.left
            || input.right
            || input.up
            || input.down
            || input.light
            || input.heavy
            || input.special;
    }

    ReadCpuInput(fighter, delta) {
        const opponent = fighter.opponent;
        const distance = opponent.x - fighter.x;
        const absDistance = Math.abs(distance);
        fighter.cpuThinkTimer -= delta;

        if (fighter.cpuThinkTimer <= 0) {
            fighter.cpuThinkTimer = 0.18 + Math.random() * 0.22;
            fighter.cpuPlan = this.BuildCpuPlan(fighter, distance, absDistance);
        }

        return fighter.cpuPlan;
    }

    BuildCpuPlan(fighter, distance, absDistance) {
        const left = distance < -92;
        const right = distance > 92;
        const attackRoll = Math.random();

        return {
            left,
            right,
            up: false,
            down: absDistance < 100 && attackRoll < 0.14,
            light: absDistance < 92 && attackRoll >= 0.14 && attackRoll < 0.4,
            heavy: absDistance < 118 && attackRoll >= 0.4 && attackRoll < 0.55,
            special: fighter.meter >= 35 && absDistance < 160 && attackRoll >= 0.55 && attackRoll < 0.68,
        };
    }

    ResolveAttacks() {
        this.ResolveHit(this.playerOne, this.playerTwo);
        this.ResolveHit(this.playerTwo, this.playerOne);
    }

    ResolveHit(attacker, defender) {
        if (!attacker.CanHit() || defender.IsInvulnerable()) return;

        const attackBox = attacker.GetAttackBox();
        const hurtBox = defender.GetHurtBox();
        if (!this.BoxesOverlap(attackBox, hurtBox)) return;

        const attack = attacker.GetCurrentAttack();
        const blocked = defender.IsBlocking(attacker);
        
        // Apply character damage multipliers
        const baseDamage = blocked ? Math.ceil(attack.damage * 0.25) : attack.damage;
        const damage = Math.ceil(baseDamage * attacker.stats.damageMult);
        
        const hitStop = blocked ? 0.035 : attack.hitStop;
        const knockback = blocked ? attack.knockback * 0.35 : attack.knockback;

        defender.TakeHit({
            damage,
            knockback,
            hitStun: blocked ? 0.16 : attack.hitStun,
            direction: attacker.facingRight ? 1 : -1,
            blocked,
        });

        attacker.OnHit(attack.meterGain);
        
        if (!blocked) {
            attacker.comboCount += 1;
            attacker.comboTimer = 2.5; // Combo window
        } else {
            attacker.comboCount = 0;
        }

        const cx = (Math.max(attackBox.x, hurtBox.x) + Math.min(attackBox.x + attackBox.width, hurtBox.x + hurtBox.width)) / 2;
        const cy = (Math.max(attackBox.y, hurtBox.y) + Math.min(attackBox.y + attackBox.height, hurtBox.y + hurtBox.height)) / 2;
        
        this.hitSparks.push({
            x: cx,
            y: cy,
            timer: 0.25,
            maxTimer: 0.25,
            color: blocked ? "#75D7FF" : "#FFD54F",
            isBlocked: blocked,
        });

        Engine.HitStop(hitStop);
        this.Shake(blocked ? 2.5 : attack.shake);
    }

    BoxesOverlap(a, b) {
        return a.x < b.x + b.width
            && a.x + a.width > b.x
            && a.y < b.y + b.height
            && a.y + a.height > b.y;
    }

    CheckRoundEnd() {
        const p1Down = this.playerOne.hp <= 0;
        const p2Down = this.playerTwo.hp <= 0;

        if (!p1Down && !p2Down && this.roundTimer > 0) return;

        let winner = null;
        if (p1Down && !p2Down) winner = this.playerTwo;
        else if (p2Down && !p1Down) winner = this.playerOne;
        else if (this.playerOne.hp > this.playerTwo.hp) winner = this.playerOne;
        else if (this.playerTwo.hp > this.playerOne.hp) winner = this.playerTwo;

        if (winner) {
            winner.roundWins += 1;
            winner.PlayVictory();
        }

        this.fighters.forEach(fighter => {
            if (fighter !== winner) fighter.PlayDefeat();
        });

        this.roundState = "roundOver";
        this.roundStateTimer = ROUND.endDelay;

        if (winner?.roundWins >= ROUND.winsToMatch) {
            this.matchWinner = winner;
            this.arcadeComplete = FightingGameSession.mode === "arcade"
                && winner === this.playerOne
                && !FightingGameSession.HasNextArcadeOpponent();
            this.roundStateTimer = ROUND.endDelay + 1.2;
        }
    }

    AdvanceRound() {
        this.roundNumber += 1;
        this.StartRound(false);
    }

    Shake(intensity = 4) {
        this.shakeTimer = 0.16;
        this.shakeDuration = 0.16;
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    UpdateShake(delta) {
        this.shakeTimer = Math.max(0, this.shakeTimer - delta);
        if (this.shakeTimer === 0) {
            this.shakeIntensity = 0;
        }
    }

    OnDrawn() {
        if (!this.screen) return;

        this.screen.Refresh();

        const ctx = this.screen.Context;
        const shake = this.GetShakeOffset();
        ctx.save();
        ctx.translate(shake.x, shake.y);

        this.DrawArena(ctx);
        this.DrawFighters(ctx);
        this.DrawHitSparks(ctx);
        ctx.restore();

        this.DrawHud(ctx);
        this.DrawRoundState(ctx);
    }

    GetShakeOffset() {
        if (this.shakeTimer <= 0 || this.shakeDuration <= 0) return { x: 0, y: 0 };

        const progress = this.shakeTimer / this.shakeDuration;
        const strength = this.shakeIntensity * progress;
        return {
            x: Math.sin(performance.now() * 0.09) * strength,
            y: Math.cos(performance.now() * 0.13) * strength * 0.6,
        };
    }

    DrawArena(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, SCREEN.height);
        sky.addColorStop(0, "#17203A");
        sky.addColorStop(0.48, "#253A5C");
        sky.addColorStop(1, "#10131D");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);

        this.DrawMoon(ctx);
        this.DrawCityLayer(ctx, 86, "#19243A", 0.85);
        this.DrawCityLayer(ctx, 128, "#111A2B", 1);

        const floorGradient = ctx.createLinearGradient(0, ARENA.floorTop, 0, SCREEN.height);
        floorGradient.addColorStop(0, "#3B445A");
        floorGradient.addColorStop(0.34, "#252D3F");
        floorGradient.addColorStop(1, "#121620");
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, ARENA.floorTop, SCREEN.width, ARENA.floorHeight);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, ARENA.floorTop + 1);
        ctx.lineTo(SCREEN.width, ARENA.floorTop + 1);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        for (let x = -60; x < SCREEN.width + 120; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, SCREEN.height);
            ctx.lineTo(x + 120, ARENA.floorTop);
            ctx.stroke();
        }
    }

    DrawMoon(ctx) {
        ctx.save();
        ctx.fillStyle = "rgba(238, 246, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(782, 88, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(23, 32, 58, 0.55)";
        ctx.beginPath();
        ctx.arc(766, 76, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    DrawCityLayer(ctx, baseY, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        for (let x = 0; x < SCREEN.width; x += 48) {
            const height = 72 + ((x * 17) % 96);
            ctx.fillRect(x, baseY + (170 - height), 38, height);
            if (x % 96 === 0) {
                ctx.fillRect(x + 12, baseY + (150 - height), 14, 22);
            }
        }
        ctx.restore();
    }

    DrawFighters(ctx) {
        const ordered = [...this.fighters].sort((a, b) => a.y - b.y);
        ordered.forEach(fighter => fighter.Draw(ctx));
    }

    DrawHud(ctx) {
        this.DrawHealthBar(ctx, this.playerOne, 34, 28, false);
        this.DrawHealthBar(ctx, this.playerTwo, 926, 28, true);
        this.DrawTimer(ctx);
        this.DrawRoundWins(ctx, this.playerOne, 42, 72);
        this.DrawRoundWins(ctx, this.playerTwo, 850, 72);
    }

    DrawHealthBar(ctx, fighter, x, y, alignRight) {
        const width = 350;
        const height = 22;
        const barX = alignRight ? x - width : x;
        const hpPercent = Math.max(0, fighter.hp / fighter.maxHp);
        const displayHpPercent = Math.max(0, fighter.displayHp / fighter.maxHp);
        const meterPercent = Math.max(0, Math.min(1, fighter.meter / 100));

        // Background
        ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
        ctx.fillRect(barX - 4, y - 4, width + 8, height + 24);

        ctx.fillStyle = "#2A0E16";
        ctx.fillRect(barX, y, width, height);

        // Display HP (Red shadow)
        ctx.fillStyle = "#EF5350";
        const displayHpWidth = width * displayHpPercent;
        ctx.fillRect(alignRight ? barX + width - displayHpWidth : barX, y, displayHpWidth, height);

        // Actual HP
        ctx.fillStyle = hpPercent > 0.45 ? "#54D66D" : hpPercent > 0.22 ? "#F2C84B" : "#FF9800";
        const hpWidth = width * hpPercent;
        ctx.fillRect(alignRight ? barX + width - hpWidth : barX, y, hpWidth, height);

        ctx.strokeStyle = fighter.tint;
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, y, width, height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(barX, y + height + 7, width, 6);

        ctx.fillStyle = "#66D9FF";
        const meterWidth = width * meterPercent;
        ctx.fillRect(alignRight ? barX + width - meterWidth : barX, y + height + 7, meterWidth, 6);

        ctx.font = "700 14px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = alignRight ? "right" : "left";
        ctx.fillText(fighter.name, alignRight ? x : x, y - 9);

        // Combo Counter
        if (fighter.comboCount > 1) {
            const comboX = alignRight ? x - width - 60 : x + width + 60;
            const comboY = y + 50;
            ctx.textAlign = alignRight ? "right" : "left";
            
            const pulse = 1 + Math.sin(fighter.comboTimer * 10) * 0.1;
            ctx.save();
            ctx.translate(comboX, comboY);
            ctx.scale(pulse, pulse);
            
            ctx.font = "900 32px Arial";
            ctx.fillStyle = "#FFD54F";
            ctx.strokeStyle = "#D84315";
            ctx.lineWidth = 4;
            ctx.strokeText(fighter.comboCount, 0, 0);
            ctx.fillText(fighter.comboCount, 0, 0);

            ctx.font = "700 16px Arial";
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeText("HITS", 0, 20);
            ctx.fillText("HITS", 0, 20);
            ctx.restore();
        }

        ctx.textAlign = "left";
    }

    DrawHitSparks(ctx) {
        this.hitSparks.forEach(spark => {
            const progress = spark.timer / spark.maxTimer;
            const radius = spark.isBlocked ? 20 * (1 - progress) + 5 : 35 * (1 - progress) + 10;
            
            ctx.save();
            ctx.globalAlpha = progress;
            ctx.fillStyle = spark.color;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (!spark.isBlocked) {
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 4 * progress;
                ctx.beginPath();
                ctx.moveTo(spark.x - radius * 1.5, spark.y);
                ctx.lineTo(spark.x + radius * 1.5, spark.y);
                ctx.moveTo(spark.x, spark.y - radius * 1.5);
                ctx.lineTo(spark.x, spark.y + radius * 1.5);
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }

    DrawRoundWins(ctx, fighter, x, y) {
        for (let i = 0; i < ROUND.winsToMatch; i++) {
            ctx.fillStyle = i < fighter.roundWins ? fighter.tint : "rgba(255, 255, 255, 0.18)";
            ctx.beginPath();
            ctx.arc(x + i * 18, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    DrawTimer(ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
        ctx.fillRect(432, 18, 96, 58);
        ctx.strokeStyle = "#F4D26A";
        ctx.lineWidth = 2;
        ctx.strokeRect(432, 18, 96, 58);

        ctx.font = "700 28px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(this.roundTimer).toString().padStart(2, "0"), 480, 55);

        ctx.font = "10px Arial";
        ctx.fillStyle = "#F4D26A";
        ctx.fillText(`ROUND ${this.roundNumber}`, 480, 70);
        ctx.textAlign = "left";
    }

    DrawRoundState(ctx) {
        let text = "";
        let subText = "";

        if (this.matchWinner) {
            if (this.arcadeComplete) {
                text = "ARCADE CLEAR";
                subText = "CAMPANHA CONCLUIDA";
            } else if (FightingGameSession.mode === "arcade" && this.matchWinner === this.playerOne) {
                text = `${this.matchWinner.name} WINS`;
                subText = "PROXIMA LUTA";
            } else if (FightingGameSession.mode === "arcade") {
                text = "CONTINUE?";
                subText = "TENTAR NOVAMENTE";
            } else {
                text = `${this.matchWinner.name} WINS`;
                subText = "REVANCHE";
            }
        } else if (this.roundState === "intro") {
            text = "FIGHT";
            subText = `ROUND ${this.roundNumber}`;
        } else if (this.roundState === "roundOver") {
            text = "K.O.";
        }

        if (!text) return;

        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
        ctx.fillRect(0, 186, SCREEN.width, 104);
        ctx.font = "700 52px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 5;
        ctx.strokeText(text, 480, 253);
        ctx.fillText(text, 480, 253);

        if (subText) {
            ctx.font = "700 14px Arial";
            ctx.fillStyle = "#F4D26A";
            ctx.fillText(subText, 480, 276);
        }
        ctx.restore();
    }

    OnExit() {
        super.OnExit();
        this.fighters = [];
        this.playerOne = null;
        this.playerTwo = null;
        this.screen = null;
    }
}
