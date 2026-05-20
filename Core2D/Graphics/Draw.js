/**
 * @doc Class Draw
 * @namespace Graphic
 * @class Draw
 * @author Patrick Faustino Camello
 * @summary Provides drawing utilities for 2D graphics.
 * @description This class facilitates drawing operations on a given canvas, including text, rectangles, circles, and sprites.
 * @Date 15/05/2019
 * @example
 *  const draw = new Draw(screen);
 *  draw.Color = 'red';
 *  draw.DrawText('Hello World', 50, 50);
 * @returns {Object}
 */

export class Draw {
    constructor(screen) {
        this.screen = screen;
        this.fontSize = "12px";
        this.font = "verdana";

        // Enum to control the drawing style
        this.TYPES = {
            FILLED: 0,
            STROKED: 1
        };
        this.style = this.TYPES.FILLED;
        this.color = '#000000'; // Default color
    }

    get Color() { return this.color; }
    set Color(color) {
        this.color = color;
        this.screen.Context.fillStyle = color;
        this.screen.Context.strokeStyle = color; // Set stroke color for outlines
    }

    get Font() { return this.font; }
    set Font(font) {
        this.font = font;
        this.screen.Context.font = `${this.fontSize} ${this.font}`; // Update the context font
    }

    get FontSize() { return this.fontSize; }
    set FontSize(fontSize) {
        this.fontSize = fontSize;
        this.screen.Context.font = `${this.fontSize} ${this.font}`; // Update the context font
    }

    get Style() { return this.style; }
    set Style(style) { this.style = style; }

    /**
     * @doc Method
     * @param {string} align - The text alignment (e.g., 'left', 'center', 'right').
     * @description Sets the text alignment for drawing text.
     * @example
     *  draw.SetTextAlign('center');
     */
    SetTextAlign(align) {
        this.screen.Context.textAlign = align;
    }

    /**
     * @doc Method
     * @param {string} text - The text to be drawn.
     * @param {number} x - The x-coordinate where the text will be drawn.
     * @param {number} y - The y-coordinate where the text will be drawn.
     * @param {number} [maxWidth] - The maximum width of the text. If not provided, there is no limit.
     * @description Draws text on the canvas.
     * @example
     *  draw.DrawText('Hello World', 50, 50);
     */
    DrawText(text, x, y, maxWidth) {
        switch (this.style) {
            case this.TYPES.FILLED:
                this.screen.Context.fillText(text, x, y, maxWidth);
                break;

            case this.TYPES.STROKED:
                this.screen.Context.strokeText(text, x, y, maxWidth);
                break;

            default:
                this.screen.Context.fillText(text, x, y, maxWidth);
                break;
        }
    }

    /**
     * @doc Method
     * @param {number} x - The x-coordinate where the rectangle will be drawn.
     * @param {number} y - The y-coordinate where the rectangle will be drawn.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @description Draws a rectangle on the canvas.
     * @example
     *  draw.DrawRect(10, 10, 100, 50);
     */
    DrawRect(x, y, width, height) {
        this.screen.Context.beginPath();
        switch (this.style) {
            case this.TYPES.FILLED:
                this.screen.Context.fillRect(x, y, width, height);
                break;

            case this.TYPES.STROKED:
                this.screen.Context.strokeRect(x, y, width, height);
                break;

            default:
                this.screen.Context.fillRect(x, y, width, height);
                break;
        }
    }

    /**
     * @doc Method
     * @param {number} x - The x-coordinate of the circle's center.
     * @param {number} y - The y-coordinate of the circle's center.
     * @param {number} radius - The radius of the circle.
     * @description Draws a circle on the canvas.
     * @example
     *  draw.DrawCircle(50, 50, 20);
     */
    DrawCircle(x, y, radius) {
        this.screen.Context.beginPath();
        this.screen.Context.arc(x, y, radius, 0, 2 * Math.PI);

        switch (this.style) {
            case this.TYPES.FILLED:
                this.screen.Context.fill();
                break;

            case this.TYPES.STROKED:
                this.screen.Context.stroke();
                break;

            default:
                this.screen.Context.fill();
                break;
        }
    }

    /**
     * @doc Method
     * @param {HTMLImageElement | string} sprite - The image element or the URL of the sprite.
     * @param {number} x - The x-coordinate where the sprite will be drawn.
     * @param {number} y - The y-coordinate where the sprite will be drawn.
     * @description Draws an image or sprite on the canvas.
     * @example
     *  draw.DrawSprite(image, 10, 10);
     */
    DrawSprite(sprite, x, y) {
        if (sprite instanceof HTMLImageElement || sprite instanceof Image) {
            // Desenha diretamente. O asset já deve ter sido processado pelo Preloader
            this.screen.Context.drawImage(sprite, x, y);
        } else {
            console.error("DrawSprite: O parâmetro 'sprite' deve ser uma Image previamente carregada.");
        }
    }

    DrawSpriteStretched(sprite, x, y, width, height) {
        if (sprite instanceof HTMLImageElement || sprite instanceof Image) {
            this.screen.Context.drawImage(sprite, x, y, width, height);
            return;
        }

        console.error("DrawSpriteStretched: O parametro 'sprite' deve ser uma Image previamente carregada.");
    }

    DrawSpritePart(sprite, source, destination) {
        if (!(sprite instanceof HTMLImageElement || sprite instanceof Image)) {
            console.error("DrawSpritePart: O parametro 'sprite' deve ser uma Image previamente carregada.");
            return;
        }

        this.screen.Context.drawImage(
            sprite,
            source.x,
            source.y,
            source.width,
            source.height,
            destination.x,
            destination.y,
            destination.width,
            destination.height
        );
    }
}
