import {dbEnum} from "../utils/db.util";

export const inEnum = (Enum: any, someString: string) => (dbEnum(Enum) as string[]).includes(someString);

export enum UserTypeEnum {
    AGENT = 'AGENT',
    USER = 'USER',
}

export enum FunctionActionEnum {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
}
