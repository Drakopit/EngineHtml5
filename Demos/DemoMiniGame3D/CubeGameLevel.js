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
    SphereCollider3D,
    StandardMaterial,
    Texture,
    UnlitMaterial,
} from "../../Core3D/index.js";

const ARENA = {
    minX: -4.2,
    maxX: 4.2,
    minZ: -12.2,
    maxZ: -3.0,
};

const COIN_SPAWNS = [
    [-3.25, -10.75],
    [3.25, -10.15],
    [-3.30, -4.35],
    [3.15, -5.10],
    [0.00, -8.20],
];

export class CubeGameLevel extends Level3D {
    constructor() {
        super({
            width: 720,
            height: 480,
            clearColor: [0.04, 0.055, 0.08, 1],
            usePhysics: true,
        });
        this.TelaId = "CubeGame";
        this.caption = "GameForgeJS - 3D Mini Game";
        this.goalCoins = COIN_SPAWNS.length;
        this.score = 0;
        this.collectedCoins = 0;
        this.gameState = "PLAYING";
        this.time = 0;
        this.cameraYaw = 0;
        this.cameraTarget = [0, 0.55, -6];
        this.cameraReady = false;
    }

    BuildScene() {
        this.physics.gravity = [0, -16, 0];
        this.physics.bounds = ARENA;

        this.camera = new PerspectiveCamera({
            fov: 52,
            aspect: this.width / this.height,
            near: 0.1,
            far: 80,
            position: [0, 4.7, 4.4],
            target: [0, 0, -7.4],
        });
        this.scene.Add(this.camera);

        this.scene.Add(new AmbientLight({ color: [0.85, 0.92, 1.0], intensity: 0.1 }));
        this.scene.Add(new HemisphereLight({
            skyColor: [0.55, 0.72, 1.0],
            groundColor: [0.18, 0.2, 0.16],
            intensity: 0.42,
        }));
        this.scene.Add(new DirectionalLight({
            direction: [-0.45, -1.0, -0.35],
            color: [1.0, 0.94, 0.78],
            intensity: 1.7,
            castShadow: true,
            shadowMapSize: 1024,
            shadowDistance: 18,
        }));
        this.scene.Add(new PointLight({
            position: [0, 2.2, -7.5],
            color: [0.42, 0.72, 1.0],
            intensity: 0.85,
            range: 7,
        }));

        this.CreateFloor();
        this.CreateArenaBounds();
        this.CreatePlayer();
        this.CreateCoins();
        this.UpdateCamera(1);
    }

    CreateFloor() {
        const assets = AssetManager.instance;
        const floorTexture = assets.HasImage("grid_albedo")
            ? Texture.FromImage(assets.GetImage("grid_albedo"))
            : Texture.FromImage(assets.GetImage("textura_chao"));
        const normalTexture = assets.HasImage("grid_normal")
            ? Texture.FromImage(assets.GetImage("grid_normal"))
            : null;
        const width = ARENA.maxX - ARENA.minX;
        const depth = ARENA.maxZ - ARENA.minZ;

        this.floor = Mesh.FromGeometry(
            PrimitiveMesh.Plane(width, depth, { subdivisions: 8 }),
            new StandardMaterial({
                name: "MiniGameFloor",
                albedoMap: floorTexture,
                normalMap: normalTexture,
                roughness: 0.88,
            }),
            { name: "ArenaFloor", castShadow: false, receiveShadow: true },
        );
        this.floor.transform.SetPosition(
            (ARENA.minX + ARENA.maxX) / 2,
            -0.5,
            (ARENA.minZ + ARENA.maxZ) / 2,
        );
        this.scene.Add(this.floor);

        this.physics.AddBody({
            object: this.floor,
            collider: new BoxCollider3D({ size: [width, 0.2, depth], offset: [0, -0.02, 0] }),
            tag: "floor",
        });
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
            .SetPosition(0, 0.08, -6.0)
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
        this.playerRadius = 0.46;
        this.playerFacing = Math.PI;
    }

