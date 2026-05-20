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
        this.color = "#FFFFFF";
        this.draw = new Draw(screen);
        this.mouse = new Mouse();
        this.rect = new Rectangle(0, 0, 100, 20);
        this.text = '';
        this.isActive = false;
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
        this.text = text;
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
            } else if (event.key.length === 1) {
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
        this.isActive = this.mouse.ClickDown(this.rect);
    }

    /**
     * @doc Method
     * @description Draws the text box on the screen.
     * @example
     *  textBox.DrawCursor();
     * @returns {void}
     */
    DrawCursor() {
        this.draw.Color = this.color;
        this.draw.Style = 1;
        this.draw.DrawRect(this.rect.x + 1, this.rect.y + 1, this.rect.width - 1, this.rect.height - 1);
        this.draw.Style = 0;
        this.draw.DrawRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        this.draw.DrawText(this.rect.x + 5, this.rect.y + this.rect.height / 2, this.text);
    }
}
