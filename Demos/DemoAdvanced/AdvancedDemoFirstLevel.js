import { Level } from "../../CoreCross/Level/Level.js";
import { Draw } from "../../Core2D/Graphics/Draw.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Collide2D } from "../../Core2D/Math/Collide2D.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { Engine } from "../../CoreCross/Engine.js";
import { Logger } from "../../CoreCross/Logger.js";
import { Screen } from "../../Core2D/Window/Screen.js";
import { UIWindow } from "../../Core2D/UI/UIWindow.js";
import { Camera } from "../../Core2D/Camera/Camera.js";
import { Player } from "./Player.js";
import { AudioManager } from "../../CoreCross/Audio/AudioManager.js";
import { JsonManifestComposer } from "../../CoreCross/Assets/JsonManifestComposer.js";
import { LevelBuilder } from "./Levels/LevelBuilder.js";
import { PlayerStatusHUD } from "./UI/PlayerStatusHUD.js";
import { CombatResolver2D } from "../../Core2D/Collision/CombatResolver2D.js";
import { FloatingText } from "../../Core2D/Effects/FloatingText.js";
import { ParallaxLayer2D } from "./Environment/ParallaxLayer2D.js";
import { AdvancedDemoProgress } from "./AdvancedDemoProgress.js";
import { InventorySystem } from "./Systems/InventorySystem.js";
import { SkillTreeSystem } from "./Systems/SkillTreeSystem.js";
import { PlayerProgressHUD } from "./UI/PlayerProgressHUD.js";

const STATUS_TEXT_INDEX = {
    defeated: 1,
    state: 2,
};

const PLAYER_STATUS = {
    running: { text: "Running smoothly", color: "#00FF00" },
    attacking: { text: "Attacking!", color: "#FF0000" },
    airborne: { text: "In the air!", color: "#FFD700" },
    damaged: { text: "Recovering!", color: "#FF9F43" },
};

export class AdvancedDemoFirstLevel extends Level {
    constructor(options = {}) {
        super();
        this.caption = options.caption ?? "GameForgeJS - Advanced Demo: Fase 1";
        this.TelaId = options.screenId ?? "AdvancedDemoFirstLevel";
        this.manifestName = options.manifestName ?? "advanced_level";
        this.phaseId = options.phaseId ?? "first";
        this.unlocksPhaseId = options.unlocksPhaseId ?? "second";
        this.returnToPhaseSelector = options.returnToPhaseSelector ?? true;
        this.completionTarget = options.completionTarget ?? null;
        this.levelConfig = null;
        this.hasFinished = false;
    }

    OnStart() {
        this.hasFinished = false;
        this.entities = [];
        this.blocks = [];
        this.enemies = [];
        this.damageNumbers = [];
        this.player = null;
        this.playerStatusHUD = null;
        this.progressHUD = null;
        this.inventory = null;
        this.skillTree = null;
        this.dialogWindow = null;
        this.parallaxLayers = [];
        this.rewardedEnemies = new Set();
        this.levelConfig = JsonManifestComposer.Compose(this.manifestName);

        if (!this.levelConfig) {
            throw new Error(`AdvancedDemoFirstLevel: manifest '${this.manifestName}' nao foi carregado.`);
        }

        super.OnStart();

        const width = this.levelConfig.screen.width;
        const height = this.levelConfig.screen.height;
        this.screen = new Screen(this.TelaId, width, height);
        this.draw = new Draw(this.screen);

        this.GameWorld = { ...this.levelConfig.world };
        this.camera = new Camera(new Vector2D(0, 0), new Vector2D(width, height));
        this.camera.Init(this.screen, this.GameWorld);

        this.CreateParallaxLayers();
        this.CreatePlayer();
        this.CreateProgressionSystems();
        this.BuildScenario();
        this.CreateDamageTextPool();
        this.CreateUI();
        this.PlayBGM();
    }

