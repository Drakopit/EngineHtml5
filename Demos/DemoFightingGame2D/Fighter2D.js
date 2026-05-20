const FRAME = Object.freeze({
    width: 64,
    height: 64,
});

const FIGHTER = Object.freeze({
    scale: 2.45,
    maxHp: 100,
    walkSpeed: 210,
    jumpStrength: -560,
    gravity: 1450,
    airDrag: 0.92,
    friction: 0.72,
    pushRadius: 42,
    hurtWidth: 45,
    hurtHeight: 116,
});

const ANIMATIONS = Object.freeze({
    idle: { frames: rowFrames(0, 0, 6), fps: 9, loop: true },
    walk: { frames: rowFrames(0, 6, 6), fps: 10, loop: true },
    jump: { frames: rowFrames(1, 0, 3), fps: 9, loop: false },
    guard: { frames: rowFrames(4, 0, 4), fps: 8, loop: true },
    light: { frames: rowFrames(2, 0, 5), fps: 15, loop: false },
    heavy: { frames: rowFrames(2, 6, 6), fps: 13, loop: false },
    special: { frames: rowFrames(3, 0, 6), fps: 14, loop: false },
    hurt: { frames: rowFrames(3, 10, 3), fps: 13, loop: false },
    ko: { frames: rowFrames(1, 0, 4), fps: 9, loop: false },
    victory: { frames: rowFrames(4, 0, 4), fps: 7, loop: true },
});

const ATTACKS = Object.freeze({
    light: {
        damage: 7,
        duration: 0.34,
        activeStart: 0.12,
        activeEnd: 0.21,
        range: 58,
        height: 42,
        yOffset: -88,
        knockback: 145,
        hitStun: 0.22,
        hitStop: 0.045,
        shake: 3,
        meterGain: 8,
        lunge: 26,
    },
    heavy: {
        damage: 13,
        duration: 0.5,
        activeStart: 0.18,
        activeEnd: 0.31,
        range: 76,
        height: 50,
        yOffset: -92,
        knockback: 245,
        hitStun: 0.34,
        hitStop: 0.07,
        shake: 5,
        meterGain: 12,
        lunge: 44,
    },
    special: {
        damage: 19,
        duration: 0.64,
        activeStart: 0.2,
        activeEnd: 0.4,
        range: 102,
        height: 58,
        yOffset: -96,
        knockback: 325,
        hitStun: 0.42,
        hitStop: 0.09,
        shake: 7,
        meterGain: 4,
        meterCost: 30,
        lunge: 62,
    },
});

function rowFrames(row, startColumn, count) {
    return Array.from({ length: count }, (_, index) => ({
        column: startColumn + index,
        row,
    }));
}

