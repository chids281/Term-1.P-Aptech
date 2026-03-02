/* ==========================================================
   CarBreezy Main JS (with clear comments)
   - Visitor counter (localStorage)
   - GeoLocation + live ticker
   - Car filtering (brand/type/condition)
   - Rendering cards (New + Used)
   - Modal with tabs (internal/external/engine/dimensions)
   ========================================================== */

/* -------------------------------
   1) VISITOR COUNTER (localStorage)
   ------------------------------- */

// Read stored visits (if none, start from 0) and convert to number
let visits = Number(localStorage.getItem("carbreezy_visits") || 0);

// If you want visits to increase each page refresh, uncomment this:
// visits += 1;

// Save visits back into localStorage
localStorage.setItem("carbreezy_visits", visits);

// Show the visits value in the UI (if #visitors exists)
const visitorsEl = document.getElementById("visitors");
if (visitorsEl) visitorsEl.textContent = visits;

/* -------------------------------
   2) GEOLOCATION + LIVE TICKER
   ------------------------------- */

// Ask browser for current location
navigator.geolocation.getCurrentPosition(
  // Success callback
  (pos) => {
    const { latitude, longitude } = pos.coords;
    // Pass a short readable string into ticker
    startTicker(`Location: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
  },
  // Error callback (user denies, browser unsupported, etc.)
  () => startTicker("Location unavailable")
);

/**
 * Updates the ticker every second with date | time | location
 * @param {string} location - text to display at end of ticker
 */
function startTicker(location) {
  setInterval(() => {
    const now = new Date();

    // Find the ticker text element
    const ticker = document.getElementById("tickerText");
    if (!ticker) return;

    // Update the ticker UI
    ticker.textContent = `${now.toDateString()} | ${now.toLocaleTimeString()} | ${location}`;
  }, 1000);
}

/* ==========================================================
   3) MAIN APP LOGIC (runs after HTML is loaded)
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------------
     A) GET IMPORTANT ELEMENTS
     ------------------------------- */
  const typeRow = document.getElementById("cbTypeRow");
  const brandRow = document.getElementById("cbBrandRow");
  const condRow = document.getElementById("cbCondRow");

  const brandTitle = document.getElementById("cbBrandTitle");
  const newGrid = document.getElementById("cbNewGrid");
  const usedGrid = document.getElementById("cbUsedGrid");

  // Modal elements
  const modal = document.getElementById("cbModal");
  const mClose = document.getElementById("mClose");
  const mName = document.getElementById("mName");
  const mMeta = document.getElementById("mMeta");
  const mImg = document.getElementById("mImg");
  const mPrice = document.getElementById("mPrice");
  const mDesc = document.getElementById("mDesc");
  const mTabs = document.getElementById("mTabs");
  const mTabContent = document.getElementById("mTabContent");

  // Safety: if the main UI containers are missing, stop
  if (!typeRow || !brandRow || !condRow || !newGrid || !usedGrid) return;

  /* -------------------------------
     B) HELPERS
     ------------------------------- */

  // Format numbers to currency text
  const money = (n) => `₦${Number(n).toLocaleString()}`;

  // App state (BMW is default as you requested)
  const state = {
    brand: "BMW", // default brand filter
    type: "all", // all | Hatchback | Sedan | SUV | Convertible
    cond: "all", // all | new | used
  };

  /* -------------------------------
     C) DATA (create cars list)
     ------------------------------- */
  const cars = buildCars();

  /**
   * Generates cars for each brand (15 per brand)
   * IMPORTANT: Your image path format:
   * ./images/{brand}/{brand}-{i}.jpg
   * Example: ./images/bmw/bmw-1.jpg
   */
  function buildCars() {
    const brands = ["BMW", "Toyota", "Honda", "Mercedes"];
    const types = ["Hatchback", "Sedan", "SUV", "Convertible"];

    const list = [];

    brands.forEach((brand) => {
      for (let i = 1; i <= 15; i++) {
        const type = types[(i - 1) % types.length];
        const cond = i <= 8 ? "new" : "used"; // first 8 are new, rest used

        // Basic price rules per brand
        const priceBase =
          brand === "BMW"
            ? 32000000
            : brand === "Mercedes"
            ? 45000000
            : 18000000;

        // Push a single car object
        list.push({
          id: `${brand}-${i}`.toLowerCase(),
          brand,
          type,
          cond,
          name: `${brand} ${type} ${i}`,
          price: priceBase + i * 1200000,

          // Image path (make sure these folders + files exist)
          img: `./images/${brand.toLowerCase()}/${brand.toLowerCase()}-${i}.jpg`,

          // Quick description for the modal
          desc: `${brand} ${type} built for comfort, confidence, and smooth daily driving.`,

          // Modal tab content (HTML lists)
          details: {
            internal: ul([
              "Comfort seats with clean dashboard layout",
              "Bluetooth/USB infotainment support",
              "Strong AC performance for hot weather",
              "Practical cabin storage and cupholders",
            ]),
            external: ul([
              "Modern headlights with sharp styling",
              "Durable body design with clean lines",
              "Balanced ground clearance for city roads",
              "Alloy wheels depending on trim",
            ]),
            engine: ul([
              "Efficient petrol engine options (varies)",
              "Smooth acceleration for city/highway",
              "Auto/Manual transmission depends on trim",
              "Reliable power delivery for daily use",
            ]),
            dimensions: ul([
              "Dimensions vary by model",
              "Optimized cabin space for passengers",
              "Cargo space depends on body type",
              "Wheelbase tuned for stability",
            ]),
          },
        });
      }
    });

    return list;
  }

  /**
   * Converts an array of strings into an HTML <ul>
   * @param {string[]} items
   * @returns {string} HTML UL string
   */
  function ul(items) {
    return `<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  }

  /* -------------------------------
     D) FILTER BUTTON LOGIC
     (Only one active per row)
     ------------------------------- */

  const BTN = ".cbFilters__btn";

  /**
   * Removes active class from all buttons in a row, then activates the clicked one.
   * @param {HTMLElement} row
   * @param {HTMLElement} btn
   */
  function setActive(row, btn) {
    [...row.querySelectorAll(BTN)].forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  }

  // Type buttons
  typeRow.addEventListener("click", (e) => {
    const btn = e.target.closest(BTN);
    if (!btn) return;

    setActive(typeRow, btn);
    state.type = btn.dataset.type; // expects data-type="SUV" etc.
    render();
  });

  // Brand buttons (BMW/Toyota/Honda/Mercedes)
  brandRow.addEventListener("click", (e) => {
    const btn = e.target.closest(BTN);
    if (!btn) return;

    setActive(brandRow, btn);
    state.brand = btn.dataset.brand; // expects data-brand="BMW" etc.

    if (brandTitle) brandTitle.textContent = `${state.brand} Cars`;
    render();
  });

  // Condition buttons (new/used/all)
  condRow.addEventListener("click", (e) => {
    const btn = e.target.closest(BTN);
    if (!btn) return;

    setActive(condRow, btn);
    state.cond = btn.dataset.cond; // expects data-cond="new" etc.
    render();
  });

  /* -------------------------------
     E) FILTERING + RENDERING
     ------------------------------- */

  /**
   * Checks if a car matches current filters
   * @param {object} c car
   * @returns {boolean}
   */
  function matches(c) {
    const okBrand = c.brand === state.brand; // brand is always required
    const okType = state.type === "all" || c.type === state.type;
    const okCond = state.cond === "all" || c.cond === state.cond;
    return okBrand && okType && okCond;
  }

  /**
   * Returns card HTML for a car (used in grids)
   * @param {object} c
   * @returns {string}
   */
  function cardHTML(c) {
    return `
      <article class="cbCard" data-id="${c.id}">
        <img class="cbCard__img" src="${c.img}" alt="${c.name}" />
        <h4 class="cbCard__name">${c.name}</h4>
        <p class="cbCard__price">${money(c.price)}</p>
      </article>
    `;
  }

  /**
   * Renders new + used car grids based on current state
   */
  function render() {
    const filtered = cars.filter(matches);

    const newCars = filtered.filter((c) => c.cond === "new");
    const usedCars = filtered.filter((c) => c.cond === "used");

    // Fill NEW grid
    newGrid.innerHTML =
      newCars.map(cardHTML).join("") ||
      `<p style="opacity:.7">No new cars found.</p>`;

    // Fill USED grid
    usedGrid.innerHTML =
      usedCars.map(cardHTML).join("") ||
      `<p style="opacity:.7">No used cars found.</p>`;
  }

  /* -------------------------------
     F) MODAL OPEN / CLOSE + TABS
     ------------------------------- */

  let activeCar = null;     // currently opened car
  let activeTab = "internal"; // active tab key

  // Open modal when clicking a card (event delegation)
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".cbCard");
    if (!card) return;

    const car = cars.find((x) => x.id === card.dataset.id);
    if (!car) return;

    openModal(car);
  });

  /**
   * Opens modal and injects data
   * @param {object} car
   */
  function openModal(car) {
    // Safety: ensure modal elements exist
    if (
      !modal ||
      !mClose ||
      !mName ||
      !mMeta ||
      !mImg ||
      !mPrice ||
      !mDesc ||
      !mTabs ||
      !mTabContent
    )
      return;

    activeCar = car;
    activeTab = "internal";

    // Fill modal UI
    mName.textContent = car.name;
    mMeta.textContent = `${car.brand} • ${car.type} • ${car.cond.toUpperCase()}`;
    mImg.src = car.img;        // important: makes image show correctly
    mImg.alt = car.name;
    mPrice.textContent = money(car.price);
    mDesc.textContent = car.desc;

    // Set active tab button
    [...mTabs.querySelectorAll(".cbTabs__tab")].forEach((b) =>
      b.classList.toggle("is-active", b.dataset.tab === activeTab)
    );

    // Inject active tab content
    mTabContent.innerHTML = car.details[activeTab];

    // Show modal
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // Stop background scrolling while modal is open
    document.body.style.overflow = "hidden";
  }

  /**
   * Closes modal and resets state
   */
  function closeModal() {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    activeCar = null;
  }

  // Close button click
  if (mClose) mClose.addEventListener("click", closeModal);

  // Click outside modal box closes it
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

  // ESC key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  // Tabs click: switch content
  if (mTabs)
    mTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".cbTabs__tab");
      if (!btn || !activeCar) return;

      activeTab = btn.dataset.tab; // internal/external/engine/dimensions

      // Update active class
      [...mTabs.querySelectorAll(".cbTabs__tab")].forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );

      // Update panel content
      mTabContent.innerHTML = activeCar.details[activeTab];
    });

  /* -------------------------------
     G) INITIAL UI SETUP
     ------------------------------- */

  // Set initial brand title
  if (brandTitle) brandTitle.textContent = `${state.brand} Cars`;

  // First render
  render();
});
