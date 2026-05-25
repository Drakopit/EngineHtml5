import { GameObject } from "../Objects/GameObject.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { NineSlice } from "./NineSlice.js";
import { Draw } from "../Graphics/Draw.js";

/**
 * Nine-slice canvas window that positions child labels relative to its frame.
 *
 * Subclass or compose this class for in-game panels rendered inside GameForgeJS
 * rather than as external HTML.
 */
export class UIWindow extends GameObject {
    constructor(screen, image, x, y, width, height, cornerSize = 16) {
        super();
        this.name = "UIWindow";
        this.screen = screen;
        
        // Global position on the screen
        this.position = new Vector2D(x, y);
        this.size = new Vector2D(width, height);

        // The dynamic background
        this.background = new NineSlice(this.screen, image, cornerSize);
        this.draw = new Draw(this.screen);

        // Array to hold everything inside this window
        this.children = [];
    }

    /**
     * Adds text relative to the window's top-left corner
     * @param {string} text - Label content.
     * @param {number} offsetX - Horizontal offset inside the window.
     * @param {number} offsetY - Vertical offset inside the window.
     * @param {string} [color="#FFFFFF"] - Canvas text color.
     * @param {string} [fontSize="20px"] - CSS canvas font size.
     * @param {string} [fontStyle="Arial"] - Canvas font family.
     * @returns {void}
     */
    AddText(text, offsetX, offsetY, color = "#FFFFFF", fontSize = "20px", fontStyle = "Arial") {
        this.children.push({
            type: "text",
            text: text,
            offsetX: offsetX,
            offsetY: offsetY,
            color: color,
            font: `${fontSize} ${fontStyle}`
        });
    }

    OnUpdate(dt) {
        // We will put button hover/click logic here later!
    }

    OnDrawn() {
        // 1. Draw the Nine-Slice Panel
        this.background.DrawPanel(
            this.position.x, 
            this.position.y, 
            this.size.x, 
            this.size.y
        );

        // 2. Draw all children
        this.children.forEach(child => {
            if (child.type === "text") {
                this.draw.Color = child.color;
                // Assuming your Draw class allows setting the font:
                if (this.screen.Context) {
                    this.screen.Context.font = child.font;
                    this.screen.Context.fillStyle = child.color;
                    
                    // Draw relative to the window's position!
                    this.screen.Context.fillText(
                        child.text, 
                        this.position.x + child.offsetX, 
                        this.position.y + child.offsetY
                    );
                }
            }
        });
    }
}
