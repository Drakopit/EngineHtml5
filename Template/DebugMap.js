/**
 * @doc Class DebugMap
 * @namespace Template
 * @class DebugMap
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @Date 15/05/2019
 * @example
 *  var camera = new DebugMap(screen); 
 * @returns void
 */

import { Base } from "../Root/Base.js";
import { Draw } from "../Drawing/Draw.js";

const GROUNDING = Object.freeze({
    NOTHING: 0,
    SAND: 1,
    MUD: 2,
    ROCK: 3
})

export class DebugMap extends Base {
    constructor(screen) {
        super();
        this.screen = screen;
        this.draw = new Draw(screen);

        // Default
        this.MapStructure = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
    }

    AddObjectToMap(item, x, y) {
        this.MapStructure[x][y] = item;
    }

    SetTileSize(vector2D) {
        this.tileW = vector2D.GetValue().x;
        this.tileH = vector2D.GetValue().y;
    }

    SetMapSize(vector2D) {
        this.mapWidth = vector2D.GetValue().x;
        this.mapHeight = vector2D.GetValue().y;
    }

    OnDrawn() {
        this.draw.Font = 'Bold Arial';
        this.draw.FontSize = '11px';
        for (let i = 0; i < this.mapWidth; i++) {
            for (let j = 0; j < this.mapHeight; j++) {
                switch (this.MapStructure[((j*this.mapWidth)+i)]) {
                    case GROUNDING.NOTHING:
                        this.draw.Color = "#5AA457";
                        this.draw.Style = 1;
                        this.draw.DrawRect(i*this.tileW, j*this.tileH, this.tileW, this.tileH);
                        this.draw.Style = 0;
                    break;

                    default:
                        this.draw.Color = "#685B48";
                    break;
                }
                this.draw.DrawRect(i*this.tileW, j*this.tileH, this.tileW, this.tileH);
            }
        }
        this.draw.Color = "white";
    }
}
