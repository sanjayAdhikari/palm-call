import {ThreadInterface} from "@interface/model/chat/thread.interface";
import {Document, PaginateModel} from "mongoose";
import {UserTimestampSchemaInterface} from "@interface/generic.interface";

import {ObjectID} from "@interface/generic.type";
import {CustomerInterface} from "@interface/model";

export enum NotificationCategoryEnum {
    SYSTEM = 'SYSTEM',
    CHAT = 'CHAT'
}

export interface ChatNotificationPayload {
    threadID: ThreadInterface["_id"]
}

export interface NotificationInterface<PayloadType = ChatNotificationPayload> extends UserTimestampSchemaInterface {
    _id: ObjectID,
    user: CustomerInterface['_id'],
    validUntil: Date,

    title: string,
    body: string;
    link: string;
    photo: string;

    category: NotificationCategoryEnum,
    hasRead?: boolean,
    payload: PayloadType, // there would be only one type of payload at a time
}

export interface NotificationDocumentInterface extends Document, NotificationInterface {
    _id: ObjectID;
}

export interface NotificationModelInterface extends PaginateModel<NotificationInterface> {
}
