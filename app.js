// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, runTransaction, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

setLogLevel('debug');

// Variables globales de Firebase
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicialización de la aplicación
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let userId = null;

let data = {
    mototaxis: [],
    sales: [],
    clients: [],
    brands: [],
    codes: []
};

const CRITICAL_BRANDS = ['GTS', 'CEAT', 'LIYANG', 'KOLBEN', 'MTP'];

// Referencias a los elementos del DOM
const tabs = document.querySelectorAll('.tab-button');
const contents = document.querySelectorAll('.module-content');
const userIdDisplay = document.getElementById('userIdDisplay');
const modal = document.getElementById('message-modal');
const modalMessage = document.getElementById('modal-message');

function showModal(message) {
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}
window.closeModal = closeModal;

// Lógica para cambiar de pestaña
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`module-${tab.id.split('-')[1]}`).classList.add('active');
        renderCurrentModule();
    });
});

// Función para exportar datos a CSV
window.exportData = (moduleId) => {
    let headers = [];
    let rows = [];

    switch (moduleId) {
        case 'module1':
            headers = ['Municipio', 'Participacion (%)', 'Ventas Totales', 'Mototaxis Estimados', 'Recomendacion'];
            rows = window.currentModuleData.map(item => [
                item.municipio,
                item.marketShare,
                item.sales,
                item.mototaxis,
                item.recommendation
            ]);
            break;
        case 'module1-1':
            headers = ['Municipio', 'Ventas Promedio'];
            rows = window.currentModuleData.map(item => [
                item.municipio,
                item.averageSales
            ]);
            break;
        case 'module2':
            headers = ['Cliente', 'Promedio Actual', 'Promedio Histórico', 'Tendencia'];
            rows = window.currentModuleData.map(item => [
                item.client,
                item.currentAverage,
                item.historicalAverage,
                item.trend
            ]);
            break;
        case 'module3':
            headers = ['Cliente', 'Marca', 'Última Fecha de Compra', 'Días Transcurridos'];
            rows = window.currentModuleData.map(item => [
                item.client,
                item.brand,
                item.lastPurchaseDate,
                item.daysSincePurchase
            ]);
            break;
        case 'module4':
            headers = ['Cliente', 'Código Abandonado', 'Última Compra Original', 'Código Alterno', 'Última Compra Alterno', 'Relación Validada'];
            rows = window.currentModuleData.map(item => [
                item.client,
                item.originalCode,
                item.originalLastPurchase,
                item.alternateCode,
                item.alternateLastPurchase,
                item.isValidated ? 'Sí' : 'No'
            ]);
            break;
    }

    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${moduleId}-data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Módulo 1: Evaluación de Mercado 3WH ---
function renderModule1() {
    const container = document.getElementById('module1-content');
    container.innerHTML = `<p class="text-center text-gray-500">Calculando...</p>`;
    
    const marketShareThreshold = parseFloat(document.getElementById('marketShareThreshold').value) || 0;
    const municipioFilter = document.getElementById('municipio3WHFilter').value;

    // Limpiar y poblar los filtros de municipio
    const municipios = [...new Set(data.mototaxis.map(d => d.municipio))];
    const municipioSelect = document.getElementById('municipio3WHFilter');
    municipioSelect.innerHTML = '<option value="">Todos</option>';
    municipios.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        municipioSelect.appendChild(option);
    });
    municipioSelect.value = municipioFilter; // Mantener el filtro seleccionado

    const marketData = data.mototaxis.map(item => {
        const totalSalesForMunicipality = data.sales
            .filter(sale => sale.municipio === item.municipio)
            .reduce((acc, sale) => acc + sale.amount, 0);

        const marketShare = (totalSalesForMunicipality / item.mototaxis) * 100;
        const recommendation = marketShare < marketShareThreshold ? 'Enfocar en este municipio' : 'Mantener o expandir';

        return {
            municipio: item.municipio,
            mototaxis: item.mototaxis,
            sales: totalSalesForMunicipality,
            marketShare: marketShare.toFixed(2),
            recommendation: recommendation
        };
    }).filter(item => {
        if (municipioFilter && item.municipio !== municipioFilter) return false;
        return item.marketShare < marketShareThreshold;
    });

    window.currentModuleData = marketData;

    let tableHtml = `<div class="bg-gray-100 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Recomendación: Enfocarse en municipios con participación de mercado de mototaxis (3WH) por debajo del ${marketShareThreshold}%.</p>
                    </div>
                    <table class="w-full text-left whitespace-nowrap table-auto mt-4">
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th class="p-4 rounded-tl-lg">Municipio</th>
                                <th class="p-4">Ventas Totales</th>
                                <th class="p-4">Mototaxis Estimados</th>
                                <th class="p-4">Participación (%)</th>
                                <th class="p-4 rounded-tr-lg">Recomendación</th>
                            </tr>
                        </thead>
                        <tbody>`;
    if (marketData.length === 0) {
        tableHtml += `<tr><td colspan="5" class="text-center py-4 text-gray-500">No se encontraron datos que cumplan los criterios.</td></tr>`;
    } else {
        marketData.forEach(item => {
            tableHtml += `<tr class="border-b border-gray-200">
                            <td class="p-4">${item.municipio}</td>
                            <td class="p-4">$${item.sales.toLocaleString('es-GT')}</td>
                            <td class="p-4">${item.mototaxis}</td>
                            <td class="p-4">${item.marketShare}%</td>
                            <td class="p-4">${item.recommendation}</td>
                        </tr>`;
        });
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

// --- Módulo 1.1: Evaluación de Mercado 2WH ---
function renderModule1_1() {
    const container = document.getElementById('module1-1-content');
    container.innerHTML = `<p class="text-center text-gray-500">Calculando...</p>`;
    
    const municipioFilter = document.getElementById('municipio2WHFilter').value;

    // Limpiar y poblar los filtros
    const municipios = [...new Set(data.sales.map(d => d.municipio))];
    const municipioSelect = document.getElementById('municipio2WHFilter');
    municipioSelect.innerHTML = '<option value="">Todos</option>';
    municipios.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        municipioSelect.appendChild(option);
    });
    municipioSelect.value = municipioFilter;

    const salesByMunicipio = data.sales.reduce((acc, sale) => {
        if (sale.brand.includes('2WH')) {
            acc[sale.municipio] = (acc[sale.municipio] || 0) + sale.amount;
        }
        return acc;
    }, {});

    const avgSalesByMunicipio = Object.entries(salesByMunicipio).map(([municipio, totalSales]) => {
        const count = data.sales.filter(s => s.municipio === municipio && s.brand.includes('2WH')).length;
        const average = totalSales / (count > 0 ? count : 1);
        return { municipio, averageSales: average.toFixed(2) };
    }).filter(item => {
        if (municipioFilter && item.municipio !== municipioFilter) return false;
        return item.averageSales < 10000;
    });

    window.currentModuleData = avgSalesByMunicipio;

    let tableHtml = `<div class="bg-gray-100 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Listado de municipios con ventas promedio (2WH) por debajo de Q.10,000 para recuperar.</p>
                    </div>
                    <table class="w-full text-left whitespace-nowrap table-auto mt-4">
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th class="p-4 rounded-tl-lg">Municipio</th>
                                <th class="p-4 rounded-tr-lg">Ventas Promedio</th>
                            </tr>
                        </thead>
                        <tbody>`;
    if (avgSalesByMunicipio.length === 0) {
        tableHtml += `<tr><td colspan="2" class="text-center py-4 text-gray-500">No se encontraron municipios con ventas bajas.</td></tr>`;
    } else {
        avgSalesByMunicipio.forEach(item => {
            tableHtml += `<tr class="border-b border-gray-200">
                            <td class="p-4">${item.municipio}</td>
                            <td class="p-4">$${parseFloat(item.averageSales).toLocaleString('es-GT')}</td>
                        </tr>`;
        });
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

// --- Módulo 2: Promedios de Clientes ---
function renderModule2() {
    const container = document.getElementById('module2-content');
    container.innerHTML = `<p class="text-center text-gray-500">Calculando...</p>`;
    
    const clientFilter = document.getElementById('clientePromedioFilter').value;

    // Limpiar y poblar los filtros
    const clients = [...new Set(data.sales.map(d => d.client_id))];
    const clientSelect = document.getElementById('clientePromedioFilter');
    clientSelect.innerHTML = '<option value="">Todos</option>';
    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        clientSelect.appendChild(option);
    });
    clientSelect.value = clientFilter;

    const clientTrends = data.clients.filter(client => {
        if (clientFilter && client.client_id !== clientFilter) return false;
        return client.currentAverage < client.historicalAverage;
    }).map(client => ({
        client: client.client_id,
        currentAverage: parseFloat(client.currentAverage).toFixed(2),
        historicalAverage: parseFloat(client.historicalAverage).toFixed(2),
        trend: 'A la baja'
    }));
    
    window.currentModuleData = clientTrends;

    let tableHtml = `<div class="bg-gray-100 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Listado de clientes con tendencia de compra a la baja.</p>
                    </div>
                    <table class="w-full text-left whitespace-nowrap table-auto mt-4">
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th class="p-4 rounded-tl-lg">Cliente</th>
                                <th class="p-4">Promedio Actual</th>
                                <th class="p-4">Promedio Histórico</th>
                                <th class="p-4 rounded-tr-lg">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody>`;
    if (clientTrends.length === 0) {
        tableHtml += `<tr><td colspan="4" class="text-center py-4 text-gray-500">No se encontraron clientes con tendencia a la baja.</td></tr>`;
    } else {
        clientTrends.forEach(item => {
            tableHtml += `<tr class="border-b border-gray-200">
                            <td class="p-4">${item.client}</td>
                            <td class="p-4">$${item.currentAverage.toLocaleString('es-GT')}</td>
                            <td class="p-4">$${item.historicalAverage.toLocaleString('es-GT')}</td>
                            <td class="p-4">${item.trend}</td>
                        </tr>`;
        });
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

// --- Módulo 3: Recuperación de Marcas ---
function renderModule3() {
    const container = document.getElementById('module3-content');
    container.innerHTML = `<p class="text-center text-gray-500">Calculando...</p>`;

    const clientFilter = document.getElementById('clienteMarcaFilter').value;
    const brandFilter = document.getElementById('marcaFilter').value;

    // Limpiar y poblar los filtros
    const clients = [...new Set(data.sales.map(d => d.client_id))];
    const brands = [...new Set(data.sales.map(d => d.brand))];
    const clientSelect = document.getElementById('clienteMarcaFilter');
    clientSelect.innerHTML = '<option value="">Todos</option>';
    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        clientSelect.appendChild(option);
    });
    clientSelect.value = clientFilter;
    
    const criticalBrandsData = {};

    data.sales.forEach(sale => {
        if (CRITICAL_BRANDS.includes(sale.brand)) {
            if (!criticalBrandsData[sale.client_id]) {
                criticalBrandsData[sale.client_id] = {};
            }
            if (!criticalBrandsData[sale.client_id][sale.brand]) {
                criticalBrandsData[sale.client_id][sale.brand] = new Date(sale.purchase_date);
            }
            const lastDate = criticalBrandsData[sale.client_id][sale.brand];
            if (new Date(sale.purchase_date) > lastDate) {
                criticalBrandsData[sale.client_id][sale.brand] = new Date(sale.purchase_date);
            }
        }
    });

    const now = new Date();
    const clientsToFollowUp = [];

    for (const client in criticalBrandsData) {
        for (const brand in criticalBrandsData[client]) {
            const lastPurchase = criticalBrandsData[client][brand];
            const diffTime = Math.abs(now - lastPurchase);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const threeMonthsInDays = 3 * 30; // Approx

            if (diffDays > threeMonthsInDays) {
                clientsToFollowUp.push({
                    client: client,
                    brand: brand,
                    lastPurchaseDate: lastPurchase.toLocaleDateString(),
                    daysSincePurchase: diffDays
                });
            }
        }
    }

    const filteredClients = clientsToFollowUp.filter(item => {
        if (clientFilter && item.client !== clientFilter) return false;
        if (brandFilter && item.brand !== brandFilter) return false;
        return true;
    });

    window.currentModuleData = filteredClients;

    let tableHtml = `<div class="bg-gray-100 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Listado de clientes que no han comprado una marca crítica en más de 3 meses.</p>
                    </div>
                    <table class="w-full text-left whitespace-nowrap table-auto mt-4">
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th class="p-4 rounded-tl-lg">Cliente</th>
                                <th class="p-4">Marca</th>
                                <th class="p-4">Última Compra</th>
                                <th class="p-4 rounded-tr-lg">Días Transcurridos</th>
                            </tr>
                        </thead>
                        <tbody>`;
    if (filteredClients.length === 0) {
        tableHtml += `<tr><td colspan="4" class="text-center py-4 text-gray-500">No se encontraron clientes que cumplan los criterios.</td></tr>`;
    } else {
        filteredClients.forEach(item => {
            tableHtml += `<tr class="border-b border-gray-200">
                            <td class="p-4">${item.client}</td>
                            <td class="p-4">${item.brand}</td>
                            <td class="p-4">${item.lastPurchaseDate}</td>
                            <td class="p-4">${item.daysSincePurchase}</td>
                        </tr>`;
        });
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

// --- Módulo 4: Recuperación de Códigos ---
async function renderModule4() {
    const container = document.getElementById('module4-content');
    container.innerHTML = `<p class="text-center text-gray-500">Cargando...</p>`;

    const clientFilter = document.getElementById('clienteCodigoFilter').value;
    const originalCodeFilter = document.getElementById('codigoOriginalFilter').value;

    // Limpiar y poblar filtros
    const clients = [...new Set(data.sales.map(d => d.client_id))];
    const codes = [...new Set(data.sales.map(d => d.product_code))];
    const clientSelect = document.getElementById('clienteCodigoFilter');
    clientSelect.innerHTML = '<option value="">Todos</option>';
    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        clientSelect.appendChild(option);
    });
    clientSelect.value = clientFilter;

    const codeSelect = document.getElementById('codigoOriginalFilter');
    codeSelect.innerHTML = '<option value="">Todos</option>';
    codes.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        codeSelect.appendChild(option);
    });
    codeSelect.value = originalCodeFilter;

    // Lógica de recuperación de códigos
    const abandonedCodes = [];
    const productHistory = data.sales.reduce((acc, sale) => {
        if (!acc[sale.client_id]) acc[sale.client_id] = {};
        if (!acc[sale.client_id][sale.product_code]) acc[sale.client_id][sale.product_code] = [];
        acc[sale.client_id][sale.product_code].push(new Date(sale.purchase_date));
        return acc;
    }, {});

    // Obtener relaciones de códigos alternos desde Firestore
    const codeAlternateRef = doc(db, 'artifacts', appId, 'users', userId, 'code_alternates', 'alternates');
    let savedAlternates = {};
    try {
        const docSnap = await getDoc(codeAlternateRef);
        if (docSnap.exists() && docSnap.data().data) {
            savedAlternates = JSON.parse(docSnap.data().data);
        }
    } catch (e) {
        console.error("Error al cargar códigos alternos: ", e);
    }

    for (const client in productHistory) {
        const clientCodes = Object.keys(productHistory[client]);
        clientCodes.forEach(originalCode => {
            const lastPurchaseOriginal = new Date(Math.max(...productHistory[client][originalCode]));
            const daysSinceLastPurchase = Math.ceil(Math.abs(new Date() - lastPurchaseOriginal) / (1000 * 60 * 60 * 24));

            if (daysSinceLastPurchase > 90) { // Consideramos abandonado si no se compra en 3 meses
                let alternateCode = savedAlternates[originalCode] || '';
                let alternateLastPurchase = 'N/A';
                let isValidated = false;

                if (alternateCode && productHistory[client][alternateCode]) {
                    alternateLastPurchase = new Date(Math.max(...productHistory[client][alternateCode]));
                    isValidated = alternateLastPurchase > lastPurchaseOriginal;
                    alternateLastPurchase = alternateLastPurchase.toLocaleDateString();
                }

                abandonedCodes.push({
                    client: client,
                    originalCode: originalCode,
                    originalLastPurchase: lastPurchaseOriginal.toLocaleDateString(),
                    alternateCode: alternateCode,
                    alternateLastPurchase: alternateLastPurchase,
                    isValidated: isValidated
                });
            }
        });
    }

    const filteredCodes = abandonedCodes.filter(item => {
        if (clientFilter && item.client !== clientFilter) return false;
        if (originalCodeFilter && item.originalCode !== originalCodeFilter) return false;
        return true;
    });

    window.currentModuleData = filteredCodes;

    let tableHtml = `<div class="bg-gray-100 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Códigos de producto que los clientes dejaron de comprar. Puedes registrar un código alterno y el sistema validará si la última compra del alterno es más reciente.</p>
                    </div>
                    <table class="w-full text-left whitespace-nowrap table-auto mt-4">
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th class="p-4 rounded-tl-lg">Cliente</th>
                                <th class="p-4">Código Abandonado</th>
                                <th class="p-4">Última Compra</th>
                                <th class="p-4">Código Alterno</th>
                                <th class="p-4">Validado</th>
                                <th class="p-4 rounded-tr-lg">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>`;
    if (filteredCodes.length === 0) {
        tableHtml += `<tr><td colspan="6" class="text-center py-4 text-gray-500">No se encontraron códigos abandonados.</td></tr>`;
    } else {
        filteredCodes.forEach(item => {
            const alternateInput = `<input type="text" value="${item.alternateCode}" class="w-full px-2 py-1 border rounded-md" data-original="${item.originalCode}" onchange="updateAlternateCode(this)">`;
            const validatedIcon = item.isValidated ? '<span class="text-green-500">Sí</span>' : '<span class="text-red-500">No</span>';
            
            tableHtml += `<tr class="border-b border-gray-200">
                            <td class="p-4">${item.client}</td>
                            <td class="p-4">${item.originalCode}</td>
                            <td class="p-4">${item.originalLastPurchase}</td>
                            <td class="p-4">${alternateInput}</td>
                            <td class="p-4">${validatedIcon}</td>
                            <td class="p-4">
                                <button onclick="saveAlternateCode('${item.originalCode}', this.parentNode.previousElementSibling.previousElementSibling.firstElementChild.value)" class="px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">Guardar</button>
                            </td>
                        </tr>`;
        });
    }
    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

