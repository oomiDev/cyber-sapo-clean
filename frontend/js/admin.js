// CYBER SAPO - Panel de Administración
const API_BASE_URL = 'http://localhost:3001/api';

let machinesData = [];
let gamesData = [];
let locationsData = [];
let businessTypesData = [];
let countriesData = [];
let citiesData = [];
let currentEditingLocation = null;
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let isGridView = true;

// Elementos DOM
const refreshAllBtn = document.getElementById('refresh-all');
const addMachineBtn = document.getElementById('add-machine');
const resetAllBtn = document.getElementById('reset-all');
const exportDataBtn = document.getElementById('export-data');
const machinesAdminList = document.getElementById('machines-admin-list');
const recentGamesList = document.getElementById('recent-games-list');
const machineModal = document.getElementById('machine-modal');
const machineForm = document.getElementById('machine-form');

// Elementos DOM para ubicaciones
const addLocationBtn = document.getElementById('add-location');
const addBusinessTypeBtn = document.getElementById('add-business-type');
const refreshLocationsBtn = document.getElementById('refresh-locations');
const exportLocationsBtn = document.getElementById('export-locations');
const locationsList = document.getElementById('locations-list');
const locationModal = document.getElementById('location-modal');
const locationForm = document.getElementById('location-form');
const businessTypeModal = document.getElementById('business-type-modal');
const businessTypeForm = document.getElementById('business-type-form');

// Elementos de filtros
const locationSearch = document.getElementById('location-search');
const countryFilter = document.getElementById('country-filter');
const cityFilter = document.getElementById('city-filter');
const businessTypeFilter = document.getElementById('business-type-filter');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

// Elementos de vista y paginación
const gridViewBtn = document.getElementById('grid-view');
const listViewBtn = document.getElementById('list-view');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const paginationPages = document.getElementById('pagination-pages');
const paginationInfo = document.getElementById('pagination-info');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
    setupEventListeners();
    loadAllData();
    
    // Actualización automática cada 30 segundos
    setInterval(loadAllData, 30000);
});

/**
 * Inicializar panel de administración
 */
function initializeAdmin() {
    console.log('🔧 Inicializando Panel de Administración CYBER SAPO');
    
    // Configurar tabs
    setupTabs();
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    refreshAllBtn.addEventListener('click', loadAllData);
    addMachineBtn.addEventListener('click', showAddMachineModal);
    resetAllBtn.addEventListener('click', resetAllMachines);
    exportDataBtn.addEventListener('click', exportData);
    
    // Eventos de ubicaciones
    addLocationBtn.addEventListener('click', showAddLocationModal);
    addBusinessTypeBtn.addEventListener('click', showAddBusinessTypeModal);
    refreshLocationsBtn.addEventListener('click', loadAllData);
    exportLocationsBtn.addEventListener('click', exportLocations);
    
    // Eventos de filtros
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    locationSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
    countryFilter.addEventListener('change', updateCityFilter);
    
    // Eventos de vista
    gridViewBtn.addEventListener('click', () => setViewMode('grid'));
    listViewBtn.addEventListener('click', () => setViewMode('list'));
    
    // Eventos de paginación
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
    
    // Modal events - máquinas
    document.querySelector('.modal-close').addEventListener('click', hideModal);
    document.getElementById('cancel-machine').addEventListener('click', hideModal);
    document.getElementById('save-machine').addEventListener('click', saveMachine);
    
    // Modal events - ubicaciones
    document.querySelector('.location-modal-close').addEventListener('click', hideLocationModal);
    document.getElementById('cancel-location').addEventListener('click', hideLocationModal);
    document.getElementById('save-location').addEventListener('click', saveLocation);
    
    // Modal events - tipos de negocio
    document.querySelector('.business-type-modal-close').addEventListener('click', hideBusinessTypeModal);
    document.getElementById('cancel-business-type').addEventListener('click', hideBusinessTypeModal);
    document.getElementById('save-business-type').addEventListener('click', saveBusinessType);
    
    // Cerrar modales al hacer clic fuera
    machineModal.addEventListener('click', (e) => {
        if (e.target === machineModal) {
            hideModal();
        }
    });
    
    locationModal.addEventListener('click', (e) => {
        if (e.target === locationModal) {
            hideLocationModal();
        }
    });
    
    businessTypeModal.addEventListener('click', (e) => {
        if (e.target === businessTypeModal) {
            hideBusinessTypeModal();
        }
    });
}

