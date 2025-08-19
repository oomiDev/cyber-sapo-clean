document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api/analytics';

    // Elementos del DOM
    const regionFilter = document.getElementById('region-filter');
    const ciudadFilter = document.getElementById('ciudad-filter');
    const maquinaFilter = document.getElementById('maquina-filter');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const tableBody = document.getElementById('data-table-body');
    const loader = document.getElementById('loader');
    const totalIngresosEl = document.getElementById('total-ingresos');
    const totalPulsosEl = document.getElementById('total-pulsos');
    const totalMaquinasEl = document.getElementById('total-maquinas');

    // Función para poblar los selectores de filtro
    const populateSelect = (element, options) => {
        element.innerHTML = '<option value="">Todas</option>'; // Reset
        if (options) {
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                element.appendChild(opt);
            });
        }
    };

    // Cargar los filtros desde la API
    const loadFilters = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/filters`);
            if (!response.ok) throw new Error('Error al cargar filtros');
            const data = await response.json();
            populateSelect(regionFilter, data.regiones);
            populateSelect(ciudadFilter, data.ciudades);
            populateSelect(maquinaFilter, data.codigosMaquina);
        } catch (error) {
            console.error('Error al inicializar filtros:', error);
            // Puedes mostrar un mensaje al usuario aquí si lo deseas
        }
    };

    // Cargar y renderizar los datos de la tabla
    const loadTableData = async () => {
        loader.style.display = 'block';
        tableBody.innerHTML = '';

        const params = new URLSearchParams();
        if (regionFilter.value) params.append('region', regionFilter.value);
        if (ciudadFilter.value) params.append('ciudad', ciudadFilter.value);
        if (maquinaFilter.value) params.append('codigoMaquina', maquinaFilter.value);
        if (startDate.value) params.append('fechaInicio', startDate.value);
        if (endDate.value) params.append('fechaFin', endDate.value);

        try {
            const response = await fetch(`${API_BASE_URL}/data?${params.toString()}`);
            if (!response.ok) throw new Error(`Error al cargar datos: ${response.statusText}`);
            const { dataTable } = await response.json();

            if (!dataTable || dataTable.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron resultados.</td></tr>';
                totalIngresosEl.textContent = '0.00 €';
                totalPulsosEl.textContent = '0';
                totalMaquinasEl.textContent = '0';
                return;
            }

            dataTable.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.codigoMaquina || 'N/A'}</td>
                    <td>${row.nombre || 'N/A'}</td>
                    <td>${row.ubicacion?.region || 'N/A'}</td>
                    <td>${row.ubicacion?.ciudad || 'N/A'}</td>
                    <td><span class="badge bg-${row.estado?.operativo === 'Activa' ? 'success' : 'danger'} p-2">${row.estado?.operativo || 'Inactivo'}</span></td>
                    <td>${(row.ingresos || 0).toFixed(2)} €</td>
                    <td>${row.pulsos || 0}</td>
                `;
                tableBody.appendChild(tr);
            });

            // Actualizar resumen
            const totalIngresos = dataTable.reduce((sum, row) => sum + (row.ingresos || 0), 0);
            const totalPulsos = dataTable.reduce((sum, row) => sum + (row.pulsos || 0), 0);
            totalIngresosEl.textContent = `${totalIngresos.toFixed(2)} €`;
            totalPulsosEl.textContent = totalPulsos;
            totalMaquinasEl.textContent = dataTable.length;

        } catch (error) {
            console.error('Error al cargar la tabla:', error);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos: ${error.message}</td></tr>`;
        } finally {
            loader.style.display = 'none';
        }
    };

    // Inicialización
    const init = () => {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.value = firstDayOfMonth.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];

        loadFilters();
        loadTableData();

        applyFiltersBtn.addEventListener('click', loadTableData);
    };

    init();
});