// Funciones de actualización de datos de Códigos Alternos en Firestore
window.updateAlternateCode = (input) => {
    const originalCode = input.getAttribute('data-original');
    const newAlternateCode = input.value;
    // La actualización se realizará al presionar el botón de "Guardar"
};

window.saveAlternateCode = async (originalCode, alternateCode) => {
    if (!userId) {
        showModal("Error: Usuario no autenticado.");
        return;
    }

    const codeAlternateRef = doc(db, 'artifacts', appId, 'users', userId, 'code_alternates', 'alternates');
    
    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(codeAlternateRef);
            let savedAlternates = {};
            if (docSnap.exists() && docSnap.data().data) {
                savedAlternates = JSON.parse(docSnap.data().data);
            }
            savedAlternates[originalCode] = alternateCode;
            transaction.set(codeAlternateRef, { data: JSON.stringify(savedAlternates) });
        });
        showModal("Relación de código guardada con éxito.");
        // Volver a renderizar el módulo para reflejar el cambio
        renderModule4();
    } catch (e) {
        console.error("Error al guardar la relación de código: ", e);
        showModal("Error al guardar la relación. Por favor, intente de nuevo.");
    }
};

// --- Lógica de inicialización y carga de datos ---
async function populateFirestore() {
    if (!userId) return;
    const publicMototaxisRef = doc(db, 'artifacts', appId, 'public', 'data', 'mototaxis', 'list');
    const publicSalesRef = doc(db, 'artifacts', appId, 'public', 'data', 'sales', 'history');
    const privateClientsRef = doc(db, 'artifacts', appId, 'users', userId, 'client_data', 'averages');

    try {
        const mototaxisDoc = await getDoc(publicMototaxisRef);
        if (!mototaxisDoc.exists()) {
            await setDoc(publicMototaxisRef, {
                data: JSON.stringify([
                    { municipio: 'Quetzaltenango', mototaxis: 1500, sales: 500000 },
                    { municipio: 'Huehuetenango', mototaxis: 2000, sales: 800000 },
                    { municipio: 'Cobán', mototaxis: 1000, sales: 100000 },
                    { municipio: 'Ciudad de Guatemala', mototaxis: 5000, sales: 2500000 }
                ])
            });
        }
        
        const salesDoc = await getDoc(publicSalesRef);
        if (!salesDoc.exists()) {
            await setDoc(publicSalesRef, {
                data: JSON.stringify([
                    { municipio: 'Quetzaltenango', client_id: 'cliente_1', product_code: 'A101', brand: 'GTS', purchase_date: '2025-01-10', amount: 50000 },
                    { municipio: 'Huehuetenango', client_id: 'cliente_2', product_code: 'B202', brand: 'CEAT', purchase_date: '2025-02-15', amount: 120000 },
                    { municipio: 'Cobán', client_id: 'cliente_3', product_code: 'C303', brand: 'LIYANG', purchase_date: '2025-03-20', amount: 8000 },
                    { municipio: 'Cobán', client_id: 'cliente_3', product_code: 'D404', brand: 'KOLBEN', purchase_date: '2025-06-25', amount: 15000 },
                    { municipio: 'Ciudad de Guatemala', client_id: 'cliente_4', product_code: 'E505', brand: 'MTP', purchase_date: '2025-07-01', amount: 500000 },
                    { municipio: 'Ciudad de Guatemala', client_id: 'cliente_4', product_code: 'F606', brand: 'MTP', purchase_date: '2025-07-05', amount: 15000 },
                    { municipio: 'Quetzaltenango', client_id: 'cliente_1', product_code: 'A101', brand: 'GTS', purchase_date: '2025-05-20', amount: 60000 },
                    { municipio: 'Quetzaltenango', client_id: 'cliente_1', product_code: 'A101', brand: 'GTS', purchase_date: '2025-01-20', amount: 4000 }, // Venta 2WH
                    { municipio: 'Huehuetenango', client_id: 'cliente_2', product_code: 'B202', brand: 'CEAT', purchase_date: '2025-06-10', amount: 130000 },
                    { municipio: 'Cobán', client_id: 'cliente_3', product_code: 'G707', brand: 'OTRA', purchase_date: '2025-07-28', amount: 10000 },
                    { municipio: 'Ciudad de Guatemala', client_id: 'cliente_5', product_code: 'H808', brand: 'MTP', purchase_date: '2025-04-10', amount: 10000 },
                    { municipio: 'Ciudad de Guatemala', client_id: 'cliente_5', product_code: 'H808', brand: 'MTP', purchase_date: '2025-05-15', amount: 15000 },
                    { municipio: 'Quetzaltenango', client_id: 'cliente_6', product_code: 'I909', brand: 'CEAT', purchase_date: '2024-12-10', amount: 10000 },
                    { municipio: 'Quetzaltenango', client_id: 'cliente_6', product_code: 'J100', brand: 'CEAT', purchase_date: '2025-03-15', amount: 5000 }
                ])
            });
        }

        const clientsDoc = await getDoc(privateClientsRef);
        if (!clientsDoc.exists()) {
             await setDoc(privateClientsRef, {
                data: JSON.stringify([
                    { client_id: 'cliente_1', currentAverage: 55000, historicalAverage: 70000 },
                    { client_id: 'cliente_2', currentAverage: 125000, historicalAverage: 110000 },
                    { client_id: 'cliente_3', currentAverage: 11500, historicalAverage: 20000 }
                ])
            });
        }

    } catch (e) {
        console.error("Error al poblar la base de datos:", e);
    }
}

