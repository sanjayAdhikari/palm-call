import {AppConstant} from "@config/constant";
import {
    customerRef,
    MongoBooleanFalse,
    MongoBooleanTrue,
    MongoNumber,
    MongooseString,
    mongoRef
} from "@interface/generic.type";
import {MessageDocumentInterface, MessageModelInterface} from "@interface/model";
import {model, Schema} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const MessageSchema: Schema = new Schema<MessageDocumentInterface>(
    {
        thread: mongoRef(AppConstant.collectionName.THREAD),
        sender: customerRef(),
        message: MongooseString,
        attachments: [{
            url: MongooseString,
            fileName: MongooseString,
            mimeType: MongooseString,
            size: MongoNumber, // in bytes
            metadata: [MongooseString]
        }], // future
        systemGenerated: MongoBooleanFalse, // automate message -> true

        createdBy: customerRef(), // Reference to the user who created this entry
        updatedBy: customerRef(), // Reference to the user who last updated this entry
        isDeleted: MongoBooleanFalse, // Default: false
        isActive: MongoBooleanTrue, // Default: true
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt fields
        toJSON: {},
    }
);

MessageSchema.plugin(mongoosePaginate);

// indexes
MessageSchema.index({ thread: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export default model<MessageDocumentInterface, MessageModelInterface>(
    AppConstant.collectionName.MESSAGE,
    MessageSchema
);
