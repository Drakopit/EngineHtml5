import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { Input } from "../../CoreCross/Input/Input.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import {
    AmbientLight,
    BoxCollider3D,
    DirectionalLight,
    HemisphereLight,
    Level3D,
    Mesh,
    ModelMeshFactory,
    PerspectiveCamera,
    PointLight,
    PrimitiveMesh,
    Rigidbody3D,
    Skybox,
    SphereCollider3D,
    StandardMaterial,
    Texture,
    UnlitMaterial,
} from "../../Core3D/index.js";
import {
    COINS,
    COURSE_BOUNDS,
    GOAL,
    PLATFORMS,
    PLAYER_START,
} from "./data/SkyTrailCourse.js";

const FALL_LIMIT = -4.5;

export class CubeGameLevel extends Level3D {
    constructor() {
        super({
            width: 720,
            height: 480,
            clearColor: [0.32, 0.62, 0.9, 1],
            usePhysics: true,
        });
        this.TelaId = "CubeGame";
        this.caption = "GameForgeJS - Sky Trail 3D";
        this.goalCoins = COINS.length;
        this.score = 0;
        this.falls = 0;
        this.collectedCoins = 0;
        this.goalUnlocked = false;
        this.gameState = "PLAYING";
        this.time = 0;
        this.cameraYaw = 0;
        this.cameraTarget = [...PLAYER_START];
        this.cameraReady = false;
    }

    BuildScene() {
        this.physics.gravity = [0, -16, 0];
        this.physics.bounds = COURSE_BOUNDS;

        this.camera = new PerspectiveCamera({
            fov: 56,
            aspect: this.width / this.height,
            near: 0.1,
            far: 140,
            position: [0, 5.0, 8.0],
            target: [0, 0, -2],
        });
        this.scene.Add(this.camera);

        const skyImage = AssetManager.instance.GetImage("sky_cross");
        if (skyImage) this.scene.Add(Skybox.FromImage(skyImage, { name: "SunnySky" }));

        this.scene.Add(new AmbientLight({ color: [0.95, 0.98, 1.0], intensity: 0.13 }));
        this.scene.Add(new HemisphereLight({
            skyColor: [0.62, 0.8, 1.0],
            groundColor: [0.2, 0.3, 0.17],
            intensity: 0.48,
        }));
        this.scene.Add(new DirectionalLight({
            direction: [-0.44, -1.0, -0.3],
            color: [1.0, 0.95, 0.8],
            intensity: 1.72,
            castShadow: true,
            shadowMapSize: 1024,
            shadowDistance: 30,
        }));
        this.scene.Add(new PointLight({
            position: [GOAL.trigger[0], GOAL.trigger[1] + 1.3, GOAL.trigger[2]],
            color: [0.38, 1, 0.52],
            intensity: 1.1,
            range: 5,
        }));

        this.CreatePlatforms();
        this.UpdatePlatforms();
        this.CreatePlayer();
        this.CreateCoins();
        this.CreateGoal();
        this.UpdateCamera(1);
    }

    CreatePlatforms() {
        const assets = AssetManager.instance;
        const albedoMap = assets.HasImage("grid_albedo")
            ? Texture.FromImage(assets.GetImage("grid_albedo"))
            : Texture.FromImage(assets.GetImage("textura_chao"));
        const normalMap = assets.HasImage("grid_normal")
            ? Texture.FromImage(assets.GetImage("grid_normal"))
            : null;

        this.platforms = PLATFORMS.map(definition => {
            const material = new StandardMaterial({
                name: `PlatformMaterial_${definition.id}`,
                albedoMap,
                normalMap,
                albedoColor: definition.color,
                roughness: 0.82,
            });
            const mesh = Mesh.FromGeometry(
                PrimitiveMesh.Cube(),
                material,
                { name: `Platform_${definition.id}`, castShadow: true, receiveShadow: true },
            );
            mesh.transform.SetPosition(...definition.position).SetScale(...definition.size);
            this.scene.Add(mesh);
            const body = this.physics.AddBody({
                object: mesh,
                collider: new BoxCollider3D({ size: definition.size }),
                tag: "platform",
            });
            return {
                definition,
                mesh,
                material,
                body,
                active: true,
                delta: [0, 0, 0],
            };
        });
        this.platformById = new Map(this.platforms.map(platform => [platform.definition.id, platform]));
    }

