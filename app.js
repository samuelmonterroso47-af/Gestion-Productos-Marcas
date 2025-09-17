// Función para cambiar entre pestañas
function switchTab(tabId) {
    // Ocultar todos los módulos
    document.querySelectorAll('.module-content').forEach(module => {
        module.classList.remove('active');
    });
    
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Mostrar el módulo correspondiente
    const moduleNumber = tabId.split('-')[1];
    document.getElementById(`module-${moduleNumber}`).classList.add('active');
}

// Función para mostrar detalles
function showDetails(code) {
    let detailsHTML = `
        <p><strong>Código Madre:</strong> ${code}</p>
        <p><strong>Fecha Última Compra:</strong> 2023-10-15</p>
        <p><strong>Continuidad:</strong> Buena continuidad</p>
        <p class="mt-4"><strong>Códigos Alternos:</strong></p>
        <ul class="list-disc pl-5 mt-2">
    `;
    
    if (code === 'A101') {
        detailsHTML += `
            <li>A102 - Compras: 2 (2023-09-10, 2023-10-05)</li>
            <li>A103 - Compras: 1 (2023-08-15)</li>
        `;
    } else if (code === 'B202') {
        detailsHTML += `
            <li>B203 - Compras: 1 (2023-08-22)</li>
        `;
    } else if (code === 'C303') {
        detailsHTML += `
            <li>C304 - Compras: 2 (2023-10-12, 2023-11-01)</li>
            <li>C305 - Compras: 1 (2023-09-18)</li>
            <li>C306 - Compras: 2 (2023-10-20, 2023-11-02)</li>
        `;
    } else {
        detailsHTML += `<li>No tiene códigos alternos</li>`;
    }
    
    detailsHTML += `</ul>`;
    
    document.getElementById('modal-details').innerHTML = detailsHTML;
    document.getElementById('detail-modal').style.display = 'flex';
}

// Función para cerrar modal
function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

// Función para asociar código alterno
function associateAlternateCode() {
    const motherCode = document.getElementById('motherCode').value.trim();
    const alternateCode = document.getElementById('alternateCode').value.trim();
    
    if (!motherCode || !alternateCode) {
        alert('Por favor, complete ambos campos');
        return;
    }
    
    alert(`Código alterno "${alternateCode}" asociado con éxito a "${motherCode}"`);
    
    // Limpiar campos
    document.getElementById('motherCode').value = '';
    document.getElementById('alternateCode').value = '';
}

// Función para buscar códigos
function searchCodes() {
    const searchTerm = document.getElementById('codeSearch').value.toLowerCase();
    alert(`Buscando: ${searchTerm}`);
    // Aquí iría la lógica de búsqueda real
}

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar event listeners para las pestañas
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.id);
        });
    });
    
    // Configurar event listeners para los botones de aplicar filtros
    document.getElementById('applyFilter1').addEventListener('click', function() {
        alert('Filtros aplicados para Evaluación 3WH');
    });
    
    document.getElementById('applyFilter2').addEventListener('click', function() {
        alert('Filtros aplicados para Evaluación 2WH');
    });
    
    document.getElementById('applyFilter3').addEventListener('click', function() {
        alert('Filtros aplicados para Promedios de Clientes');
    });
    
    document.getElementById('applyFilter4').addEventListener('click', function() {
        alert('Filtros aplicados para Recuperación de Marcas');
    });
    
    document.getElementById('applyFilter5').addEventListener('click', function() {
        alert('Filtros aplicados para Recuperación de Códigos');
    });
    
    // Configurar event listeners para el módulo de códigos
    document.getElementById('searchButton').addEventListener('click', searchCodes);
    document.getElementById('associateButton').addEventListener('click', associateAlternateCode);
    
    // Búsqueda al presionar Enter
    document.getElementById('codeSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCodes();
        }
    });
    
    // Simular datos de usuario
    document.getElementById('userIdDisplay').textContent = "UsuarioDemo123";
});