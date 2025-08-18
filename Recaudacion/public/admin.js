// Variables globales
let regionesData = [];
let localesData = [];
let maquinasData = [];

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarRegiones();
    cargarLocales();
    cargarMaquinas();
    cargarLocalesParaSelect();
    cargarRegionesParaSelects();
    
    // Configurar formularios
    document.getElementById('formRegion').addEventListener('submit', guardarRegion);
    document.getElementById('formLocal').addEventListener('submit', guardarLocal);
    document.getElementById('formMaquina').addEventListener('submit', guardarMaquina);
});

// ==================== GESTIÓN DE REGIONES ====================

// Cargar lista de regiones
async function cargarRegiones() {
    try {
        const activa = document.getElementById('filtroEstadoRegiones').value;
        const orden = document.getElementById('ordenRegiones').value;
        
        let url = '/api/regiones?';
        if (activa) url += `activa=${activa}&`;
        if (orden) url += `orden=${orden}&`;

        const response = await fetch(url);
        const datos = await response.json();
        
        if (response.ok) {
            regionesData = datos.regiones || datos;
            actualizarTablaRegiones(regionesData);
        } else {
            console.error('Error cargando regiones:', datos.error);
            mostrarError('Error cargando regiones: ' + datos.error);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión al cargar regiones');
    }
}

// Actualizar tabla de regiones
function actualizarTablaRegiones(regiones) {
    const tbody = document.getElementById('tablaRegiones');
    
    if (!regiones || regiones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay regiones registradas</td></tr>';
        return;
    }

    tbody.innerHTML = regiones.map(region => `
        <tr>
            <td>
                <strong style="color: ${region.color}">${region.codigoRegion}</strong>
            </td>
            <td>
                <i class="${region.icono} me-2" style="color: ${region.color}"></i>
                ${region.nombre}
            </td>
            <td>
                <span class="badge ${region.activa ? 'bg-success' : 'bg-secondary'}">
                    ${region.activa ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <span class="badge bg-info">${region.estadisticas?.totalLocales || 0}</span>
            </td>
            <td>
                <span class="badge bg-primary">${region.estadisticas?.totalMaquinas || 0}</span>
                <small class="text-muted">(${region.estadisticas?.maquinasActivas || 0} activas)</small>
            </td>
            <td>€${(region.estadisticas?.totalIngresos || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editarRegion('${region.codigoRegion}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-${region.activa ? 'warning' : 'success'} btn-action" onclick="toggleRegion('${region.codigoRegion}', ${!region.activa})">
                    <i class="fas fa-${region.activa ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarRegion('${region.codigoRegion}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Guardar nueva región
async function guardarRegion(event) {
    event.preventDefault();
    
    const datosRegion = {
        codigoRegion: document.getElementById('codigoRegion').value,
        nombre: document.getElementById('nombreRegion').value,
        descripcion: document.getElementById('descripcionRegion').value,
        color: document.getElementById('colorRegion').value,
        icono: document.getElementById('iconoRegion').value,
        orden: parseInt(document.getElementById('ordenRegion').value) || 0,
        notas: document.getElementById('notasRegion').value,
        creadoPor: 'Admin'
    };

    try {
        const response = await fetch('/api/regiones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosRegion)
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Región guardada exitosamente');
            document.getElementById('formRegion').reset();
            document.getElementById('colorRegion').value = '#2563eb';
            document.getElementById('ordenRegion').value = '0';
            cargarRegiones();
            cargarRegionesParaSelects();
        } else {
            mostrarError('Error al guardar región: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al guardar región');
    }
}

// Buscar regiones
function buscarRegiones() {
    const termino = document.getElementById('buscarRegion').value.toLowerCase();
    const regionesFiltradas = regionesData.filter(region => 
        region.nombre.toLowerCase().includes(termino) ||
        region.codigoRegion.toLowerCase().includes(termino) ||
        (region.descripcion && region.descripcion.toLowerCase().includes(termino))
    );
    actualizarTablaRegiones(regionesFiltradas);
}

// Cargar regiones para todos los selects
async function cargarRegionesParaSelects() {
    try {
        const response = await fetch('/api/regiones/select/opciones');
        const datos = await response.json();
        
        if (response.ok) {
            const opciones = datos.opciones || [];
            
            // Actualizar todos los selects de región
            const selects = [
                'regionLocal',
                'regionMaquina', 
                'filtroRegionLocales',
                'filtroRegionMaquinas'
            ];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const valorActual = select.value;
                    const esSelect = selectId.includes('filtro');
                    
                    select.innerHTML = esSelect ? 
                        '<option value="">Todas las regiones</option>' :
                        '<option value="">Seleccionar región</option>';
                    
                    opciones.forEach(opcion => {
                        select.innerHTML += `<option value="${opcion.value}" style="color: ${opcion.color}">
                            ${opcion.text}
                        </option>`;
                    });
                    
                    // Restaurar valor si existía
                    if (valorActual) select.value = valorActual;
                }
            });
        }
    } catch (error) {
        console.error('Error cargando regiones para selects:', error);
    }
}

// Activar/Desactivar región
async function toggleRegion(codigo, activar) {
    try {
        const response = await fetch(`/api/regiones/${codigo}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activa: activar })
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito(`Región ${activar ? 'activada' : 'desactivada'} exitosamente`);
            cargarRegiones();
            cargarRegionesParaSelects();
        } else {
            mostrarError('Error al cambiar estado: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cambiar estado');
    }
}

