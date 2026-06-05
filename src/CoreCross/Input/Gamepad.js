import { Logger } from "../Logger.js";

/**
 * Low-level browser gamepad state. Events are useful notifications, but the
 * current state is always reconciled from navigator.getGamepads() each frame.
 */
export class GamePad {
    static instance = null;

    constructor() {
        if (GamePad.instance) return GamePad.instance;

        this.gamepads = {};
        this.previousButtons = {};
        this.previousAxes = {};
        this.deadzone = 0.2;
        this.activationHintShown = false;

        window.addEventListener("gamepadconnected", event => {
            this.RegisterGamepad(event.gamepad);
        });

        window.addEventListener("gamepaddisconnected", event => {
            this.UnregisterGamepad(event.gamepad.index);
        });

        GamePad.instance = this;
        this.Update();
    }

    Update() {
        const pads = this.ReadBrowserGamepads();
        const seen = new Set();

        for (let index = 0; index < pads.length; index++) {
            const pad = pads[index];
            if (!pad || pad.connected === false) continue;

            const padIndex = Number.isInteger(pad.index) ? pad.index : index;
            seen.add(padIndex);
            this.RegisterGamepad(pad, padIndex);
        }

        this.GetConnectedIndices().forEach(index => {
            if (!seen.has(index)) this.UnregisterGamepad(index);
        });

        if (seen.size === 0) this.ShowActivationHint();
    }

    LateUpdate() {
        this.GetConnectedIndices().forEach(index => {
            const pad = this.gamepads[index];
            this.EnsurePreviousState(index, pad);

            for (let button = 0; button < (pad.buttons?.length ?? 0); button++) {
                this.previousButtons[index][button] = this.IsButtonPressed(pad.buttons[button]);
            }

            for (let axis = 0; axis < (pad.axes?.length ?? 0); axis++) {
                this.previousAxes[index][axis] = this.ApplyDeadzone(pad.axes[axis]);
            }
        });
    }

    ReadBrowserGamepads() {
        if (typeof navigator === "undefined") return [];

        const readGamepads = navigator.getGamepads ?? navigator.webkitGetGamepads;
        if (typeof readGamepads !== "function") return [];

        return Array.from(readGamepads.call(navigator) ?? []);
    }

    RegisterGamepad(pad, index = pad?.index) {
        if (!pad || !Number.isInteger(index)) return;

        const isNew = !this.gamepads[index];
        this.gamepads[index] = pad;
        this.EnsurePreviousState(index, pad);

        if (isNew) {
            Logger.log("info", `GameForgeJS: Gamepad connected at index ${index}: ${pad.id ?? "Unknown controller"}.`);
        }
    }

    UnregisterGamepad(index) {
        if (!this.gamepads[index]) return;

        Logger.log("info", `GameForgeJS: Gamepad disconnected from index ${index}.`);
        delete this.gamepads[index];
        delete this.previousButtons[index];
        delete this.previousAxes[index];
    }

    EnsurePreviousState(index, pad) {
        if (!this.previousButtons[index]) {
            this.previousButtons[index] = Array(pad.buttons?.length ?? 0).fill(false);
        }
        if (!this.previousAxes[index]) {
            this.previousAxes[index] = Array(pad.axes?.length ?? 0).fill(0);
        }
    }

    ShowActivationHint() {
        if (this.activationHintShown || typeof navigator === "undefined") return;
        if (typeof navigator.getGamepads !== "function" && typeof navigator.webkitGetGamepads !== "function") return;

        this.activationHintShown = true;
        Logger.log("info", "GameForgeJS: If a controller is connected but inactive, press any button on it to activate it.");
    }

    IsConnected(padIndex = 0) {
        return Boolean(this.gamepads[padIndex]);
    }

    GetConnectedIndices() {
        return Object.keys(this.gamepads)
            .map(index => Number(index))
            .filter(Number.isInteger)
            .sort((left, right) => left - right);
    }

    GetButton(buttonIndex, padIndex = 0) {
        return this.IsButtonPressed(this.gamepads[padIndex]?.buttons?.[buttonIndex]);
    }

    GetButtonDown(buttonIndex, padIndex = 0) {
        return this.GetButton(buttonIndex, padIndex)
            && !(this.previousButtons[padIndex]?.[buttonIndex] ?? false);
    }

    GetButtonUp(buttonIndex, padIndex = 0) {
        return !this.GetButton(buttonIndex, padIndex)
            && (this.previousButtons[padIndex]?.[buttonIndex] ?? false);
    }

    GetAxis(axisIndex, padIndex = 0) {
        const value = this.gamepads[padIndex]?.axes?.[axisIndex];
        return typeof value === "number" ? this.ApplyDeadzone(value) : 0;
    }

    GetAxisDown(axisIndex, direction, padIndex = 0, threshold = 0.5) {
        const current = this.GetAxis(axisIndex, padIndex);
        const previous = this.previousAxes[padIndex]?.[axisIndex] ?? 0;

        if (direction === "positive") return current > threshold && previous <= threshold;
        if (direction === "negative") return current < -threshold && previous >= -threshold;
        return false;
    }

    GetAxisUp(axisIndex, direction, padIndex = 0, threshold = 0.5) {
        const current = this.GetAxis(axisIndex, padIndex);
        const previous = this.previousAxes[padIndex]?.[axisIndex] ?? 0;

        if (direction === "positive") return current <= threshold && previous > threshold;
        if (direction === "negative") return current >= -threshold && previous < -threshold;
        return false;
    }

    IsButtonPressed(button) {
        if (button && typeof button === "object") {
            return button.pressed === true || button.value > 0.5;
        }
        return typeof button === "number" && button > 0.5;
    }

    ApplyDeadzone(value) {
        return Math.abs(value) > this.deadzone ? value : 0;
    }
}