    CreatePlayer() {
        const material = new StandardMaterial({
            name: "CharacterMaterial",
            albedoMap: Texture.FromImage(AssetManager.instance.GetImage("textura_player")),
            roughness: 0.62,
            metallic: 0,
        });

        this.playerModel = ModelMeshFactory.FromAsset("character", { material, name: "PlayerCharacter" });
        this.playerModel
            .SetPosition(...PLAYER_START)
            .SetScale(0.72)
            .SetRotation(0, Math.PI, 0)
            .AddTo(this.scene);

        this.playerBody = new Rigidbody3D({
            mass: 1,
            damping: 0.94,
            bounciness: 0,
        });
        this.physics.AddBody({
            object: this.playerModel,
            rigidbody: this.playerBody,
            collider: new SphereCollider3D({ radius: 0.38, offset: [0, 0.38, 0] }),
            tag: "player",
        });
        this.playerFacing = Math.PI;
    }

    CreateCoins() {
        const coinTexture = AssetManager.instance.HasImage("textura_coin")
            ? Texture.FromImage(AssetManager.instance.GetImage("textura_coin"))
            : null;

        this.coins = COINS.map((definition, index) => {
            const mesh = Mesh.FromGeometry(
                PrimitiveMesh.Sphere(0.22, { widthSegments: 24, heightSegments: 12 }),
                new StandardMaterial({
                    name: `CoinMaterial_${index}`,
                    albedoMap: coinTexture,
                    albedoColor: [1.0, 0.78, 0.18, 1],
                    roughness: 0.2,
                    metallic: 0.18,
                    emissiveColor: [0.18, 0.1, 0.01],
                }),
                { name: `Coin_${index}`, castShadow: true, receiveShadow: false },
            );
            mesh.transform.SetPosition(...this.GetAttachmentPosition(definition));
            this.scene.Add(mesh);
            return {
                definition,
                mesh,
                active: true,
                value: definition.value,
                radius: 0.22,
            };
        });
    }

    CreateGoal() {
        this.goalRingMaterial = new UnlitMaterial({ name: "GoalRing", color: [1, 0.48, 0.2, 1] });
        this.goalFlagMaterial = new UnlitMaterial({ name: "GoalFlag", color: [1, 0.42, 0.22, 1] });
        this.goalBeaconMaterial = new StandardMaterial({
            name: "GoalBeacon",
            albedoColor: [1, 0.48, 0.2, 1],
            emissiveColor: [0.3, 0.05, 0.01],
            roughness: 0.28,
        });

        const pole = Mesh.FromGeometry(
            PrimitiveMesh.Cube(),
            new StandardMaterial({ name: "GoalPole", albedoColor: [0.92, 0.96, 1, 1], metallic: 0.3 }),
            { name: "GoalPole", castShadow: true, receiveShadow: true },
        );
        pole.transform.SetPosition(...GOAL.pole).SetScale(0.07, 3.1, 0.07);
        this.scene.Add(pole);

        this.goalFlag = Mesh.FromGeometry(
            PrimitiveMesh.Cube(),
            this.goalFlagMaterial,
            { name: "GoalFlag", castShadow: false, receiveShadow: false },
        );
        this.goalFlag.transform.SetPosition(...GOAL.flag).SetScale(0.92, 0.48, 0.055);
        this.scene.Add(this.goalFlag);

        this.goalRing = Mesh.FromGeometry(
            PrimitiveMesh.Ring(0.38, 0.55, { segments: 48 }),
            this.goalRingMaterial,
            { name: "GoalRing", castShadow: false, receiveShadow: false },
        );
        this.goalRing.transform.SetPosition(GOAL.trigger[0], GOAL.trigger[1] + 0.03, GOAL.trigger[2]);
        this.scene.Add(this.goalRing);

        this.goalBeacon = Mesh.FromGeometry(
            PrimitiveMesh.Sphere(0.18, { widthSegments: 20, heightSegments: 10 }),
            this.goalBeaconMaterial,
            { name: "GoalBeacon", castShadow: false, receiveShadow: false },
        );
        this.goalBeacon.transform.SetPosition(GOAL.trigger[0], GOAL.trigger[1] + 0.32, GOAL.trigger[2]);
        this.scene.Add(this.goalBeacon);
        this.SetGoalUnlocked(false);
    }

