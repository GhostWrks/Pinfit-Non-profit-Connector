const views = {
  home: document.getElementById("landing-view"),
  donor: document.getElementById("donor-view"),
  nonprofit: document.getElementById("nonprofit-view")
};

const donorSummaryEl = document.getElementById("donor-summary");
const donorResultsEl = document.getElementById("donor-results");
const donorFormEl = document.getElementById("donor-form");

const npIndicatorsEl = document.getElementById("np-indicators");
const npDashboardEl = document.getElementById("nonprofit-dashboard");
const npSaveMessageEl = document.getElementById("np-save-message");

const appConfig = window.__APP_CONFIG || {};
const donorWebMapId = "279c71fd169b41ae96cde73e1fb6510a";

let donorMapReady = false;
let donorMapView = null;
let donorGraphicsLayer = null;
let ArcGISGraphic = null;

const loadArcgisModules = () =>
  new Promise((resolve, reject) => {
    if (!window.require) {
      reject(new Error("ArcGIS SDK was not loaded"));
      return;
    }

    window.require(
      [
        "esri/config",
        "esri/WebMap",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/widgets/Search",
        "esri/widgets/LayerList"
      ],
      (...modules) => resolve(modules),
      reject
    );
  });

const ensureDonorMap = async () => {
  if (donorMapReady) {
    return;
  }

  const [esriConfig, WebMap, MapView, GraphicsLayer, Graphic, Search, LayerList] =
    await loadArcgisModules();

  if (appConfig.arcgisApiKey) {
    esriConfig.apiKey = appConfig.arcgisApiKey;
  }

  ArcGISGraphic = Graphic;
  donorGraphicsLayer = new GraphicsLayer();

  const map = new WebMap({
    portalItem: {
      id: donorWebMapId
    }
  });

  map.add(donorGraphicsLayer);

  donorMapView = new MapView({
    container: "donor-map",
    map,
    center: [-117.1825, 34.0558],
    zoom: 11,
    popup: {
      dockEnabled: true,
      dockOptions: {
        position: "bottom-right",
        breakpoint: false
      }
    }
  });

  const search = new Search({
    view: donorMapView,
    includeDefaultSources: true
  });

  const layerList = new LayerList({
    view: donorMapView
  });

  donorMapView.ui.add(layerList, "top-left");
  donorMapView.ui.add(search, "top-right");

  search.on("select-result", (event) => {
    const point = event.result?.feature?.geometry;
    if (!point) {
      return;
    }

    donorFormEl.elements.locationQuery.value = event.result?.name || "";
    donorFormEl.elements.lat.value = Number(point.latitude).toFixed(4);
    donorFormEl.elements.lon.value = Number(point.longitude).toFixed(4);
    donorFormEl.requestSubmit();
  });

  donorMapReady = true;
};

const apiGet = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const switchView = (nextView) => {
  Object.values(views).forEach((el) => el.classList.add("hidden"));
  views[nextView].classList.remove("hidden");
};

const card = (label, value) =>
  `<article class="summary-card"><p class="stat-label">${label}</p><p class="stat-value">${value}</p></article>`;

const renderLandingStats = async () => {
  try {
    const data = await apiGet("/api/analytics/public");
    document.getElementById("stat-orgs").textContent = data.indicators.nonprofitCount;
    document.getElementById("stat-volunteer").textContent = data.indicators.volunteerNeededCount;
    document.getElementById("stat-topneed").textContent = data.indicators.topNeedType || "n/a";
  } catch {
    document.getElementById("stat-orgs").textContent = "-";
    document.getElementById("stat-volunteer").textContent = "-";
    document.getElementById("stat-topneed").textContent = "offline";
  }
};

