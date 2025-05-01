import {
    idValid,
    stringMultipleOptionalValid,
    stringMultipleValid,
    stringOptionalValid,
    stringValid
} from "./validator.index";

export const roleEditValidation = [
    idValid('_id', 'role'),
    stringOptionalValid('name'),
    stringOptionalValid('description'),
    // enumOptionalValid(UserTypeEnum,'userType'),
    stringMultipleOptionalValid('privileges')
]

export const roleCreateValidation = [
    stringValid('name'),
    stringOptionalValid('description'),
    // enumValid(UserTypeEnum,'userType'),
    stringMultipleValid('privileges')
]

