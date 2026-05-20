import { GameObject } from "../../Core2D/Objects/GameObject.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Animator } from "../../Core2D/Graphics/Animator.js";
import { AudioManager } from "../../CoreCross/Audio/AudioManager.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { BoxController2D } from "../../Core2D/Collision/BoxController2D.js";
import { ComboController } from "../../Core2D/Combat/ComboController.js";
import { IdleState } from "./States/PlayerStates/PlayerIdleState.js";
import { ObjectPool } from "../../CoreCross/ObjectPool.js";
import { Bullet } from "./Bullet.js";
import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { StateMachine } from "./States/StateMachine.js";

const DEFAULT_PLAYER_CONFIG = {
    spawn: { x: 100, y: 300 },
    scale: 1.7,
    bodySize: { width: 26, height: 37 },
    movement: {
        speed: 200,
        gravity: 900,
        jumpStrength: -450,
    },
    stats: {
        hp: 100,
        attack: 10,
        defense: 0,
    },
    combat: {
        defaultHitStop: 0.06,
        invulnerabilityTime: 0.85,
        hurtLockTime: 0.22,
        knockbackDrag: 0.82,
        invulnerabilityFlickerInterval: 0.08,
        contactDamage: {
            knockback: { x: 280, y: -320 },
        },
        bulletHit: {
            hitStop: 0.045,
            knockback: { x: 380, y: -320 },
        },
    },
    combo: [
        { animation: "Attack_1", chainFromFrame: 3 },
        { animation: "Attack_2", chainFromFrame: 2 },
        { animation: "Attack_3", chainFromFrame: 3 },
    ],
    projectile: {
        width: 10,
        height: 5,
        speed: 600,
        despawnLeft: -1000,
        despawnRight: 3000,
    },
    bulletPoolSize: 10,
};

const PLAYER_ANIMATIONS = [
    { name: "Idle", asset: "heroi_idle", row: 0, frames: 7, speed: 8, pivotX: 0.5, pivotY: 1, groundOffset: 37 },
    { name: "Run", asset: "heroi_run", row: 0, frames: 8, speed: 5, pivotX: 0.5, pivotY: 1, groundOffset: 37 },
    { name: "Walk", asset: "heroi_walk", row: 0, frames: 8, speed: 8, pivotX: 0.5, pivotY: 1, groundOffset: 37 },
    { name: "Jump", asset: "heroi_jump", row: 0, frames: 5, speed: 8, pivotX: 0.5, pivotY: 1, groundOffset: 37, loop: false },
    { name: "Attack_1", asset: "heroi_attack_01", row: 0, frames: 6, speed: 5, pivotX: 0.5, pivotY: 1, groundOffset: 37, loop: false },
    { name: "Attack_2", asset: "heroi_attack_02", row: 0, frames: 5, speed: 5, pivotX: 0.5, pivotY: 1, groundOffset: 37, loop: false },
    { name: "Attack_3", asset: "heroi_attack_03", row: 0, frames: 6, speed: 5, pivotX: 0.5, pivotY: 1, groundOffset: 37, loop: false },
    { name: "Hurt", asset: "heroi_hurt", row: 0, frames: 4, speed: 10, pivotX: 0.5, pivotY: 1, groundOffset: 0, loop: false },
    { name: "Death", asset: "heroi_death", row: 0, frames: 12, speed: 10, pivotX: 0.5, pivotY: 1, groundOffset: 0, loop: false },
    { name: "Defend", asset: "heroi_defend", row: 0, frames: 6, speed: 10, pivotX: 0.5, pivotY: 1, groundOffset: 0 },
];

function mergePlayerConfig(config = {}) {
    return {
        ...DEFAULT_PLAYER_CONFIG,
        ...config,
        spawn: { ...DEFAULT_PLAYER_CONFIG.spawn, ...config.spawn },
        bodySize: { ...DEFAULT_PLAYER_CONFIG.bodySize, ...config.bodySize },
        movement: { ...DEFAULT_PLAYER_CONFIG.movement, ...config.movement },
        stats: { ...DEFAULT_PLAYER_CONFIG.stats, ...config.stats },
        combat: {
            ...DEFAULT_PLAYER_CONFIG.combat,
            ...config.combat,
            contactDamage: {
                ...DEFAULT_PLAYER_CONFIG.combat.contactDamage,
                ...config.combat?.contactDamage,
                knockback: {
                    ...DEFAULT_PLAYER_CONFIG.combat.contactDamage.knockback,
                    ...config.combat?.contactDamage?.knockback,
                },
            },
            bulletHit: {
                ...DEFAULT_PLAYER_CONFIG.combat.bulletHit,
                ...config.combat?.bulletHit,
                knockback: {
                    ...DEFAULT_PLAYER_CONFIG.combat.bulletHit.knockback,
                    ...config.combat?.bulletHit?.knockback,
                },
            },
        },
        combo: config.combo ?? DEFAULT_PLAYER_CONFIG.combo,
        projectile: { ...DEFAULT_PLAYER_CONFIG.projectile, ...config.projectile },
    };
}

