import {ObjectID, StringObjectID} from "@interface/generic.type";
import {CustomerDocumentInterface} from "@interface/model";
import {ActiveStatusEnum} from "@interface/repository.interface";
import bcrypt from "bcryptjs";
import {CustomSanitizer} from "express-validator";
import mongoose, {Model, PaginateOptions, PaginateResult, Types} from "mongoose";
import ErrorStringConstant from "../config/error_string.config";
import ServerLogger from "../middleware/server_logging.middleware";
import {formatAPI, formatError} from "./format.util";
import {capitalizeFirstLetter} from "./helper";
import {hasPagination} from "./repository.util";

const {ObjectId} = mongoose.Types;
const SALT_ROUNDS = 10;

// This allows you to reuse the validator
export const toObjectID = (objectID: StringObjectID): Types.ObjectId => {
    return new ObjectId(objectID);
}
export const toSanitizeObjectID: CustomSanitizer = (objectID: StringObjectID) => {
    if (!checkExpressMiddlewareObjectID(objectID)) return objectID;
    return toObjectID(objectID)
};

export const checkExpressMiddlewareObjectID = (id: StringObjectID = '') => {
    if (!id) return false;
    try {
        return checkIfValidObjectID(id);
    } catch (e) {
        return false;
    }
}

export const checkIfValidObjectID = (id: StringObjectID = '') => (ObjectId.isValid(id)
        ? new ObjectId(id).toString() === id.toString()
        : false
);

export async function toggleDocument<Type>(ModelClass: Model<any> | undefined, itemID: ObjectID, toggleStatus?: ActiveStatusEnum, fieldName: string = 'item') {
    try {
        if (!checkIfValidObjectID(itemID?.toString())) {
            return formatError(ErrorStringConstant.INVALID_OBJECT_ID('item'));
        }
        if (!ModelClass) return formatError(ErrorStringConstant.DB_CONNECTION_ERROR);
        if (itemID) {
            const updatedData: Type | null = await ModelClass.findOneAndUpdate(
                {_id: itemID, isDeleted: false},
                {isActive: toggleStatus!.toLowerCase() === ActiveStatusEnum.on},
                {new: true},
            );
            if (updatedData) {
                return formatAPI(ErrorStringConstant.SUCCESS_TOGGLE(toggleStatus, fieldName?.toString()));
            } else {
                return formatError(`${fieldName?.toString()} doesn't exist.`)
            }
        } else {
            return formatError(ErrorStringConstant.NO_ID_TO_TOGGLE)
        }
    } catch (error) {
        ServerLogger.error(error);
        console.error(error);
        return formatError(ErrorStringConstant.ERROR_ACTIVE_STATUS);
    }
}

export function dbEnum<Type = string>(enumObject: object): Type[] {
    return Object.values(enumObject) as Type[];
}

export async function archiveDocument<Type>(
    ModelClass: Model<any> | undefined,
    itemID: ObjectID,
    toggleStatus: ActiveStatusEnum = ActiveStatusEnum.off,
    fieldName: string = 'item',
    updatedUser?: ObjectID,
    onArchived?: (id: ObjectID, data?: any) => Promise<any>,
    archivedOnlyIf?: (data?: Type) => Promise<boolean>,
) {
    try {
        if (!checkIfValidObjectID(itemID?.toString())) {
            return formatError(ErrorStringConstant.INVALID_OBJECT_ID('item'));
        }
        if (!dbEnum(ActiveStatusEnum).includes(toggleStatus)) {
            return formatError('Invalid archive status');
        }
        if (!ModelClass) return formatError(ErrorStringConstant.DB_CONNECTION_ERROR);
        if (itemID) {
            const updatedData: any | null = await ModelClass.findById(
                itemID,
            );
            if (!updatedData) {
                return formatError(`${capitalizeFirstLetter(fieldName ?? '')} is no longer exists.`)
            }
            if (typeof archivedOnlyIf === 'function') {
                const canContinue = await archivedOnlyIf(updatedData as Type);
                if (!canContinue) {
                    return formatError(`${fieldName} cannot be archived.`)
                }
            }
            updatedData.isArchived = toggleStatus!.toLowerCase() === ActiveStatusEnum.on
            if (updatedUser) updatedData.updatedBy = updatedUser;
            const deletedItem = await updatedData.save();
            if (deletedItem) {
                if (typeof onArchived === 'function')
                    await onArchived(itemID, updatedData as Type);
                return formatAPI(ErrorStringConstant.SUCCESS_ARCHIVE(toggleStatus, capitalizeFirstLetter(fieldName)), true);
            }
            return formatError(`Error while archiving ${capitalizeFirstLetter(fieldName)}`, false);
        } else {
            return formatError(ErrorStringConstant.NO_ID_TO_TOGGLE)
        }
    } catch (error: any) {
        ServerLogger.error(error);
        console.error(error);
        return formatError(typeof error.message === 'string' ? error.message : ErrorStringConstant.ERROR_ACTIVE_STATUS)
    }
}


