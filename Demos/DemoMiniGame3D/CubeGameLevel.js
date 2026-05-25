import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import { Vector3D } from "../../CoreCross/Math/Vector3D.js";
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
import { SkyTrailSurfaceFactory } from "./Rendering/SkyTrailSurfaceFactory.js";
import { LoadSkyTrailCourse } from "./data/SkyTrailCourse.js";
import { SkyTrailHUD } from "./UI/SkyTrailHUD.js";

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
        this.course = null;
        this.hud = new SkyTrailHUD();
        this.goalCoins = 0;
        this.InitializeRunState();
        this.cameraTarget = new Vector3D();
    }

    BuildScene() {
        this.course = LoadSkyTrailCourse();
        this.goalCoins = this.course.coins.items.length;
        this.InitializeRunState();
        this.cameraTarget = this.course.player.spawn.GetValue();

        const { camera, lighting, world } = this.course;
        this.physics.gravity = world.gravity.ToArray();
        this.physics.bounds = world.bounds;

        this.camera = new PerspectiveCamera({
            fov: camera.fov,
            aspect: this.width / this.height,
            near: camera.near,
            far: camera.far,
            position: camera.position.ToArray(),
            target: camera.target.ToArray(),
        });
        this.scene.Add(this.camera);

        const skyImage = AssetManager.instance.GetImage("sky_cross");
        if (skyImage) this.scene.Add(Skybox.FromImage(skyImage, { name: "SunnySky" }));

        this.scene.Add(new AmbientLight(lighting.ambient));
        this.scene.Add(new HemisphereLight({
            ...lighting.hemisphere,
        }));
        this.scene.Add(new DirectionalLight({
            ...lighting.sun,
            direction: lighting.sun.direction.ToArray(),
            castShadow: true,
        }));
        this.scene.Add(new PointLight({
            ...lighting.goalLight,
            position: this.course.goal.trigger.AddValue(lighting.goalLight.offset).ToArray(),
        }));

        this.CreatePlatforms();
        this.UpdatePlatforms();
        this.CreatePlayer();
        this.CreateCoins();
        this.CreateGoal();
        this.UpdateCamera(1);
    }

    InitializeRunState() {
        this.score = 0;
        this.falls = 0;
        this.collectedCoins = 0;
        this.goalUnlocked = false;
        this.gameState = "PLAYING";
        this.time = 0;
        this.cameraYaw = 0;
        this.cameraReady = false;
    }

    CreatePlatforms() {
        const factory = new SkyTrailSurfaceFactory(this.course.surface);

        this.platforms = this.course.platforms.map(definition => {
            const { baseColor, material, mesh } = factory.CreatePlatform(definition);
            mesh.transform
                .SetPosition(...definition.position.ToArray())
                .SetScale(...definition.size.ToArray());
            this.scene.Add(mesh);
            const body = this.physics.AddBody({
                object: mesh,
                collider: new BoxCollider3D({ size: definition.size.ToArray() }),
                tag: "platform",
            });
            return {
                definition,
                mesh,
                material,
                body,
                baseColor,
                active: true,
                delta: new Vector3D(),
            };
        });
        this.platformById = new Map(this.platforms.map(platform => [platform.definition.id, platform]));
    }

    CreatePlayer() {
        const player = this.course.player;
        const material = new StandardMaterial({
            name: "CharacterMaterial",
            albedoMap: Texture.FromImage(AssetManager.instance.GetImage("textura_player")),
            roughness: 0.62,
            metallic: 0,
        });

        this.playerModel = ModelMeshFactory.FromAsset("character", { material, name: "PlayerCharacter" });
        this.playerModel
            .SetPosition(...player.spawn.ToArray())
            .SetScale(player.scale)
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
            collider: new SphereCollider3D({
                radius: player.collider.radius,
                offset: player.collider.offset.ToArray(),
            }),
            tag: "player",
        });
        this.playerFacing = Math.PI;
    }

    CreateCoins() {
        const coinConfig = this.course.coins;
        const coinTexture = AssetManager.instance.HasImage("textura_coin")
            ? Texture.FromImage(AssetManager.instance.GetImage("textura_coin"))
            : null;

        this.coins = coinConfig.items.map((definition, index) => {
            const mesh = Mesh.FromGeometry(
                PrimitiveMesh.Sphere(coinConfig.radius, { widthSegments: 24, heightSegments: 12 }),
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
            mesh.transform.SetPosition(...this.GetAttachmentPosition(definition).ToArray());
            this.scene.Add(mesh);
            return {
                definition,
                mesh,
                active: true,
                value: definition.value,
                radius: coinConfig.radius,
            };
        });
    }

    CreateGoal() {
        const goal = this.course.goal;
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
        pole.transform.SetPosition(...goal.pole.position.ToArray()).SetScale(...goal.pole.scale.ToArray());
        this.scene.Add(pole);

        this.goalFlag = Mesh.FromGeometry(
            PrimitiveMesh.Cube(),
            this.goalFlagMaterial,
            { name: "GoalFlag", castShadow: false, receiveShadow: false },
        );
        this.goalFlag.transform.SetPosition(...goal.flag.position.ToArray()).SetScale(...goal.flag.scale.ToArray());
        this.scene.Add(this.goalFlag);

        this.goalRing = Mesh.FromGeometry(
            PrimitiveMesh.Ring(goal.ring.innerRadius, goal.ring.outerRadius, { segments: 48 }),
            this.goalRingMaterial,
            { name: "GoalRing", castShadow: false, receiveShadow: false },
        );
        this.goalRing.transform.SetPosition(...goal.trigger.AddValue(goal.ring.offset).ToArray());
        this.scene.Add(this.goalRing);

        this.goalBeacon = Mesh.FromGeometry(
            PrimitiveMesh.Sphere(goal.beacon.radius, { widthSegments: 20, heightSegments: 10 }),
            this.goalBeaconMaterial,
            { name: "GoalBeacon", castShadow: false, receiveShadow: false },
        );
        this.goalBeacon.transform.SetPosition(...goal.trigger.AddValue(goal.beacon.offset).ToArray());
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
            const previous = Vector3D.FromArray(platform.mesh.transform.position);
            const position = platform.definition.position.GetValue();
            const motion = platform.definition.motion;
            if (motion) {
                position[motion.axis] += Math.sin(this.time * motion.speed + motion.phase) * motion.amplitude;
            }

            platform.mesh.transform.SetPosition(...position.ToArray());
            platform.delta = position.SubtractValue(previous);
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
            ? [0.92, 0.31, 0.21, 1]
            : [...platform.baseColor];
        platform.material.emissiveColor = warning
            ? [0.08, 0.012, 0.005]
            : [0, 0, 0];
    }

    CarryPlayerOnPlatform() {
        if (!this.playerBody.grounded || !this.playerBody.groundBody) return;

        const platform = this.platforms.find(candidate => candidate.body === this.playerBody.groundBody);
        if (!platform?.active) return;

        const playerPosition = Vector3D.FromArray(this.playerModel.transform.position);
        this.playerModel.SetPosition(...playerPosition.AddValue(platform.delta).ToArray());
    }

    GetAttachmentPosition(definition) {
        const rawPosition = this.platformById.get(definition.platformId)?.mesh.transform.position;
        const platformPosition = rawPosition ? Vector3D.FromArray(rawPosition) : new Vector3D();
        return platformPosition.AddValue(definition.offset);
    }

    UpdatePlayerInput(dt) {
        const movement = this.course.player.movement;
        const horizontal = ActionManager.GetActionValue("RIGHT") - ActionManager.GetActionValue("LEFT");
        const forward = ActionManager.GetActionValue("FORWARD") - ActionManager.GetActionValue("BACK");
        const length = Math.hypot(horizontal, forward);
        const normalizedX = length > 1 ? horizontal / length : horizontal;
        const normalizedForward = length > 1 ? forward / length : forward;
        const sin = Math.sin(this.cameraYaw);
        const cos = Math.cos(this.cameraYaw);
        const directionX = normalizedX * cos - normalizedForward * sin;
        const directionZ = -normalizedX * sin - normalizedForward * cos;
        const speed = ActionManager.IsAction("BOOST") ? movement.boostSpeed : movement.speed;
        const smoothing = 1 - Math.exp(-movement.smoothing * dt);

        this.playerBody.velocity[0] += (directionX * speed - this.playerBody.velocity[0]) * smoothing;
        this.playerBody.velocity[2] += (directionZ * speed - this.playerBody.velocity[2]) * smoothing;

        if (length > 0.06) {
            const targetFacing = Math.atan2(directionX, directionZ);
            this.playerFacing = lerpAngle(this.playerFacing, targetFacing, 1 - Math.exp(-movement.turnSmoothing * dt));
            this.playerModel.transform.rotation.y = this.playerFacing;
        }

        if (ActionManager.IsActionDown("JUMP") && this.playerBody.grounded) {
            this.playerBody.velocity[1] = movement.jumpSpeed;
        }
    }

    RecoverPlayerIfNeeded() {
        const position = this.playerModel.transform.position;
        const invalid = position.some(value => !Number.isFinite(value));
        if (!invalid && position[1] >= this.course.world.fallLimit) return;

        this.falls++;
        this.score = Math.max(0, this.score - 5);
        this.ResetPlayerPosition();
    }

    UpdateCoins(dt) {
        const config = this.course.coins;
        this.coins.forEach((coin, index) => {
            if (!coin.active) return;

            const platform = this.platformById.get(coin.definition.platformId);
            const position = this.GetAttachmentPosition(coin.definition);
            coin.mesh.visible = platform?.active !== false;
            coin.mesh.transform.position[0] = position.x;
            coin.mesh.transform.position[1] = position.y + Math.sin(this.time * config.bobSpeed + index) * config.bobDistance;
            coin.mesh.transform.position[2] = position.z;
            coin.mesh.transform.rotation.y += dt * config.spinSpeed;
        });
    }

    CheckCoinCollision() {
        const playerCenter = Vector3D.FromArray(this.playerModel.transform.position)
            .AddValue(this.course.player.collider.offset);

        this.coins.forEach(coin => {
            if (!coin.active || !coin.mesh.visible) return;

            const coinPosition = Vector3D.FromArray(coin.mesh.transform.position);
            if (coinPosition.DistanceTo(playerCenter) > this.course.coins.pickupDistance) return;

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

        const position = Vector3D.FromArray(this.playerModel.transform.position);
        if (position.DistanceTo(this.course.goal.trigger) > this.course.goal.radius) return;

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
        const goal = this.course.goal;
        const pulse = 1 + Math.sin(this.time * 4) * 0.09;
        this.goalRing.transform.SetScale(pulse, 1, pulse);
        this.goalBeacon.transform.position[1] = goal.trigger.y + goal.beacon.offset.y
            + Math.sin(this.time * goal.beacon.bobSpeed) * goal.beacon.bobDistance;
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
        this.playerModel.SetPosition(...this.course.player.spawn.ToArray()).SetRotation(0, this.playerFacing, 0);
        this.playerBody.velocity = [0, 0, 0];
        this.cameraReady = false;
    }

    UpdateCamera(dt) {
        if (!this.camera || !this.playerModel) return;

        const followConfig = this.course.camera.follow;
        const cameraTurn = ActionManager.GetActionValue("CAMERA_RIGHT")
            - ActionManager.GetActionValue("CAMERA_LEFT");
        this.cameraYaw += cameraTurn * followConfig.turnSpeed * dt;

        const desiredTarget = Vector3D.FromArray(this.playerModel.transform.position)
            .AddValue(followConfig.targetOffset);
        const follow = this.cameraReady ? 1 - Math.exp(-followConfig.smoothness * dt) : 1;
        this.cameraTarget = lerpVector(this.cameraTarget, desiredTarget, follow);
        const orbitOffset = new Vector3D(
            Math.sin(this.cameraYaw) * followConfig.distance,
            followConfig.height,
            Math.cos(this.cameraYaw) * followConfig.distance,
        );
        const desiredPosition = this.cameraTarget.AddValue(orbitOffset);
        const cameraPosition = lerpVector(Vector3D.FromArray(this.camera.position), desiredPosition, follow);

        this.camera.SetPosition(...cameraPosition.ToArray()).LookAt(this.cameraTarget.ToArray());
        this.cameraReady = true;
    }

    OnGUI() {
        this.hud.Draw(this);
    }
}

function lerpAngle(current, target, amount) {
    const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    return current + difference * amount;
}

function lerpVector(current, target, amount) {
    return new Vector3D(
        current.x + (target.x - current.x) * amount,
        current.y + (target.y - current.y) * amount,
        current.z + (target.z - current.z) * amount,
    );
}
