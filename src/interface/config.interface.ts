import {UserTypeEnum} from "./generic.enum";

export interface MongoCollectionInterface {
    CUSTOMER: string;
    NOTIFICATION: string;
    THREAD: string;
    MESSAGE: string;
}

export interface ConstantInterface {
    collectionName: MongoCollectionInterface,
    defaultTimezone: string;
    defaultCountryCode: string;
    dateFormat: string;
    refreshTokenPrefix: string;
    cacheAliveTime: number,
}

/*
Type:
 0 -> Login

 */


export interface TokenPayload {
    iat: number;
    exp: number;
    version: number
}

export interface JwtPayload extends TokenPayload {
    id: string; // refers to CustomerInterface['_id']
    type: number; // payloadType => 0 for login
    uuid: string;
    email: string;
    userType: UserTypeEnum,
    space?: string,
}

export interface OtpJwtPayload extends TokenPayload {
    id: string;
    uuid: string;
    email: string;
    userType: UserTypeEnum,
    hash: string,
}
