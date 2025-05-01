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

// src/interface/generic.enum.ts
export enum SocketEventEnum {
    INIT = 'init',
    JOIN = 'join',
    MESSAGE = 'message',
    START_TYPING = 'typing:start',
    STOP_TYPING = 'typing:stop',
    OFFER = 'rtc:offer',
    ANSWER = 'rtc:answer',
    ICE_CANDIDATE = 'rtc:ice-candidate',
    USER_ONLINE = 'presence:user_online',
    USER_OFFLINE = 'presence:user_offline',
    GET_ONLINE_USERS = 'get_online_users',
    ONLINE_USERS = 'online_users',
    ERROR = 'error',
    DISCONNECT = 'disconnect',
}