// Editar región
function editarRegion(codigo) {
    alert('Función de edición en desarrollo para región: ' + codigo);
}

// Eliminar región
async function eliminarRegion(codigo) {
    if (!confirm('¿Está seguro de eliminar esta región? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/regiones/${codigo}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Región eliminada exitosamente');
            cargarRegiones();
            cargarRegionesParaSelects();
        } else {
            mostrarError('Error al eliminar región: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al eliminar región');
    }
}

// ==================== GESTIÓN DE LOCALES ====================

// Cargar lista de locales
async function cargarLocales() {
    try {
        const region = document.getElementById('filtroRegionLocales').value;
        const tipo = document.getElementById('filtroTipoLocales').value;
        
        let url = '/api/locales?';
        if (region) url += `region=${region}&`;
        if (tipo) url += `tipo=${tipo}&`;

        const response = await fetch(url);
        const datos = await response.json();
        
        if (response.ok) {
            localesData = datos.locales || datos;
            actualizarTablaLocales(localesData);
        } else {
            console.error('Error cargando locales:', datos.error);
            mostrarError('Error cargando locales: ' + datos.error);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión al cargar locales');
    }
}

// Actualizar tabla de locales
function actualizarTablaLocales(locales) {
    const tbody = document.getElementById('tablaLocales');
    
    if (!locales || locales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay locales registrados</td></tr>';
        return;
    }

    tbody.innerHTML = locales.map(local => `
        <tr>
            <td><strong>${local.codigoLocal}</strong></td>
            <td>${local.nombre}</td>
            <td>${local.tipoEstablecimiento}</td>
            <td>${local.ubicacion?.region || 'N/A'}</td>
            <td>
                <span class="badge bg-info">${local.estadisticas?.totalMaquinas || 0}</span>
                <small class="text-muted">(${local.estadisticas?.maquinasActivas || 0} activas)</small>
            </td>
            <td>€${(local.estadisticas?.totalIngresos || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editarLocal('${local.codigoLocal}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-info btn-action" onclick="verDetallesLocal('${local.codigoLocal}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarLocal('${local.codigoLocal}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Guardar nuevo local
async function guardarLocal(event) {
    event.preventDefault();
    
    const datosLocal = {
        codigoLocal: document.getElementById('codigoLocal').value,
        nombre: document.getElementById('nombreLocal').value,
        tipoEstablecimiento: document.getElementById('tipoEstablecimiento').value,
        ubicacion: {
            region: document.getElementById('regionLocal').value,
            ciudad: document.getElementById('ciudadLocal').value,
            direccion: document.getElementById('direccionLocal').value,
            codigoPostal: document.getElementById('codigoPostal').value,
            piso: document.getElementById('pisoLocal').value
        },
        contacto: {
            nombreResponsable: document.getElementById('responsableLocal').value,
            telefono: document.getElementById('telefonoLocal').value,
            email: document.getElementById('emailLocal').value
        },
        caracteristicas: {
            flujoPersonas: document.getElementById('flujoPersonas').value,
            nivelSeguridad: document.getElementById('nivelSeguridad').value
        },
        notas: document.getElementById('notasLocal').value
    };

    try {
        const response = await fetch('/api/locales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosLocal)
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Local guardado exitosamente');
            document.getElementById('formLocal').reset();
            cargarLocales();
            cargarLocalesParaSelect();
        } else {
            mostrarError('Error al guardar local: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al guardar local');
    }
}

// Buscar locales
function buscarLocales() {
    const termino = document.getElementById('buscarLocal').value.toLowerCase();
    const localesFiltrados = localesData.filter(local => 
        local.nombre.toLowerCase().includes(termino) ||
        local.codigoLocal.toLowerCase().includes(termino)
    );
    actualizarTablaLocales(localesFiltrados);
}

// Cargar locales para el select de máquinas
async function cargarLocalesParaSelect() {
    try {
        const response = await fetch('/api/locales');
        const datos = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('localExistente');
            const locales = datos.locales || datos;
            
            select.innerHTML = '<option value="">Seleccionar local...</option>';
            locales.forEach(local => {
                select.innerHTML += `<option value="${local.codigoLocal}">${local.nombre} - ${local.ubicacion?.ciudad || ''}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando locales para select:', error);
    }
}

// Seleccionar local existente para máquina
function seleccionarLocal() {
    const codigoLocal = document.getElementById('localExistente').value;
    if (!codigoLocal) return;

    const local = localesData.find(l => l.codigoLocal === codigoLocal);
    if (local) {
        document.getElementById('regionMaquina').value = local.ubicacion?.region || '';
        document.getElementById('ciudadMaquina').value = local.ubicacion?.ciudad || '';
        document.getElementById('direccionMaquina').value = local.ubicacion?.direccion || '';
    }
}

// Actualizar regiones en formularios cuando cambian
function actualizarRegionesEnFormularios() {
    cargarRegionesParaSelects();
}

// ==================== GESTIÓN DE MÁQUINAS ====================

// Cargar lista de máquinas
async function cargarMaquinas() {
    try {
        const region = document.getElementById('filtroRegionMaquinas').value;
        const estado = document.getElementById('filtroEstadoMaquinas').value;
        
        let url = '/api/maquinas?';
        if (region) url += `region=${region}&`;
        if (estado) url += `estado=${estado}&`;

        const response = await fetch(url);
        const datos = await response.json();
        
        if (response.ok) {
            maquinasData = datos.maquinas || datos;
            actualizarTablaMaquinas(maquinasData);
        } else {
            console.error('Error cargando máquinas:', datos.error);
            mostrarError('Error cargando máquinas: ' + datos.error);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión al cargar máquinas');
    }
}

// Actualizar tabla de máquinas
function actualizarTablaMaquinas(maquinas) {
    const tbody = document.getElementById('tablaMaquinas');
    
    if (!maquinas || maquinas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay máquinas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = maquinas.map(maquina => `
        <tr>
            <td><strong>${maquina.codigoMaquina}</strong></td>
            <td>${maquina.nombre}</td>
            <td>
                <small>${maquina.ubicacion?.ciudad || 'N/A'}</small><br>
                <small class="text-muted">${maquina.ubicacion?.region || 'N/A'}</small>
            </td>
            <td>
                <span class="status-badge status-${maquina.estado?.toLowerCase() || 'inactiva'}">
                    ${maquina.estado || 'Inactiva'}
                </span>
            </td>
            <td>
                <span class="badge bg-secondary">${maquina.estadisticas?.pulsosHoy || 0}</span>
            </td>
            <td>€${(maquina.estadisticas?.ingresosHoy || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-success btn-action" onclick="editarMaquina('${maquina.codigoMaquina}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-info btn-action" onclick="verDetallesMaquina('${maquina.codigoMaquina}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="cambiarEstadoMaquina('${maquina.codigoMaquina}')">
                    <i class="fas fa-power-off"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarMaquina('${maquina.codigoMaquina}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Guardar nueva máquina
async function guardarMaquina(event) {
    event.preventDefault();
    
    const datosMaquina = {
        codigoMaquina: document.getElementById('codigoMaquina').value,
        nombre: document.getElementById('nombreMaquina').value,
        descripcion: document.getElementById('descripcionMaquina').value,
        ubicacion: {
            region: document.getElementById('regionMaquina').value,
            ciudad: document.getElementById('ciudadMaquina').value,
            direccion: document.getElementById('direccionMaquina').value
        },
        configuracion: {
            valorPorPulso: parseFloat(document.getElementById('valorPorPulso').value),
            moneda: document.getElementById('monedaMaquina').value,
            capacidadMaxima: parseFloat(document.getElementById('capacidadMaxima').value)
        },
        contacto: {
            nombreResponsable: document.getElementById('responsableMaquina').value,
            telefono: document.getElementById('telefonoMaquina').value,
            email: document.getElementById('emailMaquina').value
        }
    };

    try {
        const response = await fetch('/api/maquinas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosMaquina)
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Máquina guardada exitosamente');
            document.getElementById('formMaquina').reset();
            document.getElementById('valorPorPulso').value = '1.00';
            document.getElementById('capacidadMaxima').value = '1000';
            cargarMaquinas();
        } else {
            mostrarError('Error al guardar máquina: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al guardar máquina');
    }
}

// Buscar máquinas
function buscarMaquinas() {
    const termino = document.getElementById('buscarMaquina').value.toLowerCase();
    const maquinasFiltradas = maquinasData.filter(maquina => 
        maquina.nombre.toLowerCase().includes(termino) ||
        maquina.codigoMaquina.toLowerCase().includes(termino)
    );
    actualizarTablaMaquinas(maquinasFiltradas);
}

// ==================== FUNCIONES DE ACCIÓN ====================

// Editar local
function editarLocal(codigo) {
    alert('Función de edición en desarrollo para local: ' + codigo);
}

// Ver detalles de local
function verDetallesLocal(codigo) {
    alert('Ver detalles del local: ' + codigo);
}

// Eliminar local
async function eliminarLocal(codigo) {
    if (!confirm('¿Está seguro de eliminar este local? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/locales/${codigo}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Local eliminado exitosamente');
            cargarLocales();
            cargarLocalesParaSelect();
        } else {
            mostrarError('Error al eliminar local: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al eliminar local');
    }
}

// Editar máquina
function editarMaquina(codigo) {
    alert('Función de edición en desarrollo para máquina: ' + codigo);
}

// Ver detalles de máquina
function verDetallesMaquina(codigo) {
    alert('Ver detalles de la máquina: ' + codigo);
}

// Cambiar estado de máquina
async function cambiarEstadoMaquina(codigo) {
    const nuevoEstado = prompt('Ingrese el nuevo estado (Activa, Inactiva, Mantenimiento, Averiada):');
    if (!nuevoEstado) return;

    try {
        const response = await fetch(`/api/maquinas/${codigo}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Estado actualizado exitosamente');
            cargarMaquinas();
        } else {
            mostrarError('Error al cambiar estado: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cambiar estado');
    }
}

// Eliminar máquina
async function eliminarMaquina(codigo) {
    if (!confirm('¿Está seguro de eliminar esta máquina? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/maquinas/${codigo}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito('Máquina eliminada exitosamente');
            cargarMaquinas();
        } else {
            mostrarError('Error al eliminar máquina: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al eliminar máquina');
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
    // Crear toast de éxito
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Eliminar el toast después de que se oculte
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    // Crear toast de error
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-exclamation-circle me-2"></i>${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Eliminar el toast después de que se oculte
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}