    OnUpdate(dt) {
        if (ActionManager.IsActionDown("CANCEL")) {
            this.Back = true;
            return;
        }

        const delta = Math.min(dt || 0.016, 0.05);
        this.time += delta;
        this.UpdatePlatforms();

        if (this.gameState === "WON") {
            if (ActionManager.IsActionDown("ATTACK")) this.ResetGame();
            this.UpdateGoal(delta);
            this.UpdateCamera(delta);
            return;
        }

        this.CarryPlayerOnPlatform();
        this.UpdatePlayerInput(delta);
        super.OnUpdate(delta);
        this.RecoverPlayerIfNeeded();
        this.playerModel.ApplyTransform();
        this.UpdateCoins(delta);
        this.CheckCoinCollision();
        this.UpdateGoal(delta);
        this.CheckGoalCollision();
        this.UpdateCamera(delta);
    }

    UpdatePlatforms() {
        this.platforms.forEach(platform => {
            const previous = [...platform.mesh.transform.position];
            const position = [...platform.definition.position];
            const motion = platform.definition.motion;
            if (motion) {
                const axis = { x: 0, y: 1, z: 2 }[motion.axis];
                position[axis] += Math.sin(this.time * motion.speed + motion.phase) * motion.amplitude;
            }

            platform.mesh.transform.SetPosition(...position);
            platform.delta = position.map((value, index) => value - previous[index]);
            this.UpdatePlatformAvailability(platform);
        });
    }

    UpdatePlatformAvailability(platform) {
        const blink = platform.definition.blink;
        if (!blink) return;

        const cycle = (this.time + blink.phase) % blink.period;
        const active = cycle < blink.solidDuration;
        const warning = active && cycle > blink.solidDuration - blink.warningDuration;
        platform.active = active;
        platform.body.enabled = active;
        platform.mesh.visible = active;
        platform.material.albedoColor = warning
            ? [1, 0.16, 0.12, 1]
            : [...platform.definition.color];
    }

    CarryPlayerOnPlatform() {
        if (!this.playerBody.grounded || !this.playerBody.groundBody) return;

        const platform = this.platforms.find(candidate => candidate.body === this.playerBody.groundBody);
        if (!platform?.active) return;

        platform.delta.forEach((movement, index) => {
            this.playerModel.transform.position[index] += movement;
        });
    }

    GetAttachmentPosition(definition) {
        const platformPosition = this.platformById.get(definition.platformId)?.mesh.transform.position ?? [0, 0, 0];
        return platformPosition.map((value, index) => value + definition.offset[index]);
    }

    UpdatePlayerInput(dt) {
        const horizontal = ActionManager.GetActionValue("RIGHT") - ActionManager.GetActionValue("LEFT");
        const forward = ActionManager.GetActionValue("FORWARD") - ActionManager.GetActionValue("BACK");
        const length = Math.hypot(horizontal, forward);
        const normalizedX = length > 1 ? horizontal / length : horizontal;
        const normalizedForward = length > 1 ? forward / length : forward;
        const sin = Math.sin(this.cameraYaw);
        const cos = Math.cos(this.cameraYaw);
        const directionX = normalizedX * cos - normalizedForward * sin;
        const directionZ = -normalizedX * sin - normalizedForward * cos;
        const speed = ActionManager.IsAction("BOOST") ? 7.0 : 5.45;
        const smoothing = 1 - Math.exp(-14 * dt);

        this.playerBody.velocity[0] += (directionX * speed - this.playerBody.velocity[0]) * smoothing;
        this.playerBody.velocity[2] += (directionZ * speed - this.playerBody.velocity[2]) * smoothing;

        if (length > 0.06) {
            const targetFacing = Math.atan2(directionX, directionZ);
            this.playerFacing = lerpAngle(this.playerFacing, targetFacing, 1 - Math.exp(-16 * dt));
            this.playerModel.transform.rotation.y = this.playerFacing;
        }

        if (ActionManager.IsActionDown("JUMP") && this.playerBody.grounded) {
            this.playerBody.velocity[1] = 6.15;
        }
    }

