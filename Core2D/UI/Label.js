/**
 * @doc Class Label
 * @namespace UI
 * @class Label
 * @summary This class is part of the EngineHtml5 framework and provides functionality to create and interact with UI labels.
 * @Date 26/07/2024
 * @example
 *  var label = new Label(screen);
 * @returns {Object}
 */

import { Draw } from "../Graphics/Draw.js";
import { Rectangle } from "../Graphics/Rectangle.js";

export class Label {
    constructor(screen) {
        this.screen = screen;
        this.color = "#000000";
        this.draw = new Draw(screen);
        this.rect = new Rectangle(0, 0, 100, 20);
        this.text = '';
    }

    /**
     * @doc Method
     * @param {Rectangle} rect
     * @param {string} text
     * @description Sets the dimensions, position, and text content of the label.
     * @example
     *  label.SetLabel(new Rectangle(10, 20, 100, 20), "Hello World");
     * @returns {void}
     */
    SetLabel(rect, text) {
        this.rect = rect;
        this.text = text;
    }

    /**
     * @doc Method
     * @param {string} color
     * @description Changes the label color.
     * @example
     *  label.Color = "#FF5733";
     * @returns {void}
     */
    set Color(color) {
        this.color = color;
    }

    /**
     * @doc Method
     * @description Draws the label on the screen.
     * @example
     *  label.DrawLabel();
     * @returns {void}
     */
    DrawLabel() {
        this.draw.Color = this.color;
        this.draw.Style = 0;
        this.draw.DrawText(this.rect.x, this.rect.y + this.rect.height / 2, this.text);
    }
}
