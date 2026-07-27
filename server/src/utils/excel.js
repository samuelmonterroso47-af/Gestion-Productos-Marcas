const ExcelJS = require('exceljs');

/**
 * Lee un archivo .xlsx/.csv en memoria (buffer) y devuelve un arreglo de
 * objetos plano, uno por fila, usando la primera fila como encabezados.
 * Los encabezados se normalizan a minusculas y sin espacios.
 */
async function parseWorkbookBuffer(buffer, originalName = '') {
    const workbook = new ExcelJS.Workbook();

    if (originalName.toLowerCase().endsWith('.csv')) {
        await workbook.csv.read(bufferToStream(buffer));
    } else {
        await workbook.xlsx.load(buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
    });

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // encabezado
        const obj = {};
        let hasValue = false;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const key = headers[colNumber];
            if (!key) return;
            let value = cell.value;
            if (value && typeof value === 'object' && value.result !== undefined) {
                value = value.result; // formulas
            }
            if (value && typeof value === 'object' && value instanceof Date) {
                obj[key] = value;
            } else {
                obj[key] = value === null || value === undefined ? '' : value;
            }
            if (obj[key] !== '') hasValue = true;
        });
        if (hasValue) rows.push(obj);
    });

    return rows;
}

const { Readable } = require('stream');
function bufferToStream(buffer) {
    return Readable.from(buffer);
}

module.exports = { parseWorkbookBuffer };
