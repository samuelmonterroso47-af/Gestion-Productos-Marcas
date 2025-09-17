// Importaciones de Firebase
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
        sales: []
    };

    // Referencias a los elementos del DOM
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

    // Función para exportar datos a CSV
    window.exportData = (moduleId) => {
        let headers = [];
        let rows = [];

        if (moduleId === 'module1') {
            headers = ['Municipio', 'Participacion (%)', 'Ventas Totales', 'Mototaxis Estimados', 'Recomendacion'];
            rows = window.currentModuleData.map(item => [
                item.municipio,
                item.marketShare,
                item.sales,
                item.mototaxis,
                item.recommendation
            ]);
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
        municipioSelect.value = municipioFilter;

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

    // --- Lógica de inicialización y carga de datos ---
    async function populateFirestore() {
        if (!userId) return;
        const publicMototaxisRef = doc(db, 'artifacts', appId, 'public', 'data', 'mototaxis', 'list');
        const publicSalesRef = doc(db, 'artifacts', appId, 'public', 'data', 'sales', 'history');

        try {
            const mototaxisDoc = await getDoc(publicMototaxisRef);
            if (!mototaxisDoc.exists()) {
                // Aquí se insertan los datos de ejemplo para la estimación de mototaxis
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
                // Aquí se insertan los datos de ejemplo de ventas
                await setDoc(publicSalesRef, {
                    data: JSON.stringify([
                        { municipio: 'Quetzaltenango', client_id: 'cliente_1', product_code: 'A101', brand: 'GTS', purchase_date: '2025-01-10', amount: 50000 },
                        { municipio: 'Huehuetenango', client_id: 'cliente_2', product_code: 'B202', brand: 'CEAT', purchase_date: '2025-02-15', amount: 120000 },
                        { municipio: 'Cobán', client_id: 'cliente_3', product_code: 'C303', brand: 'LIYANG', purchase_date: '2025-03-20', amount: 8000 },
                        { municipio: 'Cobán', client_id: 'cliente_3', product_code: 'D404', brand: 'KOLBEN', purchase_date: '2025-06-25', amount: 15000 },
                        { municipio: 'Ciudad de Guatemala', client_id: 'cliente_4', product_code: 'E505', brand: 'MTP', purchase_date: '2025-07-01', amount: 500000 },
                        { municipio: 'Ciudad de Guatemala', client_id: 'cliente_4', product_code: 'F606', brand: 'MTP', purchase_date: '2025-07-05', amount: 15000 },
                        { municipio: 'Quetzaltenango', client_id: 'cliente_1', product_code: 'A101', brand: 'GTS', purchase_date: '2025-05-20', amount: 60000 },
                        { municipio: 'Quetzaltenango', client_id: 'cliente_1', product_code: 'A101', brand: 'GTS', purchase_date: '2025-01-20', amount: 4000 },
                        { municipio: 'Huehuetenango', client_id: 'cliente_2', product_code: 'B202', brand: 'CEAT', purchase_date: '2025-06-10', amount: 130000 }
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

        onSnapshot(publicMototaxisRef, (doc) => {
            if (doc.exists() && doc.data().data) {
                data.mototaxis = JSON.parse(doc.data().data);
                renderModule1();
            }
        });

        onSnapshot(publicSalesRef, (doc) => {
            if (doc.exists() && doc.data().data) {
                data.sales = JSON.parse(doc.data().data);
                renderModule1();
            }
        });
    }

    // Asignar listeners a los filtros
    document.getElementById('marketShareThreshold').addEventListener('input', renderModule1);
    document.getElementById('municipio3WHFilter').addEventListener('change', renderModule1);

    // Manejo de autenticación
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            userIdDisplay.textContent = userId;
            await populateFirestore();
            await fetchData();
            renderModule1();
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