    CreatePlayer() {
        this.player = new Player(this.screen, this.levelConfig.player);
        this.AddEntity(this.player);

        this.playerStatusHUD = new PlayerStatusHUD(this.screen, this.player, this.levelConfig.ui?.playerHud);
        this.player.bulletPool.pool.forEach(bullet => this.AddEntity(bullet));
    }

    CreateProgressionSystems() {
        this.inventory = new InventorySystem(this.levelConfig.player.inventory);
        this.skillTree = new SkillTreeSystem(this.levelConfig.player.skillTree);
        const savedProgress = AdvancedDemoProgress.LoadPlayerProgress();
        this.inventory.Restore(savedProgress?.inventory);
        this.skillTree.Restore(savedProgress?.skillTree);
        this.skillTree.ApplyUnlockedEffects(this.player);
        this.progressHUD = new PlayerProgressHUD(
            this.screen,
            this.player,
            this.inventory,
            this.skillTree,
            this.levelConfig.ui?.progressHud
        );
    }

    PersistProgressionIfDirty(force = false) {
        if (!this.inventory || !this.skillTree) return;
        if (!force && !this.inventory.dirty && !this.skillTree.dirty) return;

        AdvancedDemoProgress.SavePlayerProgress({
            inventory: this.inventory.ToState(),
            skillTree: this.skillTree.ToState(),
        });

        this.inventory.dirty = false;
        this.skillTree.dirty = false;
    }

    BuildScenario() {
        new LevelBuilder(this)
            .SetBackground(this.levelConfig.background)
            .AddPlatforms(this.levelConfig.platforms)
            .AddObjects(this.levelConfig.objects)
            .AddEnemies(this.levelConfig.enemies, this.levelConfig.enemyDefaults)
            .Build();
    }

    CreateParallaxLayers() {
        const layers = this.levelConfig.parallax?.layers ?? [];
        this.parallaxLayers = layers.map(layer => new ParallaxLayer2D(this.screen, layer));
    }

    CreateDamageTextPool() {
        const textConfig = this.levelConfig.floatingText;
        this.damageNumbers = Array.from(
            { length: textConfig.poolSize },
            () => new FloatingText(this.screen)
        );
        this.damageNumbers.forEach(text => this.AddEntity(text));
    }

    CreateUI() {
        const uiConfig = this.levelConfig.ui?.statusWindow;
        if (!uiConfig) return;

        const uiBaseImage = AssetManager.instance.GetImage("window_base");
        this.dialogWindow = new UIWindow(
            this.screen,
            uiBaseImage,
            uiConfig.x,
            uiConfig.y,
            uiConfig.width,
            uiConfig.height,
            uiConfig.cornerSize
        );

        uiConfig.texts.forEach(text => {
            this.dialogWindow.AddText(
                text.text,
                text.x,
                text.y,
                text.color,
                text.fontSize,
                text.font
            );
        });
    }

    PlayBGM() {
        const audioConfig = this.levelConfig.audio;
        if (!audioConfig?.bgm) return;

        let bgm = AssetManager.instance.GetAudio(audioConfig.bgm);
        AudioManager.instance.PlayBGM(bgm, audioConfig.bgmVolume);
    }

    ApplyBlockCollision(entity) {
        entity.isGrounded = false;
        const floorSnapTolerance = this.levelConfig.collision.floorSnapTolerance;

        for (let block of this.blocks) {
            if (!Collide2D.isCollidingAABB(entity, block) || entity.vy < 0) {
                continue;
            }

            const previousY = entity.previousPosition?.y ?? entity.position.y;
            const previousBottom = previousY + entity.size.y;
            const blockTop = block.position.y;
            const entityLeft = entity.position.x;
            const entityRight = entity.position.x + entity.size.x;
            const blockLeft = block.position.x;
            const blockRight = block.position.x + block.size.x;
            const overlapsHorizontally = entityRight > blockLeft && entityLeft < blockRight;
            const cameFromAbove = previousBottom <= blockTop + floorSnapTolerance;

            if (overlapsHorizontally && cameFromAbove) {
                entity.position.y = blockTop - entity.size.y;
                entity.vy = 0;
                entity.isGrounded = true;
            }
        }
    }

