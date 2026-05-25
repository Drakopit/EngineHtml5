const demos = Object.freeze({
    advanced: {
        label: "Advanced Demo",
        description: "Plataforma/RPG 2D com fases data-driven, inventario, arvore de habilidades e manifests.",
        path: "../Demos/DemoAdvanced/mainAdvanced.js",
    },
    tactical: {
        label: "Tactical RPG",
        description: "Demo tatico inspirado em FFT/Dofus, com grid, AStar, area de movimento e batalha.",
        path: "../Demos/DemoTacticalRPG/mainTacticalRPG.js",
    },
    fighting2d: {
        label: "Fighting Game 2D",
        description: "Jogo de luta 2D com menu, selecao de personagem, arcade, versus e gamepad.",
        path: "../Demos/DemoFightingGame2D/mainFightingGame2D.js",
    },
    adventure2d: {
        label: "Adventure Component Demo",
        description: "Top-down adventure com entidades componentizadas e camera por salas com transicao suave.",
        path: "../Demos/DemoAdventure2D/mainAdventure2D.js",
    },
    demo3d: {
        label: "Demo 3D",
        description: "Cena WebGL para validar camera, modelos, shaders e renderizacao 3D.",
        path: "../Demos/Demo3D/mainDemo3D.js",
    },
    solar3d: {
        label: "Sistema Solar 3D",
        description: "Demo Render3D com shader procedural de planetas, luz solar e orbitas.",
        path: "../Demos/DemoSolarSystem/mainSolarSystem.js",
    },
    mini3d: {
        label: "MiniGame 3D",
        description: "Sky Trail 3D com plataformas moveis, desafio temporizado, moedas, bandeira e skybox.",
        path: "../Demos/DemoMiniGame3D/mainMiniGame3D.js",
    },
    online: {
        label: "Online MMO Demo",
        description: "Sandbox 2D online com sala local entre abas, players sincronizados e chat em UI da engine.",
        path: "../Demos/DemoOnlineMMO/mainOnlineMMO.js",
    },
    immature: {
        label: "Immature Demo",
        description: "Demo simples de movimentacao, colisao e coleta para exemplos basicos.",
        path: "../Demos/Demo/mainImmature.js",
    },
});

const aliases = Object.freeze({
    fighting: "fighting2d",
    adventure: "adventure2d",
    zelda: "adventure2d",
    solar: "solar3d",
    mmo: "online",
    terraria: "online",
});

const params = new URLSearchParams(window.location.search);
const requestedDemo = params.get("demo");
const selectedDemo = aliases[requestedDemo] ?? requestedDemo;

if (!selectedDemo || selectedDemo === "admin") {
    renderAdminMode();
} else {
    launchDemo(selectedDemo);
}

function launchDemo(demoId) {
    const demo = demos[demoId];

    if (!demo) {
        renderAdminMode(`Demo '${demoId}' nao encontrada.`);
        return;
    }

    import(demo.path).catch(error => {
        console.error(`GameForgeJS: failed to load demo '${demoId}'.`, error);
        renderAdminMode(`Falha ao carregar '${demo.label}'. Veja o console.`);
    });
}

function renderAdminMode(message = "") {
    document.title = "GameForgeJS - Admin";
    document.body.classList.add("admin-mode");
    document.body.innerHTML = `
        <main class="admin-shell">
            <section class="admin-hero">
                <div>
                    <p class="admin-kicker">GameForgeJS Admin</p>
                    <h1>Escolha uma demo</h1>
                    <p class="admin-copy">Use esta tela para validar demos sem alterar codigo. Links diretos com <code>?demo=advanced</code> continuam funcionando.</p>
                </div>
            </section>
            ${message ? `<p class="admin-message">${escapeHtml(message)}</p>` : ""}
            <section class="admin-grid">
                ${Object.entries(demos).map(([id, demo]) => demoCard(id, demo)).join("")}
            </section>
        </main>
    `;
}

function demoCard(id, demo) {
    return `
        <article class="admin-card">
            <h2>${escapeHtml(demo.label)}</h2>
            <p>${escapeHtml(demo.description)}</p>
            <a href="Main.html?demo=${encodeURIComponent(id)}">Rodar demo</a>
        </article>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
