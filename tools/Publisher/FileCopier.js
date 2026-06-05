const fs = require('fs');
const path = require('path');

class FileCopier {
    constructor(report, excludes = []) {
        this.report = report;
        this.excludes = excludes;
    }

    isExcluded(itemName) {
        for (const rule of this.excludes) {
            // Simple exact match or wildcard match for extensions like *.log
            if (rule.startsWith('*.')) {
                const ext = rule.slice(1);
                if (itemName.endsWith(ext)) {
                    return true;
                }
            } else if (itemName === rule) {
                return true;
            }
        }
        return false;
    }

    copyItem(source, destination, relativePathDisplay = "") {
        if (!fs.existsSync(source)) {
            this.report.recordError(source, "Source does not exist");
            return;
        }

        const itemName = path.basename(source);
        if (this.isExcluded(itemName)) {
            this.report.recordSkipped(relativePathDisplay || itemName, "Excluded by config");
            return;
        }

        const stat = fs.statSync(source);

        if (stat.isDirectory()) {
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }

            const children = fs.readdirSync(source);
            for (const child of children) {
                const childSource = path.join(source, child);
                const childDest = path.join(destination, child);
                const childDisplay = relativePathDisplay ? path.join(relativePathDisplay, child) : child;
                this.copyItem(childSource, childDest, childDisplay);
            }
        } else if (stat.isFile()) {
            try {
                // Ensure parent directory exists before copying file
                const parentDir = path.dirname(destination);
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }
                
                fs.copyFileSync(source, destination);
                this.report.recordCopied(relativePathDisplay || itemName, destination);
            } catch (err) {
                this.report.recordError(source, err.message);
            }
        }
    }

    cleanOutput(directory) {
        if (!fs.existsSync(directory)) return;

        const stat = fs.statSync(directory);
        if (stat.isDirectory()) {
            const files = fs.readdirSync(directory);
            for (const file of files) {
                const curPath = path.join(directory, file);
                if (fs.statSync(curPath).isDirectory()) {
                    this.cleanOutput(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            }
            fs.rmdirSync(directory);
        } else {
            fs.unlinkSync(directory);
        }
    }
}

module.exports = FileCopier;
