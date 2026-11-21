import { state, elements } from "./state.js";
import { setCardImage } from "./images.js";
import { getTotalCardCount } from "./data.js";

export function updateProgress()
{
    const id = state.currentItem.id;
    const total = getTotalCardCount(id);
    const acquired = state.owned.filter(cardId =>
        typeof cardId === "string" &&
        cardId.startsWith(`${id}-`)
    ).length;
    const percentage = total ? Math.round(acquired / total * 100) : 0;

    document.getElementById("count").textContent = `${acquired} / ${total}`;
    document.getElementById("percentage").textContent = `${percentage}%`;
    document.getElementById("bar").style.width = `${percentage}%`;
    document.getElementById("bar").offsetWidth;
    document.getElementById("bar").style.transition = "";
}

export function renderCards(openModal)
{
    const query = elements.search.value.toLowerCase().trim();

    const filtered = state.cards.filter(card =>
    {
        const isOwned = state.owned.includes(card.id);
        const matchesFilter =
            state.currentFilter === "all" ||
            (state.currentFilter === "owned" && isOwned) ||
            (state.currentFilter === "missing" && !isOwned);
        const matchesSearch =
            card.name.toLowerCase().includes(query) ||
            card.number.toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
    });

    elements.grid.innerHTML = "";

    if (!filtered.length)
    {
        elements.grid.innerHTML = '<div class="empty">Nessuna carta trovata.</div>';
        updateProgress();
        return;
    }

    const sections = new Map();

    filtered.forEach(card =>
    {
        const section = card.section || "Altre carte";

        if (!sections.has(section))
        {
            sections.set(section, []);
        }

        sections.get(section).push(card);
    });

    sections.forEach((sectionCards, sectionName) =>
    {
        const title = document.createElement("h2");
        title.className = "section-title";
        title.textContent = sectionName;
        elements.grid.appendChild(title);

        sectionCards.forEach(card =>
        {
            const isOwned = state.owned.includes(card.id);
            const element = document.createElement("div");
            element.className = `card ${isOwned ? "owned" : ""}`;

            const imageContainer = document.createElement("div");
            imageContainer.className = "card-image";

            const image = document.createElement("img");
            setCardImage(image, card);
            imageContainer.appendChild(image);

            const name = document.createElement("div");
            name.className = "card-name";
            name.textContent = card.name;

            const number = document.createElement("div");
            number.className = "card-number";
            number.textContent = `#${card.number}`;

            const status = document.createElement("div");
            status.className = "card-status";
            status.textContent = isOwned ? "✓ Acquisita" : "○ Mancante";

            element.append(imageContainer, name, number, status);
            element.addEventListener("click", () => openModal(card.id));
            elements.grid.appendChild(element);
        });
    });

    updateProgress();
}