export class Fighter2D {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.image = config.image;
        this.tint = config.tint;
        this.controlledByPlayer = config.controlledByPlayer;
        this.input = config.input;
        this.opponent = null;
        this.maxHp = FIGHTER.maxHp;
        this.roundWins = 0;
        this.humanOverrideTimer = 0;
        this.cpuThinkTimer = 0;
        this.cpuPlan = this.EmptyInput();
        this.ResetRound(config.x, config.groundY, config.facingRight);
    }

    ResetRound(x, groundY, facingRight) {
        this.x = x;
        this.y = groundY;
        this.groundY = groundY;
        this.vx = 0;
        this.vy = 0;
        this.facingRight = facingRight;
        this.hp = this.maxHp;
        this.meter = 0;
        this.state = "idle";
        this.stateTimer = 0;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.hitPause = 0;
        this.invulnerableTimer = 0;
        this.hitOnce = false;
        this.currentAttackName = null;
        this.attackHeld = {
            light: false,
            heavy: false,
            special: false,
        };
        this.cpuThinkTimer = 0;
        this.cpuPlan = this.EmptyInput();
    }

    EmptyInput() {
        return {
            left: false,
            right: false,
            up: false,
            down: false,
            light: false,
            heavy: false,
            special: false,
        };
    }

    Update(delta, input, arena) {
        if (this.hp <= 0) {
            this.UpdateAnimation(delta);
            return;
        }

        this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
        this.stateTimer = Math.max(0, this.stateTimer - delta);

        if (this.IsActionLocked()) {
            this.UpdateLockedState(delta);
        } else {
            this.UpdateGroundControl(delta, input);
        }

        this.ApplyPhysics(delta, arena);
        this.UpdateAnimation(delta);
    }

    UpdateGroundControl(delta, input) {
        if (input.light) this.StartAttack("light");
        else if (input.heavy) this.StartAttack("heavy");
        else if (input.special) this.StartAttack("special");

        if (this.IsActionLocked()) return;

        if (input.down && this.IsGrounded()) {
            this.ChangeState("guard");
            this.vx *= 0.45;
            return;
        }

        if (input.up && this.IsGrounded()) {
            this.vy = FIGHTER.jumpStrength;
            this.ChangeState("jump");
        }

        const horizontal = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (horizontal !== 0) {
            this.vx = horizontal * FIGHTER.walkSpeed;
            if (this.IsGrounded()) this.ChangeState("walk");
            return;
        }

        this.vx *= FIGHTER.friction;
        if (this.IsGrounded()) this.ChangeState("idle");
    }

    UpdateLockedState(delta) {
        if (this.state === "hurt") {
            this.vx *= 0.9;
        }

        if (this.stateTimer <= 0 && this.state !== "ko") {
            this.currentAttackName = null;
            this.hitOnce = false;
            this.ChangeState(this.IsGrounded() ? "idle" : "jump");
        }
    }

    ApplyPhysics(delta, arena) {
        this.vy += FIGHTER.gravity * delta;
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        if (!this.IsGrounded()) {
            this.vx *= FIGHTER.airDrag;
        }

        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.vy = 0;
        }

        this.x = Math.max(arena.left + FIGHTER.pushRadius, Math.min(arena.right - FIGHTER.pushRadius, this.x));
        this.ResolveBodyPush(arena);
    }

    ResolveBodyPush(arena) {
        if (!this.opponent) return;

        const distance = this.opponent.x - this.x;
        const overlap = FIGHTER.pushRadius * 2 - Math.abs(distance);
        if (overlap <= 0) return;

        const direction = distance >= 0 ? -1 : 1;
        this.x += direction * overlap * 0.5;
        this.opponent.x -= direction * overlap * 0.5;
        this.x = Math.max(arena.left + FIGHTER.pushRadius, Math.min(arena.right - FIGHTER.pushRadius, this.x));
        this.opponent.x = Math.max(arena.left + FIGHTER.pushRadius, Math.min(arena.right - FIGHTER.pushRadius, this.opponent.x));
    }

    UpdateAnimation(delta) {
        const animation = ANIMATIONS[this.state] ?? ANIMATIONS.idle;
        this.frameTimer += delta;
        const frameDuration = 1 / animation.fps;

        while (this.frameTimer >= frameDuration) {
            this.frameTimer -= frameDuration;
            this.frameIndex += 1;

            if (this.frameIndex >= animation.frames.length) {
                this.frameIndex = animation.loop ? 0 : animation.frames.length - 1;
            }
        }
    }

    FaceOpponent() {
        if (!this.opponent || this.IsActionLocked()) return;
        this.facingRight = this.opponent.x >= this.x;
    }

    StartAttack(name) {
        const attack = ATTACKS[name];
        if (!attack) return;
        if (attack.meterCost && this.meter < attack.meterCost) return;

        this.currentAttackName = name;
        this.hitOnce = false;
        this.stateTimer = attack.duration;
        this.vx = this.vx * 0.35 + (this.facingRight ? 1 : -1) * (attack.lunge ?? 0);
        if (attack.meterCost) this.meter -= attack.meterCost;
        this.ChangeState(name);
    }

    TakeHit(hit) {
        if (this.hp <= 0) return;

        this.hp = Math.max(0, this.hp - hit.damage);
        this.meter = Math.min(100, this.meter + (hit.blocked ? 7 : 4));
        this.vx = hit.direction * hit.knockback;
        this.vy = this.IsGrounded() ? 0 : Math.min(this.vy, -80);
        this.invulnerableTimer = 0.06;
        this.currentAttackName = null;
        this.hitOnce = false;

        if (this.hp <= 0) {
            this.ChangeState("ko");
            this.stateTimer = 999;
            return;
        }

        this.ChangeState(hit.blocked ? "guard" : "hurt");
        this.stateTimer = hit.hitStun;
    }

    OnHit(meterGain = 0) {
        this.hitOnce = true;
        this.meter = Math.min(100, this.meter + meterGain);
    }

    PlayVictory() {
        if (this.hp <= 0) return;
        this.currentAttackName = null;
        this.hitOnce = false;
        this.ChangeState("victory");
    }

    PlayDefeat() {
        this.currentAttackName = null;
        this.hitOnce = false;
        this.ChangeState("ko");
        this.stateTimer = 999;
    }

    ChangeState(state) {
        if (this.state === state) return;

        this.state = state;
        this.frameIndex = 0;
        this.frameTimer = 0;
    }

    IsActionLocked() {
        return this.state === "light"
            || this.state === "heavy"
            || this.state === "special"
            || this.state === "hurt"
            || this.state === "ko";
    }

    IsGrounded() {
        return this.y >= this.groundY - 0.5;
    }

    IsInvulnerable() {
        return this.invulnerableTimer > 0 || this.hp <= 0;
    }

    IsBlocking(attacker) {
        if (this.state !== "guard" || !this.IsGrounded()) return false;
        return attacker.x > this.x ? this.facingRight : !this.facingRight;
    }

    CanHit() {
        const attack = this.GetCurrentAttack();
        if (!attack || this.hitOnce) return false;

        const elapsed = attack.duration - this.stateTimer;
        return elapsed >= attack.activeStart && elapsed <= attack.activeEnd;
    }

    GetCurrentAttack() {
        return ATTACKS[this.currentAttackName] ?? null;
    }

    GetAttackBox() {
        const attack = this.GetCurrentAttack();
        const width = attack.range;
        const x = this.facingRight ? this.x + 18 : this.x - 18 - width;

        return {
            x,
            y: this.y + attack.yOffset,
            width,
            height: attack.height,
        };
    }

    GetHurtBox() {
        return {
            x: this.x - FIGHTER.hurtWidth / 2,
            y: this.y - FIGHTER.hurtHeight,
            width: FIGHTER.hurtWidth,
            height: FIGHTER.hurtHeight,
        };
    }

    Draw(ctx) {
        this.DrawShadow(ctx);
        this.DrawSprite(ctx);
        this.DrawAttackArc(ctx);
    }

    DrawShadow(ctx) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
        ctx.beginPath();
        ctx.ellipse(this.x, this.groundY + 5, 48, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    DrawSprite(ctx) {
        const animation = ANIMATIONS[this.state] ?? ANIMATIONS.idle;
        const frame = animation.frames[this.frameIndex] ?? animation.frames[0];
        const drawWidth = FRAME.width * FIGHTER.scale;
        const drawHeight = FRAME.height * FIGHTER.scale;
        const drawX = this.x - drawWidth / 2;
        const drawY = this.y - drawHeight + 6;

        ctx.save();
        if (this.invulnerableTimer > 0) {
            ctx.globalAlpha = 0.68;
        }

        if (!this.facingRight) {
            ctx.translate(drawX + drawWidth, drawY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                frame.column * FRAME.width,
                frame.row * FRAME.height,
                FRAME.width,
                FRAME.height,
                0,
                0,
                drawWidth,
                drawHeight
            );
        } else {
            ctx.drawImage(
                this.image,
                frame.column * FRAME.width,
                frame.row * FRAME.height,
                FRAME.width,
                FRAME.height,
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );
        }

        ctx.restore();
    }

    DrawAttackArc(ctx) {
        const attack = this.GetCurrentAttack();
        if (!attack || !["light", "heavy", "special"].includes(this.state)) return;

        const elapsed = attack.duration - this.stateTimer;
        const active = elapsed >= attack.activeStart && elapsed <= attack.activeEnd;
        const progress = Math.max(0, Math.min(1, elapsed / attack.duration));
        const fade = Math.sin(progress * Math.PI);

        const box = this.GetAttackBox();
        ctx.save();
        ctx.strokeStyle = this.currentAttackName === "special"
            ? `rgba(92, 215, 255, ${active ? 0.82 : 0.34 * fade})`
            : `rgba(255, 238, 144, ${active ? 0.68 : 0.28 * fade})`;
        ctx.lineWidth = active
            ? this.currentAttackName === "light" ? 4 : 7
            : this.currentAttackName === "light" ? 2 : 4;
        ctx.beginPath();
        const startX = this.facingRight ? box.x + 8 : box.x + box.width - 8;
        const endX = this.facingRight ? box.x + box.width - 8 : box.x + 8;
        const midY = box.y + box.height / 2;
        ctx.moveTo(startX, midY - 20);
        ctx.quadraticCurveTo((startX + endX) / 2, midY + 18, endX, midY - 8);
        ctx.stroke();
        ctx.restore();
    }
}
