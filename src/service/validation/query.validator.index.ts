import {oneOf, query, ValidationChain} from "express-validator";
import validator from "validator";
import {checkExpressMiddlewareObjectID, dbEnum, toSanitizeObjectID} from "../../utils/db.util";
import {capitalizeFirstLetter, getValidDomain} from "../../utils/helper";

export const idMultipleValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName)
        .notEmpty()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every(checkExpressMiddlewareObjectID);
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of valid ID`)
}

export const idMultipleOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName)
        .optional()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every(checkExpressMiddlewareObjectID);
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of valid ID`)
}

export const idOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName)
        .optional()
        .custom(checkExpressMiddlewareObjectID).withMessage(`Invalid ${labelName ?? fieldName} ID format.`)
        .customSanitizer(toSanitizeObjectID);
}

export const idValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} ID is required`)
        .notEmpty()
        .custom(checkExpressMiddlewareObjectID).withMessage(`Invalid ${labelName ?? fieldName} ID format.`)
        .customSanitizer(toSanitizeObjectID);
}

export const stringOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName).optional()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`);
}

export const stringValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).notEmpty()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`);
}

export const urlValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).notEmpty()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`)
        .custom((value: string) => {
            if (!getValidDomain(value)) {
                throw new Error('Invalid domain URL');
            }
            return true;
        });
}

export const urlOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).optional()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`)
        .custom((value: string) => {
            if (!getValidDomain(value)) {
                throw new Error(`Invalid ${labelName ?? fieldName} url`);
            }
            return true;
        });
}

export const emailValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).notEmpty()
        .isEmail().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid email`);
}

export const emailOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName).optional()
        .isEmail().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid email`);
}

export const numberValidQuery = function (fieldName: string, labelName?: string, min: number = 0) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required`)
        .notEmpty()
        .isNumeric().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be number`)
        .isFloat({min: min,}).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be positive number`);
}

export const numberOptionalValidQuery = function (fieldName: string, labelName?: string, min: number = 0) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required`)
        .optional()
        .isNumeric().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be number`)
        .isFloat({min: min,}).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be positive number`);
}

export enum DateValidationType {
    OnlyPast = 'onlyPast',
    OnlyFuture = 'onlyFuture',
    Any = 'any',
}

export const dateValidQuery = function (fieldName: string, labelName?: string, dateValidationType: DateValidationType = DateValidationType.Any, customErrorMessage?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} date is required`)
        .notEmpty()
        .custom((value) => {
            if (!value) {
                // empty values are not allowed
                throw new Error(`${capitalizeFirstLetter(labelName ?? fieldName)} date is required`);
            }
            if (validator.isISO8601(value) || validator.isDate(value)) {
                // Additional date validations based on the dateValidationType parameter
                const currentDate = new Date();
                const inputDate = new Date(value);

                if (dateValidationType === DateValidationType.OnlyPast && inputDate >= currentDate) {
                    throw new Error(customErrorMessage ?? `The ${labelName ?? fieldName} date must be in the past`);
                }

                if (dateValidationType === DateValidationType.OnlyFuture && inputDate <= currentDate) {
                    throw new Error(customErrorMessage ?? `The ${labelName ?? fieldName} date must be in the future`);
                }

                return true;
            }
            throw new Error(customErrorMessage ?? `Invalid ${labelName ?? fieldName} Date format..`);
        });
}

export const dateOptionalValidQuery = function (fieldName: string, labelName?: string, dateValidationType: DateValidationType = DateValidationType.Any) {
    return query(fieldName).optional().custom((value) => {
        if (!value) {
            // empty values are allowed
            return true;
        }
        if (validator.isISO8601(value) || validator.isDate(value)) {
            // Additional date validations based on the dateValidationType parameter
            const currentDate = new Date();
            const inputDate = new Date(value);

            if (dateValidationType === DateValidationType.OnlyPast && inputDate >= currentDate) {
                throw new Error(`The ${labelName ?? fieldName} date must be in the past`);
            }

            if (dateValidationType === DateValidationType.OnlyFuture && inputDate <= currentDate) {
                throw new Error(`The ${labelName ?? fieldName} date must be in the future`);
            }
            return true;
        }
        throw new Error(`Invalid ${labelName ?? fieldName} Date format..`);
    });
}

export const checkTwoDateValidationOrderQuery = function (startDateField: string, endDateField: string, startLabel: string = 'start date', endLabel: string = 'end date') {
    return query(endDateField).optional().custom((value, {req}) => {
        const startDate = req.body[startDateField];
        if (!startDate || !value) {
            return true;
        }
        const start = new Date(startDate);
        const end = new Date(value);
        if (end <= start) {
            throw new Error(`${capitalizeFirstLetter(endLabel)} must be in the future of ${startLabel}`);
        }
        return true;
    });
}

export const booleanValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} option is required`)
        .notEmpty()
        .isBoolean().withMessage(`${labelName ?? fieldName} option must be boolean`);
}

export const booleanOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName)
        .optional()
        .isBoolean().withMessage(`${labelName ?? fieldName} option must be boolean`);
}

export const stringMultipleOptionalValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName)
        .optional()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every((each: any) => typeof each === 'string');
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of string`)
}

export const stringMultipleValidQuery = function (fieldName: string, labelName?: string) {
    return query(fieldName)
        .notEmpty()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every((each: any) => typeof each === 'string');
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of string`)
}

export const enumValidQuery = function (enumData: any, fieldName: string, labelName?: string) {
    return query(fieldName)
        .notEmpty()
        .isIn(dbEnum(enumData))
        .withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid enum`)
}

export const enumOptionalValidQuery = function (enumData: any, fieldName: string, labelName?: string) {
    return query(fieldName)
        .optional()
        .isIn(dbEnum(enumData))
        .withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid enum`)
}

export const launchCollectionAnyID: ValidationChain = oneOf([
    idValidQuery('launch'),
    idValidQuery('collectionID', 'collection'),
], 'Either launch or collection ID is required') as ValidationChain;
