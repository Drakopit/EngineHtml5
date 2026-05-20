/**
 * @doc Class Ui
 * @namespace Root
 * @class Ui
 * @summary This class is part of the EngineHtml5 framework and provides functionality to manage UI elements such as buttons, text boxes, and labels.
 * @Date 15/05/2019
 * @example
 *  const ui = new UI(screen);
 *  ui.Button(10, 20, 100, 50, () => { console.log("Button clicked!"); });
 *  ui.TextBox(10, 80, 200, 30);
 *  ui.Label(10, 120, "Hello World");
 * @returns {void}
 */

import { Button } from "./Button.js";  // Certifique-se de que o caminho está correto
import { TextBox } from "./TextBox.js"; // Supondo que você tenha uma classe TextBox
import { Label } from "./Label.js";     // Supondo que você tenha uma classe Label
import { Rectangle } from "../Graphics/Rectangle.js"; // Certifique-se de que a classe Rectangle está corretamente importada

export class UI {
    constructor(screen) {
        if (!screen) {
            throw new Error("Screen is required");
        }
        this.screen = screen;
    }

    /**
     * @doc Method
     * @param {number} x - The x-coordinate of the button's position.
     * @param {number} y - The y-coordinate of the button's position.
     * @param {number} width - The width of the button.
     * @param {number} height - The height of the button.
     * @param {function} callBack - The function to execute when the button is clicked.
     * @description Creates a button UI element and handles its click events.
     * @example
     *  ui.Button(10, 20, 100, 50, () => { console.log("Button clicked!"); });
     * @returns {Button} The created button instance.
     */
    Button(x, y, width, height, callBack) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error("Invalid arguments for Button");
        }
        if (typeof callBack !== 'function') {
            throw new Error("Callback must be a function");
        }

        const button = new Button(this.screen);
        button.SetButton(new Rectangle(x, y, width, height));
        button.Click(callBack);
        button.OnClick(callBack);
        return button;
    }

    /**
     * @doc Method
     * @param {number} x - The x-coordinate of the text box's position.
     * @param {number} y - The y-coordinate of the text box's position.
     * @param {number} width - The width of the text box.
     * @param {number} height - The height of the text box.
     * @description Creates a text box UI element where users can input text.
     * @example
     *  ui.TextBox(10, 80, 200, 30);
     * @returns {TextBox} The created text box instance.
     */
    TextBox(x, y, width, height) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error("Invalid arguments for TextBox");
        }

        const textBox = new TextBox(this.screen);
        textBox.SetBox(new Rectangle(x, y, width, height));
        return textBox;
    }

    /**
     * @doc Method
     * @param {number} x - The x-coordinate of the label's position.
     * @param {number} y - The y-coordinate of the label's position.
     * @param {string} text - The text to display on the label.
     * @description Creates a label UI element to display static text.
     * @example
     *  ui.Label(10, 120, "Hello World");
     * @returns {Label} The created label instance.
     */
    Label(x, y, text) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof text !== 'string') {
            throw new Error("Invalid arguments for Label");
        }

        const label = new Label(this.screen);
        label.SetLabel(new Rectangle(x, y, 0, 0), text);
        return label;
    }
}
