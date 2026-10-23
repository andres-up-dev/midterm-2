// Offline SVG Fallback for missing/broken sprites
const DEFAULT_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="100%" height="100%" fill="#2b3035"/>
    <circle cx="100" cy="100" r="60" fill="none" stroke="#6c757d" stroke-width="8"/>
    <line x1="40" y1="100" x2="160" y2="100" stroke="#6c757d" stroke-width="8"/>
    <circle cx="100" cy="100" r="18" fill="#2b3035" stroke="#6c757d" stroke-width="8"/>
    <text x="50%" y="185" font-family="sans-serif" font-size="14" fill="#adb5bd" text-anchor="middle">No Image</text>
  </svg>
`);

// DOM Elements
const catalogGrid = document.getElementById('catalog-grid');
const catalogSection = document.getElementById('catalog-section');
const catalogCount = document.getElementById('catalog-count');
const catalogSubtitle = document.getElementById('catalog-subtitle');
const loadingSpinner = document.getElementById('loading-spinner');
const errorView = document.getElementById('error-view');
const errorMessage = document.getElementById('error-message');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const errorResetBtn = document.getElementById('error-reset-btn');
const brandReset = document.getElementById('brand-reset');

// Modal Elements
const modalElement = document.getElementById('characters-modal');
const characterModal = new bootstrap.Modal(modalElement);
const modalName = document.getElementById('modal-name');
const modalId = document.getElementById('modal-id');
const modalImg = document.getElementById('modal-img');
const modalTypes = document.getElementById('modal-types');
const modalExp = document.getElementById('modal-exp');
const modalHeight = document.getElementById('modal-height');
const modalWeight = document.getElementById('modal-weight');
const modalDetails = document.getElementById('modal-details');
const modalAbilities = document.getElementById('modal-abilities');
const modalMoves = document.getElementById('modal-moves');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Navigation state
let currentPrevId = null;
let currentNextId = null;
let isModalOpen = false;

modalElement.addEventListener('shown.bs.modal', () => { isModalOpen = true; });
modalElement.addEventListener('hidden.bs.modal', () => { isModalOpen = false; });

/**
 * Fetch and render the catalog list from the student's Express API
 */
async function loadCatalog(searchQuery = '') {
  showLoading(true);
  hideError();

  try {
    const endpoint = searchQuery
      ? `/api?search=${encodeURIComponent(searchQuery)}`
      : '/api';

    const response = await fetch(endpoint);
    if (response.status === 404) {
      showError(`No character matched "${searchQuery}".`);
      return;
    }
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.results || []);

    if (list.length === 0) {
      showError(searchQuery ? `No character found matching "${searchQuery}".` : 'The catalog is empty.');
      return;
    }

    renderCatalog(list, searchQuery);
  } catch (err) {
    showError(`Failed to communicate with backend API: ${err.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Render catalog cards inside the scrollable container
 */
function renderCatalog(characterList, searchQuery) {
  catalogSection.classList.remove('d-none');
  catalogGrid.innerHTML = '';
  catalogCount.textContent = `${characterList.length} entries`;
  catalogSubtitle.textContent = searchQuery ? `Search Results for "${searchQuery}"` : 'All Characters';

  characterList.forEach((character) => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'card h-100 char-card bg-dark text-light border-secondary-subtle text-center p-2';
    card.addEventListener('click', () => openDetail(character.id || character.name));

    const img = document.createElement('img');
    img.className = 'card-img-top char-card-img mx-auto my-2';
    img.alt = character.name;
    img.src = character.image || DEFAULT_IMAGE;
    img.onerror = () => { img.onerror = null; img.src = DEFAULT_IMAGE; };

    const body = document.createElement('div');
    body.className = 'card-body p-1';

    const idBadge = document.createElement('span');
    idBadge.className = 'badge bg-secondary-subtle text-secondary-emphasis mb-1';
    idBadge.textContent = character.id ? `#${String(character.id).padStart(3, '0')}` : '';

    const title = document.createElement('h6');
    title.className = 'card-title text-capitalize mb-1 fw-bold text-truncate';
    title.textContent = character.name;

    body.append(idBadge, title);
    card.append(img, body);
    col.appendChild(card);
    catalogGrid.appendChild(col);
  });
}

/**
 * Fetch single Character detail and open/update modal
 */
async function openDetail(identifier) {
  if (identifier === null || identifier === undefined) return;

  try {
    const response = await fetch(`/api/${encodeURIComponent(identifier)}`);

    if (response.status === 404) {
      if (isModalOpen) characterModal.hide();
      showError(`Character "${identifier}" was not found.`);
      return;
    }

    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }

    const character = await response.json();
    populateModal(character);

    if (!isModalOpen) {
      characterModal.show();
    }
  } catch (err) {
    if (isModalOpen) characterModal.hide();
    showError(`Error loading character details: ${err.message}`);
  }
}

/**
 * Populate modal DOM elements with backend payload
 */
