import {assertUserInRequest} from '@interface/api.interface';
import {UserTypeEnum} from '@interface/generic.enum';
import {CustomerInterface} from "@interface/model";
import ServerLogger from '@middleware/server_logging.middleware';
import {CustomerModel} from "@model/index";
import {customerRepository} from "@repository/index";
import {toObjectID} from '@utils/db.util';
import {formatAPI, formatError} from '@utils/format.util';
import SpaceJwtSecurity, {REFRESH_TOKEN_TTL} from "@utils/jwt/space_jwt.util";
import {Request, Response} from 'express';
import _ from "lodash";

class CustomerController {

    // Logout user by invalidating their refresh token
    async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies['refreshToken'];
            console.log('refreshToken', refreshToken)
            if (refreshToken) {
                const payload = await SpaceJwtSecurity.verifyRefreshToken(refreshToken);
                if(payload){
                    await CustomerModel.findByIdAndUpdate(payload.id, {
                        $push: {
                            'fcmToken.uuid': payload.uuid,
                        }
                    })
                }
                await SpaceJwtSecurity.invalidateRefreshToken(refreshToken);
            }

            // clear the cookie on the client
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure:   process.env.NODE_ENV === "production",
                sameSite: "none",       // <— required for cross-site cookies
            });
            return res.status(204).json(formatAPI('Logged out!!'));
        } catch (err) {
            console.error(err);
            ServerLogger.error(err);
            return res.status(500).json(formatError('Logout failed.', err));
        }
    }

    // Login or register user with email & password
    async login(req: Request, res: Response) {
        try {
            const {email, password, userType} = req.body as {
                email: string;
                password: string;
                userType: UserTypeEnum;
            };
            const data = await customerRepository.loginRegister(
                email.toLowerCase().trim(),
                password,
                userType
            );
            // Set the refresh token cookie
            const refreshToken =data?.data?.refreshToken;
            res.cookie('refreshToken', `Bearer ${refreshToken}`, {
                httpOnly: true,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: REFRESH_TOKEN_TTL,
            });
            delete data?.data?.refreshToken;

            return res.status(data.status ?? 200).json(data);
        } catch (err) {
            console.error(err);
            ServerLogger.error(err);
            return res.status(500).json(formatError('Login failed.', err));
        }
    }

    // Edit Own profile
    async editProfile(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const customerData: Partial<CustomerInterface> = _.pick(req.body, [
                'name',
                'profileImage',
            ]);
            const data = await customerRepository.editProfile(
                req.user._id,
                customerData as CustomerInterface);
            return res.status(data.status ?? 200).json(data);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error));
        }
    }

    // Save FCM
    async saveFcm(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {token} = req.body;
            const payload = await SpaceJwtSecurity.verifyAccessToken(req.header("Authorization")!);
            const data = await customerRepository.saveFcm(
                req.user._id,
                token,
                payload.uuid,
            );
            return res.status(data.status ?? 200).json(data);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error));
        }
    }

    // Get current logged-in user profile
    async currentProfile(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            return res.json(formatAPI('', req.user));
        } catch (err) {
            console.error(err);
            ServerLogger.error(err);
            return res.status(400).json(formatError('Failed to fetch profile.', err));
        }
    }

    // Fetch another user's profile by ID
    async customerProfile(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {customerID} = req.params;
            const user = await customerRepository.getUserFromUserID(toObjectID(customerID));
            return res.status(user ? 200 : 404).json(formatAPI('', user));
        } catch (err) {
            console.error(err);
            ServerLogger.error(err);
            return res.status(400).json(formatError('Could not fetch user.', err));
        }
    }

    // List chat contacts (agents for user, users for agent)
    async getPeopleList(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const page = parseInt((req.query.page as string) || '1', 10);
            const pageSize = parseInt((req.query.pageSize as string) || '20', 10);
            const data = await customerRepository.getPeopleList(
                req.user._id,
                req.user.userType,
                page,
                pageSize
            );
            return res.status(data.status ?? 200).json(data);
        } catch (err) {
            console.error(err);
            ServerLogger.error(err);
            return res.status(400).json(formatError('Could not fetch contacts.', err));
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            const oldToken = req.cookies['refreshToken'];
            if (!oldToken) {
                return res.status(401).json({message: 'Missing refresh token'});
            }
            const payload = await SpaceJwtSecurity.verifyRefreshToken(oldToken);
            const {accessToken, refreshToken: newToken} =
                await SpaceJwtSecurity.signRefreshAccessToken(
                    toObjectID(payload.id), payload.userType, payload.email, payload.uuid
                );
            // replace cookie
            res.cookie('refreshToken', `Bearer ${newToken}`, {
                httpOnly: true,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: REFRESH_TOKEN_TTL
            });
            return res.json({accessToken});
        } catch (err) {
            console.error(err);
            ServerLogger.error(err);
            return res.status(400).json(formatError('Could not refresh tokens.', err));
        }
    }

}

export default new CustomerController();