    RecoverPlayerIfNeeded() {
        const position = this.playerModel.transform.position;
        const invalid = position.some(value => !Number.isFinite(value));
        if (!invalid && position[1] >= FALL_LIMIT) return;

        this.falls++;
        this.score = Math.max(0, this.score - 5);
        this.ResetPlayerPosition();
    }

    UpdateCoins(dt) {
        this.coins.forEach((coin, index) => {
            if (!coin.active) return;

            const platform = this.platformById.get(coin.definition.platformId);
            const position = this.GetAttachmentPosition(coin.definition);
            coin.mesh.visible = platform?.active !== false;
            coin.mesh.transform.position[0] = position[0];
            coin.mesh.transform.position[1] = position[1] + Math.sin(this.time * 4.2 + index) * 0.08;
            coin.mesh.transform.position[2] = position[2];
            coin.mesh.transform.rotation.y += dt * 3.4;
        });
    }

    CheckCoinCollision() {
        const position = this.playerModel.transform.position;
        const playerCenter = [position[0], position[1] + 0.38, position[2]];

        this.coins.forEach(coin => {
            if (!coin.active || !coin.mesh.visible) return;

            const coinPosition = coin.mesh.transform.position;
            const distance = Math.hypot(
                coinPosition[0] - playerCenter[0],
                coinPosition[1] - playerCenter[1],
                coinPosition[2] - playerCenter[2],
            );
            if (distance > 0.72) return;

            coin.active = false;
            coin.mesh.visible = false;
            this.score += coin.value;
            this.collectedCoins++;
        });

        if (!this.goalUnlocked && this.collectedCoins >= this.goalCoins) {
            this.SetGoalUnlocked(true);
        }
    }

    CheckGoalCollision() {
        if (!this.goalUnlocked) return;

        const position = this.playerModel.transform.position;
        const distance = Math.hypot(
            position[0] - GOAL.trigger[0],
            position[1] - GOAL.trigger[1],
            position[2] - GOAL.trigger[2],
        );
        if (distance > GOAL.radius) return;

        this.gameState = "WON";
        this.score += 100;
        this.playerBody.velocity = [0, 0, 0];
    }

    SetGoalUnlocked(unlocked) {
        this.goalUnlocked = unlocked;
        this.goalRingMaterial.albedoColor = unlocked ? [0.2, 1, 0.44, 1] : [1, 0.43, 0.2, 1];
        this.goalFlagMaterial.albedoColor = unlocked ? [0.18, 0.95, 0.42, 1] : [1, 0.36, 0.16, 1];
        this.goalBeaconMaterial.albedoColor = unlocked ? [0.28, 1, 0.45, 1] : [1, 0.45, 0.15, 1];
        this.goalBeaconMaterial.emissiveColor = unlocked ? [0.08, 0.38, 0.13] : [0.28, 0.06, 0.01];
    }

    UpdateGoal() {
        const pulse = 1 + Math.sin(this.time * 4) * 0.09;
        this.goalRing.transform.SetScale(pulse, 1, pulse);
        this.goalBeacon.transform.position[1] = GOAL.trigger[1] + 0.32 + Math.sin(this.time * 3.5) * 0.08;
    }

    ResetGame() {
        this.score = 0;
        this.falls = 0;
        this.collectedCoins = 0;
        this.gameState = "PLAYING";
        this.time = 0;
        this.cameraYaw = 0;
        this.SetGoalUnlocked(false);
        this.UpdatePlatforms();
        this.ResetPlayerPosition();

        this.coins.forEach(coin => {
            coin.active = true;
            coin.mesh.visible = true;
        });
        this.UpdateCoins(0);
    }

    ResetPlayerPosition() {
        this.playerFacing = Math.PI;
        this.playerModel.SetPosition(...PLAYER_START).SetRotation(0, this.playerFacing, 0);
        this.playerBody.velocity = [0, 0, 0];
        this.cameraReady = false;
    }

