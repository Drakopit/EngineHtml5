import { ActionManager } from "../../CoreCross/Input/ActionManager.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";
import {
    AmbientLight,
    CelestialBodyMaterial,
    Level3D,
    Mesh,
    PerspectiveCamera,
    PointLight,
    PrimitiveMesh,
    UnlitMaterial,
} from "../../Core3D/index.js";

const PLANETS = Object.freeze([
    { name: "Mercurio", radius: 0.07, orbit: 4.5, speed: 1.24, rotation: 0.9, inclination: 0.12, tilt: 0, colors: [[0.58, 0.54, 0.49], [0.26, 0.24, 0.23]], seed: 2 },
    { name: "Venus", radius: 0.19, orbit: 8.0, speed: 0.48, rotation: 0.55, inclination: 0.06, tilt: 3.08, colors: [[0.92, 0.68, 0.35], [0.55, 0.36, 0.18]], seed: 7 },
    { name: "Terra", radius: 0.20, orbit: 12.0, speed: 0.3, rotation: 1.6, inclination: 0, tilt: 0.41, colors: [[0.16, 0.38, 0.78], [0.18, 0.58, 0.28]], atmosphere: [0.35, 0.64, 1.0], cloud: 0.46, seed: 11, textureMap: "earth_diffuse" },
    { name: "Marte", radius: 0.11, orbit: 18.0, speed: 0.16, rotation: 1.25, inclination: 0.03, tilt: 0.43, colors: [[0.74, 0.28, 0.16], [0.38, 0.15, 0.09]], atmosphere: [0.95, 0.35, 0.2], seed: 17 },
    { name: "Jupiter", radius: 2.2, orbit: 42.0, speed: 0.025, rotation: 2.1, inclination: 0.02, tilt: 0.05, colors: [[0.76, 0.55, 0.34], [0.96, 0.84, 0.62]], cloud: 0.2, seed: 23 },
    { name: "Saturno", radius: 1.8, orbit: 75.0, speed: 0.010, rotation: 1.85, inclination: 0.04, tilt: 0.46, colors: [[0.86, 0.72, 0.46], [0.54, 0.42, 0.25]], ring: true, seed: 29 },
    { name: "Urano", radius: 0.8, orbit: 130.0, speed: 0.003, rotation: 1.1, inclination: 0.01, tilt: 1.70, colors: [[0.46, 0.85, 0.88], [0.2, 0.48, 0.58]], atmosphere: [0.48, 0.95, 1.0], seed: 31 },
    { name: "Netuno", radius: 0.77, orbit: 190.0, speed: 0.0015, rotation: 1.0, inclination: 0.03, tilt: 0.49, colors: [[0.18, 0.28, 0.88], [0.08, 0.12, 0.38]], atmosphere: [0.22, 0.46, 1.0], seed: 37 },
]);

export class SolarSystemLevel extends Level3D {
    constructor() {
        super({
            width: 960,
            height: 540,
            clearColor: [0.005, 0.007, 0.018, 1],
            usePhysics: false,
        });
        this.caption = "GameForgeJS - Sistema Solar 3D";
        this.time = 0;
        this.cameraYaw = 0.0;
        this.cameraDistance = 31.0;
        this.planets = [];
    }

    BuildScene() {
        this.camera = new PerspectiveCamera({
            fov: 58,
            aspect: this.width / this.height,
            near: 0.1,
            far: 1000,
            position: [0, 16, 31],
            target: [0, 0, 0],
        });
        this.scene.Add(this.camera);

        this.scene.Add(new AmbientLight({ color: [0.2, 0.22, 0.35], intensity: 0.08 }));
        this.scene.Add(new PointLight({
            position: [0, 0, 0],
            color: [1.0, 0.78, 0.46],
            intensity: 9.0,
            range: 80,
        }));

        this.CreateSun();
        PLANETS.forEach((planet, index) => this.CreatePlanet(planet, index));
        this.CreateStarfield();
    }

    CreateSun() {
        this.sun = Mesh.FromGeometry(
            PrimitiveMesh.Sphere(1, { widthSegments: 48, heightSegments: 24 }),
            new CelestialBodyMaterial({
                name: "SunShader",
                baseColor: [1.0, 0.58, 0.12],
                secondaryColor: [1.0, 0.95, 0.28],
                atmosphereColor: [1.0, 0.52, 0.08],
                emissiveColor: [1.0, 0.46, 0.08],
                emissiveStrength: 1.8,
                cloudStrength: 0.18,
                atmosphereStrength: 1.2,
                seed: 99,
            }),
            { name: "Sun", castShadow: false, receiveShadow: false },
        );
        this.sun.transform.SetScale(5.5);
        this.scene.Add(this.sun);
    }

