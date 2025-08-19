// Variables globales
let charts = {};
let datosActuales = {};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    inicializarFechas();
    cargarDatos();
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
    setInterval(cargarDatos, 30000); // Actualizar cada 30 segundos

    // Añadir event listener para el botón de aplicar filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);

    // Añadir event listener para el botón de refrescar
     const refreshButton = document.querySelector('.btn-refresh');
    if (refreshButton) {
        refreshButton.addEventListener('click', (e) => {
            e.preventDefault();
            cargarDatos();
        });
    }
});

// Configurar fechas por defecto
function inicializarFechas() {
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];
    document.getElementById('fechaInicio').value = hace7Dias.toISOString().split('T')[0];
}

// Actualizar reloj
function actualizarReloj() {
    const ahora = new Date();
    document.getElementById('currentTime').textContent = 
        ahora.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
}

// Cargar datos del dashboard
async function cargarDatos() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';
    try {
        const region = document.getElementById('filtroRegion').value;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;

        const url = new URL('/api/analytics/dashboard', window.location.origin);
        if (region) url.searchParams.append('region', region);
        if (fechaInicio) url.searchParams.append('fechaInicio', fechaInicio);
        if (fechaFin) url.searchParams.append('fechaFin', fechaFin);

        const response = await fetch(url);
        const datos = await response.json();
        
        if (response.ok) {
            datosActuales = datos;
            actualizarMetricas(datos.metricas);
            actualizarGraficas(datos.graficas);
            actualizarEstadoMaquinas(datos.maquinas);
            actualizarTablaTopMaquinas(datos.topMaquinas);
        } else {
            console.error('Error cargando datos:', datos.error);
            mostrarError('No se pudieron cargar los datos del dashboard.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión con el servidor.');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.textContent = mensaje;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Actualizar métricas principales
function actualizarMetricas(metricas) {
    document.getElementById('pulsosHoy').textContent = metricas.pulsos.toLocaleString();
    document.getElementById('ingresosHoy').textContent = '€' + (metricas.ingresos || 0).toFixed(2);
    document.getElementById('maquinasActivas').textContent = metricas.maquinasActivas;

    actualizarCrecimiento(document.getElementById('crecimientoPulsos'), metricas.crecimientoPulsos);
    actualizarCrecimiento(document.getElementById('crecimientoIngresos'), metricas.crecimientoIngresos);
}

// Actualizar indicadores de crecimiento
function actualizarCrecimiento(elemento, valor) {
    if (valor === null || valor === undefined) {
        elemento.style.display = 'none';
        return;
    }
    elemento.style.display = 'inline-block';
    const icono = valor >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const clase = valor >= 0 ? 'growth-positive' : 'growth-negative';

    elemento.className = 'growth ' + clase;
    elemento.innerHTML = `<i class="fas ${icono}"></i> ${Math.abs(valor).toFixed(1)}%`;
}

// Actualizar gráficas
function actualizarGraficas(graficas) {
    actualizarGraficaTendencia(graficas.tendencia);
    actualizarGraficaHoraria(graficas.distribucionHoraria);
}

// Gráfica de tendencia
function actualizarGraficaTendencia(datos) {
    const ctx = document.getElementById('chartTendencia').getContext('2d');
    if (charts.tendencia) charts.tendencia.destroy();

    const labels = datos.map(d => moment(d.fecha).format('DD/MM'));
    charts.tendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos (€)',
                data: datos.map(d => d.ingresos),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Pulsos',
                data: datos.map(d => d.pulsos),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Ingresos (€)' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Pulsos' }, grid: { drawOnChartArea: false } }
            }
        }
    });
}

// Gráfica de distribución horaria
function actualizarGraficaHoraria(datos) {
    const ctx = document.getElementById('chartHorario').getContext('2d');
    if (charts.horario) charts.horario.destroy();

    // Rellenar horas sin datos
    const datosCompletos = Array.from({ length: 24 }, (_, i) => {
        const datoExistente = datos.find(d => d.hora === i);
        return datoExistente || { hora: i, pulsos: 0 };
    });

    charts.horario = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datosCompletos.map(d => d.hora + ':00'),
            datasets: [{
                label: 'Pulsos por Hora',
                data: datosCompletos.map(d => d.pulsos),
                backgroundColor: 'rgba(37, 99, 235, 0.6)',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Número de Pulsos' } },
                x: { title: { display: true, text: 'Hora del Día' } }
            }
        }
    });
}

// Actualizar estado de máquinas
function actualizarEstadoMaquinas(maquinas) {
    const ctx = document.getElementById('chartEstados').getContext('2d');
    if (charts.estados) charts.estados.destroy();

    const labels = maquinas.distribucion.map(e => e.estado);
    const data = maquinas.distribucion.map(e => e.cantidad);
    const colores = {
        'Activa': '#10b981',
        'Inactiva': '#6b7280',
        'Mantenimiento': '#f59e0b',
        'Averiada': '#ef4444'
    };

    charts.estados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map(l => colores[l] || '#6b7280')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    document.getElementById('totalMaquinas').textContent = `de ${maquinas.total} total`;
}

// Actualizar tabla de top máquinas
function actualizarTablaTopMaquinas(ranking) {
    const tbody = document.getElementById('tablaTopMaquinas');
    if (!tbody) return;

    if (ranking.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay datos de máquinas disponibles</td></tr>';
        return;
    }

    tbody.innerHTML = ranking.map((maquina, index) => {
        const estadoClass = maquina.estado ? maquina.estado.toLowerCase() : 'inactiva';
        return `
        <tr>
            <td>
                <strong>#${index + 1} ${maquina.codigo}</strong>
                <br><small class="text-muted">${maquina.nombre || 'Sin nombre'}</small>
            </td>
            <td>${maquina.region || 'N/A'}</td>
            <td>${maquina.totalPulsos.toLocaleString()}</td>
            <td>€${(maquina.totalIngresos || 0).toFixed(2)}</td>
            <td>
                <span class="status-indicator status-${estadoClass}"></span>
                ${maquina.estado || 'Inactiva'}
            </td>
            <td>${maquina.ultimaActividad ? moment(maquina.ultimaActividad).fromNow() : 'Nunca'}</td>
        </tr>
    `}).join('');
}

// Aplicar filtros
function aplicarFiltros() {
    cargarDatos();
}
