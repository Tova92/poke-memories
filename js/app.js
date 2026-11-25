import { state, elements } from "./state.js";
import {
    activateAccountMode,
    activateLocalMode,
    getLocalData,
    saveCollection
} from "./dataStore.js";
import {
    login,
    logout,
    getCurrentSession,
    listenAuthChanges
} from "./account.js";
import {
    loadCatalog,
    loadCatalogIndex,
    loadItemData,
    validateItemData
} from "./data.js";
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

function renderAccountStatus()
{
    const label = document.getElementById("accountModeLabel");
    const description = document.getElementById("accountModeDescription");
    const action = document.getElementById("accountAction");

    if (state.mode === "local")
    {
        label.textContent = "Modalità locale";
        description.textContent = "Dati salvati su questo dispositivo";
        action.textContent = "Accedi";
        action.disabled = false;
    }
    else if (state.mode === "account")
    {
        label.textContent = "Account connesso";
        description.textContent = state.user?.email || "Collezione sincronizzata online";
        action.textContent = "Esci";
        action.disabled = false;
    }
    else if (state.mode === "loading")
    {
        label.textContent = "Verifica account...";
        description.textContent = "Controllo della sessione";
        action.textContent = "Attendi";
        action.disabled = true;
    }
    else
    {
        label.textContent = "Errore account";
        description.textContent = "Impossibile verificare o caricare i dati online";
        action.textContent = state.user ? "Esci" : "Riprova";
        action.disabled = false;
    }
}

async function applySession(session)
{
    if (!session?.user)
    {
        activateLocalMode();
        renderAccountStatus();
        return;
    }

    try
    {
        const exists = await activateAccountMode(session.user);

        if (!exists)
        {
            const localData = getLocalData();

            const importLocal = confirm(
                "Questo account non ha ancora una collezione online.\n\n" +
                "Vuoi importare i dati salvati su questo dispositivo?\n\n" +
                "OK: importa la collezione locale.\n" +
                "Annulla: inizia con una collezione vuota."
            );

            if (importLocal)
            {
                state.owned = localData.owned;
                state.favorites = localData.favorites;
            }

            await saveCollection();
        }
    }
    catch (error)
    {
        console.error("Errore durante il caricamento dei dati online:", error);

        state.mode = "error";
        state.user = session.user;
        state.owned = [];
        state.favorites = [];

        alert("Impossibile caricare o salvare la collezione online. Controlla la connessione e riprova.");
    }

    renderAccountStatus();
}

async function openItem(id, addHistory = true)
{
    if (addHistory)
    {
        window.history.pushState({ view: "item", id }, "");
    }

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
    document.getElementById("backHome").addEventListener("click", () =>
    {
        window.history.back();
    });

    window.addEventListener("popstate", event =>
    {
        if (event.state?.view === "item")
        {
            openItem(event.state.id, false);
        }
        else if (!elements.itemView.hidden)
        {
            goHome();
        }
    });
    
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

function setupAccountEvents()
{
    const accountAction = document.getElementById("accountAction");
    const accountLogin = document.getElementById("accountLogin");
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const cancelLogin = document.getElementById("cancelLogin");

    accountAction.addEventListener("click", async () =>
    {
        if (state.mode === "local")
        {
            accountLogin.hidden = false;
            loginError.hidden = true;
            loginEmail.focus();
            return;
        }

        if (state.mode === "account" || state.user)
        {
            try
            {
                await logout();
            }
            catch (error)
            {
                console.error("Errore durante la disconnessione:", error);
                alert("Impossibile disconnettersi. Controlla la connessione e riprova.");
            }

            return;
        }

        try
        {
            const session = await getCurrentSession();
            await applySession(session);

            if (elements.itemView.hidden)
            {
                showHome();
            }
            else
            {
                renderCards(openModal);
            }
        }
        catch (error)
        {
            console.error("Errore durante il recupero della sessione:", error);

            state.mode = "error";
            renderAccountStatus();

            alert("Impossibile verificare la sessione. Ricarica la pagina e riprova.");
        }
    });

    cancelLogin.addEventListener("click", () =>
    {
        accountLogin.hidden = true;
        loginForm.reset();
        loginError.hidden = true;
    });

    loginForm.addEventListener("submit", async event =>
    {
        event.preventDefault();
        loginError.hidden = true;

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try
        {
            await login(loginEmail.value.trim(), loginPassword.value);

            loginForm.reset();
            accountLogin.hidden = true;
        }
        catch (error)
        {
            console.error("Errore durante l'accesso:", error);

            loginError.textContent =
                "Email o password non corretti, oppure accesso non disponibile.";

            loginError.hidden = false;
        }
        finally
        {
            submitButton.disabled = false;
        }
    });
}

async function startApp()
{
    window.history.replaceState({ view: "home" }, "");

    state.mode = "loading";
    renderAccountStatus();

    setupEvents();
    setupAccountEvents();

    try
    {
        const session = await getCurrentSession();
        await applySession(session);
    }
    catch (error)
    {
        console.error("Errore durante il recupero della sessione:", error);

        state.mode = "error";
        state.user = null;
        state.owned = [];
        state.favorites = [];

        renderAccountStatus();

        alert("Impossibile verificare la sessione. Ricarica la pagina e riprova.");
    }

    listenAuthChanges((event, session) =>
    {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT")
        {
            return;
        }

        queueMicrotask(async () =>
        {
            await applySession(session);

            document.getElementById("accountLogin").hidden = true;
            document.getElementById("loginForm").reset();

            if (elements.itemView.hidden)
            {
                showHome();
            }
            else
            {
                renderCards(openModal);
            }
        });
    });

    try
    {
        state.series = await loadCatalog();
        await loadCatalogIndex();
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
