import { state, elements } from "./state.js";
import { FAVORITES_KEY, saveStorage } from "./storage.js";

export function renderHome(openItem)
{
    renderFavorites(openItem);

    const container = elements.seriesList;
    container.innerHTML = "";

    state.series.forEach(currentSeries =>
    {
        const title = document.createElement("h3");
        title.className = "series-title";
        title.textContent = currentSeries.name;

        const itemsContainer = document.createElement("div");
        itemsContainer.className = "series-items";

        currentSeries.items.forEach(id =>
        {
            const button = document.createElement("button");
            button.className = "series-item";

            const itemName = document.createElement("span");
            itemName.textContent = id;

            const star = document.createElement("span");
            star.textContent = state.favorites.includes(id) ? "★" : "☆";
            star.style.color = "#c9a7ff";
            star.style.fontSize = "17px";

            button.append(itemName, star);
            button.addEventListener("click", () => openItem(id));
            itemsContainer.appendChild(button);
        });

        container.append(title, itemsContainer);
    });
}

function renderFavorites(openItem)
{
    const container = elements.favorites;
    container.innerHTML = "";

    const favoriteItems = [];

    state.series.forEach(currentSeries =>
    {
        currentSeries.items.forEach(id =>
        {
            if (state.favorites.includes(id))
            {
                favoriteItems.push(id);
            }
        });
    });

    if (!favoriteItems.length)
    {
        container.innerHTML =
            '<div class="empty">Non hai ancora selezionato preferiti.</div>';
        return;
    }

    favoriteItems.forEach(id =>
    {
        const wrapper = document.createElement("div");
        wrapper.className = "favorite-item";

        const button = document.createElement("button");
        button.className = "item-button";

        const name = document.createElement("span");
        name.textContent = id;
        button.appendChild(name);
        button.addEventListener("click", () => openItem(id));

        const star = document.createElement("button");
        star.className = "favorite-button active";
        star.textContent = "★";
        star.title = "Rimuovi dai preferiti";
        star.setAttribute("aria-label", `Rimuovi ${id} dai preferiti`);
        star.addEventListener("click", () => toggleFavorite(id, openItem));

        wrapper.append(button, star);
        container.appendChild(wrapper);
    });
}

export function toggleFavorite(id, openItem)
{
    if (state.favorites.includes(id))
    {
        state.favorites = state.favorites.filter(item => item !== id);
    }
    else
    {
        state.favorites.push(id);
    }

    saveStorage(FAVORITES_KEY, state.favorites);
    renderHome(openItem);
}
