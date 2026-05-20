import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
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
        this.CreatePlayer();
        this.CreateCoins();
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
            damping: 0.84,
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
            this.UpdateCamera();
            return;
        }

        this.time += dt || 0.016;
        this.UpdatePlayerInput(dt || 0.016);
        super.OnUpdate(dt);
        this.playerModel.ApplyTransform();
        this.UpdateCoins(dt || 0.016);
        this.CheckCoinCollision();
        this.UpdateCamera();
    }

    UpdatePlayerInput(dt) {
        const turn = Number(ActionManager.IsAction("RIGHT")) - Number(ActionManager.IsAction("LEFT"));
        const move = Number(ActionManager.IsAction("UP") || ActionManager.IsAction("FORWARD"))
            - Number(ActionManager.IsAction("DOWN") || ActionManager.IsAction("BACK"));
        const speed = 4.8;

        this.playerFacing -= turn * 2.9 * dt;
        this.playerModel.transform.rotation.y = this.playerFacing;

        const directionX = Math.sin(this.playerFacing);
        const directionZ = Math.cos(this.playerFacing);
        this.playerBody.velocity[0] = directionX * move * speed;
        this.playerBody.velocity[2] = directionZ * move * speed;

        if (ActionManager.IsActionDown("ATTACK") && this.playerBody.grounded) {
            this.playerBody.velocity[1] = 5.4;
        }
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
        this.playerFacing = Math.PI;
        this.playerModel.SetPosition(0, 0.08, -6.0).SetRotation(0, this.playerFacing, 0);
        this.playerBody.velocity = [0, 0, 0];

        this.coins.forEach((coin, index) => {
            const [x, z] = COIN_SPAWNS[index];
            coin.active = true;
            coin.mesh.visible = true;
            coin.mesh.transform.SetPosition(x, coin.baseY, z);
        });
    }

    UpdateCamera() {
        if (!this.camera || !this.playerModel) return;

        const playerPosition = this.playerModel.transform.position;
        this.camera.position = [
            playerPosition[0],
            playerPosition[1] + 4.3,
            playerPosition[2] + 6.5,
        ];
        this.camera.LookAt([playerPosition[0], playerPosition[1] + 0.45, playerPosition[2] - 0.9]);
    }

    OnGUI() {
        if (!this.ui) return;

        const draw = this.ui.Draw;
        const ctx = draw.screen.Context;

        ctx.save();
        ctx.globalAlpha = 0.46;
        draw.Color = "#05070D";
        draw.DrawRect(12, 12, 210, 76);
        ctx.restore();

        draw.SetTextAlign("left");
        draw.Font = "Arial";
        draw.FontSize = "20px";
        draw.Color = "#FFD76A";
        draw.DrawText(`Moedas: ${this.collectedCoins}/${this.goalCoins}`, 22, 40);
        draw.Color = "#FFFFFF";
        draw.FontSize = "16px";
        draw.DrawText(`Score: ${this.score}`, 22, 66);

        draw.Color = "#DDE7FF";
        draw.FontSize = "14px";
        draw.DrawText("W/S ou setas: mover | A/D: girar | Space/A: pular | Esc/B: menu", 18, 456);

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
