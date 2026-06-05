// Ficheiro: Root/EventEmitter.js
/**
 * Minimal synchronous event publisher used across engine services.
 */
export class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    /**
     * Registers a listener for an event name.
     * @param {string} event - Event name.
     * @param {Function} callback - Listener callback.
     * @returns {Function} Unsubscribe callback.
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    once(event, callback) {
        const unsubscribe = this.on(event, (...args) => {
            unsubscribe();
            callback(...args);
        });
        return unsubscribe;
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(listener => listener !== callback);
        if (this.listeners[event].length === 0) delete this.listeners[event];
    }

    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(...args));
        }
    }
}
