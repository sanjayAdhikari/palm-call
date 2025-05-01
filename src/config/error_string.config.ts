import {ActiveStatusEnum} from "@interface/repository.interface";
import {capitalizeFirstLetter} from "@utils/helper";

export default class ErrorStringConstant {
    static readonly UNKNOWN_ERROR = 'Something Went Wrong!';
    static readonly DB_CONNECTION_ERROR = 'Unable to connect to your data store!';
    static readonly NO_ITEMS_FOUND = 'No Items found!';
    static readonly UNABLE_TO_REMOVE = 'Unable to delete this item now!';
    // toggle status generic string
    static readonly NO_ID_TO_TOGGLE = 'No ID to toggle active status';
    static readonly ERROR_ACTIVE_STATUS = 'Error While Changing Active Status';
    static readonly INVALID_OBJECT_ID = (field?: string): string => `Invalid ${field ?? 'Object'} ID format!`;
    static readonly REQUIRED = (field: string): string => `${field} is required!`;
    static readonly SUCCESS_TOGGLE = (toggleStatus: ActiveStatusEnum = ActiveStatusEnum.off, name: string = 'item'): string => `Active status of ${name ?? 'item'} has been turned ${toggleStatus}`;
    static readonly SUCCESS_ARCHIVE = (toggleStatus: ActiveStatusEnum = ActiveStatusEnum.off, name: string = 'item'): string => toggleStatus === ActiveStatusEnum.on ? `${capitalizeFirstLetter(name)} has been archived successfully` : `${capitalizeFirstLetter(name)} has been moved from archived to active`;
    static readonly SUCCESS_DELETE = (name?: string): string => `${name ?? 'Item'} has been deleted successfully`;
}
