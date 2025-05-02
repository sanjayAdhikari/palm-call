import {ApiInterface} from '@interface/api.interface';
import {ObjectID} from "@interface/generic.type";
import {CustomerDocumentInterface, CustomerInterface, UserTypeEnum} from '@interface/model';
import {LoginResponseInterface} from '@interface/repository.interface';
import ServerLogger from "@middleware/server_logging.middleware";
import {CustomerModel} from "@model/index";
import CacheRepository from '@service/redis/repository.cache';
import {paginateModel, toObjectID} from '@utils/db.util';
import { objectToDot } from "@utils/dot.object";
import {capitalizeFirstLetter} from "@utils/helper";
import {formatAPI, formatError} from '@utils/index';
import SpaceJwtSecurity from '@utils/jwt/space_jwt.util';
import {generateGamifiedUsername} from '@utils/random-username';
import {FilterQuery, PaginateResult} from 'mongoose';

class CustomerRepository {
    // Create a unique username for new users
    static async generateRandomUsername(): Promise<string> {
        let attempts = 0;
        do {
            const name = generateGamifiedUsername(attempts > 10);
            const exists = await CustomerModel.findOne({ name }).lean();
            if (!exists) return name;
            attempts++;
        } while (attempts < 100);
        return 'User';
    }

    async editProfile(userID: ObjectID, customerData: Partial<CustomerInterface>): Promise<ApiInterface<ObjectID>> {
        try {
            // update
            const existedItem: CustomerInterface | null = await CustomerModel.findOne({
                _id: userID,
                isDeleted: false,
            }).lean();
            if (!existedItem) {
                return formatError('Profile does not exist anymore.');
            }
            if (!existedItem.isActive ?? true) {
                return formatError('Archived profile cannot be modified.');
            }
            const cacheRepo = new CacheRepository();

            // check for onBoarding
            await Promise.all([
                CustomerModel.findByIdAndUpdate(userID, {
                    $set: objectToDot(customerData),
                }),
                cacheRepo.setSpaceUser(userID, null),
            ]);

            return formatAPI('Profile is successfully Updated', userID);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return formatError(`Error while editing the profile.`);
        }
    }

    async saveFcm(userID: ObjectID, token: string, uuid: string): Promise<ApiInterface<ObjectID>> {
        try {
            console.log('FCM TOKEN try to update for', userID, token, uuid)
            // update
            const existedItem: CustomerInterface | null = await CustomerModel.findOne({
                _id: userID,
                isDeleted: false,
            }).lean();
            if (!existedItem) {
                return formatError('Profile does not exist anymore.');
            }
            if (!existedItem.isActive ?? true) {
                return formatError('Archived profile cannot be modified.');
            }
            const cacheRepo = new CacheRepository();

            // check for onBoarding
            await Promise.all([
                CustomerModel.findByIdAndUpdate(userID, {
                    $addToSet: {
                        fcmToken: { token, uuid }
                    }
                }),
                cacheRepo.setSpaceUser(userID, null),
            ]);

            return formatAPI('FCM is successfully registered', userID);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return formatError(`Error while registering the FCM token.`);
        }
    }

    // Handle login or registration with email and password
    async loginRegister(
        email: string,
        password: string,
        userType: UserTypeEnum
    ): Promise<ApiInterface<LoginResponseInterface>> {
        let isNewSignup = false;

        // Try to find an existing user in DB
        let userDoc: CustomerDocumentInterface | null = await CustomerModel.findOne({ email, userType, isDeleted: false });

        if (!userDoc) {
            if(userType !== UserTypeEnum.USER) {
                return formatError(`You are not invited as ${capitalizeFirstLetter(userType)}`)
            }
            // No user found: register a new user record
            const username = await CustomerRepository.generateRandomUsername();
            userDoc = new CustomerModel({
                email,
                password,
                userType,
                name: username
            });
            await userDoc.save();
            isNewSignup = true;
        } else {
            // Validate password on existing user
            const valid = await userDoc.comparePassword(password);
            if (!valid) {
                return formatError('Invalid email or password.');
            }
        }

        // Prevent login if account suspended
        if (!userDoc.isActive) {
            return formatError('Your account is suspended. Please contact support.');
        }

        // Generate access and refresh tokens
        const tokens = await SpaceJwtSecurity.signRefreshAccessToken(
            userDoc._id,
            userType,
            userDoc.email,
            undefined
        );

        // Cache user data for fast retrieval
        const cacheRepo = new CacheRepository();
        const toCache = userDoc.toObject();
        delete toCache?.password;
        await cacheRepo.setSpaceUser(userDoc._id, toCache);

        // Return login response including tokens and signup flag
        return formatAPI('', {
            userID: userDoc._id,
            userType,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            signup: isNewSignup
        });
    }

    // Fetch list of chat contacts for current user
    async getPeopleList(
        currentUserId: CustomerInterface["_id"],
        userType: UserTypeEnum,
        page?: number,
        pageSize?: number
    ): Promise<ApiInterface<PaginateResult<CustomerInterface>>> {
        const otherType = userType === UserTypeEnum.USER ? UserTypeEnum.AGENT : UserTypeEnum.USER;
        const filter: FilterQuery<CustomerInterface> = {
            userType: otherType,
            isActive: true,
            isDeleted: false
        };
        const result = await paginateModel<CustomerDocumentInterface>(
            CustomerModel,
            filter,
            'name profileImage email',
            [],
            true,
            page,
            pageSize
        );
        return formatAPI('', result);
    }

    // Retrieve user by ID, using cache when available
    async getUserFromUserID(
        userID: CustomerInterface['_id'],
        userType?: UserTypeEnum,
        useCache: boolean = true
    ): Promise<CustomerInterface | null> {
        const cacheRepo = new CacheRepository();

        if (useCache) {
            const cached = await cacheRepo.getSpaceUser(userID);
            if (cached) return cached as CustomerInterface;
        }

        const filter: FilterQuery<CustomerInterface> = { _id: toObjectID(userID), isDeleted: false };
        if (userType) filter.userType = userType;

        const userDetail = await CustomerModel.findOne(filter)
            .select('-isDeleted -__v -twitter -isSeed -password')
            .lean();

        if (userDetail) {
            await cacheRepo.setSpaceUser(userID, userDetail);
        }
        return userDetail;
    }
}

export default new CustomerRepository();
