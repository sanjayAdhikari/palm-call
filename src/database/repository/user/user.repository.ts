import {CustomerModel} from "@model/index";
import { FilterQuery, PaginateResult } from 'mongoose';
import { ApiInterface } from '@interface/api.interface';
import { LoginResponseInterface } from '@interface/repository.interface';
import { CustomerDocumentInterface, CustomerInterface, UserTypeEnum } from '@interface/model';
import { formatAPI, formatError } from '@utils/index';
import SpaceJwtSecurity from '@utils/jwt/space_jwt.util';
import { generateGamifiedUsername } from '@utils/random-username';
import { paginateModel, toObjectID } from '@utils/db.util';
import CacheRepository from '@service/redis/repository.cache';

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
        await cacheRepo.setSpaceUser(userDoc._id, userDoc.toObject());

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
            'name profileImage',
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
            .select('-isDeleted -__v -twitter -isSeed')
            .lean();

        if (userDetail) {
            await cacheRepo.setSpaceUser(userID, userDetail);
        }
        return userDetail;
    }
}

export default new CustomerRepository();
