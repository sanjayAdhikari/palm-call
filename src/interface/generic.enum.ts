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

export enum SocketEventEnum {
    INIT = "init",
    JOIN_THREAD = "join-thread",
    LEAVE_THREAD = "leave-thread",
    GET_ONLINE_USERS = "get-online-users",
    ONLINE_USERS = "online-users",
    USER_ONLINE = "user-online",
    USER_OFFLINE = "user-offline",
    MESSAGE = "message",
    START_TYPING = "start-typing",
    STOP_TYPING = "stop-typing",

    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "ice-candidate",
    END = "end",

    PUSH_TO_TALK = "push-to-talk",
    USER_SPEAKING = "user-speaking",

    ERROR = "error",

    // Mediasoup-specific
    GET_RTP_CAPABILITIES = "get-rtp-capabilities",
    CREATE_TRANSPORT = "create-transport",
    CONNECT_TRANSPORT = "connect-transport",

    PRODUCE = "produce",

    CREATE_RECV_TRANSPORT = "create-recv-transport",
    CONNECT_RECV_TRANSPORT = "connect-recv-transport",

    CONSUME = "consume",

    // Call session management
    CALL_START = "call:start",
    CALL_END = "call:end",
    CALL_ACTIVE = "call:active",

    DISCONNECT = "disconnect",
}