/**
 * Configurar sistema de tabs
 */
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Remover active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activar seleccionado
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

/**
 * Cargar todos los datos
 */
async function loadAllData() {
    try {
        console.log('🔄 Cargando datos del panel de administración...');
        
        await Promise.all([
            loadMachines(),
            loadGames(),
            loadLocations(),
            loadBusinessTypes(),
            loadCountries(),
            loadLocationStats()
        ]);
        
        updateOverviewStats();
        renderMachinesAdmin();
        renderRecentGames();
        updateGameStats();
        // Las ubicaciones se renderizan desde loadLocations()
        
        console.log('✅ Datos cargados correctamente');
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showNotification('Error cargando datos del panel', 'error');
    }
}

/**
 * Cargar máquinas
 */
async function loadMachines() {
    const response = await fetch(`${API_BASE_URL}/machines`);
    const data = await response.json();
    
    if (data.success && data.data) {
        machinesData = data.data;
    }
}

/**
 * Cargar partidas
 */
async function loadGames() {
    const response = await fetch(`${API_BASE_URL}/games`);
    const data = await response.json();
    
    if (data.success && data.data) {
        gamesData = data.data;
    }
}

/**
 * Cargar ubicaciones desde el backend con filtros y paginación
 */
async function loadLocations(page = 1) {
    try {
        showLoadingSpinner();
        
        const params = new URLSearchParams({
            page: page,
            limit: 20,
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE_URL}/locations?${params}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            locationsData = data.data;
            currentPage = data.pagination.page;
            totalPages = data.pagination.pages;
            
            renderLocations();
            updatePagination(data.pagination);
        }
    } catch (error) {
        console.error('Error cargando ubicaciones:', error);
        showNotification('Error cargando ubicaciones', 'error');
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Cargar tipos de negocio
 */
async function loadBusinessTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/business-types`);
        const data = await response.json();
        
        if (data.success && data.data) {
            businessTypesData = data.data;
            populateBusinessTypeSelects();
        }
    } catch (error) {
        console.error('Error cargando tipos de negocio:', error);
    }
}

/**
 * Cargar países
 */
async function loadCountries() {
    try {
        const response = await fetch(`${API_BASE_URL}/countries`);
        const data = await response.json();
        
        if (data.success && data.data) {
            countriesData = data.data;
            populateCountrySelect();
        }
    } catch (error) {
        console.error('Error cargando países:', error);
    }
}

/**
 * Cargar estadísticas de ubicaciones
 */
async function loadLocationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations/stats`);
        const data = await response.json();
        
        if (data.success && data.data) {
            updateLocationStats(data.data);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

/**
 * Actualizar estadísticas generales
 */
function updateOverviewStats() {
    const totalMachines = machinesData.length;
    const availableMachines = machinesData.filter(m => m.status === 'available').length;
    const occupiedMachines = machinesData.filter(m => m.status === 'occupied').length;
    const fullMachines = machinesData.filter(m => m.current_players >= m.max_players).length;
    const offlineMachines = machinesData.filter(m => m.status === 'offline').length;
    const totalPlayers = machinesData.reduce((sum, m) => sum + (m.current_players || 0), 0);
    
    document.getElementById('total-machines').textContent = totalMachines;
    document.getElementById('available-machines').textContent = availableMachines;
    document.getElementById('occupied-machines').textContent = occupiedMachines;
    document.getElementById('full-machines').textContent = fullMachines;
    document.getElementById('offline-machines').textContent = offlineMachines;
    document.getElementById('total-players').textContent = totalPlayers;
}

/**
 * Renderizar máquinas en el panel de admin
 */
function renderMachinesAdmin() {
    if (!machinesData || machinesData.length === 0) {
        machinesAdminList.innerHTML = '<p class="no-data">No hay máquinas registradas</p>';
        return;
    }
    
    let html = '';
    machinesData.forEach(machine => {
        html += renderMachineAdminCard(machine);
    });
    
    machinesAdminList.innerHTML = html;
}

/**
 * Renderizar tarjeta de máquina para admin
 */
function renderMachineAdminCard(machine) {
    const statusClass = getStatusClass(machine);
    const statusText = getStatusText(machine);
    
    return `
        <div class="machine-admin-card">
            <div class="machine-admin-header">
                <div class="machine-admin-name"> ${machine.name || 'Sin Nombre'}</div>
                <div class="machine-admin-status ${statusClass}">${statusText}</div>
            </div>
            <div class="machine-admin-info">
                <div><strong>ID:</strong> ${machine.id}</div>
                <div><strong>Ubicación:</strong> ${machine.location_name || 'N/A'}</div>
                <div><strong>Jugadores:</strong> ${machine.current_players || 0}/${machine.max_players || 4}</div>
                <div><strong>Estado:</strong> ${machine.status || 'unknown'}</div>
            </div>
            <div class="machine-admin-actions">
                <button class="admin-btn analytics" onclick="viewMachineAnalytics(${machine.id})">📈 Analytics</button>
                <button class="admin-btn success" onclick="setMachineStatus(${machine.id}, 'available')">✅ Disponible</button>
                <button class="admin-btn warning" onclick="setMachineStatus(${machine.id}, 'offline')">⚫ Offline</button>
                <button class="admin-btn info" onclick="resetMachine(${machine.id})">🔄 Reset</button>
                <button class="admin-btn danger" onclick="deleteMachine(${machine.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `;
}

/**
 * Renderizar partidas recientes
 */
function renderRecentGames() {
    if (!gamesData || gamesData.length === 0) {
        recentGamesList.innerHTML = '<p class="no-data">No hay partidas registradas</p>';
        return;
    }
    
    let html = '';
    gamesData.slice(0, 10).forEach(game => {
        const date = new Date(game.created_at).toLocaleString();
        html += `
            <div class="game-item">
                <div>
                    <strong>${game.player_name}</strong> - ${game.machine_name || 'Máquina N/A'}
                    <br><small>${date}</small>
                </div>
                <div class="game-score">${game.score || 0} pts</div>
            </div>
        `;
    });
    
    recentGamesList.innerHTML = html;
}

/**
 * Actualizar estadísticas de partidas
 */
function updateGameStats() {
    const today = new Date().toDateString();
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const gamesToday = gamesData.filter(g => new Date(g.created_at).toDateString() === today).length;
    const gamesWeek = gamesData.filter(g => new Date(g.created_at) >= thisWeek).length;
    const avgScore = gamesData.length > 0 ? Math.round(gamesData.reduce((sum, g) => sum + (g.score || 0), 0) / gamesData.length) : 0;
    const bestScore = gamesData.length > 0 ? Math.max(...gamesData.map(g => g.score || 0)) : 0;
    
    document.getElementById('games-today').textContent = gamesToday;
    document.getElementById('games-week').textContent = gamesWeek;
    document.getElementById('avg-score').textContent = avgScore;
    document.getElementById('best-score').textContent = bestScore;
}

/**
 * Cambiar estado de máquina
 */
async function setMachineStatus(machineId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/machines/${machineId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showNotification(`Estado de máquina actualizado a: ${status}`, 'success');
            loadAllData();
        } else {
            throw new Error('Error actualizando estado');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error actualizando estado de máquina', 'error');
    }
}

/**
 * Reiniciar máquina
 */
async function resetMachine(machineId) {
    if (!confirm('¿Estás seguro de reiniciar esta máquina?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/machines/${machineId}/reset`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Máquina reiniciada correctamente', 'success');
            loadAllData();
        } else {
            throw new Error('Error reiniciando máquina');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error reiniciando máquina', 'error');
    }
}

/**
 * Eliminar máquina
 */
async function deleteMachine(machineId) {
    if (!confirm('¿Estás seguro de eliminar esta máquina? Esta acción no se puede deshacer.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/machines/${machineId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Máquina eliminada correctamente', 'success');
            loadAllData();
        } else {
            throw new Error('Error eliminando máquina');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error eliminando máquina', 'error');
    }
}

/**
 * Reiniciar todas las máquinas
 */
async function resetAllMachines() {
    if (!confirm('¿Estás seguro de reiniciar TODAS las máquinas?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/machines/reset-all`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Todas las máquinas han sido reiniciadas', 'success');
            loadAllData();
        } else {
            throw new Error('Error reiniciando máquinas');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error reiniciando todas las máquinas', 'error');
    }
}

/**
 * Mostrar modal para agregar máquina
 */
function showAddMachineModal() {
    document.getElementById('modal-title').textContent = ' Agregar Nueva Máquina';
    
    // Llenar select de ubicaciones
    const locationSelect = document.getElementById('machine-location');
    locationSelect.innerHTML = '<option value="">Seleccionar ubicación...</option>';
    locationsData.forEach(location => {
        locationSelect.innerHTML += `<option value="${location.id}">${location.name}</option>`;
    });
    
    // Limpiar formulario
    machineForm.reset();
    
    machineModal.style.display = 'block';
}

/**
 * Ocultar modal
 */
function hideModal() {
    machineModal.style.display = 'none';
}

/**
 * Guardar máquina
 */
async function saveMachine() {
    const formData = new FormData(machineForm);
    const machineData = {
        name: document.getElementById('machine-name').value,
        location_id: document.getElementById('machine-location').value,
        max_players: parseInt(document.getElementById('machine-max-players').value),
        status: document.getElementById('machine-status').value
    };
    
    if (!machineData.name || !machineData.location_id) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/machines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(machineData)
        });
        
        if (response.ok) {
            showNotification('Máquina agregada correctamente', 'success');
            hideModal();
            loadAllData();
        } else {
            throw new Error('Error agregando máquina');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error agregando máquina', 'error');
    }
}

