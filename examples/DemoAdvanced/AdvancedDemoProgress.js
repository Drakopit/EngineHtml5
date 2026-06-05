export const ADVANCED_DEMO_FLOW = Object.freeze({
    menuIndex: 0,
    phaseSelectorIndex: 1,
    firstLevelIndex: 2,
    secondLevelIndex: 3,
    bossLevelIndex: 4,
    gameOverIndex: 5,
    congratulationsIndex: 6,
});

export const ADVANCED_DEMO_PHASES = Object.freeze([
    {
        id: "first",
        title: "Fase 1",
        subtitle: "Passagem Congelada",
        levelIndex: ADVANCED_DEMO_FLOW.firstLevelIndex,
        unlocks: "second",
    },
    {
        id: "second",
        title: "Fase 2",
        subtitle: "Ruinas do Vale",
        levelIndex: ADVANCED_DEMO_FLOW.secondLevelIndex,
        requires: "first",
        unlocks: "boss",
    },
    {
        id: "boss",
        title: "Boss",
        subtitle: "Portao do Norte",
        levelIndex: ADVANCED_DEMO_FLOW.bossLevelIndex,
        requires: "second",
    },
]);

const STORAGE_KEY = "gameforgejs_advanced_demo_progress";
const DEFAULT_PROGRESS = {
    unlocked: ["first"],
    completed: [],
    player: null,
};

export class AdvancedDemoProgress {
    static Load() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return this.Clone(DEFAULT_PROGRESS);

            const progress = JSON.parse(raw);
            return {
                unlocked: Array.isArray(progress.unlocked) ? progress.unlocked : ["first"],
                completed: Array.isArray(progress.completed) ? progress.completed : [],
                player: progress.player && typeof progress.player === "object" ? progress.player : null,
            };
        } catch {
            return this.Clone(DEFAULT_PROGRESS);
        }
    }

    static Save(progress) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch {
            // Save failure should not block the demo loop.
        }
    }

    static Reset() {
        const progress = this.Clone(DEFAULT_PROGRESS);
        this.Save(progress);
        return progress;
    }

    static Complete(phaseId, unlockPhaseId = null) {
        const progress = this.Load();
        this.AddUnique(progress.completed, phaseId);

        if (unlockPhaseId) {
            this.AddUnique(progress.unlocked, unlockPhaseId);
        }

        this.Save(progress);
        return progress;
    }

    static LoadPlayerProgress() {
        return this.Load().player;
    }

    static SavePlayerProgress(playerProgress) {
        const progress = this.Load();
        progress.player = playerProgress;
        this.Save(progress);
    }

    static IsUnlocked(phaseId) {
        return this.Load().unlocked.includes(phaseId);
    }

    static IsCompleted(phaseId) {
        return this.Load().completed.includes(phaseId);
    }

    static GetPhase(phaseId) {
        return ADVANCED_DEMO_PHASES.find(phase => phase.id === phaseId) ?? null;
    }

    static GoToIndex(owner, targetIndex) {
        if (!owner?.LEVEL_HANDLER) return;

        owner.LEVEL_HANDLER.index = targetIndex - 1;
        owner.Next = true;
    }

    static GoToMenu(owner) {
        this.GoToIndex(owner, ADVANCED_DEMO_FLOW.menuIndex);
    }

    static GoToPhaseSelector(owner) {
        this.GoToIndex(owner, ADVANCED_DEMO_FLOW.phaseSelectorIndex);
    }

    static GoToGameOver(owner) {
        this.GoToIndex(owner, ADVANCED_DEMO_FLOW.gameOverIndex);
    }

    static GoToCongratulations(owner) {
        this.GoToIndex(owner, ADVANCED_DEMO_FLOW.congratulationsIndex);
    }

    static Clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    static AddUnique(list, value) {
        if (!value || list.includes(value)) return;
        list.push(value);
    }
}
