import { OWNED_KEY, FAVORITES_KEY, loadStorage } from "./storage.js";

export const DATA_PATH = "./data/";

export const state = {
    series: [],
    currentItem: null,
    cards: [],
    owned: loadStorage(OWNED_KEY),
    favorites: loadStorage(FAVORITES_KEY),
    currentFilter: "all",
    currentCardId: null,
    revealCard: false
};

export const elements = {
    homeView: document.getElementById("homeView"),
    itemView: document.getElementById("itemView"),
    grid: document.getElementById("grid"),
    search: document.getElementById("search"),
    modal: document.getElementById("modal"),
    seriesList: document.getElementById("seriesList"),
    favorites: document.getElementById("favorites"),
    itemTitle: document.getElementById("itemTitle"),
    modalImage: document.getElementById("modalImage"),
    toggleVisibility: document.getElementById("toggleVisibility"),
    modalName: document.getElementById("modalName"),
    modalNumber: document.getElementById("modalNumber"),
    toggleStatus: document.getElementById("toggleStatus")
};
