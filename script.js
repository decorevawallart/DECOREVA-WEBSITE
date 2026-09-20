document.addEventListener("DOMContentLoaded", function () {
"use strict";
if (!document.getElementById("decoreva-desktop-profile-polish")) {
const desktopProfileStyle = document.createElement("style");
desktopProfileStyle.id = "decoreva-desktop-profile-polish";
desktopProfileStyle.textContent = `
@media (min-width: 761px) {
#decoreva-profile-panel .decoreva-profile-card {
width: 380px !important;
max-width: calc(100vw - 40px) !important;
max-height: calc(100vh - 120px) !important;
border-radius: 10px !important;
overflow: hidden !important;
box-shadow: 0 18px 50px rgba(0,0,0,.32) !important;
border: 1px solid rgba(201,149,46,.22) !important;
}
#decoreva-profile-panel .decoreva-profile-head {
min-height: 66px !important;
padding: 13px 16px !important;
box-sizing: border-box !important;
}
#decoreva-profile-panel .decoreva-profile-head strong {
font-size: 22px !important;
line-height: 1.15 !important;
}
#decoreva-profile-panel .decoreva-profile-head span {
margin-top: 3px !important;
font-size: 10px !important;
letter-spacing: .15px !important;
}
#decoreva-profile-panel .decoreva-profile-body {
max-height: calc(100vh - 186px) !important;
overflow-y: auto !important;
scrollbar-width: thin !important;
}
#decoreva-profile-panel .decoreva-profile-welcome {
padding: 15px 16px !important;
}
#decoreva-profile-panel .decoreva-profile-menu {
margin: 0 10px 8px !important;
border: 1px solid #eadfce !important;
border-radius: 8px !important;
overflow: hidden !important;
background: #fff !important;
}
#decoreva-profile-panel .decoreva-profile-menu button {
min-height: 52px !important;
padding: 9px 14px !important;
box-sizing: border-box !important;
display: flex !important;
align-items: center !important;
justify-content: space-between !important;
gap: 14px !important;
transition: background .16s ease, padding-left .16s ease !important;
}
#decoreva-profile-panel .decoreva-profile-menu button + button {
border-top: 1px solid #eee5d8 !important;
}
#decoreva-profile-panel .decoreva-profile-menu button:hover {
background: #faf5eb !important;
padding-left: 17px !important;
}
#decoreva-profile-panel .decoreva-profile-menu button span {
font-size: 13px !important;
font-weight: 800 !important;
}
#decoreva-profile-panel .decoreva-profile-menu button small {
font-size: 10px !important;
white-space: nowrap !important;
opacity: .9 !important;
}
#decoreva-profile-panel .decoreva-profile-note {
padding: 8px 18px 13px !important;
font-size: 10px !important;
line-height: 1.4 !important;
}
}
`;
document.head.appendChild(desktopProfileStyle);
}
window.addEventListener("beforeunload", function () {
try {
const savedPanelBeforeRefresh = sessionStorage.getItem("decoreva_open_panel");
if (savedPanelBeforeRefresh === "cart" || savedPanelBeforeRefresh === "wishlist") {
document.documentElement.style.display = "none";
document.documentElement.style.visibility = "hidden";
}
} catch (error) {
}
});
const DECOREVA_VISITOR_ID_KEY = "decorevaVisitorId";
const DECOREVA_TRACKED_PAGE_KEY = "decorevaTrackedPage";
function getDecorevaVisitorId() {
let visitorId = "";
try {
visitorId = localStorage.getItem(DECOREVA_VISITOR_ID_KEY) || "";
} catch (error) {
console.warn("DECOREVA visitor storage read error:", error);
}
if (!visitorId) {
if (window.crypto && typeof window.crypto.randomUUID === "function") {
visitorId = window.crypto.randomUUID();
} else if (window.crypto && typeof window.crypto.getRandomValues === "function") {
const bytes = new Uint8Array(16);
window.crypto.getRandomValues(bytes);
visitorId = Array.from(bytes, function (byte) {
return byte.toString(16).padStart(2, "0");
}).join("");
} else {
visitorId = "visitor-" + Date.now() + "-" + Math.random().toString(36).slice(2, 12);
}
try {
localStorage.setItem(DECOREVA_VISITOR_ID_KEY, visitorId);
} catch (error) {
console.warn("DECOREVA visitor storage write error:", error);
}
}
return visitorId;
}
async function getDecorevaTrackingUser() {
if (!window.decorevaSupabase || !window.decorevaSupabase.auth) {
return null;
}
try {
const result = await window.decorevaSupabase.auth.getUser();
return result && result.data ? result.data.user || null : null;
} catch (error) {
console.warn("DECOREVA visitor auth check error:", error);
return null;
}
}
function getDecorevaTrackingPageKey() {
return window.location.pathname + window.location.search + window.location.hash;
}
async function trackDecorevaVisit(productKey) {
if (!window.decorevaSupabase) {
console.warn("DECOREVA visitor tracking: Supabase client unavailable.");
return false;
}
const visitorId = getDecorevaVisitorId();
if (!visitorId) return false;
const pageKey = getDecorevaTrackingPageKey();
const isProductView = !!productKey;
if (!isProductView) {
try {
if (sessionStorage.getItem(DECOREVA_TRACKED_PAGE_KEY) === pageKey) {
return true;
}
} catch (error) {
console.warn("DECOREVA visitor session storage read error:", error);
}
}
const user = await getDecorevaTrackingUser();
const payload = {
visitor_id: visitorId,
user_id: user ? user.id : null,
page_path: pageKey,
product_key: productKey ? String(productKey) : null,
referrer: document.referrer || null
};
try {
const result = await window.decorevaSupabase
.from("site_visits")
.insert(payload);
if (result.error) {
console.error("DECOREVA visitor tracking error:", result.error);
return false;
}
if (!isProductView) {
try {
sessionStorage.setItem(DECOREVA_TRACKED_PAGE_KEY, pageKey);
} catch (error) {
console.warn("DECOREVA visitor session storage write error:", error);
}
}
return true;
} catch (error) {
console.error("DECOREVA visitor tracking exception:", error);
return false;
}
}
window.decorevaTrackVisit = trackDecorevaVisit;
trackDecorevaVisit();
document.addEventListener("click", function (event) {
const card = event.target.closest("#collection-products .card, .featured-slider .featured-slide");
if (!card) return;
const productKey =
card.dataset.productKey ||
card.dataset.productId ||
card.getAttribute("data-product-key") ||
card.getAttribute("data-product-id") ||
card.getAttribute("data-variation-product") ||
"";
if (productKey) {
trackDecorevaVisit(productKey);
}
}, true);
function getSliderImages(slider) {
if (!slider) return [];
try {
return JSON.parse(slider.dataset.images || "[]");
} catch (error) {
console.error("DECOREVA slider data error:", error);
return [];
}
}
function getSliderIndex(slider) {
if (!slider) return 0;
const index = parseInt(slider.dataset.index || "0", 10);
return Number.isNaN(index) ? 0 : index;
}
document.querySelectorAll("#collection-products .card").forEach(function (card) {
const title = card.querySelector("h3");
if (!title) return;
if (title.textContent.trim().toLowerCase() === "family keyholder") {
card.remove();
}
});
function updateDots(slider, images, currentIndex) {
if (!slider) return;
const container = slider.querySelector(".slider-dots");
if (!container) return;
const fragment = document.createDocumentFragment();
images.forEach(function (_, index) {
const dot = document.createElement("span");
dot.className =
"slider-dot" +
(index === currentIndex ? " active" : "");
dot.dataset.index = String(index);
dot.setAttribute("role", "button");
dot.setAttribute("tabindex", "0");
dot.setAttribute("aria-label", "View image " + (index + 1));
fragment.appendChild(dot);
});
container.replaceChildren(fragment);
}
document.addEventListener("click", function (event) {
const dot = event.target.closest(".slider-dot");
if (!dot) return;
const container = dot.closest(".slider-dots");
const slider = container
? container.closest(".image-slider, .featured-image-box")
: null;
const index = Number(dot.dataset.index);
if (!slider || !Number.isInteger(index)) return;
event.preventDefault();
event.stopPropagation();
showSliderImage(slider, index);
});
document.addEventListener("keydown", function (event) {
if (event.key !== "Enter" && event.key !== " ") return;
const dot = event.target.closest(".slider-dot");
if (!dot) return;
const container = dot.closest(".slider-dots");
const slider = container
? container.closest(".image-slider, .featured-image-box")
: null;
const index = Number(dot.dataset.index);
if (!slider || !Number.isInteger(index)) return;
event.preventDefault();
event.stopPropagation();
showSliderImage(slider, index);
});
function showSliderImage(slider, index) {
if (!slider) return;
const images = getSliderImages(slider);
const image = slider.querySelector(".slider-image");
if (!images.length || !image) return;
index =
((index % images.length) + images.length) %
images.length;
slider.dataset.index = String(index);
const targetSrc = images[index];
if (image.getAttribute("src") !== targetSrc) {
image.src = targetSrc;
}
image.dataset.loaded = "true";
updateDots(slider, images, index);
}
window.changeImage = function (button, direction) {
if (!button) return;
const slider = button.closest(".image-slider");
if (!slider) return;
const images = getSliderImages(slider);
if (!images.length) return;
let index = getSliderIndex(slider);
index += Number(direction) || 0;
showSliderImage(slider, index);
};
const sliderObserver =
"IntersectionObserver" in window
? new IntersectionObserver(
function (entries) {
entries.forEach(function (entry) {
if (!entry.isIntersecting) return;
const slider = entry.target;
const index = getSliderIndex(slider);
showSliderImage(slider, index);
sliderObserver.unobserve(slider);
});
},
{
rootMargin: "250px 0px",
threshold: 0.01
}
)
: null;
document.querySelectorAll(".image-slider").forEach(function (slider) {
const images = getSliderImages(slider);
if (!images.length) return;
updateDots(slider, images, getSliderIndex(slider));
if (sliderObserver) {
sliderObserver.observe(slider);
} else {
showSliderImage(slider, getSliderIndex(slider));
}
});
const lightbox =
document.querySelector("#lightbox") ||
document.querySelector(".lightbox");
const lightboxImg =
document.querySelector("#lightbox-img");
const lightboxClose =
document.querySelector(".lightbox .close");
const lightboxPrev =
document.querySelector(".lightbox-prev");
const lightboxNext =
document.querySelector(".lightbox-next");
let lightboxImages = [];
let lightboxIndex = 0;
function openLightbox(images, index) {
if (!lightbox || !lightboxImg || !images || !images.length) {
return;
}
lightboxImages = images.filter(Boolean);
if (!lightboxImages.length) return;
lightboxIndex = parseInt(index, 10) || 0;
lightboxIndex =
((lightboxIndex % lightboxImages.length) +
lightboxImages.length) %
lightboxImages.length;
lightboxImg.src = lightboxImages[lightboxIndex];
lightbox.classList.add("active");
document.body.classList.add("lightbox-open");
document.body.style.overflow = "hidden";
}
function closeLightbox() {
if (!lightbox) return;
lightbox.classList.remove("active");
document.body.classList.remove("lightbox-open");
document.body.style.overflow = "";
}
function showLightboxImage(index) {
if (!lightboxImages.length || !lightboxImg) return;
index =
((index % lightboxImages.length) +
lightboxImages.length) %
lightboxImages.length;
lightboxIndex = index;
lightboxImg.src = lightboxImages[index];
}
function flashLightboxButton(button) {
if (!button) return;
button.style.transition = "transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease";
button.style.transform = "translateY(-50%) scale(0.91)";
button.style.background = "rgba(201,149,46,.95)";
button.style.color = "#fff";
button.style.boxShadow = "0 0 0 3px rgba(201,149,46,.18), 0 6px 18px rgba(0,0,0,.28)";
window.clearTimeout(button._decorevaPressTimer);
button._decorevaPressTimer = window.setTimeout(function () {
button.style.transform = "translateY(-50%) scale(1)";
button.style.background = "rgba(20,15,9,.78)";
button.style.color = "#f1cd7c";
button.style.boxShadow = "";
}, 140);
}
[lightboxPrev, lightboxNext].forEach(function (button) {
if (!button) return;
button.addEventListener("pointerdown", function () {
button.style.transition = "transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease";
button.style.transform = "translateY(-50%) scale(0.91)";
button.style.background = "rgba(201,149,46,.95)";
button.style.color = "#fff";
button.style.boxShadow = "0 0 0 3px rgba(201,149,46,.18), 0 6px 18px rgba(0,0,0,.28)";
});
button.addEventListener("pointerup", function () {
flashLightboxButton(button);
});
button.addEventListener("pointercancel", function () {
flashLightboxButton(button);
});
});
const featuredLightboxSlider =
document.querySelector(".featured-slider");
if (featuredLightboxSlider) {
featuredLightboxSlider.addEventListener(
"click",
function (event) {
const image =
event.target.closest(
".featured-image-box img"
);
if (!image) return;
event.preventDefault();
event.stopPropagation();
const slide =
image.closest(".featured-slide");
if (!slide) return;
const imageBox =
image.closest(".featured-image-box");
let images = [];
if (
imageBox &&
imageBox.dataset.images
) {
try {
images = JSON.parse(
imageBox.dataset.images
);
} catch (error) {
console.error(
"Featured image data error:",
error
);
}
}
if (
!images.length &&
slide.dataset.images
) {
try {
images = JSON.parse(
slide.dataset.images
);
} catch (error) {
console.error(
"Featured slide data error:",
error
);
}
}
if (!images.length) {
images = [
image.currentSrc ||
image.src
];
}
const currentImage =
image.currentSrc ||
image.src;
let currentIndex =
images.findIndex(
function (src) {
return (
src === currentImage ||
currentImage.includes(src) ||
src.includes(currentImage)
);
}
);
if (currentIndex < 0) {
currentIndex = 0;
}
openLightbox(
images,
currentIndex
);
}
);
}
const collectionProducts =
document.querySelector("#collection-products");
if (collectionProducts) {
collectionProducts.addEventListener(
"click",
function (event) {
const image =
event.target.closest(".slider-image");
if (!image) return;
event.preventDefault();
event.stopPropagation();
const slider =
image.closest(".image-slider");
if (!slider) return;
const images = getSliderImages(slider);
const index = getSliderIndex(slider);
if (!images.length) return;
openLightbox(images, index);
}
);
}
if (lightboxClose) {
lightboxClose.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
closeLightbox();
}
);
}
if (lightboxNext) {
lightboxNext.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
flashLightboxButton(lightboxNext);
showLightboxImage(
lightboxIndex + 1
);
}
);
}
if (lightboxPrev) {
lightboxPrev.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
flashLightboxButton(lightboxPrev);
showLightboxImage(
lightboxIndex - 1
);
}
);
}
if (lightbox) {
lightbox.addEventListener(
"click",
function (event) {
if (event.target === lightbox) {
closeLightbox();
}
}
);
}
document.addEventListener(
"keydown",
function (event) {
if (
!lightbox ||
!lightbox.classList.contains("active")
) {
return;
}
if (event.key === "Escape") {
closeLightbox();
}
if (event.key === "ArrowRight") {
showLightboxImage(lightboxIndex + 1);
}
if (event.key === "ArrowLeft") {
showLightboxImage(lightboxIndex - 1);
}
}
);
const productSearch =
document.querySelector("#productSearch");
function filterProducts() {
if (!productSearch) return;
const searchText =
productSearch.value.toLowerCase().trim();
const cards =
document.querySelectorAll("#collection-products .card");
if (searchText) {
document
.querySelectorAll(".decoreva-pagination")
.forEach(function (nav) {
nav.style.display = "none";
});
cards.forEach(function (card) {
const title = card.querySelector("h3");
const name = title
? title.textContent.toLowerCase()
: "";
card.style.setProperty(
"display",
name.includes(searchText) ? "flex" : "none",
"important"
);
});
if (typeof window.decorevaLoadVisibleSliders === "function") {
window.decorevaLoadVisibleSliders();
}
return;
}
document
.querySelectorAll(".decoreva-pagination")
.forEach(function (nav) {
nav.style.display = "flex";
});
if (typeof decorevaShowPage === "function") {
decorevaShowPage(1);
}
}
if (productSearch) {
productSearch.addEventListener(
"input",
filterProducts
);
}
const voiceSearchBtn =
document.querySelector("#voiceSearchBtn");
if (voiceSearchBtn && productSearch) {
const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;
if (SpeechRecognition) {
const recognition =
new SpeechRecognition();
recognition.lang = "en-IN";
recognition.continuous = false;
recognition.interimResults = false;
voiceSearchBtn.addEventListener(
"click",
function () {
try {
recognition.start();
voiceSearchBtn.classList.add(
"listening"
);
} catch (error) {
console.log(
"Voice search already active."
);
}
}
);
recognition.addEventListener(
"result",
function (event) {
const transcript =
event.results[0][0]
.transcript
.trim();
productSearch.value =
transcript;
filterProducts();
}
);
recognition.addEventListener(
"end",
function () {
voiceSearchBtn.classList.remove(
"listening"
);
}
);
recognition.addEventListener(
"error",
function () {
voiceSearchBtn.classList.remove(
"listening"
);
}
);
} else {
voiceSearchBtn.addEventListener(
"click",
function () {
alert(
"Voice search is not supported in this browser. Please use Google Chrome."
);
}
);
}
}
const productsContainer =
document.querySelector("#collection-products");
const customSort =
document.querySelector(".custom-sort");
const customSortButton =
document.querySelector(".custom-sort-button");
const customSortMenu =
document.querySelector(".custom-sort-menu");
const sortOptions =
customSortMenu
? Array.from(
customSortMenu.querySelectorAll(
"[data-value]"
)
)
: [];
const originalProductOrder =
productsContainer
? Array.from(
productsContainer.querySelectorAll(".card")
)
: [];
function getCards() {
if (!productsContainer) return [];
return Array.from(
productsContainer.querySelectorAll(".card")
);
}
function getPrice(card) {
const price =
card.querySelector(".price");
if (!price) return 0;
return parseFloat(
price.textContent.replace(
/[^\d.]/g,
""
)
) || 0;
}
function getName(card) {
const title =
card.querySelector("h3");
if (!title) return "";
return title.textContent
.trim()
.toLowerCase();
}
function sortProducts(value) {
if (!productsContainer) return;
const cards = getCards();
cards.sort(function (a, b) {
if (value === "low-high") {
return getPrice(a) - getPrice(b);
}
if (value === "high-low") {
return getPrice(b) - getPrice(a);
}
if (value === "az") {
return getName(a)
.localeCompare(getName(b));
}
if (value === "za") {
return getName(b)
.localeCompare(getName(a));
}
return 0;
});
cards.forEach(function (card) {
productsContainer.appendChild(card);
});
decorevaProducts = Array.from(
productsContainer.querySelectorAll(".card")
);
if (typeof decorevaShowPage === "function") {
decorevaShowPage(1);
}
}
function updateSortLabel(value) {
if (!customSortButton) return;
const label =
customSortButton.querySelector(
"span:first-child"
);
const option =
sortOptions.find(function (item) {
return item.dataset.value === value;
});
if (label && option) {
label.textContent =
option.textContent.trim();
}
}
if (customSort && customSortButton) {
customSortButton.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
customSort.classList.toggle("open");
}
);
sortOptions.forEach(function (option) {
option.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
const value =
option.dataset.value;
if (value === "default") {
clearAllCollectionFilters();
return;
}
sortProducts(value);
updateSortLabel(value);
sortOptions.forEach(function (item) {
item.classList.remove("active");
});
option.classList.add("active");
customSort.classList.remove("open");
customSortButton.setAttribute(
"aria-expanded",
"false"
);
}
);
});
document.addEventListener(
"click",
function (event) {
if (!customSort.contains(event.target)) {
customSort.classList.remove("open");
customSortButton.setAttribute(
"aria-expanded",
"false"
);
}
}
);
}
function clearAllCollectionFilters(shouldScrollToCollection = true) {
if (productSearch) {
productSearch.value = "";
}
if (productsContainer && originalProductOrder.length) {
originalProductOrder.forEach(function (card) {
productsContainer.appendChild(card);
});
decorevaProducts = originalProductOrder.slice();
}
if (customSortButton) {
const label =
customSortButton.querySelector(
"span:first-child"
);
if (label) {
label.textContent = "Sort Products";
}
customSortButton.setAttribute(
"aria-expanded",
"false"
);
}
sortOptions.forEach(function (item) {
item.classList.remove("active");
});
if (customSort) {
customSort.classList.remove("open");
}
document
.querySelectorAll(".decoreva-pagination")
.forEach(function (nav) {
nav.style.display = "flex";
});
if (typeof decorevaShowPage === "function") {
decorevaShowPage(1);
}
if (shouldScrollToCollection) {
requestAnimationFrame(function () {
scrollToCollectionTitle("smooth");
});
}
}
const collectionControls =
document.querySelector(".collection-controls");
if (collectionControls) {
let clearAllButton =
document.querySelector("#clear-all-products");
if (!clearAllButton) {
clearAllButton =
document.createElement("button");
clearAllButton.type = "button";
clearAllButton.id = "clear-all-products";
clearAllButton.className = "clear-all-products";
clearAllButton.setAttribute("aria-label", "Clear all collection filters");
clearAllButton.textContent = "Clear All";
clearAllButton.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
clearAllCollectionFilters();
}
);
const productSort =
collectionControls.querySelector(
".product-sort"
);
if (productSort) {
productSort.insertAdjacentElement(
"afterend",
clearAllButton
);
} else {
collectionControls.insertBefore(
clearAllButton,
collectionControls.firstChild
);
}
}
}
const featuredSlider =
document.querySelector(".featured-slider");
let featuredSlides =
Array.from(
document.querySelectorAll(".featured-slide")
);
const featuredPrev =
document.querySelector(".featured-prev");
const featuredNext =
document.querySelector(".featured-next");
const featuredDotsContainer =
document.querySelector(".featured-dots");
let featuredTrack = null;
let featuredPosition = 0;
let featuredRealIndex = 0;
let featuredCloneCount = 0;
let featuredAnimating = false;
let featuredTimer = null;
let featuredResizeTimer = null;
function getFeaturedVisibleCount() {
if (window.innerWidth <= 760) return 2;
if (window.innerWidth <= 1100) return 3;
return 4;
}
function getFeaturedGap() {
if (!featuredTrack) return 10;
const styles =
window.getComputedStyle(
featuredTrack
);
return (
parseFloat(
styles.columnGap ||
styles.gap ||
"10"
) || 10
);
}
function getFeaturedStep() {
if (!featuredTrack) return 0;
const card =
featuredTrack.querySelector(
".featured-slide"
);
if (!card) return 0;
return (
card.getBoundingClientRect().width +
getFeaturedGap()
);
}
function createFeaturedDots() {
if (!featuredDotsContainer) return;
featuredDotsContainer.innerHTML = "";
featuredSlides.forEach(function (_, index) {
const dot =
document.createElement("span");
dot.className = "featured-dot";
dot.setAttribute(
"role",
"button"
);
dot.setAttribute(
"tabindex",
"0"
);
dot.setAttribute(
"aria-label",
"Featured product " + (index + 1)
);
dot.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
goToFeatured(index);
}
);
dot.addEventListener(
"keydown",
function (event) {
if (
event.key === "Enter" ||
event.key === " "
) {
event.preventDefault();
goToFeatured(index);
}
}
);
featuredDotsContainer.appendChild(dot);
});
}
function updateFeaturedDots() {
if (!featuredDotsContainer) return;
const dots =
Array.from(
featuredDotsContainer.querySelectorAll(
".featured-dot"
)
);
dots.forEach(function (dot, index) {
dot.classList.toggle(
"active",
index === featuredRealIndex
);
});
}
function clearFeaturedClones() {
if (!featuredTrack) return;
featuredTrack
.querySelectorAll(".featured-clone")
.forEach(function (clone) {
clone.remove();
});
}
function buildFeaturedLoop() {
if (
!featuredSlider ||
!featuredSlides.length
) {
return;
}
if (!featuredTrack) {
featuredTrack =
document.createElement("div");
featuredTrack.className =
"featured-track";
featuredSlides.forEach(function (slide) {
featuredTrack.appendChild(slide);
});
featuredSlider.insertBefore(
featuredTrack,
featuredSlider.firstChild
);
} else {
clearFeaturedClones();
}
const visible =
getFeaturedVisibleCount();
featuredCloneCount =
Math.min(
visible,
featuredSlides.length
);
const before =
featuredSlides
.slice(-featuredCloneCount)
.map(function (slide) {
const clone =
slide.cloneNode(true);
clone.classList.add(
"featured-clone"
);
return clone;
})
.reverse();
const after =
featuredSlides
.slice(0, featuredCloneCount)
.map(function (slide) {
const clone =
slide.cloneNode(true);
clone.classList.add(
"featured-clone"
);
return clone;
});
before.forEach(function (clone) {
featuredTrack.insertBefore(
clone,
featuredTrack.firstChild
);
});
after.forEach(function (clone) {
featuredTrack.appendChild(clone);
});
featuredPosition =
featuredCloneCount +
featuredRealIndex;
featuredAnimating = false;
requestAnimationFrame(function () {
setFeaturedPosition(false);
updateFeaturedDots();
});
}
function setFeaturedPosition(animate) {
if (!featuredTrack) return;
featuredTrack.style.transition =
animate
? "transform .55s cubic-bezier(.22,.61,.36,1)"
: "none";
const step =
getFeaturedStep();
featuredTrack.style.transform =
"translate3d(" +
(-featuredPosition * step) +
"px,0,0)";
}
function nextFeaturedSlide() {
if (
featuredAnimating ||
!featuredSlides.length
) {
return;
}
featuredAnimating = true;
featuredPosition++;
setFeaturedPosition(true);
}
function previousFeaturedSlide() {
if (
featuredAnimating ||
!featuredSlides.length
) {
return;
}
featuredAnimating = true;
featuredPosition--;
setFeaturedPosition(true);
}
function goToFeatured(index) {
if (
featuredAnimating ||
!featuredSlides.length
) {
return;
}
index =
(
index %
featuredSlides.length +
featuredSlides.length
) %
featuredSlides.length;
featuredAnimating = true;
featuredRealIndex = index;
featuredPosition =
featuredCloneCount + index;
setFeaturedPosition(true);
updateFeaturedDots();
restartFeaturedAutoPlay();
}
function startFeaturedAutoPlay() {
clearInterval(featuredTimer);
if (
featuredSlides.length <=
getFeaturedVisibleCount()
) {
return;
}
featuredTimer =
setInterval(
function () {
nextFeaturedSlide();
},
4500
);
}
function restartFeaturedAutoPlay() {
startFeaturedAutoPlay();
}
if (
featuredSlider &&
featuredSlides.length
) {
createFeaturedDots();
buildFeaturedLoop();
if (featuredPrev) {
featuredPrev.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
previousFeaturedSlide();
restartFeaturedAutoPlay();
}
);
}
if (featuredNext) {
featuredNext.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
nextFeaturedSlide();
restartFeaturedAutoPlay();
}
);
}
if (featuredTrack) {
featuredTrack.addEventListener(
"transitionend",
function (event) {
if (
event.propertyName !==
"transform"
) {
return;
}
featuredAnimating = false;
const total =
featuredSlides.length;
const firstReal =
featuredCloneCount;
const lastReal =
featuredCloneCount +
total -
1;
if (
featuredPosition >
lastReal
) {
featuredRealIndex = 0;
featuredPosition =
firstReal;
setFeaturedPosition(false);
} else if (
featuredPosition <
firstReal
) {
featuredRealIndex =
total - 1;
featuredPosition =
firstReal +
total -
1;
setFeaturedPosition(false);
} else {
featuredRealIndex =
featuredPosition -
featuredCloneCount;
}
updateFeaturedDots();
}
);
}
featuredSlider.addEventListener(
"mouseenter",
function () {
clearInterval(featuredTimer);
}
);
featuredSlider.addEventListener(
"mouseleave",
function () {
startFeaturedAutoPlay();
}
);
let touchStartX = 0;
let touchStartY = 0;
featuredSlider.addEventListener(
"touchstart",
function (event) {
const touch =
event.changedTouches[0];
touchStartX =
touch.screenX;
touchStartY =
touch.screenY;
clearInterval(featuredTimer);
},
{
passive: true
}
);
featuredSlider.addEventListener(
"touchend",
function (event) {
const touch =
event.changedTouches[0];
const dx =
touchStartX -
touch.screenX;
const dy =
touchStartY -
touch.screenY;
if (
Math.abs(dx) > 40 &&
Math.abs(dx) >
Math.abs(dy)
) {
if (dx > 0) {
nextFeaturedSlide();
} else {
previousFeaturedSlide();
}
}
restartFeaturedAutoPlay();
},
{
passive: true
}
);
window.addEventListener(
"resize",
function () {
clearTimeout(
featuredResizeTimer
);
featuredResizeTimer =
setTimeout(
function () {
clearInterval(
featuredTimer
);
if (featuredTrack) {
featuredTrack.style.transition =
"none";
clearFeaturedClones();
}
featuredAnimating = false;
buildFeaturedLoop();
startFeaturedAutoPlay();
},
180
);
}
);
startFeaturedAutoPlay();
}
function scrollToCollectionTitle(behavior) {
const title = document.querySelector("#collection-title, .collection-title");
if (!title) return;
const offset = window.innerWidth <= 760 ? 58 : 72;
const top = title.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({
top: Math.max(0, top),
behavior: behavior || "smooth"
});
}
const menuButton =
document.querySelector(
".mobile-menu-toggle"
);
const nav =
document.querySelector("#main-nav");
if (menuButton && nav) {
menuButton.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
const isOpen =
nav.classList.toggle(
"mobile-open"
);
document.body.classList.toggle(
"menu-open",
isOpen
);
menuButton.setAttribute(
"aria-expanded",
isOpen ? "true" : "false"
);
}
);
nav.querySelectorAll("a")
.forEach(function (link) {
link.addEventListener(
"click",
function () {
nav.classList.remove(
"mobile-open"
);
document.body.classList.remove(
"menu-open"
);
menuButton.setAttribute(
"aria-expanded",
"false"
);
}
);
});
}
document.addEventListener(
"click",
function (event) {
if (window.innerWidth > 760) return;
if (!nav || !nav.classList.contains("mobile-open")) return;
if (event.target.closest(".mobile-menu-toggle")) {
return;
}
nav.classList.remove("mobile-open");
document.body.classList.remove("menu-open");
if (menuButton) {
menuButton.setAttribute(
"aria-expanded",
"false"
);
}
},
true
);
document
.querySelectorAll("#main-nav a[href^='#']")
.forEach(function (link) {
link.addEventListener("click", function (event) {
const id = link.getAttribute("href");
if (!id || id === "#") return;
const target = document.querySelector(id);
if (!target) return;
const aboutSection = document.querySelector("#about");
if (aboutSection) aboutSection.style.display = id === "#about" ? "block" : "none";
event.preventDefault();
event.stopPropagation();
if (id === "#collection-title") {
document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
nav.style.display = "flex";
});
const savedPage = Number(sessionStorage.getItem("decorevaPage")) || 1;
if (typeof decorevaShowPage === "function") {
window.decorevaPageNavigation = false;
decorevaShowPage(savedPage);
}
requestAnimationFrame(function () {
scrollToCollectionTitle("smooth");
});
} else if (id === "#home") {
clearAllCollectionFilters(false);
document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
nav.style.display = "flex";
});
history.replaceState(
null,
"",
window.location.pathname
);
window.scrollTo({
top: 0,
left: 0,
behavior: "smooth"
});
} else {
document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
nav.style.display = "flex";
});
(id === "#about"
? (target.querySelector(".about-heading") || target)
: target
).scrollIntoView({
behavior: "smooth",
block: "start"
});
history.replaceState(
null,
"",
id
);
}
nav.classList.remove("mobile-open");
document.body.classList.remove("menu-open");
if (menuButton) {
menuButton.setAttribute(
"aria-expanded",
"false"
);
}
});
});
document
.querySelectorAll(
'a[href="#home"]:not(#main-nav a)'
)
.forEach(function (link) {
link.addEventListener(
"click",
function (event) {
event.preventDefault();
clearAllCollectionFilters(false);
history.replaceState(
null,
"",
window.location.pathname
);
window.scrollTo({
top: 0,
left: 0,
behavior: "smooth"
});
}
);
});
const searchContainer =
document.querySelector(
".search-container"
);
const searchBox =
document.querySelector(
".search-box"
);
if (voiceSearchBtn) {
voiceSearchBtn.style.position = "absolute";
voiceSearchBtn.style.right = "13px";
voiceSearchBtn.style.top = "50%";
voiceSearchBtn.style.transform = "translateY(-50%)";
voiceSearchBtn.style.width = "32px";
voiceSearchBtn.style.height = "32px";
voiceSearchBtn.style.padding = "0";
voiceSearchBtn.style.margin = "0";
voiceSearchBtn.style.border = "0";
voiceSearchBtn.style.background = "transparent";
voiceSearchBtn.style.display = "flex";
voiceSearchBtn.style.alignItems = "center";
voiceSearchBtn.style.justifyContent = "center";
voiceSearchBtn.style.cursor = "pointer";
voiceSearchBtn.style.zIndex = "50";
}
document
.querySelectorAll(".slider-btn")
.forEach(function (button) {
button.addEventListener(
"click",
function (event) {
event.preventDefault();
event.stopPropagation();
}
);
});
document
.querySelectorAll("img")
.forEach(function (image) {
image.setAttribute(
"draggable",
"false"
);
});
if (!sliderObserver) {
document
.querySelectorAll("#collection-products .image-slider")
.forEach(function (slider) {
const images = getSliderImages(slider);
if (images.length) {
showSliderImage(
slider,
getSliderIndex(slider)
);
}
});
}
document.addEventListener(
"keydown",
function (event) {
if (
event.key === "Escape" &&
customSort
) {
customSort.classList.remove(
"open"
);
}
}
);
window.addEventListener(
"beforeunload",
function () {
clearInterval(
featuredTimer
);
}
);
let decorevaProducts = Array.from(
document.querySelectorAll("#collection-products .card")
);
const decorevaPerPage = 20;
const decorevaTotalPages = Math.max(
1,
Math.ceil(decorevaProducts.length / decorevaPerPage)
);
let decorevaCurrentPage = 1;
function decorevaPaginationStyle(nav) {
nav.style.display = "flex";
nav.style.justifyContent = "center";
nav.style.alignItems = "center";
nav.style.gap = "22px";
nav.style.margin = "28px 0";
nav.style.padding = "8px 0";
nav.style.fontFamily = "inherit";
}
function createDecorevaPagination() {
const nav = document.createElement("div");
nav.className = "decoreva-pagination";
decorevaPaginationStyle(nav);
const previous = document.createElement("button");
previous.type = "button";
previous.innerHTML = "‹";
previous.setAttribute(
"aria-label",
"Previous page"
);
previous.style.border = "none";
previous.style.background = "transparent";
previous.style.fontSize = "30px";
previous.style.lineHeight = "1";
previous.style.color = "#8b6a32";
previous.style.cursor = "pointer";
previous.style.padding = "4px 8px";
previous.style.fontWeight = "400";
previous.addEventListener(
"click",
function () {window.decorevaPageNavigation = true;
if (decorevaCurrentPage > 1) {
decorevaShowPage(
decorevaCurrentPage - 1
);
}
}
);
nav.appendChild(previous);
for (
let page = 1;
page <= decorevaTotalPages;
page++
) {
const number = document.createElement("button");
number.type = "button";
number.textContent = page;
number.dataset.page = page;
number.style.border = "none";
number.style.background = "transparent";
number.style.color = "#5a4630";
number.style.cursor = "pointer";
number.style.fontSize = "15px";
number.style.padding = "5px 4px";
number.style.minWidth = "24px";
number.style.fontWeight = "400";
number.addEventListener(
"click",
function () {window.decorevaPageNavigation = true;
decorevaShowPage(page);
}
);
nav.appendChild(number);
}
const next = document.createElement("button");
next.type = "button";
next.innerHTML = "›";
next.setAttribute(
"aria-label",
"Next page"
);
next.style.border = "none";
next.style.background = "transparent";
next.style.fontSize = "30px";
next.style.lineHeight = "1";
next.style.color = "#8b6a32";
next.style.cursor = "pointer";
next.style.padding = "4px 8px";
next.style.fontWeight = "400";
next.addEventListener(
"click",
function () {window.decorevaPageNavigation = true;
if (
decorevaCurrentPage <
decorevaTotalPages
) {
decorevaShowPage(
decorevaCurrentPage + 1
);
}
}
);
nav.appendChild(next);
return nav;
}
window.decorevaLoadVisibleSliders = function () {
const sliders =
document.querySelectorAll("#collection-products .image-slider");
sliders.forEach(function (slider) {
if (slider.closest(".card")?.style.display === "none") return;
const rect = slider.getBoundingClientRect();
if (
rect.bottom >= -250 &&
rect.top <= window.innerHeight + 250
) {
showSliderImage(slider, getSliderIndex(slider));
}
});
};
function decorevaShowPage(page) {
decorevaCurrentPage = page;
sessionStorage.setItem("decorevaPage", page);
const aboutSection = document.querySelector("#about");
if (aboutSection) aboutSection.style.display = "none";
const start =
(page - 1) * decorevaPerPage;
const end =
start + decorevaPerPage;
decorevaProducts.forEach(
function (card, index) {
card.style.setProperty(
"display",
index >= start && index < end
? "flex"
: "none",
"important"
);
}
);
if (typeof window.decorevaLoadVisibleSliders === "function") {
window.decorevaLoadVisibleSliders();
}
if (window.decorevaPageNavigation) {
requestAnimationFrame(function () {
scrollToCollectionTitle("auto");
});
}
document
.querySelectorAll(
".decoreva-pagination"
)
.forEach(
function (nav) {
const buttons =
nav.querySelectorAll(
"button"
);
buttons.forEach(
function (button) {
if (
button.dataset.page
) {
const isActive =
Number(
button.dataset.page
) === page;
if (isActive) {
button.style.color =
"#b98218";
button.style.fontWeight =
"700";
button.style.borderBottom =
"2px solid #b98218";
} else {
button.style.color =
"#5a4630";
button.style.fontWeight =
"400";
button.style.borderBottom =
"2px solid transparent";
}
}
}
);
const previousButton =
buttons[0];
const nextButton =
buttons[buttons.length - 1];
if (page === 1) {
previousButton.disabled = true;
previousButton.style.opacity = "0.25";
previousButton.style.cursor =
"default";
} else {
previousButton.disabled = false;
previousButton.style.opacity = "1";
previousButton.style.cursor =
"pointer";
}
if (
page === decorevaTotalPages
) {
nextButton.disabled = true;
nextButton.style.opacity = "0.25";
nextButton.style.cursor =
"default";
} else {
nextButton.disabled = false;
nextButton.style.opacity = "1";
nextButton.style.cursor =
"pointer";
}
}
);
}
const decorevaGrid =
document.querySelector(
"#collection-products"
);
if (
decorevaGrid &&
decorevaProducts.length > 0
) {
decorevaGrid.parentNode
.querySelectorAll(".decoreva-pagination")
.forEach(function (nav) {
nav.remove();
});
const paginationAbove =
createDecorevaPagination();
const paginationBelow =
createDecorevaPagination();
decorevaGrid.parentNode.insertBefore(
paginationAbove,
decorevaGrid
);
decorevaGrid.insertAdjacentElement(
"afterend",
paginationBelow
);
const savedPage =
Number(sessionStorage.getItem("decorevaPage")) || 1;
decorevaShowPage(savedPage);
}
const decorevaVariationProducts = {
"happy-place-1": {
defaultVariation: "black",
variations: {
"black": {
price: "₹299",
size: "Size: 12 × 7 inch (Approx.)",
amazon: "https://amzn.in/d/0bqU4Xuu",
whatsapp: "This Is My Happy Place MDF Wallart - Black",
images: [
"images/Thisismyhappyplace_Black_01.webp",
"images/Thisismyhappyplace_Black_02.webp",
"images/Thisismyhappyplace_Black_03.webp",
"images/Thisismyhappyplace_Black_04.webp",
"images/Thisismyhappyplace_Black_05.webp",
"images/Thisismyhappyplace_Black_06.webp",
"images/Thisismyhappyplace_Black_07.webp",
"images/Thisismyhappyplace_Black_08.webp",
"images/Thisismyhappyplace_Black_09.webp"
]
},
"red": {
price: "₹299",
size: "Size: 12 × 7 inch (Approx.)",
amazon: "https://amzn.in/d/06FvVbYg",
whatsapp: "This Is My Happy Place MDF Wallart - Red",
images: [
"images/Thisismyhappyplace_Red_01.webp",
"images/Thisismyhappyplace_Red_02.webp",
"images/Thisismyhappyplace_Red_03.webp",
"images/Thisismyhappyplace_Red_04.webp",
"images/Thisismyhappyplace_Red_05.webp",
"images/Thisismyhappyplace_Red_06.webp",
"images/Thisismyhappyplace_Red_07.webp",
"images/Thisismyhappyplace_Red_08.webp",
"images/Thisismyhappyplace_Red_09.webp"
]
}
}
},
"radha-krishna-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/005U5hmW",
whatsapp: "Radha Krishna Small Temple 2 - Brown Small",
images: [
"images/Radha Krishna Temple_02_Small_Brown_01.webp",
"images/Radha Krishna Temple_02_Small_Brown_02.webp",
"images/Radha Krishna Temple_02_Small_Brown_03.webp",
"images/Radha Krishna Temple_02_Small_Brown_04.webp",
"images/Radha Krishna Temple_02_Small_Brown_05.webp",
"images/Radha Krishna Temple_02_Small_Brown_06.webp",
"images/Radha Krishna Temple_02_Small_Brown_07.webp",
"images/Radha Krishna Temple_02_Small_Brown_08.webp",
"images/Radha Krishna Temple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0aHi7S4O",
whatsapp: "Radha Krishna Small Temple 2 - Brown Big",
images: [
"images/Radha Krishna Temple_02_Big_Brown_01.webp",
"images/Radha Krishna Temple_02_Big_Brown_02.webp",
"images/Radha Krishna Temple_02_Big_Brown_03.webp",
"images/Radha Krishna Temple_02_Big_Brown_04.webp",
"images/Radha Krishna Temple_02_Big_Brown_05.webp",
"images/Radha Krishna Temple_02_Big_Brown_06.webp",
"images/Radha Krishna Temple_02_Big_Brown_07.webp",
"images/Radha Krishna Temple_02_Big_Brown_08.webp",
"images/Radha Krishna Temple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0c7WcRdE",
whatsapp: "Radha Krishna Small Temple 2 - Dark Brown Small",
images: [
"images/Radha Krishna Temple_02_Small_Darkbrown_01.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_02.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_03.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_04.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_05.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_06.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_07.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_08.webp",
"images/Radha Krishna Temple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0cIsHZ0d",
whatsapp: "Radha Krishna Small Temple 2 - Dark Brown Big",
images: [
"images/Radha Krishna Temple_02_Big_Darkbrown_01.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_02.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_03.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_04.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_05.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_06.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_07.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_08.webp",
"images/Radha Krishna Temple_02_Big_Darkbrown_09.webp"
]
}
}
},
"radha-krishna-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0412ozF3",
whatsapp: "Radha Krishna Small Temple - Brown Small",
images: [
"images/Radha Krishna Temple_01_Small_Brown_01.webp",
"images/Radha Krishna Temple_01_Small_Brown_02.webp",
"images/Radha Krishna Temple_01_Small_Brown_03.webp",
"images/Radha Krishna Temple_01_Small_Brown_04.webp",
"images/Radha Krishna Temple_01_Small_Brown_05.webp",
"images/Radha Krishna Temple_01_Small_Brown_06.webp",
"images/Radha Krishna Temple_01_Small_Brown_07.webp",
"images/Radha Krishna Temple_01_Small_Brown_08.webp",
"images/Radha Krishna Temple_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/03VyLAM6",
whatsapp: "Radha Krishna Small Temple - Brown Big",
images: [
"images/Radha Krishna Temple_01_Big_Brown_01.webp",
"images/Radha Krishna Temple_01_Big_Brown_02.webp",
"images/Radha Krishna Temple_01_Big_Brown_03.webp",
"images/Radha Krishna Temple_01_Big_Brown_04.webp",
"images/Radha Krishna Temple_01_Big_Brown_05.webp",
"images/Radha Krishna Temple_01_Big_Brown_06.webp",
"images/Radha Krishna Temple_01_Big_Brown_07.webp",
"images/Radha Krishna Temple_01_Big_Brown_08.webp",
"images/Radha Krishna Temple_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0iF4jE0x",
whatsapp: "Radha Krishna Small Temple - Dark Brown Small",
images: [
"images/Radha Krishna Temple_01_Small_Darkbrown_01.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_02.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_03.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_04.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_05.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_06.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_07.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_08.webp",
"images/Radha Krishna Temple_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/08WY03U0",
whatsapp: "Radha Krishna Small Temple - Dark Brown Big",
images: [
"images/Radha Krishna Temple_01_Big_Darkbrown_01.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_02.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_03.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_04.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_05.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_06.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_07.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_08.webp",
"images/Radha Krishna Temple_01_Big_Darkbrown_09.webp"
]
}
}
},
"lakshmi-ganesha-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0dZPplNw",
whatsapp: "Lakshmi Ganesha Small Temple - Brown Small",
images: [
"images/Lakshmi Ganesha_Temple_Small_Brown_01.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_02.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_03.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_04.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_05.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_06.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_07.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_08.webp",
"images/Lakshmi Ganesha_Temple_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/04y60sk1",
whatsapp: "Lakshmi Ganesha Small Temple - Brown Big",
images: [
"images/Lakshmi Ganesha_Temple_Big_Brown_01.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_02.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_03.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_04.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_05.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_06.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_07.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_08.webp",
"images/Lakshmi Ganesha_Temple_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/01CKyfSY",
whatsapp: "Lakshmi Ganesha Small Temple - Dark Brown Small",
images: [
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_01.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_02.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_03.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_04.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_05.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_06.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_07.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_08.webp",
"images/Lakshmi Ganesha_Temple_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0654Yb37",
whatsapp: "Lakshmi Ganesha Small Temple - Dark Brown Big",
images: [
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_01.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_02.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_03.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_04.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_05.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_06.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_07.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_08.webp",
"images/Lakshmi Ganesha_Temple_Big_Darkbrown_09.webp"
]
}
}
},
"sherawali-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0hKdqLAl",
whatsapp: "Sherawali Mata Temple - Brown Small",
images: [
"images/Sherawalimatatemple_01_Small_Brown.webp",
"images/Sherawalimatatemple_02_Small_Brown.webp",
"images/Sherawalimatatemple_03_Small_Brown.webp",
"images/Sherawalimatatemple_04_Small_Brown.webp",
"images/Sherawalimatatemple_05_Small_Brown.webp",
"images/Sherawalimatatemple_06_Small_Brown.webp",
"images/Sherawalimatatemple_07_Small_Brown.webp",
"images/Sherawalimatatemple_08_Small_Brown.webp",
"images/Sherawalimatatemple_09_Small_Brown.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/09hyu0US",
whatsapp: "Sherawali Mata Temple - Brown Big",
images: [
"images/Sherawalimatatemple_01_Big_Brown.webp",
"images/Sherawalimatatemple_02_Big_Brown.webp",
"images/Sherawalimatatemple_03_Big_Brown.webp",
"images/Sherawalimatatemple_04_Big_Brown.webp",
"images/Sherawalimatatemple_05_Big_Brown.webp",
"images/Sherawalimatatemple_06_Big_Brown.webp",
"images/Sherawalimatatemple_07_Big_Brown.webp",
"images/Sherawalimatatemple_08_Big_Brown.webp",
"images/Sherawalimatatemple_09_Big_Brown.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/08DePxbl",
whatsapp: "Sherawali Mata Temple - Dark Brown Small",
images: [
"images/Sherawalimatatemple_01_Small_Darkbrown.webp",
"images/Sherawalimatatemple_02_Small_Darkbrown.webp",
"images/Sherawalimatatemple_03_Small_Darkbrown.webp",
"images/Sherawalimatatemple_04_Small_Darkbrown.webp",
"images/Sherawalimatatemple_05_Small_Darkbrown.webp",
"images/Sherawalimatatemple_06_Small_Darkbrown.webp",
"images/Sherawalimatatemple_07_Small_Darkbrown.webp",
"images/Sherawalimatatemple_08_Small_Darkbrown.webp",
"images/Sherawalimatatemple_09_Small_Darkbrown.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/03Rcbh9e",
whatsapp: "Sherawali Mata Temple - Dark Brown Big",
images: [
"images/Sherawalimatatemple_01_Big_DarkBrown.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown.webp",
"images/Sherawalimatatemple_03_Big_DarkBrown.webp",
"images/Sherawalimatatemple_04_Big_DarkBrown.webp",
"images/Sherawalimatatemple_05_Big_DarkBrown.webp",
"images/Sherawalimatatemple_06_Big_DarkBrown.webp",
"images/Sherawalimatatemple_07_Big_DarkBrown.webp",
"images/Sherawalimatatemple_08_Big_DarkBrown.webp",
"images/Sherawalimatatemple_09_Big_DarkBrown.webp"
]
}
}
},
"sherawali-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0arqThT9",
whatsapp: "Sherawali Mata Temple 2 - Brown Small",
images: [
"images/Sherawalimatatemple_02_Small_Brown_01.webp",
"images/Sherawalimatatemple_02_Small_Brown_02.webp",
"images/Sherawalimatatemple_02_Small_Brown_03.webp",
"images/Sherawalimatatemple_02_Small_Brown_04.webp",
"images/Sherawalimatatemple_02_Small_Brown_05.webp",
"images/Sherawalimatatemple_02_Small_Brown_06.webp",
"images/Sherawalimatatemple_02_Small_Brown_07.webp",
"images/Sherawalimatatemple_02_Small_Brown_08.webp",
"images/Sherawalimatatemple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/03E4xYH5",
whatsapp: "Sherawali Mata Temple 2 - Brown Big",
images: [
"images/Sherawalimatatemple_02_Big_Brown_01.webp",
"images/Sherawalimatatemple_02_Big_Brown_02.webp",
"images/Sherawalimatatemple_02_Big_Brown_03.webp",
"images/Sherawalimatatemple_02_Big_Brown_04.webp",
"images/Sherawalimatatemple_02_Big_Brown_05.webp",
"images/Sherawalimatatemple_02_Big_Brown_06.webp",
"images/Sherawalimatatemple_02_Big_Brown_07.webp",
"images/Sherawalimatatemple_02_Big_Brown_08.webp",
"images/Sherawalimatatemple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0dj2Lz3c",
whatsapp: "Sherawali Mata Temple 2 - Dark Brown Small",
images: [
"images/Sherawalimatatemple_02_Small_Darkrown_01.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_02.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_03.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_04.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_05.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_06.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_07.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_08.webp",
"images/Sherawalimatatemple_02_Small_Darkrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0cGv5Z1p",
whatsapp: "Sherawali Mata Temple 2 - Dark Brown Big",
images: [
"images/Sherawalimatatemple_02_Big_DarkBrown_01.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_02.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_03.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_04.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_05.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_06.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_07.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_08.webp",
"images/Sherawalimatatemple_02_Big_DarkBrown_09.webp"
]
}
}
},
"sherawali-3": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0izsug2U",
whatsapp: "Sherawali Mata Temple 3 - Brown Small",
images: [
"images/Sherawalimata_03_Small_Brown_01.webp",
"images/Sherawalimata_03_Small_Brown_02.webp",
"images/Sherawalimata_03_Small_Brown_03.webp",
"images/Sherawalimata_03_Small_Brown_04.webp",
"images/Sherawalimata_03_Small_Brown_05.webp",
"images/Sherawalimata_03_Small_Brown_06.webp",
"images/Sherawalimata_03_Small_Brown_07.webp",
"images/Sherawalimata_03_Small_Brown_08.webp",
"images/Sherawalimata_03_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0fajTDks",
whatsapp: "Sherawali Mata Temple 3 - Brown Big",
images: [
"images/Sherawalimata_03_Big_Brown_01.webp",
"images/Sherawalimata_03_Big_Brown_02.webp",
"images/Sherawalimata_03_Big_Brown_03.webp",
"images/Sherawalimata_03_Big_Brown_04.webp",
"images/Sherawalimata_03_Big_Brown_05.webp",
"images/Sherawalimata_03_Big_Brown_06.webp",
"images/Sherawalimata_03_Big_Brown_07.webp",
"images/Sherawalimata_03_Big_Brown_08.webp",
"images/Sherawalimata_03_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0fiWhSdI",
whatsapp: "Sherawali Mata Temple 3 - Dark Brown Small",
images: [
"images/Sherawalimata_03_Small_Darkbrown_01.webp",
"images/Sherawalimata_03_Small_Darkbrown_02.webp",
"images/Sherawalimata_03_Small_Darkbrown_03.webp",
"images/Sherawalimata_03_Small_Darkbrown_04.webp",
"images/Sherawalimata_03_Small_Darkbrown_05.webp",
"images/Sherawalimata_03_Small_Darkbrown_06.webp",
"images/Sherawalimata_03_Small_Darkbrown_07.webp",
"images/Sherawalimata_03_Small_Darkbrown_08.webp",
"images/Sherawalimata_03_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0cL2sOsj",
whatsapp: "Sherawali Mata Temple 3 - Dark Brown Big",
images: [
"images/Sherawalimata_03_Big_Darkbrown_01.webp",
"images/Sherawalimata_03_Big_Darkbrown_02.webp",
"images/Sherawalimata_03_Big_Darkbrown_03.webp",
"images/Sherawalimata_03_Big_Darkbrown_04.webp",
"images/Sherawalimata_03_Big_Darkbrown_05.webp",
"images/Sherawalimata_03_Big_Darkbrown_06.webp",
"images/Sherawalimata_03_Big_Darkbrown_07.webp",
"images/Sherawalimata_03_Big_Darkbrown_08.webp",
"images/Sherawalimata_03_Big_Darkbrown_09.webp"
]
}
}
},
"sherawali-4": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0gfODZNB",
whatsapp: "Sherawali Mata Temple 4 - Brown Small",
images: [
"images/Sherawalimata Temple_04_Small_Brown_01.webp",
"images/Sherawalimata Temple_04_Small_Brown_02.webp",
"images/Sherawalimata Temple_04_Small_Brown_03.webp",
"images/Sherawalimata Temple_04_Small_Brown_04.webp",
"images/Sherawalimata Temple_04_Small_Brown_05.webp",
"images/Sherawalimata Temple_04_Small_Brown_06.webp",
"images/Sherawalimata Temple_04_Small_Brown_07.webp",
"images/Sherawalimata Temple_04_Small_Brown_08.webp",
"images/Sherawalimata Temple_04_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0a1tvQM1",
whatsapp: "Sherawali Mata Temple 4 - Brown Big",
images: [
"images/Sherawalimata Temple_04_Big_Brown_01.webp",
"images/Sherawalimata Temple_04_Big_Brown_02.webp",
"images/Sherawalimata Temple_04_Big_Brown_03.webp",
"images/Sherawalimata Temple_04_Big_Brown_04.webp",
"images/Sherawalimata Temple_04_Big_Brown_05.webp",
"images/Sherawalimata Temple_04_Big_Brown_06.webp",
"images/Sherawalimata Temple_04_Big_Brown_07.webp",
"images/Sherawalimata Temple_04_Big_Brown_08.webp",
"images/Sherawalimata Temple_04_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/05l1jM6H",
whatsapp: "Sherawali Mata Temple 4 - Dark Brown Small",
images: [
"images/Sherawalimata Temple_04_Small_Darkbrown_01.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_02.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_03.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_04.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_05.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_06.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_07.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_08.webp",
"images/Sherawalimata Temple_04_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0f5J7uWW",
whatsapp: "Sherawali Mata Temple 4 - Dark Brown Big",
images: [
"images/Sherawalimata Temple_04_Big_Darkbrown_01.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_02.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_03.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_04.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_05.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_06.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_07.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_08.webp",
"images/Sherawalimata Temple_04_Big_Darkbrown_09.webp"
]
}
}
},
"shiv-parvati-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0b5XcQw3",
whatsapp: "Shiv Parvati Temple - Brown Small",
images: [
"images/Shivparvatitemple_01_Small_Brown_01.webp",
"images/Shivparvatitemple_01_Small_Brown_02.webp",
"images/Shivparvatitemple_01_Small_Brown_03.webp",
"images/Shivparvatitemple_01_Small_Brown_04.webp",
"images/Shivparvatitemple_01_Small_Brown_05.webp",
"images/Shivparvatitemple_01_Small_Brown_06.webp",
"images/Shivparvatitemple_01_Small_Brown_07.webp",
"images/Shivparvatitemple_01_Small_Brown_08.webp",
"images/Shivparvatitemple_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/03cwZ8fE",
whatsapp: "Shiv Parvati Temple - Brown Big",
images: [
"images/Shivparvatitemple_01_Big_Brown_01.webp",
"images/Shivparvatitemple_01_Big_Brown_02.webp",
"images/Shivparvatitemple_01_Big_Brown_03.webp",
"images/Shivparvatitemple_01_Big_Brown_04.webp",
"images/Shivparvatitemple_01_Big_Brown_05.webp",
"images/Shivparvatitemple_01_Big_Brown_06.webp",
"images/Shivparvatitemple_01_Big_Brown_07.webp",
"images/Shivparvatitemple_01_Big_Brown_08.webp",
"images/Shivparvatitemple_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/03ersPUv",
whatsapp: "Shiv Parvati Temple - Dark Brown Small",
images: [
"images/Shivparvatitemple_01_Small_Darkbrown_01.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_02.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_03.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_04.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_05.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_06.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_07.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_08.webp",
"images/Shivparvatitemple_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/03hAJP4O",
whatsapp: "Shiv Parvati Temple - Dark Brown Big",
images: [
"images/Shivparvatitemple_01_Big_Darkbrown_01.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_02.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_03.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_04.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_05.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_06.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_07.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_08.webp",
"images/Shivparvatitemple_01_Big_Darkbrown_09.webp"
]
}
}
},
"shiv-parvati-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0hYVylr1",
whatsapp: "Shiv Parvati Small Temple 2 - Brown Small",
images: [
"images/ShivParvatitemple_02_Small_Brown_01.webp",
"images/ShivParvatitemple_02_Small_Brown_02.webp",
"images/ShivParvatitemple_02_Small_Brown_03.webp",
"images/ShivParvatitemple_02_Small_Brown_04.webp",
"images/ShivParvatitemple_02_Small_Brown_05.webp",
"images/ShivParvatitemple_02_Small_Brown_06.webp",
"images/ShivParvatitemple_02_Small_Brown_07.webp",
"images/ShivParvatitemple_02_Small_Brown_08.webp",
"images/ShivParvatitemple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/02CrHlvJ",
whatsapp: "Shiv Parvati Small Temple 2 - Brown Big",
images: [
"images/ShivParvatitemple_02_Big_Brown_01.webp",
"images/ShivParvatitemple_02_Big_Brown_02.webp",
"images/ShivParvatitemple_02_Big_Brown_03.webp",
"images/ShivParvatitemple_02_Big_Brown_04.webp",
"images/ShivParvatitemple_02_Big_Brown_05.webp",
"images/ShivParvatitemple_02_Big_Brown_06.webp",
"images/ShivParvatitemple_02_Big_Brown_07.webp",
"images/ShivParvatitemple_02_Big_Brown_08.webp",
"images/ShivParvatitemple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/03uf1aPo",
whatsapp: "Shiv Parvati Small Temple 2 - Dark Brown Small",
images: [
"images/ShivParvatitemple_02_Small_Darkbrown_01.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_02.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_03.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_04.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_05.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_06.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_07.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_08.webp",
"images/ShivParvatitemple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/02XBU4Gd",
whatsapp: "Shiv Parvati Small Temple 2 - Dark Brown Big",
images: [
"images/ShivParvatitemple_02_Big_Darkbrown_01.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_02.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_03.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_04.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_05.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_06.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_07.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_08.webp",
"images/ShivParvatitemple_02_Big_Darkbrown_09.webp"
]
}
}
},
"shiv-parvati-3": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0f1drRls",
whatsapp: "Shiv Parvati Temple 3 - Brown Small",
images: [
"images/Shivparvatitemple_03_Small_Brown_01.webp",
"images/Shivparvatitemple_03_Small_Brown_02.webp",
"images/Shivparvatitemple_03_Small_Brown_03.webp",
"images/Shivparvatitemple_03_Small_Brown_04.webp",
"images/Shivparvatitemple_03_Small_Brown_05.webp",
"images/Shivparvatitemple_03_Small_Brown_06.webp",
"images/Shivparvatitemple_03_Small_Brown_07.webp",
"images/Shivparvatitemple_03_Small_Brown_08.webp",
"images/Shivparvatitemple_03_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/05o5nTgm",
whatsapp: "Shiv Parvati Temple 3 - Brown Big",
images: [
"images/Shivparvatitemple_03_Big_Brown_01.webp",
"images/Shivparvatitemple_03_Big_Brown_02.webp",
"images/Shivparvatitemple_03_Big_Brown_03.webp",
"images/Shivparvatitemple_03_Big_Brown_04.webp",
"images/Shivparvatitemple_03_Big_Brown_05.webp",
"images/Shivparvatitemple_03_Big_Brown_06.webp",
"images/Shivparvatitemple_03_Big_Brown_07.webp",
"images/Shivparvatitemple_03_Big_Brown_08.webp",
"images/Shivparvatitemple_03_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0bjseaa9",
whatsapp: "Shiv Parvati Temple 3 - Dark Brown Small",
images: [
"images/Shivparvatitemple_03_Small_Darkbrown_01.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_02.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_03.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_04.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_05.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_06.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_07.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_08.webp",
"images/Shivparvatitemple_03_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/05Q5QwZF",
whatsapp: "Shiv Parvati Temple 3 - Dark Brown Big",
images: [
"images/Shivparvatitemple_03_Big_Darkbrown_01.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_02.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_03.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_04.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_05.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_06.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_07.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_08.webp",
"images/Shivparvatitemple_03_Big_Darkbrown_09.webp"
]
}
}
},
"shiva-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0bhOrhrA",
whatsapp: "Shiva Small Temple - Brown Small",
images: [
"images/Shivatemple_Small_Brown_01.webp",
"images/Shivatemple_Small_Brown_02.webp",
"images/Shivatemple_Small_Brown_03.webp",
"images/Shivatemple_Small_Brown_04.webp",
"images/Shivatemple_Small_Brown_05.webp",
"images/Shivatemple_Small_Brown_06.webp",
"images/Shivatemple_Small_Brown_07.webp",
"images/Shivatemple_Small_Brown_08.webp",
"images/Shivatemple_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0gGYOUAX",
whatsapp: "Shiva Small Temple - Brown Big",
images: [
"images/Shivatemple_Big_Brown_01.webp",
"images/Shivatemple_Big_Brown_02.webp",
"images/Shivatemple_Big_Brown_03.webp",
"images/Shivatemple_Big_Brown_04.webp",
"images/Shivatemple_Big_Brown_05.webp",
"images/Shivatemple_Big_Brown_06.webp",
"images/Shivatemple_Big_Brown_07.webp",
"images/Shivatemple_Big_Brown_08.webp",
"images/Shivatemple_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/09BhbjJ1",
whatsapp: "Shiva Small Temple - Dark Brown Small",
images: [
"images/Shivatemple_Small_Darkrown_01.webp",
"images/Shivatemple_Small_Darkrown_02.webp",
"images/Shivatemple_Small_Darkrown_03.webp",
"images/Shivatemple_Small_Darkrown_04.webp",
"images/Shivatemple_Small_Darkrown_05.webp",
"images/Shivatemple_Small_Darkrown_06.webp",
"images/Shivatemple_Small_Darkrown_07.webp",
"images/Shivatemple_Small_Darkrown_08.webp",
"images/Shivatemple_Small_Darkrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/08soQzMu",
whatsapp: "Shiva Small Temple - Dark Brown Big",
images: [
"images/Shivatemple_Big_Darkrown_01.webp",
"images/Shivatemple_Big_Darkrown_02.webp",
"images/Shivatemple_Big_Darkrown_03.webp",
"images/Shivatemple_Big_Darkrown_04.webp",
"images/Shivatemple_Big_Darkrown_05.webp",
"images/Shivatemple_Big_Darkrown_06.webp",
"images/Shivatemple_Big_Darkrown_07.webp",
"images/Shivatemple_Big_Darkrown_08.webp",
"images/Shivatemple_Big_Darkrown_09.webp"
]
}
}
},
"siyaram-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/05tK8gJy",
whatsapp: "Siyaram Small Temple - Brown Small",
images: [
"images/Siyaramtemple_01_Small_Brown_01.webp",
"images/Siyaramtemple_01_Small_Brown_02.webp",
"images/Siyaramtemple_01_Small_Brown_03.webp",
"images/Siyaramtemple_01_Small_Brown_04.webp",
"images/Siyaramtemple_01_Small_Brown_05.webp",
"images/Siyaramtemple_01_Small_Brown_06.webp",
"images/Siyaramtemple_01_Small_Brown_07.webp",
"images/Siyaramtemple_01_Small_Brown_08.webp",
"images/Siyaramtemple_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/06I1Y8Ry",
whatsapp: "Siyaram Small Temple - Brown Big",
images: [
"images/Siyaramtemple_01_Big_Brown_01.webp",
"images/Siyaramtemple_01_Big_Brown_02.webp",
"images/Siyaramtemple_01_Big_Brown_03.webp",
"images/Siyaramtemple_01_Big_Brown_04.webp",
"images/Siyaramtemple_01_Big_Brown_05.webp",
"images/Siyaramtemple_01_Big_Brown_06.webp",
"images/Siyaramtemple_01_Big_Brown_07.webp",
"images/Siyaramtemple_01_Big_Brown_08.webp",
"images/Siyaramtemple_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/05WrvCs0",
whatsapp: "Siyaram Small Temple - Dark Brown Small",
images: [
"images/Siyaramtemple_01_Small_Darkbrown_01.webp",
"images/Siyaramtemple_01_Small_Darkbrown_02.webp",
"images/Siyaramtemple_01_Small_Darkbrown_03.webp",
"images/Siyaramtemple_01_Small_Darkbrown_04.webp",
"images/Siyaramtemple_01_Small_Darkbrown_05.webp",
"images/Siyaramtemple_01_Small_Darkbrown_06.webp",
"images/Siyaramtemple_01_Small_Darkbrown_07.webp",
"images/Siyaramtemple_01_Small_Darkbrown_08.webp",
"images/Siyaramtemple_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/09BSNNbN",
whatsapp: "Siyaram Small Temple - Dark Brown Big",
images: [
"images/Siyaramtemple_01_Big_Darkbrown_01.webp",
"images/Siyaramtemple_01_Big_Darkbrown_02.webp",
"images/Siyaramtemple_01_Big_Darkbrown_03.webp",
"images/Siyaramtemple_01_Big_Darkbrown_04.webp",
"images/Siyaramtemple_01_Big_Darkbrown_05.webp",
"images/Siyaramtemple_01_Big_Darkbrown_06.webp",
"images/Siyaramtemple_01_Big_Darkbrown_07.webp",
"images/Siyaramtemple_01_Big_Darkbrown_08.webp",
"images/Siyaramtemple_01_Big_Darkbrown_09.webp"
]
}
}
},
"siyaram-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0357ndZq",
whatsapp: "Siyaram Small Temple 2 - Brown Small",
images: [
"images/Siyaramtemple_02_Small_Brown_01.webp",
"images/Siyaramtemple_02_Small_Brown_02.webp",
"images/Siyaramtemple_02_Small_Brown_03.webp",
"images/Siyaramtemple_02_Small_Brown_04.webp",
"images/Siyaramtemple_02_Small_Brown_05.webp",
"images/Siyaramtemple_02_Small_Brown_06.webp",
"images/Siyaramtemple_02_Small_Brown_07.webp",
"images/Siyaramtemple_02_Small_Brown_08.webp",
"images/Siyaramtemple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0cIg1mVm",
whatsapp: "Siyaram Small Temple 2 - Brown Big",
images: [
"images/Siyaramtemple_02_Big_Brown_01.webp",
"images/Siyaramtemple_02_Big_Brown_02.webp",
"images/Siyaramtemple_02_Big_Brown_03.webp",
"images/Siyaramtemple_02_Big_Brown_04.webp",
"images/Siyaramtemple_02_Big_Brown_05.webp",
"images/Siyaramtemple_02_Big_Brown_06.webp",
"images/Siyaramtemple_02_Big_Brown_07.webp",
"images/Siyaramtemple_02_Big_Brown_08.webp",
"images/Siyaramtemple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0e9dbVWa",
whatsapp: "Siyaram Small Temple 2 - Dark Brown Small",
images: [
"images/Siyaramtemple_02_Small_Darkbrown_01.webp",
"images/Siyaramtemple_02_Small_Darkbrown_02.webp",
"images/Siyaramtemple_02_Small_Darkbrown_03.webp",
"images/Siyaramtemple_02_Small_Darkbrown_04.webp",
"images/Siyaramtemple_02_Small_Darkbrown_05.webp",
"images/Siyaramtemple_02_Small_Darkbrown_06.webp",
"images/Siyaramtemple_02_Small_Darkbrown_07.webp",
"images/Siyaramtemple_02_Small_Darkbrown_08.webp",
"images/Siyaramtemple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0401KVZ2",
whatsapp: "Siyaram Small Temple 2 - Dark Brown Big",
images: [
"images/Siyaramtemple_02_Big_Darkbrown_01.webp",
"images/Siyaramtemple_02_Big_Darkbrown_02.webp",
"images/Siyaramtemple_02_Big_Darkbrown_03.webp",
"images/Siyaramtemple_02_Big_Darkbrown_04.webp",
"images/Siyaramtemple_02_Big_Darkbrown_05.webp",
"images/Siyaramtemple_02_Big_Darkbrown_06.webp",
"images/Siyaramtemple_02_Big_Darkbrown_07.webp",
"images/Siyaramtemple_02_Big_Darkbrown_08.webp",
"images/Siyaramtemple_02_Big_Darkbrown_09.webp"
]
}
}
},
"ganesha-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/07GtndwV",
whatsapp: "Ganesha Small Temple 2 - Brown Small",
images: [
"images/Ganesha_01_Small_Brown_01.webp",
"images/Ganesha_01_Small_Brown_02.webp",
"images/Ganesha_01_Small_Brown_03.webp",
"images/Ganesha_01_Small_Brown_04.webp",
"images/Ganesha_01_Small_Brown_05.webp",
"images/Ganesha_01_Small_Brown_06.webp",
"images/Ganesha_01_Small_Brown_07.webp",
"images/Ganesha_01_Small_Brown_08.webp",
"images/Ganesha_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/00a4ejCY",
whatsapp: "Ganesha Small Temple 2 - Brown Big",
images: [
"images/Ganesha_01_Big_Brown_01.webp",
"images/Ganesha_01_Big_Brown_02.webp",
"images/Ganesha_01_Big_Brown_03.webp",
"images/Ganesha_01_Big_Brown_04.webp",
"images/Ganesha_01_Big_Brown_05.webp",
"images/Ganesha_01_Big_Brown_06.webp",
"images/Ganesha_01_Big_Brown_07.webp",
"images/Ganesha_01_Big_Brown_08.webp",
"images/Ganesha_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0j0ORVEp",
whatsapp: "Ganesha Small Temple 2 - Dark Brown Small",
images: [
"images/Ganesha_01_Small_Darkbrown_01.webp",
"images/Ganesha_01_Small_Darkbrown_02.webp",
"images/Ganesha_01_Small_Darkbrown_03.webp",
"images/Ganesha_01_Small_Darkbrown_04.webp",
"images/Ganesha_01_Small_Darkbrown_05.webp",
"images/Ganesha_01_Small_Darkbrown_06.webp",
"images/Ganesha_01_Small_Darkbrown_07.webp",
"images/Ganesha_01_Small_Darkbrown_08.webp",
"images/Ganesha_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/05AU3mcR",
whatsapp: "Ganesha Small Temple 2 - Dark Brown Big",
images: [
"images/Ganesha_01_Big_Darkbrown_01.webp",
"images/Ganesha_01_Big_Darkbrown_02.webp",
"images/Ganesha_01_Big_Darkbrown_03.webp",
"images/Ganesha_01_Big_Darkbrown_04.webp",
"images/Ganesha_01_Big_Darkbrown_05.webp",
"images/Ganesha_01_Big_Darkbrown_06.webp",
"images/Ganesha_01_Big_Darkbrown_07.webp",
"images/Ganesha_01_Big_Darkbrown_08.webp",
"images/Ganesha_01_Big_Darkbrown_09.webp"
]
}
}
},
"hanuman-1": {
defaultVariation: "brown-small",
variations: {
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/09fx0mfl",
whatsapp: "Hanuman Small Temple 2 - Dark Brown Small",
images: [
"images/Hanuman_01_Small_Darkbrown_01.webp",
"images/Hanuman_01_Small_Darkbrown_02.webp",
"images/Hanuman_01_Small_Darkbrown_03.webp",
"images/Hanuman_01_Small_Darkbrown_04.webp",
"images/Hanuman_01_Small_Darkbrown_05.webp",
"images/Hanuman_01_Small_Darkbrown_06.webp",
"images/Hanuman_01_Small_Darkbrown_07.webp",
"images/Hanuman_01_Small_Darkbrown_08.webp",
"images/Hanuman_01_Small_Darkbrown_09.webp"
]
},
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/08hD7M2s",
whatsapp: "Hanuman Small Temple 2 - Brown Small",
images: [
"images/Hanuman_01_Small_Brown_01.webp",
"images/Hanuman_01_Small_Brown_02.webp",
"images/Hanuman_01_Small_Brown_03.webp",
"images/Hanuman_01_Small_Brown_04.webp",
"images/Hanuman_01_Small_Brown_05.webp",
"images/Hanuman_01_Small_Brown_06.webp",
"images/Hanuman_01_Small_Brown_07.webp",
"images/Hanuman_01_Small_Brown_08.webp",
"images/Hanuman_01_Small_Brown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0178n2Pc",
whatsapp: "Hanuman Small Temple 2 - Dark Brown Big",
images: [
"images/Hanuman_01_Big_Darkbrown_01.webp",
"images/Hanuman_01_Big_Darkbrown_02.webp",
"images/Hanuman_01_Big_Darkbrown_03.webp",
"images/Hanuman_01_Big_Darkbrown_04.webp",
"images/Hanuman_01_Big_Darkbrown_05.webp",
"images/Hanuman_01_Big_Darkbrown_06.webp",
"images/Hanuman_01_Big_Darkbrown_07.webp",
"images/Hanuman_01_Big_Darkbrown_08.webp",
"images/Hanuman_01_Big_Darkbrown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/05X0m7c9",
whatsapp: "Hanuman Small Temple 2 - Brown Big",
images: [
"images/Hanuman_01_Big_Brown_01.webp",
"images/Hanuman_01_Big_Brown_02.webp",
"images/Hanuman_01_Big_Brown_03.webp",
"images/Hanuman_01_Big_Brown_04.webp",
"images/Hanuman_01_Big_Brown_05.webp",
"images/Hanuman_01_Big_Brown_06.webp",
"images/Hanuman_01_Big_Brown_07.webp",
"images/Hanuman_01_Big_Brown_08.webp",
"images/Hanuman_01_Big_Brown_09.webp"
]
}
}
},
"hanuman-2": {
defaultVariation: "brown-small",
variations: {
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/04bbMP4C",
whatsapp: "Hanuman Small Temple - Dark Brown Small",
images: [
"images/Hanuman Temple_02_Small_Darkbrown_01.webp",
"images/Hanuman Temple_02_Small_Darkbrown_02.webp",
"images/Hanuman Temple_02_Small_Darkbrown_03.webp",
"images/Hanuman Temple_02_Small_Darkbrown_04.webp",
"images/Hanuman Temple_02_Small_Darkbrown_05.webp",
"images/Hanuman Temple_02_Small_Darkbrown_06.webp",
"images/Hanuman Temple_02_Small_Darkbrown_07.webp",
"images/Hanuman Temple_02_Small_Darkbrown_08.webp",
"images/Hanuman Temple_02_Small_Darkbrown_09.webp"
]
},
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0cOuzgW0",
whatsapp: "Hanuman Small Temple - Brown Small",
images: [
"images/Hanuman Temple_02_Small_Brown_01.webp",
"images/Hanuman Temple_02_Small_Brown_02.webp",
"images/Hanuman Temple_02_Small_Brown_03.webp",
"images/Hanuman Temple_02_Small_Brown_04.webp",
"images/Hanuman Temple_02_Small_Brown_05.webp",
"images/Hanuman Temple_02_Small_Brown_06.webp",
"images/Hanuman Temple_02_Small_Brown_07.webp",
"images/Hanuman Temple_02_Small_Brown_08.webp",
"images/Hanuman Temple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/02ng878g",
whatsapp: "Hanuman Small Temple - Brown Big",
images: [
"images/Hanuman Temple_02_Big_Brown_01.webp",
"images/Hanuman Temple_02_Big_Brown_02.webp",
"images/Hanuman Temple_02_Big_Brown_03.webp",
"images/Hanuman Temple_02_Big_Brown_04.webp",
"images/Hanuman Temple_02_Big_Brown_05.webp",
"images/Hanuman Temple_02_Big_Brown_06.webp",
"images/Hanuman Temple_02_Big_Brown_07.webp",
"images/Hanuman Temple_02_Big_Brown_08.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/023TUFUz",
whatsapp: "Hanuman Small Temple - Dark Brown Big",
images: [
"images/Hanuman Temple_02_Big_Darkbrown_01.webp",
"images/Hanuman Temple_02_Big_Darkbrown_02.webp",
"images/Hanuman Temple_02_Big_Darkbrown_03.webp",
"images/Hanuman Temple_02_Big_Darkbrown_04.webp",
"images/Hanuman Temple_02_Big_Darkbrown_05.webp",
"images/Hanuman Temple_02_Big_Darkbrown_06.webp",
"images/Hanuman Temple_02_Big_Darkbrown_07.webp",
"images/Hanuman Temple_02_Big_Darkbrown_08.webp",
"images/Hanuman Temple_02_Big_Darkbrown_09.webp"
]
}
}
}
,"hanuman-3": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0cvdnYH4",
whatsapp: "Hanuman Temple 3 - Brown Small",
images: [
"images/Hanuman Temple_03_Small_Brown_01.webp",
"images/Hanuman Temple_03_Small_Brown_02.webp",
"images/Hanuman Temple_03_Small_Brown_03.webp",
"images/Hanuman Temple_03_Small_Brown_04.webp",
"images/Hanuman Temple_03_Small_Brown_05.webp",
"images/Hanuman Temple_03_Small_Brown_06.webp",
"images/Hanuman Temple_03_Small_Brown_07.webp",
"images/Hanuman Temple_03_Small_Brown_08.webp",
"images/Hanuman Temple_03_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/07HHkYm5",
whatsapp: "Hanuman Temple 3 - Brown Big",
images: [
"images/Hanuman Temple_03_Big_Brown_01.webp",
"images/Hanuman Temple_03_Big_Brown_02.webp",
"images/Hanuman Temple_03_Big_Brown_03.webp",
"images/Hanuman Temple_03_Big_Brown_04.webp",
"images/Hanuman Temple_03_Big_Brown_05.webp",
"images/Hanuman Temple_03_Big_Brown_06.webp",
"images/Hanuman Temple_03_Big_Brown_07.webp",
"images/Hanuman Temple_03_Big_Brown_08.webp",
"images/Hanuman Temple_03_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0gbN4YIF",
whatsapp: "Hanuman Temple 3 - Dark Brown Small",
images: [
"images/Hanuman Temple_03_Small_Darkbrown_01.webp",
"images/Hanuman Temple_03_Small_Darkbrown_02.webp",
"images/Hanuman Temple_03_Small_Darkbrown_03.webp",
"images/Hanuman Temple_03_Small_Darkbrown_04.webp",
"images/Hanuman Temple_03_Small_Darkbrown_05.webp",
"images/Hanuman Temple_03_Small_Darkbrown_06.webp",
"images/Hanuman Temple_03_Small_Darkbrown_07.webp",
"images/Hanuman Temple_03_Small_Darkbrown_08.webp",
"images/Hanuman Temple_03_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/02tcnVb7",
whatsapp: "Hanuman Temple 3 - Dark Brown Big",
images: [
"images/Hanuman Temple_03_Big_Darkbrown_01.webp",
"images/Hanuman Temple_03_Big_Darkbrown_02.webp",
"images/Hanuman Temple_03_Big_Darkbrown_03.webp",
"images/Hanuman Temple_03_Big_Darkbrown_04.webp",
"images/Hanuman Temple_03_Big_Darkbrown_05.webp",
"images/Hanuman Temple_03_Big_Darkbrown_06.webp",
"images/Hanuman Temple_03_Big_Darkbrown_07.webp",
"images/Hanuman Temple_03_Big_Darkbrown_08.webp",
"images/Hanuman Temple_03_Big_Darkbrown_09.webp"
]
}
}
},
"krishna-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/02blWPLh",
whatsapp: "Krishna Small Temple 2 - Brown Small",
images: [
"images/Krishna Temple_02_Small_Brown_01.webp",
"images/Krishna Temple_02_Small_Brown_02.webp",
"images/Krishna Temple_02_Small_Brown_03.webp",
"images/Krishna Temple_02_Small_Brown_04.webp",
"images/Krishna Temple_02_Small_Brown_05.webp",
"images/Krishna Temple_02_Small_Brown_06.webp",
"images/Krishna Temple_02_Small_Brown_07.webp",
"images/Krishna Temple_02_Small_Brown_08.webp",
"images/Krishna Temple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0hSl5Th1",
whatsapp: "Krishna Small Temple 2 - Brown Big",
images: [
"images/Krishna Temple_02_Big_Brown_01.webp",
"images/Krishna Temple_02_Big_Brown_02.webp",
"images/Krishna Temple_02_Big_Brown_03.webp",
"images/Krishna Temple_02_Big_Brown_04.webp",
"images/Krishna Temple_02_Big_Brown_05.webp",
"images/Krishna Temple_02_Big_Brown_06.webp",
"images/Krishna Temple_02_Big_Brown_07.webp",
"images/Krishna Temple_02_Big_Brown_08.webp",
"images/Krishna Temple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0h3PBqKK",
whatsapp: "Krishna Small Temple 2 - Dark Brown Small",
images: [
"images/Krishna Temple_02_Small_Darkbrown_01.webp",
"images/Krishna Temple_02_Small_Darkbrown_02.webp",
"images/Krishna Temple_02_Small_Darkbrown_03.webp",
"images/Krishna Temple_02_Small_Darkbrown_04.webp",
"images/Krishna Temple_02_Small_Darkbrown_05.webp",
"images/Krishna Temple_02_Small_Darkbrown_06.webp",
"images/Krishna Temple_02_Small_Darkbrown_07.webp",
"images/Krishna Temple_02_Small_Darkbrown_08.webp",
"images/Krishna Temple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0g4EiQdm",
whatsapp: "Krishna Small Temple 2 - Dark Brown Big",
images: [
"images/Krishna Temple_02_Big_Darkbrown_01.webp",
"images/Krishna Temple_02_Big_Darkbrown_02.webp",
"images/Krishna Temple_02_Big_Darkbrown_03.webp",
"images/Krishna Temple_02_Big_Darkbrown_04.webp",
"images/Krishna Temple_02_Big_Darkbrown_05.webp",
"images/Krishna Temple_02_Big_Darkbrown_06.webp",
"images/Krishna Temple_02_Big_Darkbrown_07.webp",
"images/Krishna Temple_02_Big_Darkbrown_08.webp",
"images/Krishna Temple_02_Big_Darkbrown_09.webp"
]
}
}
},
"krishna-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0ckxBzLQ",
whatsapp: "Krishna Small Temple - Brown Small",
images: [
"images/Krishna_01_Small_Brown_01.webp",
"images/Krishna_01_Small_Brown_02.webp",
"images/Krishna_01_Small_Brown_03.webp",
"images/Krishna_01_Small_Brown_04.webp",
"images/Krishna_01_Small_Brown_05.webp",
"images/Krishna_01_Small_Brown_06.webp",
"images/Krishna_01_Small_Brown_07.webp",
"images/Krishna_01_Small_Brown_08.webp",
"images/Krishna_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0g1zPNTD",
whatsapp: "Krishna Small Temple - Brown Big",
images: [
"images/Krishna_01_Big_Brown_01.webp",
"images/Krishna_01_Big_Brown_02.webp",
"images/Krishna_01_Big_Brown_03.webp",
"images/Krishna_01_Big_Brown_04.webp",
"images/Krishna_01_Big_Brown_05.webp",
"images/Krishna_01_Big_Brown_06.webp",
"images/Krishna_01_Big_Brown_07.webp",
"images/Krishna_01_Big_Brown_08.webp",
"images/Krishna_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/01O8N3YG",
whatsapp: "Krishna Small Temple - Dark Brown Small",
images: [
"images/Krishna_01_Small Darkbrown_01.webp",
"images/Krishna_01_Small Darkbrown_02.webp",
"images/Krishna_01_Small Darkbrown_03.webp",
"images/Krishna_01_Small Darkbrown_04.webp",
"images/Krishna_01_Small Darkbrown_05.webp",
"images/Krishna_01_Small Darkbrown_06.webp",
"images/Krishna_01_Small Darkbrown_07.webp",
"images/Krishna_01_Small Darkbrown_08.webp",
"images/Krishna_01_Small Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/03O2qNHf",
whatsapp: "Krishna Small Temple - Dark Brown Big",
images: [
"images/Krishna_01_Big_Darkbrown_01.webp",
"images/Krishna_01_Big_Darkbrown_02.webp",
"images/Krishna_01_Big_Darkbrown_03.webp",
"images/Krishna_01_Big_Darkbrown_04.webp",
"images/Krishna_01_Big_Darkbrown_05.webp",
"images/Krishna_01_Big_Darkbrown_06.webp",
"images/Krishna_01_Big_Darkbrown_07.webp",
"images/Krishna_01_Big_Darkbrown_08.webp",
"images/Krishna_01_Big_Darkbrown_09.webp"
]
}
}
},
"khatushyam-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0gytQnqS",
whatsapp: "Khatu Shyam Temple - Brown Small",
images: [
"images/Khatushyam Temple_01_Small_Brown_01.webp",
"images/Khatushyam Temple_01_Small_Brown_02.webp",
"images/Khatushyam Temple_01_Small_Brown_03.webp",
"images/Khatushyam Temple_01_Small_Brown_04.webp",
"images/Khatushyam Temple_01_Small_Brown_05.webp",
"images/Khatushyam Temple_01_Small_Brown_06.webp",
"images/Khatushyam Temple_01_Small_Brown_07.webp",
"images/Khatushyam Temple_01_Small_Brown_08.webp",
"images/Khatushyam Temple_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0a3QIQ5w",
whatsapp: "Khatu Shyam Temple - Brown Big",
images: [
"images/Khatushyam Temple_01_Big_Brown_01.webp",
"images/Khatushyam Temple_01_Big_Brown_02.webp",
"images/Khatushyam Temple_01_Big_Brown_03.webp",
"images/Khatushyam Temple_01_Big_Brown_04.webp",
"images/Khatushyam Temple_01_Big_Brown_05.webp",
"images/Khatushyam Temple_01_Big_Brown_06.webp",
"images/Khatushyam Temple_01_Big_Brown_07.webp",
"images/Khatushyam Temple_01_Big_Brown_08.webp",
"images/Khatushyam Temple_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0etXsRC7",
whatsapp: "Khatu Shyam Temple - Dark Brown Small",
images: [
"images/Khatushyam Temple_01_Small_Darkbrown_01.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_02.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_03.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_04.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_05.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_06.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_07.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_08.webp",
"images/Khatushyam Temple_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/038QapIf",
whatsapp: "Khatu Shyam Temple - Dark Brown Big",
images: [
"images/Khatushyam Temple_01_Big_Darkbrown_01.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_02.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_03.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_04.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_05.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_06.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_07.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_08.webp",
"images/Khatushyam Temple_01_Big_Darkbrown_09.webp"
]
}
}
},
"khatushyam-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/01UiCsYS",
whatsapp: "Khatu Shyam Temple 2 - Brown Small",
images: [
"images/Khatushyamtemple_02_Small_Brown_01.webp",
"images/Khatushyamtemple_02_Small_Brown_02.webp",
"images/Khatushyamtemple_02_Small_Brown_03.webp",
"images/Khatushyamtemple_02_Small_Brown_04.webp",
"images/Khatushyamtemple_02_Small_Brown_05.webp",
"images/Khatushyamtemple_02_Small_Brown_06.webp",
"images/Khatushyamtemple_02_Small_Brown_07.webp",
"images/Khatushyamtemple_02_Small_Brown_08.webp",
"images/Khatushyamtemple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0cpQydWP",
whatsapp: "Khatu Shyam Temple 2 - Brown Big",
images: [
"images/Khatushyamtemple_02_Big_Brown_01.webp",
"images/Khatushyamtemple_02_Big_Brown_02.webp",
"images/Khatushyamtemple_02_Big_Brown_03.webp",
"images/Khatushyamtemple_02_Big_Brown_04.webp",
"images/Khatushyamtemple_02_Big_Brown_05.webp",
"images/Khatushyamtemple_02_Big_Brown_06.webp",
"images/Khatushyamtemple_02_Big_Brown_07.webp",
"images/Khatushyamtemple_02_Big_Brown_08.webp",
"images/Khatushyamtemple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/03RM8NkW",
whatsapp: "Khatu Shyam Temple 2 - Dark Brown Small",
images: [
"images/Khatushyamtemple_02_Small_Darkbrown_01.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_02.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_03.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_04.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_05.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_06.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_07.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_08.webp",
"images/Khatushyamtemple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/077VNHGC",
whatsapp: "Khatu Shyam Temple 2 - Dark Brown Big",
images: [
"images/Khatushyamtemple_02_Big_Darkbrown_01.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_02.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_03.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_04.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_05.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_06.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_07.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_08.webp",
"images/Khatushyamtemple_02_Big_Darkbrown_09.webp"
]
}
}
},
"om-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Diameter: 7.9 inch × Thickness: 5 mm",
amazon: "https://amzn.in/d/07kUNCJ4",
whatsapp: "OM Wall Art - Brown Small",
images: [
"images/OMWallart_Small_Brown_01.webp",
"images/OMWallart_Small_Brown_02.webp",
"images/OMWallart_Small_Brown_03.webp",
"images/OMWallart_Small_Brown_04.webp",
"images/OMWallart_Small_Brown_05.webp",
"images/OMWallart_Small_Brown_06.webp",
"images/OMWallart_Small_Brown_07.webp",
"images/OMWallart_Small_Brown_08.webp",
"images/OMWallart_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Diameter: 15 inch × Thickness: 5 mm",
amazon: "https://amzn.in/d/066Mwcqs",
whatsapp: "OM Wall Art - Brown Big",
images: [
"images/OMWallart_Big_Brown_01.webp",
"images/OMWallart_Big_Brown_02.webp",
"images/OMWallart_Big_Brown_03.webp",
"images/OMWallart_Big_Brown_04.webp",
"images/OMWallart_Big_Brown_05.webp",
"images/OMWallart_Big_Brown_06.webp",
"images/OMWallart_Big_Brown_07.webp",
"images/OMWallart_Big_Brown_08.webp",
"images/OMWallart_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Diameter: 7.9 inch × Thickness: 5 mm",
amazon: "https://amzn.in/d/0iC3x8Eq",
whatsapp: "OM Wall Art - Dark Brown Small",
images: [
"images/OMWallart_Small_Darkbrown_01.webp",
"images/OMWallart_Small_Darkbrown_02.webp",
"images/OMWallart_Small_Darkbrown_03.webp",
"images/OMWallart_Small_Darkbrown_04.webp",
"images/OMWallart_Small_Darkbrown_05.webp",
"images/OMWallart_Small_Darkbrown_06.webp",
"images/OMWallart_Small_Darkbrown_07.webp",
"images/OMWallart_Small_Darkbrown_08.webp",
"images/OMWallart_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Diameter: 15 inch × Thickness: 5 mm",
amazon: "https://amzn.in/d/06tXwLTg",
whatsapp: "OM Wall Art - Dark Brown Big",
images: [
"images/OMWallart_Big_Darkbrown_01.webp",
"images/OMWallart_Big_Darkbrown_02.webp",
"images/OMWallart_Big_Darkbrown_03.webp",
"images/OMWallart_Big_Darkbrown_04.webp",
"images/OMWallart_Big_Darkbrown_05.webp",
"images/OMWallart_Big_Darkbrown_06.webp",
"images/OMWallart_Big_Darkbrown_07.webp",
"images/OMWallart_Big_Darkbrown_08.webp",
"images/OMWallart_Big_Darkbrown_09.webp"
]
}
}
},
"waheguru-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0fokBjGR",
whatsapp: "Waheguru Temple - Brown Small",
images: [
"images/Waheguru Temple_01_Small_Brown_01.webp",
"images/Waheguru Temple_01_Small_Brown_02.webp",
"images/Waheguru Temple_01_Small_Brown_03.webp",
"images/Waheguru Temple_01_Small_Brown_04.webp",
"images/Waheguru Temple_01_Small_Brown_05.webp",
"images/Waheguru Temple_01_Small_Brown_06.webp",
"images/Waheguru Temple_01_Small_Brown_07.webp",
"images/Waheguru Temple_01_Small_Brown_08.webp",
"images/Waheguru Temple_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/02Csehqj",
whatsapp: "Waheguru Temple - Brown Big",
images: [
"images/Waheguru Temple_01_Big_Brown_01.webp",
"images/Waheguru Temple_01_Big_Brown_02.webp",
"images/Waheguru Temple_01_Big_Brown_03.webp",
"images/Waheguru Temple_01_Big_Brown_04.webp",
"images/Waheguru Temple_01_Big_Brown_05.webp",
"images/Waheguru Temple_01_Big_Brown_06.webp",
"images/Waheguru Temple_01_Big_Brown_07.webp",
"images/Waheguru Temple_01_Big_Brown_08.webp",
"images/Waheguru Temple_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/06eRpND1",
whatsapp: "Waheguru Temple - Dark Brown Small",
images: [
"images/Waheguru Temple_01_Small_Darkbrown_01.webp",
"images/Waheguru Temple_01_Small_Darkbrown_02.webp",
"images/Waheguru Temple_01_Small_Darkbrown_03.webp",
"images/Waheguru Temple_01_Small_Darkbrown_04.webp",
"images/Waheguru Temple_01_Small_Darkbrown_05.webp",
"images/Waheguru Temple_01_Small_Darkbrown_06.webp",
"images/Waheguru Temple_01_Small_Darkbrown_07.webp",
"images/Waheguru Temple_01_Small_Darkbrown_08.webp",
"images/Waheguru Temple_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/01gMmzz9",
whatsapp: "Waheguru Temple - Dark Brown Big",
images: [
"images/Waheguru Temple_01_Big_Darkbrown_01.webp",
"images/Waheguru Temple_01_Big_Darkbrown_02.webp",
"images/Waheguru Temple_01_Big_Darkbrown_03.webp",
"images/Waheguru Temple_01_Big_Darkbrown_04.webp",
"images/Waheguru Temple_01_Big_Darkbrown_05.webp",
"images/Waheguru Temple_01_Big_Darkbrown_06.webp",
"images/Waheguru Temple_01_Big_Darkbrown_07.webp",
"images/Waheguru Temple_01_Big_Darkbrown_08.webp",
"images/Waheguru Temple_01_Big_Darkbrown_09.webp"
]
}
}
},
"ganesha-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/05XiBBkn",
whatsapp: "Ganesha Temple 2 - Brown Small",
images: [
"images/Ganesha Temple_02_Small_Brown_01.webp",
"images/Ganesha Temple_02_Small_Brown_02.webp",
"images/Ganesha Temple_02_Small_Brown_03.webp",
"images/Ganesha Temple_02_Small_Brown_04.webp",
"images/Ganesha Temple_02_Small_Brown_05.webp",
"images/Ganesha Temple_02_Small_Brown_06.webp",
"images/Ganesha Temple_02_Small_Brown_07.webp",
"images/Ganesha Temple_02_Small_Brown_08.webp",
"images/Ganesha Temple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0ekYClw1",
whatsapp: "Ganesha Temple 2 - Brown Big",
images: [
"images/Ganesha Temple_02_Big_Brown_01.webp",
"images/Ganesha Temple_02_Big_Brown_02.webp",
"images/Ganesha Temple_02_Big_Brown_03.webp",
"images/Ganesha Temple_02_Big_Brown_04.webp",
"images/Ganesha Temple_02_Big_Brown_05.webp",
"images/Ganesha Temple_02_Big_Brown_06.webp",
"images/Ganesha Temple_02_Big_Brown_07.webp",
"images/Ganesha Temple_02_Big_Brown_08.webp",
"images/Ganesha Temple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/02bFdeRS",
whatsapp: "Ganesha Temple 2 - Dark Brown Small",
images: [
"images/Ganesha Temple_02_Small_Darkbrown_01.webp",
"images/Ganesha Temple_02_Small_Darkbrown_02.webp",
"images/Ganesha Temple_02_Small_Darkbrown_03.webp",
"images/Ganesha Temple_02_Small_Darkbrown_04.webp",
"images/Ganesha Temple_02_Small_Darkbrown_05.webp",
"images/Ganesha Temple_02_Small_Darkbrown_06.webp",
"images/Ganesha Temple_02_Small_Darkbrown_07.webp",
"images/Ganesha Temple_02_Small_Darkbrown_08.webp",
"images/Ganesha Temple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0eS7NNPy",
whatsapp: "Ganesha Temple 2 - Dark Brown Big",
images: [
"images/Ganesha Temple_02_Big_Darkbrown_01.webp",
"images/Ganesha Temple_02_Big_Darkbrown_02.webp",
"images/Ganesha Temple_02_Big_Darkbrown_03.webp",
"images/Ganesha Temple_02_Big_Darkbrown_04.webp",
"images/Ganesha Temple_02_Big_Darkbrown_05.webp",
"images/Ganesha Temple_02_Big_Darkbrown_06.webp",
"images/Ganesha Temple_02_Big_Darkbrown_07.webp",
"images/Ganesha Temple_02_Big_Darkbrown_08.webp",
"images/Ganesha Temple_02_Big_Darkbrown_09.webp"
]
}
}
},
"guruji-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/07c5gB7M",
whatsapp: "Guruji Temple - Brown Small",
images: [
"images/Guruji Temple_01_Small_Brown_01.webp",
"images/Guruji Temple_01_Small_Brown_02.webp",
"images/Guruji Temple_01_Small_Brown_03.webp",
"images/Guruji Temple_01_Small_Brown_04.webp",
"images/Guruji Temple_01_Small_Brown_05.webp",
"images/Guruji Temple_01_Small_Brown_06.webp",
"images/Guruji Temple_01_Small_Brown_07.webp",
"images/Guruji Temple_01_Small_Brown_08.webp",
"images/Guruji Temple_01_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/02fNtirt",
whatsapp: "Guruji Temple - Brown Big",
images: [
"images/Guruji Temple_01_Big_Brown_01.webp",
"images/Guruji Temple_01_Big_Brown_02.webp",
"images/Guruji Temple_01_Big_Brown_03.webp",
"images/Guruji Temple_01_Big_Brown_04.webp",
"images/Guruji Temple_01_Big_Brown_05.webp",
"images/Guruji Temple_01_Big_Brown_06.webp",
"images/Guruji Temple_01_Big_Brown_07.webp",
"images/Guruji Temple_01_Big_Brown_08.webp",
"images/Guruji Temple_01_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/08vsGWlT",
whatsapp: "Guruji Temple - Dark Brown Small",
images: [
"images/Guruji Temple_01_Small_Darkbrown_01.webp",
"images/Guruji Temple_01_Small_Darkbrown_02.webp",
"images/Guruji Temple_01_Small_Darkbrown_03.webp",
"images/Guruji Temple_01_Small_Darkbrown_04.webp",
"images/Guruji Temple_01_Small_Darkbrown_05.webp",
"images/Guruji Temple_01_Small_Darkbrown_06.webp",
"images/Guruji Temple_01_Small_Darkbrown_07.webp",
"images/Guruji Temple_01_Small_Darkbrown_08.webp",
"images/Guruji Temple_01_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0hd1fKjv",
whatsapp: "Guruji Temple - Dark Brown Big",
images: [
"images/Guruji Temple_01_Big_Darkbrown_01.webp",
"images/Guruji Temple_01_Big_Darkbrown_02.webp",
"images/Guruji Temple_01_Big_Darkbrown_03.webp",
"images/Guruji Temple_01_Big_Darkbrown_04.webp",
"images/Guruji Temple_01_Big_Darkbrown_05.webp",
"images/Guruji Temple_01_Big_Darkbrown_06.webp",
"images/Guruji Temple_01_Big_Darkbrown_07.webp",
"images/Guruji Temple_01_Big_Darkbrown_08.webp",
"images/Guruji Temple_01_Big_Darkbrown_09.webp"
]
}
}
}
,
"guruji-2": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0io8XSB2",
whatsapp: "Guru Ji Temple 2 - Brown Small",
images: [
"images/Guruji_Temple_02_Small_Brown_01.webp",
"images/Guruji_Temple_02_Small_Brown_02.webp",
"images/Guruji_Temple_02_Small_Brown_03.webp",
"images/Guruji_Temple_02_Small_Brown_04.webp",
"images/Guruji_Temple_02_Small_Brown_05.webp",
"images/Guruji_Temple_02_Small_Brown_06.webp",
"images/Guruji_Temple_02_Small_Brown_07.webp",
"images/Guruji_Temple_02_Small_Brown_08.webp",
"images/Guruji_Temple_02_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/01RuvYFr",
whatsapp: "Guru Ji Temple 2 - Brown Big",
images: [
"images/Guruji_Temple_02_Big_Brown_01.webp",
"images/Guruji_Temple_02_Big_Brown_02.webp",
"images/Guruji_Temple_02_Big_Brown_03.webp",
"images/Guruji_Temple_02_Big_Brown_04.webp",
"images/Guruji_Temple_02_Big_Brown_05.webp",
"images/Guruji_Temple_02_Big_Brown_06.webp",
"images/Guruji_Temple_02_Big_Brown_07.webp",
"images/Guruji_Temple_02_Big_Brown_08.webp",
"images/Guruji_Temple_02_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/03Ys5G5S",
whatsapp: "Guru Ji Temple 2 - Dark Brown Small",
images: [
"images/Guruji_Temple_02_Small_Darkbrown_01.webp",
"images/Guruji_Temple_02_Small_Darkbrown_02.webp",
"images/Guruji_Temple_02_Small_Darkbrown_03.webp",
"images/Guruji_Temple_02_Small_Darkbrown_04.webp",
"images/Guruji_Temple_02_Small_Darkbrown_05.webp",
"images/Guruji_Temple_02_Small_Darkbrown_06.webp",
"images/Guruji_Temple_02_Small_Darkbrown_07.webp",
"images/Guruji_Temple_02_Small_Darkbrown_08.webp",
"images/Guruji_Temple_02_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0gsINYvT",
whatsapp: "Guru Ji Temple 2 - Dark Brown Big",
images: [
"images/Guruji_Temple_02_Big_Darkbrown_01.webp",
"images/Guruji_Temple_02_Big_Darkbrown_02.webp",
"images/Guruji_Temple_02_Big_Darkbrown_03.webp",
"images/Guruji_Temple_02_Big_Darkbrown_04.webp",
"images/Guruji_Temple_02_Big_Darkbrown_05.webp",
"images/Guruji_Temple_02_Big_Darkbrown_06.webp",
"images/Guruji_Temple_02_Big_Darkbrown_07.webp",
"images/Guruji_Temple_02_Big_Darkbrown_08.webp",
"images/Guruji_Temple_02_Big_Darkbrown_09.webp"
]
}
}
},
"ganesha-3": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/02tP3Qln",
whatsapp: "Ganesha Small Temple 3 - Brown Small",
images: [
"images/Ganesha Temple_03_Small_Brown_01.webp",
"images/Ganesha Temple_03_Small_Brown_02.webp",
"images/Ganesha Temple_03_Small_Brown_03.webp",
"images/Ganesha Temple_03_Small_Brown_04.webp",
"images/Ganesha Temple_03_Small_Brown_05.webp",
"images/Ganesha Temple_03_Small_Brown_06.webp",
"images/Ganesha Temple_03_Small_Brown_07.webp",
"images/Ganesha Temple_03_Small_Brown_08.webp",
"images/Ganesha Temple_03_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/07nr04Fj",
whatsapp: "Ganesha Small Temple 3 - Brown Big",
images: [
"images/Ganesha Temple_03_Big_Brown_01.webp",
"images/Ganesha Temple_03_Big_Brown_02.webp",
"images/Ganesha Temple_03_Big_Brown_03.webp",
"images/Ganesha Temple_03_Big_Brown_04.webp",
"images/Ganesha Temple_03_Big_Brown_05.webp",
"images/Ganesha Temple_03_Big_Brown_06.webp",
"images/Ganesha Temple_03_Big_Brown_07.webp",
"images/Ganesha Temple_03_Big_Brown_08.webp",
"images/Ganesha Temple_03_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/09oEo56H",
whatsapp: "Ganesha Small Temple 3 - Dark Brown Small",
images: [
"images/Ganesha Temple_03_Small_Darkbrown_01.webp",
"images/Ganesha Temple_03_Small_Darkbrown_02.webp",
"images/Ganesha Temple_03_Small_Darkbrown_03.webp",
"images/Ganesha Temple_03_Small_Darkbrown_04.webp",
"images/Ganesha Temple_03_Small_Darkbrown_05.webp",
"images/Ganesha Temple_03_Small_Darkbrown_06.webp",
"images/Ganesha Temple_03_Small_Darkbrown_07.webp",
"images/Ganesha Temple_03_Small_Darkbrown_08.webp",
"images/Ganesha Temple_03_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/05ymgN8z",
whatsapp: "Ganesha Small Temple 3 - Dark Brown Big",
images: [
"images/Ganesha Temple_03_Big_Darkbrown_01.webp",
"images/Ganesha Temple_03_Big_Darkbrown_02.webp",
"images/Ganesha Temple_03_Big_Darkbrown_03.webp",
"images/Ganesha Temple_03_Big_Darkbrown_04.webp",
"images/Ganesha Temple_03_Big_Darkbrown_05.webp",
"images/Ganesha Temple_03_Big_Darkbrown_06.webp",
"images/Ganesha Temple_03_Big_Darkbrown_07.webp",
"images/Ganesha Temple_03_Big_Darkbrown_08.webp",
"images/Ganesha Temple_03_Big_Darkbrown_09.webp"
]
}
}
},
"lord-mahaveer-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/06I1HHyX",
whatsapp: "Lord Mahaveer Small Temple - Brown Small",
images: [
"images/Lord Mahaveer Temple_Small_Brown_01.webp",
"images/Lord Mahaveer Temple_Small_Brown_02.webp",
"images/Lord Mahaveer Temple_Small_Brown_03.webp",
"images/Lord Mahaveer Temple_Small_Brown_04.webp",
"images/Lord Mahaveer Temple_Small_Brown_05.webp",
"images/Lord Mahaveer Temple_Small_Brown_06.webp",
"images/Lord Mahaveer Temple_Small_Brown_07.webp",
"images/Lord Mahaveer Temple_Small_Brown_08.webp",
"images/Lord Mahaveer Temple_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/04KMW16w",
whatsapp: "Lord Mahaveer Small Temple - Brown Big",
images: [
"images/Lord Mahaveer Temple_Big_Brown_01.webp",
"images/Lord Mahaveer Temple_Big_Brown_02.webp",
"images/Lord Mahaveer Temple_Big_Brown_03.webp",
"images/Lord Mahaveer Temple_Big_Brown_04.webp",
"images/Lord Mahaveer Temple_Big_Brown_05.webp",
"images/Lord Mahaveer Temple_Big_Brown_06.webp",
"images/Lord Mahaveer Temple_Big_Brown_07.webp",
"images/Lord Mahaveer Temple_Big_Brown_08.webp",
"images/Lord Mahaveer Temple_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/08bUt3cr",
whatsapp: "Lord Mahaveer Small Temple - Dark Brown Small",
images: [
"images/Lord Mahaveer Temple_Small_Darkbrown_01.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_02.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_03.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_04.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_05.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_06.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_07.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_08.webp",
"images/Lord Mahaveer Temple_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/07PITyT2",
whatsapp: "Lord Mahaveer Small Temple - Dark Brown Big",
images: [
"images/Lord Mahaveer Temple_Big_Darkbrown_01.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_02.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_03.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_04.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_05.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_06.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_07.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_08.webp",
"images/Lord Mahaveer Temple_Big_Darkbrown_09.webp"
]
}
}
},
"sai-baba-1": {
defaultVariation: "brown-small",
variations: {
"brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/054EMTVf",
whatsapp: "Sai Baba Temple - Brown Small",
images: [
"images/Saibaba Temple_Small_Brown_01.webp",
"images/Saibaba Temple_Small_Brown_02.webp",
"images/Saibaba Temple_Small_Brown_03.webp",
"images/Saibaba Temple_Small_Brown_04.webp",
"images/Saibaba Temple_Small_Brown_05.webp",
"images/Saibaba Temple_Small_Brown_06.webp",
"images/Saibaba Temple_Small_Brown_07.webp",
"images/Saibaba Temple_Small_Brown_08.webp",
"images/Saibaba Temple_Small_Brown_09.webp"
]
},
"brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/0gtVEVJy",
whatsapp: "Sai Baba Temple - Brown Big",
images: [
"images/Saibaba Temple_Big_Brown_01.webp",
"images/Saibaba Temple_Big_Brown_02.webp",
"images/Saibaba Temple_Big_Brown_03.webp",
"images/Saibaba Temple_Big_Brown_04.webp",
"images/Saibaba Temple_Big_Brown_05.webp",
"images/Saibaba Temple_Big_Brown_06.webp",
"images/Saibaba Temple_Big_Brown_07.webp",
"images/Saibaba Temple_Big_Brown_08.webp",
"images/Saibaba Temple_Big_Brown_09.webp"
]
},
"dark-brown-small": {
price: "₹299",
size: "Size : 3.3 × 4.6 inch Approx",
amazon: "https://amzn.in/d/0d2oGsHI",
whatsapp: "Sai Baba Temple - Dark Brown Small",
images: [
"images/Saibaba Temple_Small_Darkbrown_01.webp",
"images/Saibaba Temple_Small_Darkbrown_02.webp",
"images/Saibaba Temple_Small_Darkbrown_03.webp",
"images/Saibaba Temple_Small_Darkbrown_04.webp",
"images/Saibaba Temple_Small_Darkbrown_05.webp",
"images/Saibaba Temple_Small_Darkbrown_06.webp",
"images/Saibaba Temple_Small_Darkbrown_07.webp",
"images/Saibaba Temple_Small_Darkbrown_08.webp",
"images/Saibaba Temple_Small_Darkbrown_09.webp"
]
},
"dark-brown-big": {
price: "₹399",
size: "Size : 4 × 5.1 inch Approx",
amazon: "https://amzn.in/d/04igizVh",
whatsapp: "Sai Baba Temple - Dark Brown Big",
images: [
"images/Saibaba Temple_Big_Darkbrown_01.webp",
"images/Saibaba Temple_Big_Darkbrown_02.webp",
"images/Saibaba Temple_Big_Darkbrown_03.webp",
"images/Saibaba Temple_Big_Darkbrown_04.webp",
"images/Saibaba Temple_Big_Darkbrown_05.webp",
"images/Saibaba Temple_Big_Darkbrown_06.webp",
"images/Saibaba Temple_Big_Darkbrown_07.webp",
"images/Saibaba Temple_Big_Darkbrown_08.webp",
"images/Saibaba Temple_Big_Darkbrown_09.webp"
]
}
}
}
};
function getVariationWhatsAppName(card, key, variation) {
const title = card.querySelector("h3");
const button = card.querySelector('[data-variation="' + key + '"]');
const productName = title ? title.textContent.trim() : variation.whatsapp;
const variationName = button ? button.textContent.trim() : key.replace(/-/g, " ");
return productName + " - " + variationName;
}
document.querySelectorAll(".decoreva-variation-card, .featured-variation-card").forEach(function (card) {
card.classList.add("sherawali-variation-card");
const options = card.querySelector(".variation-options");
if (options) options.classList.add("sherawali-variations");
card.querySelectorAll(".variation-button").forEach(function (button) {
button.classList.add("sherawali-variation");
});
const actions = card.querySelector(".variation-actions, .featured-variation-actions");
if (actions) actions.classList.add("sherawali-actions");
const amazon = card.querySelector(".variation-amazon-button");
if (amazon) amazon.classList.add("sherawali-amazon-button");
const whatsapp = card.querySelector(".variation-whatsapp-button, .featured-whatsapp-button");
if (whatsapp) whatsapp.classList.add("sherawali-whatsapp-button");
});
document.querySelectorAll(".decoreva-variation-card, .featured-variation-card").forEach(function (card) {
const product = decorevaVariationProducts[card.dataset.variationProduct];
if (!product) return;
const slider = card.querySelector(".image-slider, .featured-image-box");
const image = card.querySelector(".slider-image, .featured-image-box img");
const price = card.querySelector(".price, .featured-price");
const size = card.querySelector(".size, .featured-size");
const amazon = card.querySelector(".variation-amazon-button, .sherawali-amazon-button");
const whatsapp = card.querySelector(".variation-whatsapp-button, .featured-whatsapp-button, .sherawali-whatsapp-button");
const buttons = card.querySelectorAll(".variation-button, .sherawali-variation");
function applyVariation(key) {
const variation = product.variations[key];
if (!variation || !slider) return;
slider.dataset.images = JSON.stringify(variation.images);
slider.dataset.index = "0";
if (image) {
image.src = variation.images[0];
image.dataset.src = variation.images[0];
image.dataset.loaded = "true";
const title = card.querySelector("h3");
image.alt = (title ? title.textContent.trim() : "DECOREVA Product") + " - " + key.replace(/-/g, " ");
}
if (price) price.textContent = variation.price;
if (size) size.textContent = variation.size;
if (amazon) amazon.href = variation.amazon;
if (whatsapp) {
whatsapp.href = "https://wa.me/919582899547?text=" +
encodeURIComponent("Hello DECOREVA, I want to buy " + getVariationWhatsAppName(card, key, variation));
}
buttons.forEach(function (button) {
button.classList.toggle("active", button.dataset.variation === key);
});
updateDots(slider, variation.images, 0);
}
card._decorevaApplyVariation = applyVariation;
applyVariation(product.defaultVariation);
});
document.addEventListener("click", function (event) {
const button = event.target.closest(".variation-button, .sherawali-variation");
if (!button) return;
const card = button.closest(".decoreva-variation-card, .featured-variation-card");
if (!card) return;
const key = button.dataset.variation;
const applyVariation = card._decorevaApplyVariation;
if (typeof applyVariation === "function") {
event.preventDefault();
event.stopPropagation();
applyVariation(key);
return;
}
const product = decorevaVariationProducts[card.dataset.variationProduct];
const variation = product && product.variations[key];
if (!variation) return;
event.preventDefault();
event.stopPropagation();
const image = card.querySelector(".slider-image, .featured-image-box img");
const price = card.querySelector(".price, .featured-price");
const size = card.querySelector(".size, .featured-size");
const amazon = card.querySelector(".variation-amazon-button, .sherawali-amazon-button");
const whatsapp = card.querySelector(".variation-whatsapp-button, .featured-whatsapp-button, .sherawali-whatsapp-button");
if (image) image.src = variation.images[0];
if (price) price.textContent = variation.price;
if (size) size.textContent = variation.size;
if (amazon) amazon.href = variation.amazon;
if (whatsapp) {
whatsapp.href = "https://wa.me/919582899547?text=" +
encodeURIComponent("Hello DECOREVA, I want to buy " + getVariationWhatsAppName(card, key, variation));
}
card.querySelectorAll(".variation-button, .sherawali-variation").forEach(function (item) {
item.classList.toggle("active", item.dataset.variation === key);
});
}, true);
(function () {
"use strict";
const CART_KEY = "decoreva_cart_v1";
const WISHLIST_KEY = "decoreva_wishlist_v1";
const COUPON_KEY = "decoreva_coupon_v1";
const DELIVERY_CHARGE = 60;
const COUPONS = {
"WELCOME10": 10
};
let cart = [];
let wishlist = [];
let appliedCoupon = "";
let couponModalOpen = false;
let checkoutStep = "cart";
let checkoutAddressUnlocked = false;
let cartUnderlyingScrollY = 0;
let couponPreviewCode = "";
let deliveryAddress = null;
const PROFILE_KEY = "decoreva_profile_v1";
let profile = { name: "", mobile: "", email: "", addresses: [] };
try {
const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
if (savedProfile && typeof savedProfile === "object") {
profile = {
name: String(savedProfile.name || ""),
mobile: String(savedProfile.mobile || ""),
email: String(savedProfile.email || ""),
addresses: Array.isArray(savedProfile.addresses) ? savedProfile.addresses : []
};
}
} catch (error) {
profile = { name: "", mobile: "", email: "", addresses: [] };
}
try {
cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
if (!Array.isArray(cart)) cart = [];
} catch (error) {
cart = [];
}
try {
wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
if (!Array.isArray(wishlist)) wishlist = [];
} catch (error) {
wishlist = [];
}
try {
appliedCoupon = String(localStorage.getItem(COUPON_KEY) || "").toUpperCase();
if (!COUPONS[appliedCoupon]) appliedCoupon = "";
} catch (error) {
appliedCoupon = "";
}
function saveCart() {
localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function saveWishlist() {
localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
}
function saveCoupon() {
if (appliedCoupon) {
localStorage.setItem(COUPON_KEY, appliedCoupon);
} else {
localStorage.removeItem(COUPON_KEY);
}
}
function money(value) {
return "₹" + Number(value || 0).toLocaleString("en-IN");
}
function numericPrice(text) {
return parseFloat(String(text || "").replace(/[^\d.]/g, "")) || 0;
}
function getCardData(card) {
if (!card) return null;
const titleEl = card.querySelector("h3");
const imageEl = card.querySelector(".slider-image, .featured-image-box img");
const priceEl = card.querySelector(".price, .featured-price");
const sizeEl = card.querySelector(".size, .featured-size");
const productId = card.dataset.variationProduct ||
((titleEl ? titleEl.textContent.trim() : "DECOREVA Product") + "|" +
(imageEl ? imageEl.currentSrc || imageEl.src : ""));
let variationKey = "";
let variationName = "";
let price = numericPrice(priceEl ? priceEl.textContent : "");
let size = sizeEl ? sizeEl.textContent.trim() : "";
let image = imageEl ? (imageEl.currentSrc || imageEl.src) : "";
const activeVariation = card.querySelector(".variation-button.active, .sherawali-variation.active");
if (card.dataset.variationProduct && typeof decorevaVariationProducts !== "undefined") {
const product = decorevaVariationProducts[card.dataset.variationProduct];
if (product) {
variationKey = activeVariation ? activeVariation.dataset.variation : product.defaultVariation;
const variation = product.variations[variationKey] || product.variations[product.defaultVariation];
if (variation) {
variationKey = variationKey || product.defaultVariation;
variationName = activeVariation
? activeVariation.textContent.trim()
: variationKey.replace(/-/g, " ");
price = numericPrice(variation.price);
size = variation.size || size;
image = variation.images && variation.images.length
? variation.images[0]
: image;
}
}
}
return {
id: productId + (variationKey ? "|" + variationKey : ""),
productId: productId,
title: titleEl ? titleEl.textContent.trim() : "DECOREVA Product",
variationKey: variationKey,
variationName: variationName,
price: price,
size: size,
image: image
};
}
function totalItems() {
return cart.reduce(function (sum, item) {
return sum + Number(item.quantity || 0);
}, 0);
}
function subtotalAmount() {
return cart.reduce(function (sum, item) {
return sum + Number(item.price || 0) * Number(item.quantity || 0);
}, 0);
}
function effectiveCouponCode() {
return couponPreviewCode || appliedCoupon || "";
}
function discountAmount() {
const rate = COUPONS[effectiveCouponCode()] || 0;
return Math.round(subtotalAmount() * rate / 100);
}
function deliveryCharge() {
return cart.length ? DELIVERY_CHARGE : 0;
}
function finalAmount() {
return Math.max(0, subtotalAmount() - discountAmount() + deliveryCharge());
}
function updateCartCount() {
try {
const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
if (Array.isArray(saved)) cart = saved;
} catch (error) {}
const value = String(totalItems());
document.querySelectorAll("#decoreva-cart-count, #decoreva-cart-nav-count").forEach(function (count) {
count.textContent = value;
count.hidden = false;
});
}
function updateWishlistCount() {
try {
const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
if (Array.isArray(saved)) wishlist = saved;
} catch (error) {}
const value = String(wishlist.length);
document.querySelectorAll("#decoreva-wishlist-count").forEach(function (count) {
count.textContent = value;
count.hidden = false;
});
}
function updateWishlistButtons() {
document.querySelectorAll(".decoreva-wishlist").forEach(function (button) {
const card = button.closest(".card, .featured-slide");
const data = getCardData(card);
const saved = data && wishlist.some(function (item) {
return item.id === data.id;
});
button.classList.toggle("active", !!saved);
button.innerHTML = saved
? '<i class="fas fa-heart" aria-hidden="true"></i>'
: '<i class="far fa-heart" aria-hidden="true"></i>';
button.setAttribute("aria-label", saved ? "Remove from wishlist" : "Add to wishlist");
button.title = saved ? "Remove from Wishlist" : "Add to Wishlist";
});
}
function renderCart() {
const list = document.querySelector("#decoreva-cart-items");
const total = document.querySelector("#decoreva-cart-total");
const subtotal = document.querySelector("#decoreva-cart-subtotal");
const discount = document.querySelector("#decoreva-cart-discount");
const discountRow = document.querySelector("#decoreva-cart-discount-row");
const delivery = document.querySelector("#decoreva-cart-delivery");
const empty = document.querySelector("#decoreva-cart-empty");
const label = document.querySelector("#decoreva-cart-item-label");
const couponInput = document.querySelector("#decoreva-coupon-input");
const couponMessage = document.querySelector("#decoreva-coupon-message");
const checkout = document.querySelector("#decoreva-cart-whatsapp");
if (!list || !total || !empty) return;
list.replaceChildren();
cart = cart.filter(function (item) {
return Number(item.quantity || 0) > 0;
});
empty.hidden = true;
cart.forEach(function (item, index) {
const row = document.createElement("div");
row.className = "decoreva-cart-item";
row.dataset.cartView = "true";
row.dataset.cartIndex = String(index);
row.setAttribute("role", "button");
row.setAttribute("tabindex", "0");
row.setAttribute("aria-label", "View " + item.title + " in Collection");
row.style.cursor = "pointer";
const img = document.createElement("img");
img.src = item.image || "";
img.alt = item.title;
img.loading = "lazy";
const info = document.createElement("div");
info.className = "decoreva-cart-item-info";
const name = document.createElement("strong");
name.textContent = item.title;
info.appendChild(name);
if (item.variationName) {
const variation = document.createElement("span");
variation.textContent = item.variationName;
info.appendChild(variation);
}
const price = document.createElement("span");
price.textContent = money(item.price) + " × " + item.quantity;
info.appendChild(price);
const controls = document.createElement("div");
controls.className = "decoreva-cart-item-controls";
const minus = document.createElement("button");
minus.type = "button";
minus.textContent = "−";
minus.setAttribute("aria-label", "Decrease quantity");
minus.dataset.cartAction = "minus";
minus.dataset.cartIndex = String(index);
const qty = document.createElement("span");
qty.textContent = String(item.quantity);
const plus = document.createElement("button");
plus.type = "button";
plus.textContent = "+";
plus.setAttribute("aria-label", "Increase quantity");
plus.dataset.cartAction = "plus";
plus.dataset.cartIndex = String(index);
const remove = document.createElement("button");
remove.type = "button";
remove.textContent = "Remove";
remove.dataset.cartAction = "remove";
remove.dataset.cartIndex = String(index);
const wishlistButton = document.createElement("button");
wishlistButton.type = "button";
wishlistButton.textContent = "Move to Wishlist";
wishlistButton.dataset.cartAction = "wishlist";
wishlistButton.dataset.cartIndex = String(index);
controls.appendChild(minus);
controls.appendChild(qty);
controls.appendChild(plus);
controls.appendChild(remove);
controls.appendChild(wishlistButton);
info.appendChild(controls);
row.appendChild(img);
row.appendChild(info);
list.appendChild(row);
});
const count = totalItems();
if (label) {
label.textContent = count + (count === 1 ? " item" : " items");
}
if (subtotal) subtotal.textContent = money(subtotalAmount());
const discountValue = discountAmount();
if (discount) discount.textContent = "- " + money(discountValue);
if (discountRow) discountRow.hidden = !discountValue;
if (delivery) delivery.textContent = money(deliveryCharge());
if (total) total.textContent = money(finalAmount());
if (couponInput) couponInput.value = appliedCoupon || couponPreviewCode;
if (couponMessage) {
if (appliedCoupon) {
couponMessage.textContent = appliedCoupon + " applied — 10% off";
couponMessage.className = "decoreva-coupon-message success";
} else if (couponPreviewCode) {
couponMessage.textContent = couponPreviewCode + " selected • 10% OFF. Click APPLY to apply this coupon.";
couponMessage.className = "decoreva-coupon-message success";
} else {
couponMessage.textContent = "";
couponMessage.className = "decoreva-coupon-message";
}
}
const couponAppliedLabel = document.querySelector("#decoreva-coupon-applied-label");
if (couponAppliedLabel) {
couponAppliedLabel.textContent = appliedCoupon
? "✓ " + appliedCoupon + " applied — 10% OFF"
: (couponPreviewCode ? couponPreviewCode + " checked — 10% OFF" : "");
couponAppliedLabel.hidden = !(appliedCoupon || couponPreviewCode);
}
const couponRemoveButton = document.querySelector("#decoreva-coupon-remove");
if (couponRemoveButton) {
couponRemoveButton.style.display = appliedCoupon ? "inline-flex" : "none";
}
const couponUseButton = document.querySelector(".decoreva-coupon-use[data-coupon-use='WELCOME10']");
if (couponUseButton) {
const isWelcomeApplied = appliedCoupon === "WELCOME10";
couponUseButton.textContent = isWelcomeApplied ? "APPLIED ✓" : "USE COUPON";
couponUseButton.classList.toggle("applied", isWelcomeApplied);
couponUseButton.disabled = isWelcomeApplied;
}
const couponTrigger = document.querySelector("#decoreva-open-coupon");
if (couponTrigger) couponTrigger.textContent = appliedCoupon ? "Coupon Applied" : "Apply Coupon";
if (checkout) {
checkout.disabled = cart.length === 0;
checkout.textContent = checkoutAddressUnlocked ? "Order on WhatsApp" : "Proceed to Buy";
checkout.setAttribute("aria-label", checkoutAddressUnlocked ? "Order on WhatsApp" : "Proceed to Buy");
}
if (cart.length > 0 && document.querySelector("#decoreva-similar-products")) renderSimilarProducts();
if (checkoutStep !== "cart" && cart.length > 0) {
renderCheckoutSummary();
updateAddressContinueState();
}
updateCartCount();
if (typeof updateCheckoutStepUI === "function") {
updateCheckoutStepUI();
}
}
function renderWishlist() {
const list = document.querySelector("#decoreva-wishlist-items");
const empty = document.querySelector("#decoreva-wishlist-empty");
const label = document.querySelector("#decoreva-wishlist-label");
if (!list || !empty) return;
list.replaceChildren();
empty.hidden = wishlist.length !== 0;
wishlist.forEach(function (item, index) {
const row = document.createElement("div");
row.className = "decoreva-wishlist-item";
row.dataset.wishlistView = "true";
row.dataset.wishlistIndex = String(index);
row.setAttribute("role", "button");
row.setAttribute("tabindex", "0");
row.setAttribute("aria-label", "View " + item.title + " in Collection");
row.style.cursor = "pointer";
const img = document.createElement("img");
img.src = item.image || "";
img.alt = item.title;
img.loading = "lazy";
const info = document.createElement("div");
info.className = "decoreva-wishlist-info";
const name = document.createElement("strong");
name.textContent = item.title;
info.appendChild(name);
if (item.variationName) {
const variation = document.createElement("span");
variation.textContent = item.variationName;
info.appendChild(variation);
}
const price = document.createElement("b");
price.textContent = money(item.price);
info.appendChild(price);
const remove = document.createElement("button");
remove.type = "button";
remove.textContent = "Remove";
remove.dataset.wishlistAction = "remove";
remove.dataset.wishlistIndex = String(index);
info.appendChild(remove);
row.appendChild(img);
row.appendChild(info);
list.appendChild(row);
});
if (label) {
label.textContent = wishlist.length + (wishlist.length === 1 ? " item" : " items");
}
updateWishlistCount();
updateWishlistButtons();
}
const DECOREVA_OPEN_PANEL_KEY = "decoreva_open_panel";
function saveOpenPanelState(panelName) {
try {
sessionStorage.setItem(DECOREVA_OPEN_PANEL_KEY, panelName);
} catch (error) {
}
}
function getOpenPanelState() {
try {
return sessionStorage.getItem(DECOREVA_OPEN_PANEL_KEY) || "";
} catch (error) {
return "";
}
}
function clearOpenPanelState() {
try {
sessionStorage.removeItem(DECOREVA_OPEN_PANEL_KEY);
} catch (error) {
}
}
function openCart() {
checkoutAddressUnlocked = false;
openCartDrawer();
}
function closeCart(restoreUnderlyingPosition = true) {
const drawer = document.querySelector("#decoreva-cart-drawer");
if (!drawer) return;
const pageScrollY = Number.isFinite(cartUnderlyingScrollY)
? cartUnderlyingScrollY
: (window.scrollY || window.pageYOffset || 0);
if (document.activeElement && typeof document.activeElement.blur === "function") {
document.activeElement.blur();
}
drawer.style.display = "none";
drawer.style.visibility = "hidden";
drawer.style.pointerEvents = "none";
checkoutStep = "cart";
const closingAddress = drawer.querySelector("#decoreva-checkout-address");
if (closingAddress) closingAddress.hidden = true;
const closingAddressMessage = drawer.querySelector("#decoreva-address-message");
if (closingAddressMessage) {
closingAddressMessage.textContent = "";
closingAddressMessage.className = "decoreva-address-message";
closingAddressMessage.dataset.userMessage = "";
}
drawer.classList.remove("decoreva-checkout-mode");
drawer.classList.remove("open");
document.body.classList.remove("decoreva-cart-open", "decoreva-checkout-open");
document.body.style.overflow = "";
document.documentElement.style.overflow = "";
drawer.setAttribute("aria-hidden", "true");
if (getOpenPanelState() === "cart") clearOpenPanelState();
if (restoreUnderlyingPosition) {
window.scrollTo(0, pageScrollY);
window.requestAnimationFrame(function () {
window.scrollTo(0, pageScrollY);
});
window.setTimeout(function () {
window.scrollTo(0, pageScrollY);
}, 60);
}
}
function openCartDrawer() {
const drawer = document.querySelector("#decoreva-cart-drawer");
if (!drawer) return;
cartUnderlyingScrollY = window.scrollY || window.pageYOffset || 0;
saveOpenPanelState("cart");
checkoutStep = "cart";
const addressMessage = drawer.querySelector("#decoreva-address-message");
if (addressMessage) {
addressMessage.textContent = "";
addressMessage.className = "decoreva-address-message";
addressMessage.dataset.userMessage = "";
}
drawer.style.display = "";
drawer.style.visibility = "visible";
drawer.style.pointerEvents = "";
drawer.classList.add("decoreva-checkout-mode");
renderCart();
updateCheckoutStepUI();
const steps = drawer.querySelector(".decoreva-checkout-steps");
if (steps) { steps.hidden = false; steps.style.display = "flex"; }
drawer.classList.add("open");
document.body.classList.add("decoreva-cart-open", "decoreva-checkout-open");
document.body.style.overflow = "hidden";
document.documentElement.style.overflow = "hidden";
drawer.setAttribute("aria-hidden", "false");
}
function openWishlist() {
const drawer = document.querySelector("#decoreva-wishlist-drawer");
if (!drawer) return;
saveOpenPanelState("wishlist");
renderWishlist();
drawer.classList.add("open");
drawer.setAttribute("aria-hidden", "false");
document.body.classList.add("decoreva-wishlist-open");
document.body.style.overflow = "hidden";
}
function closeWishlist() {
const drawer = document.querySelector("#decoreva-wishlist-drawer");
if (!drawer) return;
drawer.classList.remove("open");
drawer.setAttribute("aria-hidden", "true");
document.body.classList.remove("decoreva-wishlist-open");
if (!document.body.classList.contains("decoreva-cart-open")) document.body.style.overflow = "";
if (getOpenPanelState() === "wishlist") clearOpenPanelState();
}
function saveProfile() {
localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
const decorevaAddressSupabase = window.decorevaSupabase || null;
let decorevaOrderInProgress = false;
function generateDecorevaOrderNumber() {
const now = new Date();
const datePart = now.getFullYear().toString() +
String(now.getMonth() + 1).padStart(2, "0") +
String(now.getDate()).padStart(2, "0");
let randomPart = "";
if (window.crypto && typeof window.crypto.getRandomValues === "function") {
const bytes = new Uint8Array(4);
window.crypto.getRandomValues(bytes);
randomPart = Array.from(bytes, function (byte) {
return byte.toString(16).padStart(2, "0");
}).join("").toUpperCase();
} else {
randomPart = Math.random().toString(16).slice(2, 10).toUpperCase();
}
return "ORD-" + datePart + "-" + randomPart;
}
function formatDecorevaOrderNumber(orderNumber) {
const value = String(orderNumber || "").trim();
if (!value) return "DECOREVA Order";
return value.replace(/^DEC-/i, "ORD-");
}
function buildDeliveryAddressText(address) {
if (!address) return "";
return [
address.name || "",
"Mobile: " + (address.mobile || ""),
address.line || "",
(address.city || "") + ", " + (address.state || "") + " - " + (address.pincode || "")
].filter(Boolean).join("\n");
}
async function createSupabaseOrder() {
if (!cart.length || !deliveryAddress) {
throw new Error("Cart or delivery address is missing.");
}
if (!decorevaAddressSupabase) {
throw new Error("Supabase is not available on this page.");
}
const user = await getDecorevaAuthUser();
const orderNumber = generateDecorevaOrderNumber();
const subtotal = subtotalAmount();
const discount = discountAmount();
const delivery = deliveryCharge();
const total = finalAmount();
const coupon = effectiveCouponCode() || null;
const orderPayload = {
user_id: user ? user.id : null,
order_number: orderNumber,
status: "pending",
customer_name: deliveryAddress.name,
customer_phone: deliveryAddress.mobile,
delivery_address: buildDeliveryAddressText(deliveryAddress),
subtotal: subtotal,
delivery_charge: delivery,
discount: discount,
total: total,
coupon: coupon
};
const itemPayload = cart.map(function (item) {
return {
product_key: String(item.productId || item.id || ""),
product_name: String(item.title || "DECOREVA Product"),
variation: String(item.variationName || item.variationKey || ""),
quantity: Math.max(1, Number(item.quantity || 1)),
unit_price: Math.max(0, Number(item.price || 0))
};
});
const orderResult = await decorevaAddressSupabase.rpc(
"create_decoreva_order",
{
p_order: orderPayload,
p_items: itemPayload
}
);
if (orderResult.error) {
console.error("DECOREVA order create error:", orderResult.error);
throw orderResult.error;
}
const createdOrder = orderResult.data || {};
const orderId = createdOrder.id;
if (!orderId) {
throw new Error("Supabase did not return the created order ID.");
}
return {
id: orderId,
orderNumber: createdOrder.order_number || orderNumber,
userId: createdOrder.user_id || (user ? user.id : null)
};
}
async function getDecorevaAuthUser() {
if (!decorevaAddressSupabase || !decorevaAddressSupabase.auth) return null;
try {
const result = await decorevaAddressSupabase.auth.getUser();
return result.data && result.data.user ? result.data.user : null;
} catch (error) {
console.warn("DECOREVA address auth check:", error);
return null;
}
}
function formatDecorevaOrderDate(value) {
if (!value) return "Date unavailable";
try {
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "Date unavailable";
return date.toLocaleString("en-IN", {
day: "2-digit", month: "short", year: "numeric",
hour: "2-digit", minute: "2-digit"
});
} catch (error) { return "Date unavailable"; }
}
function formatDecorevaOrderMoney(value) {
const amount = Number(value);
if (!Number.isFinite(amount)) return "₹0";
try {
return new Intl.NumberFormat("en-IN", {
style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(amount);
} catch (error) {
return "₹" + Math.round(amount).toLocaleString("en-IN");
}
}
function formatDecorevaOrderStatus(value) {
const raw = String(value || "pending").trim().toLowerCase();
const label = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ")
.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
return { key: raw.replace(/[^a-z0-9_-]/g, ""), label: label || "Pending" };
}
function renderMyOrders(orders, itemsByOrderId) {
const list = document.querySelector("#decoreva-profile-orders");
if (!list) return;
list.replaceChildren();
if (!Array.isArray(orders) || !orders.length) {
const empty = document.createElement("div");
empty.className = "decoreva-profile-orders-empty";
empty.innerHTML = '<strong>No orders yet</strong><span>Your DECOREVA orders will appear here after checkout.</span>';
list.appendChild(empty);
return;
}
orders.forEach(function (order) {
const card = document.createElement("article");
card.className = "decoreva-profile-order-card";
const status = formatDecorevaOrderStatus(order.status);
const orderItems = Array.isArray(itemsByOrderId[order.id]) ? itemsByOrderId[order.id] : [];
const itemRows = orderItems.length ? orderItems.map(function (item) {
const quantity = Math.max(1, Number(item.quantity || 1));
const unitPrice = Math.max(0, Number(item.unit_price || 0));
const variation = String(item.variation || "").trim();
return '<div class="decoreva-profile-order-item">' +
'<div class="decoreva-profile-order-item-info">' +
'<strong>' + escapeProfileText(item.product_name || "DECOREVA Product") + '</strong>' +
(variation ? '<span>' + escapeProfileText(variation) + '</span>' : '') +
'<small>Qty: ' + quantity + '</small></div>' +
'<strong>' + formatDecorevaOrderMoney(unitPrice * quantity) + '</strong></div>';
}).join("") : '<div class="decoreva-profile-order-item-empty">Order items are not available.</div>';
const coupon = String(order.coupon || "").trim();
const discount = Number(order.discount || 0);
card.innerHTML =
'<div class="decoreva-profile-order-top"><div>' +
'<strong>' + escapeProfileText(formatDecorevaOrderNumber(order.order_number)) + '</strong>' +
'<span>' + escapeProfileText(formatDecorevaOrderDate(order.created_at)) + '</span></div>' +
'<span class="decoreva-profile-order-status status-' + status.key + '">' + escapeProfileText(status.label) + '</span></div>' +
'<div class="decoreva-profile-order-items">' + itemRows + '</div>' +
'<div class="decoreva-profile-order-summary">' +
'<span>Subtotal <strong>' + formatDecorevaOrderMoney(order.subtotal) + '</strong></span>' +
'<span>Delivery <strong>' + formatDecorevaOrderMoney(order.delivery_charge) + '</strong></span>' +
(discount > 0 ? '<span>Discount <strong>−' + formatDecorevaOrderMoney(discount) + '</strong></span>' : '') +
(coupon ? '<span>Coupon <strong>' + escapeProfileText(coupon) + '</strong></span>' : '') +
'<span class="decoreva-profile-order-total">Total <strong>' + formatDecorevaOrderMoney(order.total) + '</strong></span></div>';
list.appendChild(card);
});
}
async function loadMyOrders() {
const section = document.querySelector("#decoreva-profile-orders-section");
const list = document.querySelector("#decoreva-profile-orders");
if (!section || !list) return;
section.hidden = false;
list.innerHTML = '<div class="decoreva-profile-orders-loading">Loading your orders…</div>';
const user = await getDecorevaAuthUser();
if (!user) {
list.innerHTML = '<div class="decoreva-profile-orders-empty"><strong>Please login to view your orders</strong><span>Your logged-in DECOREVA orders are securely linked to your account.</span></div>';
return;
}
if (!decorevaAddressSupabase) {
list.innerHTML = '<div class="decoreva-profile-orders-empty"><strong>Orders are temporarily unavailable</strong><span>Please try again in a moment.</span></div>';
return;
}
try {
const ordersResult = await decorevaAddressSupabase
.from("orders")
.select("id, order_number, status, customer_name, customer_phone, delivery_address, subtotal, delivery_charge, discount, total, coupon, created_at")
.eq("user_id", user.id)
.order("created_at", { ascending: false });
if (ordersResult.error) throw ordersResult.error;
const orders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
if (!orders.length) {
renderMyOrders([], {});
return;
}
const orderIds = orders.map(function (order) { return order.id; });
const itemsResult = await decorevaAddressSupabase
.from("order_items")
.select("id, order_id, product_key, product_name, variation, quantity, unit_price")
.in("order_id", orderIds);
if (itemsResult.error) throw itemsResult.error;
const itemsByOrderId = {};
(Array.isArray(itemsResult.data) ? itemsResult.data : []).forEach(function (item) {
if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
itemsByOrderId[item.order_id].push(item);
});
renderMyOrders(orders, itemsByOrderId);
} catch (error) {
console.error("DECOREVA My Orders load error:", error);
list.innerHTML = '<div class="decoreva-profile-orders-empty error"><strong>Could not load your orders</strong><span>Please try again. Your other profile features are unchanged.</span></div>';
}
}
function mapSupabaseAddress(row) {
return {
id: row.id,
label: String(row.label || "HOME"),
name: String(row.recipient_name || ""),
mobile: String(row.phone || ""),
line: String(row.address_line || ""),
city: String(row.city || ""),
state: String(row.state || ""),
pincode: String(row.pincode || ""),
default: !!row.is_default
};
}
async function loadSupabaseAddresses() {
const user = await getDecorevaAuthUser();
if (!user || !decorevaAddressSupabase) return false;
const result = await decorevaAddressSupabase
.from("saved_addresses")
.select("id, user_id, label, recipient_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at")
.eq("user_id", user.id)
.order("is_default", { ascending: false })
.order("created_at", { ascending: true });
if (result.error) {
console.error("DECOREVA saved addresses load error:", result.error);
return false;
}
profile.addresses = Array.isArray(result.data)
? result.data.map(mapSupabaseAddress)
: [];
saveProfile();
return true;
}
async function saveSupabaseAddress(address, editIndex) {
const user = await getDecorevaAuthUser();
if (!user || !decorevaAddressSupabase) return false;
const payload = {
user_id: user.id,
label: address.label,
recipient_name: address.name,
phone: address.mobile,
address_line: address.line,
city: address.city,
state: address.state,
pincode: address.pincode,
is_default: !!address.default
};
if (address.default) {
const clearDefaults = await decorevaAddressSupabase
.from("saved_addresses")
.update({ is_default: false })
.eq("user_id", user.id);
if (clearDefaults.error) throw clearDefaults.error;
}
const existing = Number.isInteger(editIndex) && profile.addresses[editIndex]
? profile.addresses[editIndex]
: null;
let result;
if (existing && existing.id) {
result = await decorevaAddressSupabase
.from("saved_addresses")
.update(payload)
.eq("id", existing.id)
.eq("user_id", user.id)
.select("id, user_id, label, recipient_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at")
.single();
} else {
result = await decorevaAddressSupabase
.from("saved_addresses")
.insert(payload)
.select("id, user_id, label, recipient_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at")
.single();
}
if (result.error) throw result.error;
await loadSupabaseAddresses();
return true;
}
async function deleteSupabaseAddress(address) {
const user = await getDecorevaAuthUser();
if (!user || !decorevaAddressSupabase || !address || !address.id) return false;
const result = await decorevaAddressSupabase
.from("saved_addresses")
.delete()
.eq("id", address.id)
.eq("user_id", user.id);
if (result.error) throw result.error;
await loadSupabaseAddresses();
if (profile.addresses.length && !profile.addresses.some(function (item) { return item.default; })) {
await setSupabaseDefaultAddress(profile.addresses[0]);
}
return true;
}
async function setSupabaseDefaultAddress(address) {
const user = await getDecorevaAuthUser();
if (!user || !decorevaAddressSupabase || !address || !address.id) return false;
let result = await decorevaAddressSupabase
.from("saved_addresses")
.update({ is_default: false })
.eq("user_id", user.id);
if (result.error) throw result.error;
result = await decorevaAddressSupabase
.from("saved_addresses")
.update({ is_default: true })
.eq("id", address.id)
.eq("user_id", user.id);
if (result.error) throw result.error;
await loadSupabaseAddresses();
return true;
}
function escapeProfileText(value) {
return String(value || "").replace(/[&<>\"]/g, function (char) {
return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
});
}
function renderProfile() {
const panel = document.querySelector("#decoreva-profile-panel");
if (!panel) return;
const name = document.querySelector("#decoreva-profile-name");
const mobile = document.querySelector("#decoreva-profile-mobile");
const email = document.querySelector("#decoreva-profile-email");
const status = document.querySelector("#decoreva-profile-message");
const addressList = document.querySelector("#decoreva-profile-addresses");
const summary = document.querySelector("#decoreva-profile-summary");
if (name && !name.value) name.value = profile.name;
if (mobile && !mobile.value) mobile.value = profile.mobile;
if (email && !email.value) email.value = profile.email;
if (summary) {
summary.innerHTML = profile.name
? '<strong>' + escapeProfileText(profile.name) + '</strong><span>' + escapeProfileText(profile.mobile || "") + (profile.email ? ' • ' + escapeProfileText(profile.email) : '') + '</span>'
: '<strong>Guest Customer</strong><span>Create your profile and save your delivery details on this device.</span>';
}
if (addressList) {
addressList.replaceChildren();
if (!profile.addresses.length) {
const empty = document.createElement("div");
empty.className = "decoreva-profile-address-empty";
empty.textContent = "No saved addresses yet.";
addressList.appendChild(empty);
} else {
profile.addresses.forEach(function (address, index) {
const card = document.createElement("div");
card.className = "decoreva-profile-address-card" + (address.default ? " default" : "");
card.innerHTML = '<div class="decoreva-profile-address-top"><strong>' + escapeProfileText(address.label || "HOME") + '</strong>' + (address.default ? '<span>DEFAULT</span>' : '') + '</div>' +
'<div class="decoreva-profile-address-name">' + escapeProfileText(address.name || profile.name) + '</div>' +
'<div class="decoreva-profile-address-text">' + escapeProfileText(address.line) + '<br>' + escapeProfileText(address.city) + ', ' + escapeProfileText(address.state) + ' - ' + escapeProfileText(address.pincode) + '<br>Mobile: ' + escapeProfileText(address.mobile || profile.mobile) + '</div>' +
'<div class="decoreva-profile-address-actions">' +
(!address.default ? '<button type="button" data-profile-address-action="default" data-profile-address-index="' + index + '">Set Default</button>' : '') +
'<button type="button" data-profile-address-action="edit" data-profile-address-index="' + index + '">Edit</button>' +
'<button type="button" data-profile-address-action="delete" data-profile-address-index="' + index + '">Delete</button>' +
'</div>';
addressList.appendChild(card);
});
}
}
if (status && !status.dataset.persistent) status.textContent = "";
}
function showProfileAddressForm(index) {
const form = document.querySelector("#decoreva-profile-address-form");
if (!form) return;
form.hidden = false;
form.dataset.editIndex = Number.isInteger(index) ? String(index) : "";
const address = Number.isInteger(index) && profile.addresses[index] ? profile.addresses[index] : {};
const set = function (id, value) { const el = document.querySelector(id); if (el) el.value = value || ""; };
set("#decoreva-profile-address-label", address.label || "HOME");
set("#decoreva-profile-address-name", address.name || profile.name);
set("#decoreva-profile-address-mobile", address.mobile || profile.mobile);
set("#decoreva-profile-address-line", address.line);
set("#decoreva-profile-address-city", address.city);
set("#decoreva-profile-address-state", address.state);
set("#decoreva-profile-address-pincode", address.pincode);
const msg = document.querySelector("#decoreva-profile-address-message");
if (msg) msg.textContent = "";
const title = document.querySelector("#decoreva-profile-address-form-title");
if (title) title.textContent = Number.isInteger(index) ? "Edit Address" : "Add New Address";
const save = document.querySelector("#decoreva-profile-address-save");
if (save) save.textContent = Number.isInteger(index) ? "Update Address" : "Save Address";
}
function hideProfileAddressForm() {
const form = document.querySelector("#decoreva-profile-address-form");
if (form) { form.hidden = true; form.dataset.editIndex = ""; }
}
function resetProfileToStart() {
const welcome = document.querySelector("#decoreva-profile-panel .decoreva-profile-welcome");
const menu = document.querySelector("#decoreva-profile-panel .decoreva-profile-menu");
const note = document.querySelector("#decoreva-profile-panel .decoreva-profile-note");
const personalSection = document.querySelector("#decoreva-profile-personal-section");
const addressSection = document.querySelector("#decoreva-profile-address-section");
const ordersSection = document.querySelector("#decoreva-profile-orders-section");
const status = document.querySelector("#decoreva-profile-message");
const card = document.querySelector("#decoreva-profile-panel .decoreva-profile-card");
if (welcome) welcome.hidden = false;
if (menu) menu.hidden = false;
if (note) note.hidden = false;
if (personalSection) personalSection.hidden = true;
if (addressSection) addressSection.hidden = true;
if (ordersSection) ordersSection.hidden = true;
hideProfileAddressForm();
if (status) {
status.textContent = "";
status.className = "decoreva-profile-message";
delete status.dataset.persistent;
}
if (card) card.scrollTop = 0;
}
async function openProfile() {
const panel = document.querySelector("#decoreva-profile-panel");
if (!panel) return;
/* Accessibility: remember the element that opened Profile so
focus can leave the panel before aria-hidden="true" is set. */
const activeBeforeProfile = document.activeElement;
if (activeBeforeProfile && activeBeforeProfile !== panel && !panel.contains(activeBeforeProfile)) {
panel._decorevaProfileReturnFocus = activeBeforeProfile;
}
/* MOBILE ONLY:
Always close the hamburger navigation before opening
the Profile panel. This keeps the two panels from
remaining open together on phone view. Desktop is untouched. */
if (window.innerWidth <= 760) {
const mobileNav = document.querySelector("#main-nav");
const mobileMenuButton = document.querySelector(".mobile-menu-toggle");
if (mobileNav) {
mobileNav.classList.remove("mobile-open");
}
document.body.classList.remove("menu-open");
if (mobileMenuButton) {
mobileMenuButton.setAttribute("aria-expanded", "false");
}
}
closeMyOrdersDrawer();
/* Every time Profile opens, start from the original
Profile menu view — not the previously opened section. */
resetProfileToStart();
renderProfile();
panel.classList.add("open");
panel.setAttribute("aria-hidden", "false");
const user = await getDecorevaAuthUser();
if (user && decorevaAddressSupabase) {
await loadSupabaseAddresses();
renderProfile();
}
}
function closeMyOrdersDrawer() {
const drawer = document.querySelector("#decoreva-orders-drawer");
const section = document.querySelector("#decoreva-profile-orders-section");
if (drawer) {
/* Accessibility: move focus outside the Orders drawer
BEFORE setting aria-hidden="true". Chrome otherwise
warns when the close button remains focused inside
an element that is being hidden from assistive tech.
This changes only focus handling; Orders UI/behaviour
remains unchanged. */
if (drawer.contains(document.activeElement)) {
const profileNav = document.querySelector("#decoreva-profile-nav");
if (profileNav && typeof profileNav.focus === "function") {
try { profileNav.focus({ preventScroll: true }); } catch (error) { profileNav.focus(); }
} else if (document.activeElement && typeof document.activeElement.blur === "function") {
document.activeElement.blur();
}
}
drawer.classList.remove("open");
drawer.setAttribute("aria-hidden", "true");
}
if (section) {
section.hidden = true;
}
const profileBack = section ? section.querySelector("[data-profile-orders-back]") : null;
if (profileBack) profileBack.hidden = false;
document.body.classList.remove("decoreva-orders-open");
if (!document.querySelector(".decoreva-profile-panel.open") && !document.querySelector(".decoreva-side-drawer.open")) {
document.body.style.overflow = "";
}
}
function closeProfile(callback) {
const panel = document.querySelector("#decoreva-profile-panel");
if (!panel) {
if (typeof callback === "function") callback();
return;
}
const card = panel.querySelector(".decoreva-profile-card");
if (panel._decorevaProfileCloseTimer) {
clearTimeout(panel._decorevaProfileCloseTimer);
panel._decorevaProfileCloseTimer = null;
}
if (!panel.classList.contains("open")) {
if (typeof callback === "function") callback();
return;
}
if (card) {
card.style.transition = "transform .18s ease";
void card.offsetWidth;
card.style.transform = "translateY(-8px) scale(.985)";
}
panel._decorevaProfileCloseTimer = window.setTimeout(function () {
/* Move focus outside the Profile panel BEFORE hiding it
from assistive technology. This removes Chrome's
"Blocked aria-hidden" warning without changing the
Profile UI, animation, menu state, or behaviour. */
const returnFocus = panel._decorevaProfileReturnFocus;
if (panel.contains(document.activeElement)) {
if (returnFocus && document.contains(returnFocus) && typeof returnFocus.focus === "function") {
try { returnFocus.focus({ preventScroll: true }); } catch (error) { returnFocus.focus(); }
} else {
const profileNav = document.querySelector("#decoreva-profile-nav");
if (profileNav && typeof profileNav.focus === "function") {
profileNav.focus({ preventScroll: true });
} else if (document.activeElement && typeof document.activeElement.blur === "function") {
document.activeElement.blur();
}
}
}
panel.classList.remove("open");
panel.setAttribute("aria-hidden", "true");
if (card) {
card.style.transition = "";
card.style.transform = "";
}
resetProfileToStart();
panel._decorevaProfileCloseTimer = null;
panel._decorevaProfileReturnFocus = null;
if (typeof callback === "function") {
callback();
}
}, 180);
}
window.decorevaCloseProfile = closeProfile;
function addToCart(card) {
const data = getCardData(card);
if (!data || !data.price) return;
const existing = cart.find(function (item) {
return item.id === data.id;
});
if (existing) {
existing.quantity += 1;
} else {
data.quantity = 1;
cart.push(data);
}
saveCart();
updateCartCount();
renderCart();
showShopToast("Added to Cart");
}
function showShopToast(message, duration) {
const oldToast = document.querySelector(".decoreva-shop-toast");
if (oldToast) oldToast.remove();
const toast = document.createElement("div");
toast.className = "decoreva-shop-toast";
toast.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span></span>';
toast.querySelector("span").textContent = message;
const isCartWishlistToast =
message === "Added to Cart" ||
message === "Removed from Cart" ||
message === "Added to Wishlist" ||
message === "Removed from Wishlist";
if (isCartWishlistToast && window.innerWidth <= 760) {
toast.style.setProperty("width", "min(250px, calc(100vw - 32px))", "important");
toast.style.setProperty("min-width", "0", "important");
toast.style.setProperty("max-width", "calc(100vw - 32px)", "important");
toast.style.setProperty("box-sizing", "border-box", "important");
toast.style.setProperty("padding", "8px 12px", "important");
toast.style.setProperty("gap", "8px", "important");
toast.style.setProperty("font-size", "12px", "important");
toast.style.setProperty("line-height", "1.25", "important");
toast.style.setProperty("border-radius", "7px", "important");
const icon = toast.querySelector("i");
const messageNode = toast.querySelector("span");
if (icon) {
icon.style.setProperty("font-size", "11px", "important");
icon.style.setProperty("width", "18px", "important");
icon.style.setProperty("min-width", "18px", "important");
}
if (messageNode) {
messageNode.style.setProperty("font-size", "12px", "important");
messageNode.style.setProperty("line-height", "1.25", "important");
}
}
document.body.appendChild(toast);
requestAnimationFrame(function () {
toast.classList.add("show");
});
duration = Number(duration) > 0 ? Number(duration) : 1050;
window.setTimeout(function () {
toast.classList.remove("show");
window.setTimeout(function () {
if (toast.parentNode) toast.remove();
}, 170);
}, duration);
}
window.decorevaShowShopToast = showShopToast;
function showRatingToast(row, message) {
const oldToast = document.querySelector(".decoreva-shop-toast");
if (oldToast) oldToast.remove();
const toast = document.createElement("div");
toast.className = "decoreva-shop-toast show";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
toast.innerHTML =
'<i class="fas fa-check" aria-hidden="true"></i><span></span>';
const messageNode = toast.querySelector("span");
if (messageNode) messageNode.textContent = message;
toast.style.opacity = "1";
toast.style.transform = "translateY(0)";
toast.style.visibility = "visible";
toast.style.display = "flex";
document.body.appendChild(toast);
clearTimeout(window.__decorevaRatingToastTimer);
window.__decorevaRatingToastTimer = window.setTimeout(function () {
toast.style.opacity = "0";
toast.style.transform = "translateY(-8px)";
window.setTimeout(function () {
if (toast.parentNode) toast.remove();
}, 180);
}, 2200);
}
window.decorevaShowReviewToast = function (message) {
const reviewForm = document.querySelector("#decoreva-review-modal.open .decoreva-review-form");
if (!reviewForm) {
showShopToast(message, 2200);
return;
}
const oldToast = reviewForm.querySelector(".decoreva-review-toast");
if (oldToast) oldToast.remove();
const toast = document.createElement("div");
toast.className = "decoreva-review-toast";
toast.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span></span>';
toast.querySelector("span").textContent = message;
reviewForm.appendChild(toast);
requestAnimationFrame(function () {
toast.classList.add("show");
});
window.setTimeout(function () {
toast.classList.remove("show");
window.setTimeout(function () {
if (toast.parentNode) toast.remove();
}, 180);
}, 2200);
};
function toggleWishlist(card) {
const data = getCardData(card);
if (!data) return;
const index = wishlist.findIndex(function (item) {
return item.id === data.id;
});
if (index >= 0) {
wishlist.splice(index, 1);
showShopToast("Removed from Wishlist");
} else {
wishlist.push(data);
showShopToast("Added to Wishlist");
}
saveWishlist();
updateWishlistCount();
renderWishlist();
}
function applyCoupon() {
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
if (!input || !message) return;
const code = input.value.trim().toUpperCase();
if (!code) {
appliedCoupon = "";
saveCoupon();
message.textContent = "";
message.className = "decoreva-coupon-message";
renderCart();
return;
}
if (!COUPONS[code]) {
appliedCoupon = "";
saveCoupon();
message.textContent = "Invalid coupon code.";
message.className = "decoreva-coupon-message error";
renderCart();
return;
}
appliedCoupon = code;
couponPreviewCode = "";
saveCoupon();
message.textContent = "✓ " + code + " APPLIED — 10% OFF";
message.className = "decoreva-coupon-message success";
renderCart();
renderCheckoutSummary();
const appliedInput = document.querySelector("#decoreva-coupon-input");
if (appliedInput) {
appliedInput.value = code;
appliedInput.focus();
appliedInput.select();
}
const appliedRemoveButton = document.querySelector("#decoreva-coupon-remove");
if (appliedRemoveButton) {
appliedRemoveButton.style.display = "inline-flex";
}
const appliedUseButton = document.querySelector(".decoreva-coupon-use[data-coupon-use='" + code + "']");
if (appliedUseButton) {
appliedUseButton.textContent = "APPLIED ✓";
appliedUseButton.classList.add("applied");
appliedUseButton.disabled = true;
}
}
function openCouponModal() {
const modal = document.querySelector("#decoreva-coupon-modal");
if (!modal) return;
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
const removeButton = document.querySelector("#decoreva-coupon-remove");
if (input) input.value = appliedCoupon || couponPreviewCode || "";
if (removeButton) {
removeButton.style.display = appliedCoupon ? "inline-flex" : "none";
removeButton.setAttribute("aria-label", appliedCoupon ? "Remove applied coupon " + appliedCoupon : "Remove coupon");
}
const openUseButton = document.querySelector(".decoreva-coupon-use[data-coupon-use='WELCOME10']");
if (openUseButton) {
const isWelcomeApplied = appliedCoupon === "WELCOME10";
openUseButton.textContent = isWelcomeApplied ? "APPLIED ✓" : "USE COUPON";
openUseButton.classList.toggle("applied", isWelcomeApplied);
openUseButton.disabled = isWelcomeApplied;
}
if (message && !appliedCoupon && !couponPreviewCode) {
message.textContent = "";
message.className = "decoreva-coupon-message";
}
modal.classList.add("open");
modal.setAttribute("aria-hidden", "false");
couponModalOpen = true;
window.setTimeout(function () { if (input) input.focus(); }, 50);
}
function closeCouponModal() {
const modal = document.querySelector("#decoreva-coupon-modal");
if (!modal) return;
modal.classList.remove("open");
modal.setAttribute("aria-hidden", "true");
couponModalOpen = false;
if (couponPreviewCode && couponPreviewCode !== appliedCoupon) {
couponPreviewCode = "";
renderCart();
renderCheckoutSummary();
}
}
function beginWhatsAppCheckout() {
if (!cart.length) return;
deliveryAddress = null;
checkoutStep = "address";
const drawer = document.querySelector("#decoreva-cart-drawer");
if (drawer) {
drawer.classList.add("decoreva-checkout-mode");
drawer.classList.add("open");
drawer.setAttribute("aria-hidden", "false");
}
document.body.classList.add("decoreva-cart-open", "decoreva-checkout-open");
document.body.style.overflow = "hidden";
document.documentElement.style.overflow = "hidden";
updateCheckoutStepUI();
[
"#decoreva-address-name",
"#decoreva-address-mobile",
"#decoreva-address-line",
"#decoreva-address-city",
"#decoreva-address-state",
"#decoreva-address-pincode"
].forEach(function (id) {
const el = document.querySelector(id);
if (el) el.value = "";
});
updateAddressContinueState();
window.setTimeout(function () {
const address = document.querySelector("#decoreva-checkout-address");
const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
if (address && panel) {
panel.scrollTo({
top: Math.max(0, address.offsetTop - 18),
behavior: "smooth"
});
}
}, 40);
}
async function whatsappCheckout() {
if (!cart.length || !deliveryAddress || decorevaOrderInProgress) return;
decorevaOrderInProgress = true;
const button = document.querySelector("#decoreva-cart-whatsapp");
const paymentButton = document.querySelector("#decoreva-payment-order");
const message = document.querySelector("#decoreva-address-message");
const originalButtonText = button ? button.textContent : "Order on WhatsApp";
const originalPaymentText = paymentButton ? paymentButton.textContent : "Place Order on WhatsApp";
if (button) {
button.disabled = true;
button.textContent = "Saving Order...";
}
if (paymentButton) {
paymentButton.disabled = true;
paymentButton.textContent = "Saving Order...";
}
try {
const order = await createSupabaseOrder();
if (!order) {
if (button) {
button.disabled = false;
button.textContent = originalButtonText;
}
if (paymentButton) {
paymentButton.disabled = false;
paymentButton.textContent = originalPaymentText;
}
return;
}
const lines = [
"Hello DECOREVA, I want to order:",
"",
"Order Number: " + order.orderNumber,
""
];
cart.forEach(function (item, index) {
let line = (index + 1) + ". " + item.title;
if (item.variationName) line += " - " + item.variationName;
line += " × " + item.quantity + " = " + money(item.price * item.quantity);
lines.push(line);
});
lines.push("", "Total MRP: " + money(subtotalAmount()));
if (appliedCoupon) {
lines.push("Coupon: " + appliedCoupon + " (10% OFF)");
lines.push("Discount on MRP: - " + money(discountAmount()));
}
lines.push("Delivery: " + money(deliveryCharge()), "Total Amount: " + money(finalAmount()));
if (deliveryAddress) {
lines.push(
"",
"Delivery Address:",
deliveryAddress.name,
"Mobile: " + deliveryAddress.mobile,
deliveryAddress.line,
deliveryAddress.city + ", " + deliveryAddress.state + " - " + deliveryAddress.pincode
);
}
lines.push("", "Please confirm availability and payment details.");
const whatsappUrl =
"https://wa.me/919582899547?text=" +
encodeURIComponent(lines.join("\n"));
window.open(
whatsappUrl,
"_blank",
"noopener,noreferrer"
);
showOrderConfirmation(order.orderNumber);
if (message) {
message.dataset.userMessage = "1";
message.textContent = "Order " + order.orderNumber + " saved. WhatsApp opened for confirmation.";
message.className = "decoreva-address-message success";
}
} catch (error) {
console.error("DECOREVA order submission error:", error);
if (message) {
message.dataset.userMessage = "1";
message.textContent = "Could not save your order. Please try again. Your WhatsApp order was not opened.";
message.className = "decoreva-address-message error";
}
alert("We could not save your order. Please try again.");
} finally {
decorevaOrderInProgress = false;
if (button) {
button.disabled = !cart.length;
button.textContent = originalButtonText;
}
if (paymentButton) {
paymentButton.disabled = false;
paymentButton.textContent = originalPaymentText;
}
}
}
function showOrderConfirmation(orderNumber) {
if (!document.getElementById("decoreva-mobile-order-confirmation-compact")) {
const compactStyle = document.createElement("style");
compactStyle.id = "decoreva-mobile-order-confirmation-compact";
compactStyle.textContent = `
@media (max-width: 760px) {
#decoreva-order-confirmation {
padding: 14px !important;
box-sizing: border-box !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-card {
width: min(310px, calc(100vw - 36px)) !important;
max-width: calc(100vw - 36px) !important;
margin: 0 auto !important;
padding: 18px 16px 16px !important;
box-sizing: border-box !important;
border-radius: 9px !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-icon {
width: 46px !important;
height: 46px !important;
margin: 0 auto 12px !important;
font-size: 27px !important;
line-height: 46px !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-card > strong {
font-size: 18px !important;
line-height: 1.2 !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-text {
margin: 9px 0 15px !important;
font-size: 11.5px !important;
line-height: 1.45 !important;
}
#decoreva-order-confirmation #decoreva-order-confirmation-close {
width: 100% !important;
min-height: 42px !important;
height: 42px !important;
padding: 0 12px !important;
font-size: 12px !important;
border-radius: 6px !important;
}
}
@media (max-width: 400px) {
#decoreva-order-confirmation .decoreva-order-confirmation-card {
width: calc(100vw - 40px) !important;
max-width: calc(100vw - 40px) !important;
padding: 16px 14px 14px !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-icon {
width: 42px !important;
height: 42px !important;
margin-bottom: 10px !important;
font-size: 24px !important;
line-height: 42px !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-card > strong {
font-size: 17px !important;
}
#decoreva-order-confirmation .decoreva-order-confirmation-text {
margin: 8px 0 13px !important;
font-size: 11px !important;
}
#decoreva-order-confirmation #decoreva-order-confirmation-close {
min-height: 40px !important;
height: 40px !important;
}
}
`;
document.head.appendChild(compactStyle);
}
let confirmation = document.querySelector("#decoreva-order-confirmation");
if (!confirmation) {
confirmation = document.createElement("div");
confirmation.id = "decoreva-order-confirmation";
confirmation.className = "decoreva-order-confirmation";
confirmation.innerHTML = `
<div class="decoreva-order-confirmation-overlay"></div>
<div class="decoreva-order-confirmation-card" role="dialog" aria-modal="true" aria-label="Order confirmation">
<div class="decoreva-order-confirmation-icon">✓</div>
<strong>Order Request Saved</strong>
<p class="decoreva-order-confirmation-text"></p>
<button type="button" id="decoreva-order-confirmation-close">Continue Shopping</button>
</div>`;
document.body.appendChild(confirmation);
}
const confirmationText = confirmation.querySelector(".decoreva-order-confirmation-text");
if (confirmationText) {
confirmationText.textContent =
"Order " + (orderNumber || "") + " has been saved. Your order details are open in WhatsApp. Please send the message to DECOREVA to confirm your order.";
}
cart = [];
saveCart();
updateCartCount();
renderCart();
checkoutStep = "cart";
checkoutAddressUnlocked = false;
deliveryAddress = null;
appliedCoupon = "";
couponPreviewCode = "";
saveCoupon();
confirmation.classList.add("open");
}
function renderCheckoutSavedAddresses() {
return;
}
function fillCheckoutAddress(address) {
if (!address) return;
const values = {
"#decoreva-address-name": address.name || profile.name,
"#decoreva-address-mobile": address.mobile || profile.mobile,
"#decoreva-address-line": address.line || "",
"#decoreva-address-city": address.city || "",
"#decoreva-address-state": address.state || "",
"#decoreva-address-pincode": address.pincode || ""
};
Object.keys(values).forEach(function (id) { const el = document.querySelector(id); if (el) el.value = values[id]; });
}
(function ensureEmptyCartPremiumStyle() {
if (document.getElementById("decoreva-empty-cart-premium-style")) return;
const style = document.createElement("style");
style.id = "decoreva-empty-cart-premium-style";
style.textContent = `
#decoreva-cart-drawer .decoreva-cart-head {
justify-content: center !important;
position: relative !important;
}
#decoreva-cart-drawer .decoreva-cart-head-title {
text-align: center !important;
align-items: center !important;
}
#decoreva-cart-drawer .decoreva-cart-head-title strong {
display: block !important;
width: 100% !important;
text-align: center !important;
}
#decoreva-cart-drawer .decoreva-cart-close {
position: absolute !important;
right: 16px !important;
}
#decoreva-cart-drawer .decoreva-cart-empty {
width: min(92%, 620px) !important;
margin: 55px auto 70px !important;
padding: 42px 24px !important;
box-sizing: border-box !important;
text-align: center !important;
font-size: 24px !important;
line-height: 1.4 !important;
font-weight: 700 !important;
letter-spacing: .1px !important;
border-radius: 14px !important;
position: relative !important;
left: 50% !important;
transform: translateX(-50%) !important;
}
#decoreva-cart-drawer .decoreva-cart-head-title > span {
display: none !important;
}
#decoreva-cart-drawer .decoreva-empty-cart-message {
display: block !important;
margin-bottom: 24px !important;
}
#decoreva-cart-drawer .decoreva-empty-cart-back {
display: inline-flex !important;
align-items: center !important;
justify-content: center !important;
min-width: 190px !important;
min-height: 46px !important;
padding: 11px 22px !important;
box-sizing: border-box !important;
border: 1px solid #b77a13 !important;
border-radius: 8px !important;
background: #c98b18 !important;
color: #ffffff !important;
font-family: inherit !important;
font-size: 14px !important;
font-weight: 800 !important;
line-height: 1 !important;
letter-spacing: .1px !important;
cursor: pointer !important;
transition: transform .15s ease, background-color .15s ease, box-shadow .15s ease !important;
}
#decoreva-cart-drawer .decoreva-empty-cart-back:hover {
background: #b77a13 !important;
transform: translateY(-1px) !important;
box-shadow: 0 5px 14px rgba(0,0,0,.12) !important;
}
#decoreva-cart-drawer .decoreva-empty-cart-back:active {
transform: translateY(0) !important;
}
`;
document.head.appendChild(style);
})();
(function ensureCheckoutSimilarProductsPremiumStyle() {
if (document.getElementById("decoreva-checkout-similar-products-style")) return;
const style = document.createElement("style");
style.id = "decoreva-checkout-similar-products-style";
style.textContent = `
#decoreva-cart-drawer .decoreva-similar-products {
width: 100% !important;
max-width: none !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-similar-head {
width: 100% !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-similar-grid {
width: 100% !important;
max-width: none !important;
display: grid !important;
grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
gap: 14px !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-similar-card {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
overflow: hidden !important;
display: flex !important;
flex-direction: column !important;
background: #fff !important;
border: 1px solid rgba(139,106,50,.18) !important;
border-radius: 8px !important;
box-shadow: 0 2px 9px rgba(62,42,20,.07) !important;
}
#decoreva-cart-drawer .decoreva-similar-card-image {
width: 100% !important;
aspect-ratio: 1 / 1 !important;
min-height: 0 !important;
overflow: hidden !important;
background: #f7f1e7 !important;
display: flex !important;
align-items: center !important;
justify-content: center !important;
}
#decoreva-cart-drawer .decoreva-similar-card-image img {
display: block !important;
width: 100% !important;
height: 100% !important;
max-width: none !important;
object-fit: cover !important;
object-position: center !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
display: flex !important;
flex-direction: column !important;
align-items: stretch !important;
gap: 7px !important;
padding: 11px 10px 10px !important;
background: #fff !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info strong {
display: block !important;
min-height: 34px !important;
color: #3f2d1c !important;
font-size: 12px !important;
line-height: 1.4 !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info > span {
display: block !important;
color: #9a6b13 !important;
font-size: 13px !important;
font-weight: 800 !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info button {
width: 100% !important;
min-height: 34px !important;
margin-top: 1px !important;
border: 0 !important;
border-radius: 5px !important;
background: #c98b18 !important;
color: #fff !important;
font-size: 10px !important;
font-weight: 800 !important;
letter-spacing: .2px !important;
cursor: pointer !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info button:hover {
background: #b77a13 !important;
}
@media (max-width: 900px) {
#decoreva-cart-drawer .decoreva-similar-grid {
grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
}
}
@media (max-width: 650px) {
#decoreva-cart-drawer .decoreva-similar-grid {
grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
gap: 14px !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info {
padding: 9px 8px 8px !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info strong {
font-size: 11px !important;
}
}
`;
document.head.appendChild(style);
})();
(function ensureDecorevaMobileCartCheckoutPolish() {
if (document.getElementById("decoreva-mobile-cart-checkout-polish")) return;
const style = document.createElement("style");
style.id = "decoreva-mobile-cart-checkout-polish";
style.textContent = `
/* DECOREVA — MOBILE CART / CHECKOUT POLISH ONLY
Desktop and tablet remain untouched. */
@media (max-width: 760px) {
#decoreva-cart-drawer,
#decoreva-cart-drawer .decoreva-cart-panel {
width: 100vw !important;
max-width: 100vw !important;
box-sizing: border-box !important;
}
/* Cart products: give the product image real mobile space. */
#decoreva-cart-drawer .decoreva-cart-item {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
display: grid !important;
grid-template-columns: 138px minmax(0, 1fr) !important;
gap: 14px !important;
align-items: center !important;
padding: 12px !important;
}
#decoreva-cart-drawer .decoreva-cart-item > img {
display: block !important;
width: 138px !important;
height: 138px !important;
min-width: 138px !important;
max-width: 138px !important;
object-fit: cover !important;
object-position: center !important;
background: #fff !important;
border-radius: 6px !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-cart-item-info {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-cart-item-info strong {
display: block !important;
line-height: 1.3 !important;
word-break: normal !important;
overflow-wrap: anywhere !important;
}
/* Keep quantity controls usable without making the card taller than necessary. */
#decoreva-cart-drawer .decoreva-cart-item-controls {
display: flex !important;
align-items: center !important;
flex-wrap: wrap !important;
gap: 8px !important;
}
/* Cart/billing summary: compact, full-width mobile card. */
#decoreva-cart-drawer .decoreva-cart-footer {
width: calc(100% - 24px) !important;
max-width: none !important;
margin: 14px auto 24px !important;
padding: 18px 14px !important;
box-sizing: border-box !important;
border-radius: 12px !important;
}
#decoreva-cart-drawer .decoreva-coupon-summary-row,
#decoreva-cart-drawer .decoreva-cart-summary-row,
#decoreva-cart-drawer .decoreva-cart-total-row {
width: 100% !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-coupon-summary-row {
min-height: 38px !important;
margin-bottom: 10px !important;
}
#decoreva-cart-drawer .decoreva-cart-summary-row {
min-height: 34px !important;
margin: 0 !important;
}
#decoreva-cart-drawer .decoreva-cart-total-row {
min-height: 42px !important;
margin-top: 6px !important;
}
#decoreva-cart-drawer #decoreva-cart-whatsapp {
width: 100% !important;
min-height: 48px !important;
margin-top: 12px !important;
box-sizing: border-box !important;
}
/* Checkout address/order-summary card: no oversized desktop-style box on phones. */
#decoreva-cart-drawer .decoreva-checkout-summary {
width: 100% !important;
max-width: none !important;
margin: 8px 0 12px !important;
padding: 12px 12px 10px !important;
box-sizing: border-box !important;
border-radius: 12px !important;
background: #fffdf8 !important;
border: 1px solid rgba(181, 132, 39, .16) !important;
box-shadow: 0 4px 14px rgba(76, 48, 15, .07) !important;
}
#decoreva-cart-drawer .decoreva-checkout-summary-item,
#decoreva-cart-drawer .decoreva-checkout-summary-total {
width: 100% !important;
min-height: 30px !important;
box-sizing: border-box !important;
margin: 0 !important;
padding: 4px 0 !important;
}
#decoreva-cart-drawer .decoreva-checkout-summary-total.final {
min-height: 38px !important;
margin-top: 3px !important;
padding-top: 8px !important;
}
#decoreva-cart-drawer .decoreva-checkout-summary-coupon,
#decoreva-cart-drawer .decoreva-checkout-coupon-row {
min-height: 34px !important;
margin: 0 0 5px !important;
padding: 4px 0 !important;
}
#decoreva-cart-drawer .decoreva-checkout-coupon-row button {
min-height: 32px !important;
padding: 5px 8px !important;
font-size: 12px !important;
}
/* Checkout item images: larger and show the complete product image. */
#decoreva-cart-drawer .decoreva-checkout-item {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
display: grid !important;
grid-template-columns: 132px minmax(0, 1fr) !important;
gap: 11px !important;
align-items: center !important;
padding: 9px !important;
}
#decoreva-cart-drawer .decoreva-checkout-item > img {
display: block !important;
width: 132px !important;
height: 132px !important;
min-width: 132px !important;
max-width: 132px !important;
object-fit: contain !important;
object-position: center !important;
background: #fff !important;
border-radius: 6px !important;
}
/* You May Also Like: use the complete source image, not a cropped cover. */
#decoreva-cart-drawer .decoreva-similar-products {
width: 100% !important;
max-width: none !important;
margin: 18px 0 24px !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-similar-grid {
width: 100% !important;
grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
gap: 14px !important;
}
#decoreva-cart-drawer .decoreva-similar-card {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer .decoreva-similar-card-image {
width: 100% !important;
aspect-ratio: 1 / 1 !important;
height: auto !important;
overflow: hidden !important;
display: flex !important;
align-items: center !important;
justify-content: center !important;
background: #f7f1e7 !important;
}
#decoreva-cart-drawer .decoreva-similar-card-image img {
display: block !important;
width: 100% !important;
height: 100% !important;
max-width: none !important;
max-height: none !important;
object-fit: cover !important;
object-position: center !important;
}
#decoreva-cart-drawer .decoreva-similar-card-info {
width: 100% !important;
min-width: 0 !important;
box-sizing: border-box !important;
padding: 9px 8px 10px !important;
}
}
@media (max-width: 400px) {
#decoreva-cart-drawer .decoreva-cart-item {
grid-template-columns: 130px minmax(0, 1fr) !important;
gap: 10px !important;
padding: 9px !important;
}
#decoreva-cart-drawer .decoreva-cart-item > img {
width: 130px !important;
height: 130px !important;
min-width: 130px !important;
max-width: 130px !important;
}
#decoreva-cart-drawer .decoreva-checkout-item {
grid-template-columns: 122px minmax(0, 1fr) !important;
gap: 9px !important;
padding: 8px !important;
}
#decoreva-cart-drawer .decoreva-checkout-item > img {
width: 122px !important;
height: 122px !important;
min-width: 122px !important;
max-width: 122px !important;
}
#decoreva-cart-drawer .decoreva-cart-footer {
width: calc(100% - 20px) !important;
padding: 15px 12px !important;
}
}
`;
document.head.appendChild(style);
})();
(function ensureDecorevaMobileCheckoutAddressCompact() {
if (document.getElementById("decoreva-mobile-checkout-address-compact")) return;
const style = document.createElement("style");
style.id = "decoreva-mobile-checkout-address-compact";
style.textContent = `
/* DECOREVA — MOBILE CHECKOUT ADDRESS COMPACT
Phone only. Desktop/tablet remain unchanged. */
@media (max-width: 760px) {
#decoreva-cart-drawer #decoreva-checkout-address {
padding: 0 10px 14px !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-section-head {
padding: 9px 6px 7px !important;
margin: 0 !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-section-head strong {
display: block !important;
font-size: 19px !important;
line-height: 1.15 !important;
margin: 0 0 3px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-section-head span {
display: block !important;
font-size: 11px !important;
line-height: 1.25 !important;
}
#decoreva-cart-drawer #decoreva-address-message {
margin: 4px 0 6px !important;
padding: 9px 12px !important;
min-height: 0 !important;
border-radius: 9px !important;
font-size: 12px !important;
line-height: 1.35 !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-field {
margin: 0 0 6px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-field > input {
height: 43px !important;
min-height: 43px !important;
padding: 0 38px 0 11px !important;
font-size: 13px !important;
line-height: 1.2 !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-field > textarea {
height: 58px !important;
min-height: 58px !important;
max-height: 58px !important;
padding: 9px 38px 9px 11px !important;
font-size: 13px !important;
line-height: 1.3 !important;
resize: none !important;
box-sizing: border-box !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-grid {
display: grid !important;
grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
gap: 6px !important;
margin: 0 !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-grid .decoreva-address-field {
margin: 0 !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-grid .decoreva-address-field:last-child {
grid-column: 1 / -1 !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-clear {
right: 7px !important;
width: 22px !important;
height: 22px !important;
font-size: 18px !important;
line-height: 22px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-clear-textarea {
top: 10px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-summary {
margin: 6px 0 8px !important;
padding: 9px 10px 8px !important;
border-radius: 9px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-items {
margin-top: 8px !important;
}
}
@media (max-width: 400px) {
#decoreva-cart-drawer #decoreva-checkout-address {
padding-left: 8px !important;
padding-right: 8px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-section-head strong {
font-size: 18px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-checkout-section-head span {
font-size: 10.5px !important;
}
#decoreva-cart-drawer #decoreva-address-message {
font-size: 11.5px !important;
padding: 8px 10px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-field > input {
height: 41px !important;
min-height: 41px !important;
font-size: 12.5px !important;
}
#decoreva-cart-drawer #decoreva-checkout-address .decoreva-address-field > textarea {
height: 54px !important;
min-height: 54px !important;
max-height: 54px !important;
font-size: 12.5px !important;
}
}
`;
document.head.appendChild(style);
})();
(function ensureDecorevaMobilePhoneFinalLayout() {
if (document.getElementById("decoreva-mobile-phone-final-layout")) return;
const style = document.createElement("style");
style.id = "decoreva-mobile-phone-final-layout";
style.textContent = `
/* DECOREVA — FINAL MOBILE PHONE LAYOUT ONLY */
@media (max-width: 760px) {
#decoreva-cart-drawer .decoreva-cart-item {
grid-template-columns: 160px minmax(0, 1fr) !important;
gap: 12px !important;
padding: 10px !important;
min-height: 182px !important;
}
#decoreva-cart-drawer .decoreva-cart-item > img {
width: 160px !important;
height: 160px !important;
min-width: 160px !important;
max-width: 160px !important;
object-fit: cover !important;
background: #fff !important;
}
#decoreva-cart-drawer .decoreva-cart-item-info {
align-self: center !important;
}
/* Compact phone summary: same information, much less empty height. */
#decoreva-cart-drawer .decoreva-cart-footer {
width: calc(100% - 18px) !important;
margin: 10px auto 18px !important;
padding: 12px 12px 13px !important;
border-radius: 11px !important;
}
#decoreva-cart-drawer .decoreva-coupon-summary-row {
min-height: 31px !important;
margin-bottom: 5px !important;
padding-bottom: 5px !important;
}
#decoreva-cart-drawer .decoreva-cart-summary-row {
min-height: 27px !important;
line-height: 1.2 !important;
}
#decoreva-cart-drawer .decoreva-cart-total-row {
min-height: 34px !important;
margin-top: 3px !important;
padding-top: 4px !important;
}
/* Mobile phone typography: keep money figures compact and balanced. */
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-coupon-summary-row span,
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-cart-summary-row span,
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-cart-total-row span {
font-size: 11px !important;
line-height: 1.25 !important;
}
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-coupon-summary-row strong,
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-cart-summary-row strong {
font-size: 15px !important;
line-height: 1.2 !important;
}
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-cart-total-row strong {
font-size: 17px !important;
line-height: 1.2 !important;
}
#decoreva-cart-drawer #decoreva-cart-whatsapp {
min-height: 43px !important;
height: 43px !important;
margin-top: 7px !important;
border-radius: 7px !important;
}
}
@media (max-width: 400px) {
#decoreva-cart-drawer .decoreva-cart-item {
grid-template-columns: 155px minmax(0, 1fr) !important;
gap: 10px !important;
min-height: 175px !important;
}
#decoreva-cart-drawer .decoreva-cart-item > img {
width: 155px !important;
height: 155px !important;
min-width: 155px !important;
max-width: 155px !important;
}
#decoreva-cart-drawer .decoreva-cart-footer {
width: calc(100% - 16px) !important;
padding: 11px 11px 12px !important;
}
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-cart-summary-row strong {
font-size: 14px !important;
}
#decoreva-cart-drawer .decoreva-cart-footer .decoreva-cart-total-row strong {
font-size: 16px !important;
}
}
`;
document.head.appendChild(style);
})();
(function ensureDecorevaMobileProceedButton() {
if (document.getElementById("decoreva-mobile-proceed-button-style")) return;
const style = document.createElement("style");
style.id = "decoreva-mobile-proceed-button-style";
style.textContent = `
@media (max-width: 760px) {
#decoreva-cart-drawer #decoreva-cart-whatsapp {
display: flex !important;
align-items: center !important;
justify-content: center !important;
width: min(250px, 82%) !important;
min-width: 0 !important;
max-width: 250px !important;
height: 39px !important;
min-height: 39px !important;
margin: 7px auto 0 !important;
padding: 0 14px !important;
border-radius: 9px !important;
box-sizing: border-box !important;
font-size: 12px !important;
font-weight: 700 !important;
line-height: 1 !important;
}
}
`;
document.head.appendChild(style);
})();
(function ensureDecorevaPasswordEye() {
if (document.getElementById("decoreva-password-eye-style")) return;
const style = document.createElement("style");
style.id = "decoreva-password-eye-style";
style.textContent = `
.decoreva-password-eye-wrap {
position: relative !important;
width: 100% !important;
}
.decoreva-password-eye-wrap > input[type="password"],
.decoreva-password-eye-wrap > input[data-decoreva-password-input] {
padding-right: 48px !important;
box-sizing: border-box !important;
}
.decoreva-password-eye {
position: absolute !important;
top: 50% !important;
right: var(--decoreva-password-eye-right, 8px) !important;
width: 30px !important;
height: 30px !important;
min-width: 30px !important;
min-height: 30px !important;
margin: 0 !important;
padding: 0 !important;
border: 0 !important;
border-radius: 50% !important;
background: transparent !important;
color: #8b6a32 !important;
display: inline-flex !important;
align-items: center !important;
justify-content: center !important;
transform: translateY(-50%) !important;
cursor: pointer !important;
z-index: 10 !important;
font-size: 13px !important;
line-height: 1 !important;
box-sizing: border-box !important;
-webkit-tap-highlight-color: transparent !important;
}
.decoreva-password-eye i {
display: block !important;
width: 16px !important;
height: 16px !important;
line-height: 16px !important;
text-align: center !important;
pointer-events: none !important;
}
.decoreva-password-eye:hover {
color: #b77a13 !important;
background: rgba(183,122,19,.08) !important;
}
.decoreva-password-eye:focus-visible {
outline: 2px solid rgba(183,122,19,.30) !important;
outline-offset: 1px !important;
background: rgba(183,122,19,.06) !important;
}
`;
document.head.appendChild(style);
function addPasswordEye(input) {
if (!input || input.tagName !== "INPUT") return;
if (String(input.type).toLowerCase() !== "password") return;
if (input.dataset.decorevaPasswordEye === "true") return;
const parent = input.parentElement;
if (!parent) return;
if (!parent.classList.contains("decoreva-password-eye-wrap")) {
parent.classList.add("decoreva-password-eye-wrap");
}
function positionPasswordEye() {
if (!button || !input || !parent) return;
const inputRect = input.getBoundingClientRect();
const parentRect = parent.getBoundingClientRect();
if (!inputRect.width || !parentRect.width) return;
// Keep the eye INSIDE the actual input even when the
// surrounding form row is wider than the input.
const extraRightSpace = Math.max(
0,
parentRect.right - inputRect.right
);
button.style.setProperty(
"--decoreva-password-eye-right",
Math.max(8, extraRightSpace + 8) + "px"
);
}
const button = document.createElement("button");
button.type = "button";
button.className = "decoreva-password-eye";
button.setAttribute("aria-label", "Show password");
button.setAttribute("title", "Show password");
button.setAttribute("aria-pressed", "false");
button.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
button.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
const showing = input.type === "text";
input.type = showing ? "password" : "text";
button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
button.setAttribute("title", showing ? "Show password" : "Hide password");
button.setAttribute("aria-pressed", showing ? "false" : "true");
button.innerHTML = showing
? '<i class="fas fa-eye" aria-hidden="true"></i>'
: '<i class="fas fa-eye-slash" aria-hidden="true"></i>';
});
input.dataset.decorevaPasswordEye = "true";
input.dataset.decorevaPasswordInput = "true";
parent.appendChild(button);
positionPasswordEye();
if ("ResizeObserver" in window) {
const eyeResizeObserver = new ResizeObserver(function () {
positionPasswordEye();
});
eyeResizeObserver.observe(parent);
eyeResizeObserver.observe(input);
button._decorevaEyeResizeObserver = eyeResizeObserver;
} else {
window.addEventListener("resize", positionPasswordEye);
}
}
function scanPasswordInputs(root) {
if (!root) return;
if (root.nodeType === 1 && root.matches && root.matches('input[type="password"]')) {
addPasswordEye(root);
}
if (root.querySelectorAll) {
root.querySelectorAll('input[type="password"]').forEach(addPasswordEye);
}
}
scanPasswordInputs(document);
const observer = new MutationObserver(function (mutations) {
mutations.forEach(function (mutation) {
mutation.addedNodes.forEach(function (node) {
if (node.nodeType === 1) scanPasswordInputs(node);
});
});
});
observer.observe(document.body, { childList: true, subtree: true });
document.addEventListener("focusin", function (event) {
const input = event.target;
if (input && input.matches && input.matches('input[type="password"]')) {
addPasswordEye(input);
}
}, true);
})();
(function ensureCheckoutAddressValidationStyle() {
if (document.getElementById("decoreva-checkout-address-validation-style")) return;
const style = document.createElement("style");
style.id = "decoreva-checkout-address-validation-style";
style.textContent = `
#decoreva-checkout-address input.decoreva-address-invalid,
#decoreva-checkout-address textarea.decoreva-address-invalid {
border: 2px solid #d93025 !important;
border-color: #d93025 !important;
box-shadow: 0 0 0 1px rgba(217,48,37,.10) !important;
}
#decoreva-checkout-address input.decoreva-address-invalid:focus,
#decoreva-checkout-address textarea.decoreva-address-invalid:focus {
border-color: #d93025 !important;
box-shadow: 0 0 0 2px rgba(217,48,37,.12) !important;
}
`;
document.head.appendChild(style);
})();
(function ensureCheckoutAddressClearButtonStyle() {
if (document.getElementById("decoreva-checkout-address-clear-style")) return;
const style = document.createElement("style");
style.id = "decoreva-checkout-address-clear-style";
style.textContent = `
#decoreva-checkout-address .decoreva-address-field {
position: relative;
width: 100%;
}
#decoreva-checkout-address .decoreva-address-field > input,
#decoreva-checkout-address .decoreva-address-field > textarea {
width: 100%;
padding-right: 42px !important;
box-sizing: border-box;
}
#decoreva-checkout-address .decoreva-address-clear {
position: absolute;
top: 50%;
right: 10px;
transform: translateY(-50%);
width: 24px;
height: 24px;
border: 0;
border-radius: 50%;
background: transparent;
color: #7b5a2a;
font-size: 20px;
line-height: 24px;
padding: 0;
cursor: pointer;
z-index: 2;
}
#decoreva-checkout-address .decoreva-address-clear:hover {
background: rgba(169,111,18,.12);
color: #A96F12;
}
#decoreva-checkout-address .decoreva-address-clear-textarea {
top: 14px;
transform: none;
}
#decoreva-address-message {
min-height: 0;
margin: 12px 0 14px;
padding: 14px 16px;
box-sizing: border-box;
width: 100%;
font-size: 15px !important;
font-weight: 800 !important;
line-height: 1.5 !important;
border-radius: 9px;
}
#decoreva-address-message.error {
display: block !important;
border: 1px solid #d65b48;
background: #fff0ed;
color: #a52f1d !important;
}
#decoreva-address-message.warning {
display: block !important;
border: 1px solid #d65b48;
background: #fff0ed;
color: #a52f1d !important;
}
#decoreva-address-message.success {
display: block !important;
border: 1px solid #a8c88a;
background: #f3f9ed;
color: #4f7629 !important;
}
`;
document.head.appendChild(style);
})();
function updateAddressContinueState() {
const get = function (id) {
const el = document.querySelector(id);
return el ? el.value.trim() : "";
};
const fields = [
"#decoreva-address-name",
"#decoreva-address-mobile",
"#decoreva-address-line",
"#decoreva-address-city",
"#decoreva-address-state",
"#decoreva-address-pincode"
];
const valid =
!!get("#decoreva-address-name") &&
/^\d{10}$/.test(get("#decoreva-address-mobile")) &&
!!get("#decoreva-address-line") &&
!!get("#decoreva-address-city") &&
!!get("#decoreva-address-state") &&
/^\d{6}$/.test(get("#decoreva-address-pincode"));
const checkoutButton = document.querySelector("#decoreva-cart-whatsapp");
if (checkoutButton) {
const canPlaceOrder = checkoutAddressUnlocked && valid;
checkoutButton.textContent = canPlaceOrder ? "Order on WhatsApp" : "Proceed to Buy";
checkoutButton.disabled = cart.length === 0;
checkoutButton.setAttribute("aria-disabled", checkoutButton.disabled ? "true" : "false");
checkoutButton.setAttribute("aria-label", canPlaceOrder ? "Order on WhatsApp" : "Proceed to Buy");
}
fields.forEach(function (id) {
const el = document.querySelector(id);
if (!el) return;
const value = el.value.trim();
const invalid =
!value ||
(id === "#decoreva-address-mobile" && !/^\d{10}$/.test(value)) ||
(id === "#decoreva-address-pincode" && !/^\d{6}$/.test(value));
el.classList.toggle("decoreva-address-invalid", checkoutStep === "address" && invalid);
el.setAttribute("aria-invalid", checkoutStep === "address" && invalid ? "true" : "false");
});
const message = document.querySelector("#decoreva-address-message");
const similarProducts = document.querySelector("#decoreva-similar-products");
const cartFooter = document.querySelector("#decoreva-cart-drawer .decoreva-cart-footer");
const cartPanel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
if (valid) {
if (message && (message.classList.contains("warning") || message.classList.contains("error"))) {
message.textContent = "Address complete. You can now place your order on WhatsApp.";
message.className = "decoreva-address-message success";
message.dataset.userMessage = "";
}
if (window.innerWidth <= 760 && checkoutAddressUnlocked && cartPanel) {
if (similarProducts) similarProducts.hidden = true;
if (cartFooter) cartFooter.hidden = false;
window.requestAnimationFrame(function () {
window.requestAnimationFrame(function () {
if (window.innerWidth > 760) return;
const checkoutFooter = document.querySelector("#decoreva-cart-drawer .decoreva-cart-footer");
const checkoutButton = document.querySelector("#decoreva-cart-whatsapp");
const steps = document.querySelector("#decoreva-cart-drawer .decoreva-checkout-steps");
if (!checkoutFooter || !checkoutButton) return;
const panelRect = cartPanel.getBoundingClientRect();
const footerRect = checkoutFooter.getBoundingClientRect();
const stickyHeight = steps ? steps.getBoundingClientRect().height : 0;
const targetTop = Math.max(
0,
cartPanel.scrollTop +
(footerRect.top - panelRect.top) -
stickyHeight -
10
);
cartPanel.scrollTo({
top: targetTop,
behavior: "smooth"
});
});
});
}
} else if (message && !message.dataset.userMessage && checkoutAddressUnlocked) {
if (window.innerWidth <= 760 && similarProducts) similarProducts.hidden = false;
message.textContent = "Please complete all required delivery address details.";
message.className = "decoreva-address-message warning";
} else if (message && !checkoutAddressUnlocked && !message.dataset.userMessage) {
message.textContent = "";
message.className = "decoreva-address-message";
}
}
function renderCheckoutItems() {
const box = document.querySelector("#decoreva-checkout-items");
if (!box) return;
box.replaceChildren();
if (!cart.length) return;
const head = document.createElement("div");
head.className = "decoreva-checkout-items-head";
head.innerHTML = "<strong>Items in your order</strong><span>" + totalItems() + (totalItems() === 1 ? " item" : " items") + "</span>";
box.appendChild(head);
cart.forEach(function(item, index){
const row = document.createElement("div");
row.className = "decoreva-checkout-item";
const img = document.createElement("img");
img.src = item.image || "";
img.alt = item.title;
img.loading = "lazy";
const info = document.createElement("div");
info.className = "decoreva-checkout-item-info";
const title = document.createElement("strong");
title.textContent = item.title;
info.appendChild(title);
const variation = document.createElement("span");
variation.textContent = (item.variationName ? item.variationName + " • " : "") + "Qty: " + item.quantity;
info.appendChild(variation);
const price = document.createElement("b");
price.textContent = money(item.price * item.quantity);
info.appendChild(price);
const actions = document.createElement("div");
actions.className = "decoreva-checkout-item-actions";
const remove = document.createElement("button");
remove.type = "button";
remove.textContent = "Remove";
remove.dataset.checkoutItemAction = "remove";
remove.dataset.checkoutItemIndex = String(index);
const wishlistButton = document.createElement("button");
wishlistButton.type = "button";
wishlistButton.textContent = "Move to Wishlist";
wishlistButton.dataset.checkoutItemAction = "wishlist";
wishlistButton.dataset.checkoutItemIndex = String(index);
actions.appendChild(remove);
actions.appendChild(wishlistButton);
info.appendChild(actions);
row.appendChild(img);
row.appendChild(info);
box.appendChild(row);
});
const delivery = document.createElement("div");
delivery.className = "decoreva-checkout-delivery-note";
delivery.innerHTML = '<strong>Delivery estimate</strong><span>Delivery details will be confirmed with you on WhatsApp.</span>';
box.appendChild(delivery);
}
function renderSimilarProducts() {
const box = document.querySelector("#decoreva-similar-products");
if (!box) return;
box.replaceChildren();
if (!cart.length) { box.hidden = true; return; }
const cartTitles = cart.map(function(item){
return String(item.title || "").trim().toLowerCase();
});
const seen = {};
const candidates = Array.from(document.querySelectorAll(
"#collection-products .card, .featured-slider .featured-slide"
)).map(function(card){
const heading = card.querySelector("h3");
const title = heading ? heading.textContent.trim().replace(/\s+/g," ") : "";
const lower = title.toLowerCase();
if (!title || cartTitles.indexOf(lower) !== -1 || seen[lower]) return null;
seen[lower] = true;
const image = card.querySelector("img.slider-image, img");
const src = image ? (image.getAttribute("data-src") || image.getAttribute("src") || "") : "";
const priceEl = card.querySelector(".price");
const price = priceEl ? priceEl.textContent.trim().replace(/\s+/g," ") : "";
return {title:title, src:src, price:price};
}).filter(Boolean);
if (!candidates.length) { box.hidden = true; return; }
box.hidden = false;
const head = document.createElement("div");
head.className = "decoreva-similar-head";
head.innerHTML = "<strong>You May Also Like</strong><span>More from DECOREVA</span>";
box.appendChild(head);
const grid = document.createElement("div");
grid.className = "decoreva-similar-grid decoreva-all-products-grid";
candidates.forEach(function(item){
const card = document.createElement("article");
card.className = "decoreva-similar-card";
const imageBox = document.createElement("div");
imageBox.className = "decoreva-similar-card-image";
const img = document.createElement("img");
img.src = item.src;
img.alt = item.title;
img.loading = "lazy";
imageBox.appendChild(img);
const info = document.createElement("div");
info.className = "decoreva-similar-card-info";
const title = document.createElement("strong");
title.textContent = item.title;
const price = document.createElement("span");
price.textContent = item.price || "View product";
const view = document.createElement("button");
view.type = "button";
view.textContent = "VIEW PRODUCT";
view.dataset.similarProductTitle = item.title;
info.appendChild(title);
info.appendChild(price);
info.appendChild(view);
card.appendChild(imageBox);
card.appendChild(info);
grid.appendChild(card);
});
box.appendChild(grid);
}
function renderPaymentReview() {
const box=document.querySelector("#decoreva-payment-review");
if(!box) return;
box.innerHTML="";
const address=deliveryAddress || {};
const addressCard=document.createElement("div");
addressCard.className="decoreva-review-address";
addressCard.innerHTML='<div><strong>Deliver to</strong><span>' + escapeProfileText(address.name || "") + (address.pincode ? ", " + escapeProfileText(address.pincode) : "") + '</span></div><p>' + escapeProfileText(address.line || "") + '<br>' + escapeProfileText(address.city || "") + (address.state ? ", " + escapeProfileText(address.state) : "") + (address.pincode ? " - " + escapeProfileText(address.pincode) : "") + '<br>Mobile: ' + escapeProfileText(address.mobile || "") + '</p><button type="button" data-checkout-step="address">CHANGE ADDRESS</button>';
box.appendChild(addressCard);
const items=document.createElement("div"); items.className="decoreva-review-items";
const h=document.createElement("strong"); h.textContent="Items"; items.appendChild(h);
cart.forEach(function(item){
const row=document.createElement("div"); row.className="decoreva-review-item";
row.innerHTML='<span>' + escapeProfileText(item.title + (item.variationName ? " — " + item.variationName : "")) + ' × ' + item.quantity + '</span><b>' + money(item.price * item.quantity) + '</b>';
items.appendChild(row);
});
box.appendChild(items);
const price=document.createElement("div"); price.className="decoreva-review-price";
price.innerHTML='<div><span>Total MRP</span><b>' + money(subtotalAmount()) + '</b></div>' + (discountAmount() ? '<div><span>Discount on MRP</span><b>- ' + money(discountAmount()) + '</b></div>' : '') + '<div><span>Delivery</span><b>' + money(deliveryCharge()) + '</b></div><div class="final"><span>Total Amount</span><b>' + money(finalAmount()) + '</b></div>';
box.appendChild(price);
}
function renderCheckoutSummary() {
const box = document.querySelector("#decoreva-checkout-summary");
if (!box) return;
box.innerHTML = "";
const title = document.createElement("strong");
title.textContent = "Order Summary";
box.appendChild(title);
const couponRow = document.createElement("div");
couponRow.className = "decoreva-checkout-coupon-row";
couponRow.innerHTML = '<span>Coupon</span><button type="button" id="decoreva-checkout-coupon-button">Apply Coupon</button>';
box.appendChild(couponRow);
if (appliedCoupon) {
const applied = document.createElement("div");
applied.className = "decoreva-checkout-applied-coupon";
applied.innerHTML = '<span>' + escapeProfileText(appliedCoupon) + ' applied — 10% OFF</span><button type="button" id="decoreva-checkout-remove-coupon">Remove</button>';
box.appendChild(applied);
}
cart.forEach(function (item) {
const row = document.createElement("div");
row.className = "decoreva-checkout-summary-item";
const left = document.createElement("span");
left.textContent = item.title + (item.variationName ? " — " + item.variationName : "") + " × " + item.quantity;
const right = document.createElement("b");
right.textContent = money(item.price * item.quantity);
row.appendChild(left);
row.appendChild(right);
box.appendChild(row);
});
const rows = [
["Total MRP", money(subtotalAmount())],
...(discountAmount() ? [["Discount on MRP", "- " + money(discountAmount())]] : []),
["Delivery", money(deliveryCharge())],
["Total Amount", money(finalAmount())]
];
rows.forEach(function (pair, index) {
const row = document.createElement("div");
row.className = "decoreva-checkout-summary-total" + (index === rows.length - 1 ? " final" : "");
const left = document.createElement("span");
left.textContent = pair[0];
const right = document.createElement("strong");
right.textContent = pair[1];
row.appendChild(left);
row.appendChild(right);
box.appendChild(row);
});
const coupon = document.createElement("div");
const summaryCoupon = effectiveCouponCode();
coupon.className = "decoreva-checkout-summary-coupon" + (summaryCoupon ? " applied" : " none");
coupon.textContent = summaryCoupon
? "Coupon: " + summaryCoupon + (appliedCoupon ? " applied — 10% OFF" : " checked — 10% OFF")
: "Coupon: No coupon applied";
box.appendChild(coupon);
}
function scrollCheckoutAddressToTop(behavior) {
const drawer = document.querySelector("#decoreva-cart-drawer");
const address = document.querySelector("#decoreva-checkout-address");
const panel = drawer ? drawer.querySelector(".decoreva-cart-panel") : null;
const steps = drawer ? drawer.querySelector(".decoreva-checkout-steps") : null;
if (!address || !panel) return;
const panelRect = panel.getBoundingClientRect();
const addressRect = address.getBoundingClientRect();
const stickyHeight = steps ? steps.getBoundingClientRect().height : 0;
const targetTop = Math.max(
0,
panel.scrollTop +
(addressRect.top - panelRect.top) -
stickyHeight -
4
);
panel.scrollTo({
top: targetTop,
behavior: behavior || "smooth"
});
}
function updateCheckoutStepUI() {
const drawer = document.querySelector("#decoreva-cart-drawer");
if (!drawer) return;
checkoutStep = cart.length ? (checkoutStep === "address" ? "address" : "cart") : "cart";
drawer.classList.add("decoreva-checkout-mode");
const checkoutSteps = drawer.querySelector(".decoreva-checkout-steps");
if (checkoutSteps) { checkoutSteps.hidden = false; checkoutSteps.style.display = "flex"; }
const cartHeadTitle = drawer.querySelector(".decoreva-cart-head strong");
const cartHeadLabel = drawer.querySelector("#decoreva-cart-item-label");
if (cartHeadTitle) cartHeadTitle.textContent = "Your Cart";
if (cartHeadLabel) cartHeadLabel.textContent = totalItems() + (totalItems() === 1 ? " item" : " items");
renderCheckoutSummary();
renderCheckoutItems();
renderSimilarProducts();
const address = document.querySelector("#decoreva-checkout-address");
const payment = document.querySelector("#decoreva-checkout-payment");
const steps = document.querySelector("#decoreva-cart-drawer .decoreva-checkout-steps");
const cartItems = document.querySelector("#decoreva-cart-items");
const cartEmpty = document.querySelector("#decoreva-cart-empty");
const footer = document.querySelector(".decoreva-cart-footer");
const checkoutItems = document.querySelector("#decoreva-checkout-items");
const checkoutSummary = document.querySelector("#decoreva-checkout-summary");
const similarProducts = document.querySelector("#decoreva-similar-products");
if (cart.length === 0) {
if (steps) {
steps.hidden = true;
steps.style.display = "none";
}
if (cartItems) cartItems.hidden = true;
if (cartEmpty) cartEmpty.hidden = false;
if (address) address.hidden = true;
if (payment) payment.hidden = true;
if (footer) footer.hidden = true;
if (checkoutItems) checkoutItems.hidden = true;
if (checkoutSummary) checkoutSummary.hidden = true;
if (similarProducts) similarProducts.hidden = true;
if (cartHeadLabel) {
cartHeadLabel.textContent = "";
cartHeadLabel.hidden = true;
}
} else {
if (steps) {
steps.hidden = false;
steps.style.display = "flex";
}
if (cartItems) cartItems.hidden = false;
if (cartEmpty) cartEmpty.hidden = true;
if (address) address.hidden = checkoutStep !== "address";
if (payment) payment.hidden = true;
if (footer) footer.hidden = false;
if (checkoutItems) checkoutItems.hidden = true;
if (checkoutSummary) checkoutSummary.hidden = true;
if (similarProducts) similarProducts.hidden = checkoutStep === "address";
if (cartHeadLabel) cartHeadLabel.hidden = false;
}
if (cart.length) {
updateAddressContinueState();
}
drawer.querySelectorAll("[data-checkout-step]").forEach(function (button) {
const step = button.dataset.checkoutStep;
button.classList.toggle("active", step === checkoutStep || (step === "payment" && false));
});
}
function buildCartUI() {
if (document.querySelector("#decoreva-cart-drawer")) return;
const floating = document.createElement("button");
floating.type = "button";
floating.id = "decoreva-cart-button";
floating.className = "decoreva-cart-button";
floating.setAttribute("aria-label", "Open shopping cart");
floating.innerHTML = '<i class="fas fa-shopping-bag" aria-hidden="true"></i><span id="decoreva-cart-count">0</span>';
if (!document.querySelector("#decoreva-nav-cart")) {
document.body.appendChild(floating);
}
const drawer = document.createElement("aside");
drawer.id = "decoreva-cart-drawer";
drawer.className = "decoreva-cart-drawer";
drawer.setAttribute("aria-hidden", "true");
drawer.innerHTML = `
<div class="decoreva-cart-overlay" data-cart-close="true"></div>
<div class="decoreva-cart-panel" role="dialog" aria-modal="true" aria-label="Shopping cart">
<div class="decoreva-checkout-steps" aria-label="Checkout progress">
<button type="button" class="active" data-checkout-step="cart">CART</button>
<i aria-hidden="true"></i>
<button type="button" data-checkout-step="address">ADDRESS</button>
<i aria-hidden="true"></i>
<button type="button" data-checkout-step="payment">PAYMENT</button>
</div>
<div id="decoreva-checkout-address" class="decoreva-checkout-section" hidden>
<div class="decoreva-checkout-section-head"><strong>Delivery Address</strong><span>Where should we deliver your order?</span></div>
<div id="decoreva-address-message" class="decoreva-address-message"></div>
<div id="decoreva-checkout-summary" class="decoreva-checkout-summary"></div>
<div class="decoreva-address-field"><input id="decoreva-address-name" type="text" placeholder="Full name" autocomplete="name"><button type="button" class="decoreva-address-clear" data-address-clear="#decoreva-address-name" aria-label="Clear full name">×</button></div>
<div class="decoreva-address-field"><input id="decoreva-address-mobile" type="tel" placeholder="Mobile number" inputmode="numeric" autocomplete="tel"><button type="button" class="decoreva-address-clear" data-address-clear="#decoreva-address-mobile" aria-label="Clear mobile number">×</button></div>
<div class="decoreva-address-field"><textarea id="decoreva-address-line" rows="2" placeholder="House / Street / Area"></textarea><button type="button" class="decoreva-address-clear decoreva-address-clear-textarea" data-address-clear="#decoreva-address-line" aria-label="Clear address">×</button></div>
<div class="decoreva-address-grid">
<div class="decoreva-address-field"><input id="decoreva-address-city" type="text" placeholder="City"><button type="button" class="decoreva-address-clear" data-address-clear="#decoreva-address-city" aria-label="Clear city">×</button></div>
<div class="decoreva-address-field"><input id="decoreva-address-state" type="text" placeholder="State"><button type="button" class="decoreva-address-clear" data-address-clear="#decoreva-address-state" aria-label="Clear state">×</button></div>
<div class="decoreva-address-field"><input id="decoreva-address-pincode" type="text" placeholder="PIN code" inputmode="numeric" maxlength="6"><button type="button" class="decoreva-address-clear" data-address-clear="#decoreva-address-pincode" aria-label="Clear PIN code">×</button></div>
</div>
<div id="decoreva-checkout-items" class="decoreva-checkout-items"></div>
<div id="decoreva-similar-products" class="decoreva-similar-products" hidden></div>
</div>
<div id="decoreva-checkout-payment" class="decoreva-checkout-section" hidden>
<div class="decoreva-checkout-section-head"><strong>Review &amp; Place Order</strong><span>Check your delivery details and order before confirming.</span></div>
<div id="decoreva-payment-review" class="decoreva-payment-review"></div>
<button type="button" id="decoreva-payment-order">Place Order on WhatsApp</button>
</div>
<div class="decoreva-cart-head">
<div class="decoreva-cart-head-title"><strong>Your Cart</strong><span id="decoreva-cart-item-label">0 items</span></div>
<button type="button" class="decoreva-cart-close" data-cart-close="true" aria-label="Close cart">×</button>
</div>
<div id="decoreva-cart-empty" class="decoreva-cart-empty">
<div class="decoreva-empty-cart-message">Your cart is empty</div>
<button type="button" class="decoreva-empty-cart-back" data-cart-close="true" aria-label="Continue shopping">Continue Shopping</button>
</div>
<div id="decoreva-cart-items" class="decoreva-cart-items"></div>
<div class="decoreva-cart-footer">
<div class="decoreva-coupon-summary-row">
<span>Coupon Discount</span>
<button type="button" id="decoreva-open-coupon">${appliedCoupon ? "Remove Coupon" : "Apply Coupon"}</button>
</div>
<div id="decoreva-coupon-applied-label" class="decoreva-coupon-applied-label" hidden></div>
<div class="decoreva-cart-summary-row"><span>Total MRP</span><strong id="decoreva-cart-subtotal">₹0</strong></div>
<div class="decoreva-cart-summary-row" id="decoreva-cart-discount-row" hidden><span>Discount on MRP</span><strong id="decoreva-cart-discount">- ₹0</strong></div>
<div class="decoreva-cart-summary-row"><span>Delivery</span><strong id="decoreva-cart-delivery">₹0</strong></div>
<div class="decoreva-cart-total-row"><span>Total Amount</span><strong id="decoreva-cart-total">₹0</strong></div>
<button type="button" id="decoreva-cart-whatsapp">Proceed to Buy</button>
</div>
</div>`;
document.body.appendChild(drawer);
const couponModal = document.createElement("div");
couponModal.id = "decoreva-coupon-modal";
couponModal.className = "decoreva-coupon-modal";
couponModal.setAttribute("aria-hidden", "true");
couponModal.innerHTML = `
<div class="decoreva-coupon-modal-overlay" data-coupon-close="true"></div>
<div class="decoreva-coupon-modal-panel" role="dialog" aria-modal="true" aria-label="Apply Coupon">
<div class="decoreva-coupon-modal-head">
<strong>COUPON &amp; OFFERS</strong>
<button type="button" class="decoreva-coupon-modal-close" data-coupon-close="true" aria-label="Close coupon">×</button>
</div>
<div class="decoreva-coupon-modal-body">
<div class="decoreva-coupon-modal-input-row">
<input id="decoreva-coupon-input" type="text" maxlength="20" placeholder="Enter coupon code" autocomplete="off">
<button type="button" id="decoreva-coupon-check">CHECK</button>
</div>
<div id="decoreva-coupon-message" class="decoreva-coupon-message"></div>
<div class="decoreva-coupon-options" aria-label="Available coupons">
<div class="decoreva-coupon-option decoreva-coupon-welcome">
<div class="decoreva-coupon-option-info">
<span class="decoreva-coupon-option-tag">WELCOME OFFER</span>
<strong>WELCOME10</strong>
<small>10% OFF YOUR ORDER</small>
</div>
<div class="decoreva-coupon-option-actions">
<button type="button" class="decoreva-coupon-use" data-coupon-use="WELCOME10">USE COUPON</button>
<button type="button" id="decoreva-coupon-remove" class="decoreva-coupon-remove" aria-label="Remove applied coupon">REMOVE</button>
</div>
</div>
<div class="decoreva-coupon-note">
<span>✦</span>
One coupon can be applied per order.
<span>✦</span>
</div>
</div>
</div>
<div class="decoreva-coupon-modal-footer">
<div class="decoreva-coupon-savings">
<span>YOUR WELCOME OFFER</span>
<strong>10% OFF</strong>
</div>
<button type="button" id="decoreva-coupon-apply">APPLY</button>
</div>
</div>`;
document.body.appendChild(couponModal);
if (!document.querySelector("#decoreva-coupon-modal-styles")) {
const couponStyle = document.createElement("style");
couponStyle.id = "decoreva-coupon-modal-styles";
couponStyle.textContent = `
/* DECOREVA — COUPON MODAL PROFESSIONAL UI */
#decoreva-coupon-modal .decoreva-coupon-modal-input-row{
align-items:center;
gap:10px;
}
#decoreva-coupon-modal .decoreva-coupon-modal-input-row input#decoreva-coupon-input{
font-size:16px;
font-weight:800;
letter-spacing:.8px;
color:#3b2819;
min-height:46px;
padding:0 14px;
text-transform:uppercase;
border-radius:8px;
}
#decoreva-coupon-modal .decoreva-coupon-modal-input-row input#decoreva-coupon-input::placeholder{
font-size:13px;
font-weight:500;
letter-spacing:0;
text-transform:none;
color:#8a7968;
}
#decoreva-coupon-modal .decoreva-coupon-modal-input-row input#decoreva-coupon-input:focus{
outline:none;
border-color:#b77a13;
box-shadow:0 0 0 3px rgba(183,122,19,.12);
}
#decoreva-coupon-modal #decoreva-coupon-check{
height:44px;
min-width:62px;
padding:0 8px;
color:#9a610d;
font-size:11px;
font-weight:900;
letter-spacing:.35px;
}
#decoreva-coupon-modal .decoreva-coupon-message{
font-size:12px;
font-weight:700;
line-height:1.45;
min-height:18px;
margin-top:7px;
color:#6a5037;
}
#decoreva-coupon-modal .decoreva-coupon-options{
margin-top:15px;
}
#decoreva-coupon-modal .decoreva-coupon-option{
position:relative;
display:flex;
align-items:center;
justify-content:space-between;
gap:18px;
min-height:82px;
margin-top:9px;
padding:13px 13px 13px 17px;
border:1px solid rgba(201,149,46,.34);
border-radius:13px;
background:linear-gradient(135deg,#fffefa 0%,#fff8eb 100%);
box-shadow:0 5px 16px rgba(75,48,9,.07),inset 0 1px 0 rgba(255,255,255,.95);
overflow:hidden;
transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
}
#decoreva-coupon-modal .decoreva-coupon-option:first-child{
margin-top:0;
}
#decoreva-coupon-modal .decoreva-coupon-option::before{
content:"";
position:absolute;
left:0;
top:0;
bottom:0;
width:4px;
background:linear-gradient(180deg,#9a610d,#d8a846,#9a610d);
}
#decoreva-coupon-modal .decoreva-coupon-option:hover{
transform:translateY(-1px);
border-color:rgba(183,122,19,.55);
box-shadow:0 8px 20px rgba(75,48,9,.10);
}
#decoreva-coupon-modal .decoreva-coupon-option-info{
min-width:0;
display:flex;
flex-direction:column;
align-items:flex-start;
}
#decoreva-coupon-modal .decoreva-coupon-option-tag{
display:inline-flex;
align-items:center;
min-height:19px;
padding:3px 8px;
border-radius:20px;
background:#f3e4c7;
color:#76531f;
font-size:8px;
font-weight:900;
letter-spacing:.65px;
line-height:1;
}
#decoreva-coupon-modal .decoreva-coupon-option-info strong{
display:block;
margin-top:5px;
color:#a96f12;
font-size:17px;
font-weight:900;
letter-spacing:.65px;
line-height:1.05;
}
#decoreva-coupon-modal .decoreva-coupon-option-info small{
display:block;
margin-top:4px;
color:#756758;
font-size:9px;
font-weight:700;
letter-spacing:.15px;
}
#decoreva-coupon-modal .decoreva-coupon-option-actions{
flex:0 0 auto;
display:flex;
flex-direction:row;
align-items:center;
justify-content:flex-end;
gap:8px;
}
#decoreva-coupon-modal .decoreva-coupon-use{
flex:0 0 auto;
height:37px;
min-width:110px;
padding:0 13px;
border:1px solid #b77a13;
border-radius:8px;
background:linear-gradient(135deg,#a96f12,#d3a43f 48%,#a96f12);
color:#fff;
font-size:10px;
font-weight:900;
letter-spacing:.3px;
line-height:1;
cursor:pointer;
box-shadow:0 4px 11px rgba(75,48,9,.14),inset 0 1px 0 rgba(255,255,255,.28);
transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
}
#decoreva-coupon-modal .decoreva-coupon-use:hover{
transform:translateY(-1px);
box-shadow:0 7px 15px rgba(75,48,9,.20),inset 0 1px 0 rgba(255,255,255,.30);
}
#decoreva-coupon-modal .decoreva-coupon-use.applied{
background:#fff4dc;
color:#8c6425;
border-color:rgba(183,122,19,.65);
box-shadow:none;
cursor:default;
}
#decoreva-coupon-modal .decoreva-coupon-use.applied:hover{
transform:none;
box-shadow:none;
}
#decoreva-coupon-modal #decoreva-coupon-remove{
display:none;
align-items:center;
justify-content:center;
height:37px;
min-width:76px;
padding:0 12px;
border:1px solid rgba(140,100,37,.42);
border-radius:8px;
background:#fffdf8;
color:#76531f;
font-size:10px;
font-weight:900;
letter-spacing:.25px;
line-height:1;
cursor:pointer;
transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease;
}
#decoreva-coupon-modal #decoreva-coupon-remove:hover{
background:#fff3d8;
border-color:rgba(183,122,19,.68);
color:#69491b;
transform:translateY(-1px);
}
#decoreva-coupon-modal .decoreva-coupon-note{
display:flex;
align-items:center;
justify-content:center;
gap:8px;
margin-top:13px;
padding:5px 0 1px;
color:#5b4b3b;
font-size:12px;
font-weight:700;
line-height:1.45;
text-align:center;
}
#decoreva-coupon-modal .decoreva-coupon-note span{
color:#b77a13;
font-size:9px;
flex:0 0 auto;
}
#decoreva-coupon-modal .decoreva-coupon-modal-footer{
align-items:center;
gap:18px;
}
#decoreva-coupon-modal .decoreva-coupon-savings{
display:flex;
flex-direction:column;
gap:2px;
}
#decoreva-coupon-modal .decoreva-coupon-savings span{
color:#8a7968;
font-size:9px;
font-weight:700;
letter-spacing:.15px;
}
#decoreva-coupon-modal .decoreva-coupon-savings strong{
color:#4b3521;
font-size:13px;
font-weight:900;
}
#decoreva-coupon-modal #decoreva-coupon-apply{
height:42px;
min-width:132px;
padding:0 19px;
border:1px solid #b77a13;
border-radius:8px;
background:linear-gradient(135deg,#b77a13,#d3a43f 48%,#b77a13);
color:#fff;
font-size:11px;
font-weight:900;
letter-spacing:.35px;
line-height:1;
cursor:pointer;
box-shadow:0 7px 16px rgba(75,48,9,.18),inset 0 1px 0 rgba(255,255,255,.3);
transition:transform .18s ease,box-shadow .18s ease;
}
#decoreva-coupon-modal #decoreva-coupon-apply:hover{
transform:translateY(-1px);
box-shadow:0 9px 19px rgba(75,48,9,.23),inset 0 1px 0 rgba(255,255,255,.32);
}
@media (max-width:520px){
#decoreva-coupon-modal .decoreva-coupon-modal-panel{
width:calc(100vw - 32px) !important;
max-width:340px !important;
max-height:calc(100vh - 34px) !important;
border-radius:14px !important;
overflow-y:auto !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-head{
min-height:50px !important;
padding:0 14px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-body{
padding:14px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-input-row{
gap:7px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-input-row input#decoreva-coupon-input{
min-height:40px !important;
height:40px !important;
padding:0 10px !important;
font-size:13px !important;
}
#decoreva-coupon-modal #decoreva-coupon-check{
height:40px !important;
min-width:54px !important;
padding:0 6px !important;
font-size:10px !important;
}
#decoreva-coupon-modal .decoreva-coupon-message{
min-height:10px !important;
margin-top:4px !important;
font-size:10px !important;
}
#decoreva-coupon-modal .decoreva-coupon-options{
margin-top:9px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option{
gap:10px;
padding-left:14px;
}
#decoreva-coupon-modal .decoreva-coupon-option-actions{
gap:5px;
}
#decoreva-coupon-modal .decoreva-coupon-use{
min-width:88px;
padding:0 9px;
font-size:8px;
}
#decoreva-coupon-modal #decoreva-coupon-remove{
min-width:68px;
padding:0 8px;
font-size:8px;
}
#decoreva-coupon-modal .decoreva-coupon-option-info strong{
font-size:14px;
}
#decoreva-coupon-modal .decoreva-coupon-note{
font-size:10px !important;
margin-top:8px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-footer{
gap:10px !important;
padding:10px 14px !important;
}
#decoreva-coupon-modal .decoreva-coupon-savings span{
font-size:8px !important;
}
#decoreva-coupon-modal .decoreva-coupon-savings strong{
font-size:12px !important;
}
#decoreva-coupon-modal #decoreva-coupon-apply{
height:36px !important;
min-width:96px !important;
padding:0 12px !important;
font-size:10px !important;
}
}
`;
document.head.appendChild(couponStyle);
if (!document.getElementById("decoreva-mobile-coupon-text-final")) {
const mobileCouponTextStyle = document.createElement("style");
mobileCouponTextStyle.id = "decoreva-mobile-coupon-text-final";
mobileCouponTextStyle.textContent = `
@media (max-width: 760px) {
#decoreva-coupon-modal .decoreva-coupon-modal-panel {
width: min(350px, calc(100vw - 24px)) !important;
max-width: 350px !important;
max-height: calc(100vh - 28px) !important;
border-radius: 15px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-head {
min-height: 52px !important;
height: 52px !important;
padding: 0 15px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-head strong {
font-size: 14px !important;
line-height: 1.2 !important;
letter-spacing: .15px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-close {
width: 30px !important;
height: 30px !important;
font-size: 22px !important;
line-height: 30px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-body {
padding: 14px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-input-row {
gap: 8px !important;
}
#decoreva-coupon-modal #decoreva-coupon-input {
height: 40px !important;
min-height: 40px !important;
padding: 0 11px !important;
font-size: 13px !important;
line-height: 40px !important;
}
#decoreva-coupon-modal #decoreva-coupon-input::placeholder {
font-size: 12px !important;
opacity: .82 !important;
}
#decoreva-coupon-modal #decoreva-coupon-check {
height: 40px !important;
min-height: 40px !important;
min-width: 58px !important;
padding: 0 7px !important;
font-size: 10px !important;
font-weight: 800 !important;
letter-spacing: .25px !important;
}
#decoreva-coupon-modal .decoreva-coupon-message {
font-size: 10px !important;
line-height: 1.3 !important;
margin-top: 5px !important;
}
#decoreva-coupon-modal .decoreva-coupon-options {
margin-top: 10px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option {
min-height: 76px !important;
padding: 11px 11px 11px 14px !important;
gap: 9px !important;
border-radius: 12px !important;
box-sizing: border-box !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-info {
min-width: 0 !important;
gap: 2px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-tag {
font-size: 8px !important;
line-height: 1.2 !important;
letter-spacing: .55px !important;
padding: 3px 7px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-info strong {
font-size: 16px !important;
line-height: 1.1 !important;
letter-spacing: .2px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-info small {
font-size: 10px !important;
line-height: 1.2 !important;
letter-spacing: .05px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-actions {
gap: 5px !important;
flex: 0 0 auto !important;
}
#decoreva-coupon-modal .decoreva-coupon-use,
#decoreva-coupon-modal #decoreva-coupon-remove {
height: 34px !important;
min-height: 34px !important;
min-width: 86px !important;
padding: 0 8px !important;
border-radius: 7px !important;
font-size: 9px !important;
font-weight: 800 !important;
letter-spacing: .15px !important;
line-height: 1 !important;
}
#decoreva-coupon-modal .decoreva-coupon-note {
min-height: 28px !important;
margin-top: 7px !important;
font-size: 10px !important;
line-height: 1.25 !important;
gap: 7px !important;
}
#decoreva-coupon-modal .decoreva-coupon-note span {
font-size: 9px !important;
}
#decoreva-coupon-modal .decoreva-coupon-modal-footer {
min-height: 60px !important;
padding: 9px 14px !important;
gap: 10px !important;
box-sizing: border-box !important;
}
#decoreva-coupon-modal .decoreva-coupon-savings {
gap: 2px !important;
}
#decoreva-coupon-modal .decoreva-coupon-savings span {
font-size: 8.5px !important;
line-height: 1.2 !important;
}
#decoreva-coupon-modal .decoreva-coupon-savings strong {
font-size: 13px !important;
line-height: 1.15 !important;
}
#decoreva-coupon-modal #decoreva-coupon-apply {
height: 37px !important;
min-height: 37px !important;
min-width: 96px !important;
padding: 0 11px !important;
border-radius: 7px !important;
font-size: 10px !important;
font-weight: 900 !important;
letter-spacing: .2px !important;
}
}
@media (max-width: 360px) {
#decoreva-coupon-modal .decoreva-coupon-modal-panel {
width: calc(100vw - 20px) !important;
}
#decoreva-coupon-modal .decoreva-coupon-option {
padding-left: 12px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-info strong {
font-size: 15px !important;
}
#decoreva-coupon-modal .decoreva-coupon-option-info small {
font-size: 9.5px !important;
}
#decoreva-coupon-modal .decoreva-coupon-use,
#decoreva-coupon-modal #decoreva-coupon-remove {
min-width: 78px !important;
font-size: 8.5px !important;
}
}
`;
document.head.appendChild(mobileCouponTextStyle);
}
}
const wishlistDrawer = document.createElement("aside");
wishlistDrawer.id = "decoreva-wishlist-drawer";
wishlistDrawer.className = "decoreva-side-drawer";
wishlistDrawer.setAttribute("aria-hidden", "true");
wishlistDrawer.innerHTML = `
<div class="decoreva-side-overlay" data-wishlist-close="true"></div>
<div class="decoreva-side-panel" role="dialog" aria-modal="true" aria-label="Wishlist">
<div class="decoreva-side-head">
<div><strong>Wishlist</strong><span id="decoreva-wishlist-label">0 items</span></div>
<button type="button" class="decoreva-cart-close" data-wishlist-close="true" aria-label="Close wishlist">×</button>
</div>
<div id="decoreva-wishlist-empty" class="decoreva-side-empty">Your wishlist is empty.</div>
<div id="decoreva-wishlist-items" class="decoreva-side-items"></div>
</div>
`;
document.body.appendChild(wishlistDrawer);
const profilePanel = document.createElement("aside");
profilePanel.id = "decoreva-profile-panel";
profilePanel.className = "decoreva-profile-panel";
profilePanel.setAttribute("aria-hidden", "true");
profilePanel.innerHTML = `
<div class="decoreva-profile-overlay" data-profile-close="true"></div>
<div class="decoreva-profile-card" role="dialog" aria-modal="true" aria-label="DECOREVA Profile">
<div class="decoreva-profile-head">
<div><strong>My Profile</strong><span>Profile & Saved Addresses</span></div>
<button type="button" class="decoreva-cart-close" data-profile-close="true" aria-label="Close profile">×</button>
</div>
<div class="decoreva-profile-body">
<div class="decoreva-profile-welcome">
<strong id="decoreva-profile-welcome-title">Welcome to DECOREVA</strong>
<span id="decoreva-profile-welcome-sub">Login or sign up to manage your orders and account.</span>
<button type="button" id="decoreva-profile-login">LOGIN / SIGNUP</button>
</div>
<nav class="decoreva-profile-menu" aria-label="My account">
<button type="button" data-profile-menu="orders"><span>My Orders</span><small>Orders & order requests</small></button>
<button type="button" data-profile-menu="wishlist"><span>Wishlist</span><small>View saved products</small></button>
<button type="button" data-profile-menu="coupons"><span>Coupons</span><small>Available offers</small></button>
<button type="button" data-profile-menu="addresses"><span>Saved Addresses</span><small>Manage addresses</small></button>
<button type="button" data-profile-menu="contact"><span>Contact Us</span><small>WhatsApp & Instagram</small></button>
<button type="button" id="decoreva-profile-edit" data-profile-menu="personal"><span>Edit Profile</span><small>Personal details</small></button>
<button type="button" id="decoreva-profile-logout" data-profile-menu="logout" hidden><span>Logout</span><small>Sign out of your account</small></button>
</nav>
<section id="decoreva-profile-orders-section" class="decoreva-profile-section decoreva-profile-orders-section" hidden>
<div class="decoreva-profile-orders-head">
<button type="button" class="decoreva-profile-orders-back" data-profile-orders-back aria-label="Back to My Profile">
<span aria-hidden="true">‹</span> My Profile
</button>
<div class="decoreva-profile-orders-heading">
<strong>My Orders</strong>
<span>Your orders linked to this account.</span>
</div>
</div>
<div id="decoreva-profile-orders"></div>
</section>
<section id="decoreva-profile-personal-section" class="decoreva-profile-section" hidden>
<div class="decoreva-profile-section-title"><strong>Personal Details</strong><span>Save your details for faster checkout.</span></div>
<input id="decoreva-profile-name" type="text" placeholder="Full name" autocomplete="name">
<input id="decoreva-profile-mobile" type="tel" placeholder="Mobile number" inputmode="numeric" maxlength="10" autocomplete="tel">
<input id="decoreva-profile-email" type="email" placeholder="Email address (optional)" autocomplete="email">
<button type="button" id="decoreva-profile-save">Save Profile</button>
<div id="decoreva-profile-message" class="decoreva-profile-message"></div>
</section>
<section id="decoreva-profile-address-section" class="decoreva-profile-section" hidden>
<div class="decoreva-profile-section-title profile-address-title"><div><strong>Saved Addresses</strong><span>Use a saved address during checkout.</span></div><button type="button" id="decoreva-profile-add-address">+ Add New</button></div>
<div id="decoreva-profile-addresses"></div>
<div id="decoreva-profile-address-form" class="decoreva-profile-address-form" hidden data-edit-index="">
<strong id="decoreva-profile-address-form-title">Add New Address</strong>
<select id="decoreva-profile-address-label"><option value="HOME">HOME</option><option value="OFFICE">OFFICE</option><option value="OTHER">OTHER</option></select>
<input id="decoreva-profile-address-name" type="text" placeholder="Full name">
<input id="decoreva-profile-address-mobile" type="tel" placeholder="Mobile number" inputmode="numeric" maxlength="10">
<textarea id="decoreva-profile-address-line" rows="2" placeholder="House / Street / Area"></textarea>
<div class="decoreva-profile-address-grid"><input id="decoreva-profile-address-city" type="text" placeholder="City"><input id="decoreva-profile-address-state" type="text" placeholder="State"><input id="decoreva-profile-address-pincode" type="text" placeholder="PIN code" inputmode="numeric" maxlength="6"></div>
<div class="decoreva-profile-address-form-actions"><button type="button" id="decoreva-profile-address-cancel">Cancel</button><button type="button" id="decoreva-profile-address-save">Save Address</button></div>
<div id="decoreva-profile-address-message" class="decoreva-profile-message"></div>
</div>
</section>
<p class="decoreva-profile-note">Your profile and saved addresses are securely linked to your account when you are logged in.</p>
</div>
</div>
`;
document.body.appendChild(profilePanel);
if (!document.getElementById("decoreva-mobile-profile-compact")) {
const compactProfileStyle = document.createElement("style");
compactProfileStyle.id = "decoreva-mobile-profile-compact";
compactProfileStyle.textContent = `
@media (max-width: 760px) {
#decoreva-profile-panel .decoreva-profile-card {
width: min(320px, calc(100vw - 40px)) !important;
max-width: 320px !important;
max-height: calc(100vh - 88px) !important;
border-radius: 12px !important;
}
#decoreva-profile-panel .decoreva-profile-head {
min-height: 56px !important;
height: 56px !important;
padding: 9px 13px !important;
}
#decoreva-profile-panel .decoreva-profile-head strong {
font-size: 19px !important;
line-height: 1.1 !important;
}
#decoreva-profile-panel .decoreva-profile-head span {
margin-top: 2px !important;
font-size: 9px !important;
}
#decoreva-profile-panel .decoreva-profile-head .decoreva-cart-close {
width: 30px !important;
height: 30px !important;
font-size: 20px !important;
line-height: 30px !important;
}
#decoreva-profile-panel .decoreva-profile-body {
max-height: calc(100vh - 144px) !important;
overflow-y: auto !important;
}
#decoreva-profile-panel .decoreva-profile-welcome {
padding: 12px 14px !important;
}
#decoreva-profile-panel .decoreva-profile-welcome strong {
font-size: 16px !important;
}
#decoreva-profile-panel .decoreva-profile-welcome span {
font-size: 10px !important;
line-height: 1.3 !important;
}
#decoreva-profile-panel .decoreva-profile-menu {
margin: 0 8px 7px !important;
}
#decoreva-profile-panel .decoreva-profile-menu button {
min-height: 46px !important;
padding: 7px 11px !important;
gap: 10px !important;
}
#decoreva-profile-panel .decoreva-profile-menu button span {
font-size: 12px !important;
}
#decoreva-profile-panel .decoreva-profile-menu button small {
font-size: 9px !important;
}
#decoreva-profile-panel .decoreva-profile-note {
padding: 7px 13px 10px !important;
font-size: 9px !important;
line-height: 1.3 !important;
}
}
@media (max-width: 360px) {
#decoreva-profile-panel .decoreva-profile-card {
width: calc(100vw - 24px) !important;
max-width: 320px !important;
}
#decoreva-profile-panel .decoreva-profile-menu button {
min-height: 44px !important;
padding: 7px 10px !important;
}
}
`;
document.head.appendChild(compactProfileStyle);
}
if (!document.getElementById("decoreva-my-orders-style")) {
const style = document.createElement("style");
style.id = "decoreva-my-orders-style";
style.textContent =
"#decoreva-profile-orders-section{padding:0 16px 18px;}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-head{display:flex;flex-direction:column;gap:12px;margin:0 -2px 14px;padding:2px 0 12px;border-bottom:1px solid rgba(139,106,50,.14);}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-back{align-self:flex-start;border:0;background:transparent;color:#8b651f;font:700 11px/1 inherit;padding:3px 0;cursor:pointer;display:inline-flex;align-items:center;gap:4px;}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-back span{font-size:22px;line-height:10px;margin-top:-1px;}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-back:hover{color:#5b3e14;}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-heading{display:flex;flex-direction:column;gap:3px;}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-heading strong{font-size:18px;line-height:1.2;color:#2f2115;}" +
"#decoreva-profile-orders-section .decoreva-profile-orders-heading span{font-size:10px;color:#8b7355;}" +
"#decoreva-profile-orders{display:flex;flex-direction:column;gap:12px;}" +
".decoreva-profile-orders-loading,.decoreva-profile-orders-empty{padding:18px 14px;border:1px solid rgba(139,106,50,.18);border-radius:14px;background:#fffaf2;text-align:center;display:flex;flex-direction:column;gap:5px;color:#6b5537;font-size:12px;}" +
".decoreva-profile-orders-empty strong{font-size:14px;color:#3f2d1c;}" +
".decoreva-profile-orders-empty.error{border-color:rgba(180,60,45,.22);}" +
".decoreva-profile-order-card{border:1px solid rgba(139,106,50,.20);border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(60,40,20,.05);}" +
".decoreva-profile-order-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:13px 14px;background:#fffaf2;border-bottom:1px solid rgba(139,106,50,.13);}" +
".decoreva-profile-order-top>div{display:flex;flex-direction:column;gap:3px;min-width:0;}" +
".decoreva-profile-order-top strong{font-size:13px;color:#3f2d1c;word-break:break-word;}" +
".decoreva-profile-order-top span:not(.decoreva-profile-order-status){font-size:10px;color:#8b7355;}" +
".decoreva-profile-order-status{flex:0 0 auto;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.3px;background:#f2eadb;color:#73531f;}" +
".decoreva-profile-order-status.status-confirmed,.decoreva-profile-order-status.status-delivered,.decoreva-profile-order-status.status-completed{background:#e9f5ea;color:#2f6b39;}" +
".decoreva-profile-order-status.status-cancelled,.decoreva-profile-order-status.status-rejected{background:#fae9e7;color:#a23e35;}" +
".decoreva-profile-order-items{padding:4px 14px;}" +
".decoreva-profile-order-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid rgba(80,55,30,.08);}" +
".decoreva-profile-order-item:last-child{border-bottom:0;}" +
".decoreva-profile-order-item-info{display:flex;flex-direction:column;gap:2px;min-width:0;}" +
".decoreva-profile-order-item-info strong{font-size:12px;color:#3f2d1c;}" +
".decoreva-profile-order-item-info span,.decoreva-profile-order-item-info small{font-size:10px;color:#8b7355;}" +
".decoreva-profile-order-item>strong{font-size:11px;color:#4e3924;white-space:nowrap;}" +
".decoreva-profile-order-item-empty{padding:12px 0;color:#8b7355;font-size:11px;}" +
".decoreva-profile-order-summary{padding:10px 14px 12px;background:#fffaf2;border-top:1px solid rgba(139,106,50,.10);display:flex;flex-direction:column;gap:5px;font-size:10px;color:#806b50;}" +
".decoreva-profile-order-summary span{display:flex;justify-content:space-between;gap:12px;}" +
".decoreva-profile-order-summary strong{color:#4b3825;}" +
".decoreva-profile-order-summary .decoreva-profile-order-total{margin-top:4px;padding-top:8px;border-top:1px solid rgba(139,106,50,.15);font-size:12px;color:#3f2d1c;}" +
".decoreva-profile-order-summary .decoreva-profile-order-total strong{font-size:14px;color:#9a6b13;}" +
"@media (max-width:760px){#decoreva-profile-orders-section{padding:0 12px 16px;}#decoreva-profile-orders-section .decoreva-profile-orders-heading strong{font-size:17px;}.decoreva-profile-order-top{padding:11px 12px;}.decoreva-profile-order-items{padding:3px 12px;}.decoreva-profile-order-summary{padding:9px 12px 11px;}}";
document.head.appendChild(style);
}
if (window.decorevaSupabaseAuth &&
typeof window.decorevaSupabaseAuth.refresh === "function") {
window.decorevaSupabaseAuth.refresh();
}
}
buildCartUI();
renderCart();
renderWishlist();
updateCheckoutStepUI();
const decorevaOpenPanelAfterRefresh = getOpenPanelState();
if (decorevaOpenPanelAfterRefresh === "cart") {
openCartDrawer();
} else if (decorevaOpenPanelAfterRefresh === "wishlist") {
openWishlist();
}
const checkoutDrawer = document.querySelector("#decoreva-cart-drawer");
if (checkoutDrawer) {
checkoutDrawer.querySelectorAll("[data-checkout-step]").forEach(function (button) {
button.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
const step = button.dataset.checkoutStep;
if (step === "payment") {
const address = document.querySelector("#decoreva-checkout-address");
const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
if (address && panel) scrollCheckoutAddressToTop("smooth");
return;
}
checkoutStep = step === "address" ? "address" : "cart";
updateCheckoutStepUI();
const target = step === "address"
? document.querySelector("#decoreva-checkout-address")
: document.querySelector("#decoreva-cart-items");
const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
if (target && panel) panel.scrollTo({ top: Math.max(0, target.offsetTop - 20), behavior: "smooth" });
});
});
}
const couponCheckButton = document.querySelector("#decoreva-coupon-check");
if (couponCheckButton) {
couponCheckButton.addEventListener("click", function (event) {
event.preventDefault();
event.stopImmediatePropagation();
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
const code = input ? input.value.trim().toUpperCase() : "";
if (!message) return;
if (!code) {
couponPreviewCode = "";
message.textContent = "Please enter a coupon code.";
message.className = "decoreva-coupon-message warning";
renderCart();
renderCheckoutSummary();
} else if (!COUPONS[code]) {
couponPreviewCode = "";
message.textContent = "Invalid coupon code.";
message.className = "decoreva-coupon-message error";
renderCart();
renderCheckoutSummary();
} else if (appliedCoupon === code) {
message.textContent = code + " is already applied.";
message.className = "decoreva-coupon-message success";
} else {
couponPreviewCode = code;
message.textContent = "Coupon code is valid — 10% discount preview shown below. Click APPLY to keep it.";
message.className = "decoreva-coupon-message success";
renderCart();
renderCheckoutSummary();
}
});
}
const navCart = document.querySelector("#decoreva-nav-cart");
const navWishlist = document.querySelector("#decoreva-wishlist-nav");
const navProfile = document.querySelector("#decoreva-profile-nav");
if (navCart) navCart.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
openCart();
updateCartCount();
});
if (navWishlist) navWishlist.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
openWishlist();
updateWishlistCount();
});
if (navProfile) navProfile.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
if (window.innerWidth <= 760 && nav && nav.classList.contains("mobile-open")) {
nav.classList.remove("mobile-open");
document.body.classList.remove("menu-open");
if (menuButton) {
menuButton.setAttribute("aria-expanded", "false");
}
}
openProfile();
});
if (window.MutationObserver) {
const decorevaRatingMountObserver = new MutationObserver(function () {
if (typeof mountDecorevaMobileRatingRows === "function") {
mountDecorevaMobileRatingRows();
}
});
const ratingCollection = document.querySelector("#collection-products");
if (ratingCollection) {
decorevaRatingMountObserver.observe(ratingCollection, {
childList: true,
subtree: true
});
}
}
document.addEventListener("click", async function (event) {
const cartButton = event.target.closest(".decoreva-add-cart");
if (cartButton) {
event.preventDefault();
event.stopPropagation();
addToCart(cartButton.closest(".card, .featured-slide"));
return;
}
const wishlistButton = event.target.closest(".decoreva-wishlist");
if (wishlistButton) {
event.preventDefault();
event.stopPropagation();
toggleWishlist(wishlistButton.closest(".card, .featured-slide"));
return;
}
if (event.target.closest("#decoreva-nav-cart, #decoreva-cart-button")) {
event.preventDefault();
event.stopPropagation();
openCart();
return;
}
if (event.target.closest("#decoreva-wishlist-nav")) {
event.preventDefault();
event.stopPropagation();
openWishlist();
return;
}
if (event.target.closest("#decoreva-profile-nav")) {
event.preventDefault();
event.stopPropagation();
openProfile();
return;
}
if (event.target.closest("#decoreva-order-confirmation-close")) {
event.preventDefault();
event.stopImmediatePropagation();
const confirmation = document.querySelector("#decoreva-order-confirmation");
if (confirmation) confirmation.classList.remove("open");
const drawer = document.querySelector("#decoreva-cart-drawer");
if (drawer) {
drawer.classList.remove("decoreva-checkout-mode", "open");
drawer.setAttribute("aria-hidden", "true");
drawer.style.display = "none";
drawer.style.visibility = "hidden";
drawer.style.pointerEvents = "none";
}
document.body.classList.remove("decoreva-cart-open", "decoreva-checkout-open");
document.body.style.overflow = "";
document.documentElement.style.overflow = "";
clearOpenPanelState();
clearAllCollectionFilters(false);
document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
nav.style.display = "flex";
});
history.replaceState(null, "", window.location.pathname);
const html = document.documentElement;
const body = document.body;
const oldHtmlScrollBehavior = html.style.scrollBehavior;
const oldBodyScrollBehavior = body.style.scrollBehavior;
html.style.setProperty("scroll-behavior", "auto", "important");
body.style.setProperty("scroll-behavior", "auto", "important");
window.scrollTo(0, 0);
window.requestAnimationFrame(function () {
window.scrollTo(0, 0);
html.style.scrollBehavior = oldHtmlScrollBehavior;
body.style.scrollBehavior = oldBodyScrollBehavior;
});
return;
}
const cartProduct = event.target.closest(
".decoreva-cart-item[data-cart-view]"
);
if (cartProduct && !event.target.closest("[data-cart-action]")) {
event.preventDefault();
event.stopImmediatePropagation();
const index = Number(cartProduct.dataset.cartIndex);
const savedItem = Number.isInteger(index) ? cart[index] : null;
if (!savedItem) return;
const savedId = String(savedItem.id || "");
const savedProductId = String(savedItem.productId || "");
const savedTitle = String(savedItem.title || "")
.trim()
.replace(/\s+/g, " ")
.toLowerCase();
const collectionCards = Array.from(
document.querySelectorAll("#collection-products .card")
);
let target = collectionCards.find(function (card) {
const data = getCardData(card);
return data && savedId && String(data.id || "") === savedId;
});
if (!target && savedProductId) {
target = collectionCards.find(function (card) {
const data = getCardData(card);
return data && String(data.productId || "") === savedProductId;
});
}
if (!target && savedTitle) {
target = collectionCards.find(function (card) {
const heading = card.querySelector("h3");
return heading &&
heading.textContent.trim().replace(/\s+/g, " ").toLowerCase() === savedTitle;
});
}
if (!target) return;
const targetIndex = decorevaProducts.indexOf(target);
const targetPage = targetIndex >= 0
? Math.floor(targetIndex / decorevaPerPage) + 1
: 1;
const html = document.documentElement;
const body = document.body;
const oldHtmlVisibility = html.style.visibility;
const oldBodyVisibility = body.style.visibility;
html.style.visibility = "hidden";
body.style.visibility = "hidden";
closeCart(false);
window.decorevaPageNavigation = false;
if (targetIndex >= 0 && typeof decorevaShowPage === "function") {
decorevaShowPage(targetPage);
}
const visibleCards = Array.from(
document.querySelectorAll("#collection-products .card")
);
let exactTarget = visibleCards.find(function (card) {
const data = getCardData(card);
return data && savedId && String(data.id || "") === savedId;
});
if (!exactTarget && savedProductId) {
exactTarget = visibleCards.find(function (card) {
const data = getCardData(card);
return data && String(data.productId || "") === savedProductId;
});
}
if (!exactTarget && savedTitle) {
exactTarget = visibleCards.find(function (card) {
const heading = card.querySelector("h3");
return heading &&
heading.textContent.trim().replace(/\s+/g, " ").toLowerCase() === savedTitle;
});
}
if (!exactTarget) {
html.style.visibility = oldHtmlVisibility;
body.style.visibility = oldBodyVisibility;
return;
}
exactTarget.style.setProperty("display", "flex", "important");
const header = document.querySelector("header") ||
document.querySelector(".site-header") ||
document.querySelector("nav");
const headerHeight = header
? header.getBoundingClientRect().height
: (window.innerWidth <= 760 ? 58 : 72);
const rect = exactTarget.getBoundingClientRect();
const targetTop = window.pageYOffset + rect.top - Math.max(headerHeight + 18, 90);
const oldHtmlScrollBehavior = html.style.scrollBehavior;
const oldBodyScrollBehavior = body.style.scrollBehavior;
const oldScrollRestoration =
history.scrollRestoration;
html.style.setProperty("scroll-behavior", "auto", "important");
body.style.setProperty("scroll-behavior", "auto", "important");
try {
history.scrollRestoration = "manual";
} catch (error) {
}
const finalTargetTop = Math.max(0, targetTop);
window.scrollTo(0, finalTargetTop);
exactTarget.classList.add("decoreva-cart-target");
window.requestAnimationFrame(function () {
window.scrollTo(0, finalTargetTop);
window.requestAnimationFrame(function () {
window.scrollTo(0, finalTargetTop);
html.style.visibility = oldHtmlVisibility;
body.style.visibility = oldBodyVisibility;
html.style.scrollBehavior = oldHtmlScrollBehavior;
body.style.scrollBehavior = oldBodyScrollBehavior;
try {
history.scrollRestoration = oldScrollRestoration;
} catch (error) {
}
});
});
window.setTimeout(function () {
exactTarget.classList.remove("decoreva-cart-target");
}, 1800);
return;
}
const cartAction = event.target.closest("[data-cart-action]");
if (cartAction) {
event.preventDefault();
event.stopPropagation();
const index = Number(cartAction.dataset.cartIndex);
const action = cartAction.dataset.cartAction;
if (!Number.isInteger(index) || !cart[index]) return;
if (action === "plus") {
cart[index].quantity = Number(cart[index].quantity || 0) + 1;
} else if (action === "minus") {
cart[index].quantity = Math.max(0, Number(cart[index].quantity || 0) - 1);
if (cart[index].quantity === 0) {
cart.splice(index, 1);
}
} else if (action === "remove") {
cart.splice(index, 1);
} else if (action === "wishlist") {
const item = cart[index];
if (!wishlist.some(function(saved) {
return saved.id === item.id;
})) {
wishlist.push(item);
saveWishlist();
}
cart.splice(index, 1);
} else {
return;
}
saveCart();
updateCartCount();
updateWishlistCount();
renderCart();
renderWishlist();
return;
}
const cartCloseButton = event.target.closest("#decoreva-cart-drawer .decoreva-cart-close");
if (cartCloseButton) {
event.preventDefault();
event.stopImmediatePropagation();
closeCart(false);
clearAllCollectionFilters(false);
document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
nav.style.display = "flex";
});
history.replaceState(
null,
"",
window.location.pathname
);
const html = document.documentElement;
const body = document.body;
const oldHtmlScrollBehavior = html.style.scrollBehavior;
const oldBodyScrollBehavior = body.style.scrollBehavior;
html.style.setProperty("scroll-behavior", "auto", "important");
body.style.setProperty("scroll-behavior", "auto", "important");
window.scrollTo(0, 0);
window.requestAnimationFrame(function () {
window.scrollTo(0, 0);
html.style.scrollBehavior = oldHtmlScrollBehavior;
body.style.scrollBehavior = oldBodyScrollBehavior;
});
return;
}
if (event.target.closest("[data-cart-close]")) {
event.preventDefault();
closeCart();
return;
}
if (event.target.closest("[data-wishlist-close]")) {
event.preventDefault();
closeWishlist();
return;
}
if (event.target.closest("[data-profile-close]")) {
event.preventDefault();
closeProfile();
return;
}
if (event.target.closest("#decoreva-open-coupon, #decoreva-checkout-coupon-button")) {
event.preventDefault();
openCouponModal();
return;
}
if (event.target.closest("#decoreva-checkout-remove-coupon")) {
event.preventDefault();
appliedCoupon = "";
couponPreviewCode = "";
saveCoupon();
renderCart();
renderCheckoutSummary();
return;
}
if (event.target.closest("#decoreva-coupon-remove")) {
event.preventDefault();
event.stopPropagation();
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
const removeButton = document.querySelector("#decoreva-coupon-remove");
appliedCoupon = "";
couponPreviewCode = "";
saveCoupon();
if (input) input.value = "";
if (message) {
message.textContent = "Coupon removed.";
message.className = "decoreva-coupon-message success";
}
if (removeButton) removeButton.style.display = "none";
const restoredUseButton = document.querySelector(".decoreva-coupon-use[data-coupon-use='WELCOME10']");
if (restoredUseButton) {
restoredUseButton.textContent = "USE COUPON";
restoredUseButton.classList.remove("applied");
restoredUseButton.disabled = false;
}
renderCart();
renderCheckoutSummary();
return;
}
if (event.target.closest("[data-coupon-close]")) {
event.preventDefault();
closeCouponModal();
return;
}
const couponUseButton = event.target.closest("[data-coupon-use]");
if (couponUseButton) {
event.preventDefault();
event.stopPropagation();
const code = String(couponUseButton.dataset.couponUse || "").toUpperCase();
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
couponPreviewCode = code;
if (input) {
input.value = code;
input.focus();
input.select();
}
if (message) {
message.textContent = code + " selected • 10% OFF. Click APPLY to apply this coupon.";
message.className = "decoreva-coupon-message success";
}
renderCart();
renderCheckoutSummary();
const refreshedInput = document.querySelector("#decoreva-coupon-input");
if (refreshedInput) {
refreshedInput.value = code;
refreshedInput.focus();
refreshedInput.select();
}
return;
}
if (event.target.closest("#decoreva-coupon-check")) {
event.preventDefault();
event.stopPropagation();
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
const code = input ? input.value.trim().toUpperCase() : "";
if (!message) return;
if (!code) {
couponPreviewCode = "";
message.textContent = "Please enter a coupon code.";
message.className = "decoreva-coupon-message warning";
renderCart();
renderCheckoutSummary();
} else if (!COUPONS[code]) {
couponPreviewCode = "";
message.textContent = "Invalid coupon code.";
message.className = "decoreva-coupon-message error";
renderCart();
renderCheckoutSummary();
} else if (appliedCoupon === code) {
message.textContent = code + " is already applied.";
message.className = "decoreva-coupon-message success";
} else {
couponPreviewCode = code;
message.textContent = "Coupon code is valid — 10% discount preview shown below. Click APPLY to keep it.";
message.className = "decoreva-coupon-message success";
renderCart();
renderCheckoutSummary();
}
return;
}
if (event.target.closest("#decoreva-coupon-apply")) {
event.preventDefault();
event.stopPropagation();
const input = document.querySelector("#decoreva-coupon-input");
const message = document.querySelector("#decoreva-coupon-message");
const code = input ? input.value.trim().toUpperCase() : "";
if (!code) {
if (message) {
message.textContent = "Please enter or select a coupon code.";
message.className = "decoreva-coupon-message warning";
}
return;
}
if (!COUPONS[code]) {
couponPreviewCode = "";
if (message) {
message.textContent = "Invalid coupon code.";
message.className = "decoreva-coupon-message error";
}
renderCart();
renderCheckoutSummary();
return;
}
applyCoupon();
return;
}
const stepButton = event.target.closest("[data-checkout-step]");
if (stepButton) {
event.preventDefault();
event.stopPropagation();
const step = stepButton.dataset.checkoutStep;
if (step === "payment") {
const address = document.querySelector("#decoreva-checkout-address");
const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
if (address && panel) scrollCheckoutAddressToTop("smooth");
return;
}
checkoutStep = step === "address" ? "address" : "cart";
const d = document.querySelector("#decoreva-cart-drawer");
if (d) d.classList.add("decoreva-checkout-mode");
document.body.classList.add("decoreva-checkout-open");
updateCheckoutStepUI();
const target = step === "address"
? document.querySelector("#decoreva-checkout-address")
: document.querySelector("#decoreva-cart-items");
const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
if (target && panel) { if (step === "address") scrollCheckoutAddressToTop("smooth"); else panel.scrollTo({ top: Math.max(0, target.offsetTop - 18), behavior: "smooth" }); }
return;
}
if (event.target.closest("#decoreva-payment-order")) {
event.preventDefault();
event.stopPropagation();
const address = document.querySelector("#decoreva-checkout-address");
if (!address || !cart.length) return;
const get = function (id) {
const el = document.querySelector(id);
return el ? el.value.trim() : "";
};
const complete =
!!get("#decoreva-address-name") &&
/^\\d{10}$/.test(get("#decoreva-address-mobile")) &&
!!get("#decoreva-address-line") &&
!!get("#decoreva-address-city") &&
!!get("#decoreva-address-state") &&
/^\\d{6}$/.test(get("#decoreva-address-pincode"));
if (!complete) {
const addressMessage = document.querySelector("#decoreva-address-message");
if (addressMessage) {
addressMessage.dataset.userMessage = "1";
addressMessage.textContent = "Please fill all delivery address details before placing your order.";
addressMessage.className = "decoreva-address-message error";
}
checkoutStep = "address";
updateCheckoutStepUI();
scrollCheckoutAddressToTop("smooth");
return;
}
deliveryAddress = {
name: get("#decoreva-address-name"),
mobile: get("#decoreva-address-mobile"),
line: get("#decoreva-address-line"),
city: get("#decoreva-address-city"),
state: get("#decoreva-address-state"),
pincode: get("#decoreva-address-pincode")
};
localStorage.setItem("decorevaDeliveryAddress", JSON.stringify(deliveryAddress));
whatsappCheckout();
return;
}
if (event.target.closest("#decoreva-cart-whatsapp")) {
event.preventDefault();
event.stopPropagation();
const drawer = document.querySelector("#decoreva-cart-drawer");
const addressSection = document.querySelector("#decoreva-checkout-address");
const checkoutButton = document.querySelector("#decoreva-cart-whatsapp");
if (!drawer || !addressSection || !cart.length) return;
const get = function (id) {
const el = document.querySelector(id);
return el ? el.value.trim() : "";
};
const address = {
name: get("#decoreva-address-name"),
mobile: get("#decoreva-address-mobile"),
line: get("#decoreva-address-line"),
city: get("#decoreva-address-city"),
state: get("#decoreva-address-state"),
pincode: get("#decoreva-address-pincode")
};
const complete =
!!address.name &&
/^\d{10}$/.test(address.mobile) &&
!!address.line &&
!!address.city &&
!!address.state &&
/^\d{6}$/.test(address.pincode);
if (!checkoutAddressUnlocked) {
checkoutAddressUnlocked = true;
checkoutStep = "address";
if (addressSection) addressSection.hidden = false;
drawer.classList.add("decoreva-checkout-mode", "open");
drawer.setAttribute("aria-hidden", "false");
document.body.classList.add("decoreva-cart-open", "decoreva-checkout-open");
document.body.style.overflow = "hidden";
document.documentElement.style.overflow = "hidden";
updateCheckoutStepUI();
const message = document.querySelector("#decoreva-address-message");
if (!complete) {
if (message) {
message.dataset.userMessage = "1";
message.textContent = "Please complete all required delivery address details.";
message.className = "decoreva-address-message error";
}
updateAddressContinueState();
if (typeof showShopToast === "function") {
}
requestAnimationFrame(function () {
scrollCheckoutAddressToTop("smooth");
const firstInvalid = [
"#decoreva-address-name",
"#decoreva-address-mobile",
"#decoreva-address-line",
"#decoreva-address-city",
"#decoreva-address-state",
"#decoreva-address-pincode"
].map(function (id) {
return document.querySelector(id);
}).find(function (el) {
return el && el.classList.contains("decoreva-address-invalid");
});
if (firstInvalid) firstInvalid.focus({ preventScroll: true });
});
return;
}
deliveryAddress = address;
localStorage.setItem("decorevaDeliveryAddress", JSON.stringify(address));
updateAddressContinueState();
if (checkoutButton) checkoutButton.focus({ preventScroll: true });
return;
}
if (!complete) {
const message = document.querySelector("#decoreva-address-message");
if (message) {
message.dataset.userMessage = "1";
message.textContent = "Please complete all required delivery address details.";
message.className = "decoreva-address-message error";
}
updateAddressContinueState();
if (typeof showShopToast === "function") {
}
checkoutStep = "address";
updateCheckoutStepUI();
requestAnimationFrame(function () {
scrollCheckoutAddressToTop("smooth");
});
return;
}
deliveryAddress = address;
localStorage.setItem("decorevaDeliveryAddress", JSON.stringify(address));
profile.name = address.name || profile.name;
profile.mobile = address.mobile || profile.mobile;
const exists = profile.addresses.some(function (saved) {
return saved.line === address.line && saved.pincode === address.pincode;
});
if (!exists) {
profile.addresses.push({
label: "HOME",
name: address.name,
mobile: address.mobile,
line: address.line,
city: address.city,
state: address.state,
pincode: address.pincode,
default: profile.addresses.length === 0
});
saveProfile();
}
const message = document.querySelector("#decoreva-address-message");
if (message) {
message.dataset.userMessage = "1";
message.textContent = "Address saved. Opening WhatsApp to place your order.";
message.className = "decoreva-address-message success";
}
whatsappCheckout();
}
}, true);
document.addEventListener("click", function (event) {
const clearButton = event.target.closest("[data-address-clear]");
if (!clearButton) return;
event.preventDefault();
event.stopPropagation();
const selector = clearButton.getAttribute("data-address-clear");
const field = selector ? document.querySelector(selector) : null;
if (!field) return;
field.value = "";
field.classList.add("decoreva-address-invalid");
field.setAttribute("aria-invalid", "true");
const message = document.querySelector("#decoreva-address-message");
if (message) {
message.dataset.userMessage = "";
message.textContent = "Please complete all required delivery address details.";
message.className = "decoreva-address-message warning";
}
updateAddressContinueState();
field.focus();
}, true);
document.addEventListener("click", function (event) {
const navWish = event.target.closest("#decoreva-wishlist-nav");
if (navWish) {
event.preventDefault();
event.stopPropagation();
openWishlist();
return;
}
const wishlistItem = event.target.closest(
".decoreva-wishlist-item[data-wishlist-view]"
);
if (wishlistItem && !event.target.closest("[data-wishlist-action]")) {
event.preventDefault();
event.stopPropagation();
const index = Number(wishlistItem.dataset.wishlistIndex);
const savedItem =
Number.isInteger(index) ? wishlist[index] : null;
if (!savedItem) return;
const savedId = String(savedItem.id || "");
const savedProductId = String(savedItem.productId || "");
const savedTitle = String(savedItem.title || "")
.trim()
.replace(/\s+/g, " ")
.toLowerCase();
const collectionCards = Array.from(
document.querySelectorAll("#collection-products .card")
);
let target = collectionCards.find(function (card) {
const data = getCardData(card);
return data &&
savedId &&
String(data.id || "") === savedId;
});
if (!target && savedProductId) {
target = collectionCards.find(function (card) {
const data = getCardData(card);
return data &&
String(data.productId || "") === savedProductId;
});
}
if (!target && savedTitle) {
target = collectionCards.find(function (card) {
const heading = card.querySelector("h3");
return heading &&
heading.textContent
.trim()
.replace(/\s+/g, " ")
.toLowerCase() === savedTitle;
});
}
if (!target) return;
closeWishlist();
const targetIndex = decorevaProducts.indexOf(target);
if (
targetIndex >= 0 &&
typeof decorevaShowPage === "function"
) {
const targetPage =
Math.floor(targetIndex / decorevaPerPage) + 1;
window.decorevaPageNavigation = false;
if (decorevaCurrentPage !== targetPage) {
decorevaShowPage(targetPage);
}
}
setTimeout(function () {
target.scrollIntoView({
behavior: "smooth",
block: "center"
});
target.classList.add("decoreva-wishlist-target");
window.setTimeout(function () {
target.classList.remove("decoreva-wishlist-target");
}, 1400);
}, 100);
return;
}
const wishlistAction = event.target.closest("[data-wishlist-action]");
if (wishlistAction) {
event.preventDefault();
const index = Number(wishlistAction.dataset.wishlistIndex);
if (!Number.isInteger(index) || !wishlist[index]) return;
if (wishlistAction.dataset.wishlistAction === "remove") {
wishlist.splice(index, 1);
saveWishlist();
renderWishlist();
}
return;
}
const checkoutAction = event.target.closest("[data-checkout-item-action]");
if (checkoutAction) {
event.preventDefault();
const index = Number(checkoutAction.dataset.checkoutItemIndex);
if (!Number.isInteger(index) || !cart[index]) return;
const action = checkoutAction.dataset.checkoutItemAction;
if (action === "remove") {
cart.splice(index, 1);
} else if (action === "wishlist") {
const item = cart[index];
if (!wishlist.some(function(saved){ return saved.id === item.id; })) {
wishlist.push(item);
saveWishlist();
}
cart.splice(index, 1);
}
saveCart();
renderCart();
renderWishlist();
return;
}
const similarView = event.target.closest("[data-similar-product-title]");
if (similarView) {
event.preventDefault();
const title = String(similarView.dataset.similarProductTitle || "").trim().toLowerCase();
const target = Array.from(document.querySelectorAll("#collection-products .card, .featured-slider .featured-slide"))
.find(function(card){
const heading = card.querySelector("h3");
return heading && heading.textContent.trim().replace(/\s+/g," ").toLowerCase() === title;
});
closeCart();
if (target) {
setTimeout(function(){
target.scrollIntoView({behavior:"smooth", block:"center"});
}, 60);
}
return;
}
}, true);
if (!document.getElementById("decoreva-wishlist-target-style")) {
const style = document.createElement("style");
style.id = "decoreva-wishlist-target-style";
style.textContent =
"#collection-products .card.decoreva-wishlist-target{" +
"outline:2px solid rgba(185,130,24,.85);" +
"outline-offset:3px;" +
"transition:outline .2s ease;" +
"}";
document.head.appendChild(style);
}
if (!document.getElementById("decoreva-cart-target-style")) {
const style = document.createElement("style");
style.id = "decoreva-cart-target-style";
style.textContent =
"#collection-products .card.decoreva-cart-target{" +
"outline:2px solid rgba(169,109,15,.9);" +
"outline-offset:3px;" +
"transition:outline .2s ease;" +
"}";
document.head.appendChild(style);
}
document.addEventListener("keydown", function (event) {
if (event.key === "Escape") {
closeCart();
closeWishlist();
closeProfile();
closeCouponModal();
}
});
document.addEventListener("input", function (event) {
if (!event.target.matches("#decoreva-address-name, #decoreva-address-mobile, #decoreva-address-line, #decoreva-address-city, #decoreva-address-state, #decoreva-address-pincode")) return;
const message = document.querySelector("#decoreva-address-message");
if (message) message.dataset.userMessage = "";
updateAddressContinueState();
});
document.addEventListener("input", function (event) {
if (!event.target.matches("#decoreva-coupon-input")) return;
const message = document.querySelector("#decoreva-coupon-message");
if (!message) return;
if (event.target.value.trim() && event.target.value.trim().toUpperCase() !== appliedCoupon) {
message.textContent = "Please apply coupon code";
message.className = "decoreva-coupon-message warning";
} else if (!event.target.value.trim()) {
message.textContent = "";
message.className = "decoreva-coupon-message";
if (appliedCoupon) {
appliedCoupon = "";
saveCoupon();
renderCart();
}
}
}, true);
function addCardButtons() {
document.querySelectorAll("#collection-products .card, .featured-slide").forEach(function (card) {
if (!card.querySelector(":scope > .decoreva-add-cart")) {
const button = document.createElement("button");
button.type = "button";
button.className = "decoreva-add-cart";
const title = (card.querySelector("h3") || {}).textContent || "product";
button.setAttribute("aria-label", "Add " + title.trim() + " to cart");
button.title = "Add to Cart";
button.innerHTML = '<i class="fas fa-cart-plus" aria-hidden="true"></i>';
card.appendChild(button);
}
if (!card.querySelector(":scope > .decoreva-wishlist")) {
const button = document.createElement("button");
button.type = "button";
button.className = "decoreva-wishlist";
button.title = "Add to Wishlist";
button.innerHTML = '<i class="far fa-heart" aria-hidden="true"></i>';
card.appendChild(button);
}
});
updateWishlistButtons();
}
if (!document.getElementById("decoreva-card-corner-icons-style")) {
const style = document.createElement("style");
style.id = "decoreva-card-corner-icons-style";
style.textContent =
".card, .featured-slide{" +
"position:relative !important;}" +
".card > .decoreva-wishlist, .featured-slide > .decoreva-wishlist{" +
"position:absolute !important;top:3px !important;left:3px !important;right:auto !important;" +
"z-index:60 !important;}" +
".card > .decoreva-add-cart, .featured-slide > .decoreva-add-cart{" +
"position:absolute !important;top:3px !important;right:3px !important;left:auto !important;" +
"z-index:60 !important;}";
document.head.appendChild(style);
}
addCardButtons();
updateCartCount();
updateWishlistCount();
window.setTimeout(function () {
updateCartCount();
updateWishlistCount();
}, 0);
document.addEventListener("click", async function (event) {
const profileMenu = event.target.closest("[data-profile-menu]");
if (profileMenu) {
event.preventDefault();
const action = profileMenu.dataset.profileMenu;
if (action === "orders") {
const section = document.querySelector("#decoreva-profile-orders-section");
if (section) {
let ordersDrawer = document.querySelector("#decoreva-orders-drawer");
if (!ordersDrawer) {
ordersDrawer = document.createElement("aside");
ordersDrawer.id = "decoreva-orders-drawer";
ordersDrawer.className = "decoreva-orders-drawer";
ordersDrawer.setAttribute("aria-hidden", "true");
ordersDrawer.innerHTML =
'<div class="decoreva-orders-overlay" data-orders-close="true"></div>' +
'<div class="decoreva-orders-panel" role="dialog" aria-modal="true" aria-label="My Orders">' +
'<div class="decoreva-orders-panel-head">' +
'<div><strong>My Orders</strong><span>Your DECOREVA orders</span></div>' +
'<button type="button" class="decoreva-orders-close" data-orders-close="true" aria-label="Close My Orders">×</button>' +
'</div>' +
'<div class="decoreva-orders-panel-body"></div>' +
'</div>';
document.body.appendChild(ordersDrawer);
const orderBody = ordersDrawer.querySelector(".decoreva-orders-panel-body");
if (orderBody) orderBody.appendChild(section);
if (!document.getElementById("decoreva-orders-drawer-style")) {
const style = document.createElement("style");
style.id = "decoreva-orders-drawer-style";
style.textContent =
"#decoreva-orders-drawer{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100%!important;height:100dvh!important;z-index:2147483000!important;visibility:hidden;pointer-events:none;margin:0!important;padding:0!important;}" +
"#decoreva-orders-drawer.open{visibility:visible;pointer-events:auto;}" +
"#decoreva-orders-drawer .decoreva-orders-overlay{position:absolute!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100%!important;height:100%!important;background:rgba(15,10,5,.48);opacity:0;transition:opacity .22s ease;}" +
"#decoreva-orders-drawer.open .decoreva-orders-overlay{opacity:1;}" +
"#decoreva-orders-drawer .decoreva-orders-panel{position:absolute!important;top:0!important;right:0!important;bottom:0!important;width:min(430px,92vw)!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:0!important;background:#fff;box-shadow:-12px 0 35px rgba(0,0,0,.22);transform:translate3d(105%,0,0);transition:transform .26s cubic-bezier(.22,.61,.36,1);display:flex;flex-direction:column;overflow:hidden;}" +
"#decoreva-orders-drawer.open .decoreva-orders-panel{transform:translate3d(0,0,0);}" +
"#decoreva-orders-drawer .decoreva-orders-panel-head{position:relative!important;top:0!important;flex:0 0 auto;min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;background:#1d1109;color:#fff;border-bottom:1px solid #c8952e;z-index:5;box-sizing:border-box;}" +
"#decoreva-orders-drawer .decoreva-orders-panel-head>div{display:flex;flex-direction:column;gap:3px;min-width:0;}" +
"#decoreva-orders-drawer .decoreva-orders-panel-head strong{font-size:20px;line-height:1.1;color:#f1c75f;}" +
"#decoreva-orders-drawer .decoreva-orders-panel-head span{font-size:10px;color:#eadfcf;}" +
"#decoreva-orders-drawer .decoreva-orders-close{flex:0 0 34px!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;margin:0!important;padding:0!important;border:1px solid rgba(241,199,95,.5)!important;border-radius:50%!important;background:#302016!important;color:#f1c75f!important;font:700 24px/30px Arial,sans-serif!important;text-align:center!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-sizing:border-box!important;opacity:1!important;visibility:visible!important;}" +
"#decoreva-orders-drawer .decoreva-orders-close:hover{background:#f1c75f!important;color:#1d1109!important;border-color:#f1c75f!important;}" +
"#decoreva-orders-drawer .decoreva-orders-panel-body{flex:1 1 auto;min-height:0;height:auto;overflow-y:auto;overflow-x:hidden;padding:0;}" +
"#decoreva-orders-drawer .decoreva-profile-orders-section{display:block!important;padding:16px!important;}" +
"#decoreva-orders-drawer .decoreva-profile-orders-head{display:none;}" +
"#decoreva-orders-drawer .decoreva-profile-order-card{box-shadow:0 3px 12px rgba(60,40,20,.07);}" +
"@media(max-width:760px){#decoreva-orders-drawer .decoreva-orders-panel{width:100%!important;}#decoreva-orders-drawer .decoreva-orders-panel-head{min-height:66px;padding:12px 14px;}#decoreva-orders-drawer .decoreva-orders-panel-head strong{font-size:18px;}#decoreva-orders-drawer .decoreva-profile-orders-section{padding:12px!important;}}";
document.head.appendChild(style);
}
ordersDrawer.addEventListener("click", function (ordersEvent) {
if (ordersEvent.target.closest("[data-orders-close]")) {
ordersEvent.preventDefault();
ordersEvent.stopPropagation();
closeMyOrdersDrawer();
}
});
}
section.hidden = false;
const profileBack = section.querySelector("[data-profile-orders-back]");
if (profileBack) profileBack.hidden = true;
closeProfile();
ordersDrawer.classList.add("open");
ordersDrawer.setAttribute("aria-hidden", "false");
document.body.classList.add("decoreva-orders-open");
document.body.style.overflow = "hidden";
}
await loadMyOrders();
} else if (action === "wishlist") {
closeProfile();
openWishlist();
} else if (action === "coupons") {
closeProfile();
openCouponModal();
} else if (action === "personal") {
const section = document.querySelector("#decoreva-profile-personal-section");
if (section) {
section.hidden = false;
section.scrollIntoView({behavior:"smooth", block:"start"});
}
} else if (action === "addresses") {
const section = document.querySelector("#decoreva-profile-address-section");
if (section) {
section.hidden = !section.hidden;
if (!section.hidden) {
section.scrollIntoView({behavior:"smooth", block:"start"});
}
}
} else if (action === "contact") {
closeProfile();
setTimeout(function(){
const contact = document.querySelector("#contact");
if (contact) contact.scrollIntoView({behavior:"smooth", block:"start"});
}, 80);
}
return;
}
if (event.target.closest("[data-profile-orders-back]")) {
event.preventDefault();
closeMyOrdersDrawer();
return;
}
if (event.target.closest("#decoreva-profile-login")) {
event.preventDefault();
closeProfile();
return;
}
if (event.target.closest("#decoreva-profile-save")) {
event.preventDefault();
const get = id => { const el = document.querySelector(id); return el ? el.value.trim() : ""; };
const name = get("#decoreva-profile-name");
const mobile = get("#decoreva-profile-mobile");
const email = get("#decoreva-profile-email");
const message = document.querySelector("#decoreva-profile-message");
if (!name || !/^\d{10}$/.test(mobile)) {
if (message) { message.textContent = "Please enter your name and valid 10-digit mobile number."; message.className = "decoreva-profile-message error"; }
return;
}
profile.name = name;
profile.mobile = mobile;
profile.email = email;
saveProfile();
if (message) { message.textContent = "Profile saved successfully."; message.className = "decoreva-profile-message success"; message.dataset.persistent = "true"; }
renderProfile();
if (message) { message.textContent = "Profile saved successfully."; message.className = "decoreva-profile-message success"; message.dataset.persistent = "true"; }
return;
}
if (event.target.closest("#decoreva-profile-add-address")) {
event.preventDefault();
showProfileAddressForm();
return;
}
if (event.target.closest("#decoreva-profile-address-cancel")) {
event.preventDefault();
hideProfileAddressForm();
return;
}
const addressAction = event.target.closest("[data-profile-address-action]");
if (addressAction) {
event.preventDefault();
const index = Number(addressAction.dataset.profileAddressIndex);
if (!Number.isInteger(index) || !profile.addresses[index]) return;
const action = addressAction.dataset.profileAddressAction;
if (action === "edit") { showProfileAddressForm(index); return; }
if (action === "delete") {
const selectedAddress = profile.addresses[index];
if (selectedAddress && selectedAddress.id && decorevaAddressSupabase) {
try {
await deleteSupabaseAddress(selectedAddress);
renderProfile();
} catch (error) {
console.error("DECOREVA saved address delete error:", error);
alert("Could not delete this address. Please try again.");
}
return;
}
profile.addresses.splice(index, 1);
if (profile.addresses.length && !profile.addresses.some(a => a.default)) profile.addresses[0].default = true;
saveProfile(); renderProfile(); return;
}
if (action === "default") {
const selectedAddress = profile.addresses[index];
if (selectedAddress && selectedAddress.id && decorevaAddressSupabase) {
try {
await setSupabaseDefaultAddress(selectedAddress);
renderProfile();
} catch (error) {
console.error("DECOREVA saved address default error:", error);
alert("Could not change the default address. Please try again.");
}
return;
}
profile.addresses.forEach((a, i) => a.default = i === index);
saveProfile(); renderProfile();
return;
}
}
if (event.target.closest("#decoreva-profile-address-save")) {
event.preventDefault();
const get = id => { const el = document.querySelector(id); return el ? el.value.trim() : ""; };
const address = {
label: get("#decoreva-profile-address-label") || "HOME",
name: get("#decoreva-profile-address-name") || profile.name,
mobile: get("#decoreva-profile-address-mobile") || profile.mobile,
line: get("#decoreva-profile-address-line"),
city: get("#decoreva-profile-address-city"),
state: get("#decoreva-profile-address-state"),
pincode: get("#decoreva-profile-address-pincode"),
default: false
};
const message = document.querySelector("#decoreva-profile-address-message");
if (!address.name || !/^\d{10}$/.test(address.mobile) || !address.line || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
if (message) { message.textContent = "Please fill all details with a valid 10-digit mobile and 6-digit PIN."; message.className = "decoreva-profile-message error"; }
return;
}
const form = document.querySelector("#decoreva-profile-address-form");
const editIndex = form && form.dataset.editIndex !== "" ? Number(form.dataset.editIndex) : -1;
const existingAddress = editIndex >= 0 && profile.addresses[editIndex]
? profile.addresses[editIndex]
: null;
address.default = existingAddress
? !!existingAddress.default
: profile.addresses.length === 0;
if (existingAddress && existingAddress.id) {
address.id = existingAddress.id;
}
const currentUser = await getDecorevaAuthUser();
if (currentUser && decorevaAddressSupabase) {
try {
const saved = await saveSupabaseAddress(address, editIndex);
if (!saved) throw new Error("Supabase address save unavailable.");
hideProfileAddressForm();
renderProfile();
return;
} catch (error) {
console.error("DECOREVA saved address save error:", error);
if (message) {
message.textContent = "Could not save address to your account. Please try again.";
message.className = "decoreva-profile-message error";
}
return;
}
}
if (editIndex >= 0 && profile.addresses[editIndex]) {
profile.addresses[editIndex] = address;
} else {
profile.addresses.push(address);
}
saveProfile();
hideProfileAddressForm();
renderProfile();
return;
}
if (event.target.closest("#decoreva-profile-panel") && event.target.closest(".decoreva-profile-card") === null) {
return;
}
}, true);
const originalAddressMessage = document.querySelector("#decoreva-address-message");
window.setTimeout(function () {
const addressButton = document.querySelector("#decoreva-save-address");
if (addressButton && !addressButton.dataset.profileSync) {
addressButton.dataset.profileSync = "true";
addressButton.addEventListener("click", function () {
window.setTimeout(function () {
if (!deliveryAddress) return;
const exists = profile.addresses.some(function (a) {
return a.line === deliveryAddress.line && a.pincode === deliveryAddress.pincode;
});
if (!exists) {
profile.name = deliveryAddress.name || profile.name;
profile.mobile = deliveryAddress.mobile || profile.mobile;
if (!profile.addresses.length) {
profile.addresses.push({
label: "HOME", name: deliveryAddress.name, mobile: deliveryAddress.mobile,
line: deliveryAddress.line, city: deliveryAddress.city, state: deliveryAddress.state,
pincode: deliveryAddress.pincode, default: true
}, true);
saveProfile();
}
}
}, 0);
}, false);
}
}, 0);
window.addEventListener("storage", function (event) {
if (event.key === CART_KEY) {
try {
const savedCart = JSON.parse(event.newValue || "[]");
cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) { cart = []; }
updateCartCount();
renderCart();
}
if (event.key === WISHLIST_KEY) {
try {
const savedWishlist = JSON.parse(event.newValue || "[]");
wishlist = Array.isArray(savedWishlist) ? savedWishlist : [];
} catch (error) { wishlist = []; }
updateWishlistCount();
renderWishlist();
updateWishlistButtons();
}
});
})();
(function () {
"use strict";
const supabaseClient = window.decorevaSupabase || null;
let ratings = {};
let likes = {};
let reviewerNames = {};
let reviewsLoaded = false;
let reviewsLoadingPromise = null;
let supabaseLikesLoaded = false;
let supabaseLikedKeys = {};
function getCardKey(card) {
if (!card) return "";
if (card.dataset.variationProduct) {
return "variation:" + card.dataset.variationProduct;
}
const title = card.querySelector("h3");
if (title) {
return "product:" + title.textContent.trim().toLowerCase();
}
return "";
}
function getRecord(key) {
if (!ratings[key] || typeof ratings[key] !== "object") {
ratings[key] = { reviews: [] };
}
if (!Array.isArray(ratings[key].reviews)) {
ratings[key].reviews = [];
}
return ratings[key];
}
function getAverage(record) {
if (!record.reviews.length) return 0;
return record.reviews.reduce(function (total, review) {
return total + Number(review.rating || 0);
}, 0) / record.reviews.length;
}
function starText(value) {
const rounded = Math.round(Number(value) || 0);
let output = "";
for (let i = 1; i <= 5; i++) {
output += i <= rounded ? "★" : "☆";
}
return output;
}
async function loadSupabaseReviews() {
if (!supabaseClient) {
console.warn("DECOREVA: Supabase client not available for reviews.");
return;
}
if (reviewsLoaded) return;
if (reviewsLoadingPromise) return reviewsLoadingPromise;
reviewsLoadingPromise = (async function () {
try {
const result = await supabaseClient
.from("product_reviews")
.select("id, product_key, user_id, rating, review_text, created_at")
.order("created_at", { ascending: true });
if (result.error) {
console.error("DECOREVA reviews load error:", result.error);
return;
}
ratings = {};
reviewerNames = {};
const reviewRows = result.data || [];
const reviewerIds = Array.from(new Set(
reviewRows
.map(function (review) { return review && review.user_id; })
.filter(Boolean)
));
if (reviewerIds.length) {
try {
const profilesResult = await supabaseClient
.from("decoreva_reviewer_names")
.select("id, full_name")
.in("id", reviewerIds);
if (profilesResult.error) {
console.warn("DECOREVA reviewer names load warning:", profilesResult.error);
} else {
(profilesResult.data || []).forEach(function (profile) {
if (profile && profile.id && profile.full_name) {
reviewerNames[profile.id] = String(profile.full_name).trim();
}
});
}
} catch (profileError) {
console.warn("DECOREVA reviewer names load exception:", profileError);
}
}
reviewRows.forEach(function (review) {
if (!review || !review.product_key) return;
getRecord(review.product_key).reviews.push({
id: review.id,
user_id: review.user_id,
name: reviewerNames[review.user_id] || "",
rating: Number(review.rating || 0),
text: review.review_text || "",
date: review.created_at || ""
});
});
reviewsLoaded = true;
updateAllRatingRows();
if (typeof mountDecorevaMobileRatingRows === "function") {
mountDecorevaMobileRatingRows();
}
renderAllProductReviewHistory();
} catch (error) {
console.error("DECOREVA reviews load exception:", error);
} finally {
reviewsLoadingPromise = null;
}
})();
return reviewsLoadingPromise;
}
function createRatingRow(card) {
if (!card || card.querySelector(".decoreva-rating-row")) return;
const key = getCardKey(card);
if (!key) return;
const row = document.createElement("div");
row.className = "decoreva-rating-row";
row.dataset.ratingKey = key;
const ratingButton = document.createElement("button");
ratingButton.type = "button";
ratingButton.className = "decoreva-rating-button";
ratingButton.dataset.ratingAction = "review";
ratingButton.setAttribute("aria-label", "Open ratings and reviews");
ratingButton.removeAttribute("title");
ratingButton.setAttribute("data-tooltip", "View ratings and reviews");
const ratingValue = document.createElement("span");
ratingValue.className = "decoreva-rating-value";
const ratingStar = document.createElement("span");
ratingStar.className = "decoreva-rating-small-star";
ratingStar.setAttribute("aria-hidden", "true");
ratingStar.textContent = "★";
const ratingCount = document.createElement("span");
ratingCount.className = "decoreva-rating-count";
ratingButton.appendChild(ratingValue);
ratingButton.appendChild(ratingStar);
ratingButton.appendChild(ratingCount);
row.appendChild(ratingButton);
card.appendChild(row);
updateRatingRow(card);
}
function updateRatingRow(card) {
if (!card) return;
const row = card.querySelector(".decoreva-rating-row");
if (!row) return;
const key = getCardKey(card);
if (!key) return;
const record = getRecord(key);
const average = getAverage(record);
const reviewCount = record.reviews.length;
const ratingButton = row.querySelector(".decoreva-rating-button");
const ratingValue = row.querySelector(".decoreva-rating-value");
const ratingStar = row.querySelector(".decoreva-rating-small-star");
const ratingCount = row.querySelector(".decoreva-rating-count");
function formatCustomerCount(value) {
const number = Number(value || 0);
if (number >= 1000000) {
return (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
}
if (number >= 1000) {
return (number / 1000).toFixed(1).replace(/\.0$/, "") + "k";
}
return String(number);
}
if (ratingValue) {
ratingValue.textContent = average > 0 ? average.toFixed(1) : "0.0";
}
if (ratingStar) {
ratingStar.textContent = "★";
}
if (ratingCount) {
ratingCount.textContent = " | " + formatCustomerCount(reviewCount);
}
if (ratingButton) {
ratingButton.setAttribute(
"aria-label",
reviewCount
? "View " + reviewCount + " ratings and reviews"
: "Write the first review"
);
}
}
function updateAllRatingRows() {
document.querySelectorAll(
"#collection-products .card, .featured-slider .featured-slide"
).forEach(function (card) {
createRatingRow(card);
updateRatingRow(card);
});
}
function renderAllProductReviewHistory() {
const contact = document.querySelector("#contact");
if (!contact) return;
let section = document.querySelector("#decoreva-all-reviews");
if (!section) {
section = document.createElement("section");
section.id = "decoreva-all-reviews";
section.className = "decoreva-all-reviews";
section.setAttribute("aria-label", "Customer Ratings and Reviews");
contact.parentNode.insertBefore(section, contact);
}
const cards = Array.from(document.querySelectorAll(
"#collection-products .card, .featured-slider .featured-slide"
));
const products = new Map();
cards.forEach(function (card) {
const key = getCardKey(card);
const title = card.querySelector("h3");
if (key && title && !products.has(key)) {
products.set(key, {
name: title.textContent.trim(),
card: card
});
}
});
const history = [];
Object.keys(ratings).forEach(function (key) {
const record = ratings[key];
if (!record || !Array.isArray(record.reviews) || !record.reviews.length) return;
const product = products.get(key);
if (!product) return;
const reviews = record.reviews.slice().reverse();
const average = reviews.reduce(function (sum, item) {
return sum + Number(item.rating || 0);
}, 0) / reviews.length;
history.push({
key: key,
name: product.name,
card: product.card,
reviews: reviews,
average: average
});
});
history.sort(function (a, b) {
return cards.indexOf(a.card) - cards.indexOf(b.card);
});
const totalReviews = history.reduce(function (sum, item) {
return sum + item.reviews.length;
}, 0);
section.replaceChildren();
const heading = document.createElement("div");
heading.className = "decoreva-all-reviews-heading";
heading.innerHTML =
'<span class="decoreva-all-reviews-eyebrow">CUSTOMER EXPERIENCE</span>' +
'<h2>Customer Ratings & Reviews</h2>' +
'<p>Real ratings and review history from DECOREVA customers.</p>';
section.appendChild(heading);
if (!history.length) {
const empty = document.createElement("div");
empty.className = "decoreva-all-reviews-empty";
empty.innerHTML =
'<span class="decoreva-all-reviews-empty-icon">★</span>' +
'<strong>No customer reviews yet</strong>' +
'<p>Be the first to share your experience with a DECOREVA product.</p>';
section.appendChild(empty);
return;
}
const summary = document.createElement("div");
summary.className = "decoreva-all-reviews-summary";
summary.dataset.allReviewsToggle = "true";
summary.setAttribute("role", "button");
summary.setAttribute("tabindex", "0");
summary.setAttribute("aria-expanded", "false");
summary.setAttribute(
"aria-label",
"Open Customer Ratings and Reviews"
);
const summaryNumber = document.createElement("strong");
summaryNumber.textContent = String(totalReviews);
const summaryLabel = document.createElement("span");
summaryLabel.textContent = totalReviews === 1
? "Customer Review"
: "Customer Reviews";
const summaryProducts = document.createElement("em");
summaryProducts.textContent = history.length === 1
? "1 product reviewed"
: history.length + " products reviewed";
summary.appendChild(summaryNumber);
summary.appendChild(summaryLabel);
summary.appendChild(summaryProducts);
const summaryToggle = document.createElement("span");
summaryToggle.className = "decoreva-all-reviews-toggle-icon";
summaryToggle.setAttribute("aria-hidden", "true");
summary.appendChild(summaryToggle);
section.appendChild(summary);
const list = document.createElement("div");
list.className = "decoreva-all-reviews-list";
history.forEach(function (product) {
const box = document.createElement("article");
box.className = "decoreva-all-review-product";
const head = document.createElement("div");
head.className = "decoreva-all-review-product-head";
const info = document.createElement("div");
info.className = "decoreva-all-review-product-info";
const name = document.createElement("h3");
name.textContent = product.name;
const ratingLine = document.createElement("div");
ratingLine.className = "decoreva-all-review-rating-line";
const stars = document.createElement("span");
stars.className = "decoreva-all-review-stars";
stars.textContent = starText(product.average);
const average = document.createElement("strong");
average.textContent = product.average.toFixed(1) + " / 5";
const count = document.createElement("span");
count.className = "decoreva-all-review-count";
count.textContent = product.reviews.length +
(product.reviews.length === 1 ? " review" : " reviews");
ratingLine.appendChild(stars);
ratingLine.appendChild(average);
ratingLine.appendChild(count);
info.appendChild(name);
info.appendChild(ratingLine);
const view = document.createElement("button");
view.type = "button";
view.className = "decoreva-all-review-view";
view.textContent = "VIEW PRODUCT REVIEWS";
view.dataset.allReviewKey = product.key;
head.appendChild(info);
head.appendChild(view);
box.appendChild(head);
const entries = document.createElement("div");
entries.className = "decoreva-all-review-history";
product.reviews.forEach(function (review) {
const item = document.createElement("div");
item.className = "decoreva-all-review-entry";
const top = document.createElement("div");
top.className = "decoreva-all-review-entry-top";
const customer = document.createElement("strong");
customer.textContent =
review.name ||
reviewerNames[review.user_id] ||
"Customer";
const reviewStars = document.createElement("span");
reviewStars.textContent = starText(review.rating);
top.appendChild(customer);
top.appendChild(reviewStars);
const body = document.createElement("p");
body.textContent = review.text ||
"Customer left a rating without written feedback.";
const date = document.createElement("time");
date.className = "decoreva-all-review-date";
if (review.date) {
const parsed = new Date(review.date);
if (!Number.isNaN(parsed.getTime())) {
date.textContent = parsed.toLocaleDateString("en-IN", {
day: "numeric",
month: "short",
year: "numeric"
});
}
}
item.appendChild(top);
item.appendChild(body);
if (date.textContent) item.appendChild(date);
entries.appendChild(item);
});
box.appendChild(entries);
list.appendChild(box);
});
section.appendChild(list);
const bottomCloseWrap = document.createElement("div");
bottomCloseWrap.className = "decoreva-all-reviews-close-wrap";
const closeButton = document.createElement("button");
closeButton.type = "button";
closeButton.className = "decoreva-all-reviews-close decoreva-all-reviews-close-bottom";
closeButton.dataset.allReviewsClose = "true";
closeButton.innerHTML = '<span aria-hidden="true">×</span> CLOSE REVIEWS';
closeButton.setAttribute("aria-label", "Close Customer Ratings and Reviews");
bottomCloseWrap.appendChild(closeButton);
section.appendChild(bottomCloseWrap);
}
document.addEventListener("click", function (event) {
const closeButton = event.target.closest("[data-all-reviews-close]");
if (closeButton) {
const section = closeButton.closest("#decoreva-all-reviews");
if (!section) return;
section.classList.remove("is-open");
const toggle = section.querySelector("[data-all-reviews-toggle]");
if (toggle) {
toggle.setAttribute("aria-expanded", "false");
toggle.setAttribute("aria-label", "Open Customer Ratings and Reviews");
}
section.scrollIntoView({ behavior: "smooth", block: "start" });
return;
}
const toggle = event.target.closest("[data-all-reviews-toggle]");
if (toggle) {
const section = toggle.closest("#decoreva-all-reviews");
if (!section) return;
const isOpen = section.classList.toggle("is-open");
toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
toggle.setAttribute(
"aria-label",
isOpen
? "Close Customer Ratings and Reviews"
: "Open Customer Ratings and Reviews"
);
return;
}
const button = event.target.closest("[data-all-review-key]");
if (!button) return;
const key = button.dataset.allReviewKey;
let card = null;
document.querySelectorAll(
"#collection-products .card, .featured-slider .featured-slide"
).forEach(function (candidate) {
if (!card && getCardKey(candidate) === key) card = candidate;
});
if (card) openReviewModal(card);
}, true);
document.addEventListener("keydown", function (event) {
const toggle = event.target.closest("[data-all-reviews-toggle]");
if (!toggle || (event.key !== "Enter" && event.key !== " ")) return;
event.preventDefault();
const section = toggle.closest("#decoreva-all-reviews");
if (!section) return;
const isOpen = section.classList.toggle("is-open");
toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
toggle.setAttribute(
"aria-label",
isOpen
? "Close Customer Ratings and Reviews"
: "Open Customer Ratings and Reviews"
);
}, true);
if (!document.querySelector("#decoreva-all-reviews-styles")) {
const style = document.createElement("style");
style.id = "decoreva-all-reviews-styles";
style.textContent = `
#decoreva-all-reviews{
width:100%;
box-sizing:border-box;
padding:34px clamp(18px,5vw,70px) 38px;
background:linear-gradient(180deg,#fffaf0,#f8edd9);
border-top:1px solid rgba(184,134,44,.12);
}
#decoreva-all-reviews .decoreva-all-reviews-heading{
max-width:900px;
margin:0 auto 14px;
text-align:center;
}
#decoreva-all-reviews .decoreva-all-reviews-eyebrow{
color:#b77a13;
font-size:10px;
font-weight:900;
letter-spacing:1.5px;
}
#decoreva-all-reviews h2{
margin:6px 0 0;
color:#24160c;
font-family:Georgia,"Times New Roman",serif;
font-size:clamp(25px,3.2vw,38px);
line-height:1.12;
}
#decoreva-all-reviews h2::after{
content:"";
display:block;
width:82px;
height:3px;
margin:13px auto 14px;
border-radius:999px;
background:linear-gradient(90deg,transparent,#c9962f,transparent);
}
#decoreva-all-reviews .decoreva-all-reviews-heading p{
margin:0;
color:#756758;
font-size:14px;
}
#decoreva-all-reviews .decoreva-all-reviews-summary{
max-width:1120px;
margin:0 auto;
padding:13px 18px;
display:flex;
align-items:center;
gap:8px;
border:1px solid rgba(184,134,44,.24);
border-radius:12px;
background:rgba(255,255,255,.78);
box-shadow:0 7px 22px rgba(67,45,19,.06);
}
#decoreva-all-reviews .decoreva-all-reviews-summary strong{
color:#a96f12;
font-size:23px;
}
#decoreva-all-reviews .decoreva-all-reviews-summary span{
color:#4b3521;
font-size:14px;
font-weight:800;
}
#decoreva-all-reviews .decoreva-all-reviews-summary em{
margin-left:auto;
color:#756758;
font-size:12px;
font-style:normal;
font-weight:700;
}
#decoreva-all-reviews .decoreva-all-reviews-summary{
cursor:pointer;
user-select:none;
}
#decoreva-all-reviews .decoreva-all-reviews-summary:hover{
background:#fffaf0;
}
#decoreva-all-reviews .decoreva-all-reviews-toggle-icon{
flex:0 0 9px;
width:9px;
height:9px;
margin-left:8px;
margin-right:2px;
display:block;
box-sizing:border-box;
border-right:2px solid #a96f12;
border-bottom:2px solid #a96f12;
transform:rotate(45deg) translate(-1px,-1px);
transform-origin:center;
transition:transform .2s ease;
}
#decoreva-all-reviews.is-open .decoreva-all-reviews-toggle-icon{
transform:rotate(225deg) translate(-1px,-1px);
}
#decoreva-all-reviews .decoreva-all-reviews-list{
max-width:1120px;
margin:16px auto 0;
display:none;
flex-direction:column;
gap:16px;
}
#decoreva-all-reviews.is-open .decoreva-all-reviews-list{
display:flex;
}
#decoreva-all-reviews .decoreva-all-reviews-close{
display:none;
padding:10px 18px;
border:1px solid #b87812;
border-radius:999px;
background:rgba(255,255,255,.92);
color:#8b590d;
font-size:11px;
font-weight:800;
letter-spacing:.5px;
cursor:pointer;
box-shadow:0 5px 14px rgba(67,45,19,.08);
transition:all .2s ease;
}
#decoreva-all-reviews .decoreva-all-reviews-close-top{
width:max-content;
margin:16px auto 0;
}
#decoreva-all-reviews .decoreva-all-reviews-close-wrap{
display:none;
max-width:1120px;
margin:20px auto 0;
}
#decoreva-all-reviews .decoreva-all-reviews-close-bottom{
margin:0;
}
#decoreva-all-reviews .decoreva-all-reviews-close span{
display:inline-flex;
align-items:center;
justify-content:center;
width:17px;
height:17px;
margin-right:6px;
border:1px solid currentColor;
border-radius:50%;
font-size:14px;
line-height:1;
}
#decoreva-all-reviews.is-open .decoreva-all-reviews-close{
display:inline-flex;
align-items:center;
justify-content:center;
}
#decoreva-all-reviews.is-open .decoreva-all-reviews-close-wrap{
display:block;
}
#decoreva-all-reviews .decoreva-all-reviews-close:hover{
background:#b87812;
color:#fff;
transform:translateY(-1px);
}
#decoreva-all-reviews .decoreva-all-review-product{
overflow:hidden;
border:1px solid rgba(184,134,44,.25);
border-radius:14px;
background:rgba(255,255,255,.88);
box-shadow:0 8px 24px rgba(67,45,19,.07);
}
#decoreva-all-reviews .decoreva-all-review-product-head{
display:flex;
align-items:center;
justify-content:space-between;
gap:18px;
padding:18px 20px;
background:linear-gradient(135deg,#fffdf8,#fff8ea);
border-bottom:1px solid rgba(184,134,44,.16);
}
#decoreva-all-reviews .decoreva-all-review-product-info{
min-width:0;
}
#decoreva-all-reviews .decoreva-all-review-product-info h3{
margin:0 0 7px;
color:#2c1b0e;
font-family:Georgia,"Times New Roman",serif;
font-size:20px;
}
#decoreva-all-reviews .decoreva-all-review-rating-line{
display:flex;
align-items:center;
flex-wrap:wrap;
gap:7px;
}
#decoreva-all-reviews .decoreva-all-review-stars,
#decoreva-all-reviews .decoreva-all-review-entry-top span{
color:#c48a19;
letter-spacing:1px;
font-size:16px;
}
#decoreva-all-reviews .decoreva-all-review-rating-line strong{
color:#a96f12;
font-size:13px;
}
#decoreva-all-reviews .decoreva-all-review-count{
color:#756758;
font-size:11px;
}
#decoreva-all-reviews .decoreva-all-review-view{
flex:0 0 auto;
min-height:34px;
padding:0 12px;
border:1px solid #b77a13;
border-radius:8px;
background:#fffdf8;
color:#8c6425;
font-size:9px;
font-weight:900;
cursor:pointer;
}
#decoreva-all-reviews .decoreva-all-review-view:hover{
background:#fff3d8;
}
#decoreva-all-reviews .decoreva-all-review-history{
padding:0 20px;
}
#decoreva-all-reviews .decoreva-all-review-entry{
padding:17px 0;
border-bottom:1px solid rgba(117,103,88,.13);
}
#decoreva-all-reviews .decoreva-all-review-entry:last-child{
border-bottom:0;
}
#decoreva-all-reviews .decoreva-all-review-entry-top{
display:flex;
align-items:center;
gap:12px;
margin-bottom:6px;
}
#decoreva-all-reviews .decoreva-all-review-entry-top strong{
color:#4b3521;
font-size:13px;
}
#decoreva-all-reviews .decoreva-all-review-entry p{
margin:0;
color:#4e4339;
font-size:14px;
line-height:1.6;
}
#decoreva-all-reviews .decoreva-all-review-date{
display:block;
margin-top:6px;
color:#978777;
font-size:9px;
}
#decoreva-all-reviews .decoreva-all-reviews-empty{
max-width:600px;
margin:0 auto;
padding:34px 22px;
border:1px solid rgba(184,134,44,.24);
border-radius:14px;
background:rgba(255,255,255,.75);
text-align:center;
}
#decoreva-all-reviews .decoreva-all-reviews-empty-icon{
display:flex;
align-items:center;
justify-content:center;
width:42px;
height:42px;
margin:0 auto 10px;
border-radius:50%;
background:#f3e4c7;
color:#b77a13;
}
#decoreva-all-reviews .decoreva-all-reviews-empty strong{
display:block;
color:#4b3521;
font-size:14px;
}
#decoreva-all-reviews .decoreva-all-reviews-empty p{
margin:6px 0 0;
color:#756758;
font-size:11px;
}
@media (max-width:650px){
#decoreva-all-reviews{
padding:28px 14px 34px;
}
#decoreva-all-reviews .decoreva-all-reviews-summary{
flex-wrap:nowrap;
align-items:center;
}
#decoreva-all-reviews .decoreva-all-reviews-summary em{
width:auto;
margin-left:auto;
white-space:nowrap;
}
#decoreva-all-reviews .decoreva-all-reviews-toggle-icon{
flex:0 0 9px;
width:9px;
height:9px;
margin-left:8px;
margin-right:1px;
}
#decoreva-all-reviews .decoreva-all-review-product-head{
align-items:flex-start;
flex-direction:column;
padding:15px;
}
#decoreva-all-reviews .decoreva-all-review-view{
width:100%;
}
#decoreva-all-reviews .decoreva-all-review-history{
padding:0 15px;
}
}
`;
document.head.appendChild(style);
}
renderAllProductReviewHistory();
if (!document.getElementById("decoreva-compact-rating-style")) {
const style = document.createElement("style");
style.id = "decoreva-compact-rating-style";
style.textContent = `
.decoreva-rating-row{
display:flex !important;
align-items:center !important;
justify-content:flex-start !important;
gap:0 !important;
width:100% !important;
margin:0 !important;
padding:0 !important;
border:0 !important;
background:transparent !important;
}
.decoreva-rating-button{
display:inline-flex !important;
align-items:center !important;
justify-content:center !important;
gap:4px !important;
width:auto !important;
min-width:0 !important;
height:21px !important;
min-height:21px !important;
padding:2px 7px !important;
margin:0 !important;
border:1px solid rgba(255,230,164,.72) !important;
border-radius:5px !important;
background:linear-gradient(135deg,#8E5B12 0%,#B98220 48%,#D5A33F 100%) !important;
color:#FFF8E8 !important;
box-shadow:0 3px 8px rgba(61,35,8,.28),inset 0 1px 0 rgba(255,255,255,.22) !important;
font:700 10px/1 Arial,sans-serif !important;
cursor:pointer !important;
white-space:nowrap !important;
}
.decoreva-rating-button:hover{
background:linear-gradient(135deg,#A96D12 0%,#D1A03B 100%) !important;
}
.decoreva-rating-value{
font-weight:700 !important;
}
.decoreva-rating-small-star{
font-size:9px !important;
line-height:1 !important;
color:#FFF4D6 !important;
}
.decoreva-rating-count{
font-weight:600 !important;
color:#FFF8E8 !important;
}
.decoreva-like-button{
display:none !important;
}
`;
document.head.appendChild(style);
}
if (!document.getElementById("decoreva-rating-top-center-style")) {
const style = document.createElement("style");
style.id = "decoreva-rating-top-center-style";
style.textContent = `
.decoreva-rating-row{
top:0 !important;
left:50% !important;
transform:translateX(-50%) !important;
width:max-content !important;
max-width:calc(100% - 20px) !important;
min-width:0 !important;
height:21px !important;
min-height:21px !important;
padding:0 !important;
margin:0 !important;
display:flex !important;
align-items:center !important;
justify-content:center !important;
z-index:60 !important;
}
.decoreva-rating-row .decoreva-rating-button{
margin:0 !important;
}
`;
document.head.appendChild(style);
}
if (!document.getElementById("decoreva-mobile-rating-fix-style")) {
const style = document.createElement("style");
style.id = "decoreva-mobile-rating-fix-style";
style.textContent = `
@media (max-width:760px){
#collection-products .card{
position:relative !important;
}
/* The rating row is mounted inside .image-slider
so it shares the same visual layer as the image
and cannot disappear behind the slider. */
#collection-products .card .image-slider > .decoreva-rating-row,
.featured-slider .featured-slide .featured-image-box > .decoreva-rating-row{
position:absolute !important;
top:0 !important;
left:50% !important;
right:auto !important;
bottom:auto !important;
transform:translateX(-50%) !important;
width:max-content !important;
max-width:calc(100% - 12px) !important;
height:21px !important;
min-height:21px !important;
margin:0 !important;
padding:0 !important;
display:flex !important;
align-items:center !important;
justify-content:center !important;
z-index:2147483000 !important;
pointer-events:auto !important;
visibility:visible !important;
opacity:1 !important;
}
#collection-products .card .image-slider > .decoreva-rating-row .decoreva-rating-button,
.featured-slider .featured-slide .featured-image-box > .decoreva-rating-row .decoreva-rating-button{
position:relative !important;
z-index:2147483001 !important;
pointer-events:auto !important;
touch-action:manipulation !important;
-webkit-tap-highlight-color:transparent !important;
}
/* Keep both mobile image layers as the containing block. */
#collection-products .card .image-slider,
.featured-slider .featured-slide .featured-image-box{
position:relative !important;
}
}
`;
document.head.appendChild(style);
}
function mountDecorevaMobileRatingRows() {
if (window.innerWidth > 760) return;
document.querySelectorAll(
"#collection-products .card, .featured-slider .featured-slide"
).forEach(function (card) {
const row = card.querySelector(":scope > .decoreva-rating-row");
if (!row) return;
const imageLayer =
card.querySelector(".image-slider") ||
card.querySelector(".featured-image-box");
if (!imageLayer) return;
if (row.parentElement !== imageLayer) {
imageLayer.appendChild(row);
}
});
}
let decorevaMobileRatingTouchTimer = 0;
function handleDecorevaMobileRatingTouch(button) {
if (!button) return;
window.clearTimeout(decorevaMobileRatingTouchTimer);
showDecorevaRatingTooltip(button);
decorevaMobileRatingTouchTimer = window.setTimeout(function () {
hideDecorevaRatingTooltip(button);
}, 900);
}
document.addEventListener("pointerdown", function (event) {
if (window.innerWidth > 760 || event.pointerType !== "touch") return;
const button = event.target.closest(
".card .decoreva-rating-button, .featured-slide .decoreva-rating-button"
);
if (!button) return;
handleDecorevaMobileRatingTouch(button);
}, { passive:true, capture:true });
document.addEventListener("touchstart", function (event) {
if (window.innerWidth > 760) return;
const button = event.target.closest(
".card .decoreva-rating-button, .featured-slide .decoreva-rating-button"
);
if (!button) return;
handleDecorevaMobileRatingTouch(button);
}, { passive:true, capture:true });
function initializeRatingRows() {
updateAllRatingRows();
mountDecorevaMobileRatingRows();
loadSupabaseReviews();
loadSupabaseLikes(false);
requestAnimationFrame(function () {
mountDecorevaMobileRatingRows();
});
}
async function getCurrentUser() {
if (!supabaseClient || !supabaseClient.auth) return null;
try {
const result = await supabaseClient.auth.getUser();
return result && result.data ? result.data.user : null;
} catch (error) {
console.error("DECOREVA auth check error:", error);
return null;
}
}
async function loadSupabaseLikes(force) {
if (!supabaseClient) return false;
if (supabaseLikesLoaded && !force) return true;
try {
const result = await supabaseClient
.from("product_likes")
.select("product_key, user_id");
if (result.error) {
console.error("DECOREVA likes load error:", result.error);
return false;
}
const counts = {};
const likedKeys = {};
const user = await getCurrentUser();
(result.data || []).forEach(function (like) {
if (!like || !like.product_key) return;
counts[like.product_key] = Number(counts[like.product_key] || 0) + 1;
if (user && like.user_id === user.id) {
likedKeys[like.product_key] = true;
}
});
likes = counts;
supabaseLikedKeys = likedKeys;
supabaseLikesLoaded = !!user;
updateAllRatingRows();
return true;
} catch (error) {
console.error("DECOREVA likes load exception:", error);
return false;
}
}
async function openReviewModal(card) {
const key = getCardKey(card);
if (!key) return;
await loadSupabaseReviews();
const title = card.querySelector("h3");
const productName = title
? title.textContent.trim()
: "DECOREVA Product";
const record = getRecord(key);
let modal = document.querySelector("#decoreva-review-modal");
if (!modal) {
modal = document.createElement("div");
modal.id = "decoreva-review-modal";
modal.className = "decoreva-review-modal";
modal.setAttribute("aria-hidden", "true");
modal.innerHTML =
'<div class="decoreva-review-overlay" data-review-close></div>' +
'<div class="decoreva-review-card" role="dialog" aria-modal="true" aria-label="Ratings and Reviews">' +
'<div class="decoreva-review-head">' +
'<div>' +
'<strong>Ratings & Reviews</strong>' +
'<span class="decoreva-review-product"></span>' +
'</div>' +
'<button type="button" class="decoreva-review-close" data-review-close aria-label="Close">×</button>' +
'</div>' +
'<div class="decoreva-review-summary"></div>' +
'<div class="decoreva-review-list"></div>' +
'<form class="decoreva-review-form">' +
'<strong>Write a Review</strong>' +
'<div class="decoreva-review-stars-input" aria-label="Choose rating"></div>' +
'<input class="decoreva-review-name" type="text" maxlength="40" placeholder="Your name" required>' +
'<textarea class="decoreva-review-text" maxlength="500" placeholder="Write your review" required></textarea>' +
'<button type="submit" class="decoreva-review-submit">Submit Review</button>' +
'</form>' +
'</div>';
document.body.appendChild(modal);
}
modal.dataset.ratingKey = key;
modal.dataset.ratingCardKey = key;
modal.querySelector(".decoreva-review-product").textContent = productName;
const average = getAverage(record);
const count = record.reviews.length;
modal.querySelector(".decoreva-review-summary").textContent =
count
? starText(average) + "  " + average.toFixed(1) + " · " +
count + " review" + (count === 1 ? "" : "s")
: "No reviews yet — be the first to review this product.";
const user = await getCurrentUser();
const list = modal.querySelector(".decoreva-review-list");
list.replaceChildren();
if (!count) {
const empty = document.createElement("div");
empty.className = "decoreva-review-empty";
empty.textContent = "No reviews yet.";
list.appendChild(empty);
} else {
record.reviews.slice().reverse().forEach(function (review) {
const item = document.createElement("div");
item.className = "decoreva-review-item";
const top = document.createElement("div");
top.className = "decoreva-review-item-top";
const name = document.createElement("strong");
name.textContent = "Customer";
const stars = document.createElement("span");
stars.textContent = starText(review.rating);
const text = document.createElement("p");
text.textContent = review.text || "";
top.appendChild(name);
top.appendChild(stars);
if (user && review.user_id === user.id) {
const actions = document.createElement("div");
actions.className = "decoreva-review-actions";
const editButton = document.createElement("button");
editButton.type = "button";
editButton.className = "decoreva-review-edit";
editButton.textContent = "Edit";
editButton.setAttribute("aria-label", "Edit your review");
const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "decoreva-review-delete";
deleteButton.textContent = "×";
deleteButton.setAttribute("aria-label", "Delete your review");
deleteButton.title = "Delete review";
actions.appendChild(editButton);
actions.appendChild(deleteButton);
top.appendChild(actions);
editButton.addEventListener("click", function () {
nameInput.value = String(user.user_metadata?.full_name || user.email || nameInput.value || "");
textInput.value = review.text || "";
editingReviewId = review.id;
selectedRating = Number(review.rating || 0);
starsInput.querySelectorAll("button").forEach(function (button, index) {
button.classList.toggle("active", index < selectedRating);
});
submitButton.textContent = "Update Review";
textInput.focus();
});
deleteButton.addEventListener("click", async function () {
if (!window.confirm("Delete your review? This cannot be undone.")) {
return;
}
deleteButton.disabled = true;
editButton.disabled = true;
try {
const result = await supabaseClient
.from("product_reviews")
.delete()
.eq("id", review.id)
.eq("user_id", user.id);
if (result.error) {
console.error("DECOREVA review delete error:", result.error);
window.decorevaShowReviewToast("Could not delete your review. Please try again");
return;
}
record.reviews = record.reviews.filter(function (itemReview) {
return itemReview.id !== review.id;
});
reviewsLoaded = true;
updateAllRatingRows();
await openReviewModal(card);
window.decorevaShowReviewToast("Your review was deleted successfully");
} catch (error) {
console.error("DECOREVA review delete exception:", error);
window.decorevaShowReviewToast("Could not delete your review. Please try again");
} finally {
deleteButton.disabled = false;
editButton.disabled = false;
}
});
}
item.appendChild(top);
item.appendChild(text);
list.appendChild(item);
});
}
const form = modal.querySelector(".decoreva-review-form");
const nameInput = form.querySelector(".decoreva-review-name");
const textInput = form.querySelector(".decoreva-review-text");
const submitButton = form.querySelector(".decoreva-review-submit");
if (!user) {
nameInput.value = "";
nameInput.disabled = true;
textInput.value = "";
textInput.disabled = true;
submitButton.disabled = false;
submitButton.textContent = "Login to Review";
submitButton.type = "button";
submitButton.onclick = function (event) {
event.preventDefault();
event.stopPropagation();
if (window.decorevaSupabaseAuth &&
typeof window.decorevaSupabaseAuth.open === "function") {
window.decorevaSupabaseAuth.open();
} else {
console.error("DECOREVA Auth: login modal is not available.");
}
};
} else {
nameInput.disabled = false;
textInput.disabled = false;
submitButton.disabled = false;
submitButton.type = "submit";
submitButton.onclick = null;
submitButton.textContent = "Submit Review";
try {
const metadata = user.user_metadata || {};
nameInput.value = String(metadata.full_name || "");
} catch (error) {
nameInput.value = "";
}
}
const starsInput = modal.querySelector(".decoreva-review-stars-input");
starsInput.replaceChildren();
let selectedRating = 0;
let editingReviewId = null;
for (let i = 1; i <= 5; i++) {
const button = document.createElement("button");
button.type = "button";
button.className = "decoreva-review-star-choice";
button.textContent = "★";
button.dataset.value = String(i);
button.setAttribute("aria-label", i + " star");
button.disabled = !user;
button.addEventListener("click", function () {
selectedRating = i;
starsInput.querySelectorAll("button").forEach(function (item, index) {
item.classList.toggle("active", index < selectedRating);
});
});
starsInput.appendChild(button);
}
form.onsubmit = async function (event) {
event.preventDefault();
const currentUser = await getCurrentUser();
if (!currentUser) {
const modalCardKey = modal.dataset.ratingCardKey;
let modalRow = null;
document.querySelectorAll(".decoreva-rating-row").forEach(function (item) {
if (!modalRow && item.dataset.ratingKey === modalCardKey) modalRow = item;
});
if (window.decorevaSupabaseAuth &&
typeof window.decorevaSupabaseAuth.open === "function") {
window.decorevaSupabaseAuth.open();
}
showRatingToast(modalRow, "Please login first to rate or review this product");
return;
}
const name = nameInput.value.trim();
const text = textInput.value.trim();
if (!selectedRating) {
window.decorevaShowReviewToast("Please select a star rating");
return;
}
if (!name || !text) {
window.decorevaShowReviewToast("Please enter your name and review");
return;
}
if (!supabaseClient) {
window.decorevaShowReviewToast("Review service is temporarily unavailable");
return;
}
submitButton.disabled = true;
submitButton.textContent = editingReviewId ? "Updating..." : "Submitting...";
const wasEditingReview = !!editingReviewId;
try {
let result;
if (editingReviewId) {
result = await supabaseClient
.from("product_reviews")
.update({
rating: selectedRating,
review_text: text
})
.eq("id", editingReviewId)
.eq("user_id", currentUser.id)
.select("id, product_key, user_id, rating, review_text, created_at")
.single();
if (result.error) {
console.error("DECOREVA review update error:", result.error);
window.decorevaShowReviewToast("Could not update your review. Please try again");
return;
}
const updatedReview = result.data;
const localReviews = getRecord(key).reviews;
const localIndex = localReviews.findIndex(function (itemReview) {
return itemReview.id === editingReviewId;
});
if (localIndex >= 0) {
localReviews[localIndex] = {
id: updatedReview.id,
user_id: updatedReview.user_id,
rating: Number(updatedReview.rating || 0),
text: updatedReview.review_text || "",
date: updatedReview.created_at || ""
};
}
editingReviewId = null;
} else {
result = await supabaseClient
.from("product_reviews")
.insert({
product_key: key,
user_id: currentUser.id,
rating: selectedRating,
review_text: text
})
.select("id, product_key, user_id, rating, review_text, created_at")
.single();
if (result.error) {
console.error("DECOREVA review insert error:", result.error);
window.decorevaShowReviewToast("Could not submit your review. Please try again");
return;
}
const newReview = result.data;
getRecord(key).reviews.push({
id: newReview.id,
user_id: newReview.user_id,
rating: Number(newReview.rating || 0),
text: newReview.review_text || "",
date: newReview.created_at || ""
});
}
reviewsLoaded = true;
updateAllRatingRows();
nameInput.value = String(currentUser.user_metadata?.full_name || name);
textInput.value = "";
selectedRating = 0;
starsInput.querySelectorAll("button").forEach(function (item) {
item.classList.remove("active");
});
await openReviewModal(card);
window.decorevaShowReviewToast(
wasEditingReview
? "Your review was updated successfully"
: "Review submitted successfully"
);
} catch (error) {
console.error("DECOREVA review save exception:", error);
window.decorevaShowReviewToast(editingReviewId
? "Could not update your review. Please try again"
: "Could not submit your review. Please try again");
} finally {
submitButton.disabled = false;
submitButton.textContent = "Submit Review";
}
};
modal.classList.add("open");
modal.setAttribute("aria-hidden", "false");
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";
}
let decorevaReviewAuthChangeRunning = false;
window.decorevaReviewAuthChanged = async function () {
if (decorevaReviewAuthChangeRunning) return;
decorevaReviewAuthChangeRunning = true;
try {
supabaseLikesLoaded = false;
supabaseLikedKeys = {};
if (supabaseClient) {
await loadSupabaseLikes(true);
} else {
updateAllRatingRows();
}
if (!supabaseLikesLoaded) {
updateAllRatingRows();
}
const modal = document.querySelector("#decoreva-review-modal");
if (!modal || !modal.classList.contains("open")) {
updateAllRatingRows();
return;
}
const key = modal.dataset.ratingKey;
if (!key) {
updateAllRatingRows();
return;
}
let targetCard = null;
document.querySelectorAll(
"#collection-products .card, .featured-slider .featured-slide"
).forEach(function (candidate) {
if (!targetCard && getCardKey(candidate) === key) {
targetCard = candidate;
}
});
if (targetCard) {
await openReviewModal(targetCard);
} else {
updateAllRatingRows();
}
} catch (error) {
console.error("DECOREVA review auth refresh error:", error);
updateAllRatingRows();
} finally {
decorevaReviewAuthChangeRunning = false;
}
};
function closeReviewModal() {
const modal = document.querySelector("#decoreva-review-modal");
if (!modal) return;
modal.classList.remove("open");
modal.setAttribute("aria-hidden", "true");
if (!document.body.classList.contains("decoreva-cart-open")) {
document.documentElement.style.overflow = "";
document.body.style.overflow = "";
}
}
if (!document.getElementById("decoreva-rating-tooltip-style")) {
const style = document.createElement("style");
style.id = "decoreva-rating-tooltip-style";
style.textContent = `
.decoreva-rating-floating-tooltip{
position:fixed !important;
left:0; top:0;
z-index:2147483647 !important;
max-width:calc(100vw - 16px);
padding:8px 12px !important;
border:1px solid rgba(255,220,145,.55) !important;
border-radius:8px !important;
background:linear-gradient(135deg,#2a1a0e 0%,#4b2d12 100%) !important;
color:#fff8e8 !important;
box-shadow:0 8px 24px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08) !important;
font:600 12px/1.25 Arial,sans-serif !important;
text-align:center !important;
white-space:nowrap !important;
pointer-events:none !important;
opacity:0 !important;
visibility:hidden !important;
transform:translate(-50%,var(--tooltip-y,-100%)) scale(.96) !important;
transition:opacity .16s ease,transform .16s ease,visibility .16s ease !important;
}
.decoreva-rating-floating-tooltip.show{
opacity:1 !important; visibility:visible !important;
transform:translate(-50%,var(--tooltip-y,-100%)) scale(1) !important;
}
@media (max-width:760px){
.decoreva-rating-floating-tooltip{font-size:11px !important;padding:8px 11px !important;}
}
`;
document.head.appendChild(style);
}
let decorevaRatingTooltip = null;
let decorevaRatingTooltipButton = null;
function ensureDecorevaRatingTooltip() {
if (decorevaRatingTooltip && document.body.contains(decorevaRatingTooltip)) {
return decorevaRatingTooltip;
}
decorevaRatingTooltip = document.createElement("div");
decorevaRatingTooltip.className = "decoreva-rating-floating-tooltip";
decorevaRatingTooltip.textContent = "View ratings and reviews";
decorevaRatingTooltip.setAttribute("role", "tooltip");
decorevaRatingTooltip.setAttribute("aria-hidden", "true");
document.body.appendChild(decorevaRatingTooltip);
return decorevaRatingTooltip;
}
function positionDecorevaRatingTooltip() {
if (!decorevaRatingTooltip || !decorevaRatingTooltip.classList.contains("show") || !decorevaRatingTooltipButton) return;
const rect = decorevaRatingTooltipButton.getBoundingClientRect();
const tooltipRect = decorevaRatingTooltip.getBoundingClientRect();
const gap = 9;
const viewportPadding = 8;
let left = rect.left + (rect.width / 2);
let top = rect.top - gap;
let transformY = "-100%";
if (top - tooltipRect.height < viewportPadding) {
top = rect.bottom + gap;
transformY = "0";
}
const halfWidth = tooltipRect.width / 2;
left = Math.max(halfWidth + viewportPadding, Math.min(
window.innerWidth - halfWidth - viewportPadding,
left
));
decorevaRatingTooltip.style.left = left + "px";
decorevaRatingTooltip.style.top = top + "px";
decorevaRatingTooltip.style.setProperty("--tooltip-y", transformY);
}
function showDecorevaRatingTooltip(button) {
if (!button) return;
decorevaRatingTooltipButton = button;
const tooltip = ensureDecorevaRatingTooltip();
tooltip.classList.add("show");
tooltip.setAttribute("aria-hidden", "false");
positionDecorevaRatingTooltip();
}
function hideDecorevaRatingTooltip(button) {
if (button && decorevaRatingTooltipButton && button !== decorevaRatingTooltipButton) return;
if (!decorevaRatingTooltip) return;
decorevaRatingTooltip.classList.remove("show");
decorevaRatingTooltip.setAttribute("aria-hidden", "true");
decorevaRatingTooltipButton = null;
}
document.addEventListener("pointerover", function (event) {
if (window.innerWidth <= 760 && event.pointerType === "touch") return;
const button = event.target.closest(".decoreva-rating-button");
if (!button) return;
if (event.relatedTarget && button.contains(event.relatedTarget)) return;
showDecorevaRatingTooltip(button);
}, true);
document.addEventListener("pointerout", function (event) {
if (window.innerWidth <= 760 && event.pointerType === "touch") return;
const button = event.target.closest(".decoreva-rating-button");
if (!button) return;
if (event.relatedTarget && button.contains(event.relatedTarget)) return;
hideDecorevaRatingTooltip(button);
}, true);
document.addEventListener("focusin", function (event) {
if (window.innerWidth <= 760) return;
const button = event.target.closest(".decoreva-rating-button");
if (button) showDecorevaRatingTooltip(button);
}, true);
document.addEventListener("focusout", function (event) {
if (window.innerWidth <= 760) return;
const button = event.target.closest(".decoreva-rating-button");
if (button) hideDecorevaRatingTooltip(button);
}, true);
window.addEventListener("scroll", positionDecorevaRatingTooltip, true);
window.addEventListener("resize", positionDecorevaRatingTooltip);
document.addEventListener("click", async function (event) {
const ratingButton = event.target.closest(
".card .decoreva-rating-button, .featured-slide .decoreva-rating-button"
);
if (ratingButton) {
event.preventDefault();
event.stopPropagation();
const card = ratingButton.closest(".card, .featured-slide");
if (!card) return;
const row = ratingButton.closest(".decoreva-rating-row");
const isMobile = window.innerWidth <= 760;
if (isMobile) {
showDecorevaRatingTooltip(ratingButton);
window.clearTimeout(decorevaMobileRatingTouchTimer);
} else {
hideDecorevaRatingTooltip(ratingButton);
}
const openRatingAction = async function () {
const currentUser = await getCurrentUser();
if (!currentUser) {
if (window.decorevaSupabaseAuth &&
typeof window.decorevaSupabaseAuth.open === "function") {
window.decorevaSupabaseAuth.open();
}
showRatingToast(row, "Please login first to rate or review this product");
if (isMobile) {
window.setTimeout(function () {
hideDecorevaRatingTooltip(ratingButton);
}, 250);
}
return;
}
openReviewModal(card);
if (isMobile) {
window.setTimeout(function () {
hideDecorevaRatingTooltip(ratingButton);
}, 250);
}
};
if (isMobile) {
window.setTimeout(openRatingAction, 300);
} else {
openRatingAction();
}
return;
}
if (event.target.closest("[data-review-close]")) {
event.preventDefault();
event.stopPropagation();
closeReviewModal();
}
}, true);
document.addEventListener("keydown", function (event) {
if (event.key === "Escape") {
closeReviewModal();
}
});
initializeRatingRows();
let resizeTimer = 0;
window.addEventListener("resize", function () {
window.clearTimeout(resizeTimer);
resizeTimer = window.setTimeout(function () {
initializeRatingRows();
}, 180);
});
})();
(function () {
if (document.getElementById("decoreva-mobile-contact-polish")) return;
const style = document.createElement("style");
style.id = "decoreva-mobile-contact-polish";
style.textContent = `
@media (max-width: 760px) {
#contact {
padding: 42px 18px 46px !important;
text-align: center !important;
box-sizing: border-box !important;
}
#contact h2 {
margin: 0 0 10px !important;
font-size: 28px !important;
line-height: 1.15 !important;
}
#contact p {
margin: 0 auto 26px !important;
max-width: 310px !important;
font-size: 15px !important;
line-height: 1.55 !important;
}
#contact a,
#contact button {
display: flex !important;
align-items: center !important;
justify-content: center !important;
width: min(220px, 86vw) !important;
min-width: 0 !important;
height: 46px !important;
min-height: 46px !important;
margin: 0 auto 14px !important;
padding: 0 16px !important;
box-sizing: border-box !important;
border-radius: 11px !important;
font-size: 13px !important;
font-weight: 700 !important;
line-height: 1 !important;
text-align: center !important;
}
#contact a:last-child,
#contact button:last-child {
margin-bottom: 0 !important;
}
#contact a i,
#contact button i {
margin-right: 7px !important;
flex: 0 0 auto !important;
}
}
`;
document.head.appendChild(style);
})();
document.documentElement.removeAttribute("data-decoreva-restoring-panel");
document.documentElement.style.visibility = "";
document.documentElement.style.display = "";
});
document.addEventListener("DOMContentLoaded", function () {
"use strict";
const nav = document.querySelector("#main-nav");
const collectionProducts = document.querySelector("#collection-products");
if (!nav || !collectionProducts) return;
const collectionLink = Array.from(nav.querySelectorAll("a")).find(function (link) {
const text = (link.textContent || "").trim().toLowerCase();
const href = (link.getAttribute("href") || "").toLowerCase();
return text === "collection" || href === "#collection-title";
});
if (!collectionLink) return;
let wrapper = nav.querySelector(".decoreva-collection-nav");
let dropdown = document.querySelector("#decoreva-collection-dropdown");
if (!wrapper) {
wrapper = document.createElement("div");
wrapper.className = "decoreva-collection-nav";
collectionLink.parentNode.insertBefore(wrapper, collectionLink);
wrapper.appendChild(collectionLink);
}
wrapper.style.position = "relative";
collectionLink.classList.add("decoreva-collection-trigger");
collectionLink.setAttribute("aria-haspopup", "true");
collectionLink.setAttribute("aria-expanded", "false");
if (!dropdown) {
dropdown = document.createElement("div");
dropdown.id = "decoreva-collection-dropdown";
dropdown.setAttribute("role", "menu");
dropdown.setAttribute("aria-hidden", "true");
dropdown.innerHTML = `
<button type="button" role="menuitem" data-decoreva-category="all">All Products</button>
<button type="button" role="menuitem" data-decoreva-category="temples">Temples</button>
<button type="button" role="menuitem" data-decoreva-category="keyholders">Key Holders</button>
<button type="button" role="menuitem" data-decoreva-category="wallart">Wall Art</button>
`;
wrapper.appendChild(dropdown);
} else if (dropdown.parentElement !== wrapper) {
wrapper.appendChild(dropdown);
}
if (!document.getElementById("decoreva-collection-category-style")) {
const style = document.createElement("style");
style.id = "decoreva-collection-category-style";
style.textContent = `
/* =====================================================
DESKTOP — dropdown is attached to COLLECTION itself
===================================================== */
#main-nav .decoreva-collection-nav {
position: relative !important;
display: flex !important;
align-items: center !important;
height: 100% !important;
flex: 0 0 auto !important;
}
#main-nav .decoreva-collection-trigger {
position: relative !important;
}
/* Collection trigger remains clean — no extra dot/arrow below it. */
#main-nav .decoreva-collection-trigger::after {
content: none !important;
display: none !important;
}
#decoreva-collection-dropdown {
position: absolute !important;
top: calc(100% + 7px) !important;
left: 50% !important;
transform: translateX(-50%) translateY(-5px) !important;
width: 158px !important;
padding: 6px !important;
box-sizing: border-box !important;
background: linear-gradient(180deg, #1b100a 0%, #100906 100%) !important;
border: 1px solid rgba(210, 161, 61, .92) !important;
border-radius: 10px !important;
box-shadow:
0 16px 34px rgba(0,0,0,.38),
0 4px 12px rgba(0,0,0,.22),
inset 0 1px 0 rgba(255,226,151,.08) !important;
overflow: hidden !important;
z-index: 100000 !important;
display: block !important;
opacity: 0 !important;
visibility: hidden !important;
pointer-events: none !important;
transition: opacity .16s ease, transform .16s ease, visibility .16s ease !important;
}
#decoreva-collection-dropdown::before {
content: "";
display: block;
width: 34px;
height: 2px;
margin: 1px auto 5px;
border-radius: 99px;
background: linear-gradient(90deg,#9b6819,#f1c85f,#9b6819);
box-shadow: 0 0 8px rgba(225,185,87,.18);
}
#decoreva-collection-dropdown.decoreva-open {
opacity: 1 !important;
visibility: visible !important;
pointer-events: auto !important;
transform: translateX(-50%) translateY(0) !important;
}
#decoreva-collection-dropdown button {
display: block !important;
width: 100% !important;
min-height: 32px !important;
padding: 7px 11px 7px 12px !important;
margin: 1px 0 !important;
border: 0 !important;
border-radius: 6px !important;
background: transparent !important;
color: #f2d28a !important;
font: inherit !important;
font-size: 11.5px !important;
font-weight: 800 !important;
line-height: 1.2 !important;
letter-spacing: .15px !important;
text-align: left !important;
cursor: pointer !important;
box-sizing: border-box !important;
transition: background .16s ease, color .16s ease, padding-left .16s ease, box-shadow .16s ease !important;
}
#decoreva-collection-dropdown button + button {
border-top: 1px solid rgba(213,170,84,.11) !important;
}
#decoreva-collection-dropdown button:hover,
#decoreva-collection-dropdown button:focus-visible {
background: linear-gradient(90deg,rgba(198,149,46,.24),rgba(225,185,87,.10)) !important;
color: #fff0c7 !important;
padding-left: 16px !important;
box-shadow: inset 2px 0 0 #d7a43a !important;
outline: none !important;
}
/* =====================================================
MOBILE — Collection stays a working menu item
inside the hamburger navigation.
===================================================== */
@media (max-width: 760px) {
/* CLOSED MOBILE MENU:
Collection must stay hidden with the rest of the hamburger links.
The Collection wrapper is a DIV, so the existing
#main-nav > a { display:none } rule cannot hide it. */
#main-nav .decoreva-collection-nav {
width: 100% !important;
height: auto !important;
display: none !important;
flex-direction: column !important;
align-items: stretch !important;
position: relative !important;
}
/* OPEN MOBILE MENU:
Show Collection only when the hamburger navigation is open. */
#main-nav.mobile-open .decoreva-collection-nav,
body.menu-open #main-nav .decoreva-collection-nav {
display: flex !important;
}
/* Make Collection match Home / About Us / Contact / Instagram exactly. */
#main-nav.mobile-open .decoreva-collection-trigger,
body.menu-open #main-nav .decoreva-collection-trigger {
display: flex !important;
position: relative !important;
flex: 0 0 40px !important;
width: 100% !important;
min-width: 100% !important;
min-height: 40px !important;
height: 40px !important;
box-sizing: border-box !important;
align-items: center !important;
justify-content: flex-start !important;
padding: 10px 18px !important;
margin: 0 !important;
background: #201108 !important;
border: 0 !important;
border-bottom: 1px solid rgba(184,134,44,.28) !important;
border-radius: 0 !important;
color: #F0C66A !important;
font-size: 12px !important;
font-weight: 700 !important;
line-height: 1.2 !important;
text-align: left !important;
text-decoration: none !important;
letter-spacing: normal !important;
}
#main-nav .decoreva-collection-trigger {
width: 100% !important;
box-sizing: border-box !important;
}
#main-nav .decoreva-collection-trigger::after {
content: none !important;
display: none !important;
}
#decoreva-collection-dropdown {
position: static !important;
width: 180px !important;
max-width: calc(100% - 28px) !important;
margin: 2px 0 5px 14px !important;
transform: none !important;
padding: 3px !important;
border-radius: 7px !important;
box-shadow: 0 6px 14px rgba(0,0,0,.22) !important;
display: none !important;
opacity: 0 !important;
visibility: hidden !important;
pointer-events: none !important;
}
#decoreva-collection-dropdown.decoreva-open {
display: block !important;
opacity: 1 !important;
visibility: visible !important;
pointer-events: auto !important;
transform: none !important;
}
#decoreva-collection-dropdown button {
min-height: 26px !important;
font-size: 10.5px !important;
line-height: 1.1 !important;
padding: 5px 8px !important;
}
#decoreva-collection-dropdown::before {
width: 22px !important;
height: 2px !important;
margin: 0 auto 2px !important;
}
}
`;
document.head.appendChild(style);
}
const collectionTitle =
document.querySelector("#collection-title, .collection-title");
const productSearch =
document.querySelector("#productSearch");
let activeCategory = "all";
function getCardText(card) {
const title = card.querySelector("h3");
const image = card.querySelector("img");
return (
(title ? title.textContent : "") +
" " +
(image ? image.getAttribute("alt") || "" : "") +
" " +
(card.getAttribute("data-product-key") || "") +
" " +
(card.getAttribute("data-product-id") || "") +
" " +
(card.getAttribute("data-variation-product") || "")
).toLowerCase();
}
function cardMatchesCategory(card, category) {
if (category === "all") return true;
const text = getCardText(card);
if (category === "temples") {
return /\btemple\b|\btemples\b|\bmandir\b/.test(text);
}
if (category === "keyholders") {
return /\bkey[\s-]?holder\b|\bkeyholders\b|\bkeyholder\b/.test(text);
}
if (category === "wallart") {
return /\bwall[\s-]?art\b|\bwallart\b|\bmdf wall\b|\bacrylic wall\b/.test(text);
}
return false;
}
function closeDropdown() {
dropdown.classList.remove("decoreva-open");
dropdown.setAttribute("aria-hidden", "true");
collectionLink.setAttribute("aria-expanded", "false");
}
function openDropdown() {
dropdown.classList.add("decoreva-open");
dropdown.setAttribute("aria-hidden", "false");
collectionLink.setAttribute("aria-expanded", "true");
}
function scrollToCollection() {
if (!collectionTitle) return;
requestAnimationFrame(function () {
requestAnimationFrame(function () {
const navHeight = nav ? nav.getBoundingClientRect().height : 0;
const top =
collectionTitle.getBoundingClientRect().top +
window.pageYOffset -
navHeight -
6;
window.scrollTo({
top: Math.max(0, top),
left: 0,
behavior: "smooth"
});
});
});
}
function showAllProducts() {
activeCategory = "all";
if (productSearch) {
productSearch.value = "";
}
if (typeof clearAllCollectionFilters === "function") {
clearAllCollectionFilters(false);
} else {
const cards = Array.from(collectionProducts.querySelectorAll(".card"));
cards.forEach(function (card) {
card.style.setProperty("display", "flex", "important");
});
document.querySelectorAll(".decoreva-pagination").forEach(function (navItem) {
navItem.style.display = "flex";
});
if (typeof decorevaShowPage === "function") {
decorevaShowPage(1);
}
}
if (typeof window.decorevaLoadVisibleSliders === "function") {
window.decorevaLoadVisibleSliders();
}
}
function applyCategory(category) {
activeCategory = category;
if (productSearch) {
productSearch.value = "";
}
if (category === "all") {
showAllProducts();
return;
}
document.querySelectorAll(".decoreva-pagination").forEach(function (navItem) {
navItem.style.display = "none";
});
const cards = Array.from(
collectionProducts.querySelectorAll(".card")
);
cards.forEach(function (card) {
const visible = cardMatchesCategory(card, category);
card.style.setProperty(
"display",
visible ? "flex" : "none",
"important"
);
});
if (typeof window.decorevaLoadVisibleSliders === "function") {
window.decorevaLoadVisibleSliders();
}
}
collectionLink.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
const isOpening =
!dropdown.classList.contains("decoreva-open");
if (window.innerWidth <= 760) {
if (isOpening) {
nav.classList.add("mobile-open");
document.body.classList.add("menu-open");
const menuButton =
document.querySelector(".mobile-menu-toggle");
if (menuButton) {
menuButton.setAttribute("aria-expanded", "true");
}
}
}
if (isOpening) {
openDropdown();
} else {
closeDropdown();
}
}, true);
dropdown.querySelectorAll("[data-decoreva-category]").forEach(function (button) {
button.addEventListener("click", function (event) {
event.preventDefault();
event.stopPropagation();
const category =
button.getAttribute("data-decoreva-category") || "all";
applyCategory(category);
closeDropdown();
if (window.innerWidth <= 760) {
nav.classList.remove("mobile-open");
document.body.classList.remove("menu-open");
const menuButton =
document.querySelector(".mobile-menu-toggle");
if (menuButton) {
menuButton.setAttribute("aria-expanded", "false");
}
}
scrollToCollection();
});
});
document.addEventListener("click", function (event) {
if (
!dropdown.contains(event.target) &&
!collectionLink.contains(event.target)
) {
closeDropdown();
}
}, true);
if (productSearch) {
productSearch.addEventListener("input", function () {
if (activeCategory === "all") return;
const searchText =
productSearch.value.toLowerCase().trim();
document.querySelectorAll(".decoreva-pagination").forEach(function (navItem) {
navItem.style.display = "none";
});
const cards = Array.from(
collectionProducts.querySelectorAll(".card")
);
cards.forEach(function (card) {
const title = card.querySelector("h3");
const name = title
? title.textContent.toLowerCase()
: "";
const categoryMatch =
cardMatchesCategory(card, activeCategory);
const searchMatch =
!searchText || name.includes(searchText);
card.style.setProperty(
"display",
categoryMatch && searchMatch ? "flex" : "none",
"important"
);
});
if (typeof window.decorevaLoadVisibleSliders === "function") {
window.decorevaLoadVisibleSliders();
}
});
}
});
