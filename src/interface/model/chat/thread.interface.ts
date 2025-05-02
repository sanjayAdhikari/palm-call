import {CustomerInterface} from "@interface/model";
import {MessageInterface} from "@interface/model/chat/message.interface";
import {Document, PaginateModel, Types} from "mongoose";
import {UserTimestampSchemaInterface} from "../../generic.interface";
import {ObjectID} from "../../generic.type";

export enum ChatStatusEnum {
    "OPEN" = "OPEN",
    "COMPLETED" = "COMPLETED",
}
export interface ThreadInterface extends UserTimestampSchemaInterface {
    _id: ObjectID;
    participants: CustomerInterface["_id"][];
    status: ChatStatusEnum;
    lastMessageAt?: Date;
    lastMessage?: MessageInterface["_id"],
    unreadCount?: {
        customer: CustomerInterface["_id"];
        count: number,
    }[];
}

export interface ThreadDocumentInterface extends ThreadInterface, Document {
    _id: Types.ObjectId;
}

export interface ThreadModelInterface extends PaginateModel<ThreadDocumentInterface> {
}
