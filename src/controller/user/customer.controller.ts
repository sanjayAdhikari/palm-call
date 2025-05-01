import {assertUserInRequest} from '@interface/api.interface';
import {UserTypeEnum} from '@interface/generic.enum';
import ServerLogger from '@middleware/server_logging.middleware';
import {customerRepository} from "@repository/index";
import {toObjectID} from '@utils/db.util';
import {formatAPI, formatError} from '@utils/format.util';
import SpaceJwtSecurity from "@utils/jwt/space_jwt.util";
import {Request, Response} from 'express';

class CustomerController {

    // Logout user by invalidating their refresh token
    async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies['refreshToken'];
            if (refreshToken) {
                await SpaceJwtSecurity.verifyRefreshToken(refreshToken);
                await SpaceJwtSecurity.invalidateRefreshToken(refreshToken);
            }
            // clear the cookie on the client
            res.clearCookie('refreshToken', {path: '/'});
            return res.json(formatAPI('Logged out!!'));
        } catch (err) {
            // …
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
            return res.status(data.status ?? 200).json(data);
        } catch (err) {
            ServerLogger.error(err);
            return res.status(500).json(formatError('Login failed.', err));
        }
    }

    // Get current logged-in user profile
    async currentProfile(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            return res.json(formatAPI('', req.user));
        } catch (err) {
            ServerLogger.error(err);
            return res.status(400).json(formatError('Failed to fetch profile.', err));
        }
    }

    // Fetch another user's profile by ID
    async customerProfile(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {itemID} = req.params;
            const user = await customerRepository.getUserFromUserID(toObjectID(itemID));
            return res.status(user ? 200 : 404).json(formatAPI('', user));
        } catch (err) {
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
            res.cookie('refreshToken', newToken, {
                httpOnly: true,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            return res.json({accessToken});
        } catch (err) {
            // …
        }
    }

}

export default new CustomerController();