    UpdateCamera(dt) {
        if (!this.camera || !this.playerModel) return;

        const cameraTurn = ActionManager.GetActionValue("CAMERA_RIGHT")
            - ActionManager.GetActionValue("CAMERA_LEFT");
        this.cameraYaw += cameraTurn * 2.25 * dt;

        const position = this.playerModel.transform.position;
        const desiredTarget = [position[0], position[1] + 0.65, position[2] - 0.75];
        const follow = this.cameraReady ? 1 - Math.exp(-8 * dt) : 1;
        this.cameraTarget = this.cameraTarget.map((value, index) => (
            value + (desiredTarget[index] - value) * follow
        ));
        const desiredPosition = [
            this.cameraTarget[0] + Math.sin(this.cameraYaw) * 7,
            this.cameraTarget[1] + 4.65,
            this.cameraTarget[2] + Math.cos(this.cameraYaw) * 7,
        ];
        const cameraPosition = this.camera.position.map((value, index) => (
            value + (desiredPosition[index] - value) * follow
        ));

        this.camera.SetPosition(...cameraPosition).LookAt(this.cameraTarget);
        this.cameraReady = true;
    }

    OnGUI() {
        if (!this.ui) return;

        const draw = this.ui.Draw;
        const ctx = draw.screen.Context;
        const controllerConnected = Input.GetConnectedGamepadIndices().length > 0;
        const remainingCoins = this.goalCoins - this.collectedCoins;
        const altitude = Math.max(0, this.playerModel.transform.position[1]).toFixed(1);

        ctx.save();
        ctx.globalAlpha = 0.54;
        draw.Color = "#07172A";
        draw.DrawRect(12, 12, 316, 118);
        ctx.restore();

        draw.SetTextAlign("left");
        draw.Font = "Arial";
        draw.FontSize = "21px";
        draw.Color = "#FFD76A";
        draw.DrawText(`Moedas: ${this.collectedCoins}/${this.goalCoins}`, 22, 39);
        draw.Color = "#FFFFFF";
        draw.FontSize = "15px";
        draw.DrawText(`Score: ${this.score}   Quedas: ${this.falls}`, 22, 65);
        draw.FontSize = "13px";
        draw.Color = this.goalUnlocked ? "#8DFFB7" : "#FFE0A3";
        draw.DrawText(this.goalUnlocked ? "Bandeira liberada: alcance o topo!" : "Colete as moedas ate a bandeira.", 22, 89);
        draw.Color = controllerConnected ? "#8DFFB7" : "#DDE7FF";
        draw.DrawText(
            controllerConnected ? "Controle: conectado" : "Controle: pressione um botao para ativar",
            22,
            113,
        );

        ctx.save();
        ctx.globalAlpha = 0.5;
        draw.Color = "#07172A";
        draw.DrawRect(12, 418, 696, 49);
        ctx.restore();
        draw.Color = "#F3F7FF";
        draw.FontSize = "13px";
        draw.DrawText(`Altitude: ${altitude} m   Tempo: ${this.time.toFixed(1)} s`, 18, 439);
        draw.DrawText(this.goalUnlocked ? "CHEGADA ABERTA" : `CHEGADA BLOQUEADA   ${remainingCoins} MOEDAS RESTANTES`, 18, 458);

        if (this.gameState === "WON") {
            ctx.save();
            ctx.globalAlpha = 0.8;
            draw.Color = "#061325";
            draw.DrawRect(155, 168, 420, 132);
            ctx.restore();

            draw.SetTextAlign("center");
            draw.Color = "#FFD76A";
            draw.FontSize = "28px";
            draw.DrawText("Trilha concluida!", 365, 212);
            draw.Color = "#FFFFFF";
            draw.FontSize = "16px";
            draw.DrawText(`Score final: ${this.score}`, 365, 246);
            draw.FontSize = "14px";
            draw.DrawText("Uma nova trilha esta pronta.", 365, 274);
            draw.SetTextAlign("left");
        }
    }
}

function lerpAngle(current, target, amount) {
    const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    return current + difference * amount;
}
