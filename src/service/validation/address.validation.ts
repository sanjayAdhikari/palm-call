import {body} from "express-validator";
import {idValid, stringOptionalValid, stringValid} from "./validator.index";

export const addressAllFieldValidation = [
    stringValid('street'),
    stringValid('city'),
    idValid('state'),
    idValid('country'),
    body('postalCode')
        .notEmpty()
        .isPostalCode('any').withMessage('Invalid Postal code format'),
];

export const addressAnyFieldValidation = (label: string) => [
    stringOptionalValid(`${label}.street`),
    stringOptionalValid(`${label}.city`),
    stringOptionalValid(`${label}.county`),
    stringOptionalValid(`${label}.country`),
    body(`${label}.postalCode`)
        .optional()
        .isPostalCode('any').withMessage('Invalid Postal code format'),
];