    CreatePlanet(data, index) {
        const mesh = Mesh.FromGeometry(
            PrimitiveMesh.Sphere(1, { widthSegments: 40, heightSegments: 20 }),
            new CelestialBodyMaterial({
                name: `${data.name}Material`,
                baseColor: data.colors[0],
                secondaryColor: data.colors[1],
                atmosphereColor: data.atmosphere ?? data.colors[0],
                nightColor: [data.colors[0][0] * 0.1, data.colors[0][1] * 0.1, data.colors[0][2] * 0.1],
                cloudStrength: data.cloud ?? 0.0,
                atmosphereStrength: data.atmosphere ? 0.7 : 0.0,
                seed: data.seed,
                albedoMap: data.textureMap ? AssetManager.instance?.GetImage(data.textureMap) : null,
            }),
            { name: data.name, castShadow: true, receiveShadow: true },
        );
        mesh.transform.SetScale(data.radius);
        mesh.transform.rotation.z = data.tilt ?? 0;
        this.scene.Add(mesh);

        const orbitThickness = data.orbit > 50 ? 0.3 : 0.05;
        const orbit = Mesh.FromGeometry(
            PrimitiveMesh.Ring(data.orbit - orbitThickness, data.orbit + orbitThickness, { segments: 240 }),
            new UnlitMaterial({ color: [0.32, 0.42, 0.58, 0.24], transparent: true }),
            { name: `${data.name}Orbit`, castShadow: false, receiveShadow: false },
        );
        orbit.transform.rotation.x = data.inclination ?? 0;
        this.scene.Add(orbit);

        let ring = null;
        if (data.ring) {
            ring = Mesh.FromGeometry(
                PrimitiveMesh.Ring(1.4, 2.2, { segments: 160 }),
                new UnlitMaterial({ color: [0.82, 0.72, 0.52, 0.65], transparent: true }),
                { name: "SaturnRings", castShadow: false, receiveShadow: false },
            );
            ring.transform.SetScale(data.radius);
            ring.transform.rotation.z = data.tilt ?? 0;
            this.scene.Add(ring);
        }

        this.planets.push({ ...data, mesh, ring, angle: index * 0.72 });

        if (data.name === "Terra") {
            const moon = Mesh.FromGeometry(
                PrimitiveMesh.Sphere(0.14, { widthSegments: 24, heightSegments: 12 }),
                new CelestialBodyMaterial({
                    baseColor: [0.62, 0.62, 0.58],
                    secondaryColor: [0.28, 0.28, 0.26],
                    atmosphereStrength: 0.08,
                    cloudStrength: 0,
                    seed: 41,
                }),
                { name: "Lua" },
            );
            this.scene.Add(moon);
            this.moon = { mesh: moon, parent: mesh, angle: 0 };
        }
    }

    CreateStarfield() {
        this.stars = [];
        for (let i = 0; i < 300; i++) {
            const radius = 250 + Math.random() * 150;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const size = 0.018 + Math.random() * 0.04;
            const star = Mesh.FromGeometry(
                PrimitiveMesh.Cube(1),
                new UnlitMaterial({ color: [0.72 + Math.random() * 0.28, 0.78 + Math.random() * 0.2, 1, 1] }),
                { name: `Star_${i}`, castShadow: false, receiveShadow: false },
            );
            star.transform.SetPosition(
                Math.sin(phi) * Math.cos(theta) * radius,
                Math.cos(phi) * radius * 0.55,
                Math.sin(phi) * Math.sin(theta) * radius,
            );
            star.transform.SetScale(size);
            this.scene.Add(star);
            this.stars.push(star);
        }
    }

    OnUpdate(dt) {
        const delta = dt || 0.016;
        this.time += delta;

        if (ActionManager.IsAction("LEFT")) this.cameraYaw -= delta * 0.75;
        if (ActionManager.IsAction("RIGHT")) this.cameraYaw += delta * 0.75;
        if (ActionManager.IsAction("UP")) this.cameraDistance = Math.max(8, this.cameraDistance - delta * this.cameraDistance * 0.8);
        if (ActionManager.IsAction("DOWN")) this.cameraDistance = Math.min(320, this.cameraDistance + delta * this.cameraDistance * 0.8);
        if (ActionManager.IsActionDown("CANCEL")) this.Back = true;

        this.sun.transform.rotation.y += delta * 0.2;

        this.planets.forEach(planet => {
            planet.angle += delta * planet.speed;
            const inc = planet.inclination ?? 0;
            const r = planet.orbit;
            const x = Math.cos(planet.angle) * r;
            const zPlane = Math.sin(planet.angle) * r;
            
            // Apply inclination to Y axis
            const y = -zPlane * Math.sin(inc);
            const z = zPlane * Math.cos(inc);
            
            planet.mesh.transform.SetPosition(x, y, z);
            planet.mesh.transform.rotation.y += delta * planet.rotation;

            if (planet.ring) {
                planet.ring.transform.position = [...planet.mesh.transform.position];
                planet.ring.transform.rotation.y += delta * 0.08;
            }
        });

        if (this.moon) {
            this.moon.angle += delta * 1.8;
            const parent = this.moon.parent.transform.position;
            this.moon.mesh.transform.SetPosition(
                parent[0] + Math.cos(this.moon.angle) * 0.96,
                0.08,
                parent[2] + Math.sin(this.moon.angle) * 0.96,
            );
        }

        const yaw = this.cameraYaw + this.time * 0.035;
        this.camera.position = [
            Math.sin(yaw) * this.cameraDistance,
            13.5,
            Math.cos(yaw) * this.cameraDistance,
        ];
        this.camera.LookAt([0, 0, 0]);
    }

    OnGUI() {
        if (!this.ui) return;

        const draw = this.ui.Draw;
        const ctx = draw.screen.Context;

        ctx.save();
        ctx.globalAlpha = 0.45;
        draw.Color = "#02030A";
        draw.DrawRect(16, 14, 330, 86);
        ctx.restore();

        draw.SetTextAlign("left");
        draw.Color = "#FFD98A";
        draw.Font = "Arial";
        draw.FontSize = "22px";
        draw.DrawText("Sistema Solar - Render3D", 28, 46);
        draw.Color = "#DDE7FF";
        draw.FontSize = "14px";
        draw.DrawText("Setas/WASD: orbitar e zoom | Esc/B: voltar", 28, 74);
    }
}
