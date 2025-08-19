document.addEventListener('DOMContentLoaded', () => {
    let charts = {};

    const inicializarApp = () => {
        inicializarFechas();
        cargarFiltros();
        cargarDatos();
        setInterval(cargarDatos, 30000); // Auto-refresh

        document.getElementById('aplicarFiltros').addEventListener('click', cargarDatos);
        document.querySelector('.btn-refresh').addEventListener('click', cargarDatos);
    };

    const inicializarFechas = () => {
        const hoy = new Date();
        const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];
        document.getElementById('fechaInicio').value = hace7Dias.toISOString().split('T')[0];
    };

    const cargarFiltros = async () => {
        try {
            const response = await fetch('/api/locales/regiones');
            if (!response.ok) return;
            const regiones = await response.json();
            const regionFilter = document.getElementById('regionFilter');
            regionFilter.innerHTML = '<option value="">Todas las regiones</option>';
            regiones.forEach(region => {
                regionFilter.innerHTML += `<option value="${region}">${region}</option>`;
            });
        } catch (error) {
            console.error('Error cargando filtros de región:', error);
        }
    };

    const cargarDatos = async () => {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.opacity = '1';
        loadingOverlay.style.visibility = 'visible';

        try {
            const params = new URLSearchParams({
                fechaInicio: document.getElementById('fechaInicio').value,
                fechaFin: document.getElementById('fechaFin').value,
                region: document.getElementById('regionFilter').value
            });
            const response = await fetch(`/api/analytics/dashboard?${params}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error del servidor');

            actualizarMetricas(data.metricas);
            actualizarGraficas(data.graficas, data.maquinas, data.topMaquinas);

        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
            alert('No se pudieron cargar los datos. Intente de nuevo.');
        } finally {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.visibility = 'hidden';
        }
    };

    const actualizarMetricas = (metricas) => {
        document.getElementById('totalIngresos').textContent = `€${(metricas.ingresos || 0).toFixed(2)}`;
        document.getElementById('totalPulsos').textContent = (metricas.pulsos || 0).toLocaleString();
        document.getElementById('totalMaquinas').textContent = `${metricas.maquinasActivas || 0} / ${metricas.totalMaquinas || 0}`;
        document.getElementById('ingresoPromedio').textContent = `€${(metricas.ingresoPromedio || 0).toFixed(2)}`;
    };

    const actualizarGraficas = (graficas, maquinas, topMaquinas) => {
        renderizarGrafico(charts, 'tendenciaIngresosChart', 'line', {
            labels: graficas.tendencia.map(d => moment(d.fecha).format('DD/MM')),
            datasets: [{
                label: 'Ingresos (€)',
                data: graficas.tendencia.map(d => d.ingresos),
                borderColor: '#0d6efd', tension: 0.3
            }]
        });

        renderizarGrafico(charts, 'distribucionHorariaChart', 'bar', {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Pulsos por Hora',
                data: Array.from({ length: 24 }, (_, i) => graficas.distribucionHoraria.find(d => d.hora === i)?.pulsos || 0),
                backgroundColor: 'rgba(13, 110, 253, 0.5)'
            }]
        });

        renderizarGrafico(charts, 'ingresosPorRegionChart', 'doughnut', {
            labels: graficas.ingresosPorRegion.map(r => r.region),
            datasets: [{
                data: graficas.ingresosPorRegion.map(r => r.ingresos),
                backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d']
            }]
        });

        renderizarGrafico(charts, 'estadoMaquinasChart', 'pie', {
            labels: maquinas.distribucion.map(e => e.estado),
            datasets: [{
                data: maquinas.distribucion.map(e => e.cantidad),
                backgroundColor: maquinas.distribucion.map(e => ({ 'Activa': '#198754', 'Inactiva': '#6c757d', 'Mantenimiento': '#ffc107', 'Averiada': '#dc3545' }[e.estado]))
            }]
        });

        actualizarTabla('topMaquinasIngresos', topMaquinas.porIngresos, row => `<td>${row.codigo}</td><td>€${(row.totalIngresos || 0).toFixed(2)}</td>`);
        actualizarTabla('topMaquinasPulsos', topMaquinas.porPulsos, row => `<td>${row.codigo}</td><td>${(row.totalPulsos || 0).toLocaleString()}</td>`);
    };

    const renderizarGrafico = (chartInstance, canvasId, type, data) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (chartInstance[canvasId]) chartInstance[canvasId].destroy();
        chartInstance[canvasId] = new Chart(ctx, { type, data, options: { responsive: true, maintainAspectRatio: false } });
    };

    const actualizarTabla = (tbodyId, data, rowTemplate) => {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = data.length > 0 ? data.map(item => `<tr>${rowTemplate(item)}</tr>`).join('') : `<tr><td colspan="2" class="text-center">No hay datos</td></tr>`;
    };

    inicializarApp();
});
