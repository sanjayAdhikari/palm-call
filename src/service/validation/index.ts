import {param, query} from "express-validator";
import {checkExpressMiddlewareObjectID, dbEnum, toSanitizeObjectID} from "../../utils/db.util";
import {ActiveStatusEnum} from "../../interface/repository.interface";
import {addressAllFieldValidation, addressAnyFieldValidation} from "./address.validation";

import {spaceSettingsUpdateValidation} from "./space_settings.validation";
import {idValid} from "./validator.index";
import {profileEditValidation} from "./customer.validation";

export const itemIDValidation = [
    param('itemID', 'Item ID is required').notEmpty()
        .custom(checkExpressMiddlewareObjectID).withMessage('Invalid Item ID format.')
        .customSanitizer(toSanitizeObjectID),
]

export const itemIDEditValidation = [
    idValid('_id', 'Item type'),
]

export const toggleValidation = [
    ...itemIDValidation,
    param('toggleStatus', 'Toggle Status is required.').notEmpty()
        .isString().withMessage('Invalid Toggle status format.')
        .isIn(dbEnum(ActiveStatusEnum)).withMessage(`Toggle status contains invalid value.`)
]

export const readAllValidation = [
    query('active').optional({checkFalsy: true}).isBoolean().toBoolean(),
    query('page')
        .optional()
        .custom((value: string) => value === undefined || (Number.isInteger(parseInt(value, 10)) && parseInt(value, 10) >= 0))
        .withMessage('Page must be a non-negative integer'),
    query('pageSize')
        .optional()
        .custom((value: string) => value === undefined || (Number.isInteger(parseInt(value, 10)) && parseInt(value, 10) >= 1))
        .withMessage('Page size must be a positive integer'),
];


const validationChain = {
    spaceSettingsUpdateValidation,
    itemIDValidation,
    itemIDEditValidation,
    toggleValidation,
    addressAllFieldValidation,
    addressAnyFieldValidation,
    profileEditValidation,
}

export default validationChain;
