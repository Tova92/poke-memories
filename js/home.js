import { state, elements } from "./state.js";
import { FAVORITES_KEY, saveStorage } from "./storage.js";

const expandedCategories = new Set();

export function renderHome(openItem)
{
    renderFavorites(openItem);

    const container = elements.seriesList;
    container.innerHTML = "";

    state.series.forEach(category =>
    {
        renderCategory(category, container, openItem, true);
    });
}


function renderCategory(category, container, openItem, level = 0)
{
    const wrapper = document.createElement("div");
    wrapper.className = `category category-level-${level}`;

    const header = document.createElement("button");
    header.className = level === 0
        ? "category-header"
        : "subcategory-header";

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = category.name;

    header.appendChild(name);

    const content = document.createElement("div");
    content.className = `category-content category-content-level-${level}`;
    content.hidden = !expandedCategories.has(category.id);

    header.addEventListener("click", () =>
    {
        if (expandedCategories.has(category.id))
        {
            expandedCategories.delete(category.id);
        }
        else
        {
            expandedCategories.add(category.id);
        }

        content.hidden = !expandedCategories.has(category.id);
    });

    const nestedCategories = category.items.filter(item =>
        typeof item === "object"
    );

    const itemIds = category.items.filter(item =>
        typeof item === "string"
    );

    if (nestedCategories.length)
    {
        const nestedContainer = document.createElement("div");
        nestedContainer.className = "subcategory-list";

        nestedCategories.forEach(item =>
        {
            renderCategory(item, nestedContainer, openItem, level + 1);
        });

        content.appendChild(nestedContainer);
    }

    if (itemIds.length)
    {
        const itemsContainer = document.createElement("div");
        itemsContainer.className = "series-items series-items-full";

        itemIds.forEach(id =>
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

        content.appendChild(itemsContainer);
    }

    wrapper.append(header, content);
    container.appendChild(wrapper);
}

function getAllItemIds(categories)
{
    const ids = [];

    categories.forEach(category =>
    {
        category.items.forEach(item =>
        {
            if (typeof item === "string")
            {
                ids.push(item);
            }
            else
            {
                ids.push(...getAllItemIds([item]));
            }
        });
    });

    return ids;
}

function renderFavorites(openItem)
{
    const container = elements.favorites;
    container.innerHTML = "";

    const favoriteItems = getAllItemIds(state.series)
        .filter(id => state.favorites.includes(id));

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