export async function deleteDocument<Type>(
    ModelClass: Model<any> | undefined,
    itemID: ObjectID,
    fieldName: string = 'item',
    onSuccess?: (id: ObjectID, data?: any) => Promise<any>,
    population: any[] = [],
    deleteOnlyIf?: (data?: Type) => Promise<boolean>,
    modelName?: string,
) {
    try {
        if (!ModelClass) return formatError(ErrorStringConstant.DB_CONNECTION_ERROR);
        if (!checkIfValidObjectID(itemID)) {
            return formatError(ErrorStringConstant.INVALID_OBJECT_ID(`${fieldName} Id`));
        }

        const queryBuilder = ModelClass.findOne({
            _id: itemID,
            isDeleted: false,
        });

        if (population && population.length) {
            queryBuilder.populate(population);
        }

        const itemData: CustomerDocumentInterface | null = await queryBuilder.exec();

        if (!itemData) {
            return formatError(`${capitalizeFirstLetter(fieldName ?? '')} is no longer exist`)
        }

        if (typeof deleteOnlyIf === 'function') {
            const canContinue = await deleteOnlyIf(itemData as Type);
            if (!canContinue) {
                return formatError(`${capitalizeFirstLetter(fieldName ?? '')} cannot be deleted.`)
            }
        }
        itemData.isDeleted = true;
        const deletedItem = await itemData.save();
        if (deletedItem) {
            await onSuccess?.(itemData._id, itemData);
            return formatAPI(ErrorStringConstant.SUCCESS_DELETE(capitalizeFirstLetter(fieldName)), true);
        }
        return formatError(ErrorStringConstant.UNABLE_TO_REMOVE)
    } catch (error: any) {
        ServerLogger.error(error);
        console.error(error);
        return formatError(typeof error.message === 'string' ? error.message : ErrorStringConstant.UNABLE_TO_REMOVE)
    }
}


export async function paginateModel<TypeInterface>(
    // ModelClass: PMInterface<TypeInterface>,
    ModelClass: any,
    filter: any = {},
    selection: any = {
        isDeleted: 0,
        __v: 0,
    },
    populate: any = null,
    isActive?: boolean,
    page?: number,
    pageSize?: number,
    includeArchivedFilter: boolean = true,
    options: any = {
        sort: {
            createdAt: -1
        }
    }
) {
    try {
        const paginateOptions: PaginateOptions = {
            pagination: hasPagination(page, pageSize),
            sort: options?.sort ?? {
                createdAt: -1,
            },
            select: selection,
        };
        if (typeof populate === 'object') {
            paginateOptions.populate = populate;
        }
        if (paginateOptions.pagination) {
            paginateOptions.page = page;
            paginateOptions.limit = pageSize;
            // MongoDB atlas doesn't support collation on our atlas tier, uncomment it when we host our own server
            // LOG:  error: collation not allowed in this atlas tier
            // paginateOptions.collation = {
            //     locale: 'en',
            // };
        }

        const filterQuery = {
            ...filter,
            isDeleted: false,
        };
        // Check the value of isActive parameter. if null, don't filter out
        if (includeArchivedFilter && isActive !== undefined && isActive !== null) {
            filter.isActive = isActive;
        }
        if (!ModelClass) throw Error(ErrorStringConstant.DB_CONNECTION_ERROR);
        // @ts-ignore
        const listData: PaginateResult<TypeInterface> = await ModelClass.paginate(filterQuery, paginateOptions);
        return listData
    } catch (error) {
        ServerLogger.error(error);
        console.error(error);
        throw error;
    }
}

export const inEnum = (Enum: any, someString: string) => (dbEnum(Enum) as string[]).includes(someString);

export async function onUserSave(this: any, next: any): Promise<void> {
    try {
        if (this.isModified('email')) {
            this.email = this.email?.toLowerCase();
        }
        if (this.isModified('password')) {
            try {
                this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
            } catch (err) {
                next(err as any);
            }
        }

        next();
    } catch (error) {
        ServerLogger.error(error);
        console.error('error', error);
        next();
    }
}

export async function saveTitleLowerCase(this: any, next: any): Promise<void> {
    const fieldName = 'name';
    try {
        const document = this;
        if (fieldName && document.isModified(fieldName)) {
            document.nameLowerCase = document[fieldName]?.toLowerCase();
            next();
        } else {
            next();
        }
    } catch (error) {
        ServerLogger.error(error);
        console.error('error', error);
    }
}