export class Player extends GameObject {
    constructor(screen, config = {}) {
        super();

        this.config = mergePlayerConfig(config);
        this.name = "Player";
        this.zIndex = 50;
        this.spawn = new Vector2D(this.config.spawn.x, this.config.spawn.y);
        this.position = new Vector2D(this.spawn.x, this.spawn.y);
        this.previousPosition = new Vector2D(this.spawn.x, this.spawn.y);
        this.scale = this.config.scale;
        this.size = new Vector2D(
            this.config.bodySize.width * this.scale,
            this.config.bodySize.height * this.scale
        );
        this.speed = this.config.movement.speed;
        this.screen = screen;
        this.draw = new Draw(screen);

        this.vy = 0;
        this.gravity = this.config.movement.gravity;
        this.jumpStrength = this.config.movement.jumpStrength;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isTakingDamage = false;
        this.invulnerabilityTime = this.config.combat.invulnerabilityTime;
        this.invulnerabilityRemaining = 0;
        this.hurtLockTime = this.config.combat.hurtLockTime;
        this.hurtLockRemaining = 0;
        this.hurtVelocityX = 0;
        this.knockbackDrag = this.config.combat.knockbackDrag;
        this.invulnerabilityFlickerInterval = this.config.combat.invulnerabilityFlickerInterval;

        const idleImage = AssetManager.instance.GetImage("heroi_idle");
        this.sprite.sprite = idleImage;
        this.sprite.screen = screen;

        this.animator = new Animator(this.sprite);
        this.RegisterAnimations();

        this.facingRight = true;

        this.combo = new ComboController(this, this.config.combo);

        this.boxes = new BoxController2D(this, AssetManager.instance.GetJson("player_boxes"));
        this.bulletPool = new ObjectPool(
            () => new Bullet(this.screen, this.config.projectile),
            this.config.bulletPoolSize
        );

        this.maxHP = this.config.stats.hp;
        this.hp = this.maxHP;
        this.attack = this.config.stats.attack;
        this.defense = this.config.stats.defense;

        this.stateMachine = new StateMachine(this);
        this.stateMachine.ChangeState(new IdleState(this));
    }

    RegisterAnimations() {
        PLAYER_ANIMATIONS.forEach(animation => {
            const image = AssetManager.instance.GetImage(animation.asset);
            this.animator.AddAnimation(
                animation.name,
                image,
                animation.row,
                animation.frames,
                animation.speed,
                animation.pivotX,
                animation.pivotY,
                animation.groundOffset,
                null,
                { loop: animation.loop ?? true }
            );
        });
    }

    Reset(spawn = this.config.spawn) {
        this.spawn = new Vector2D(spawn.x, spawn.y);
        this.position = new Vector2D(this.spawn.x, this.spawn.y);
        this.previousPosition = new Vector2D(this.spawn.x, this.spawn.y);
        this.vy = 0;
        this.hurtVelocityX = 0;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isTakingDamage = false;
        this.invulnerabilityRemaining = 0;
        this.hurtLockRemaining = 0;
        this.hp = this.maxHP;
        this.combo.Reset();
        this.boxes.ResetHitMemory();
        this.bulletPool.pool.forEach(bullet => {
            bullet.active = false;
        });
        this.stateMachine.currentState = null;
        this.stateMachine.ChangeState(new IdleState(this));
    }

    IsMovingInput() {
        return ActionManager.IsAction("RIGHT") || ActionManager.IsAction("LEFT");
    }

    IsJumpInput() {
        return ActionManager.IsActionDown("JUMP") && this.isGrounded;
    }

    IsInvulnerable() {
        return this.invulnerabilityRemaining > 0;
    }

    ApplyMovement(dt) {
        if (ActionManager.IsAction("RIGHT")) {
            this.position.x += this.speed * dt;
            this.facingRight = true;
        }
        if (ActionManager.IsAction("LEFT")) {
            this.position.x -= this.speed * dt;
            this.facingRight = false;
        }
    }