    CreateArenaBounds() {
        const width = ARENA.maxX - ARENA.minX;
        const depth = ARENA.maxZ - ARENA.minZ;
        const rails = [
            [0, -0.34, ARENA.minZ, width + 0.18, 0.22, 0.10],
            [0, -0.34, ARENA.maxZ, width + 0.18, 0.22, 0.10],
            [ARENA.minX, -0.34, (ARENA.minZ + ARENA.maxZ) / 2, 0.10, 0.22, depth],
            [ARENA.maxX, -0.34, (ARENA.minZ + ARENA.maxZ) / 2, 0.10, 0.22, depth],
        ];
        const material = new UnlitMaterial({ name: "ArenaEdge", color: [0.25, 0.68, 1, 1] });

        rails.forEach(([x, y, z, scaleX, scaleY, scaleZ], index) => {
            const rail = Mesh.FromGeometry(
                PrimitiveMesh.Cube(),
                material,
                { name: `ArenaEdge_${index}`, castShadow: false, receiveShadow: false },
            );
            rail.transform.SetPosition(x, y, z).SetScale(scaleX, scaleY, scaleZ);
            this.scene.Add(rail);
        });
    }

    CreateCoins() {
        const coinTexture = AssetManager.instance.HasImage("textura_coin")
            ? Texture.FromImage(AssetManager.instance.GetImage("textura_coin"))
            : null;

        this.coins = COIN_SPAWNS.map(([x, z], index) => {
            const coin = Mesh.FromGeometry(
                PrimitiveMesh.Sphere(0.22, { widthSegments: 24, heightSegments: 12 }),
                new StandardMaterial({
                    name: `CoinMaterial_${index}`,
                    albedoMap: coinTexture,
                    albedoColor: [1.0, 0.78, 0.22, 1],
                    roughness: 0.22,
                    metallic: 0.15,
                    emissiveColor: [0.16, 0.09, 0.01],
                }),
                { name: `Coin_${index}`, castShadow: true, receiveShadow: false },
            );
            coin.transform.SetPosition(x, 0.04, z);
            this.scene.Add(coin);
            return { mesh: coin, active: true, value: 10, radius: 0.28, baseY: 0.04 };
        });
    }

    OnUpdate(dt) {
        if (ActionManager.IsActionDown("CANCEL")) {
            this.Back = true;
            return;
        }

        if (this.gameState === "WON") {
            if (ActionManager.IsActionDown("ATTACK")) this.ResetGame();
            this.UpdateCamera(dt || 0.016);
            return;
        }

        const delta = Math.min(dt || 0.016, 0.05);
        this.time += delta;
        this.UpdatePlayerInput(delta);
        super.OnUpdate(delta);
        this.RecoverPlayerIfNeeded();
        this.playerModel.ApplyTransform();
        this.UpdateCoins(delta);
        this.CheckCoinCollision();
        this.UpdateCamera(delta);
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
        const speed = ActionManager.IsAction("BOOST") ? 6.6 : 5.2;
        const smoothing = 1 - Math.exp(-14 * dt);

        this.playerBody.velocity[0] += (directionX * speed - this.playerBody.velocity[0]) * smoothing;
        this.playerBody.velocity[2] += (directionZ * speed - this.playerBody.velocity[2]) * smoothing;

        if (length > 0.06) {
            const targetFacing = Math.atan2(directionX, directionZ);
            this.playerFacing = lerpAngle(this.playerFacing, targetFacing, 1 - Math.exp(-16 * dt));
            this.playerModel.transform.rotation.y = this.playerFacing;
        }

        if (ActionManager.IsActionDown("JUMP") && this.playerBody.grounded) {
            this.playerBody.velocity[1] = 5.4;
        }
    }

    RecoverPlayerIfNeeded() {
        const position = this.playerModel.transform.position;
        const invalid = position.some(value => !Number.isFinite(value));
        if (!invalid && position[1] >= -3) return;

        this.ResetPlayerPosition();
    }

    UpdateCoins(dt) {
        this.coins.forEach((coin, index) => {
            if (!coin.active) return;

            coin.mesh.transform.position[1] = coin.baseY + Math.sin(this.time * 4 + index) * 0.08;
            coin.mesh.transform.rotation.y += dt * 3.2;
        });
    }

