import { Vector2D } from "../Math/Vector2D.js";

/**
 * @doc Class Mouse
 * @namespace Input
 * @class Mouse
 * @author Patrick Faustino Camello
 * @summary Manages mouse input for the game framework.
 * @Date 15/05/2019
 * @example
 * const mouse = new Mouse();
 * if (mouse.isClickDown(rect)) {
 *     // Execute some action when mouse is clicked inside the rectangle
 * }
 * @returns {Object}
 */
export class Mouse {
    constructor() {
        this.position = new Vector2D(0, 0);
        this.clickPosition = new Vector2D(0, 0);
        this.releasePosition = new Vector2D(0, 0);

        this.buttons = {};
        this.buttonsDown = {};
        this.buttonsUp = {};

        this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.mouseUpHandler = this.mouseUpHandler.bind(this);

        window.addEventListener('mousemove', this.mouseMoveHandler);
        window.addEventListener('mousedown', this.mouseDownHandler);
        window.addEventListener('mouseup', this.mouseUpHandler);

        if (!Mouse.instance) Mouse.instance = this;
        return Mouse.instance;
    }

    /**
     * @doc Method
     * @description Handles the mouse move event and updates the current position.
     * @param {MouseEvent} event - The mouse move event
     * @example
     * // Automatically handled by the class
     */
    mouseMoveHandler(event) {
        this.position.x = event.clientX;
        this.position.y = event.clientY;
    }

    /**
     * @doc Method
     * @description Handles the mouse down event and updates the click position.
     * @param {MouseEvent} event - The mouse down event
     * @example
     * // Automatically handled by the class
     */
    mouseDownHandler(event) {
        this.clickPosition.x = event.clientX;
        this.clickPosition.y = event.clientY;

        // NOVO: Registra o botão (0 = Esquerdo, 1 = Meio, 2 = Direito)
        if (!this.buttons[event.button]) {
            this.buttonsDown[event.button] = true;
        }
        this.buttons[event.button] = true;
    }

    /**
     * @doc Method
     * @description Handles the mouse up event and updates the release position.
     * @param {MouseEvent} event - The mouse up event
     * @example
     * // Automatically handled by the class
     */
    mouseUpHandler(event) {
        this.releasePosition.x = event.clientX;
        this.releasePosition.y = event.clientY;

        this.buttons[event.button] = false;
        this.buttonsUp[event.button] = true;
    }

    /**
     * @doc Method
     * @description Gets the current absolute mouse position.
     * @returns {Vector2D} - The current mouse position
     * @example
     * const position = mouse.getPositionAbsolute();
     * console.log(position.x, position.y);
     */
    getPositionAbsolute() {
        return this.position;
    }

    /**
     * @doc Method
     * @description Gets the relative mouse position within a specified element.
     * @param {HTMLElement} element - The HTML element to calculate the relative position against
     * @returns {Vector2D} - The relative mouse position
     * @example
     * const relativePosition = mouse.getPositionRelative(element);
     * console.log(relativePosition.x, relativePosition.y);
     */
    getPositionRelative(element) {
        const rect = element.getBoundingClientRect();
        return new Vector2D(this.position.x - rect.left, this.position.y - rect.top);
    }

    /**
     * @doc Method
     * @description Gets the mouse position at the time of the last click down.
     * @returns {Vector2D} - The position of the last mouse click down
     * @example
     * const clickPosition = mouse.getPositionClickDown();
     * console.log(clickPosition.x, clickPosition.y);
     */
    getPositionClickDown() {
        return this.clickPosition;
    }

    /**
     * @doc Method
     * @description Gets the mouse position at the time of the last click release.
     * @returns {Vector2D} - The position of the last mouse click release
     * @example
     * const releasePosition = mouse.getPositionClickRelease();
     * console.log(releasePosition.x, releasePosition.y);
     */
    getPositionClickRelease() {
        return this.releasePosition;
    }

    /**
     * @doc Method
     * @description Checks if the mouse was clicked down within a specified rectangle.
     * @param {Rectangle} rect - The rectangle to check against
     * @returns {boolean} - True if the mouse click was inside the rectangle, false otherwise
     * @example
     * if (mouse.isClickDown(rect)) {
     *     // Execute some action when mouse is clicked inside the rectangle
     * }
     */
    isClickDown(rect) {
        return this.isColliding(this.clickPosition, rect);
    }

    /**
     * @doc Method
     * @description Checks if the mouse was released within a specified rectangle.
     * @param {Rectangle} rect - The rectangle to check against
     * @returns {boolean} - True if the mouse release was inside the rectangle, false otherwise
     * @example
     * if (mouse.isClickRelease(rect)) {
     *     // Execute some action when mouse is released inside the rectangle
     * }
     */
    isClickRelease(rect) {
        return this.isColliding(this.releasePosition, rect);
    }

    /**
     * @doc Method
     * @description Checks if a point is colliding with a rectangle.
     * @param {Vector2D} point - The point to check
     * @param {Rectangle} rect - The rectangle to check against
     * @returns {boolean} - True if the point is inside the rectangle, false otherwise
     * @example
     * const isColliding = mouse.isColliding(new Vector2D(10, 10), rect);
     * console.log(isColliding);
     */
    isColliding(point, rect) {
        return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
    }

    // Limpa os estados de 'Down' e 'Up' a cada frame (chamado pelo Input Manager)
    ClearFrameData() {
        this.buttonsDown = {};
        this.buttonsUp = {};
    }
}
