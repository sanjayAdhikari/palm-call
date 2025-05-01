import {body, oneOf, param, query, ValidationChain} from "express-validator";
import validator from "validator";
import {checkExpressMiddlewareObjectID, dbEnum, toSanitizeObjectID} from "../../utils/db.util";
import {capitalizeFirstLetter, getValidDomain} from "../../utils/helper";


export const idMultipleValid = function (fieldName: string, labelName?: string) {
    return body(fieldName)
        .notEmpty()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every(checkExpressMiddlewareObjectID);
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of valid ID`)
}

export const idMultipleOptionalValid = function (fieldName: string, labelName?: string) {
    return body(fieldName)
        .optional()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every(checkExpressMiddlewareObjectID);
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of valid ID`)
}

export const idOptionalValid = function (fieldName: string, labelName?: string, checkIn: typeof body | typeof query | typeof param = body) {
    return checkIn(fieldName)
        .optional()
        .custom(checkExpressMiddlewareObjectID).withMessage(`Invalid ${labelName ?? fieldName} ID format.`)
        .customSanitizer(toSanitizeObjectID);
}

export const idValid = function (fieldName: string, labelName?: string, checkIn: typeof body | typeof query | typeof param = body) {
    return checkIn(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} ID is required`)
        .notEmpty()
        .custom(checkExpressMiddlewareObjectID).withMessage(`Invalid ${labelName ?? fieldName} ID format.`)
        .customSanitizer(toSanitizeObjectID);
}

export const idValidParam = function (fieldName: string, labelName?: string) {
    return idValid(fieldName, labelName, param);
}

export const stringOptionalValid = function (fieldName: string, labelName?: string) {
    return body(fieldName).optional()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`);
}

export const stringValid = function (fieldName: string, labelName?: string) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).notEmpty()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`);
}

export const urlValid = function (fieldName: string, labelName?: string, checkIN: typeof body | typeof query | typeof param = body) {
    return checkIN(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).notEmpty()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`)
        .custom((value: string) => {
            if (!getValidDomain(value)) {
                throw new Error('Invalid domain URL');
            }
            return true;
        });
}
export const urlOptionalValid = function (fieldName: string, labelName?: string) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).optional()
        .isString().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid string`)
        .custom((value: string) => {
            if (!getValidDomain(value)) {
                throw new Error(`Invalid ${labelName ?? fieldName} url`);
            }
            return true;
        });
}

export const emailValid = function (fieldName: string, labelName?: string) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required.`).notEmpty()
        .isEmail().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid email`);
}
export const emailOptionalValid = function (fieldName: string, labelName?: string) {
    return body(fieldName).optional()
        .isEmail().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid email`);
}

export const numberValid = function (fieldName: string, labelName?: string, min: number = 0) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required`)
        .notEmpty()
        .isNumeric().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be number`)
        .isFloat({min: min,}).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be positive number`);
}

export const multipleNumberValid = function (fieldName: string, labelName?: string, min: number = 0) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required`)
        .isArray().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be an array`)
        .custom((value: any) => {
            if (!value.every((item: any) => typeof item === 'number' && item >= min)) {
                throw new Error(`${capitalizeFirstLetter(labelName ?? fieldName)} must contain only numbers greater than or equal to ${min}`);
            }
            return true; // Indicates validation passed
        });
}
export const numberOptionalValidQuery = function (fieldName: string, labelName?: string, min: number = 0) {
    return query(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} is required`)
        .optional()
        .isNumeric().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be number`)
        .isFloat({min: min,}).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be positive number`);
}

export const numberOptionalValid = function (fieldName: string, labelName?: string, min: number = 0) {
    return body(fieldName)
        .optional()
        .isNumeric().withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be number`)
        .isFloat({min,}).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be positive number`);
}

export enum DateValidationType {
    OnlyPast = 'onlyPast',
    OnlyFuture = 'onlyFuture',
    Any = 'any',
}

export const dateValid = function (fieldName: string, labelName?: string, dateValidationType: DateValidationType = DateValidationType.Any, customErrorMessage?: string) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} date is required`)
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

export const dateOptionalValid = function (fieldName: string, labelName?: string, dateValidationType: DateValidationType = DateValidationType.Any, customErrorMessage?: string) {
    return body(fieldName).optional().custom((value) => {
        if (!value) {
            // empty values are not allowed
            return true;
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

export const checkTwoDateValidationOrder = function (startDateField: string, endDateField: string, startLabel: string = 'start date', endLabel: string = 'end date') {
    return body(endDateField).optional().custom((value, {req}) => {
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

export const booleanValid = function (fieldName: string, labelName?: string) {
    return body(fieldName, `${capitalizeFirstLetter(labelName ?? fieldName)} option is required`)
        .notEmpty()
        .isBoolean().withMessage(`${labelName ?? fieldName} option must be boolean`);
}


export const booleanOptionalValid = function (fieldName: string, labelName?: string) {
    return body(fieldName)
        .optional()
        .isBoolean().withMessage(`${labelName ?? fieldName} option must be boolean`);
}
export const descriptionValid = stringOptionalValid('description');

export const stringMultipleOptionalValid = function (fieldName: string, labelName?: string) {
    return body(fieldName)
        .optional()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every((each: any) => typeof each === 'string');
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of string`)
}

export const stringMultipleValid = function (fieldName: string, labelName?: string) {
    return body(fieldName)
        .notEmpty()
        .custom((value: string[] | null) => {
            if (!Array.isArray(value)) return false;
            return value.every((each: any) => typeof each === 'string');
        }).withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be array of string`)
}
export const documentOptionalValid = stringMultipleOptionalValid('documents');

export const documentValid = stringMultipleValid('documents');

export const enumValid = function (enumData: any, fieldName: string, labelName?: string) {
    return body(fieldName)
        .notEmpty()
        .isIn(dbEnum(enumData))
        .withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid enum`)
}

export const enumOptionalValid = function (enumData: any, fieldName: string, labelName?: string) {
    return body(fieldName)
        .optional()
        .isIn(dbEnum(enumData))
        .withMessage(`${capitalizeFirstLetter(labelName ?? fieldName)} must be valid enum`)
}

export const launchCollectionAnyID: ValidationChain = oneOf([
    idValid('launch'),
    idValid('collectionID', 'collection'),
], 'Either launch or collection ID is required') as ValidationChain;
