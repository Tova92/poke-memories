import { state, elements } from "./state.js";
import { loadCatalog, loadItemData, validateItemData } from "./data.js";
import { renderHome } from "./home.js";
import { renderCards } from "./collection.js";
import {
    openModal,
    closeModal,
    toggleCard,
    navigateModal,
    toggleVisibility
} from "./modal.js";

let homeScrollPosition = 0;

function showHome()
{
    renderHome(openItem);
}

async function openItem(id)
{
    homeScrollPosition = window.scrollY;
    
    elements.grid.innerHTML = '<div class="empty">Caricamento delle carte...</div>';
    elements.homeView.hidden = true;
    elements.itemView.hidden = false;
    elements.itemTitle.textContent = id;

    try
    {
        const data = await loadItemData(id);
        state.currentItem = validateItemData(data);
        state.cards = data.cards;

        elements.itemTitle.textContent = state.currentItem.name;
        state.owned = state.owned.filter(value => typeof value === "string");
        state.currentFilter = "all";
        elements.search.value = "";

        document.querySelectorAll(".filters button").forEach(button =>
        {
            button.classList.toggle("active", button.dataset.filter === "all");
        });

        renderCards(openModal);
    }
    catch (error)
    {
        console.error(error);
        elements.grid.innerHTML =
            '<div class="empty">Impossibile caricare questo elemento. Controlla il relativo JSON.</div>';
    }
}

function goHome()
{
    closeModal();
    state.currentItem = null;
    state.cards = [];
    elements.itemView.hidden = true;
    elements.homeView.hidden = false;
    showHome();

    requestAnimationFrame(() =>
    {
        window.scrollTo(0, homeScrollPosition);
    });
}

function setupEvents()
{
    document.getElementById("backHome").addEventListener("click", goHome);

    document.querySelectorAll(".filters button").forEach(button =>
    {
        button.addEventListener("click", () =>
        {
            state.currentFilter = button.dataset.filter;
            document.querySelectorAll(".filters button")
                .forEach(item => item.classList.remove("active"));
            button.classList.add("active");
            renderCards(openModal);
        });
    });

    elements.search.addEventListener("input", () => renderCards(openModal));

    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("previousCard").addEventListener("click", () => navigateModal(-1));
    document.getElementById("nextCard").addEventListener("click", () => navigateModal(1));
    elements.toggleStatus.addEventListener("click", toggleCard);
    elements.toggleVisibility.addEventListener("click", toggleVisibility);

    elements.modal.addEventListener("click", event =>
    {
        if (event.target === elements.modal)
        {
            closeModal();
        }
    });

    document.addEventListener("keydown", event =>
    {
        if (!elements.modal.classList.contains("open"))
        {
            return;
        }

        if (event.key === "Escape")
        {
            closeModal();
        }
        else if (event.key === "ArrowLeft")
        {
            navigateModal(-1);
        }
        else if (event.key === "ArrowRight")
        {
            navigateModal(1);
        }
    });
}

async function startApp()
{
    setupEvents();

    try
    {
        state.series = await loadCatalog();
        showHome();
    }
    catch (error)
    {
        console.error(error);
        elements.seriesList.innerHTML =
            '<div class="empty">Impossibile caricare le serie. Controlla i percorsi dei JSON.</div>';
    }
}

startApp();
