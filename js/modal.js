import { state, elements } from "./state.js";
import { saveCollection } from "./dataStore.js";
import { setCardImage } from "./images.js";
import { renderCards } from "./collection.js";

export function updateModal()
{
    const card = state.cards.find(item => item.id === state.currentCardId);

    if (!card)
    {
        return;
    }

    const isOwned = state.owned.includes(card.id);

    if (!isOwned)
    {
        state.revealCard = false;
    }

    setCardImage(elements.modalImage, card, "eager");
    elements.modalImage.classList.toggle("owned", isOwned && !state.revealCard);

    elements.toggleVisibility.classList.toggle("visible", isOwned);
    elements.toggleVisibility.textContent = state.revealCard
        ? "👁 Nascondi colori"
        : "👁 Mostra a colori";

    elements.modalName.textContent = card.name;
    elements.modalNumber.textContent = `Carta #${card.number}`;
    elements.toggleStatus.textContent = isOwned
        ? "Rimuovi dai posseduti"
        : "Segna come acquisita";
    elements.toggleStatus.classList.toggle("owned", isOwned);
}

export function openModal(id)
{
    state.currentCardId = id;
    state.revealCard = false;
    updateModal();

    elements.modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

export function closeModal()
{
    elements.modal.classList.remove("open");
    document.body.style.overflow = "";

    state.currentCardId = null;
    state.revealCard = false;
}

export async function toggleCard()
{
    const id = state.currentCardId;

    if (!id)
    {
        return;
    }

    const previousOwned = [...state.owned];

    if (state.owned.includes(id))
    {
        state.owned = state.owned.filter(item => item !== id);
    }
    else
    {
        state.owned.push(id);
    }

    state.revealCard = false;

    try
    {
        await saveCollection();
    }
    catch (error)
    {
        console.error("Errore durante il salvataggio della collezione:", error);
        state.owned = previousOwned;
        alert("Impossibile salvare la collezione. Controlla la connessione e riprova.");
    }

    renderCards(openModal);
    updateModal();
}

export function navigateModal(direction)
{
    const position = state.cards.findIndex(item => item.id === state.currentCardId);

    if (position === -1 || state.cards.length === 0)
    {
        return;
    }

    const nextPosition = (position + direction + state.cards.length) % state.cards.length;
    state.currentCardId = state.cards[nextPosition].id;
    state.revealCard = false;
    updateModal();
}

export function toggleVisibility()
{
    state.revealCard = !state.revealCard;
    updateModal();
}