function populateModal(character) {
  modalName.textContent = character.name || 'Unknown';
  modalId.textContent = character.id ? `#${String(character.id).padStart(3, '0')}` : '#???';

  modalImg.src = character.image || DEFAULT_IMAGE;
  modalImg.onerror = () => { modalImg.onerror = null; modalImg.src = DEFAULT_IMAGE; };

  modalExp.textContent = formatTimelineYear(character.born);
  modalHeight.textContent = formatMeasurement(character.height, 'cm');
  modalWeight.textContent = formatMeasurement(character.mass, 'kg');

  // Render species and gender
  modalTypes.innerHTML = '';
  [character.species, character.gender].filter(Boolean).forEach((detail) => {
    const badge = document.createElement('span');
    badge.className = 'badge bg-warning text-dark text-uppercase px-3 py-2';
    badge.textContent = detail;
    modalTypes.appendChild(badge);
  });

  renderCharacterDetails(character);

  // Render Abilities
  modalAbilities.innerHTML = '';
  (character.affiliations || []).forEach((affiliation) => {
    const badge = document.createElement('span');
    badge.className = 'badge bg-secondary text-capitalize';
    badge.textContent = affiliation;
    modalAbilities.appendChild(badge);
  });
  (character.formerAffiliations || []).forEach((affiliation) => {
    const badge = document.createElement('span');
    badge.className = 'badge border border-secondary text-light';
    badge.textContent = `Former: ${affiliation}`;
    modalAbilities.appendChild(badge);
  });
  if (modalAbilities.childElementCount === 0) {
    modalAbilities.textContent = 'No affiliations listed';
  }

  // Render Moves
  modalMoves.innerHTML = '';
  renderRelatedCharacters('Master', character.masters, modalMoves);
  renderRelatedCharacters('Apprentice', character.apprentices, modalMoves);
  if (modalMoves.childElementCount === 0) {
    modalMoves.textContent = 'No masters or apprentices listed';
  }

  // Bind Circular Navigation IDs provided by Backend
  currentPrevId = character.prevId ?? null;
  currentNextId = character.nextId ?? null;

  prevBtn.disabled = currentPrevId === null;
  nextBtn.disabled = currentNextId === null;
}

function formatTimelineYear(year) {
  if (year === null || year === undefined || year === '' || year === 'unknown') {
    return '-';
  }

  const numericYear = Number(year);
  if (Number.isFinite(numericYear)) {
    return numericYear < 0 ? `${Math.abs(numericYear)} BBY` : `${numericYear} ABY`;
  }

  return String(year);
}

function formatMeasurement(value, unit) {
  if (value === null || value === undefined || value === '' || value === 'unknown') {
    return '-';
  }

  return `${value} ${unit}`;
}

function formatDetailValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function renderCharacterDetails(character) {
  modalDetails.replaceChildren();

  const details = [
    ['Homeworld', character.homeworld],
    ['Hair color', character.hairColor],
    ['Eye color', character.eyeColor],
    ['Skin color', character.skinColor],
    ['Cybernetics', character.cybernetics],
    ['Equipment', character.equipment],
    ['Era', character.era],
    ['Manufacturer', character.manufacturer],
    ['Model', character.model],
    ['Born location', character.bornLocation],
    ['Died', character.died ? formatTimelineYear(character.died) : ''],
    ['Died location', character.diedLocation]
  ];

  details.forEach(([label, value]) => {
    const detailValue = formatDetailValue(value);
    if (!detailValue || detailValue.toLowerCase() === 'unknown') return;

    const line = document.createElement('p');
    line.className = 'mb-1';
    const heading = document.createElement('strong');
    heading.textContent = `${label}: `;
    line.append(heading, document.createTextNode(detailValue));
    modalDetails.appendChild(line);
  });

  if (typeof character.wiki === 'string' && /^https?:\/\//i.test(character.wiki)) {
    const line = document.createElement('p');
    line.className = 'mb-1';
    const heading = document.createElement('strong');
    heading.textContent = 'Wiki: ';
    const link = document.createElement('a');
    link.className = 'link-warning';
    link.href = character.wiki;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View page';
    line.append(heading, link);
    modalDetails.appendChild(line);
  }

  if (modalDetails.childElementCount === 0) {
    modalDetails.textContent = 'No additional details listed';
  }
}

function renderRelatedCharacters(label, characters = [], container) {
  characters.forEach((name) => {
    const badge = document.createElement('span');
    badge.className = 'badge border border-secondary text-light';
    badge.textContent = `${label}: ${name}`;
    container.appendChild(badge);
  });
}

// Event Listeners: Modal Left/Right Navigation
prevBtn.addEventListener('click', () => {
  if (currentPrevId !== null) openDetail(currentPrevId);
});

nextBtn.addEventListener('click', () => {
  if (currentNextId !== null) openDetail(currentNextId);
});

// Keyboard Arrow Navigation inside Modal
document.addEventListener('keydown', (e) => {
  if (!isModalOpen) return;
  if (e.key === 'ArrowLeft' && currentPrevId !== null) {
    openDetail(currentPrevId);
  } else if (e.key === 'ArrowRight' && currentNextId !== null) {
    openDetail(currentNextId);
  }
});

// Event Listeners: Search & Reset
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    clearSearchBtn.classList.remove('d-none');
    loadCatalog(query);
  } else {
    resetToFullCatalog();
  }
});

function resetToFullCatalog() {
  searchInput.value = '';
  clearSearchBtn.classList.add('d-none');
  loadCatalog();
}

clearSearchBtn.addEventListener('click', resetToFullCatalog);
errorResetBtn.addEventListener('click', resetToFullCatalog);
brandReset.addEventListener('click', (e) => {
  e.preventDefault();
  resetToFullCatalog();
});

// UI Helper Functions
function showLoading(isLoading) {
  loadingSpinner.classList.toggle('d-none', !isLoading);
  if (isLoading) catalogSection.classList.add('d-none');
}

function showError(msg) {
  catalogSection.classList.add('d-none');
  errorMessage.textContent = msg;
  errorView.classList.remove('d-none');
}

function hideError() {
  errorView.classList.add('d-none');
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => loadCatalog());