    ResetLevel(reason = "defeat") {
        this.hasFinished = false;
        const message = reason === "victory"
            ? "Fase concluida. Reiniciando demo..."
            : "GAME OVER! Reiniciando...";
        Logger.log("info", message);
        this.player.Reset(this.levelConfig.player.spawn);

        this.enemies.forEach((enemy, index) => {
            enemy.Reset(this.levelConfig.enemies[index] ?? enemy.spawn);
        });

        this.damageNumbers?.forEach(text => {
            text.active = false;
        });

        this.rewardedEnemies?.clear();
    }

    FailLevel(reason = "defeat") {
        if (this.hasFinished) return;

        this.hasFinished = true;
        Logger.log("info", reason === "fall" ? "GAME OVER! Queda fora da fase." : "GAME OVER! Jogador derrotado.");

        if ((this.LEVEL_HANDLER?.levels?.length ?? 0) > 1) {
            AdvancedDemoProgress.GoToGameOver(this);
            return;
        }

        this.ResetLevel(reason);
    }

    SpawnDamageNumber(amount, x, y) {
        const textConfig = this.levelConfig.floatingText;
        const text = this.damageNumbers.find(item => !item.active) ?? this.damageNumbers[0];
        const isStrongHit = amount >= textConfig.strongDamageThreshold;

        text.Spawn(`-${amount}`, x, y + textConfig.spawnOffsetY, {
            color: isStrongHit ? textConfig.strongColor : textConfig.normalColor,
            fontSize: isStrongHit ? textConfig.strongFontSize : textConfig.normalFontSize,
            velocityX: isStrongHit ? textConfig.strongVelocityX : textConfig.normalVelocityX,
            velocityY: textConfig.velocityY,
            lifeTime: isStrongHit ? textConfig.strongLifeTime : textConfig.normalLifeTime,
        });
    }

    ApplyDamageFeedback(hit) {
        const damage = hit.damage ?? hit.hitbox?.damage ?? this.player.attack;
        const position = hit.position ?? {
            x: hit.defender?.owner?.position?.x ?? this.player.position.x,
            y: hit.defender?.owner?.position?.y ?? this.player.position.y,
        };
        const fallbackHitStop = this.levelConfig.player.combat.defaultHitStop;

        this.SpawnDamageNumber(damage, position.x, position.y);
        Engine.HitStop(hit.hitStop ?? hit.hitbox?.hitStop ?? fallbackHitStop);
        this.ApplyCameraShake(damage);
    }

    ApplyCameraShake(damage, type = null) {
        const shakeConfig = this.levelConfig.cameraShake;
        if (!shakeConfig || !this.camera) return;

        const textConfig = this.levelConfig.floatingText;
        const key = type ?? (damage >= textConfig.strongDamageThreshold ? "strong" : "light");
        const shake = shakeConfig[key];
        if (!shake) return;

        this.camera.Shake(shake.duration, shake.intensity, shake.frequency);
    }

    HandleEnemyDefeated(enemy) {
        if (!enemy || this.rewardedEnemies.has(enemy)) return;

        this.rewardedEnemies.add(enemy);
        this.inventory?.OnEnemyDefeated(this.skillTree);
    }

    HandlePlayerEnemyContact() {
        const contactHit = this.levelConfig.player.combat.contactDamage;

        for (const enemy of this.enemies) {
            if (!enemy.active || enemy.isTakingDamage) continue;
            if (enemy.UsesAttackHitbox?.()) continue;
            if (!Collide2D.isCollidingAABB(this.player, enemy)) continue;

            const direction = this.player.position.x < enemy.position.x ? -1 : 1;
            const hitApplied = this.player.TakeDamage(direction, contactHit);

            if (!hitApplied) return;

            this.SpawnDamageNumber(contactHit.damage, this.player.position.x + (this.player.size.x / 2), this.player.position.y);
            Engine.HitStop(contactHit.hitStop);
            this.ApplyCameraShake(contactHit.damage, "playerDamage");

            if (this.player.hp <= 0) {
                this.FailLevel("defeat");
            }

            return;
        }
    }

