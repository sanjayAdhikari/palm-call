import {Document, Model, PaginateModel, Types} from 'mongoose';
import {UserTypeEnum} from "../../generic.enum";
import {UserTimestampSchemaInterface} from "../../generic.interface";
import {ObjectID} from "../../generic.type";

export interface CustomerInterface extends UserTimestampSchemaInterface {
    _id: ObjectID,
    email: string;
    password: string;
    name?: string;
    profileImage?: string;
    isEmailVerified: boolean; // shall be true; if users validate through OTP or by clicking a link sent to email
    userType: UserTypeEnum;
    fcmToken?: {
        uuid: string,
        token: string, // if user logouts.
    }[], // for notification, user might log in multiple devices so array
}

export interface CustomerDocumentInterface extends CustomerInterface, Document {
    _id: Types.ObjectId;
    comparePassword: (password: string) => Promise<boolean>,
}

export interface CustomerModelInterface extends PaginateModel<CustomerDocumentInterface> {
}
