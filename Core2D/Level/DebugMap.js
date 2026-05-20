/**
 * @doc Class DebugMap
 * @namespace Template
 * @class DebugMap
 * @author Patrick Faustino Camello
 * @summary This class is part of the EngineHtml5 framework and provides functionality to manage and draw a map structure.
 * @Date 15/05/2019
 * @example
 *  var camera = new DebugMap(screen); 
 * @returns void
 */

import { Base } from "../../CoreCross/Base.js";
import { Draw } from "../Graphics/Draw.js";

const GROUNDING = Object.freeze({
    NOTHING: 0,
    SAND: 1,
    MUD: 2,
    ROCK: 3
});

export class DebugMap extends Base {
    constructor(screen) {
        super();
        this.screen = screen;
        this.draw = new Draw(screen);

        // Default map size and structure
        this.tileW = 0;
        this.tileH = 0;
        this.mapWidth = 16;
        this.mapHeight = 16;
        this.MapStructure = Array.from({ length: this.mapHeight }, () => 
            Array(this.mapWidth).fill(GROUNDING.NOTHING)
        );
    }

    AddObjectToMap(item, x, y) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            this.MapStructure[y][x] = item;
        }
    }

    SetTileSize(vector2D) {
        this.tileW = vector2D.GetValue().x;
        this.tileH = vector2D.GetValue().y;
    }

    SetMapSize(vector2D) {
        this.mapWidth = vector2D.GetValue().x;
        this.mapHeight = vector2D.GetValue().y;
        this.MapStructure = Array.from({ length: this.mapHeight }, () => 
            Array(this.mapWidth).fill(GROUNDING.NOTHING)
        );
    }

    OnDrawn() {
        this.draw.Font = 'Bold Arial';
        this.draw.FontSize = '11px';

        for (let j = 0; j < this.mapHeight; j++) {
            for (let i = 0; i < this.mapWidth; i++) {
                const groundType = this.MapStructure[j][i];

                switch (groundType) {
                    case GROUNDING.NOTHING:
                        this.draw.Color = "#5AA457";
                        break;
                    default:
                        this.draw.Color = "#685B48";
                        break;
                }

                this.draw.Style = 1;
                this.draw.DrawRect(i * this.tileW, j * this.tileH, this.tileW, this.tileH);
                this.draw.Style = 0;
            }
        }

        this.draw.Color = "white";
    }
}
