import {emailValid, idValid, stringOptionalValid, stringValid} from "./validator.index";
import {addressAnyFieldValidation} from "./address.validation";

export const profileEditValidation = [
    stringOptionalValid('name.first', 'First Name'),
    stringOptionalValid('name.last', 'Last Name'),
    stringOptionalValid('phone'),
    stringOptionalValid('profileImage'),
    ...addressAnyFieldValidation('address'),
]

export const addUserValidation = [
    idValid('role'),
    stringValid('name.first', 'First Name'),
    stringValid('name.last', 'Last Name'),
    stringOptionalValid('phone'),
    emailValid('email'),
    stringOptionalValid('profileImage'),
    ...addressAnyFieldValidation('address'),
]

