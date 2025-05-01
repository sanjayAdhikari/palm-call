import bcrypt from "bcryptjs";
import {model, PaginateModel, Schema} from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import {CustomerDocumentInterface, CustomerInterface, CustomerModelInterface, UserTypeEnum} from "@interface/model";
import {AppConstant} from "@config/constant";
import {dbEnum, onUserSave} from "@utils/db.util";
import {MongoBooleanFalse, MongoBooleanTrue, MongooseString, mongoRef} from "@interface/generic.type";

const CustomerSchema: Schema = new Schema<CustomerInterface>(
    {
        email: MongooseString,
        password: MongooseString,
        name: MongooseString,
        profileImage: MongooseString,

        isEmailVerified: MongoBooleanFalse,
        userType: {
            type: String,
            enum: dbEnum(UserTypeEnum),
            default: UserTypeEnum.USER
        },
        fcmToken: [{
           uuid: MongooseString,
           token: MongooseString,
        }],

        createdBy: mongoRef(AppConstant.collectionName.CUSTOMER),
        isActive: MongoBooleanTrue,
        isDeleted: MongoBooleanFalse,
    },
    {
        timestamps: true
    },
);

CustomerSchema.plugin(mongoosePaginate);
CustomerSchema.pre('save', onUserSave);
// Instance method to compare password
CustomerSchema.methods.comparePassword = function (
    this: CustomerDocumentInterface,
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};


// index
CustomerSchema.index({ email: 1, userType: 1  });
CustomerSchema.index({ 'fcmToken.token': 1 }); // target pushes by device token

const CustomerModel: CustomerModelInterface = model<CustomerInterface, CustomerModelInterface>(AppConstant.collectionName.CUSTOMER, CustomerSchema);
export default CustomerModel;
