/**
 * @doc Class Store
 * @namespace Root
 * @class Store
 * @author Patrick Faustino Camello
 * @summary This class is part of the EngineHtml5 framework and provides functionality to save and restore game state in the browser's local storage.
 * @Date 15/05/2019
 * @example
 *  var store = new Store();
 *  store.SaveState({ level: 1, score: 1000 });
 *  var state = store.RestoreState();
 * @returns {Object}
 */

export class Store {
    constructor(prefix = 'game') {
        // Set default prefix
        this.prefix = prefix;
    }

    /**
     * @doc Method
     * @param {Object} state - The state object to be saved.
     * @description Saves the current state to local storage.
     * @example
     *  store.SaveState({ level: 1, score: 1000 });
     * @returns {void}
     */
    SaveState(state, prefix) {
        try {
            if (typeof state !== 'object' || state === null) {
                throw new Error('Invalid state: must be a non-null object.');
            }
            if (!prefix) {
                window.localStorage.setItem(`${this.prefix}_state`, JSON.stringify(state));
            } else {
                window.localStorage.setItem(`${prefix}_state`, JSON.stringify(state));
            }
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    /**
     * @doc Method
     * @description Restores the previously saved state from local storage.
     * @example
     *  var state = store.RestoreState();
     * @returns {Object|null} The saved state object or null if no state is found.
     */
    RestoreState(prefix) {
        try {
            let state;
            // Check if a prefix is provided
            if (!prefix) {
                state = window.localStorage.getItem(`${this.prefix}_state`);
            } else {
                state = window.localStorage.getItem(`${prefix}_state`);
            }
            // Check if state is null
            if (state) {
                return JSON.parse(state);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Failed to restore state:', error);
            return null;
        }
    }

    /**
     * @doc Method
     * @description Clears the saved state from local storage.
     * @example
     *  store.ClearState();
     * @returns {void}
     */
    ClearState(prefix) {
        try {
            if (!prefix) {
                window.localStorage.removeItem(`${this.prefix}_state`);
            } else {
                window.localStorage.removeItem(`${prefix}_state`);
            }
        } catch (error) {
            console.error('Failed to clear state:', error);
        }
    }

    /**
     * @doc Method
     * @description Backs up the saved state to a different key in local storage.
     * @param {string} backupPrefix - The prefix for the backup key.
     * @example
     *  store.BackupState('backup_game');
     * @returns {void}
     */
    BackupState(backupPrefix, prefix) {
        try {
            let state;
            if (!prefix) {
                state = window.localStorage.getItem(`${this.prefix}_state`);
            } else {
                state = window.localStorage.getItem(`${prefix}_state`);
            }
            if (state) {
                window.localStorage.setItem(`${backupPrefix}_state`, state);
            }
        } catch (error) {
            console.error('Failed to back up state:', error);
        }
    }
}