    ResolvePlayerAttacks() {
        const enemyHurtboxes = this.enemies
            .filter(enemy => enemy.active)
            .map(enemy => enemy.boxes);

        CombatResolver2D.Resolve(this.player.boxes, enemyHurtboxes, {
            onHit: (hit) => {
                const { defender } = hit;
                const dir = this.player.facingRight ? 1 : -1;
                const result = defender.owner.TakeDamage(dir, hit);
                this.ApplyDamageFeedback(hit);
                if (result?.killed) this.HandleEnemyDefeated(defender.owner);
            }
        });
    }

    ResolveEnemyAttacks() {
        const activeAttackers = this.enemies.filter(enemy => enemy.active && enemy.isAttacking);

        activeAttackers.forEach(enemy => {
            const attack = enemy.GetAttackHitDefaults();

            CombatResolver2D.Resolve(enemy.boxes, this.player.boxes, {
                defaultDamage: attack.damage,
                defaultKnockback: attack.knockback,
                defaultHitStop: attack.hitStop,
                defaultHitStun: attack.hitStun,
                defaultStagger: attack.stagger,
                onHit: (hit) => {
                    const direction = enemy.facingRight ? 1 : -1;
                    const hitApplied = this.player.TakeDamage(direction, hit);
                    if (!hitApplied) return;

                    const damage = hit.damage ?? attack.damage;
                    const position = hit.position ?? {
                        x: this.player.position.x + (this.player.size.x / 2),
                        y: this.player.position.y,
                    };

                    this.SpawnDamageNumber(damage, position.x, position.y);
                    Engine.HitStop(hit.hitStop ?? attack.hitStop);
                    this.ApplyCameraShake(damage, "playerDamage");

                    if (this.player.hp <= 0) {
                        this.FailLevel("defeat");
                    }
                },
            });
        });
    }

    HandleBulletCollisions() {
        const bulletHit = this.levelConfig.player.combat.bulletHit;

        this.player.bulletPool.pool.forEach(bullet => {
            if (!bullet.active) return;

            this.enemies.forEach(enemy => {
                if (!enemy.active || enemy.isTakingDamage) return;
                if (!Collide2D.isCollidingAABB(bullet, enemy)) return;

                const hit = {
                    damage: this.player.attack,
                    knockback: bulletHit.knockback,
                    hitStop: bulletHit.hitStop,
                    position: {
                        x: bullet.position.x + (bullet.size.x / 2),
                        y: bullet.position.y,
                    },
                };

                const result = enemy.TakeDamage(bullet.direction, hit);
                this.ApplyDamageFeedback(hit);
                if (result?.killed) this.HandleEnemyDefeated(enemy);
                bullet.active = false;
            });
        });
    }

    UpdateStatusWindow() {
        if (!this.dialogWindow || this.dialogWindow.children.length === 0) return;

        const defeatedText = this.dialogWindow.children[STATUS_TEXT_INDEX.defeated];
        const stateText = this.dialogWindow.children[STATUS_TEXT_INDEX.state];
        const defeatedCount = this.enemies.filter(e => !e.active).length;

        if (defeatedText) {
            defeatedText.text = `Enemies Defeated: ${defeatedCount} / ${this.enemies.length}`;
        }

        if (!stateText) return;

        let status = PLAYER_STATUS.running;
        if (this.player.isTakingDamage) status = PLAYER_STATUS.damaged;
        else if (this.player.isAttacking) status = PLAYER_STATUS.attacking;
        else if (!this.player.isGrounded) status = PLAYER_STATUS.airborne;

        stateText.text = `Status: ${status.text}`;
        stateText.color = status.color;
    }

