document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';

    // Elementos del DOM para Máquinas
    const formMaquina = document.getElementById('formMaquina');
    const idMaquina = document.getElementById('idMaquina');
    const codigoMaquina = document.getElementById('codigoMaquina');
    const nombreMaquina = document.getElementById('nombreMaquina');
    const localMaquina = document.getElementById('localMaquina');
    const tablaMaquinas = document.getElementById('tablaMaquinas');
    const clearFormMaquina = document.getElementById('clearFormMaquina');

    // Cargar datos iniciales
    cargarLocalesParaSelect();
    cargarMaquinas();

    // --- LÓGICA PARA MÁQUINAS ---

    // Cargar locales en el select del formulario de máquinas
    async function cargarLocalesParaSelect() {
        try {
            const response = await fetch(`${API_URL}/locales`);
            if (!response.ok) throw new Error('Error al cargar locales');
            const locales = await response.json();
            localMaquina.innerHTML = '<option value="">Seleccione un local</option>';
            locales.forEach(local => {
                const option = document.createElement('option');
                option.value = local._id;
                option.textContent = `${local.nombre} (${local.ciudad})`;
                localMaquina.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            localMaquina.innerHTML = '<option value="">Error al cargar locales</option>';
        }
    }

    // Cargar y mostrar máquinas en la tabla
    async function cargarMaquinas() {
        try {
            const response = await fetch(`${API_URL}/maquinas`);
            if (!response.ok) throw new Error('Error al cargar máquinas');
            const maquinas = await response.json();
            tablaMaquinas.innerHTML = '';
            maquinas.forEach(maquina => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${maquina.codigoMaquina}</td>
                    <td>${maquina.nombre}</td>
                    <td>${maquina.local ? maquina.local.nombre : 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning btn-action" onclick="editarMaquina('${maquina._id}')">Editar</button>
                        <button class="btn btn-sm btn-danger btn-action" onclick="eliminarMaquina('${maquina._id}')">Eliminar</button>
                    </td>
                `;
                tablaMaquinas.appendChild(tr);
            });
        } catch (error) {
            console.error('Error:', error);
            tablaMaquinas.innerHTML = '<tr><td colspan="4">Error al cargar máquinas.</td></tr>';
        }
    }

    // Limpiar formulario de máquina
    function limpiarFormularioMaquina() {
        idMaquina.value = '';
        formMaquina.reset();
    }

    // Event listener para el formulario
    formMaquina.addEventListener('submit', async (e) => {
        e.preventDefault();
        const maquinaData = {
            codigoMaquina: codigoMaquina.value,
            nombre: nombreMaquina.value,
            local: localMaquina.value
        };

        const id = idMaquina.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/maquinas/${id}` : `${API_URL}/maquinas`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(maquinaData)
            });
            if (!response.ok) throw new Error('Error al guardar la máquina');
            
            limpiarFormularioMaquina();
            cargarMaquinas();
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo guardar la máquina.');
        }
    });

    // Event listener para el botón de limpiar
    clearFormMaquina.addEventListener('click', limpiarFormularioMaquina);

    // Funciones globales para los botones de la tabla
    window.editarMaquina = async (id) => {
        try {
            const response = await fetch(`${API_URL}/maquinas/${id}`);
            if (!response.ok) throw new Error('Error al obtener datos de la máquina');
            const maquina = await response.json();
            
            idMaquina.value = maquina._id;
            codigoMaquina.value = maquina.codigoMaquina;
            nombreMaquina.value = maquina.nombre;
            localMaquina.value = maquina.local._id;

        } catch (error) {
            console.error('Error:', error);
        }
    };

    window.eliminarMaquina = async (id) => {
        if (!confirm('¿Está seguro de que desea eliminar esta máquina?')) return;

        try {
            const response = await fetch(`${API_URL}/maquinas/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar la máquina');
            cargarMaquinas();
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo eliminar la máquina.');
        }
    };

    // Aquí iría la lógica para Locales y Regiones

});
