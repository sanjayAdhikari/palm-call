import {assertUserInRequest} from "@interface/api.interface";
import {NextFunction, Request, Response} from "express";
import passport from "passport";
import {UserTypeEnum} from "../interface/model";
import {formatError} from "../utils";
import ServerLogger from "./server_logging.middleware";

export const getRefreshToken = function (req: Request, res: Response, next: NextFunction) {
    // what it does is load token from cookies to headers authorization
    // system is de-coupled from cookies

    // if token is in cookies, uncomment below first part only

    // // decode refresh token from cookies // use this to prevent XSR client side attack
    const refreshToken = req.cookies['refreshToken'];
    console.log('refreshToken', refreshToken)
    if (!refreshToken) return res.status(401).json(formatError('UnAuthorized Access!!'))
    // req.headers['authorization'] = refreshToken;

    // SINCE token is already in authorization, no need to do anything
    // decode refresh token from req header
    // const authHeader = req.headers['authorization'];

    next();
}
export const authentication = passport.authenticate('jwt', {session: false});

export function authorize(userType?: UserTypeEnum) {
    return function (
        req: Request, res: Response, next: NextFunction
    ) {
        try {
            assertUserInRequest(req);

            // if userTypes === promoter then brand should be able to access it
            if (userType && req.user.userType !== userType) {
                return res.status(401).json("You are not authorize to access this.")
            }
            next();
        } catch (error) {
            console.error('Admin Error', error);
            ServerLogger.error('Authorize Error', error);
            return res.status(401).json(formatError('Invalid Access token'));
        }

    }
}
