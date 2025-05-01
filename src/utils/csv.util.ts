// src/utils/excelGenerator.ts
import ExcelJS from 'exceljs';
import {Buffer} from 'buffer';
import {ExcelGeneratorInterface} from "../interface/generic.interface";
import {camelCaseFieldToLabel} from "./helper";
import ServerLogger from "../middleware/server_logging.middleware";

export const generateExcel = async <T>(title: string, data: T[], fields: ExcelGeneratorInterface<T>[], insertZero: boolean = true): Promise<Buffer | null> => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Add title
        const titleRow = worksheet.addRow([title]);
        titleRow.font = {size: 16, bold: true};
        worksheet.addRow([]); // Empty row

        // Add date of export and total count
        worksheet.addRow(['Date of Export:', new Date().toLocaleString()]);
        worksheet.addRow(['Total Count:', data.length]);
        worksheet.addRow([]); // Empty row
        worksheet.addRow([]); // Empty row


        // Add header row
        const header = ['SN', ...fields.map(f => {
            if (typeof f === 'string') {
                return camelCaseFieldToLabel(f);
            } else {
                return f.label;
            }
        })];
        worksheet.addRow(header);

        // Add data rows and auto width for columns
        const columnMaxLengths = new Array(header.length).fill(0);

        data.forEach((item, index) => {
            const row = [index + 1, ...fields.map((f, i) => {
                const field = typeof f === 'string' ? f : f.field;
                const parser = typeof f === 'string' ? undefined : f.parser;
                const value = field.split('.').reduce((o, k) => (o as any)?.[k], item) as any;
                const parsedValue = parser ? parser(value, item) : value;
                columnMaxLengths[i + 1] = Math.max(columnMaxLengths[i + 1], parsedValue ? parsedValue.toString().length : 0);
                return parsedValue;
            })];
            worksheet.addRow(row);
            columnMaxLengths[0] = Math.max(columnMaxLengths[0], (index + 1).toString().length);
        });
        const padding = 4; // Add 4 characters of padding to each column width

        // Set auto width for columns
        worksheet.columns.forEach((column) => {
            if (column) { // Ensure the column is defined
                let maxLength = 0;
                column.eachCell?.({includeEmpty: insertZero}, (cell) => {
                    maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 0);
                });
                column.width = maxLength + padding;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer() as Buffer;
        return buffer;
    } catch (e) {
        ServerLogger.error('Error while generating Excel', e);
        console.error('Error while generating Excel', e);
        return null;
    }
};
