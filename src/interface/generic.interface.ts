import {Document, Model, PaginateModel} from "mongoose";
import {DateString, ObjectID} from "./generic.type";
import {CustomerInterface} from "./model";

export type voidEmptyFn = () => void;

export interface toJSONInterface {
    transform: (doc: any, ret: any) => void
}

export interface CipherInterface {
    iv: string;
    content: string;
}

export interface PointCoordinateInterface {
    type: 'Point' | 'Polygon',
    address?: string,
    coordinates: number[],
}

export interface CoordinateObjectInterface {
    latitude: number;
    longitude: number;
    address?: string,
}

export interface GenericIdInterface {
    id: string,
    ref: ObjectID,
    prefixCode: string,
    serialNumber: number
}

export interface UserTimestampSchemaInterface {
    createdAt?: DateString;
    updatedAt?: DateString;
    createdBy?: CustomerInterface["_id"],
    updatedBy?: CustomerInterface["_id"],
    isDeleted?: boolean,
    isActive?: boolean,
    // isArchived: boolean;
    // archivedOn: Date;
}

export interface PMInterface<T> extends Model<T & Document, PaginateModel<T>> {
}


export interface AddressInterface {
    street: string;
    city: string;
    county: string;
    country: string;
    postalCode: string;
}

export interface PointInterface {
    type: string,
    coordinates: number[],
    address?: string
}

export interface MessageReplaceOptionInterface {
    searchValue: string,
    replaceValue: string
}

export interface MessageTypeResponseInterface {
    push?: string,
    email?: string,
    sms?: string,
}

export interface ExcelFieldInterface<T> {
    label: string;
    field: string;
    parser?: (data: any, wholeData: T) => string | number;
}

export type ExcelGeneratorInterface<T> = ExcelFieldInterface<T> | string;
