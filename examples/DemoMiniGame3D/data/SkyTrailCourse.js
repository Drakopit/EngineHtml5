import { AssetManager } from "../../../src/CoreCross/Assets/AssetManager.js";
import { Vector3D } from "../../../src/CoreCross/Math/Vector3D.js";

const COURSE_ASSET_NAME = "sky_trail_course";
let selectedCourseAssetName = COURSE_ASSET_NAME;

export function ListSkyTrailCourses() {
    return Object.entries(AssetManager.instance.jsons ?? {})
        .filter(([name, document]) => isCourseAsset(name, document))
        .map(([name, document]) => ({
            name,
            label: document.name ?? (name === COURSE_ASSET_NAME ? "Sky Trail" : name.replace(`${COURSE_ASSET_NAME}_`, "")),
        }))
        .sort((left, right) => {
            if (left.name === COURSE_ASSET_NAME) return -1;
            if (right.name === COURSE_ASSET_NAME) return 1;
            return left.label.localeCompare(right.label);
        });
}

export function SelectSkyTrailCourse(assetName = COURSE_ASSET_NAME) {
    selectedCourseAssetName = assetName;
}

export function LoadSkyTrailCourse(assetName = selectedCourseAssetName) {
    const document = AssetManager.instance.GetJson(assetName);
    if (!document) {
        throw new Error(`SkyTrailCourse: manifest '${assetName}' nao foi carregado.`);
    }

    return {
        world: {
            ...document.world,
            gravity: vector(document.world.gravity, "world.gravity"),
        },
        camera: {
            ...document.camera,
            position: vector(document.camera.position, "camera.position"),
            target: vector(document.camera.target, "camera.target"),
            follow: {
                ...document.camera.follow,
                targetOffset: vector(document.camera.follow.targetOffset, "camera.follow.targetOffset"),
            },
        },
        lighting: {
            ...document.lighting,
            sun: {
                ...document.lighting.sun,
                direction: vector(document.lighting.sun.direction, "lighting.sun.direction"),
            },
            goalLight: {
                ...document.lighting.goalLight,
                offset: vector(document.lighting.goalLight.offset, "lighting.goalLight.offset"),
            },
        },
        surface: { ...document.surface },
        player: {
            ...document.player,
            spawn: vector(document.player.spawn, "player.spawn"),
            collider: {
                ...document.player.collider,
                offset: vector(document.player.collider.offset, "player.collider.offset"),
            },
        },
        platforms: document.platforms.map((platform, index) => ({
            ...platform,
            position: vector(platform.position, `platforms[${index}].position`),
            size: vector(platform.size, `platforms[${index}].size`),
        })),
        coins: {
            ...document.coins,
            items: document.coins.items.map((coin, index) => ({
                ...coin,
                offset: vector(coin.offset, `coins.items[${index}].offset`),
            })),
        },
        goal: {
            ...document.goal,
            trigger: vector(document.goal.trigger, "goal.trigger"),
            pole: transform(document.goal.pole, "goal.pole"),
            flag: transform(document.goal.flag, "goal.flag"),
            ring: {
                ...document.goal.ring,
                offset: vector(document.goal.ring.offset, "goal.ring.offset"),
            },
            beacon: {
                ...document.goal.beacon,
                offset: vector(document.goal.beacon.offset, "goal.beacon.offset"),
            },
        },
    };
}

function isCourseAsset(name, document) {
    return (name === COURSE_ASSET_NAME || name.startsWith(`${COURSE_ASSET_NAME}_`))
        && Array.isArray(document?.platforms)
        && Boolean(document?.world && document?.camera && document?.player && document?.goal);
}

function transform(definition, name) {
    return {
        ...definition,
        position: vector(definition.position, `${name}.position`),
        scale: vector(definition.scale, `${name}.scale`),
    };
}

function vector(values, name) {
    if (!Array.isArray(values) || values.length !== 3) {
        throw new Error(`SkyTrailCourse: '${name}' precisa ser uma coordenada [x, y, z].`);
    }

    return Vector3D.FromArray(values);
}
