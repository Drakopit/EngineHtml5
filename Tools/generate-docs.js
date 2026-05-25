const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIRECTORY = path.join(ROOT, "Docs", "Helper");
const MODULES = [
    {
        name: "CoreCross",
        summary: "Shared bootstrap, input, assets, math, components and utility APIs.",
    },
    {
        name: "Core2D",
        summary: "Canvas rendering, collisions, gameplay objects and canvas UI APIs.",
    },
    {
        name: "Core3D",
        summary: "Render3D scenes, cameras, materials, physics, models and compatibility APIs.",
    },
    {
        name: "CoreNetwork",
        summary: "Transport adapters and lightweight reusable online gameplay helpers.",
    },
];

function read(file) {
    return fs.readFileSync(file, "utf8");
}

function normalizeFile(file) {
    return path.normalize(file);
}

function sourceLink(file) {
    return `../../${path.relative(ROOT, file).replaceAll(path.sep, "/")}`;
}

function parseBarrel(file, visited = new Set()) {
    const normalized = normalizeFile(file);
    if (visited.has(normalized)) return [];
    visited.add(normalized);

    const source = read(normalized);
    const entries = [];
    const exportPattern = /export\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];?/g;
    const allPattern = /export\s+\*\s+from\s+["']([^"']+)["'];?/g;

    for (const match of source.matchAll(exportPattern)) {
        const target = path.resolve(path.dirname(normalized), match[2]);
        const items = match[1]
            .split(",")
            .map(item => item.replace(/\/\/.*$/gm, "").trim())
            .filter(Boolean);

        for (const item of items) {
            const [sourceName, publicName = sourceName] = item.split(/\s+as\s+/).map(name => name.trim());
            if (path.basename(target) === "index.js") {
                const nested = parseBarrel(target, new Set(visited));
                const resolved = nested.find(entry => entry.name === sourceName);
                if (resolved) entries.push({ ...resolved, name: publicName });
                continue;
            }
            entries.push({ name: publicName, declarationName: sourceName, file: target });
        }
    }

    for (const match of source.matchAll(allPattern)) {
        const target = path.resolve(path.dirname(normalized), match[1]);
        entries.push(...parseBarrel(target, new Set(visited)));
    }

    const byName = new Map();
    entries.forEach(entry => byName.set(entry.name, entry));
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function cleanDoc(raw) {
    return raw
        .split("\n")
        .map(line => line.replace(/^\s*\*\s?/, "").trim());
}

function parseDoc(raw) {
    if (!raw) return null;

    const lines = cleanDoc(raw);
    const description = [];
    const params = [];
    let returns = "";
    let deprecated = "";
    let example = "";
    let current = "description";

    for (const line of lines) {
        if (line.startsWith("@param ")) {
            const match = line.match(/^@param\s+\{([^}]+)\}\s+(\[[^\]]+\]|\S+)\s*(?:-\s*)?(.*)$/);
            if (match) params.push({ type: match[1], name: match[2], description: match[3] });
            current = "";
            continue;
        }
        if (line.startsWith("@returns ") || line.startsWith("@return ")) {
            const match = line.match(/^@returns?\s+\{([^}]+)\}\s*(?:-\s*)?(.*)$/);
            if (match) returns = `\`${match[1]}\`${match[2] ? ` - ${match[2]}` : ""}`;
            current = "";
            continue;
        }
        if (line.startsWith("@deprecated")) {
            deprecated = line.replace("@deprecated", "").trim() || "Deprecated.";
            current = "";
            continue;
        }
        if (line.startsWith("@example")) {
            current = "example";
            continue;
        }
        if (line.startsWith("@summary ") || line.startsWith("@description ")) {
            description.push(line.replace(/^@(summary|description)\s+/, ""));
            current = "description";
            continue;
        }
        if (line.startsWith("@")) {
            current = "";
            continue;
        }
        if (current === "description" && line) description.push(line);
        if (current === "example") example += `${line}\n`;
    }

    return {
        description: description.join(" ").replace(/\s+/g, " ").trim(),
        params,
        returns,
        deprecated,
        example: example.trim(),
    };
}

function findDeclaration(entry) {
    const source = read(entry.file);
    const name = entry.declarationName ?? entry.name;
    const pattern = new RegExp(
        String.raw`(?:\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*)?export\s+(class|(?:async\s+)?function|const)\s+${name}\b`,
    );
    const match = source.match(pattern);
    return {
        ...entry,
        kind: match?.[2]?.replace("async ", "") ?? "export",
        doc: parseDoc(match?.[1]),
        members: findDocumentedMembers(source),
    };
}

