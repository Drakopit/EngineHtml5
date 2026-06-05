import { Config } from "../../src/CoreCross/Config.js";

const DEFAULT_CONTROLS = Object.freeze({
    menu: {
        left: ["ArrowLeft", "KeyA"],
        right: ["ArrowRight", "KeyD"],
        up: ["ArrowUp", "KeyW"],
        down: ["ArrowDown", "KeyS"],
        confirm: ["Enter", "Space", "KeyJ", "KeyZ"],
        cancel: ["Escape", "Backspace"],
        gamepad: {
            up: { buttons: ["DPAD_UP"], axes: ["LEFT_STICK_UP"] },
            down: { buttons: ["DPAD_DOWN"], axes: ["LEFT_STICK_DOWN"] },
            left: { buttons: ["DPAD_LEFT"], axes: ["LEFT_STICK_LEFT"] },
            right: { buttons: ["DPAD_RIGHT"], axes: ["LEFT_STICK_RIGHT"] },
            confirm: ["A", "START"],
            cancel: ["B", "BACK"],
        },
    },
    playerOne: {
        left: ["KeyA"],
        right: ["KeyD"],
        up: ["KeyW"],
        down: ["KeyS"],
        light: ["KeyJ", "KeyZ"],
        heavy: ["KeyK", "KeyX"],
        special: ["KeyL", "KeyC"],
        gamepad: {
            index: 0,
            left: { buttons: ["DPAD_LEFT"], axes: ["LEFT_STICK_LEFT"] },
            right: { buttons: ["DPAD_RIGHT"], axes: ["LEFT_STICK_RIGHT"] },
            up: { buttons: ["DPAD_UP"], axes: ["LEFT_STICK_UP"] },
            down: { buttons: ["DPAD_DOWN"], axes: ["LEFT_STICK_DOWN"] },
            light: ["LIGHT_ATTACK"],
            heavy: ["HEAVY_ATTACK"],
            special: ["SPECIAL"],
        },
    },
    playerTwo: {
        left: ["ArrowLeft"],
        right: ["ArrowRight"],
        up: ["ArrowUp"],
        down: ["ArrowDown"],
        light: ["Digit1", "Numpad1"],
        heavy: ["Digit2", "Numpad2"],
        special: ["Digit3", "Numpad3"],
        gamepad: {
            index: 1,
            left: { buttons: ["DPAD_LEFT"], axes: ["LEFT_STICK_LEFT"] },
            right: { buttons: ["DPAD_RIGHT"], axes: ["LEFT_STICK_RIGHT"] },
            up: { buttons: ["DPAD_UP"], axes: ["LEFT_STICK_UP"] },
            down: { buttons: ["DPAD_DOWN"], axes: ["LEFT_STICK_DOWN"] },
            light: ["LIGHT_ATTACK"],
            heavy: ["HEAVY_ATTACK"],
            special: ["SPECIAL"],
        },
    },
});

export function GetFightingControls() {
    return DeepMerge(Clone(DEFAULT_CONTROLS), Config.data?.fighting?.controls ?? {});
}

function Clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function DeepMerge(target, source) {
    Object.entries(source ?? {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            target[key] = value.slice();
            return;
        }

        if (IsPlainObject(value)) {
            target[key] = DeepMerge(IsPlainObject(target[key]) ? target[key] : {}, value);
            return;
        }

        target[key] = value;
    });

    return target;
}

function IsPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