    CheckCoinCollision() {
        const playerPosition = this.playerModel.transform.position;

        this.coins.forEach(coin => {
            if (!coin.active) return;

            const coinPosition = coin.mesh.transform.position;
            const distance = Math.hypot(coinPosition[0] - playerPosition[0], coinPosition[2] - playerPosition[2]);
            if (distance <= this.playerRadius + coin.radius) {
                coin.active = false;
                coin.mesh.visible = false;
                this.score += coin.value;
                this.collectedCoins++;
            }
        });

        if (this.collectedCoins >= this.goalCoins) {
            this.gameState = "WON";
        }
    }

    ResetGame() {
        this.score = 0;
        this.collectedCoins = 0;
        this.gameState = "PLAYING";
        this.time = 0;
        this.ResetPlayerPosition();

        this.coins.forEach((coin, index) => {
            const [x, z] = COIN_SPAWNS[index];
            coin.active = true;
            coin.mesh.visible = true;
            coin.mesh.transform.SetPosition(x, coin.baseY, z);
        });
    }

    ResetPlayerPosition() {
        this.playerFacing = Math.PI;
        this.playerModel.SetPosition(0, 0.08, -6.0).SetRotation(0, this.playerFacing, 0);
        this.playerBody.velocity = [0, 0, 0];
    }

    UpdateCamera(dt) {
        if (!this.camera || !this.playerModel) return;

        const cameraTurn = ActionManager.GetActionValue("CAMERA_RIGHT")
            - ActionManager.GetActionValue("CAMERA_LEFT");
        this.cameraYaw += cameraTurn * 2.25 * dt;

        const playerPosition = this.playerModel.transform.position;
        const desiredTarget = [
            playerPosition[0],
            playerPosition[1] + 0.52,
            playerPosition[2],
        ];
        const follow = this.cameraReady ? 1 - Math.exp(-8 * dt) : 1;
        this.cameraTarget = this.cameraTarget.map((value, index) => (
            value + (desiredTarget[index] - value) * follow
        ));
        const desiredPosition = [
            this.cameraTarget[0] + Math.sin(this.cameraYaw) * 6.5,
            this.cameraTarget[1] + 4.25,
            this.cameraTarget[2] + Math.cos(this.cameraYaw) * 6.5,
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

        ctx.save();
        ctx.globalAlpha = 0.46;
        draw.Color = "#05070D";
        draw.DrawRect(12, 12, 292, 96);
        ctx.restore();

        draw.SetTextAlign("left");
        draw.Font = "Arial";
        draw.FontSize = "20px";
        draw.Color = "#FFD76A";
        draw.DrawText(`Moedas: ${this.collectedCoins}/${this.goalCoins}`, 22, 40);
        draw.Color = "#FFFFFF";
        draw.FontSize = "16px";
        draw.DrawText(`Score: ${this.score}`, 22, 66);
        draw.FontSize = "13px";
        const controllerConnected = Input.GetConnectedGamepadIndices().length > 0;
        draw.Color = controllerConnected ? "#8DFFB7" : "#DDE7FF";
        const controllerState = controllerConnected
            ? "Controle: conectado"
            : "Controle: pressione um botao para ativar";
        draw.DrawText(controllerState, 22, 91);

        ctx.save();
        ctx.globalAlpha = 0.42;
        draw.Color = "#05070D";
        draw.DrawRect(12, 418, 696, 49);
        ctx.restore();
        draw.Color = "#DDE7FF";
        draw.FontSize = "13px";
        draw.DrawText("WASD/setas ou stick esquerdo: mover  |  Space/A: pular  |  Esc/B: menu", 18, 439);
        draw.DrawText("Q/E ou stick direito: girar camera  |  Shift/RT: acelerar", 18, 458);

        if (this.gameState === "WON") {
            ctx.save();
            ctx.globalAlpha = 0.72;
            draw.Color = "#05070D";
            draw.DrawRect(170, 176, 390, 112);
            ctx.restore();

            draw.SetTextAlign("center");
            draw.Color = "#FFD76A";
            draw.FontSize = "26px";
            draw.DrawText("Objetivo concluido!", 365, 220);
            draw.Color = "#FFFFFF";
            draw.FontSize = "15px";
            draw.DrawText("Pressione Space/Enter/A para jogar novamente", 365, 252);
            draw.SetTextAlign("left");
        }
    }
}

function lerpAngle(current, target, amount) {
    const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    return current + difference * amount;
}
