import { GamePad } from "./Gamepad.js";
import { GamepadAlias } from "./GamepadAlias.js";
import { Mouse } from "./Mouse.js";
import { Touch } from "./Touch.js";
import { Engine } from "../Engine.js";
import { Config } from "../Config.js";

/**
 * @doc Class Input
 * @namespace Input
 * @class Input
 * @author Patrick Faustino Camello
 * @summary Manages per-frame keyboard, mouse, touch and polled gamepad input.
 * @description Gamepad state is polled during the engine update so controllers
 *              already available to the browser are detected without reconnecting.
 * @Date 26/07/2024
 * @example
 * import { Input } from "./Input.js";
 * if (Input.GetKey("ArrowUp")) {
 *     // Execute some action
 * }
 * @returns {Object}
 */
export class Input {
    static instance = null;

    static Initialize() {
        if (!Input.instance) {
            Input.instance = new Input();
        }
        return Input.instance;
    }

    constructor() {
        if (Input.instance) return Input.instance;

        this.keys = {};
        this.keysDown = {};
        this.keysUp = {};
        this.pendingKeysDown = {};
        this.pendingKeysUp = {};

        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);

        window.addEventListener("keydown", this.keyDownHandler);
        window.addEventListener("keyup", this.keyUpHandler);

        this.mouse = new Mouse();
        this.touch = new Touch();
        this.gamepad = new GamePad();

        Engine.events.on("PreUpdate", () => Input.Update());
        Engine.events.on("PostUpdate", () => Input.LateUpdate());

