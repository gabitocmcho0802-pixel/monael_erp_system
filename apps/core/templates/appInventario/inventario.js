/**
 * Monael ERP - Inventario JS
 * Manejo interactivo de CRUD, Modales (Crear, Editar, Tallas, Eliminar),
 * Búsqueda reactiva, Filtros por material, Orden A-Z y Paginación.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. SELECTORES PRINCIPALES
    // ==========================================
    const tableBody = document.getElementById('table-body');
    const searchInput = document.getElementById('search-input');
    const btnOrden = document.getElementById('btn-orden');
    
    // Filtros dropdown
    const filterWrapper = document.getElementById('filter-wrapper');
    const filterBtn = document.getElementById('filter-btn');
    const filterMenu = document.getElementById('filter-menu');
    const filterItems = filterMenu ? filterMenu.querySelectorAll('.inv-dropdown-item') : [];

    // Paginación
    const paginationContainer = document.getElementById('pagination');
    const rowsWrapper = document.getElementById('rows-wrapper');
    const rowsBtn = document.getElementById('rows-btn');
    const rowsLabel = document.getElementById('rows-label');
    const rowsMenu = document.getElementById('rows-menu');
    const rowsItems = rowsMenu ? rowsMenu.querySelectorAll('.inv-dropdown-item') : [];

    // Estado del Inventario
    let rowsPerPage = 10;
    let currentPage = 1;
    let sortAsc = true;
    let activeFilter = 'todos';
    let searchQuery = '';

    // ==========================================
    // 2. MODAL CREAR: GESTIÓN DE TALLAS DINÁMICAS Y SUBIDA DE IMAGEN
    // ==========================================
    const tallasContainer = document.getElementById('tallas-container');
    const btnAddTalla = document.getElementById('btn-add-talla-row');
    const uploadArea = document.getElementById('upload-area');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const uploadHint = document.getElementById('upload-hint');
    const createPreviewBox = document.getElementById('create-img-preview-box');
    const createPreviewImg = document.getElementById('create-img-preview');
    const btnCancelCreateImg = document.getElementById('btn-cancel-create-img');

    // Subida de imagen en Crear
    if (fileInput) {
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragging');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragging');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragging');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    fileInput.files = e.dataTransfer.files;
                    mostrarPreviewCrear(e.dataTransfer.files[0]);
                }
            });
        }

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                mostrarPreviewCrear(fileInput.files[0]);
            }
        });
    }

    function mostrarPreviewCrear(file) {
        if (uploadHint) {
            uploadHint.textContent = `Archivo: ${file.name}`;
            uploadHint.style.color = 'var(--inv-green)';
            uploadHint.style.fontWeight = '600';
        }
        if (createPreviewBox && createPreviewImg) {
            const reader = new FileReader();
            reader.onload = (e) => {
                createPreviewImg.src = e.target.result;
                createPreviewBox.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    }

    if (btnCancelCreateImg && fileInput) {
        btnCancelCreateImg.addEventListener('click', () => {
            fileInput.value = '';
            if (createPreviewBox) createPreviewBox.style.display = 'none';
            if (uploadHint) {
                uploadHint.textContent = 'Seleccione o arrastre una imagen';
                uploadHint.style.color = '';
                uploadHint.style.fontWeight = '';
            }
        });
    }

    // Función constructora de fila de talla (reutilizable)
    function generarFilaTallaHTML(varianteId = '', numero = '', genero = 'UNISEX', stock = '1') {
        const row = document.createElement('div');
        row.className = 'inv-talla-row';
        row.innerHTML = `
            <input type="hidden" name="variante_id" value="${varianteId}">
            <div class="inv-talla-field" style="flex: 0 0 80px;">
                <label class="inv-talla-label">Número</label>
                <input type="text" name="talla" class="inv-input inv-talla-input" placeholder="Ej: 7" value="${numero}" required>
            </div>
            <div class="inv-talla-field" style="flex: 1;">
                <label class="inv-talla-label">Género</label>
                <div class="inv-select-wrapper">
                    <select name="genero" class="inv-select inv-talla-select" required>
                        <option value="MUJER" ${genero === 'MUJER' ? 'selected' : ''}>Mujer</option>
                        <option value="HOMBRE" ${genero === 'HOMBRE' ? 'selected' : ''}>Hombre</option>
                        <option value="UNISEX" ${genero === 'UNISEX' ? 'selected' : ''}>Unisex</option>
                    </select>
                    <i class='bx bx-chevron-down inv-select-icon'></i>
                </div>
            </div>
            <div class="inv-talla-field" style="flex: 0 0 80px;">
                <label class="inv-talla-label">Stock</label>
                <input type="number" name="stock" class="inv-input inv-talla-input" min="0" value="${stock}" required>
            </div>
            <div class="inv-talla-actions">
                <button type="button" class="inv-talla-remove btn-eliminar-fila-talla" title="Quitar talla">
                    <i class='bx bx-x-circle'></i>
                </button>
            </div>
        `;

        row.querySelector('.btn-eliminar-fila-talla').addEventListener('click', () => {
            const parent = row.parentElement;
            if (parent && parent.querySelectorAll('.inv-talla-row').length > 1) {
                row.remove();
            } else {
                alert('Debe haber al menos una talla registrada para el producto.');
            }
        });

        return row;
    }

    // Asignar evento quitar a las filas iniciales de Crear
    if (tallasContainer) {
        tallasContainer.querySelectorAll('.btn-eliminar-fila-talla').forEach(btn => {
            btn.addEventListener('click', function () {
                const row = this.closest('.inv-talla-row');
                if (tallasContainer.querySelectorAll('.inv-talla-row').length > 1) {
                    row.remove();
                } else {
                    alert('Debe haber al menos una talla registrada para el producto.');
                }
            });
        });

        if (btnAddTalla) {
            btnAddTalla.addEventListener('click', () => {
                tallasContainer.appendChild(generarFilaTallaHTML());
            });
        }
    }


    // ==========================================
    // 3. MODAL EDITAR PRODUCTO + EDICIÓN DE TALLAS E IMAGEN
    // ==========================================
    const modalEditar = document.getElementById('modalEditarProducto');
    const formEditar = document.getElementById('form-editar-producto');
    const editCodigo = document.getElementById('edit-codigo');
    const editNombre = document.getElementById('edit-nombre');
    const editCategoria = document.getElementById('edit-categoria');
    const editMaterial = document.getElementById('edit-material');
    const editGama = document.getElementById('edit-gama');
    const editPrecio = document.getElementById('edit-precio');
    const editDescripcion = document.getElementById('edit-descripcion');
    
    // Controles de imagen en edición
    const editImgCurrentBox = document.getElementById('edit-img-current-box');
    const editImgPreview = document.getElementById('edit-img-preview');
    const checkEliminarImagen = document.getElementById('check-eliminar-imagen');
    const editImagenInput = document.getElementById('edit-imagen');

    // Contenedor de tallas en edición
    const editTallasContainer = document.getElementById('edit-tallas-container');
    const btnEditAddTalla = document.getElementById('btn-edit-add-talla');

    if (btnEditAddTalla && editTallasContainer) {
        btnEditAddTalla.addEventListener('click', () => {
            editTallasContainer.appendChild(generarFilaTallaHTML());
        });
    }

    document.querySelectorAll('.btn-abrir-editar').forEach(btn => {
        btn.addEventListener('click', function () {
            const data = this.dataset;
            const id = data.id;

            if (formEditar) formEditar.action = data.url;
            if (editCodigo) editCodigo.value = data.codigo || '';
            if (editNombre) editNombre.value = data.nombre || '';
            if (editCategoria) editCategoria.value = data.categoria || '';
            if (editMaterial) editMaterial.value = data.material || '';
            if (editGama) editGama.value = data.gama || '';
            if (editPrecio) editPrecio.value = data.precio || '';
            if (editDescripcion) editDescripcion.value = data.descripcion || '';

            // Imagen actual
            if (editImagenInput) editImagenInput.value = '';
            if (checkEliminarImagen) checkEliminarImagen.checked = false;

            if (data.imagenUrl && data.imagenUrl.trim() !== '') {
                if (editImgPreview) editImgPreview.src = data.imagenUrl;
                if (editImgCurrentBox) editImgCurrentBox.style.display = 'flex';
            } else {
                if (editImgCurrentBox) editImgCurrentBox.style.display = 'none';
            }

            // Cargar tallas existentes del producto para poder editarlas o quitarlas
            if (editTallasContainer) {
                editTallasContainer.innerHTML = '';
                const dataDiv = document.getElementById(`variantes-data-${id}`);
                let variantes = [];

                if (dataDiv && dataDiv.dataset.json) {
                    try {
                        variantes = JSON.parse(dataDiv.dataset.json);
                    } catch (e) {
                        console.error('Error parseando JSON de variantes:', e);
                    }
                }

                if (variantes && variantes.length > 0) {
                    variantes.forEach(v => {
                        editTallasContainer.appendChild(generarFilaTallaHTML(v.id, v.talla, v.genero, v.stock));
                    });
                } else {
                    // Si no tenía variantes previas, ofrece una fila en blanco
                    editTallasContainer.appendChild(generarFilaTallaHTML());
                }
            }

            if (modalEditar && window.bootstrap) {
                bootstrap.Modal.getOrCreateInstance(modalEditar).show();
            }
        });
    });


    // ==========================================
    // 4. MODAL VER TALLAS
    // ==========================================
    const modalTallas = document.getElementById('modalTallas');
    const tallasTableBody = document.getElementById('tallas-table-body');
    const modalTallasLabel = document.getElementById('modalTallasLabel');

    document.querySelectorAll('.inv-btn-tallas').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;
            const codigo = this.dataset.codigo;
            const dataDiv = document.getElementById(`variantes-data-${id}`);

            if (modalTallasLabel) {
                modalTallasLabel.textContent = `Tallas de: ${nombre} (${codigo})`;
            }

            if (tallasTableBody && dataDiv) {
                const tbodyContent = dataDiv.querySelector('tbody');
                tallasTableBody.innerHTML = tbodyContent ? tbodyContent.innerHTML : '';
            }

            if (modalTallas && window.bootstrap) {
                bootstrap.Modal.getOrCreateInstance(modalTallas).show();
            }
        });
    });


    // ==========================================
    // 5. MODAL ELIMINAR PRODUCTO (Y SUS MEDIAS/VARIANTES)
    // ==========================================
    const modalEliminar = document.getElementById('modalEliminar');
    const formEliminar = document.getElementById('form-eliminar-producto');
    const eliminarNombre = document.getElementById('eliminar-prod-nombre');

    document.querySelectorAll('.btn-abrir-eliminar').forEach(btn => {
        btn.addEventListener('click', function () {
            const data = this.dataset;

            if (formEliminar) formEliminar.action = data.url;
            if (eliminarNombre) {
                eliminarNombre.textContent = `${data.nombre} (${data.codigo})`;
            }

            if (modalEliminar && window.bootstrap) {
                bootstrap.Modal.getOrCreateInstance(modalEliminar).show();
            }
        });
    });


    // ==========================================
    // 6. BUSCADOR, FILTROS Y ORDENAMIENTO EN VIVO
    // ==========================================

    // Toggle dropdown de filtro por material
    if (filterBtn && filterMenu) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('open');
            if (rowsMenu) rowsMenu.classList.remove('open');
        });

        filterItems.forEach(item => {
            item.addEventListener('click', function () {
                filterItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                activeFilter = this.dataset.filter || 'todos';
                
                const span = filterBtn.querySelector('span');
                if (span) span.textContent = this.textContent;

                filterMenu.classList.remove('open');
                aplicarFiltrosYPaginacion();
            });
        });
    }

    // Toggle dropdown de selector "Mostrar" (filas por página)
    if (rowsBtn && rowsMenu) {
        rowsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rowsMenu.classList.toggle('open');
            if (filterMenu) filterMenu.classList.remove('open');
        });

        rowsItems.forEach(item => {
            item.addEventListener('click', function () {
                rowsItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                rowsPerPage = parseInt(this.dataset.rows, 10) || 10;
                if (rowsLabel) rowsLabel.textContent = rowsPerPage;

                rowsMenu.classList.remove('open');
                currentPage = 1;
                aplicarFiltrosYPaginacion();
            });
        });
    }

    // Cerrar dropdowns si se hace clic afuera
    document.addEventListener('click', () => {
        if (filterMenu) filterMenu.classList.remove('open');
        if (rowsMenu) rowsMenu.classList.remove('open');
    });

    // Buscador en el navbar
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            currentPage = 1;
            aplicarFiltrosYPaginacion();
        });
    }

    // Ordenamiento A-Z
    if (btnOrden) {
        btnOrden.addEventListener('click', () => {
            sortAsc = !sortAsc;
            const span = btnOrden.querySelector('span');
            if (span) span.textContent = sortAsc ? 'Orden: A-Z' : 'Orden: Z-A';

            ordenarFilas();
            aplicarFiltrosYPaginacion();
        });
    }

    function ordenarFilas() {
        if (!tableBody) return;
        const rows = Array.from(tableBody.querySelectorAll(':scope > tr.inv-product-row'));

        rows.sort((a, b) => {
            const nomA = (a.dataset.nombre || '').toLowerCase();
            const nomB = (b.dataset.nombre || '').toLowerCase();
            return sortAsc ? nomA.localeCompare(nomB) : nomB.localeCompare(nomA);
        });

        rows.forEach(r => tableBody.appendChild(r));
        const emptyRow = document.getElementById('empty-row');
        if (emptyRow) {
            tableBody.appendChild(emptyRow);
        }
    }


    // ==========================================
    // 7. APLICACIÓN DE FILTROS Y PAGINACIÓN
    // ==========================================
    function aplicarFiltrosYPaginacion() {
        if (!tableBody) return;
        const rows = Array.from(tableBody.querySelectorAll(':scope > tr.inv-product-row'));
        const emptyRow = document.getElementById('empty-row');

        let visibleRows = [];

        rows.forEach(row => {
            const data = row.dataset;
            const textMatch = !searchQuery || 
                (data.codigo && data.codigo.toLowerCase().includes(searchQuery)) ||
                (data.nombre && data.nombre.toLowerCase().includes(searchQuery)) ||
                (data.material && data.material.toLowerCase().includes(searchQuery)) ||
                (data.descripcion && data.descripcion.toLowerCase().includes(searchQuery));

            const filterMatch = (activeFilter === 'todos') || 
                (data.material && data.material.toLowerCase() === activeFilter.toLowerCase());

            if (textMatch && filterMatch) {
                visibleRows.push(row);
            } else {
                row.style.display = 'none';
            }
        });

        if (visibleRows.length === 0) {
            if (emptyRow) emptyRow.style.display = '';
        } else {
            if (emptyRow) emptyRow.style.display = 'none';
        }

        const totalPages = Math.ceil(visibleRows.length / rowsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;

        visibleRows.forEach((row, index) => {
            if (index >= startIndex && index < endIndex) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        renderizarPaginacion(totalPages);
    }

    function renderizarPaginacion(totalPages) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        // Botón Anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'inv-page-btn arrow';
        prevBtn.innerHTML = "<i class='bx bx-chevron-left'></i>";
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                aplicarFiltrosYPaginacion();
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Botones numéricos
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `inv-page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                aplicarFiltrosYPaginacion();
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Botón Siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = 'inv-page-btn arrow';
        nextBtn.innerHTML = "<i class='bx bx-chevron-right'></i>";
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                aplicarFiltrosYPaginacion();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // Inicializar visualización
    aplicarFiltrosYPaginacion();

});