    DoJump() {
        this.vy = this.jumpStrength;
        this.isGrounded = false;
        let jumpSound = AssetManager.instance.GetAudio("sfx_jump");
        AudioManager.instance.PlaySFX(jumpSound, 0.8);
    }

    TakeDamage(direction, hit = {}) {
        if (this.IsInvulnerable() || this.hp <= 0) return false;

        const rawDamage = hit.damage ?? 0;
        const damage = Math.max(0, rawDamage - this.defense);
        const knockback = hit.knockback ?? this.config.combat.contactDamage.knockback;

        this.hp = Math.max(0, this.hp - damage);
        this.invulnerabilityRemaining = this.invulnerabilityTime;
        this.hurtLockRemaining = this.hurtLockTime;
        this.hurtVelocityX = (knockback.x ?? 0) * direction;
        this.vy = knockback.y ?? this.vy;
        this.isTakingDamage = true;
        this.isAttacking = false;

        this.InterruptCurrentState();
        this.combo.Reset();
        this.boxes.ResetHitMemory();
        this.animator.Play(this.hp <= 0 ? "Death" : "Hurt");

        return true;
    }

    Heal(amount = 0) {
        if (this.hp <= 0 || amount <= 0) return false;

        this.hp = Math.min(this.maxHP, this.hp + amount);
        return true;
    }

    IncreaseMaxHP(amount = 0, heal = false) {
        if (amount <= 0) return;

        this.maxHP += amount;
        if (heal) {
            this.hp = Math.min(this.maxHP, this.hp + amount);
        }
    }

    AddAttack(amount = 0) {
        this.attack = Math.max(0, this.attack + amount);
    }

    AddDefense(amount = 0) {
        this.defense = Math.max(0, this.defense + amount);
    }

    InterruptCurrentState() {
        const currentState = this.stateMachine.currentState;
        if (!currentState) return;

        currentState.locked = false;
        currentState.Exit();
        this.stateMachine.currentState = null;
    }

    UpdateHurtState(delta) {
        if (this.hurtLockRemaining <= 0) return false;

        this.hurtLockRemaining = Math.max(0, this.hurtLockRemaining - delta);
        this.position.x += this.hurtVelocityX * delta;
        this.hurtVelocityX *= this.knockbackDrag;

        if (this.hurtLockRemaining === 0) {
            this.isTakingDamage = false;
            this.hurtVelocityX = 0;
            this.stateMachine.ChangeState(new IdleState(this));
        }

        return true;
    }

    UpdateInvulnerability(delta) {
        if (this.invulnerabilityRemaining <= 0) return;
        this.invulnerabilityRemaining = Math.max(0, this.invulnerabilityRemaining - delta);
    }

    OnUpdate(dt) {
        const delta = Math.min(dt ?? 1 / 60, 1 / 30);
        this.previousPosition = new Vector2D(this.position.x, this.position.y);

        this.UpdateInvulnerability(delta);

        this.vy += this.gravity * delta;
        this.position.y += this.vy * delta;

        if (!this.UpdateHurtState(delta)) {
            this.stateMachine.Update(delta);
        }

        this.sprite.Update(delta);
        this.animator.Update(delta);
    }

    OnDrawn() {
        this.boxes.DrawDebug(this.draw);

        let anim = this.animator.currentAnimation;
        let frameW = this.sprite.size.x * this.scale;
        let frameH = this.sprite.size.y * this.scale;

        let pivotX = frameW * anim.pivotX;
        let pivotY = frameH * anim.pivotY;

        let drawX = this.position.x + (this.size.x / 2) - pivotX;
        let drawY = this.position.y + this.size.y - pivotY + anim.groundOffset;
        let renderPos = new Vector2D(drawX, drawY);
        const ctx = this.sprite.screen.Context;

        ctx.save();
        if (this.ShouldBlinkInvulnerability()) {
            ctx.globalAlpha = 0.45;
        }

        this.sprite.Animation(
            undefined,
            renderPos,
            "horizontal",
            this.sprite.row,
            this.facingRight,
            this.scale
        );

        ctx.restore();
    }

    ShouldBlinkInvulnerability() {
        if (!this.IsInvulnerable()) return false;

        const interval = this.invulnerabilityFlickerInterval;
        const blinkPhase = Math.floor(this.invulnerabilityRemaining / interval);
        return blinkPhase % 2 === 0;
    }
}
