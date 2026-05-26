class PublishReport {
    constructor() {
        this.copied = [];
        this.skipped = [];
        this.errors = [];
    }

    recordCopied(source, dest, type = "file") {
        this.copied.push(source);
    }

    recordSkipped(source, reason) {
        this.skipped.push(`${source} (${reason})`);
    }

    recordError(source, error) {
        this.errors.push(`${source} - ${error}`);
    }

    print() {
        console.log("\n========================================");
        console.log("       GameForgeJS Publish Report       ");
        console.log("========================================\n");

        if (this.errors.length === 0) {
            console.log("✅ Published successfully.\n");
        } else {
            console.log("⚠️  Published with errors.\n");
        }

        console.log(`Copied (${this.copied.length}):`);
        // Limit printing if too many files, print folders mainly if we track them.
        // For simplicity, we will just print the first 20 and a summary if there are many.
        const copyToPrint = this.copied.slice(0, 20);
        copyToPrint.forEach(item => console.log(`  - ${item}`));
        if (this.copied.length > 20) {
            console.log(`  ... and ${this.copied.length - 20} more files.`);
        }
        console.log("");

        console.log(`Skipped (${this.skipped.length}):`);
        const skipToPrint = this.skipped.slice(0, 20);
        skipToPrint.forEach(item => console.log(`  - ${item}`));
        if (this.skipped.length > 20) {
            console.log(`  ... and ${this.skipped.length - 20} more items.`);
        }
        console.log("");

        if (this.errors.length > 0) {
            console.log(`Errors (${this.errors.length}):`);
            this.errors.forEach(item => console.log(`  - ${item}`));
            console.log("");
        }
    }
}

module.exports = PublishReport;