function findDocumentedMembers(source) {
    const pattern = /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*((?:static\s+)?[A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
    const members = [];
    for (const match of source.matchAll(pattern)) {
        const name = match[2].trim();
        if (name === "constructor") continue;
        const doc = parseDoc(match[1]);
        if (doc?.description || doc?.params.length || doc?.returns || doc?.deprecated) {
            members.push({ name, doc });
        }
    }
    return members;
}

function escapeCell(value) {
    return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderParams(params) {
    if (!params?.length) return "";
    const rows = params
        .map(param => `| \`${escapeCell(param.name)}\` | \`${escapeCell(param.type)}\` | ${escapeCell(param.description)} |`)
        .join("\n");
    return `\n**Parameters**\n\n| Name | Type | Description |\n| --- | --- | --- |\n${rows}\n`;
}

function renderSymbol(symbol) {
    const summary = symbol.doc?.description
        || (symbol.doc?.deprecated ? "Deprecated compatibility API." : "Public export. Detailed JSDoc has not been added yet.");
    const output = [
        `## ${symbol.name}`,
        "",
        `\`${symbol.kind}\` from [\`${path.relative(ROOT, symbol.file).replaceAll(path.sep, "/")}\`](${sourceLink(symbol.file)})`,
        "",
        summary,
    ];

    if (symbol.doc?.deprecated) {
        output.push("", `> Deprecated: ${symbol.doc.deprecated}`);
    }
    if (symbol.doc?.params?.length) output.push(renderParams(symbol.doc.params).trimEnd());
    if (symbol.doc?.returns) output.push("", `**Returns:** ${symbol.doc.returns}`);
    if (symbol.doc?.example) output.push("", "**Example**", "", "```js", symbol.doc.example, "```");

    if (symbol.members.length) {
        output.push("", "### Documented Methods", "");
        symbol.members.forEach(member => {
            output.push(`#### \`${member.name}()\``, "", member.doc.description || "Documented method.");
            if (member.doc.params.length) output.push(renderParams(member.doc.params).trimEnd());
            if (member.doc.returns) output.push("", `**Returns:** ${member.doc.returns}`);
        });
    }
    return output.join("\n");
}

function generateModule(module) {
    const barrel = path.join(ROOT, module.name, "index.js");
    const symbols = parseBarrel(barrel).map(findDeclaration);
    const documented = symbols.filter(symbol => symbol.doc?.description || symbol.doc?.deprecated).length;
    const rows = symbols
        .map(symbol => `| [\`${symbol.name}\`](#${symbol.name.toLowerCase()}) | \`${symbol.kind}\` | ${escapeCell(symbol.doc?.description || (symbol.doc?.deprecated ? "Deprecated compatibility API." : "JSDoc pending."))} |`)
        .join("\n");
    const content = [
        `# ${module.name} API`,
        "",
        "<!-- Generated by Tools/generate-docs.js. Edit source JSDoc, then run npm run docs. -->",
        "",
        module.summary,
        "",
        `Documented exports: **${documented}/${symbols.length}**.`,
        "",
        "| Symbol | Kind | Summary |",
        "| --- | --- | --- |",
        rows,
        ...symbols.flatMap(symbol => ["", renderSymbol(symbol)]),
        "",
    ].join("\n");

    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `${module.name}.md`), content);
    return { module, symbols, documented };
}

function generateIndex(results) {
    const rows = results
        .map(result => `| [${result.module.name}](./${result.module.name}.md) | ${result.module.summary} | ${result.documented}/${result.symbols.length} |`)
        .join("\n");
    const content = `# GameForgeJS API Reference

<!-- Generated by Tools/generate-docs.js. Edit source JSDoc, then run npm run docs. -->

This is the generated API reference for the public GameForgeJS modules. The documentation source is the JSDoc placed beside each exported class or function in the engine.

Regenerate after changing public APIs or JSDoc:

\`\`\`sh
npm run docs
\`\`\`

| Module | Purpose | Documented Exports |
| --- | --- | --- |
${rows}

## Guides

Human-written tutorials and architecture explanations start at [Docs Home](../index.md).
`;
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, "index.md"), content);
}

fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
const results = MODULES.map(generateModule);
generateIndex(results);

const documented = results.reduce((total, result) => total + result.documented, 0);
const exportsCount = results.reduce((total, result) => total + result.symbols.length, 0);
console.log(`Generated Docs/Helper reference: ${documented}/${exportsCount} public exports documented.`);
