import {CustomerInterface} from "@interface/model";
import {ThreadInterface} from "@interface/model/chat/thread.interface";
import {Document, PaginateModel, Types} from "mongoose";
import {UserTimestampSchemaInterface} from "../../generic.interface";

export interface MessageInterface extends UserTimestampSchemaInterface {
    _id: Types.ObjectId;
    thread: ThreadInterface["_id"];
    sender: CustomerInterface["_id"];
    message: string;
    attachments?: {
        url: string;
        fileName?: string;
        mimeType: string,
        size: number, // in bytes
        metadata?: string[]
    }[]; // For Future
    systemGenerated?: boolean; // For automated messages like “Vendor marked thread completed”
}

export interface MessageDocumentInterface extends MessageInterface, Document {
    _id: Types.ObjectId;
}

export interface MessageModelInterface extends PaginateModel<MessageDocumentInterface> {
}
