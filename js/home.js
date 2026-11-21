import { state, elements } from "./state.js";
import { FAVORITES_KEY, saveStorage } from "./storage.js";
import { getItemMetadata, getTotalCardCount } from "./data.js";

const expandedCategories = new Set();

function closeCategoryTree(category)
{
    expandedCategories.delete(category.id);

    category.items.forEach(item =>
    {
        if (typeof item === "object")
        {
            closeCategoryTree(item);
        }
    });
}

export function renderHome(openItem)
{
    renderFavorites(openItem);

    const container = elements.seriesList;
    container.innerHTML = "";

    state.series.forEach(category =>
    {
        renderCategory(category, container, openItem, 0, state.series);
    });
}

function renderCategory(category, container, openItem, level = 0, siblings = [])
{
    const wrapper = document.createElement("div");
    wrapper.className = `category category-level-${level}`;
    wrapper.classList.toggle(
        "expanded",
        expandedCategories.has(category.id)
    );
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
            closeCategoryTree(category);
        }
        else
        {
            siblings.forEach(sibling =>
            {
                if (sibling.id !== category.id)
                {
                    closeCategoryTree(sibling);
                }
            });
    
            expandedCategories.add(category.id);
        }
    
        renderHome(openItem);
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
            renderCategory(
                item,
                nestedContainer,
                openItem,
                level + 1,
                nestedCategories
            );
        });

        content.appendChild(nestedContainer);
    }

    if (itemIds.length)
    {
        const itemsContainer = document.createElement("div");
        itemsContainer.className = "series-items series-items-full";

        itemIds.forEach(id =>
        {
            const metadata = getItemMetadata(id);
            const total = getTotalCardCount(id);

            const owned = state.owned.filter(cardId =>
                typeof cardId === "string" &&
                cardId.startsWith(`${id}-`)
            ).length;

            const percentage = total > 0
                ? Math.min(100, owned / total * 100)
                : 0;

            const wrapper = document.createElement("div");
            wrapper.className = "series-item";

            const button = document.createElement("button");
            button.className = "series-item-open";
            button.style.setProperty("--progress", `${percentage}%`);
            button.addEventListener("click", () => openItem(id));

            if (metadata?.logo)
            {
                const logo = document.createElement("img");
                logo.className = "series-item-logo";
                logo.src = metadata.logo;
                logo.alt = "";
                logo.loading = "lazy";

                button.appendChild(logo);
            }

            const details = document.createElement("div");
            details.className = "series-item-details";

            const name = document.createElement("span");
            name.className = "series-item-name";
            name.textContent = metadata?.name || id;

            const count = document.createElement("span");
            count.className = "series-item-count";
            count.textContent = total > 0
                ? `${owned} / ${total}`
                : `${owned} / —`;

            details.append(name, count);
            button.appendChild(details);

            const star = document.createElement("button");
            star.className = "series-item-favorite";

            const isFavorite = state.favorites.includes(id);

            star.textContent = isFavorite ? "★" : "☆";
            star.setAttribute("aria-label", isFavorite
                ? `Rimuovi ${id} dai preferiti`
                : `Aggiungi ${id} ai preferiti`);
            star.setAttribute("aria-pressed", isFavorite);

            star.addEventListener("click", () =>
            {
                toggleFavorite(id, openItem);
            });

            wrapper.append(button, star);
            itemsContainer.appendChild(wrapper);
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
