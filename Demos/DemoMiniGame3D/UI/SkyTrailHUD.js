import { Input } from "../../../CoreCross/Input/Input.js";

export class SkyTrailHUD {
    Draw(level) {
        if (!level.ui || !level.playerModel) return;

        const draw = level.ui.Draw;
        const ctx = draw.screen.Context;
        const controllerConnected = Input.GetConnectedGamepadIndices().length > 0;
        const remainingCoins = level.goalCoins - level.collectedCoins;
        const altitude = Math.max(0, level.playerModel.transform.position[1]).toFixed(1);

        ctx.save();
        ctx.globalAlpha = 0.54;
        draw.Color = "#07172A";
        draw.DrawRect(12, 12, 316, 118);
        ctx.restore();

        draw.SetTextAlign("left");
        draw.Font = "Arial";
        draw.FontSize = "21px";
        draw.Color = "#FFD76A";
        draw.DrawText(`Moedas: ${level.collectedCoins}/${level.goalCoins}`, 22, 39);
        draw.Color = "#FFFFFF";
        draw.FontSize = "15px";
        draw.DrawText(`Score: ${level.score}   Quedas: ${level.falls}`, 22, 65);
        draw.FontSize = "13px";
        draw.Color = level.goalUnlocked ? "#8DFFB7" : "#FFE0A3";
        draw.DrawText(level.goalUnlocked ? "Bandeira liberada: alcance o topo!" : "Colete as moedas ate a bandeira.", 22, 89);
        draw.Color = controllerConnected ? "#8DFFB7" : "#DDE7FF";
        draw.DrawText(
            controllerConnected ? "Controle: conectado" : "Controle: pressione um botao para ativar",
            22,
            113,
        );

        ctx.save();
        ctx.globalAlpha = 0.5;
        draw.Color = "#07172A";
        draw.DrawRect(12, 418, 696, 49);
        ctx.restore();
        draw.Color = "#F3F7FF";
        draw.FontSize = "13px";
        draw.DrawText(`Altitude: ${altitude} m   Tempo: ${level.time.toFixed(1)} s`, 18, 439);
        draw.DrawText(level.goalUnlocked ? "CHEGADA ABERTA" : `CHEGADA BLOQUEADA   ${remainingCoins} MOEDAS RESTANTES`, 18, 458);

        if (level.gameState !== "WON") return;

        ctx.save();
        ctx.globalAlpha = 0.8;
        draw.Color = "#061325";
        draw.DrawRect(155, 168, 420, 132);
        ctx.restore();

        draw.SetTextAlign("center");
        draw.Color = "#FFD76A";
        draw.FontSize = "28px";
        draw.DrawText("Trilha concluida!", 365, 212);
        draw.Color = "#FFFFFF";
        draw.FontSize = "16px";
        draw.DrawText(`Score final: ${level.score}`, 365, 246);
        draw.FontSize = "14px";
        draw.DrawText("Uma nova trilha esta pronta.", 365, 274);
        draw.SetTextAlign("left");
    }
}
