export const FIGHTING_GAME_FLOW = Object.freeze({
    menuIndex: 0,
    characterSelectIndex: 1,
    fightIndex: 2,
});

export const FIGHTING_GAME_CHARACTERS = Object.freeze([
    {
        id: "riven",
        name: "Riven",
        title: "Velocidade",
        asset: "fight_char_blue",
        tint: "#52A8FF",
    },
    {
        id: "shade",
        name: "Shade",
        title: "Agilidade",
        asset: "fight_char_no_armor",
        tint: "#75D7FF",
    },
    {
        id: "aurum",
        name: "Aurum",
        title: "Impacto",
        asset: "fight_char_gold",
        tint: "#F4D26A",
    },
    {
        id: "aegis",
        name: "Aegis",
        title: "Defesa",
        asset: "fight_char_silver",
        tint: "#D7E2F1",
    },
]);

export const FightingGameSession = {
    mode: "arcade",
    p1Index: 0,
    p2Index: 3,
    arcadeStage: 0,
    arcadeOrder: [3, 2, 1],

    SetMode(mode) {
        this.mode = mode === "versus" ? "versus" : "arcade";
        this.arcadeStage = 0;
    },

    SetCharacter(player, characterIndex) {
        const index = ClampCharacterIndex(characterIndex);
        if (player === "p2") {
            this.p2Index = index;
            return;
        }

        this.p1Index = index;
    },

    GetP1() {
        return FIGHTING_GAME_CHARACTERS[ClampCharacterIndex(this.p1Index)];
    },

    GetP2() {
        if (this.mode === "arcade") {
            return FIGHTING_GAME_CHARACTERS[this.GetArcadeOpponentIndex()];
        }

        return FIGHTING_GAME_CHARACTERS[ClampCharacterIndex(this.p2Index)];
    },

    GetArcadeOpponentIndex() {
        const orderIndex = Math.min(this.arcadeStage, this.arcadeOrder.length - 1);
        const preferred = this.arcadeOrder[orderIndex];
        if (preferred !== this.p1Index) return preferred;

        return this.arcadeOrder.find(index => index !== this.p1Index) ?? 1;
    },

    HasNextArcadeOpponent() {
        return this.mode === "arcade" && this.arcadeStage < this.arcadeOrder.length - 1;
    },

    AdvanceArcadeOpponent() {
        if (!this.HasNextArcadeOpponent()) return false;

        this.arcadeStage += 1;
        return true;
    },
};

export function GoToFightingLevel(owner, targetIndex) {
    if (!owner?.LEVEL_HANDLER) return;

    owner.LEVEL_HANDLER.index = targetIndex - 1;
    owner.Next = true;
}

function ClampCharacterIndex(index) {
    const numericIndex = Number.isInteger(index) ? index : 0;
    return Math.max(0, Math.min(FIGHTING_GAME_CHARACTERS.length - 1, numericIndex));
}
