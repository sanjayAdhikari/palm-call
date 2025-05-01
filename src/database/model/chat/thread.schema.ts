import {AppConstant} from "@config/constant";
import {customerRef, MongoBooleanFalse, MongoBooleanTrue, MongoNumber, mongoRef} from "@interface/generic.type";
import {ChatStatusEnum, ThreadDocumentInterface, ThreadModelInterface} from "@interface/model";
import {model, Schema} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ThreadSchema: Schema = new Schema<ThreadDocumentInterface>(
    {
        participants: [customerRef()],
        status: {
            type: String,
            enum: ChatStatusEnum,
            default: ChatStatusEnum.OPEN,
        },
        lastMessageAt: Date,
        lastMessage: mongoRef(AppConstant.collectionName.MESSAGE),

        unreadCount: [{
            customer: customerRef(),
            count: MongoNumber,
        }],

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

ThreadSchema.plugin(mongoosePaginate);

ThreadSchema.index({ participants: 1 });
ThreadSchema.index({ lastMessageAt: -1 });
ThreadSchema.index({ 'unreadCount.customer': 1 });


export default model<ThreadDocumentInterface, ThreadModelInterface>(
    AppConstant.collectionName.THREAD,
    ThreadSchema
);
