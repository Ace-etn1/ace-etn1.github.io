const bands = [
    { label: 'Above +1', colour: '#16706b' },
    { label: '0 to +1', colour: '#9bd6c2' },
    { label: '−1 to below 0', colour: '#f3c58b' },
    { label: 'Below −1', colour: '#b95528' }
];
const missing = { label: 'Not enough data', colour: '#c8cbcd' };

function differenceBand(years) {
    if (!Number.isFinite(years)) return missing;
    if (years > 1) return bands[0];
    if (years >= 0) return bands[1];
    if (years >= -1) return bands[2];
    return bands[3];
}

function hoverLabel({ name, lifeExpectancy }) {
    return name + ' · ' + (Number.isFinite(lifeExpectancy) ? lifeExpectancy.toFixed(1) : missing.label);
}
const overview = [[-44, 112], [-9, 154]];
const map = L.map('map', {
    maxBounds: [[-53, 88], [1, 176]],
    maxBoundsViscosity: 1,
    maxZoom: 15,
    preferCanvas: true,
    zoomSnap: 0.1
}).fitBounds(overview, { padding: [10, 10] });
map.attributionControl.setPrefix(false);
map.setMinZoom(map.getZoom() - 0.5);

const picker = document.getElementById('level');
const details = document.getElementById('details');
const datasets = new Map([['SA4', sa4Regions]]);
const loading = new Map();
let boundaries;
let selected;
let selectionOutline;
let activeLevel;

function registerRegions(level, collection) {
    datasets.set(level, collection);
}

function loadRegions(level) {
    if (datasets.has(level)) return Promise.resolve(datasets.get(level));
    if (loading.has(level)) return loading.get(level);
    const request = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/mortality-map/' + level.toLowerCase() + '.js';
        script.onload = () => datasets.has(level) ? resolve(datasets.get(level)) : reject();
        script.onerror = reject;
        document.head.append(script);
    }).finally(() => loading.delete(level));
    loading.set(level, request);
    return request;
}

function clearSelection() {
    if (selectionOutline) selectionOutline.remove();
    if (selected) boundaries.resetStyle(selected);
    selectionOutline = null;
    selected = null;
    details.classList.remove('has-selection');
}

function regionStatistics(region) {
    function format(value, digits, signed = false, percent = false) {
        if (!Number.isFinite(value)) return missing.label;
        return value.toLocaleString('en-AU', {
            style: percent ? 'percent' : 'decimal',
            minimumFractionDigits: digits, maximumFractionDigits: digits,
            signDisplay: signed ? 'exceptZero' : 'auto'
        });
    }
    function expectancy(value, difference) {
        if (!Number.isFinite(value)) return missing.label;
        return format(value, 1) + ' (' + format(difference, 1, true) + ')';
    }
    const heading = document.createElement('strong');
    heading.textContent = region.name;
    const caption = document.createElement('p');
    caption.textContent = 'Life expectancy at birth (vs Australian average)';
    const stats = document.createElement('dl');
    const rows = [
        ['Average life expectancy', expectancy(region.lifeExpectancy, region.difference)],
        ['Male life expectancy', expectancy(region.maleLE, region.maleDiff)],
        ['Female life expectancy', expectancy(region.femaleLE, region.femaleDiff)],
        ['IRSD quintile', format(region.quintile, 0)],
        ['Average age (years)', format(region.meanAge, 1)],
        ['Male %', format(region.maleShare, 1, false, true)],
        ['Female %', format(region.femaleShare, 1, false, true)],
        ['ERP June 2025', format(region.erp, 0)],
        ['Deaths 2025', format(region.deaths, 0)],
        ['Deaths above/below expected', format(region.deathsDiff, 1, true, true)],
        ['Average drive to nearest hospital (min)', format(region.hospitalMinutes, 1)],
        ['Current smokers (age 18+)', format(region.smokingShare, 1, false, true)],
        ['Obesity (age 18+)', format(region.obesityShare, 1, false, true)],
        ['Median weekly household income (2021 AUD)', Number.isFinite(region.weeklyIncome) ? '$' + format(region.weeklyIncome, 0) : missing.label]
    ];
    for (const [label, value] of rows) {
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        stats.append(term, description);
    }
    const content = document.createElement('div');
    content.className = 'region-stats';
    content.append(heading, caption, stats);
    return content;
}

function selectRegion(layer, location) {
    clearSelection();
    selected = layer;
    details.value = 'Selected region · ' + layer.feature.properties.name;
    details.classList.add('has-selection');
    layer.setStyle({ color: '#162f42', weight: 7 }).bringToFront();
    selectionOutline = L.polygon(layer.getLatLngs(), {
        color: '#fff', weight: 2.5, opacity: 1, fill: false, interactive: false
    }).addTo(map);
    layer.closeTooltip();
    const size = map.getSize();
    const popup = L.popup({ autoPan: false, maxWidth: Math.min(320, size.x - 60), maxHeight: size.y - 82 })
        .setLatLng(location).setContent(regionStatistics(layer.feature.properties)).openOn(map);
    // Keep the statistics visible at the map edges without moving the map.
    const box = popup.getElement().getBoundingClientRect();
    const frame = map.getContainer().getBoundingClientRect();
    const dx = Math.max(0, frame.left + 6 - box.left) - Math.max(0, box.right - frame.right + 6);
    const dy = Math.max(0, frame.top + 6 - box.top) - Math.max(0, box.bottom - frame.bottom + 6);
    popup.options.offset = L.point(popup.options.offset).add([dx, dy]);
    popup.update();
}