    OnUpdate(dt) {
        this.progressHUD?.OnUpdate(dt);
        this.PersistProgressionIfDirty();
        const isUiBlocking = this.progressHUD?.BlocksGameplay() ?? false;

        if (!isUiBlocking) {
            super.OnUpdate(dt);
        }

        this.parallaxLayers.forEach(layer => layer.OnUpdate(dt));

        if (isUiBlocking) {
            this.UpdateStatusWindow();
            this.playerStatusHUD?.OnUpdate(dt);
            this.camera.Update(this.player, dt);
            return;
        }

        this.ApplyBlockCollision(this.player);
        this.enemies.forEach(enemy => {
            if (enemy.active) this.ApplyBlockCollision(enemy);
        });

        if (this.player.position.y > this.GameWorld.height) {
            this.FailLevel("fall");
            return;
        }

        this.ResolvePlayerAttacks();
        this.ResolveEnemyAttacks();
        if (this.hasFinished) return;

        this.HandlePlayerEnemyContact();
        if (this.hasFinished) return;

        this.HandleBulletCollisions();
        if (this.hasFinished) return;
        this.PersistProgressionIfDirty();

        if (this.CanCompleteLevel()) {
            this.CompleteLevel();
        }

        this.UpdateStatusWindow();
        this.playerStatusHUD?.OnUpdate(dt);
        this.camera.Update(this.player, dt);
    }

    OnDrawn() {
        if (this.screen) this.screen.Refresh();

        const hasParallax = this.parallaxLayers.length > 0;
        if (hasParallax) {
            this.parallaxLayers.forEach(layer => layer.OnDrawn(this.camera));
        }

        this.camera.Begin();

        if (!hasParallax && this.bgImage) {
            let bgWidth = this.bgImage.width || this.levelConfig.screen.width;
            for (let i = 0; i < this.GameWorld.width; i += bgWidth) {
                this.draw.DrawSprite(this.bgImage, i, 0);
            }
        }

        this.entities
            .slice()
            .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
            .forEach(entity => {
                if (typeof entity.OnDrawn === "function") entity.OnDrawn();
            });

        this.camera.End();

        this.playerStatusHUD?.OnDrawn();
        this.progressHUD?.OnDrawn();

        if (this.dialogWindow) {
            this.dialogWindow.OnDrawn();
        }
    }

    CompleteLevel() {
        if (this.hasFinished) return;

        this.hasFinished = true;
        Logger.log("info", "PARABENS! Fase concluida.");
        this.PersistProgressionIfDirty(true);
        AdvancedDemoProgress.Complete(this.phaseId, this.unlocksPhaseId);

        if (this.completionTarget === "congratulations") {
            AdvancedDemoProgress.GoToCongratulations(this);
            return;
        }

        if (this.returnToPhaseSelector && this.LEVEL_HANDLER?.levels?.length > 1) {
            AdvancedDemoProgress.GoToPhaseSelector(this);
            return;
        }

        if ((this.LEVEL_HANDLER?.levels?.length ?? 0) > 1) {
            this.Next = true;
            return;
        }

        this.ResetLevel("victory");
    }

    CanCompleteLevel() {
        const victory = this.levelConfig.victory ?? {};
        const reachedGoal = this.player.position.x > victory.x;
        const defeatedAllEnemies = this.enemies.every(enemy => !enemy.active);

        if (victory.requireAllEnemies) {
            return reachedGoal && defeatedAllEnemies;
        }

        return reachedGoal;
    }

    OnExit() {
        this.PersistProgressionIfDirty(true);
        super.OnExit();
        this.entities = [];
        this.blocks = [];
        this.enemies = [];
        this.damageNumbers = [];
        this.player = null;
        this.playerStatusHUD = null;
        this.progressHUD = null;
        this.inventory = null;
        this.skillTree = null;
        this.dialogWindow = null;
        this.parallaxLayers = [];
        this.rewardedEnemies = null;
        this.screen = null;
        this.levelConfig = null;
    }
}