        Input.instance = this;
    }

    /**
     * @description Chamado pela Engine todo início de frame
     */
    static Update() {
        if (!Input.instance) return;
        Input.instance.keysDown = Input.instance.pendingKeysDown;
        Input.instance.keysUp = Input.instance.pendingKeysUp;
        Input.instance.pendingKeysDown = {};
        Input.instance.pendingKeysUp = {};
        Input.instance.gamepad.Update();
    }

    /**
     * @description Chamado pela Engine todo fim de frame
     */
    static LateUpdate() {
        if (!Input.instance) return;
        Input.instance.gamepad.LateUpdate();
        // Se implementou o ClearFrameData no Mouse.js
        if (typeof Input.instance.mouse.ClearFrameData === "function") {
            Input.instance.mouse.ClearFrameData();
        }
    }

    keyDownHandler(event) {
        if (!this.keys[event.code]) {
            this.pendingKeysDown[event.code] = true;
        }
        this.keys[event.code] = true;
    }

    keyUpHandler(event) {
        this.keys[event.code] = false;
        this.pendingKeysUp[event.code] = true;
    }

    /**
     * @doc Method
     * @description Check if a key is currently pressed
     * @param {string} key - The key code (e.g., "ArrowUp", "KeyA")
     * @returns {boolean} - True if the key is pressed, false otherwise
     * @example
     * if (Input.GetKey("ArrowUp")) { // Check if the "ArrowUp" key is pressed
     *     // Do something
     * }
     */
    static GetKey(key) {
        return Input.instance?.keys[key] === true;
    }

    /**
     * @doc Method
     * @description Check if a key was pressed in the current frame
     * @param {string} key - The key code (e.g., "ArrowUp", "KeyA")
     * @returns {boolean} - True if the key was pressed in the current frame, false otherwise
     * @example
     * if (Input.GetKeyDown("ArrowUp")) { // Check if the "ArrowUp" key was pressed in the current frame
     *     // Do something
     * }
     */
    static GetKeyDown(key) {
        return Input.instance?.keysDown[key] === true;
    }

    /**
     * @doc Method
     * @description Check if a key was released in the current frame
     * @param {string} key - The key code (e.g., "ArrowUp", "KeyA")
     * @returns {boolean} - True if the key was released in the current frame, false otherwise
     * @example
     * if (Input.GetKeyUp("ArrowUp")) { // Check if the "ArrowUp" key was released in the current frame
     *     // Do something
     * }
     */
    static GetKeyUp(key) {
        return Input.instance?.keysUp[key] === true;
    }

    /**
     * Tests whether a browser gamepad is currently available.
     * @param {number} [padIndex=0] - Browser gamepad slot.
     * @returns {boolean} Whether that pad is connected.
     */
    static IsGamepadConnected(padIndex = 0) {
        return Input.instance?.gamepad?.IsConnected(padIndex) ?? false;
    }

    /**
     * Returns all currently connected browser gamepad slots.
     * @returns {number[]} Connected gamepad indices.
     */
    static GetConnectedGamepadIndices() {
        return Input.instance?.gamepad?.GetConnectedIndices() ?? [];
    }

    /**
     * Reads a held gamepad button using a configured alias or browser index token.
     * @param {number} [padIndex=0] - Browser gamepad slot.
     * @param {string|number} input - Alias such as `A` or `DPAD_LEFT`.
     * @returns {boolean} Whether the button is held.
     */
    static GetGamepadButton(padIndex = 0, input) {
        const buttonIndex = GamepadAlias.ResolveButtonIndex(input, Input.GamepadAliasOptions());
        return buttonIndex !== null && (Input.instance?.gamepad?.GetButton(buttonIndex, padIndex) ?? false);
    }

    /**
     * Reads a gamepad button press occurring in the current frame.
     * @param {number} [padIndex=0] - Browser gamepad slot.
     * @param {string|number} input - Configured alias or button index.
     * @returns {boolean} Whether the button went down.
     */
    static GetGamepadButtonDown(padIndex = 0, input) {
        const buttonIndex = GamepadAlias.ResolveButtonIndex(input, Input.GamepadAliasOptions());
        return buttonIndex !== null && (Input.instance?.gamepad?.GetButtonDown(buttonIndex, padIndex) ?? false);
    }

    /**
     * Reads a gamepad button release occurring in the current frame.
     * @param {number} [padIndex=0] - Browser gamepad slot.
     * @param {string|number} input - Configured alias or button index.
     * @returns {boolean} Whether the button went up.
     */
    static GetGamepadButtonUp(padIndex = 0, input) {
        const buttonIndex = GamepadAlias.ResolveButtonIndex(input, Input.GamepadAliasOptions());
        return buttonIndex !== null && (Input.instance?.gamepad?.GetButtonUp(buttonIndex, padIndex) ?? false);
    }

    /**
     * Reads an analog axis using an alias such as `LeftX`.
     * @param {number} [padIndex=0] - Browser gamepad slot.
     * @param {string|number} input - Configured axis alias or index.
     * @returns {number} Axis value from -1 to 1, or zero if unavailable.
     */
    static GetGamepadAxis(padIndex = 0, input) {
        const axisIndex = GamepadAlias.ResolveAxisIndex(input, Input.GamepadAliasOptions());
        return axisIndex === null ? 0 : (Input.instance?.gamepad?.GetAxis(axisIndex, padIndex) ?? 0);
    }

    static GetGamepadAxisDown(padIndex = 0, input, threshold = 0.5) {
        const axis = GamepadAlias.ResolveAxis(input, Input.GamepadAliasOptions());
        return Boolean(axis) && (Input.instance?.gamepad?.GetAxisDown(
            axis.index,
            axis.direction,
            padIndex,
            threshold,
        ) ?? false);
    }

    static GetGamepadAxisUp(padIndex = 0, input, threshold = 0.5) {
        const axis = GamepadAlias.ResolveAxis(input, Input.GamepadAliasOptions());
        return Boolean(axis) && (Input.instance?.gamepad?.GetAxisUp(
            axis.index,
            axis.direction,
            padIndex,
            threshold,
        ) ?? false);
    }

    /**
     * Builds an action mapping rule for keyboard input.
     * @param {string} input - Keyboard event code.
     * @returns {Object} Action mapping rule.
     */
    static Keyboard(input) {
        return { device: "keyboard", input };
    }

    /**
     * Builds an action mapping rule for a gamepad button.
     * @param {string|number} input - Gamepad button alias or index.
     * @param {number|null} [padIndex=null] - Optional fixed gamepad slot.
     * @returns {Object} Action mapping rule.
     */
    static GamepadButton(input, padIndex = null) {
        return {
            device: "gamepad",
            input,
            ...(Number.isInteger(padIndex) ? { padIndex } : {}),
        };
    }

    /**
     * Builds an action mapping rule for one direction of an analog axis.
     * @param {string|number} input - Gamepad axis alias or index.
     * @param {string|number} [direction="positive"] - Positive/negative direction or sign.
     * @param {number|null} [padIndex=null] - Optional fixed gamepad slot.
     * @returns {Object} Action mapping rule.
     */
    static GamepadAxis(input, direction = "positive", padIndex = null) {
        return {
            device: "gamepad",
            input: { axis: input, direction: GamepadAlias.NormalizeDirection(direction) },
            ...(Number.isInteger(padIndex) ? { padIndex } : {}),
        };
    }

    static GamepadAliasOptions() {
        return {
            profile: Config.data?.input?.gamepadProfile,
            aliases: Config.data?.input?.gamepadAliases,
        };
    }
}
