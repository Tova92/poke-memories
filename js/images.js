function createPlaceholder(message, variant)
{
    const palette = variant === "error"
        ? { background: "#3b202b", border: "#d97883", accent: "#f0a0a8" }
        : { background: "#29243a", border: "#776b91", accent: "#c9a7ff" };

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 880">
            <rect width="630" height="880" rx="28" fill="${palette.background}" />
            <rect x="22" y="22" width="586" height="836" rx="22" fill="none" stroke="${palette.border}" stroke-width="5" stroke-dasharray="14 12" />
            <rect x="245" y="270" width="140" height="190" rx="18" fill="none" stroke="${palette.accent}" stroke-width="12" />
            <path d="M275 405 L315 355 L345 390 L365 365" fill="none" stroke="${palette.accent}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="350" cy="315" r="13" fill="${palette.accent}" />
            <text x="315" y="535" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="29" text-anchor="middle">${message}</text>
        </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const missingImage = createPlaceholder("Immagine da aggiungere", "missing");
const brokenImage = createPlaceholder("Immagine non disponibile", "error");

export function setCardImage(imageElement, card, loading = "lazy")
{
    imageElement.alt = card.name;
    imageElement.loading = loading;
    imageElement.onerror = null;

    if (card.image === null)
    {
        imageElement.src = missingImage;
        imageElement.dataset.placeholder = "missing";
        return;
    }

    imageElement.dataset.placeholder = "";
    imageElement.onerror = () =>
    {
        imageElement.onerror = null;
        imageElement.src = brokenImage;
        imageElement.dataset.placeholder = "error";
    };

    imageElement.src = card.image;
}
