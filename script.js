// ===============================
// PRODUCT SLIDER + LIGHTBOX
// ===============================

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");

let lightboxImages = [];
let lightboxIndex = 0;


// ===============================
// CREATE / UPDATE DOTS
// ===============================

function updateDots(slider, images, currentIndex) {

    const dotsContainer = slider.querySelector(".slider-dots");

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


// ===============================
// PRODUCT SLIDER
// ===============================

function changeImage(button, direction) {

    const slider = button.closest(".image-slider");

    if (!slider) return;

    const img = slider.querySelector(".slider-image");

    if (!img) return;

    let images;

    try {
        images = JSON.parse(slider.dataset.images || "[]");
    } catch (error) {
        console.error("Image list error:", error);
        return;
    }

    if (images.length === 0) return;

    let currentIndex = parseInt(
        slider.dataset.index || "0"
    );

    currentIndex += direction;

    if (currentIndex < 0) {
        currentIndex = images.length - 1;
    }

    if (currentIndex >= images.length) {
        currentIndex = 0;
    }

    img.src = images[currentIndex];

    slider.dataset.index = currentIndex;

    updateDots(
        slider,
        images,
        currentIndex
    );
}


// ===============================
// INITIALIZE ALL PRODUCT SLIDERS
// ===============================

document.querySelectorAll(".image-slider").forEach(function (slider) {

    let images;

    try {
        images = JSON.parse(slider.dataset.images || "[]");
    } catch (error) {
        return;
    }

    if (images.length === 0) return;

    let currentIndex = parseInt(
        slider.dataset.index || "0"
    );

    updateDots(
        slider,
        images,
        currentIndex
    );

});


// ===============================
// OPEN LIGHTBOX
// ===============================

document.querySelectorAll(".card img").forEach(function (img) {

    img.addEventListener("click", function () {

        const slider = img.closest(".image-slider");

        if (slider && slider.dataset.images) {

            try {
                lightboxImages = JSON.parse(
                    slider.dataset.images
                );
            } catch (error) {
                lightboxImages = [img.src];
            }

            lightboxIndex = parseInt(
                slider.dataset.index || "0"
            );

        } else {

            lightboxImages = [img.src];

            lightboxIndex = 0;

        }

        lightboxImg.src =
            lightboxImages[lightboxIndex];

        lightbox.style.display = "flex";

    });

});


// ===============================
// LIGHTBOX NEXT
// ===============================

if (lightboxNext) {

    lightboxNext.addEventListener("click", function (e) {

        e.stopPropagation();

        if (lightboxImages.length === 0) return;

        lightboxIndex++;

        if (lightboxIndex >= lightboxImages.length) {
            lightboxIndex = 0;
        }

        lightboxImg.src =
            lightboxImages[lightboxIndex];

    });

}


// ===============================
// LIGHTBOX PREVIOUS
// ===============================

if (lightboxPrev) {

    lightboxPrev.addEventListener("click", function (e) {

        e.stopPropagation();

        if (lightboxImages.length === 0) return;

        lightboxIndex--;

        if (lightboxIndex < 0) {
            lightboxIndex =
                lightboxImages.length - 1;
        }

        lightboxImg.src =
            lightboxImages[lightboxIndex];

    });

}


// ===============================
// CLOSE LIGHTBOX
// ===============================

if (closeBtn) {

    closeBtn.addEventListener("click", function () {

        lightbox.style.display = "none";

    });

}


// ===============================
// CLICK OUTSIDE = CLOSE
// ===============================

if (lightbox) {

    lightbox.addEventListener("click", function (e) {

        if (e.target === lightbox) {

            lightbox.style.display = "none";

        }

    });

}


// ===============================
// KEYBOARD CONTROLS
// ===============================

document.addEventListener("keydown", function (e) {

    if (!lightbox) return;

    if (lightbox.style.display !== "flex") return;

    if (e.key === "ArrowRight") {

        if (lightboxImages.length === 0) return;

        lightboxIndex++;

        if (lightboxIndex >= lightboxImages.length) {
            lightboxIndex = 0;
        }

        lightboxImg.src =
            lightboxImages[lightboxIndex];

    }

    if (e.key === "ArrowLeft") {

        if (lightboxImages.length === 0) return;

        lightboxIndex--;

        if (lightboxIndex < 0) {
            lightboxIndex =
                lightboxImages.length - 1;
        }

        lightboxImg.src =
            lightboxImages[lightboxIndex];

    }

    if (e.key === "Escape") {

        lightbox.style.display = "none";

    }
// =========================================
// PRODUCT SEARCH
// =========================================

const productSearch = document.getElementById("productSearch");

if (productSearch) {

    productSearch.addEventListener("input", function () {

        const searchText = this.value.toLowerCase().trim();

        const products = document.querySelectorAll(".products .card");

        products.forEach(function (card) {

            const productName =
                card.querySelector("h3");

            if (!productName) return;

            const name =
                productName.textContent.toLowerCase();

            if (name.includes(searchText)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }

        });

    });

}