// ========================================
// DECOREVA WALL ART
// COMPLETE PRODUCT SCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // LIGHTBOX ELEMENTS
    // ========================================

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");

    const closeBtn = document.querySelector(".close");
    const lightboxPrev = document.querySelector(".lightbox-prev");
    const lightboxNext = document.querySelector(".lightbox-next");

    let lightboxImages = [];
    let lightboxIndex = 0;


    // ========================================
    // CREATE / UPDATE SLIDER DOTS
    // ========================================

    function updateDots(slider, images, currentIndex) {

        const dotsContainer =
            slider.querySelector(".slider-dots");

        if (!dotsContainer) return;

        dotsContainer.innerHTML = "";

        images.forEach(function (image, index) {

            const dot = document.createElement("span");

            dot.className = "slider-dot";

            if (index === currentIndex) {
                dot.classList.add("active");
            }

            dotsContainer.appendChild(dot);

        });

    }


    // ========================================
    // PRODUCT SLIDER
    // ========================================

    window.changeImage = function (button, direction) {

        const slider =
            button.closest(".image-slider");

        if (!slider) return;

        const img =
            slider.querySelector(".slider-image");

        if (!img) return;

        let images = [];

        try {

            images =
                JSON.parse(
                    slider.dataset.images || "[]"
                );

        } catch (error) {

            console.error(
                "Slider image error:",
                error
            );

            return;
        }

        if (!images.length) return;

        let currentIndex =
            parseInt(
                slider.dataset.index || "0",
                10
            );

        if (isNaN(currentIndex)) {
            currentIndex = 0;
        }

        currentIndex += direction;

        if (currentIndex < 0) {
            currentIndex = images.length - 1;
        }

        if (currentIndex >= images.length) {
            currentIndex = 0;
        }

        img.src = images[currentIndex];

        slider.dataset.index =
            currentIndex;

        updateDots(
            slider,
            images,
            currentIndex
        );

    };


    // ========================================
    // INITIALIZE ALL SLIDERS
    // ========================================

    document
        .querySelectorAll(".image-slider")
        .forEach(function (slider) {

            let images = [];

            try {

                images =
                    JSON.parse(
                        slider.dataset.images || "[]"
                    );

            } catch (error) {

                return;
            }

            if (!images.length) return;

            let currentIndex =
                parseInt(
                    slider.dataset.index || "0",
                    10
                );

            if (isNaN(currentIndex)) {
                currentIndex = 0;
            }

            const img =
                slider.querySelector(".slider-image");

            if (img && images[currentIndex]) {
                img.src = images[currentIndex];
            }

            updateDots(
                slider,
                images,
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
                function () {

                    if (!lightbox || !lightboxImg) {
                        return;
                    }

                    const slider =
                        img.closest(".image-slider");

                    if (
                        slider &&
                        slider.dataset.images
                    ) {

                        try {

                            lightboxImages =
                                JSON.parse(
                                    slider.dataset.images
                                );

                        } catch (error) {

                            lightboxImages =
                                [img.src];

                        }

                        lightboxIndex =
                            parseInt(
                                slider.dataset.index || "0",
                                10
                            );

                        if (isNaN(lightboxIndex)) {
                            lightboxIndex = 0;
                        }

                    } else {

                        lightboxImages =
                            [img.src];

                        lightboxIndex = 0;

                    }

                    if (
                        lightboxImages[
                            lightboxIndex
                        ]
                    ) {

                        lightboxImg.src =
                            lightboxImages[
                                lightboxIndex
                            ];

                    }

                    lightbox.style.display =
                        "flex";

                }
            );

        });


    // ========================================
    // LIGHTBOX NEXT
    // ========================================

    if (lightboxNext) {

        lightboxNext.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex++;

                if (
                    lightboxIndex >=
                    lightboxImages.length
                ) {

                    lightboxIndex = 0;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

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

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex--;

                if (lightboxIndex < 0) {

                    lightboxIndex =
                        lightboxImages.length - 1;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }
        );

    }


    // ========================================
    // CLOSE LIGHTBOX
    // ========================================

    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            function () {

                if (lightbox) {
                    lightbox.style.display =
                        "none";
                }

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

                    lightbox.style.display =
                        "none";

                }

            }
        );

    }


    // ========================================
    // KEYBOARD CONTROLS
    // ========================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (!lightbox) return;

            if (
                lightbox.style.display !==
                "flex"
            ) {
                return;
            }

            if (
                event.key ===
                "ArrowRight"
            ) {

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex++;

                if (
                    lightboxIndex >=
                    lightboxImages.length
                ) {

                    lightboxIndex = 0;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex--;

                if (lightboxIndex < 0) {

                    lightboxIndex =
                        lightboxImages.length - 1;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }


            if (
                event.key ===
                "Escape"
            ) {

                lightbox.style.display =
                    "none";

            }

        }
    );


    // ========================================
    // PRODUCT SEARCH
    // MOBILE + DESKTOP
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

        const cards =
            document.querySelectorAll(
                ".products .card"
            );

        cards.forEach(function (card) {

            const productName =
                card.querySelector("h3");

            if (!productName) return;

            const name =
                productName.textContent
                    .toLowerCase()
                    .trim();

            if (
                searchText === "" ||
                name.includes(searchText)
            ) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

    }


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            filterProducts
        );

        productSearch.addEventListener(
            "keyup",
            filterProducts
        );

        productSearch.addEventListener(
            "change",
            filterProducts
        );

    }


    // ========================================
    // PRODUCT SORTING
    // ========================================

    const sortSelect =
        document.getElementById(
            "sortProducts"
        ) ||
        document.getElementById(
            "productSort"
        ) ||
        document.querySelector(
            ".sort-products"
        );


    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            function () {

                const productsContainer =
                    document.querySelector(
                        ".products"
                    );

                if (!productsContainer) {
                    return;
                }

                const cards =
                    Array.from(
                        productsContainer.querySelectorAll(
                            ".card"
                        )
                    );

                const value =
                    sortSelect.value;

                cards.sort(
                    function (a, b) {

                        const nameA =
                            (
                                a.querySelector("h3")
                                    ?.textContent || ""
                            )
                            .trim()
                            .toLowerCase();

                        const nameB =
                            (
                                b.querySelector("h3")
                                    ?.textContent || ""
                            )
                            .trim()
                            .toLowerCase();


                        const priceA =
                            getPrice(a);

                        const priceB =
                            getPrice(b);


                        if (
                            value ===
                            "price-low"
                        ) {

                            return (
                                priceA -
                                priceB
                            );

                        }


                        if (
                            value ===
                            "price-high"
                        ) {

                            return (
                                priceB -
                                priceA
                            );

                        }


                        if (
                            value ===
                            "name-a"
                        ) {

                            return nameA
                                .localeCompare(
                                    nameB
                                );

                        }


                        if (
                            value ===
                            "name-z"
                        ) {

                            return nameB
                                .localeCompare(
                                    nameA
                                );

                        }


                        return 0;

                    }
                );


                cards.forEach(
                    function (card) {

                        productsContainer
                            .appendChild(card);

                    }
                );

            }
        );

    }


    // ========================================
    // GET PRODUCT PRICE
    // ========================================

    function getPrice(card) {

        const priceElement =
            card.querySelector(".price");

        if (!priceElement) {

            const text =
                card.textContent || "";

            const match =
                text.match(
                    /₹\s*([0-9,]+)/
                );

            if (!match) return 0;

            return parseFloat(
                match[1]
                    .replace(/,/g, "")
            );

        }

        return parseFloat(
            priceElement.textContent
                .replace(/[^\d.]/g, "")
        ) || 0;

    }


    // ========================================
    // DEBUG MESSAGE
    // ========================================

    console.log(
        "DECOREVA script loaded successfully"
    );

});