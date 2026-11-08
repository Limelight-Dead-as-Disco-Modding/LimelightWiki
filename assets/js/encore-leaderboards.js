"use strict";

const boardSelect = document.getElementById("board-scope");
const refresh = document.getElementById("board-refresh");
const status = document.getElementById("board-status");
const table = document.getElementById("board-table");
const scores = document.getElementById("board-scores");
const updated = document.getElementById("board-updated");
const endpoint = "https://encore-leaderboard.encore-leaderboard.workers.dev/v1/encore/leaderboard";
const scopes = {
    playtest: { rulesetId: "encore-v2", gameBuildId: "CL-35029" },
    current: { rulesetId: "encore-v2", gameBuildId: "CL-34941" },
    legacy: { rulesetId: "encore-v1", gameBuildId: "CL-34094" }
};
const steamAvatar = /^https:\/\/(?:avatars\.(?:(?:akamai|cloudflare|fastly)\.)?steamstatic\.com\/|steamcdn-a\.akamaihd\.net\/steamcommunity\/public\/images\/avatars\/[a-f0-9]{2}\/)[a-f0-9]{40}(?:_medium|_full)?\.jpg$/i;
const numberFormat = new Intl.NumberFormat();
let request;

function createCell(row, value, className = "") {
    const cell = row.insertCell();
    cell.textContent = value;
    cell.className = className;
    return cell;
}

function validScore(entry) {
    return entry && typeof entry.displayName === "string"
        && entry.displayName.trim().length > 0 && entry.displayName.length <= 64
        && Number.isSafeInteger(entry.roundsCompleted) && entry.roundsCompleted >= 0;
}

function playerBadge(entry) {
    const badge = document.createElement("span");
    badge.className = "board-avatar";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = Array.from(entry.displayName.trim())[0].toUpperCase();

    if (typeof entry.avatarUrl === "string" && steamAvatar.test(entry.avatarUrl)) {
        const image = document.createElement("img");
        image.alt = "";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.addEventListener("error", () => image.remove(), { once: true });
        image.src = entry.avatarUrl;
        badge.append(image);
    }
    return badge;
}

function renderScores(entries) {
    const rows = document.createDocumentFragment();
    for (const [index, entry] of entries.entries()) {
        const row = document.createElement("tr");
        createCell(row, String(index + 1), "board-rank");
        const player = createCell(row, "", "board-player");
        const name = document.createElement("span");
        name.textContent = entry.displayName;
        player.append(playerBadge(entry), name);
        createCell(row, numberFormat.format(entry.roundsCompleted), "board-rounds");
        rows.append(row);
    }
    scores.replaceChildren(rows);
    table.hidden = entries.length === 0;
}

async function loadBoard() {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    const scope = scopes[boardSelect.value];
    const query = new URLSearchParams(scope);
    const timeout = setTimeout(() => controller.abort(), 8000);

    status.textContent = "Loading scores…";
    updated.textContent = "";
    table.hidden = true;
    refresh.disabled = true;

    try {
        const response = await fetch(`${endpoint}?${query}`, {
            cache: "no-store",
            credentials: "omit",
            signal: controller.signal
        });
        if (!response.ok) throw new Error("Score request failed");
        const board = await response.json();
        if (request !== controller) return;
        if (board?.schemaVersion !== 1 || board.verification !== "self_reported"
            || board.rulesetId !== scope.rulesetId || board.gameBuildId !== scope.gameBuildId
            || !Array.isArray(board.entries) || board.entries.length > 100
            || !board.entries.every(validScore)) {
            throw new Error("Unexpected score response");
        }

        renderScores(board.entries);
        const count = board.entries.length;
        status.textContent = count === 0 ? "No scores on this board yet."
            : `${count} ${count === 1 ? "player" : "players"} ranked`;
        const generatedAt = new Date(board.generatedAtUtc);
        if (typeof board.generatedAtUtc === "string" && Number.isFinite(generatedAt.getTime())) {
            const format = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
            updated.textContent = `Fetched ${format.format(generatedAt)}`;
        }
    } catch {
        if (request !== controller) return;
        scores.replaceChildren();
        status.textContent = "Scores are unavailable right now. Try Refresh to reconnect.";
    } finally {
        clearTimeout(timeout);
        if (request === controller) refresh.disabled = false;
    }
}

boardSelect.addEventListener("change", loadBoard);
refresh.addEventListener("click", loadBoard);
const requestedBoard = new URLSearchParams(location.search).get("board");
if (Object.hasOwn(scopes, requestedBoard)) {
    boardSelect.value = requestedBoard;
}
loadBoard();
