// ========================================
// ANALYTICS PAGE FUNCTIONALITY
// ========================================

const API_BASE_URL = 'http://localhost:3001/api';

// Variables globales
let currentMachineId = null;
let currentPeriod = '30d';
let analyticsData = null;
let charts = {};

// Elementos DOM
const loadingState = document.getElementById('loading-state');
const analyticsContent = document.getElementById('analytics-content');
const periodSelector = document.getElementById('period-selector');
const refreshBtn = document.getElementById('refresh-analytics');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Obtener ID de máquina de la URL
    const urlParams = new URLSearchParams(window.location.search);
    currentMachineId = urlParams.get('id');
    
    if (!currentMachineId) {
        showError('ID de máquina no especificado');
        return;
    }
    
    // Event listeners
    periodSelector.addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        loadAnalytics();
    });
    
    refreshBtn.addEventListener('click', loadAnalytics);
    
    // Cargar datos iniciales
    loadAnalytics();
});

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================

async function loadAnalytics() {
    try {
        showLoading();
        
        // Cargar información básica de la máquina
        const machineResponse = await fetch(`${API_BASE_URL}/machines/${currentMachineId}`);
        const machineData = await machineResponse.json();
        
        if (!machineData.success) {
            throw new Error(machineData.error || 'Error cargando información de máquina');
        }
        
        // Cargar estadísticas de analytics
        const statsResponse = await fetch(`${API_BASE_URL}/machines/${currentMachineId}/stats?period=${currentPeriod}`);
        const statsData = await statsResponse.json();
        
        if (!statsData.success) {
            throw new Error(statsData.error || 'Error cargando estadísticas');
        }
        
        analyticsData = {
            machine: machineData.data,
            stats: statsData.data
        };
        
        renderAnalytics();
        hideLoading();
        
    } catch (error) {
        console.error('Error cargando analytics:', error);
        showError(error.message);
    }
}

// ========================================
// FUNCIONES DE RENDERIZADO
// ========================================

function renderAnalytics() {
    if (!analyticsData) return;
    
    const { machine, stats } = analyticsData;
    
    // Actualizar información de la máquina
    updateMachineInfo(machine);
    
    // Actualizar KPIs
    updateKPIs(stats.general[0] || {});
    
    // Renderizar gráficas
    renderCharts(stats);
    
    // Renderizar tablas
    renderTables(stats);
    
    // Actualizar métricas adicionales
    updateMetrics(stats.general[0] || {});
    
    analyticsContent.classList.add('fade-in');
}

function updateMachineInfo(machine) {
    document.getElementById('machine-name').textContent = machine.name;
    document.getElementById('machine-breadcrumb').textContent = machine.name;
    document.getElementById('machine-location').textContent = `${machine.location_name}, ${machine.city}, ${machine.country}`;
    
    const statusElement = document.getElementById('machine-status');
    statusElement.className = `machine-status ${machine.status}`;
    statusElement.querySelector('.status-text').textContent = getStatusText(machine.status);
}

function updateKPIs(generalStats) {
    // Ingresos totales
    document.getElementById('total-revenue').textContent = `€${(generalStats.total_revenue || 0).toFixed(2)}`;
    
    // Partidas jugadas
    document.getElementById('total-games').textContent = generalStats.total_games || 0;
    
    // Tiempo de juego
    const totalHours = Math.round((generalStats.total_playtime || 0) / 3600);
    document.getElementById('total-playtime').textContent = `${totalHours}h`;
    
    // Ingreso promedio
    document.getElementById('avg-revenue').textContent = `€${(generalStats.avg_revenue || 0).toFixed(2)}`;
    
    // TODO: Calcular cambios porcentuales comparando con período anterior
    // Por ahora mostramos valores estáticos
    document.getElementById('revenue-change').textContent = '+12.5%';
    document.getElementById('games-change').textContent = '+8';
    document.getElementById('playtime-change').textContent = '+2h';
    document.getElementById('avg-revenue-change').textContent = '+€0.15';
}

function renderCharts(stats) {
    // Destruir gráficas existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
    
    // Gráfica de tendencia de ingresos
    renderRevenueTrendChart(stats.daily_revenue || []);
    
    // Heatmap de horas pico
    renderHourlyHeatmapChart(stats.hourly_distribution || []);
    
    // Distribución semanal
    renderWeeklyDistributionChart(stats.weekly_distribution || []);
    
    // Tipos de juego
    renderGameTypesChart(stats.game_type_distribution || []);
}

