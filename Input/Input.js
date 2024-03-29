export const KeyCode = Object.freeze({
    "Break" : 3,
    "Backspace" : 8,
    "Tab" : 9,
    "Enter" : 13,
    "Shift" : 16,
    "Ctrl" : 17,
    "Alt" : 18,
    "Pause/Break" : 19,
    "Caps Lock" : 20,
    "Esc" : 27,
    "Space" : 32,
    "Page Up" : 33,
    "Page Down" : 34,
    "End" : 35,
    "Home" : 36,
    "Left" : 37,
    "Up" : 38,
    "Right" : 39,
    "Down" : 40,
    "Insert" : 45,
    "Delete" : 46,
    "0" : 48, "1" : 49, "2" : 50, "3" : 51,"4" : 52,"5" : 53,"6" : 54,"7" : 55,"8" : 56,"9" : 57,
    "A" : 65,"B" : 66,"C" : 67,"D" : 68,"E" : 69,"F" : 70,"G" : 71,"H" : 72,"I" : 73,"J" : 74,"K" : 75,
    "L" : 76,"M" : 77,"N" : 78,"O" : 79,"P" : 80,"Q" : 81,"R" : 82,"S" : 83,"T" : 84,"U" : 85,"V" : 86,"W" : 87,"X" : 88,"Y" : 89,"Z" : 90,
    "Windows" : 91,
    "Right Click" : 93,
    "Numpad 0" : 96,"Numpad 1" : 97,"Numpad 2" : 98,"Numpad 3" : 99,"Numpad 4" : 100,"Numpad 5" : 101,"Numpad 6" : 102,"Numpad 7" : 103,"Numpad 8" : 104,"Numpad 9" : 105,
    "Numpad *" : 106,"Numpad +" : 107,"Numpad -" : 109,"Numpad ." : 110,"Numpad /" : 111,
    "F1" : 112,"F2" : 113,"F3" : 114,"F4" : 115,"F5" : 116,"F6" : 117,"F7" : 118,"F8" : 119,"F9" : 120,"F10" : 121,"F11" : 122,"F12" : 123,
    "Num Lock" : 144,"Scroll Lock" : 145,
    "My Computer" : 182,"My Calculator" : 183,
    ";" : 186,"=" : 187,"," : 188,"-" : 189,"." : 190,"/" : 191,"`" : 192,"[" : 219,"\\" : 220,"]" : 221,"'" : 222
});

export const CharCode = Object.freeze({
    0 : 'That key has no keycode',
    3 : "Break",
    8 : "Backspace",
    9 : "Tab",
    13 : "Enter",
    16 : "Shift",
    17 : "Ctrl",
    18 : "Alt",
    19 : "Pause/Break",
    20 : "Caps Lock",
    27 : "Esc",
    32 : "Space",
    33 : "Page Up",
    34 : "Page Down",
    35 : "End",
    36 : "Home",
    37 : "Left",
    38 : "Up",
    39 : "Right",
    40 : "Down",
    45 : "Insert",
    46 : "Delete",
    48 : "0",49 : "1",50 : "2",51 : "3",52 : "4",53 : "5",54 : "6",55 : "7",56 : "8",57 : "9",
    65 : "A",66 : "B",67 : "C",68 : "D",69 : "E",70 : "F",71 : "G",72 : "H",73 : "I",74 : "J",75 : "K",
    76 : "L",77 : "M",78 : "N",79 : "O",80 : "P",81 : "Q",82 : "R",83 : "S",84 : "T",85 : "U",86 : "V",
    87 : "W",88 : "X",89 : "Y",90 : "Z",
    91 : "Windows",
    93 : "Right Click",
    96 : "Numpad 0",97 : "Numpad 1",98 : "Numpad 2",99 : "Numpad 3",100 : "Numpad 4",101 : "Numpad 5",102 : "Numpad 6",103 : "Numpad 7",104 : "Numpad 8",105 : "Numpad 9",
    106 : "Numpad *",107 : "Numpad +",109 : "Numpad -",110 : "Numpad .",111 : "Numpad /",
    112 : "F1",113 : "F2",114 : "F3",115 : "F4",116 : "F5",117 : "F6",118 : "F7",119 : "F8",120 : "F9",121 : "F10",122 : "F11",123 : "F12",
    144 : "Num Lock",145 : "Scroll Lock",
    182 : "My Computer",183 : "My Calculator",
    186 : ";",187 : ": ",188 : ",",189 : "-",190 : ".",191 : "/",192 : "`",219 : "[",220 : "\\",221 : "]",222 : "'"
});

export class Key {
    constructor(code) {
        this.code = code;
        this.keyCode = this.code;
        // this.keyStr = KeyCode[this.code].toString();
        this.keyStr = KeyCode[this.code];
        this.isPress = false;
        this.isDown = false;
        this.isUp = true;
    }

    get Code() { return this.code };
    set Code(code) { this.code = code; };

    get KeyCode() { return this.keyCode; };
    set KeyCode(code) { this.keyCode = code; }
    
    get KeyStr() { return this.keyStr; };
    set KeyStr(code) { this.keyStr = KeyCode[this.code]; };
    
    get KeyPressed() { return this.isDown; };
    set KeyPressed(bool) { this.isDown = bool; };

    get KeyRelease() { return this.isUp; };
    set KeyRelease(bool) { this.isUp = bool; };
    
    get KeyPress() { return this.isPress; };
    set KeyPress(bool) { this.isPress = bool; };
}

/**
 * @doc Class Input
 * @namespace Input
 * @class Input
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @Date 15/05/2019
 * @example var input = new Input(screen);
 * @returns {Object}
 */

// API padrão usa KeyboardEvent
export class Input {
    constructor(screen) {
        this.screen = screen;
    }

    AddEvents(Down, Release, Press) {
        if (document.addEventListener) {
            document.addEventListener("keydown",    (evento) => {
                return Down(evento);
            }, false);
            document.addEventListener("keyup",      (evento) => {
                return Release(evento);
            }, false);
            document.addEventListener("keypress",   (evento) => {
                return Press(evento);
            }, false);
        } else {
            document.attachEvent("onkeydown",   (evento) => {
                return Down(evento)
            });
            document.attachEvent("onkeyup",     (evento) => {
                return Release(evento);
            });
            document.attachEvent("onkeypress",  (evento) => {
                return Press(evento);
            });
        }
    };

    RemoveEvents(Down, Release, Press) {
        document.removeEventListener("keydown",     (evento) => {
            return Down(evento);
        });
        document.removeEventListener("keyup",       (evento) => {
            return Release(evento);
        });
        document.removeEventListener("keypress",    (event) => {
            return Press(evento);
        });
    };
}