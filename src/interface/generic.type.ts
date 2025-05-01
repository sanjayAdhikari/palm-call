import {Schema, Types} from "mongoose";
import {getNumber} from "@utils/helper";
import {AppConstant} from "@config/constant";
import {UserTypeEnum} from "@interface/generic.enum";

export type NullString = string | null;
export type ObjectID = Types.ObjectId
export type StringObjectID = string | ObjectID
export type DateString = Date | string;

export const MongoNumber = {
    type: Number,
    get: getNumber,
    set: getNumber,
    min: 0,
    default: 0,
}

export const MongooseUnSignedNumber = {
    type: Number,
    get: getNumber,
    set: getNumber,
    default: 0,
}


export const MongooseString = {
    type: String,
    default: '',
    trim: true,
}
export const EncryptedFieldSchema = {
    iv: MongooseString,
    content: MongooseString,
}

export const mongoRef = (reference: string, dynamicReference?: string) => ({
    type: Schema.Types.ObjectId,
    ref: reference ?? '',
})

export const customerRef = (userType?: UserTypeEnum) => ({
    type: Schema.Types.ObjectId,
    ref: AppConstant.collectionName.CUSTOMER,
})
export const MongoBooleanFalse = {
    type: Boolean,
    default: false,
}
export const MongoBooleanTrue = {
    type: Boolean,
    default: true,
}

