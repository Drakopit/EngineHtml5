import { Input } from "./Input.js";
import { GamePad } from "./GamePad.js";
import { GamepadAlias } from "./GamepadAlias.js";
import { Config } from "../Config.js";

export class ActionManager {
    static mappings = {};

    static LoadMappings(configMappings) {
        this.mappings = configMappings || {};
    }

    static IsActionDown(actionName) {
        const rules = this.mappings[actionName];
        if (!rules) return false;

        for (const rule of rules) {
            if (rule.device === "keyboard" && Input.GetKeyDown(rule.input)) return true;
            if (rule.device === "gamepad" && this.IsGamepadInputDown(rule.input)) return true;
        }

        return false;
    }

    static IsAction(actionName) {
        const rules = this.mappings[actionName];
        if (!rules) return false;

        for (const rule of rules) {
            if (rule.device === "keyboard" && Input.GetKey(rule.input)) return true;
            if (rule.device === "gamepad" && this.IsGamepadInputHeld(rule.input)) return true;
        }

        return false;
    }

    static IsGamepadInputDown(input) {
        const pad = GamePad.instance;
        if (!pad) return false;

        const resolved = this.ResolveGamepadInput(input);
        for (const padIndex in pad.gamepads) {
            const buttonIndex = GamepadAlias.ResolveButtonIndex(resolved);
            if (buttonIndex !== null && pad.GetButtonDown(buttonIndex, padIndex)) return true;

            const axis = GamepadAlias.ResolveAxis(resolved);
            if (axis && pad.GetAxisDown(axis.index, axis.direction, padIndex)) return true;
        }

        return false;
    }

    static IsGamepadInputHeld(input) {
        const pad = GamePad.instance;
        if (!pad) return false;

        const resolved = this.ResolveGamepadInput(input);
        for (const padIndex in pad.gamepads) {
            const buttonIndex = GamepadAlias.ResolveButtonIndex(resolved);
            if (buttonIndex !== null && pad.GetButton(buttonIndex, padIndex)) return true;

            const axis = GamepadAlias.ResolveAxis(resolved);
            if (!axis) continue;

            const value = pad.GetAxis(axis.index, padIndex);
            if (axis.direction === "positive" && value > 0.5) return true;
            if (axis.direction === "negative" && value < -0.5) return true;
        }

        return false;
    }

    static ResolveGamepadInput(input) {
        return GamepadAlias.Resolve(input, {
            profile: Config.data?.input?.gamepadProfile,
            aliases: Config.data?.input?.gamepadAliases,
        });
    }
}
