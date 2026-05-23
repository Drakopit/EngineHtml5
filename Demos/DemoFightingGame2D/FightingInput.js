import { Input } from "../../CoreCross/Input/Input.js";
import { GamePad } from "../../CoreCross/Input/Gamepad.js";
import { GamepadAlias } from "../../CoreCross/Input/GamepadAlias.js";
import { Config } from "../../CoreCross/Config.js";

const DEFAULT_DIRECTIONS = Object.freeze({
    up: { buttons: ["DPAD_UP"], axes: ["LEFT_STICK_UP"] },
    down: { buttons: ["DPAD_DOWN"], axes: ["LEFT_STICK_DOWN"] },
    left: { buttons: ["DPAD_LEFT"], axes: ["LEFT_STICK_LEFT"] },
    right: { buttons: ["DPAD_RIGHT"], axes: ["LEFT_STICK_RIGHT"] },
});

export function keyboardHeld(keys) {
    return asList(keys).some(key => Input.GetKey(key));
}

export function keyboardDown(keys) {
    return asList(keys).some(key => Input.GetKeyDown(key));
}

export function gamepadButtonHeld(buttons, padIndex = 0) {
    const pad = GamePad.instance;
    if (!pad) return false;
    return asButtonIndexes(buttons).some(button => pad.GetButton(button, padIndex));
}

export function gamepadButtonDown(buttons, padIndex = 0) {
    const pad = GamePad.instance;
    if (!pad) return false;
    return asButtonIndexes(buttons).some(button => pad.GetButtonDown(button, padIndex));
}

export function anyGamepadButtonDown(buttons) {
    const pad = GamePad.instance;
    if (!pad) return false;

    return Object.keys(pad.gamepads).some(padIndex => gamepadButtonDown(buttons, padIndex));
}

export function gamepadDirectionHeld(direction, padIndex = 0, binding = null) {
    const pad = GamePad.instance;
    if (!pad) return false;

    const resolved = directionBinding(direction, binding);
    if (asButtonIndexes(resolved.buttons).some(button => pad.GetButton(button, padIndex))) return true;

    return asAxisBindings(resolved.axes).some(axis => {
        const axisValue = pad.GetAxis(axis.index, padIndex);
        return axis.direction === "positive" ? axisValue > 0.5 : axisValue < -0.5;
    });
}

export function gamepadDirectionDown(direction, padIndex = 0, binding = null) {
    const pad = GamePad.instance;
    if (!pad) return false;

    const resolved = directionBinding(direction, binding);
    if (asButtonIndexes(resolved.buttons).some(button => pad.GetButtonDown(button, padIndex))) return true;

    return asAxisBindings(resolved.axes).some(axis => pad.GetAxisDown(axis.index, axis.direction, padIndex));
}

export function anyGamepadDirectionDown(direction, binding = null) {
    const pad = GamePad.instance;
    if (!pad) return false;

    return Object.keys(pad.gamepads).some(padIndex => gamepadDirectionDown(direction, padIndex, binding));
}

function directionBinding(direction, binding) {
    if (typeof binding === "string" || typeof binding === "number") {
        return { buttons: [binding], axes: [binding] };
    }

    if (binding) return binding;
    return DEFAULT_DIRECTIONS[direction] ?? { buttons: [], axes: [] };
}

function asButtonIndexes(value) {
    const options = gamepadAliasOptions();
    return asList(value)
        .map(input => GamepadAlias.ResolveButtonIndex(input, options))
        .filter(index => index !== null);
}

function asAxisBindings(value) {
    const options = gamepadAliasOptions();
    return asList(value)
        .map(input => GamepadAlias.ResolveAxis(input, options))
        .filter(Boolean);
}

function gamepadAliasOptions() {
    return {
        profile: Config.data?.input?.gamepadProfile ?? Config.data?.fighting?.gamepadProfile,
        aliases: {
            ...(Config.data?.input?.gamepadAliases ?? {}),
            ...(Config.data?.fighting?.gamepadAliases ?? {}),
        },
    };
}

function asList(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
}
