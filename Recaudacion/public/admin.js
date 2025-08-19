document.addEventListener('DOMContentLoaded', () => {
    const AdminApp = {
        cache: {
            regiones: [],
            locales: [],
            tiposEstablecimiento: [],
            tiposMaquina: [],
            maquinas: [],
        },

        init() {
            this.assignEventListeners();
            this.loadInitialData();
        },

        assignEventListeners() {
            document.querySelectorAll('.nav-link[data-bs-toggle="tab"]').forEach(tab => {
                tab.addEventListener('shown.bs.tab', (event) => {
                    const targetPanelId = event.target.getAttribute('data-bs-target').substring(1);
                    this.handleTabChange(targetPanelId);
                });
            });

            const forms = {
                'region': 'form-region',
                'tipoMaquina': 'form-tipo-maquina',
                'tipoEstablecimiento': 'form-tipo-establecimiento',
                'local': 'form-local',
                'maquina': 'formMaquina'
            };
            for (const [type, formId] of Object.entries(forms)) {
                this.safeAddListener(formId, 'submit', this.handleSave.bind(this, type));
                this.safeAddListener(`cancelar-edicion-${type}`, 'click', () => this.resetForm(type));
            }
            
            this.safeAddListener('filtroEstadoRegiones', 'change', this.loadRegiones.bind(this));
            this.safeAddListener('ordenRegiones', 'change', this.loadRegiones.bind(this));
            this.safeAddListener('busqueda-local', 'input', this.debounce(this.loadLocales.bind(this), 300));
            this.safeAddListener('filtro-region-local', 'change', this.loadLocales.bind(this));
            this.safeAddListener('filtro-tipo-local', 'change', this.loadLocales.bind(this));
            this.safeAddListener('btn-actualizar-locales', 'click', this.loadLocales.bind(this));
        },

        async loadInitialData() {
            await Promise.all([
                this.loadRegionesParaSelects(),
                this.loadTiposEstablecimientoParaSelects(),
                this.loadLocalesParaSelects()
            ]);
            const activeTab = document.querySelector('.nav-link.active');
            const initialPanelId = activeTab ? activeTab.getAttribute('data-bs-target').substring(1) : 'maquinas-panel';
            this.handleTabChange(initialPanelId);
        },

        handleTabChange(panelId) {
            const loadActions = {
                'maquinas-panel': this.loadMaquinas,
                'locales-panel': this.loadLocales,
                'regiones-panel': this.loadRegiones,
                'tipos-maquina-panel': this.loadTiposMaquina,
                'tipos-establecimiento-panel': this.loadTiposEstablecimiento
            };
            const action = loadActions[panelId];
            if (action) action.call(this);
        },

        async fetchAPI(url, options = {}) {
            try {
                const response = await fetch(url, options);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || data.error || 'Error en la petición a la API');
                return data;
            } catch (error) {
                console.error(`Error en fetchAPI (${url}):`, error);
                this.showNotification(error.message, 'error');
                return null;
            }
        },

        async loadRegiones() { this.loadAndRender('regiones', '/api/regiones', this.getRegionRowHTML); },
        async loadLocales() {
            const filtros = {
                region: document.getElementById('filtro-region-local')?.value,
                tipo: document.getElementById('filtro-tipo-local')?.value,
                busqueda: document.getElementById('busqueda-local')?.value
            };
            const params = new URLSearchParams(Object.entries(filtros).filter(([_, v]) => v));
            this.loadAndRender('locales', `/api/locales?${params}`, this.getLocalRowHTML);
        },
        async loadMaquinas() { this.loadAndRender('maquinas', '/api/maquinas', this.getMaquinaRowHTML); },
        async loadTiposMaquina() { this.loadAndRender('tiposMaquina', '/api/tipos-maquina', this.getTipoMaquinaRowHTML); },
        async loadTiposEstablecimiento() { this.loadAndRender('tiposEstablecimiento', '/api/tipos-establecimiento', this.getTipoEstablecimientoRowHTML); },

        async loadAndRender(type, url, rowRenderer) {
            const data = await this.fetchAPI(url);
            if (data) {
                this.cache[type] = data.locales || data.maquinas || data.regiones || data;
                this.renderTable(type, this.cache[type], rowRenderer);
            }
        },

        async loadRegionesParaSelects() {
            const data = await this.fetchAPI('/api/regiones/select/opciones');
            if (data && data.opciones) {
                ['regionLocal', 'filtro-region-local', 'regionMaquina'].forEach(id => this.populateSelect(id, data.opciones, { style: 'color' }));
            }
        },

        async loadTiposEstablecimientoParaSelects() {
            const data = await this.fetchAPI('/api/tipos-establecimiento?activo=true');
            if (data) {
                const opciones = data.map(t => ({ value: t._id, text: t.nombre }));
                ['tipoEstablecimiento', 'filtro-tipo-local'].forEach(id => this.populateSelect(id, opciones));
            }
        },

        async loadLocalesParaSelects() {
            const data = await this.fetchAPI('/api/locales?activo=true&limite=500');
            if (data && data.locales) {
                const opciones = data.locales.map(l => ({ value: l.codigoLocal, text: `${l.nombre} - ${l.ubicacion?.ciudad || ''}` }));
                this.populateSelect('localMaquina', opciones);
            }
        },

        renderTable(type, data, rowRenderer) {
            const tableId = this.getTableId(type);
            const tbody = document.getElementById(tableId);
            if (!tbody) return;
            if (!data || data.length === 0) {
                const colspan = tbody.closest('table').querySelector('thead tr').childElementCount || 5;
                tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">No hay datos disponibles.</td></tr>`;
                return;
            }
            tbody.innerHTML = data.map(item => rowRenderer.call(this, item)).join('');
        },

        populateSelect(selectId, options, config = {}) {
            const select = document.getElementById(selectId);
            if (!select) return;
            const currentValue = select.value;
            const isFilter = selectId.includes('filtro');
            select.innerHTML = `<option value="">${isFilter ? 'Todos' : 'Seleccionar...'}</option>`;
            options.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.text;
                if (config.style && opt[config.style]) optionEl.style.color = opt[config.style];
                select.appendChild(optionEl);
            });
            select.value = currentValue;
        },

        getRegionRowHTML(region) {
            const stats = region.estadisticas || {};
            return `<tr>
                    <td><strong style="color: ${region.color}">${region.codigoRegion}</strong></td>
                    <td><i class="${region.icono} me-2" style="color: ${region.color}"></i>${region.nombre}</td>
                    <td><span class="badge bg-info">${stats.totalLocales || 0}</span></td>
                    <td><span class="badge bg-primary">${stats.totalMaquinas || 0}</span></td>
                    <td><span class="badge bg-${region.activa ? 'success' : 'secondary'}">${region.activa ? 'Activa' : 'Inactiva'}</span></td>
                    <td>${this.getActionButtonsHTML('region', region.codigoRegion)}</td>
                </tr>`;
        },

        getLocalRowHTML(local) {
            return `<tr>
                    <td><strong>${local.codigoLocal}</strong></td>
                    <td>${local.nombre}</td>
                    <td>${local.tipoEstablecimiento?.nombre || 'N/A'}</td>
                    <td>${local.ubicacion?.region?.nombre || 'N/A'}</td>
                    <td>${local.estadisticas?.totalMaquinas || 0}</td>
                    <td>€${(local.estadisticas?.totalIngresos || 0).toFixed(2)}</td>
                    <td>${this.getActionButtonsHTML('local', local.codigoLocal)}</td>
                </tr>`;
        },

        getMaquinaRowHTML(maquina) {
            return `<tr>
                    <td>${maquina.codigo}</td>
                    <td>${maquina.nombre}</td>
                    <td>${maquina.local?.nombre || 'N/A'}</td>
                    <td>${this.getActionButtonsHTML('maquina', maquina._id)}</td>
                </tr>`;
        },

        getTipoMaquinaRowHTML(tipo) {
            return `<tr>
                    <td>${tipo.codigo}</td>
                    <td>${tipo.nombre}</td>
                    <td>${tipo.maquinasAsociadas || 0}</td>
                    <td><span class="badge bg-${tipo.activo ? 'success' : 'secondary'}">${tipo.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td>${this.getActionButtonsHTML('tipoMaquina', tipo._id)}</td>
                </tr>`;
        },

        getTipoEstablecimientoRowHTML(tipo) {
            return `<tr>
                    <td>${tipo.nombre}</td>
                    <td><i class="${tipo.icono || 'fas fa-store'}"></i></td>
                    <td>${tipo.localesAsociados || 0}</td>
                    <td><span class="badge bg-${tipo.activo ? 'success' : 'secondary'}">${tipo.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td>${this.getActionButtonsHTML('tipoEstablecimiento', tipo._id)}</td>
                </tr>`;
        },

        getActionButtonsHTML(type, id) {
            return `<button class="btn btn-sm btn-outline-primary" onclick="AdminApp.handleEdit('${type}', '${id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="AdminApp.handleDelete('${type}', '${id}')"><i class="fas fa-trash"></i></button>`;
        },

        async handleSave(type, event) {
            event.preventDefault();
            const form = event.target;
            const idField = form.querySelector('input[type="hidden"][name$="-id"]');
            const id = idField ? idField.value : null;
            const isEdit = !!id;
            const body = this.getFormData(type, form);
            if (!body) return;
            const endpoint = this.getApiEndpoint(type);
            const url = isEdit ? `/api/${endpoint}/${id}` : `/api/${endpoint}`;
            const method = isEdit ? 'PUT' : 'POST';
            const result = await this.fetchAPI(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (result) {
                this.showNotification(`${this.getReadableName(type)} ${isEdit ? 'actualizado' : 'creado'} con éxito.`, 'success');
                this.resetForm(type);
                this.reloadData(type);
            }
        },

        handleEdit(type, id) {
            const cacheKey = this.getCacheKey(type);
            const item = this.cache[cacheKey].find(i => (i._id === id || i.codigoRegion === id || i.codigoLocal === id));
            if (!item) {
                console.error(`No se encontró el item tipo '${type}' con id '${id}' en la caché.`);
                return;
            }
            this.populateForm(type, item);
            const formId = this.getFormId(type);
            document.getElementById(`${formId}-title`).textContent = `Editar ${this.getReadableName(type)}`;
            this.safeShow(`cancelar-edicion-${type}`);
            document.getElementById(formId).scrollIntoView({ behavior: 'smooth' });
        },

        async handleDelete(type, id) {
            if (!confirm(`¿Está seguro de que desea eliminar este ${this.getReadableName(type)}?`)) return;
            const url = `/api/${this.getApiEndpoint(type)}/${id}`;
            const result = await this.fetchAPI(url, { method: 'DELETE' });
            if (result) {
                this.showNotification(`${this.getReadableName(type)} eliminado con éxito.`, 'success');
                this.reloadData(type);
            }
        },

        getFormData(type, form) {
            const elements = form.elements;
            const getVal = (name) => elements[name]?.value;
            const getChecked = (name) => elements[name]?.checked;

            switch (type) {
                case 'region': return { nombre: getVal('region-nombre'), descripcion: getVal('region-descripcion'), color: getVal('region-color'), icono: getVal('region-icono'), orden: getVal('region-orden'), notas: getVal('region-notas'), codigoRegion: getVal('region-codigo'), activa: getChecked('region-activa') };
                case 'local': return { nombre: getVal('nombreLocal'), tipoEstablecimiento: getVal('tipoEstablecimiento'), codigoLocal: getVal('codigoLocal'), ubicacion: { region: getVal('regionLocal'), ciudad: getVal('ciudadLocal'), direccion: getVal('direccionLocal'), codigoPostal: getVal('codigo-postal'), piso: getVal('piso-zona-local') }, contacto: { nombreResponsable: getVal('responsableLocal'), telefono: getVal('telefonoLocal'), email: getVal('emailLocal') }, caracteristicas: { flujoPersonas: getVal('flujoPersonas'), nivelSeguridad: getVal('nivelSeguridad') }, notas: getVal('notasLocal') };
                case 'maquina': return { codigo: getVal('codigoMaquina'), nombre: getVal('nombreMaquina'), local: getVal('localMaquina') };
                case 'tipoMaquina': return { codigo: getVal('tipo-maquina-codigo'), nombre: getVal('tipo-maquina-nombre'), descripcion: getVal('tipo-maquina-descripcion'), activo: getChecked('tipo-maquina-activo') };
                case 'tipoEstablecimiento': return { nombre: getVal('tipo-establecimiento-nombre'), descripcion: getVal('tipo-establecimiento-descripcion'), icono: getVal('tipo-establecimiento-icono'), activo: getChecked('tipo-establecimiento-activo') };
                default: return {};
            }
        },

        populateForm(type, item) {
            const form = document.getElementById(this.getFormId(type));
            const set = (name, value) => { if (form.elements[name]) form.elements[name].value = value || ''; };
            const setChecked = (name, value) => { if (form.elements[name]) form.elements[name].checked = value; };

            switch (type) {
                case 'region':
                    set('region-id', item.codigoRegion); set('region-codigo', item.codigoRegion); form.elements['region-codigo'].disabled = true;
                    set('region-nombre', item.nombre); set('region-descripcion', item.descripcion); set('region-color', item.color); set('region-icono', item.icono); set('region-orden', item.orden); set('region-notas', item.notas); setChecked('region-activa', item.activa);
                    break;
                case 'local':
                    set('local-id', item.codigoLocal); set('codigoLocal', item.codigoLocal); form.elements['codigoLocal'].disabled = true;
                    set('nombreLocal', item.nombre); set('tipoEstablecimiento', item.tipoEstablecimiento?._id);
                    if (item.ubicacion) { set('regionLocal', item.ubicacion.region?._id); set('ciudadLocal', item.ubicacion.ciudad); set('direccionLocal', item.ubicacion.direccion); set('codigo-postal', item.ubicacion.codigoPostal); set('piso-zona-local', item.ubicacion.piso); }
                    if (item.contacto) { set('responsableLocal', item.contacto.nombreResponsable); set('telefonoLocal', item.contacto.telefono); set('emailLocal', item.contacto.email); }
                    if (item.caracteristicas) { set('flujoPersonas', item.caracteristicas.flujoPersonas); set('nivelSeguridad', item.caracteristicas.nivelSeguridad); }
                    set('notasLocal', item.notas);
                    break;
                case 'maquina':
                    set('idMaquina', item._id); set('codigoMaquina', item.codigo); set('nombreMaquina', item.nombre); set('localMaquina', item.local?.codigoLocal);
                    break;
                case 'tipoMaquina':
                    set('tipo-maquina-id', item._id); set('tipo-maquina-codigo', item.codigo); form.elements['tipo-maquina-codigo'].disabled = true;
                    set('tipo-maquina-nombre', item.nombre); set('tipo-maquina-descripcion', item.descripcion); setChecked('tipo-maquina-activo', item.activo);
                    break;
                case 'tipoEstablecimiento':
                    set('tipo-establecimiento-id', item._id); set('tipo-establecimiento-nombre', item.nombre);
                    set('tipo-establecimiento-descripcion', item.descripcion); set('tipo-establecimiento-icono', item.icono); setChecked('tipo-establecimiento-activo', item.activo);
                    break;
            }
        },

        resetForm(type) {
            const formId = this.getFormId(type);
            const form = document.getElementById(formId);
            if (!form) return;
            form.reset();
            const hiddenId = form.querySelector('input[type="hidden"]');
            if (hiddenId) hiddenId.value = '';
            const disabledInput = form.querySelector('[disabled]');
            if (disabledInput) disabledInput.disabled = false;
            document.getElementById(`${formId}-title`).textContent = `Crear Nuevo ${this.getReadableName(type)}`;
            this.safeHide(`cancelar-edicion-${type}`);
        },

        reloadData(type) {
            const actions = {
                'region': () => { this.loadRegiones(); this.loadRegionesParaSelects(); },
                'local': () => { this.loadLocales(); this.loadLocalesParaSelects(); },
                'maquina': () => { this.loadMaquinas(); },
                'tipoMaquina': () => { this.loadTiposMaquina(); },
                'tipoEstablecimiento': () => { this.loadTiposEstablecimiento(); this.loadTiposEstablecimientoParaSelects(); }
            };
            if (actions[type]) actions[type]();
        },

        safeAddListener(id, event, handler) {
            const element = document.getElementById(id);
            if (element) element.addEventListener(event, handler);
            else console.warn(`Elemento con id '${id}' no encontrado.`);
        },
        safeShow(id) { const el = document.getElementById(id); if (el) el.style.display = 'inline-block'; },
        safeHide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; },

        debounce(func, delay) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        },

        getApiEndpoint(type) {
            const map = { 'region': 'regiones', 'maquina': 'maquinas', 'tipoMaquina': 'tipos-maquina', 'tipoEstablecimiento': 'tipos-establecimiento', 'local': 'locales' };
            return map[type];
        },
        getCacheKey(type) {
            const map = { 'tipoMaquina': 'tiposMaquina', 'tipoEstablecimiento': 'tiposEstablecimiento' };
            return map[type] || `${type}s`;
        },
        getTableId(type) {
            const map = { 'regiones': 'tabla-regiones', 'locales': 'tablaLocales', 'maquinas': 'tablaMaquinas', 'tiposMaquina': 'tabla-tipos-maquina', 'tiposEstablecimiento': 'tabla-tipos-establecimiento' };
            return map[type] || `tabla-${type}s`;
        },
        getFormId(type) {
            const map = { 'maquina': 'formMaquina' };
            return map[type] || `form-${type}`;
        },
        getReadableName(type) {
            return { 'region': 'Región', 'local': 'Local', 'maquina': 'Máquina', 'tipoMaquina': 'Tipo de Máquina', 'tipoEstablecimiento': 'Tipo de Establecimiento' }[type] || type;
        },

        showNotification(message, type = 'success') {
            const wrapper = document.createElement('div');
            const alertType = type === 'error' ? 'danger' : 'success';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
            wrapper.innerHTML = `<div class="alert alert-${alertType} alert-dismissible fade show" role="alert" style="position:fixed;top:20px;right:20px;z-index:9999;">
                                   <i class="fas ${icon} me-2"></i>
                                   <strong>${type === 'success' ? 'Éxito' : 'Error'}:</strong> ${message}
                                   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                               </div>`;
            document.body.appendChild(wrapper.firstChild);
            setTimeout(() => wrapper.querySelector('.alert')?.remove(), 5000);
        }
    };

    window.AdminApp = { handleEdit: AdminApp.handleEdit.bind(AdminApp), handleDelete: AdminApp.handleDelete.bind(AdminApp) };
    AdminApp.init();
});
        const datos = await response.json();
        
        if (response.ok) {
            const opciones = datos.opciones || [];
            
            // Actualizar todos los selects de región
            const selects = [
                'regionLocal',
                'regionMaquina', 
                'filtro-region-local',
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

// Cargar datos de región en el formulario para editar
function editarRegion(codigo) {
    const region = regionesData.find(r => r.codigoRegion === codigo);
    if (!region) {
        mostrarError('No se encontró la región para editar.');
        return;
    }

    document.getElementById('region-id').value = region.codigoRegion;
    document.getElementById('region-codigo').value = region.codigoRegion;
    document.getElementById('region-codigo').disabled = true;
    document.getElementById('region-nombre').value = region.nombre;
    document.getElementById('region-descripcion').value = region.descripcion || '';
    document.getElementById('region-color').value = region.color || '#2563eb';
    document.getElementById('region-icono').value = region.icono || 'fas fa-map-marker-alt';
    document.getElementById('region-orden').value = region.orden || 0;
    document.getElementById('region-notas').value = region.notas || '';

    document.getElementById('region-form-title').textContent = 'Editar Región';
    document.getElementById('cancelar-edicion-region').style.display = 'inline-block';
    
    // Scroll al formulario
    document.getElementById('form-region').scrollIntoView({ behavior: 'smooth' });
}

// Cancelar edición y limpiar formulario de región
function cancelarEdicionRegion() {
    document.getElementById('form-region').reset();
    document.getElementById('region-id').value = '';
    document.getElementById('region-codigo').disabled = false;
    document.getElementById('region-form-title').textContent = 'Crear Nueva Región';
    document.getElementById('cancelar-edicion-region').style.display = 'none';
    document.getElementById('region-color').value = '#2563eb';
    document.getElementById('region-orden').value = '0';
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

// ==================== GESTIÓN DE TIPOS DE MÁQUINA ====================

let tiposMaquinaData = [];

async function cargarTiposMaquina() {
    try {
        const response = await fetch('/api/tipos-maquina');
        if (!response.ok) throw new Error('Error al cargar tipos de máquina');
        tiposMaquinaData = await response.json();
        renderizarTiposMaquina(tiposMaquinaData);
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

function renderizarTiposMaquina(tipos) {
    const tbody = document.getElementById('tabla-tipos-maquina');
    tbody.innerHTML = '';
    if (tipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay tipos de máquina registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = tipos.map(tipo => `
        <tr>
            <td>${tipo.codigo}</td>
            <td>${tipo.nombre}</td>
            <td>${tipo.descripcion || ''}</td>
            <td>0</td> <!-- Placeholder -->
            <td>
                <span class="badge bg-${tipo.activo ? 'success' : 'secondary'}">${tipo.activo ? 'Activo' : 'Inactivo'}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editarTipoMaquina('${tipo._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarTipoMaquina('${tipo._id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function guardarTipoMaquina(event) {
    event.preventDefault();
    const id = document.getElementById('tipo-maquina-id').value;
    const esEdicion = !!id;

    const data = {
        codigo: document.getElementById('tipo-maquina-codigo').value,
        nombre: document.getElementById('tipo-maquina-nombre').value,
        descripcion: document.getElementById('tipo-maquina-descripcion').value,
    };

    const url = esEdicion ? `/api/tipos-maquina/${id}` : '/api/tipos-maquina';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const resultado = await response.json();
        if (response.ok) {
            mostrarExito(`Tipo de máquina ${esEdicion ? 'actualizado' : 'creado'} con éxito.`);
            cancelarEdicionTipoMaquina();
            cargarTiposMaquina();
        } else {
            mostrarError(resultado.message || 'Error al guardar el tipo de máquina.');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al guardar.');
    }
}

function editarTipoMaquina(id) {
    const tipo = tiposMaquinaData.find(t => t._id === id);
    if (!tipo) return;

    document.getElementById('tipo-maquina-id').value = tipo._id;
    document.getElementById('tipo-maquina-codigo').value = tipo.codigo;
    document.getElementById('tipo-maquina-codigo').disabled = true;
    document.getElementById('tipo-maquina-nombre').value = tipo.nombre;
    document.getElementById('tipo-maquina-descripcion').value = tipo.descripcion || '';
    
    document.getElementById('tipo-maquina-form-title').textContent = 'Editar Tipo de Máquina';
    document.getElementById('cancelar-edicion-tipo-maquina').style.display = 'inline-block';
    document.getElementById('form-tipo-maquina').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionTipoMaquina() {
    document.getElementById('form-tipo-maquina').reset();
    document.getElementById('tipo-maquina-id').value = '';
    document.getElementById('tipo-maquina-codigo').disabled = false;
    document.getElementById('tipo-maquina-form-title').textContent = 'Crear Nuevo Tipo de Máquina';
    document.getElementById('cancelar-edicion-tipo-maquina').style.display = 'none';
}

async function eliminarTipoMaquina(id) {
    if (!confirm('¿Está seguro de eliminar este tipo de máquina?')) return;

    try {
        const response = await fetch(`/api/tipos-maquina/${id}`, { method: 'DELETE' });
        if (response.ok) {
            mostrarExito('Tipo de máquina eliminado con éxito.');
            cargarTiposMaquina();
        } else {
            const resultado = await response.json();
            mostrarError(resultado.message || 'Error al eliminar.');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al eliminar.');
    }
}

// ==================== GESTIÓN DE TIPOS DE ESTABLECIMIENTO ====================

let tiposEstablecimientoData = [];

async function cargarTiposEstablecimiento() {
    try {
        const response = await fetch('/api/tipos-establecimiento');
        if (!response.ok) throw new Error('Error al cargar tipos de establecimiento');
        tiposEstablecimientoData = await response.json();
        renderizarTiposEstablecimiento(tiposEstablecimientoData);
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

function renderizarTiposEstablecimiento(tipos) {
    const tbody = document.getElementById('tabla-tipos-establecimiento');
    tbody.innerHTML = '';
    if (tipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay tipos de establecimiento registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = tipos.map(tipo => `
        <tr>
            <td>${tipo.nombre}</td>
            <td>${tipo.descripcion || ''}</td>
            <td><i class="${tipo.icono || 'fas fa-store'}"></i> ${tipo.icono}</td>
            <td>0</td> <!-- Placeholder -->
            <td>
                <span class="badge bg-${tipo.activo ? 'success' : 'secondary'}">${tipo.activo ? 'Activo' : 'Inactivo'}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editarTipoEstablecimiento('${tipo._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarTipoEstablecimiento('${tipo._id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function guardarTipoEstablecimiento(event) {
    event.preventDefault();
    const id = document.getElementById('tipo-establecimiento-id').value;
    const esEdicion = !!id;

    const data = {
        nombre: document.getElementById('tipo-establecimiento-nombre').value,
        descripcion: document.getElementById('tipo-establecimiento-descripcion').value,
        icono: document.getElementById('tipo-establecimiento-icono').value,
    };

    const url = esEdicion ? `/api/tipos-establecimiento/${id}` : '/api/tipos-establecimiento';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const resultado = await response.json();
        if (response.ok) {
            mostrarExito(`Tipo de establecimiento ${esEdicion ? 'actualizado' : 'creado'} con éxito.`);
            cancelarEdicionTipoEstablecimiento();
            cargarTiposEstablecimiento();
        } else {
            mostrarError(resultado.message || 'Error al guardar el tipo.');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al guardar.');
    }
}

function editarTipoEstablecimiento(id) {
    const tipo = tiposEstablecimientoData.find(t => t._id === id);
    if (!tipo) return;

    document.getElementById('tipo-establecimiento-id').value = tipo._id;
    document.getElementById('tipo-establecimiento-nombre').value = tipo.nombre;
    document.getElementById('tipo-establecimiento-descripcion').value = tipo.descripcion || '';
    document.getElementById('tipo-establecimiento-icono').value = tipo.icono || 'fas fa-store';
    
    document.getElementById('tipo-establecimiento-form-title').textContent = 'Editar Tipo de Establecimiento';
    document.getElementById('cancelar-edicion-tipo-establecimiento').style.display = 'inline-block';
    document.getElementById('form-tipo-establecimiento').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionTipoEstablecimiento() {
    document.getElementById('form-tipo-establecimiento').reset();
    document.getElementById('tipo-establecimiento-id').value = '';
    document.getElementById('tipo-establecimiento-form-title').textContent = 'Crear Nuevo Tipo de Establecimiento';
    document.getElementById('cancelar-edicion-tipo-establecimiento').style.display = 'none';
}

async function eliminarTipoEstablecimiento(id) {
    if (!confirm('¿Está seguro de eliminar este tipo de establecimiento?')) return;

    try {
        const response = await fetch(`/api/tipos-establecimiento/${id}`, { method: 'DELETE' });
        if (response.ok) {
            mostrarExito('Tipo de establecimiento eliminado con éxito.');
            cargarTiposEstablecimiento();
        } else {
            const resultado = await response.json();
            mostrarError(resultado.message || 'Error al eliminar.');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al eliminar.');
    }
}

async function cargarTiposEstablecimientoParaSelects() {
    try {
        const response = await fetch('/api/tipos-establecimiento');
        if (!response.ok) throw new Error('Error al cargar tipos de establecimiento para selects');
        const tipos = await response.json();

        const selects = ['tipoEstablecimiento', 'filtro-tipo-local'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            const esFiltro = selectId.includes('filtro');
            select.innerHTML = esFiltro ? '<option value="">Todos los tipos</option>' : '<option value="">Seleccionar tipo</option>';
            
            tipos.forEach(tipo => {
                if (tipo.activo) {
                    select.innerHTML += `<option value="${tipo._id}">${tipo.nombre}</option>`;
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// ==================== GESTIÓN DE LOCALES ====================

// Cargar lista de locales
async function cargarLocales() {
    const tbody = document.getElementById('tablaLocales');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Cargando locales...</td></tr>';
    }

    try {
        const region = document.getElementById('filtro-region-local')?.value || '';
        const tipo = document.getElementById('filtro-tipo-local')?.value || '';
        const busqueda = document.getElementById('busqueda-local')?.value || '';

        const url = new URL('/api/locales', window.location.origin);
        if (region) url.searchParams.append('region', region);
        if (tipo) url.searchParams.append('tipo', tipo);
        if (busqueda) url.searchParams.append('busqueda', busqueda);

        const response = await fetch(url.toString());
        const datos = await response.json();

        if (response.ok) {
            localesData = datos.locales || [];
            actualizarTablaLocales(localesData);
        } else {
            console.error('Error cargando locales:', datos.error);
            mostrarError('Error al cargar locales: ' + (datos.mensaje || datos.error));
            actualizarTablaLocales([]); // Limpiar la tabla en caso de error
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión al cargar locales.');
        actualizarTablaLocales([]); // Limpiar la tabla en caso de error
    }
}

// Función auxiliar para crear el HTML de una fila de local
function crearFilaLocalHTML(local) {
    const tipoEstablecimientoNombre = local.tipoEstablecimiento?.nombre || '<span class="text-muted">N/A</span>';
    const regionNombre = local.ubicacion?.region?.nombre || '<span class="text-muted">N/A</span>';
    const totalMaquinas = local.estadisticas?.totalMaquinas || 0;
    const maquinasActivas = local.estadisticas?.maquinasActivas || 0;
    const totalIngresos = (local.estadisticas?.totalIngresos || 0).toFixed(2);

    return `
        <tr>
            <td><strong>${local.codigoLocal}</strong></td>
            <td>${local.nombre}</td>
            <td>${tipoEstablecimientoNombre}</td>
            <td>${regionNombre}</td>
            <td>
                <span class="badge bg-info">${totalMaquinas}</span>
                <small class="text-muted">(${maquinasActivas} activas)</small>
            </td>
            <td>€${totalIngresos}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editarLocal('${local.codigoLocal}')" title="Editar Local">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="eliminarLocal('${local.codigoLocal}')" title="Eliminar Local">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// Actualizar tabla de locales
function actualizarTablaLocales(locales) {
    const tbody = document.getElementById('tablaLocales');
    if (!tbody) {
        console.error('Elemento #tablaLocales no encontrado.');
        return;
    }

    if (!locales || locales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay locales que coincidan con los filtros.</td></tr>';
        return;
    }

    tbody.innerHTML = locales.map(crearFilaLocalHTML).join('');
}

async function guardarLocal(event) {
    event.preventDefault();
    const localId = document.getElementById('local-id').value;
    const esEdicion = !!localId;

    const datosLocal = {
        nombre: document.getElementById('nombreLocal').value,
        tipoEstablecimiento: document.getElementById('tipoEstablecimiento').value,
        ubicacion: {
            region: document.getElementById('regionLocal').value,
            ciudad: document.getElementById('ciudadLocal').value,
            direccion: document.getElementById('direccionLocal').value,
            codigoPostal: document.getElementById('codigo-postal').value,
            piso: document.getElementById('piso-zona-local').value
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

    if (!esEdicion) {
        datosLocal.codigoLocal = document.getElementById('codigoLocal').value;
    }

    const url = esEdicion ? `/api/locales/${localId}` : '/api/locales';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosLocal)
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarExito(`Local ${esEdicion ? 'actualizado' : 'guardado'} exitosamente`);
            cancelarEdicionLocal();
            cargarLocales();
            cargarLocalesParaSelect();
        } else {
            if (response.status === 409) {
                mostrarError(`Error: ${resultado.error}. El código de local ya existe.`);
            } else {
                mostrarError(`Error al ${esEdicion ? 'actualizar' : 'guardar'} local: ` + (resultado.error || resultado.message));
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(`Error de conexión al ${esEdicion ? 'actualizar' : 'guardar'} local`);
    }
}

// Cargar locales para el select de máquinas
async function cargarLocalesParaSelect() {
    const select = document.getElementById('localExistente');
    if (!select) return;

    // Reutilizar datos si ya están cargados
    if (localesData && localesData.length > 0) {
        select.innerHTML = '<option value="">Seleccionar local...</option>';
        localesData.forEach(local => {
            if(local.activo) {
                select.innerHTML += `<option value="${local.codigoLocal}">${local.nombre} - ${local.ubicacion?.ciudad || ''}</option>`;
            }
        });
        return;
    }

    // Si no hay datos, hacer la petición
    try {
        const response = await fetch('/api/locales?activo=true&limite=500'); // Pedir solo activos
        const datos = await response.json();
        
        console.log('Respuesta de /api/locales:', datos); // <-- AÑADIDO PARA DEPURAR
        
        if (response.ok) {
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
function editarLocal(codigoLocal) {
    const local = localesData.find(l => l.codigoLocal === codigoLocal);
    if (!local) {
        mostrarError('No se encontró el local para editar.');
        return;
    }

    document.getElementById('local-id').value = local._id;
    document.getElementById('codigoLocal').value = local.codigoLocal;
    document.getElementById('codigoLocal').disabled = true;
    document.getElementById('nombreLocal').value = local.nombre;
    document.getElementById('tipoEstablecimiento').value = local.tipoEstablecimiento?._id || '';
    document.getElementById('regionLocal').value = local.ubicacion.region?._id || '';
    document.getElementById('ciudadLocal').value = local.ubicacion.ciudad;
    document.getElementById('direccionLocal').value = local.ubicacion.direccion;
    document.getElementById('codigo-postal').value = local.ubicacion.codigoPostal || '';
    document.getElementById('piso-zona-local').value = local.ubicacion.piso || '';
    document.getElementById('responsableLocal').value = local.contacto?.nombreResponsable || '';
    document.getElementById('telefonoLocal').value = local.contacto?.telefono || '';
    document.getElementById('emailLocal').value = local.contacto?.email || '';
    document.getElementById('flujoPersonas').value = local.caracteristicas?.flujoPersonas || 'Medio';
    document.getElementById('nivelSeguridad').value = local.caracteristicas?.nivelSeguridad || 'Medio';
    document.getElementById('notasLocal').value = local.notas || '';

    document.querySelector('#locales-panel h5').textContent = 'Editar Local';
    document.getElementById('cancelar-edicion-local').style.display = 'block';
    document.getElementById('form-local').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionLocal() {
    document.getElementById('form-local').reset();
    document.getElementById('local-id').value = '';
    document.getElementById('codigoLocal').disabled = false;
    document.querySelector('#locales-panel h5').textContent = 'Agregar Nuevo Local';
    document.getElementById('cancelar-edicion-local').style.display = 'none';
}

// Ver detalles de local
function verDetallesLocal(codigo) {
    alert('Ver detalles del local: ' + codigo);
}

// Eliminar local
async function eliminarLocal(codigoLocal) {
    if (!confirm('¿Está seguro de eliminar este local? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/locales/${codigoLocal}`, {
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