async function showLevel() {
    const level = picker.value;
    details.value = 'Loading ' + level + ' regions…';
    try {
        const collection = await loadRegions(level);
        if (picker.value !== level) return;
        map.closePopup();
        clearSelection();
        if (boundaries) map.removeLayer(boundaries);
        activeLevel = level;
        boundaries = L.geoJSON(collection, {
            style(feature) {
                return { color: '#263e45', weight: level === 'SA2' ? 1.15 : 1.7, fillColor: differenceBand(feature.properties.difference).colour, fillOpacity: 1 };
            },
            onEachFeature(feature, layer) {
                const label = document.createElement('span');
                label.textContent = hoverLabel(feature.properties);
                layer.bindTooltip(label, { sticky: true });
                layer.on('click', event => selectRegion(layer, event.latlng));
            }
        }).addTo(map);
        details.value = collection.features.length.toLocaleString('en-AU') + ' regions';
    } catch {
        if (picker.value !== level) return;
        picker.value = activeLevel || 'SA4';
        details.value = 'Could not load ' + level + '. Select it again to retry.';
    }
}

const rankingMenu = document.getElementById('ranking-category');
const rankingSummary = document.getElementById('current-ranking');
const rankingButtons = document.querySelectorAll('#ranking-options button');
for (const button of rankingButtons) {
    button.addEventListener('click', () => {
        for (const option of rankingButtons) {
            const selected = option === button;
            option.setAttribute('aria-pressed', String(selected));
            document.getElementById(option.getAttribute('aria-controls')).hidden = !selected;
        }
        rankingSummary.textContent = button.textContent;
        document.getElementById('ranking-metric').textContent = button.dataset.metric;
        rankingMenu.open = false;
        rankingSummary.focus();
    });
}
document.getElementById('leaderboard').addEventListener('close', () => { rankingMenu.open = false; });

picker.addEventListener('change', showLevel);
for (const button of document.querySelectorAll('.map-info button')) {
    const dialog = document.getElementById(button.getAttribute('aria-controls'));
    button.addEventListener('click', () => {
        dialog.showModal();
    });
}
showLevel();

const postcodeForm = document.getElementById('postcode-search');
const postcodeStatus = document.getElementById('postcode-status');
const postcodePane = map.createPane('postalBoundary');
postcodePane.style.zIndex = 430;
postcodePane.style.pointerEvents = 'none';
let postcodeLoad;
let postcodeOutline;
let searchId = 0;

function loadPostcodes() {
    if (!postcodeLoad) {
        postcodeLoad = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'assets/mortality-map/postcodes.js';
            script.onload = () => resolve(postalAreas);
            script.onerror = () => { postcodeLoad = null; reject(); };
            document.head.append(script);
        });
    }
    return postcodeLoad;
}

postcodeForm.addEventListener('submit', async event => {
    event.preventDefault();
    const code = document.getElementById('postcode').value.trim();
    const request = ++searchId;
    postcodeStatus.value = 'Searching…';
    try {
        const areas = await loadPostcodes();
        if (request !== searchId) return;
        if (postcodeOutline) postcodeOutline.remove();
        postcodeOutline = null;
        if (!areas[code]) {
            postcodeStatus.value = 'No mapped postal area for ' + code + '.';
            return;
        }
        map.closePopup();
        clearSelection();
        if (activeLevel === picker.value) details.value = datasets.get(activeLevel).features.length.toLocaleString('en-AU') + ' regions';
        postcodeOutline = L.geoJSON(areas[code], {
            pane: 'postalBoundary', interactive: false,
            style: { color: '#492685', weight: 3, dashArray: '7 5', fill: false }
        }).addTo(map);
        map.fitBounds(postcodeOutline.getBounds(), { padding: [22, 22], maxZoom: 14 });
        postcodeStatus.value = code + ' · dashed outline';
    } catch {
        if (request === searchId) postcodeStatus.value = 'Postcode search could not load. Try again.';
    }
});

document.getElementById('reset').addEventListener('click', () => {
    searchId++;
    postcodeForm.reset();
    postcodeStatus.value = '';
    if (postcodeOutline) postcodeOutline.remove();
    postcodeOutline = null;
    map.closePopup();
    clearSelection();
    if (activeLevel === picker.value) details.value = datasets.get(activeLevel).features.length.toLocaleString('en-AU') + ' regions';
    map.fitBounds(overview, { padding: [10, 10] });
});

[...bands, missing].forEach(({ colour, label }) => {
    const item = document.createElement('span');
    const swatch = document.createElement('i');
    swatch.style.backgroundColor = colour;
    item.append(swatch, label);
    document.getElementById('legend').append(item);
});
