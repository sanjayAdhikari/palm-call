import {
    dateOptionalValid,
    descriptionValid,
    documentOptionalValid,
    documentValid,
    idOptionalValid,
    idValid,
} from "./validator.index";

export const documentValidation = [
    descriptionValid,
    dateOptionalValid('dateOfValidation', 'Validation'),
]

export const documentCreationValidation = [
    ...documentValidation,
    documentValid,
    idValid('documentType', 'Document Type'),
]

export const documentEditValidation = [
    ...documentValidation,
    documentOptionalValid,
    idOptionalValid('documentType', 'Document Type'),
]