function renderRevenueTrendChart(data) {
    const ctx = document.getElementById('revenue-trend-chart').getContext('2d');
    
    const labels = data.map(item => formatDate(item.date));
    const revenues = data.map(item => item.revenue);
    const games = data.map(item => item.games);
    
    charts.revenueTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos (€)',
                data: revenues,
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            }, {
                label: 'Partidas',
                data: games,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: { 
                        color: '#00ff88',
                        callback: function(value) { return '€' + value.toFixed(2); }
                    },
                    grid: { color: 'rgba(0, 255, 136, 0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: '#ffc107' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function renderHourlyHeatmapChart(data) {
    const ctx = document.getElementById('hourly-heatmap-chart').getContext('2d');
    
    // Crear array de 24 horas
    const hourlyData = new Array(24).fill(0);
    data.forEach(item => {
        hourlyData[item.hour] = item.games;
    });
    
    const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
    
    charts.hourlyHeatmap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Partidas por Hora',
                data: hourlyData,
                backgroundColor: hourlyData.map(value => {
                    const intensity = Math.min(value / Math.max(...hourlyData), 1);
                    return `rgba(0, 255, 136, ${0.3 + intensity * 0.7})`;
                }),
                borderColor: '#00ff88',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function renderWeeklyDistributionChart(data) {
    const ctx = document.getElementById('weekly-distribution-chart').getContext('2d');
    
    const labels = data.map(item => item.day_name);
    const games = data.map(item => item.games);
    const revenues = data.map(item => item.revenue);
    
    charts.weeklyDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Partidas por Día',
                data: games,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(0, 255, 136, 0.8)'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff' }
                }
            }
        }
    });
}

function renderGameTypesChart(data) {
    const ctx = document.getElementById('game-types-chart').getContext('2d');
    
    const labels = data.map(item => capitalizeFirst(item.game_type));
    const games = data.map(item => item.games);
    const revenues = data.map(item => item.revenue);
    
    charts.gameTypes = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                label: 'Partidas por Tipo',
                data: games,
                backgroundColor: [
                    'rgba(0, 255, 136, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff' }
                }
            },
            scales: {
                r: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function renderTables(stats) {
    // Tabla de partidas recientes
    renderRecentGamesTable(stats.recent_games || []);
    
    // Tabla de partidas más largas
    renderLongestGamesTable(stats.longest_games || []);
}

function renderRecentGamesTable(games) {
    const tbody = document.querySelector('#recent-games-table tbody');
    tbody.innerHTML = '';
    
    games.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(game.started_at)}</td>
            <td>${game.players_count}</td>
            <td><span class="game-type-badge">${capitalizeFirst(game.game_type)}</span></td>
            <td>${formatDuration(game.duration_seconds)}</td>
            <td>€${game.revenue.toFixed(2)}</td>
            <td>${game.winner_score?.toLocaleString() || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderLongestGamesTable(games) {
    const tbody = document.querySelector('#longest-games-table tbody');
    tbody.innerHTML = '';
    
    games.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(game.started_at)}</td>
            <td><strong>${formatDuration(game.duration_seconds)}</strong></td>
            <td>${game.players_count}</td>
            <td><span class="game-type-badge">${capitalizeFirst(game.game_type)}</span></td>
            <td>${game.winner_score?.toLocaleString() || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateMetrics(generalStats) {
    // Rendimiento promedio
    document.getElementById('avg-players').textContent = (generalStats.avg_players || 0).toFixed(1);
    document.getElementById('avg-duration').textContent = formatDuration(generalStats.avg_duration || 0);
    
    // Calcular ingresos por hora
    const totalHours = (generalStats.total_playtime || 0) / 3600;
    const revenuePerHour = totalHours > 0 ? (generalStats.total_revenue || 0) / totalHours : 0;
    document.getElementById('revenue-per-hour').textContent = `€${revenuePerHour.toFixed(2)}`;
    
    // Estadísticas del período
    document.getElementById('first-game').textContent = generalStats.first_game ? formatDate(generalStats.first_game) : '-';
    document.getElementById('last-game').textContent = generalStats.last_game ? formatDate(generalStats.last_game) : '-';
    
    // Calcular días activos (aproximado)
    const activeDays = analyticsData.stats.daily_revenue ? analyticsData.stats.daily_revenue.length : 0;
    document.getElementById('active-days').textContent = activeDays;
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

function showLoading() {
    loadingState.style.display = 'flex';
    analyticsContent.style.display = 'none';
}

function hideLoading() {
    loadingState.style.display = 'none';
    analyticsContent.style.display = 'block';
}

function showError(message) {
    loadingState.innerHTML = `
        <div class="error-container">
            <div class="error-message">
                <h3>❌ Error</h3>
                <p>${message}</p>
                <button onclick="window.history.back()" class="admin-btn info">← Volver</button>
            </div>
        </div>
    `;
}

function getStatusText(status) {
    const statusMap = {
        'available': 'Disponible',
        'occupied': 'Ocupada',
        'offline': 'Fuera de línea'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(seconds) {
    if (!seconds) return '0 min';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
        return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
        return `${minutes} min`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Agregar estilos dinámicos para badges
const style = document.createElement('style');
style.textContent = `
    .game-type-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
        background: rgba(0, 255, 136, 0.2);
        color: #00ff88;
        border: 1px solid rgba(0, 255, 136, 0.5);
    }
    
    .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 400px;
    }
    
    .error-message {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #dc3545;
        border-radius: 10px;
        padding: 30px;
        text-align: center;
        color: #fff;
    }
    
    .error-message h3 {
        color: #dc3545;
        margin: 0 0 15px 0;
    }
    
    .error-message p {
        margin: 0 0 20px 0;
        color: #888;
    }
`;
document.head.appendChild(style);