/**
 * Exportar datos
 */
function exportData() {
    const data = {
        machines: machinesData,
        games: gamesData,
        locations: locationsData,
        exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyber-sapo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Datos exportados correctamente', 'success');
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(45deg, #00ff88, #00cc66)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(45deg, #ffaa00, #ff8800)';
            break;
        default:
            notification.style.background = 'linear-gradient(45deg, #00aaff, #0088cc)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// ========================================
// FUNCIONES DE UTILIDAD Y FILTROS
// ========================================

/**
 * Mostrar spinner de carga
 */
function showLoadingSpinner() {
    locationsList.innerHTML = '<div class="loading-spinner"> Cargando ubicaciones...</div>';
    locationsList.classList.add('loading');
}

/**
 * Ocultar spinner de carga
 */
function hideLoadingSpinner() {
    locationsList.classList.remove('loading');
}

/**
 * Poblar selects de tipos de negocio
 */
function populateBusinessTypeSelects() {
    const selects = [businessTypeFilter, document.getElementById('location-business-type')];
    
    selects.forEach(select => {
        if (!select) return;
        
        // Limpiar opciones existentes (excepto la primera)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Agregar tipos de negocio
        businessTypesData.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = `${type.icon} ${type.description || type.name}`;
            select.appendChild(option);
        });
    });
}

/**
 * Poblar select de países
 */
function populateCountrySelect() {
    countryFilter.innerHTML = '<option value="">Todos los países</option>';
    
    countriesData.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

/**
 * Actualizar select de ciudades según país seleccionado
 */
async function updateCityFilter() {
    const selectedCountry = countryFilter.value;
    
    try {
        const params = selectedCountry ? `?country=${encodeURIComponent(selectedCountry)}` : '';
        const response = await fetch(`${API_BASE_URL}/cities${params}`);
        const data = await response.json();
        
        cityFilter.innerHTML = '<option value="">Todas las ciudades</option>';
        
        if (data.success && data.data) {
            data.data.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                cityFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando ciudades:', error);
    }
}

/**
 * Aplicar filtros
 */
function applyFilters() {
    currentFilters = {
        search: locationSearch.value.trim(),
        country: countryFilter.value,
        city: cityFilter.value,
        business_type: businessTypeFilter.value
    };
    
    // Limpiar filtros vacíos
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    currentPage = 1;
    loadLocations(1);
}

/**
 * Limpiar filtros
 */
function clearFilters() {
    locationSearch.value = '';
    countryFilter.value = '';
    cityFilter.value = '';
    businessTypeFilter.value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadLocations(1);
}

/**
 * Cambiar modo de vista
 */
function setViewMode(mode) {
    isGridView = mode === 'grid';
    
    if (isGridView) {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        locationsList.classList.remove('list-view');
    } else {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        locationsList.classList.add('list-view');
    }
}

/**
 * Cambiar página
 */
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadLocations(page);
}

/**
 * Actualizar paginación
 */
function updatePagination(pagination) {
    const { page, limit, total, pages } = pagination;
    
    // Actualizar información
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    paginationInfo.textContent = `Mostrando ${start}-${end} de ${total} ubicaciones`;
    
    // Actualizar botones
    prevPageBtn.disabled = page <= 1;
    nextPageBtn.disabled = page >= pages;
    
    // Actualizar páginas
    paginationPages.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-page ${i === page ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => changePage(i));
        paginationPages.appendChild(pageBtn);
    }
}

/**
 * Actualizar estadísticas de ubicaciones
 */
function updateLocationStats(stats) {
    document.getElementById('total-locations').textContent = stats.total?.[0]?.count || 0;
    document.getElementById('active-countries').textContent = stats.by_country?.length || 0;
    document.getElementById('business-types-count').textContent = stats.by_type?.length || 0;
}

/**
 * Exportar ubicaciones
 */
function exportLocations() {
    const exportData = {
        locations: locationsData,
        business_types: businessTypesData,
        countries: countriesData,
        filters: currentFilters,
        exported_at: new Date().toISOString(),
        total_locations: locationsData.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyber-sapo-ubicaciones-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Ubicaciones exportadas correctamente', 'success');
}

// ========================================
// GESTIÓN DE UBICACIONES
// ========================================

/**
 * Renderizar ubicaciones
 */
function renderLocations() {
    if (!locationsData || locationsData.length === 0) {
        locationsList.innerHTML = '<p class="no-data">No hay ubicaciones registradas</p>';
        return;
    }
    
    let html = '';
    locationsData.forEach(location => {
        html += renderLocationCard(location);
    });
    
    locationsList.innerHTML = html;
}

/**
 * Renderizar tarjeta de ubicación
 */
function renderLocationCard(location) {
    const machineCount = location.machine_count || 0;
    const availableMachines = location.available_machines || 0;
    const occupiedMachines = location.occupied_machines || 0;
    const offlineMachines = location.offline_machines || 0;
    
    const businessTypeIcon = location.business_type_icon || '';
    const businessTypeDesc = location.business_type_description || location.business_type;
    
    return `
        <div class="location-card">
            <div class="location-type-badge">${businessTypeIcon} ${businessTypeDesc}</div>
            <div class="location-header">
                <div class="location-name">
                    <span class="location-country-flag"></span>
                    ${location.name}
                </div>
                <div class="location-stats">
                    <span class="location-stat">${machineCount} máquinas</span>
                </div>
            </div>
            <div class="location-info">
                <div class="location-info-item">
                    <span class="icon"></span>
                    <span>${location.city}, ${location.country}</span>
                </div>
                ${location.address ? `
                    <div class="location-info-item">
                        <span class="icon"></span>
                        <span>${location.address}</span>
                    </div>
                ` : ''}
                ${location.phone ? `
                    <div class="location-info-item">
                        <span class="icon"></span>
                        <span>${location.phone}</span>
                    </div>
                ` : ''}
                ${location.email ? `
                    <div class="location-info-item">
                        <span class="icon"></span>
                        <span>${location.email}</span>
                    </div>
                ` : ''}
                ${location.description ? `
                    <div class="location-info-item">
                        <span class="icon"></span>
                        <span>${location.description}</span>
                    </div>
                ` : ''}
                <div class="location-info-item">
                    <span class="icon"></span>
                    <span>Disponibles: ${availableMachines} | Ocupadas: ${occupiedMachines} | Offline: ${offlineMachines}</span>
                </div>
            </div>
            <div class="location-actions">
                <button class="admin-btn info" onclick="editLocation(${location.id})">✏️ Editar</button>
                <button class="admin-btn warning" onclick="viewLocationMachines(${location.id})">🎮 Ver Máquinas</button>
                <button class="admin-btn analytics" onclick="viewLocationAnalytics(${location.id})">📊 Analytics</button>
                <button class="admin-btn danger" onclick="deleteLocation(${location.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `;
}

/**
 * Mostrar modal para agregar ubicación
 */
function showAddLocationModal() {
    currentEditingLocation = null;
    document.getElementById('location-modal-title').textContent = ' Agregar Nueva Ubicación';
    
    // Limpiar formulario
    locationForm.reset();
    
    // Asegurar que los selects estén poblados
    populateBusinessTypeSelects();
    
    locationModal.style.display = 'block';
}

/**
 * Mostrar modal para editar ubicación
 */
function editLocation(locationId) {
    const location = locationsData.find(l => l.id == locationId);
    if (!location) {
        showNotification('Ubicación no encontrada', 'error');
        return;
    }
    
    currentEditingLocation = location;
    document.getElementById('location-modal-title').textContent = ' Editar Ubicación';
    
    // Llenar formulario con datos existentes
    document.getElementById('location-name-input').value = location.name || '';
    document.getElementById('location-country').value = location.country || '';
    document.getElementById('location-city').value = location.city || '';
    document.getElementById('location-address').value = location.address || '';
    document.getElementById('location-phone').value = location.phone || '';
    document.getElementById('location-email').value = location.email || '';
    document.getElementById('location-business-type').value = location.business_type || '';
    document.getElementById('location-description').value = location.description || '';
    
    locationModal.style.display = 'block';
}

/**
 * Ocultar modal de ubicación
 */
function hideLocationModal() {
    locationModal.style.display = 'none';
    currentEditingLocation = null;
}

/**
 * Guardar ubicación (crear o actualizar)
 */
async function saveLocation() {
    const locationData = {
        name: document.getElementById('location-name-input').value.trim(),
        country: document.getElementById('location-country').value.trim(),
        city: document.getElementById('location-city').value.trim(),
        address: document.getElementById('location-address').value.trim(),
        phone: document.getElementById('location-phone').value.trim(),
        email: document.getElementById('location-email').value.trim(),
        business_type: document.getElementById('location-business-type').value,
        description: document.getElementById('location-description').value.trim()
    };
    
    if (!locationData.name || !locationData.country || !locationData.city) {
        showNotification('Nombre, país y ciudad son requeridos', 'error');
        return;
    }
    
    try {
        let response;
        if (currentEditingLocation) {
            // Actualizar ubicación existente
            response = await fetch(`${API_BASE_URL}/locations/${currentEditingLocation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
            });
        } else {
            // Crear nueva ubicación
            response = await fetch(`${API_BASE_URL}/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
            });
        }
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification(result.message, 'success');
            hideLocationModal();
            loadLocations(currentPage); // Recargar ubicaciones
            loadMachines(); // Recargar máquinas para actualizar selects
            loadLocationStats(); // Actualizar estadísticas
        } else {
            showNotification(result.error || 'Error guardando ubicación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error guardando ubicación', 'error');
    }
}

/**
 * Eliminar ubicación
 */
async function deleteLocation(locationId) {
    const location = locationsData.find(l => l.id == locationId);
    if (!location) {
        showNotification('Ubicación no encontrada', 'error');
        return;
    }
    
    const machineCount = location.machine_count || 0;
    let confirmMessage = `¿Estás seguro de eliminar la ubicación "${location.name}"?`;
    
    if (machineCount > 0) {
        confirmMessage += `\n\n⚠️ ATENCIÓN: Esta ubicación tiene ${machineCount} máquina(s) asociada(s).`;
        confirmMessage += '\nNo se podrá eliminar hasta que muevas o elimines todas las máquinas.';
    }
    
    if (!confirm(confirmMessage)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/locations/${locationId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification(result.message, 'success');
            loadLocations(currentPage); // Recargar ubicaciones
            loadMachines(); // Recargar máquinas
            loadLocationStats(); // Actualizar estadísticas
        } else {
            showNotification(result.error || 'Error eliminando ubicación', 'error');
        }
    } catch (error) {
        console.error('Error eliminando ubicación:', error);
        showNotification('Error eliminando ubicación', 'error');
    }
}

// ========================================
// GESTIÓN DE TIPOS DE NEGOCIO
// ========================================

/**
 * Mostrar modal para agregar tipo de negocio
 */
function showAddBusinessTypeModal() {
    document.getElementById('business-type-modal-title').textContent = '🏪 Agregar Tipo de Negocio';
    
    // Limpiar formulario
    businessTypeForm.reset();
    
    businessTypeModal.style.display = 'block';
}

/**
 * Ocultar modal de tipo de negocio
 */
function hideBusinessTypeModal() {
    businessTypeModal.style.display = 'none';
}

/**
 * Guardar tipo de negocio
 */
async function saveBusinessType() {
    const businessTypeData = {
        name: document.getElementById('business-type-name').value.trim(),
        icon: document.getElementById('business-type-icon').value.trim(),
        description: document.getElementById('business-type-description').value.trim()
    };
    
    if (!businessTypeData.name || !businessTypeData.icon) {
        showNotification('Nombre e icono son requeridos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/business-types`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(businessTypeData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification(result.message, 'success');
            hideBusinessTypeModal();
            loadBusinessTypes(); // Recargar tipos de negocio
            loadLocationStats(); // Actualizar estadísticas
        } else {
            showNotification(result.error || 'Error guardando tipo de negocio', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error guardando tipo de negocio', 'error');
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Ver máquinas de una ubicación
 */
function viewLocationMachines(locationId) {
    const location = locationsData.find(l => l.id === locationId);
    if (!location) {
        showNotification('Ubicación no encontrada', 'error');
        return;
    }
    
    // Filtrar máquinas por ubicación
    const locationMachines = machinesData.filter(m => m.location_id === locationId);
    
    if (locationMachines.length === 0) {
        showNotification(`No hay máquinas registradas en ${location.name}`, 'info');
        return;
    }
    
    // Mostrar información de máquinas
    let machinesInfo = `Máquinas en ${location.name}:\n\n`;
    locationMachines.forEach(machine => {
        machinesInfo += `• ${machine.name} - Estado: ${machine.status}\n`;
    });
    
    alert(machinesInfo);
}

/**
 * Cargar todos los datos necesarios
 */
async function loadAllData() {
    try {
        showNotification('Actualizando datos...', 'info');
        
        await Promise.all([
            loadLocations(currentPage),
            loadBusinessTypes(),
            loadCountries(),
            loadLocationStats(),
            loadMachines()
        ]);
        
        showNotification('Datos actualizados correctamente', 'success');
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error actualizando datos', 'error');
    }
}

// ========================================
// FUNCIONES DE ANALYTICS
// ========================================

/**
 * Ver analytics de una máquina específica
 */
function viewMachineAnalytics(machineId) {
    // Abrir página de analytics en nueva pestaña
    window.open(`machine-analytics.html?id=${machineId}`, '_blank');
}

/**
 * Ver analytics de una ubicación (todas sus máquinas)
 */
function viewLocationAnalytics(locationId) {
    const location = locationsData.find(l => l.id === locationId);
    if (!location) {
        showNotification('Ubicación no encontrada', 'error');
        return;
    }
    
    // Filtrar máquinas de esta ubicación
    const locationMachines = machinesData.filter(m => m.location_id === locationId);
    
    if (locationMachines.length === 0) {
        showNotification(`No hay máquinas en ${location.name} para mostrar analytics`, 'info');
        return;
    }
    
    // Si solo hay una máquina, ir directamente a sus analytics
    if (locationMachines.length === 1) {
        viewMachineAnalytics(locationMachines[0].id);
        return;
    }
    
    // Si hay múltiples máquinas, mostrar selector
    showMachineSelector(location, locationMachines);
}

/**
 * Mostrar selector de máquinas para analytics
 */
function showMachineSelector(location, machines) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📊 Seleccionar Máquina - ${location.name}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Selecciona una máquina para ver sus analytics detallados:</p>
                <div class="machine-selector-grid">
                    ${machines.map(machine => `
                        <div class="machine-selector-card" onclick="viewMachineAnalytics(${machine.id}); this.closest('.modal-overlay').remove();">
                            <div class="machine-name">${machine.name}</div>
                            <div class="machine-status ${machine.status}">
                                <span class="status-indicator"></span>
                                ${getStatusText(machine.status)}
                            </div>
                            <div class="machine-stats">
                                <small>${machine.total_games || 0} partidas • €${(machine.total_revenue || 0).toFixed(2)}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Obtener texto de estado de máquina
 */
function getStatusText(status) {
    const statusMap = {
        'available': 'Disponible',
        'occupied': 'Ocupada',
        'offline': 'Fuera de línea'
    };
    return statusMap[status] || status;
}

/**
 * Ver máquinas de una ubicación
 */
function viewLocationMachines(locationId) {
    const location = locationsData.find(l => l.id == locationId);
    if (!location) {
        showNotification('Ubicación no encontrada', 'error');
        return;
    }
    
    // Filtrar máquinas de esta ubicación
    const locationMachines = machinesData.filter(m => m.location_id == locationId);
    
    if (locationMachines.length === 0) {
        showNotification(`La ubicación "${location.name}" no tiene máquinas registradas`, 'info');
        return;
    }
    
    // Primero asegurarse de que las máquinas estén cargadas
    if (!document.querySelector('.machines-grid')) {
        // Si no hay grid de máquinas, cargarlas primero
        loadMachines().then(() => {
            // Una vez cargadas, mostrar las de esta ubicación
            showLocationMachinesModal(location, locationMachines);
        });
    } else {
        // Si ya están cargadas, mostrar directamente
        showLocationMachinesModal(location, locationMachines);
    }
}

/**
 * Mostrar modal con máquinas de una ubicación específica
 */
function showLocationMachinesModal(location, machines) {
    // Crear modal para mostrar máquinas
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1200px; width: 90%;">
            <div class="modal-header">
                <h3>🎮 Máquinas de ${location.name}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="location-info-summary">
                    <p><strong>📍 Ubicación:</strong> ${location.address}</p>
                    <p><strong>🏢 Tipo:</strong> ${location.business_type}</p>
                    <p><strong>🎰 Total de máquinas:</strong> ${machines.length}</p>
                </div>
                <div class="machines-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                    ${machines.map(machine => createMachineCard(machine, location)).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="admin-btn secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    showNotification(`Mostrando ${machines.length} máquina(s) de "${location.name}"`, 'success');
}

/**
 * Crear tarjeta de máquina para el modal
 */
function createMachineCard(machine, location) {
    const statusClass = getStatusClass(machine);
    const statusText = getStatusText(machine);
    
    return `
        <div class="machine-admin-card ${statusClass}">
            <div class="machine-admin-header">
                <h4>${machine.name}</h4>
                <span class="machine-status ${statusClass}">${statusText}</span>
            </div>
            <div class="machine-admin-info">
                <div><strong>ID:</strong> ${machine.id}</div>
                <div><strong>Ubicación:</strong> ${location.name}</div>
                <div><strong>Partidas:</strong> ${machine.total_games || 0}</div>
                <div><strong>Recaudación:</strong> €${(machine.total_revenue || 0).toFixed(2)}</div>
                <div><strong>Estado:</strong> ${statusText}</div>
            </div>
            <div class="machine-admin-actions">
                <button class="admin-btn analytics" onclick="viewMachineAnalytics(${machine.id}); this.closest('.modal-overlay').remove();">📈 Analytics</button>
                <button class="admin-btn success" onclick="setMachineStatus(${machine.id}, 'available')">✅ Disponible</button>
                <button class="admin-btn warning" onclick="setMachineStatus(${machine.id}, 'offline')">⚫ Offline</button>
                <button class="admin-btn info" onclick="resetMachine(${machine.id})">🔄 Reset</button>
                <button class="admin-btn danger" onclick="deleteMachine(${machine.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `;
}

/**
 * Utilidades
 */
function getStatusClass(machine) {
    if (machine.status === 'offline') return 'offline';
    if (machine.current_players >= machine.max_players) return 'full';
    if (machine.current_players > 0) return 'occupied';
    return 'available';
}

function getStatusText(machine) {
    if (machine.status === 'offline') return 'Fuera de línea';
    if (machine.current_players >= machine.max_players) return 'Completa';
    if (machine.current_players > 0) return 'Ocupada';
    return 'Disponible';
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .no-data {
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
        padding: 2rem;
    }
`;
document.head.appendChild(style);
