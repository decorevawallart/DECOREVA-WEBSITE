// ========================================
// DECOREVA WALL ART
// CLEAN PRODUCT SCRIPT
// Slider + Clickable Dots + Lightbox + Search + Sorting
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // LIGHTBOX
    // ========================================

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".close");
    const lightboxPrev = document.querySelector(".lightbox-prev");
    const lightboxNext = document.querySelector(".lightbox-next");

    let lightboxImages = [];
    let lightboxIndex = 0;


    // ========================================
    // SLIDER HELPERS
    // ========================================

    function getSliderImages(slider) {
        if (!slider) return [];

        try {
            return JSON.parse(slider.dataset.images || "[]");
        } catch (error) {
            return [];
        }
    }


    function getSliderIndex(slider) {
        const index = parseInt(slider?.dataset.index || "0", 10);

        return Number.isNaN(index) ? 0 : index;
    }


    function showSliderImage(slider, index) {

        if (!slider) return;

        const images = getSliderImages(slider);
        const img = slider.querySelector(".slider-image");

        if (!images.length || !img) return;

        index = Math.max(
            0,
            Math.min(index, images.length - 1)
        );

        img.src = images[index];

        slider.dataset.index = index;

        updateDots(
            slider,
            images,
            index
        );
    }


    // ========================================
    // CLICKABLE SLIDER DOTS
    // ========================================

    function updateDots(
        slider,
        images,
        currentIndex
    ) {

        const dotsContainer =
            slider.querySelector(".slider-dots");

        if (!dotsContainer) return;

        dotsContainer.innerHTML = "";

        images.forEach(function (image, index) {

            const dot =
                document.createElement("span");

            dot.className = "slider-dot";

            if (index === currentIndex) {
                dot.classList.add("active");
            }

            dot.setAttribute(
                "role",
                "button"
            );

            dot.setAttribute(
                "aria-label",
                "View image " + (index + 1)
            );

            dot.tabIndex = 0;


            // DOT CLICK
            dot.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    showSliderImage(
                        slider,
                        index
                    );
                }
            );


            // DOT KEYBOARD
            dot.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        event.stopPropagation();

                        showSliderImage(
                            slider,
                            index
                        );
                    }
                }
            );


            dotsContainer.appendChild(dot);
        });
    }


    // ========================================
    // PRODUCT SLIDER
    // ========================================

    window.changeImage =
        function (button, direction) {

            const slider =
                button.closest(".image-slider");

            if (!slider) return;

            const images =
                getSliderImages(slider);

            if (!images.length) return;

            let currentIndex =
                getSliderIndex(slider);

            currentIndex +=
                Number(direction) || 0;


            if (currentIndex < 0) {

                currentIndex =
                    images.length - 1;
            }


            if (
                currentIndex >=
                images.length
            ) {

                currentIndex = 0;
            }


            showSliderImage(
                slider,
                currentIndex
            );
        };


    // ========================================
    // INITIALIZE ALL SLIDERS
    // ========================================

    document
        .querySelectorAll(".image-slider")
        .forEach(function (slider) {

            const images =
                getSliderImages(slider);

            if (!images.length) return;

            let currentIndex =
                getSliderIndex(slider);


            if (
                currentIndex < 0 ||
                currentIndex >= images.length
            ) {

                currentIndex = 0;
            }


            showSliderImage(
                slider,
                currentIndex
            );
        });


    // ========================================
    // OPEN LIGHTBOX
    // ========================================

    document
        .querySelectorAll(".card img")
        .forEach(function (img) {

            img.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    if (
                        !lightbox ||
                        !lightboxImg
                    ) {
                        return;
                    }


                    const slider =
                        img.closest(".image-slider");


                    if (slider) {

                        lightboxImages =
                            getSliderImages(
                                slider
                            );


                        if (
                            !lightboxImages.length
                        ) {

                            lightboxImages =
                                [img.src];
                        }


                        lightboxIndex =
                            getSliderIndex(
                                slider
                            );


                        if (
                            lightboxIndex < 0 ||
                            lightboxIndex >=
                            lightboxImages.length
                        ) {

                            lightboxIndex = 0;
                        }

                    } else {

                        lightboxImages =
                            [img.src];

                        lightboxIndex = 0;
                    }


                    lightboxImg.src =
                        lightboxImages[
                            lightboxIndex
                        ];


                    lightbox.style.display =
                        "flex";
                }
            );
        });


    // ========================================
    // SHOW LIGHTBOX IMAGE
    // ========================================

    function showLightboxImage(index) {

        if (
            !lightboxImages.length ||
            !lightboxImg
        ) {
            return;
        }


        if (index < 0) {

            index =
                lightboxImages.length - 1;
        }


        if (
            index >=
            lightboxImages.length
        ) {

            index = 0;
        }


        lightboxIndex = index;

        lightboxImg.src =
            lightboxImages[
                lightboxIndex
            ];
    }


    // ========================================
    // LIGHTBOX NEXT
    // ========================================

    if (lightboxNext) {

        lightboxNext.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (
                    !lightboxImages.length
                ) {
                    return;
                }


                showLightboxImage(
                    lightboxIndex + 1
                );
            }
        );
    }


    // ========================================
    // LIGHTBOX PREVIOUS
    // ========================================

    if (lightboxPrev) {

        lightboxPrev.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (
                    !lightboxImages.length
                ) {
                    return;
                }


                showLightboxImage(
                    lightboxIndex - 1
                );
            }
        );
    }


    // ========================================
    // CLOSE LIGHTBOX
    // ========================================

    function closeLightbox() {

        if (lightbox) {

            lightbox.style.display =
                "none";
        }
    }


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                closeLightbox();
            }
        );
    }


    // ========================================
    // CLICK OUTSIDE LIGHTBOX
    // ========================================

    if (lightbox) {

        lightbox.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    lightbox
                ) {

                    closeLightbox();
                }
            }
        );
    }


    // ========================================
    // LIGHTBOX KEYBOARD CONTROLS
    // ========================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                !lightbox ||
                lightbox.style.display !==
                "flex"
            ) {
                return;
            }


            if (
                event.key ===
                "ArrowRight"
            ) {

                showLightboxImage(
                    lightboxIndex + 1
                );
            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                showLightboxImage(
                    lightboxIndex - 1
                );
            }


            if (
                event.key ===
                "Escape"
            ) {

                closeLightbox();
            }
        }
    );


    // ========================================
    // PRODUCT SEARCH
    // ========================================

    const productSearch =
        document.getElementById(
            "productSearch"
        );


    function filterProducts() {

        if (!productSearch) return;


        const searchText =
            productSearch.value
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                ".products .card"
            )
            .forEach(function (card) {

                const productName =
                    card.querySelector("h3");


                if (!productName) return;


                const name =
                    productName.textContent
                        .toLowerCase()
                        .trim();


                card.style.display =
                    !searchText ||
                    name.includes(searchText)
                        ? ""
                        : "none";
            });
    }


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            filterProducts
        );
    }


    // ========================================
    // PRODUCT SORTING
    // ========================================

    const productsContainer =
        document.querySelector(
            ".products"
        );


    const customSort =
        document.querySelector(
            ".custom-sort"
        );


    const customSortButton =
        document.querySelector(
            ".custom-sort-button"
        );


    const customSortMenu =
        document.querySelector(
            ".custom-sort-menu"
        );


    const sortSelect =
        document.getElementById(
            "productSort"
        );


    const originalCards =
        productsContainer
            ? Array.from(
                productsContainer
                    .querySelectorAll(".card")
            )
            : [];


    // ========================================
    // GET PRODUCT NAME
    // ========================================

    function getProductName(card) {

        const name =
            card.querySelector("h3");


        return name
            ? name.textContent
                .trim()
                .toLowerCase()
            : "";
    }


    // ========================================
    // GET PRODUCT PRICE
    // ========================================

    function getPrice(card) {

        const priceElement =
            card.querySelector(
                ".price"
            );


        if (priceElement) {

            return (
                parseFloat(
                    priceElement.textContent
                        .replace(/[^\d.]/g, "")
                ) || 0
            );
        }


        const match =
            (card.textContent || "")
                .match(
                    /₹\s*([0-9,]+)/
                );


        if (!match) return 0;


        return parseFloat(
            match[1].replace(/,/g, "")
        ) || 0;
    }


    // ========================================
    // SORT PRODUCTS
    // ========================================

    function sortProducts(sortValue) {

        if (!productsContainer) {
            return;
        }


        // DEFAULT ORDER
        if (
            sortValue === "default" ||
            !sortValue
        ) {

            originalCards.forEach(
                function (card) {

                    productsContainer
                        .appendChild(card);
                }
            );

            return;
        }


        const cards =
            Array.from(
                productsContainer
                    .querySelectorAll(".card")
            );


        // LOW TO HIGH
        if (
            sortValue ===
            "low-high"
        ) {

            cards.sort(
                function (a, b) {

                    return (
                        getPrice(a) -
                        getPrice(b)
                    );
                }
            );
        }


        // HIGH TO LOW
        else if (
            sortValue ===
            "high-low"
        ) {

            cards.sort(
                function (a, b) {

                    return (
                        getPrice(b) -
                        getPrice(a)
                    );
                }
            );
        }


        // A TO Z
        else if (
            sortValue === "az"
        ) {

            cards.sort(
                function (a, b) {

                    return getProductName(a)
                        .localeCompare(
                            getProductName(b)
                        );
                }
            );
        }


        // Z TO A
        else if (
            sortValue === "za"
        ) {

            cards.sort(
                function (a, b) {

                    return getProductName(b)
                        .localeCompare(
                            getProductName(a)
                        );
                }
            );
        }


        cards.forEach(
            function (card) {

                productsContainer
                    .appendChild(card);
            }
        );
    }


    // ========================================
    // UPDATE CUSTOM SORT UI
    // ========================================

    function updateCustomSortUI(value) {

        if (
            !customSortMenu ||
            !customSortButton
        ) {
            return;
        }


        const options =
            customSortMenu
                .querySelectorAll(
                    "button[data-value]"
                );


        let selectedOption = null;


        options.forEach(
            function (option) {

                const isActive =
                    option.getAttribute(
                        "data-value"
                    ) === value;


                option.classList.toggle(
                    "active",
                    isActive
                );


                if (isActive) {

                    selectedOption =
                        option;
                }
            }
        );


        const buttonText =
            customSortButton
                .querySelector(
                    "span:first-child"
                );


        if (
            buttonText &&
            selectedOption
        ) {

            buttonText.textContent =
                selectedOption
                    .textContent
                    .trim();
        }
    }


    // ========================================
    // CUSTOM SORT DROPDOWN
    // ========================================

    if (
        customSort &&
        customSortButton &&
        customSortMenu
    ) {

        const options =
            customSortMenu
                .querySelectorAll(
                    "button[data-value]"
                );


        // OPEN / CLOSE
        customSortButton
            .addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    customSort.classList.toggle(
                        "open"
                    );
                }
            );


        // SORT OPTION
        options.forEach(
            function (option) {

                option.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        const value =
                            this.getAttribute(
                                "data-value"
                            );


                        if (!value) return;


                        sortProducts(value);

                        updateCustomSortUI(
                            value
                        );


                        if (sortSelect) {

                            sortSelect.value =
                                value;
                        }


                        customSort.classList.remove(
                            "open"
                        );
                    }
                );
            }
        );


        // CLOSE OUTSIDE
        document.addEventListener(
            "click",
            function (event) {

                if (
                    !customSort.contains(
                        event.target
                    )
                ) {

                    customSort.classList.remove(
                        "open"
                    );
                }
            }
        );
    }


  

    // ========================================
    // INITIAL SORT UI
    // ========================================

    if (sortSelect) {

        updateCustomSortUI(
            sortSelect.value ||
            "default"
        );
    }

});