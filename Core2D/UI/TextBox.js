/**
 * @doc Class TextBox
 * @namespace UI
 * @class TextBox
 * @summary This class is part of the EngineHtml5 framework and provides functionality to create and interact with UI text boxes.
 * @Date 26/07/2024
 * @example
 *  var textBox = new TextBox(screen);
 * @returns {Object}
 */

import { Draw } from "../Graphics/Draw.js";
import { Mouse } from "../../CoreCross/Input/Mouse.js";
import { Rectangle } from "../Graphics/Rectangle.js";

export class TextBox {
    constructor(screen) {
        this.screen = screen;
        this.color = "#DCE8FF";
        this.backgroundColor = "rgba(5, 12, 22, 0.92)";
        this.borderColor = "rgba(190, 213, 237, 0.46)";
        this.activeBorderColor = "#F4D26A";
        this.draw = new Draw(screen);
        this.mouse = Mouse.instance ?? new Mouse();
        this.rect = new Rectangle(0, 0, 100, 20);
        this.text = '';
        this.isActive = false;
        this.placeholder = "";
        this.maxLength = 120;
    }

    /**
     * @doc Method
     * @param {Rectangle} rect
     * @description Sets the dimensions and position of the text box.
     * @example
     *  textBox.SetBox(new Rectangle(10, 20, 200, 30));
     * @returns {void}
     */
    SetBox(rect) {
        this.rect = rect;
    }

    /**
     * @doc Method
     * @param {string} color
     * @description Changes the text box color.
     * @example
     *  textBox.Color = "#FF5733";
     * @returns {void}
     */
    set Color(color) {
        this.color = color;
    }

    /**
     * @doc Method
     * @param {string} text
     * @description Sets the text content of the text box.
     * @example
     *  textBox.SetText("Hello World");
     * @returns {void}
     */
    SetText(text) {
        this.text = String(text ?? "").slice(0, this.maxLength);
    }

    SetActive(active = true) {
        this.isActive = Boolean(active);
    }

    SetPlaceholder(text) {
        this.placeholder = String(text ?? "");
    }

    SetMaxLength(maxLength) {
        this.maxLength = Math.max(1, Math.trunc(maxLength));
        this.text = this.text.slice(0, this.maxLength);
    }

    /**
     * @doc Method
     * @description Gets the text content of the text box.
     * @example
     *  const content = textBox.GetText();
     * @returns {string} The current text in the text box.
     */
    GetText() {
        return this.text;
    }

    /**
     * @doc Method
     * @param {KeyboardEvent} event
     * @description Handles keyboard input when the text box is active.
     * @example
     *  window.addEventListener("keydown", (event) => textBox.HandleInput(event));
     * @returns {void}
     */
    HandleInput(event) {
        if (this.isActive) {
            if (event.key === "Backspace") {
                this.text = this.text.slice(0, -1);
            } else if (event.key.length === 1 && this.text.length < this.maxLength) {
                this.text += event.key;
            }
        }
    }

    /**
     * @doc Method
     * @description Activates the text box if it is clicked.
     * @example
     *  textBox.Click();
     * @returns {void}
     */
    Click() {
        if (!this.mouse.buttonsDown?.[0]) return false;
        const point = this.mouse.getPositionRelative(this.screen.Canvas);
        this.isActive = point.x >= this.rect.x
            && point.x <= this.rect.x + this.rect.width
            && point.y >= this.rect.y
            && point.y <= this.rect.y + this.rect.height;
        return this.isActive;
    }

    /**
     * @doc Method
     * @description Draws the text box on the screen.
     * @example
     *  textBox.DrawCursor();
     * @returns {void}
     */
    DrawCursor() {
        const ctx = this.screen.Context;
        ctx.save();
        this.draw.Color = this.backgroundColor;
        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.DrawRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        this.draw.Color = this.isActive ? this.activeBorderColor : this.borderColor;
        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.DrawRect(this.rect.x + 0.5, this.rect.y + 0.5, this.rect.width - 1, this.rect.height - 1);
        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = this.text ? this.color : "rgba(220, 232, 255, 0.44)";
        this.draw.FontSize = "13px";
        ctx.textBaseline = "middle";
        this.draw.DrawText(this.text || this.placeholder, this.rect.x + 8, this.rect.y + this.rect.height / 2, this.rect.width - 16);
        ctx.restore();
    }
}
