import { Input } from "./Input.js";
import { GamepadAlias } from "./GamepadAlias.js";

export class ActionManager {
    static mappings = {};

    static LoadMappings(configMappings) {
        this.mappings = configMappings || {};
    }

    static MapAction(actionName, rules = []) {
        this.mappings[actionName] = rules;
        return this;
    }

    static IsActionDown(actionName) {
        return this.GetRules(actionName).some(rule => {
            if (rule.device === "keyboard") return Input.GetKeyDown(rule.input);
            if (rule.device === "gamepad") return this.IsGamepadInputDown(rule.input, rule.padIndex);
            return false;
        });
    }

    static IsActionUp(actionName) {
        return this.GetRules(actionName).some(rule => {
            if (rule.device === "keyboard") return Input.GetKeyUp(rule.input);
            if (rule.device === "gamepad") return this.IsGamepadInputUp(rule.input, rule.padIndex);
            return false;
        });
    }

    static IsAction(actionName) {
        return this.GetActionValue(actionName) > 0.5;
    }

    static GetActionValue(actionName) {
        let value = 0;

        this.GetRules(actionName).forEach(rule => {
            if (rule.device === "keyboard" && Input.GetKey(rule.input)) {
                value = 1;
            }

            if (rule.device === "gamepad") {
                value = Math.max(value, this.GetGamepadInputValue(rule.input, rule.padIndex));
            }
        });

        return value;
    }

    static IsGamepadInputDown(input, padIndex = null) {
        const resolved = this.ResolveGamepadInput(input);
        return this.GetPadIndices(padIndex).some(index => {
            if (Input.GetGamepadButtonDown(index, resolved)) return true;
            return Input.GetGamepadAxisDown(index, resolved);
        });
    }

    static IsGamepadInputUp(input, padIndex = null) {
        const resolved = this.ResolveGamepadInput(input);
        return this.GetPadIndices(padIndex).some(index => {
            if (Input.GetGamepadButtonUp(index, resolved)) return true;
            return Input.GetGamepadAxisUp(index, resolved);
        });
    }

    static GetGamepadInputValue(input, padIndex = null) {
        const resolved = this.ResolveGamepadInput(input);
        const buttonIndex = GamepadAlias.ResolveButtonIndex(resolved, Input.GamepadAliasOptions());
        const axis = GamepadAlias.ResolveAxis(resolved, Input.GamepadAliasOptions());
        let value = 0;

        this.GetPadIndices(padIndex).forEach(index => {
            if (buttonIndex !== null && Input.GetGamepadButton(index, buttonIndex)) {
                value = 1;
            }

            if (axis) {
                const axisValue = Input.GetGamepadAxis(index, axis.index);
                const directionalValue = axis.direction === "positive" ? axisValue : -axisValue;
                value = Math.max(value, Math.max(0, directionalValue));
            }
        });

        return value;
    }

    static GetRules(actionName) {
        return Array.isArray(this.mappings[actionName]) ? this.mappings[actionName] : [];
    }

    static GetPadIndices(padIndex = null) {
        return Number.isInteger(padIndex) ? [padIndex] : Input.GetConnectedGamepadIndices();
    }

    static ResolveGamepadInput(input) {
        return GamepadAlias.Resolve(input, Input.GamepadAliasOptions());
    }
}
