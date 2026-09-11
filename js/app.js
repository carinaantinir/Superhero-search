

window.addEventListener("load", () => {
    const HEROES_PER_PAGE = 20;
    const ACCESS_TOKEN ="849c9ed4a4f7b944acf877b64c8cd9f0";

    // ==========================
    // ELEMENTOS DEL DOM
    // ==========================

    const searchForm = document.querySelector("#search-form");
    const searchInput = document.querySelector("#search-input");
    const resultsCount = document.querySelector("#results-count");
    const sortSelect = document.querySelector("#sort-select");
    const publisherFilter = document.querySelector("#publisher-filter");
    const genderFilter = document.querySelector("#gender-filter");

    const resultsSection = document.querySelector(".results-section");
    const paginationSection = document.querySelector(".pagination-section");
    const heroDetail = document.querySelector("#hero-detail");

    let heroesContainer = document.querySelector("#heroes-container");

    if (!heroesContainer && resultsSection) {
        heroesContainer = document.createElement("div");
        heroesContainer.id = "heroes-container";
        resultsSection.appendChild(heroesContainer);
    }

    const firstPageButton = document.querySelector("#first-page");
    const previousPageButton = document.querySelector("#previous-page");
    const currentPageElement = document.querySelector("#current-page");
    const nextPageButton = document.querySelector("#next-page");
    const lastPageButton = document.querySelector("#last-page");

    // ==========================
    // ESTADO
    // ==========================

    let heroes = [];
    let allHeroes = [];
    let currentPage = 1;
    let currentSort = "asc";
    let currentPublisher = "all";
    let currentGender = "all";
    let heroImages = {};

    // ==========================
    // CARGA DE IMÁGENES SEGURAS
    // ==========================

    const loadHeroImages = async () => {
        if (Object.keys(heroImages).length > 0) return;
        try {
            const res = await fetch("https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/all.json");
            const data = await res.json();
            allHeroes = data;
            data.forEach((h) => {
                heroImages[h.id] = h.images;
            });
        } catch (err) {
            console.warn("Aviso: CDN de respaldo no disponible", err);
        }
    };

    loadHeroImages();

    // ==========================
    // UTILIDADES
    // ==========================

    const loadPublisherOptions = () => {
    if (!publisherFilter) return;

    publisherFilter.innerHTML = '<option value="all">Todas</option>';

    const publishers = [];

    heroes.forEach((hero) => {
        const publisher = hero.biography?.publisher;

        if (publisher && !publishers.includes(publisher)) {
            publishers.push(publisher);
        }
    });

    publishers.forEach((publisher) => {
        const option = document.createElement("option");
        option.value = publisher;
        option.textContent = publisher;
        publisherFilter.appendChild(option);
    });
};

    const formatValue = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            value === "-" ||
            value === "null"
        ) {
            return "No disponible";
        }

        return value;
    };

    const formatArray = (values) => {
        if (!Array.isArray(values) || values.length === 0) {
            return "No disponible";
        }

        return values.join(", ");
    };

    const getImageUrl = (hero, size = "md") => {
        if (hero && heroImages[hero.id]) {
            return heroImages[hero.id][size] || heroImages[hero.id].md || heroImages[hero.id].lg;
        }
        if (hero?.image?.url && hero.image.url !== "null" && hero.image.url !== "") {
            return hero.image.url;
        }
        return "https://placehold.co/250x300?text=Sin+Imagen";
    };

    // ==========================
    // ORDENAMIENTO
    // ==========================
    
    const getFilteredHeroes = () => {
    return heroes.filter((hero) => {
        const matchesPublisher =
            currentPublisher === "all" ||
            hero.biography?.publisher === currentPublisher;

        const matchesGender =
            currentGender === "all" ||
            hero.appearance?.gender === currentGender;

        return matchesPublisher && matchesGender;
    });
};



    const getSortedHeroes = () => {
        return [...getFilteredHeroes()].sort((heroA, heroB) => {
            const nameA = heroA.name.toLowerCase();
            const nameB = heroB.name.toLowerCase();

            if (currentSort === "asc") {
                return nameA.localeCompare(nameB);
            }

            return nameB.localeCompare(nameA);
        });
    };

    // ==========================
    // PAGINACIÓN
    // ==========================

    const getTotalPages = () => {
        return Math.max(
            1,
            Math.ceil(getFilteredHeroes().length / HEROES_PER_PAGE)
        );
    };

    const getHeroesForCurrentPage = () => {
        const sortedHeroes = getSortedHeroes();

        const start = (currentPage - 1) * HEROES_PER_PAGE;
        const end = start + HEROES_PER_PAGE;

        return sortedHeroes.slice(start, end);
    };

    const renderPagination = () => {
        const totalPages = getTotalPages();

        if (currentPageElement) {
            currentPageElement.textContent = `Página ${currentPage} de ${totalPages}`;
        }

        const noResults = heroes.length === 0;
        const isFirstPage = currentPage === 1;
        const isLastPage = currentPage === totalPages;

        if (firstPageButton) {
            firstPageButton.disabled = noResults || isFirstPage;
        }

        if (previousPageButton) {
            previousPageButton.disabled = noResults || isFirstPage;
        }

        if (nextPageButton) {
            nextPageButton.disabled = noResults || isLastPage;
        }

        if (lastPageButton) {
            lastPageButton.disabled = noResults || isLastPage;
        }
    };

    // ==========================
    // MOSTRAR TARJETAS
    // ==========================

    const renderHeroes = () => {
        if (!heroesContainer) {
            return;
        }

        const heroesToShow = getHeroesForCurrentPage();
        heroesContainer.innerHTML = "";

        heroesToShow.forEach((hero) => {
            const card = document.createElement("article");
            card.classList.add("hero-card");

            const imageUrl = getImageUrl(hero, "md");

            card.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="${hero.name}"
                    referrerpolicy="no-referrer"
                    onerror="
                        this.onerror=null;
                        this.src='https://placehold.co/250x300?text=Sin+Imagen';
                    "
                >

                <div class="hero-card-info">
                    <h3>${hero.name}</h3>

                    <p>
                        ${
                            hero.biography?.["full-name"] ||
                            "Nombre real desconocido"
                        }
                    </p>

                    <button
                        type="button"
                        class="hero-detail-button"
                    >
                        Ver detalle
                    </button>
                </div>
            `;

            const detailButton = card.querySelector(".hero-detail-button");

            detailButton?.addEventListener("click", () => {
                renderHeroDetail(hero);
            });

            heroesContainer.appendChild(card);
        });
    };

    const renderResults = () => {
        const filteredHeroes = getFilteredHeroes();

    if (resultsCount) {
            resultsCount.textContent = `${filteredHeroes.length} resultado${filteredHeroes.length === 1 ? "" : "s"}`;
}

        renderHeroes();
        renderPagination();
};

    // ==========================
    // DETALLE
    // ==========================

    const renderHeroDetail = (hero) => {
        if (!heroDetail) {
            return;
        }

        const biography = hero.biography || {};
        const appearance = hero.appearance || {};
        const work = hero.work || {};
        const connections = hero.connections || {};
        const powerstats = hero.powerstats || {};

        const imageUrl = getImageUrl(hero, "lg");

        
    
        heroDetail.hidden = false;
    


        heroDetail.hidden = false;

        heroDetail.innerHTML = `
            <button
                id="back-button"
                type="button"
            >
                ← Volver
            </button>

            <article class="hero-detail-card">

                <img
                    src="${imageUrl}"
                    alt="${hero.name}"
                    referrerpolicy="no-referrer"
                    onerror="
                        this.onerror=null;
                        this.src='https://placehold.co/300x400?text=Sin+Imagen';
                    "
                >

                <div class="hero-detail-info">

                    <h2>${hero.name}</h2>

                    <h3>Información</h3>

                    <p>
                        <strong>Nombre real:</strong>
                        ${formatValue(biography["full-name"])}
                    </p>

                    <p>
                        <strong>Editorial:</strong>
                        ${formatValue(biography.publisher)}
                    </p>

                    <p>
                        <strong>Alias:</strong>
                        ${formatArray(biography.aliases)}
                    </p>

                    <p>
                        <strong>Lugar de nacimiento:</strong>
                        ${formatValue(biography["place-of-birth"])}
                    </p>

                    <p>
                        <strong>Ocupación:</strong>
                        ${formatValue(work.occupation)}
                    </p>

                    <h3>Estadísticas de poder</h3>

                    <ul>
                        <li>
                            Inteligencia:
                            ${formatValue(powerstats.intelligence)}
                        </li>

                        <li>
                            Fuerza:
                            ${formatValue(powerstats.strength)}
                        </li>

                        <li>
                            Velocidad:
                            ${formatValue(powerstats.speed)}
                        </li>

                        <li>
                            Durabilidad:
                            ${formatValue(powerstats.durability)}
                        </li>

                        <li>
                            Poder:
                            ${formatValue(powerstats.power)}
                        </li>

                        <li>
                            Combate:
                            ${formatValue(powerstats.combat)}
                        </li>
                    </ul>

                    <h3>Apariencia</h3>

                    <p>
                        <strong>Altura:</strong>
                        ${formatArray(appearance.height)}
                    </p>

                    <p>
                        <strong>Peso:</strong>
                        ${formatArray(appearance.weight)}
                    </p>

                    <h3>Conexiones</h3>

                    <p>
                        <strong>Afiliaciones:</strong>
                        ${formatValue(connections["group-affiliation"])}
                    </p>

                    <p>
                        <strong>Familiares:</strong>
                        ${formatValue(connections.relatives)}
                    </p>

                </div>

            </article>
        `;

        const backButton = document.querySelector("#back-button");

        backButton?.addEventListener("click", () => {
            heroDetail.hidden = true;

            if (resultsSection) {
                resultsSection.hidden = false;
            }

            if (paginationSection) {
                paginationSection.hidden = false;
            }

            renderResults();
        });
    };

    // ==========================
    // BUSCAR SUPERHÉROES
    // ==========================

    const searchHeroes = async (heroName) => {
        if (!heroesContainer) {
            console.error("No existe #heroes-container");
            return;
        }

        if (resultsCount) {
            resultsCount.textContent = "Buscando...";
        }

        heroesContainer.innerHTML = "";

        await loadHeroImages();
        const searchTerm = heroName.toLowerCase();

            heroes = allHeroes.filter((hero) =>
            hero.name.toLowerCase().includes(searchTerm)
        );
            loadPublisherOptions();
            currentPage = 1;

            renderResults();
        };

    // ==========================
    // FORMULARIO
    // ==========================

    searchForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        const heroName = searchInput?.value.trim();

        if (!heroName) {
            if (resultsCount) {
                resultsCount.textContent = "Ingresá un nombre para buscar.";
            }

            return;
        }

        searchHeroes(heroName);
    });

    // ==========================
    // ORDEN
    // ==========================

    sortSelect?.addEventListener("change", (event) => {
        const selectedSort = event.target.value;

            if (selectedSort !== "asc" && selectedSort !== "desc") {
            return;
    }

    currentSort = selectedSort;
    currentPage = 1;

    if (heroes.length > 0) {
        renderResults();
    }
});

publisherFilter?.addEventListener("change", (event) => {
    currentPublisher = event.target.value;
    currentPage = 1;

    if (heroes.length > 0) {
        renderResults();
    }
});

genderFilter?.addEventListener("change", (event) => {
    currentGender = event.target.value;
    currentPage = 1;

    if (heroes.length > 0) {
        renderResults();
    }
});


    // ==========================
    // BOTONES PAGINACIÓN
    // ==========================

    firstPageButton?.addEventListener("click", () => {
        currentPage = 1;
        renderResults();
    });

    previousPageButton?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderResults();
        }
    });

    nextPageButton?.addEventListener("click", () => {
        const totalPages = getTotalPages();

        if (currentPage < totalPages) {
            currentPage++;
            renderResults();
        }
    });

    lastPageButton?.addEventListener("click", () => {
        currentPage = getTotalPages();

        renderResults();
    });

    // ==========================
    // ESTADO INICIAL
    // ==========================

    renderPagination();
});