const renderDonorSearch = (payload) => {
  donorSummaryEl.innerHTML = [
    card("Organizations", payload.summary.organizationsInView),
    card("Volunteer Needed", payload.summary.volunteerNeededCount),
    card(
      "Top Need",
      payload.summary.topRequestedNeeds[0]
        ? `${payload.summary.topRequestedNeeds[0].need}`
        : "n/a"
    )
  ].join("");

  if (!payload.results.length) {
    donorResultsEl.innerHTML =
      '<div class="notice">No nonprofits found in this area. Try a larger radius.</div>';
    return;
  }

  donorResultsEl.innerHTML = payload.results
    .map(
      (org) => `
      <article class="card">
        <h3>${org.name}</h3>
        <p><strong>Address:</strong> ${org.address}</p>
        <p><strong>Needs:</strong> ${org.needs.join(", ")}</p>
        <p><strong>Volunteers Needed:</strong> ${org.volunteersNeeded ? "Yes" : "No"}</p>
        <p><strong>Contact:</strong> ${org.mainContact} (${org.contactPhone})</p>
        <p><strong>Updated:</strong> ${new Date(org.lastUpdated).toLocaleString()}</p>
        <button class="btn btn-outline" type="button" data-zoom-lat="${org.location.lat}" data-zoom-lon="${org.location.lon}">Zoom On Map</button>
      </article>
    `
    )
    .join("");

  if (donorMapReady && donorGraphicsLayer && ArcGISGraphic) {
    donorGraphicsLayer.removeAll();

    payload.results.forEach((org) => {
      const graphic = new ArcGISGraphic({
        geometry: {
          type: "point",
          latitude: org.location.lat,
          longitude: org.location.lon
        },
        symbol: {
          type: "simple-marker",
          style: "circle",
          size: 10,
          color: org.volunteersNeeded ? "#da5a2f" : "#125347",
          outline: {
            color: "#ffffff",
            width: 1
          }
        },
        attributes: {
          name: org.name,
          address: org.address,
          needs: org.needs.join(", "),
          volunteersNeeded: org.volunteersNeeded ? "Yes" : "No"
        },
        popupTemplate: {
          title: "{name}",
          content:
            "<b>Address:</b> {address}<br/><b>Needs:</b> {needs}<br/><b>Volunteers Needed:</b> {volunteersNeeded}"
        }
      });

      donorGraphicsLayer.add(graphic);
    });

    const effectiveCenter = payload?.query?.effectiveCenter;
    if (
      effectiveCenter &&
      Number.isFinite(effectiveCenter.lat) &&
      Number.isFinite(effectiveCenter.lon)
    ) {
      donorMapView.goTo({
        center: [effectiveCenter.lon, effectiveCenter.lat],
        zoom: 11
      });
    }
  }
};

const renderNonprofitIndicators = async () => {
  const data = await apiGet("/api/analytics/public");
  npIndicatorsEl.innerHTML = [
    card("Organizations", data.indicators.nonprofitCount),
    card("Volunteer-needed orgs", data.indicators.volunteerNeededCount),
    card("Top need", data.indicators.topNeedType)
  ].join("");
};

const wireNav = () => {
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.getAttribute("data-go");
      if (target === "home") {
        switchView("home");
        return;
      }

      if (target === "donor") {
        switchView("donor");
        try {
          await ensureDonorMap();
          donorFormEl.requestSubmit();
        } catch {
          donorResultsEl.innerHTML =
            '<div class="notice">ArcGIS SDK failed to load. Check internet/network access and refresh.</div>';
        }
        return;
      }

      switchView(target);
    });
  });
};

const wireDonorForm = () => {
  donorFormEl.elements.locationQuery?.addEventListener("input", () => {
    donorFormEl.elements.lat.value = "";
    donorFormEl.elements.lon.value = "";
  });

  donorFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(donorFormEl);
    const query = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (String(value).trim() !== "") {
        query.set(key, value);
      }
    }

    try {
      const payload = await apiGet(`/api/donor/search?${query.toString()}`);
      renderDonorSearch(payload);
    } catch {
      donorResultsEl.innerHTML =
        '<div class="notice">Unable to load donor search results right now.</div>';
    }
  });

  donorResultsEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (!target.matches("[data-zoom-lat][data-zoom-lon]")) {
      return;
    }

    if (!donorMapView) {
      return;
    }

    const lat = Number(target.dataset.zoomLat);
    const lon = Number(target.dataset.zoomLon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    donorMapView.goTo({
      center: [lon, lat],
      zoom: 13
    });
  });
};

const wireNonprofitFlow = () => {
  const loginForm = document.getElementById("nonprofit-login-form");
  const needsForm = document.getElementById("nonprofit-needs-form");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    npDashboardEl.classList.remove("hidden");
    await renderNonprofitIndicators();
  });

  needsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(needsForm).entries());

    npSaveMessageEl.classList.remove("hidden");
    npSaveMessageEl.textContent =
      `Saved locally: needs=${data.needs}, priority=${data.priority}, volunteer=${data.volunteersNeeded}, urgency=${data.urgencyScore}.`;
  });
};

const init = async () => {
  switchView("home");
  wireNav();
  wireDonorForm();
  wireNonprofitFlow();
  await renderLandingStats();
};

init();
