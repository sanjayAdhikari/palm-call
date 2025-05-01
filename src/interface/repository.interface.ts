import {ObjectID} from "@interface/generic.type";
import {UserTypeEnum} from "./generic.enum";

export interface PaginatedInterface<DocumentInterface> {
    docs: DocumentInterface;
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    prevPage: any;
    pagingCounter: number;
}

export interface PaginationPluginInterface {
    pagination: boolean;
    page: number;
    limit: number;
    collation: {
        locale: string;
    },

}


export enum ActiveStatusEnum {
    on = 'on',
    off = 'off',
}

export interface RequestForgetPasswordInterface {
    hash: string;
    email: string;
    otpLength: number;
}

export interface ValidateForgetPasswordOtpInterface {
    token: string;
    email: string;
}


export interface RequestOtpResponseInterface {
    hash: string
    email: string
    length: number
}

export interface LoginResponseInterface {
    signup: boolean,
    userType: UserTypeEnum,
    accessToken: string,
    refreshToken: string,
    userID: ObjectID,
}
