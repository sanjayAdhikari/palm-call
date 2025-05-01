import {model, PaginateModel, Schema} from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import {
    NotificationCategoryEnum,
    NotificationDocumentInterface,
    NotificationInterface,
    UserTypeEnum
} from "../../../interface/model";
import {AppConstant} from "../../../config/constant";
import {customerRef, MongoBooleanFalse, MongoBooleanTrue, MongooseString} from "../../../interface/generic.type";
import {dbEnum} from "../../../utils/db.util";
import moment from 'moment';

const NotificationSchema: Schema = new Schema<NotificationInterface>(
    {
        user: customerRef(UserTypeEnum.USER),
        validUntil: {
            type: Date,
            default: () => moment().add(1, 'years').toDate()
        },
        title: {
            type: String,
            default: 'Untitled',
            trim: true,
        },
        body: MongooseString,
        category: {
            type: String,
            default: NotificationCategoryEnum.SYSTEM,
            enum: dbEnum(NotificationCategoryEnum),
        },
        hasRead: MongoBooleanTrue,
        payload: Schema.Types.Mixed,
        isActive: MongoBooleanTrue,
        isDeleted: MongoBooleanFalse,
    },
    {
        timestamps: true,
    },
);

NotificationSchema.plugin(mongoosePaginate);
NotificationSchema.index({
    user: 1,
    isDeleted: 1,
});
const NotificationModel = model<NotificationDocumentInterface, PaginateModel<NotificationDocumentInterface>>(AppConstant.collectionName.NOTIFICATION, NotificationSchema);
export default NotificationModel;