async function fetchData() {
    if (!userId) return;
    
    const publicMototaxisRef = doc(db, 'artifacts', appId, 'public', 'data', 'mototaxis', 'list');
    const publicSalesRef = doc(db, 'artifacts', appId, 'public', 'data', 'sales', 'history');
    const privateClientsRef = doc(db, 'artifacts', appId, 'users', userId, 'client_data', 'averages');

    onSnapshot(publicMototaxisRef, (doc) => {
        if (doc.exists() && doc.data().data) {
            data.mototaxis = JSON.parse(doc.data().data);
            renderCurrentModule();
        }
    });

    onSnapshot(publicSalesRef, (doc) => {
        if (doc.exists() && doc.data().data) {
            data.sales = JSON.parse(doc.data().data);
            renderCurrentModule();
        }
    });

    onSnapshot(privateClientsRef, (doc) => {
        if (doc.exists() && doc.data().data) {
            data.clients = JSON.parse(doc.data().data);
            renderCurrentModule();
        }
    });
}

function renderCurrentModule() {
    const activeTab = document.querySelector('.tab-button.active');
    if (!activeTab) return;
    switch (activeTab.id) {
        case 'tab-1':
            renderModule1();
            break;
        case 'tab-1-1':
            renderModule1_1();
            break;
        case 'tab-2':
            renderModule2();
            break;
        case 'tab-3':
            renderModule3();
            break;
        case 'tab-4':
            renderModule4();
            break;
    }
}

// Asignar listeners a los filtros
document.getElementById('marketShareThreshold').addEventListener('input', renderModule1);
document.getElementById('municipio3WHFilter').addEventListener('change', renderModule1);
document.getElementById('municipio2WHFilter').addEventListener('change', renderModule1_1);
document.getElementById('clientePromedioFilter').addEventListener('change', renderModule2);
document.getElementById('clienteMarcaFilter').addEventListener('change', renderModule3);
document.getElementById('marcaFilter').addEventListener('change', renderModule3);
document.getElementById('clienteCodigoFilter').addEventListener('change', renderModule4);
document.getElementById('codigoOriginalFilter').addEventListener('change', renderModule4);

// Manejo de autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        userIdDisplay.textContent = userId;
        await populateFirestore();
        await fetchData();
        renderCurrentModule();
    } else {
        // Si el token inicial no existe, intentar login anónimo
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Error al autenticar:", error);
            userIdDisplay.textContent = "Error de autenticación.";
            showModal("Hubo un problema al autenticar el usuario. Por favor, recargue la página.");
        }
    }
});