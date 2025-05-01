import {ApiInterface} from "../interface/api.interface";
import {formatAPI, formatError} from "../utils";
import {ObjectID} from "../interface/generic.type";
import bcrypt from 'bcryptjs';
import {UserTypeEnum} from "../interface/generic.enum";
import SpaceJwtSecurity from "./jwt/space_jwt.util";
import {generateUniqueNumberFromMongoId} from "./crypto.util";
import {Types} from "mongoose";
import CustomEnvironmentVariables from "../config/custom-environment-variables";
import config from "../config";
import otpGenerator from "otp-generator";

export const isTestEmail = (email: string) => {
    const isTestEmail = ['saphal@evolv.art', 'aggregator@evolv.art', 'brand@evolv.art', 'sanjay@evolv.art'].includes(email);
    return isTestEmail || (email.includes('test') && email.endsWith('@evolv.world'))
}
const concatEmailOTP = (otp: string, email: string): string => otp?.toString()
    + email?.toString();

export const generateOTP = (userData: {
                                _id: ObjectID;
                                email: string;
                            },
                            userType: UserTypeEnum): ApiInterface<{
    otp: string,
    hash: string,
    otpLength: number,
}> => {
    // generate OTP first
    // encrypt the otp and send hash to the admin_user response
    // get payload: otp and hash and compare
    if (!userData) return formatError('No User data to send otp!');
    const otpLength = config<number>(CustomEnvironmentVariables.OTP_LENGTH);
    let otp: string = '123456789'.substring(0, otpLength);
    const skipOTP = isTestEmail(userData.email);
    if (skipOTP) {
        // do nothing
    } else if (config.isProduction) {
        otp = otpGenerator.generate(otpLength, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });
    }
    const salt = bcrypt.genSaltSync(10);
    const otpHash = bcrypt.hashSync(
        concatEmailOTP(otp, userData.email),
        salt,
    );
    const uuid: string = generateUniqueNumberFromMongoId(new Types.ObjectId())
    const tokenHash = SpaceJwtSecurity.signOtpToken(
        userData._id,
        userData.email,
        otpHash,
        userType,
        uuid
    )
    console.log('OTP', userData?.email, otp)
    return formatAPI('', {
        hash: tokenHash,
        otp,
        otpLength,
    });
};

export const validateOTP = async (hash: string, otp: string, email: string) => bcrypt.compareSync(
    concatEmailOTP(otp, email),
    hash,
);
