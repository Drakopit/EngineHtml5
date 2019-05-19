export class Draw {
    constructor(screen) {
        this.screen = screen;
        this.fontSize = "12px";
        this.font = "verdana";
        
        // Enum pra controlar o estado dos desenhos
        const TYPES = Object.freeze({
            FILLED,
            STROKED
        });

        this.style = TYPES.FILLED;
    }

    get Color() { return this.color; }
    set Color(color) { this.color = color; }

    get Font() { return this.font; }
    set Font(font) { this.font = font; }

    get FontSize() { return this.fontSize; }
    set FontSize(fontSize) { this.fontSize = fontSize; }

    get Style() { return this.style; }
    set Style(style) { this.style = style; }

    SetFont(size, font) {
        this.FontSize = size;
        this.Font = font;
    }

    DrawText(text, x, y, maxWidth) {
        maxWidth = maxWidth || "1px";
        this.screen.Context.font = `${this.fontSize} ${this.font}`;
        switch (this.style) {
            case TYPES.FILLED:
                this.screen.Context.fillText(text, x, y);
            break;
            
            case TYPES.STROKED:
                this.screen.Context.strokeText(text, x, y, maxWidth);
            break;
            default:
                this.screen.Context.fillText(text, x, y);
            break;
        }
    }

    DrawRect(x, y, width, height) {
        switch (this.style) {
            case TYPES.FILLED:
                this.screen.Context.fillRect(x, y, width, height);
            break;
            case TYPES.STROKED:
                this.screen.Context.strokeRect(x, y, width, height);
            break;
            default:
                this.screen.Context.fillRect(x, y, width, height);
            break;
        }
    }

    DrawCircle(x, y, radius) {
        this.screen.Context.arc(x, y, radius, Math.PI / 180 * startAngle, Math.PI / 180 * endAngle, anticlockwise);
        switch (this.style) {
            case TYPES.FILLED:
                this.screen.Context.fill();
            break;
            case TYPES.STROKED:
                this.screen.Context.stroke();
            break;
            default:
                this.screen.Context.fill();
            break;
        }
    }

    DrawSprite(sprite, x, y) {
        let image = document.createElement("img");
        document.body.appendChild(image);
        image.src = sprite;
        this.screen.Context.drawImage(sprite, x, y);        
    }
}
