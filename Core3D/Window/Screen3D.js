/**
 * @doc Class Screen
 * @namespace Window
 * @class Screen
 * @author Patrick Faustino Camello
 * @summary Manages a WebGL context for rendering graphics.
 * @Date 15/05/2019
 * @example
 *  var screen = new Screen(0, 320, 240);
 * @returns {Object}
 */
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { GameViewport } from "../../CoreCross/Window/GameViewport.js";

export class Screen3D {
    constructor(id, width, height) {
        this.id = id;
        this.width = width ?? window.innerWidth;
        this.height = height ?? window.innerHeight;
        this.ratio = this.width / this.height;
        this.clientWidth = window.innerWidth;
        this.clientHeight = window.innerHeight;
        this.x = 0;
        this.y = 0;

        // Initialize the screen
        this.Init(this.id);
    }

    /**
     * @doc Method
     * @description Get the canvas element of the screen
     * @example
     *  var canvas = screen.Canvas();
     * @returns {HTMLCanvasElement}
     */
    get Canvas() { return this.canvas; }

    /**
     * @doc Method
     * @description Set a new canvas element
     * @example
     *  screen.Canvas(canvas);
     * @param {HTMLCanvasElement} canvas
     */
    set Canvas(canvas) { this.canvas = canvas; }

    /**
     * @doc Method
     * @description Get the WebGL rendering context
     * @example
     *  var context = screen.Context();
     * @returns {WebGLRenderingContext}
     */
    get Context() { return this.gl; }

    /**
     * @doc Method
     * @description Set a new WebGL rendering context
     * @example
     *  screen.Context(context);
     * @param {WebGLRenderingContext} context
     */
    set Context(context) { this.gl = context; }

    /**
     * @doc Method
     * @description Get screen ID
     * @example
     *  var id = screen.ScreenId();
     * @returns {number}
     */
    get ScreenId() { return this.id; }

    /**
     * @doc Method
     * @description Initialize the canvas and WebGL context
     * @param {string} screenName - The ID of the canvas
     * @example
     *  screen.Init('canvasName');
     */
    Init(screenName) {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.canvas.setAttribute("id", screenName);
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        GameViewport.Apply(this.canvas);

        // Initialize WebGL context. WebGL2 is preferred by Render3D, while the
        // legacy 3D helpers still work with the same returned context.
        this.gl = this.canvas.getContext("webgl2")
            || this.canvas.getContext("webgl")
            || this.canvas.getContext("experimental-webgl");

        if (!this.gl) {
            console.error('WebGL not supported');
        }
    }

    /**
     * @doc Method
     * @description Return canvas width
     * @example
     *  var width = screen.Width();
     * @returns {number}
     */
    get Width() { return this.canvas.width; }

    /**
     * @doc Method
     * @description Return canvas height
     * @example
     *  var height = screen.Height();
     * @returns {number}
     */
    get Height() { return this.canvas.height; }

    /**
     * @doc Method
     * @description Return the size of the canvas
     * @example
     *  var size = screen.GetSize();
     * @returns {Vector2D}
     */
    GetSize() {
        return new Vector2D(this.Width, this.Height);
    }

    /**
     * @doc Method
     * @description Return the size of the browser window
     * @example
     *  var windowSize = screen.GetwindowSize();
     * @returns {Vector2D}
     */
    GetwindowSize() {
        return new Vector2D(this.clientWidth, this.clientHeight);
    }

    /**
     * @doc Method
     * @description Clear the screen
     * @example
     *  screen.Refresh();
     */
    Refresh() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * @doc Method
     * @param {Vector2D} vector2D
     * @description Resize the canvas
     * @example
     *  screen.Resize(new Vector2D(640, 480));
     */
    Resize(vector2D) {
        this.canvas.width = vector2D.GetValue().x;
        this.canvas.height = vector2D.GetValue().y;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    FullScreen() {
        GameViewport.Apply(this.canvas, true);
    }

    /**
     * @doc Method
     * @description Get the position of the screen
     * @example
     *  var position = screen.Position();
     * @returns {Vector2D}
     */
    get Position() { return new Vector2D(this.x, this.y); }
}

Screen3D.prototype.MDC = function(width, height) {
    return (height === 0) ? width : this.MDC(height, width % height);
};
