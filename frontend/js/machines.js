// CYBER SAPO - Gestión de Máquinas
const API_BASE_URL = 'http://localhost:3001/api';

let machinesData = [];

// Elementos DOM
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const machinesContainer = document.getElementById('machines-container');
const refreshBtn = document.getElementById('refresh-btn');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadMachines();
    
    // Actualización automática cada 30 segundos
    setInterval(loadMachines, 30000);
    
    // Botón de actualización
    refreshBtn.addEventListener('click', loadMachines);
});

/**
 * Cargar máquinas desde la API
 */
async function loadMachines() {
    try {
        showLoading(true);
        hideError();

        const response = await fetch(`${API_BASE_URL}/machines`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            machinesData = data.data;
            renderMachines();
        } else {
            throw new Error('No se pudieron obtener las máquinas');
        }
    } catch (error) {
        console.error('Error cargando máquinas:', error);
        showError(`Error cargando máquinas: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Renderizar máquinas agrupadas por ubicación
 */
function renderMachines() {
    if (!machinesData || machinesData.length === 0) {
        machinesContainer.innerHTML = '<p class="no-machines">No hay máquinas disponibles</p>';
        return;
    }

    // Agrupar por ubicación
    const locationGroups = {};
    
    machinesData.forEach(machine => {
        const locationKey = machine.location_name || 'Ubicación Desconocida';
        
        if (!locationGroups[locationKey]) {
            locationGroups[locationKey] = {
                location: {
                    name: machine.location_name || 'Ubicación Desconocida',
                    address: machine.location_address || '',
                    city: machine.location_city || '',
                    phone: machine.location_phone || ''
                },
                machines: []
            };
        }
        
        locationGroups[locationKey].machines.push(machine);
    });

    // Renderizar cada grupo
    let html = '';
    Object.values(locationGroups).forEach(group => {
        html += renderLocationGroup(group);
    });

    machinesContainer.innerHTML = html;
}

/**
 * Renderizar un grupo de ubicación
 */
function renderLocationGroup(group) {
    const { location, machines } = group;
    
    let html = `
        <div class="location-section">
            <div class="location-header">
                <div>
                    <div class="location-name">📍 ${location.name}</div>
                    <div class="location-info">
                        ${location.address ? location.address + ', ' : ''}${location.city}
                        ${location.phone ? ' • 📞 ' + location.phone : ''}
                    </div>
                </div>
                <div class="location-info">
                    ${machines.length} máquina${machines.length !== 1 ? 's' : ''}
                </div>
            </div>
            <div class="machines-grid">
    `;

    machines.forEach(machine => {
        html += renderMachineCard(machine);
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Renderizar tarjeta de máquina
 */
function renderMachineCard(machine) {
    const statusClass = getStatusClass(machine);
    const statusText = getStatusText(machine);
    const statusBadgeClass = getStatusBadgeClass(machine);
    const canConnect = machine.status === 'available' || 
                      (machine.status === 'occupied' && machine.current_players < machine.max_players);

    return `
        <div class="machine-card ${statusClass}" ${canConnect ? `onclick="connectToMachine(${machine.id}, '${machine.name}')"` : ''}>
            <div class="machine-name">
                🎮 ${machine.name || 'Máquina Sin Nombre'}
            </div>
            <div class="machine-status">
                <div class="players-count">
                    👥 ${machine.current_players || 0}/${machine.max_players || 4} jugadores
                </div>
                <div class="status-badge ${statusBadgeClass}">
                    ${statusText}
                </div>
            </div>
            <button class="connect-btn" ${!canConnect ? 'disabled' : ''} 
                    onclick="event.stopPropagation(); ${canConnect ? `connectToMachine(${machine.id}, '${machine.name}')` : ''}">
                ${getButtonText(machine)}
            </button>
        </div>
    `;
}

/**
 * Obtener clase CSS según estado
 */
function getStatusClass(machine) {
    if (machine.status === 'offline') return 'offline';
    if (machine.current_players >= machine.max_players) return 'full';
    if (machine.current_players > 0) return 'occupied';
    return '';
}

/**
 * Obtener texto del estado
 */
function getStatusText(machine) {
    if (machine.status === 'offline') return 'Fuera de línea';
    if (machine.current_players >= machine.max_players) return 'Completa';
    if (machine.current_players > 0) return 'Ocupada';
    return 'Disponible';
}

/**
 * Obtener clase del badge de estado
 */
function getStatusBadgeClass(machine) {
    if (machine.status === 'offline') return 'offline';
    if (machine.current_players >= machine.max_players) return 'full';
    if (machine.current_players > 0) return 'occupied';
    return 'available';
}

/**
 * Obtener texto del botón
 */
function getButtonText(machine) {
    if (machine.status === 'offline') return '⚫ Fuera de línea';
    if (machine.current_players >= machine.max_players) return '🔴 Completa';
    return '🎮 Conectar';
}

/**
 * Conectar a una máquina
 */
async function connectToMachine(machineId, machineName) {
    const playerName = prompt(`¿Cómo te llamas?\n\nVas a conectarte a: ${machineName}`);
    
    if (!playerName || playerName.trim() === '') {
        alert('Necesitas introducir tu nombre para jugar');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/machines/${machineId}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName: playerName.trim()
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`¡Conectado exitosamente!\n\n${result.message}`);
            
            // Actualizar lista de máquinas
            loadMachines();
            
            // Redirigir al juego (opcional)
            if (confirm('¿Quieres ir al juego ahora?')) {
                window.location.href = `game.html?machine=${machineId}&player=${encodeURIComponent(playerName)}`;
            }
        } else {
            alert(`Error: ${result.error || 'No se pudo conectar a la máquina'}`);
        }
    } catch (error) {
        console.error('Error conectando a máquina:', error);
        alert('Error de conexión. Verifica que el backend esté funcionando.');
    }
}

/**
 * Mostrar/ocultar loading
 */
function showLoading(show) {
    loadingElement.style.display = show ? 'block' : 'none';
}

/**
 * Mostrar error
 */
function showError(message) {
    errorElement.innerHTML = `❌ ${message} <button onclick="loadMachines()">Reintentar</button>`;
    errorElement.style.display = 'block';
}

/**
 * Ocultar error
 */
function hideError() {
    errorElement.style.display = 'none';
}
