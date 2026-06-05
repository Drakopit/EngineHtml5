/**
 * Reports use of compatibility APIs once per deprecated identifier.
 *
 * This keeps legacy projects running while guiding new games toward the
 * maintained GameForgeJS API.
 */
export class Deprecation {
    static warnings = new Set();

    /**
     * Writes one browser warning for a deprecated API.
     * @param {string} apiName - Deprecated public identifier.
     * @param {string} [replacement=""] - Preferred replacement API.
     * @returns {void}
     */
    static WarnOnce(apiName, replacement = "") {
        if (this.warnings.has(apiName)) return;

        const suggestion = replacement ? ` Use '${replacement}' instead.` : "";
        console.warn(`[Deprecated] '${apiName}' is deprecated and kept only for compatibility.${suggestion}`);
        this.warnings.add(apiName);
    }
}
