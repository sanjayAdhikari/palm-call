import jwt from 'jsonwebtoken';
import environmentVariable from "../../config/custom-environment-variables";
import config from "../../config";
import ServerLogger from "../../middleware/server_logging.middleware";
import {JwtPayload, OtpJwtPayload,} from "../../interface/config.interface";
import {NullString, ObjectID} from "../../interface/generic.type";
import {AppConstant} from "../../config/constant";
import CacheClient from "../../service/redis/init_redis.service";
import {generateUniqueNumberFromMongoId} from "../crypto.util";
import {Types} from "mongoose";
import CacheRepository from "../../service/redis/repository.cache";
import {CustomerInterface, UserTypeEnum} from "../../interface/model";
import {ApiInterface} from "../../interface/api.interface";
import {formatAPI, formatError} from "../format.util";

const REFRESH_TOKEN_TTL =  2 * 24 * 60 * 60; // 2 DAYS

class SpaceJwtSecurity {
    static getTokenKeyName(tenantID: string, uuid?: string) {
        return `${AppConstant.refreshTokenPrefix}_${tenantID}_${uuid ?? ''}`;
    }

    static async invalidateRefreshTokenFromUserID(customerID: ObjectID, uuid?: string): Promise<ApiInterface> {
        try {
            const cache = await CacheClient.init();
            let spaceRefreshToken = CacheRepository.getTokenKeyNamePrefix(customerID?.toString(), uuid ?? '*')
            await cache.deleteKeysWithPattern(spaceRefreshToken)
            return formatAPI();
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return formatError('Something went wrong');
        }
    }

    static async checkIfUuidExist(customerID: ObjectID, uuid: string): Promise<ApiInterface> {
        try {
            const cache = await CacheClient.init();
            let spaceRefreshToken = CacheRepository.getTokenKeyNamePrefix(customerID?.toString(), uuid ?? '*')
            const exist = await cache.checkIfKeyExists(spaceRefreshToken)
            return formatAPI('', exist);
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return formatError('Something went wrong');
        }
    }


    static verifyAccessToken(authHeader: string): Promise<JwtPayload> {
        return new Promise((resolve, reject) => {
            // if (!req.headers['authorization']) return next()
            // const authHeader = req.headers['authorization']
            const bearerToken = authHeader.split(' ')
            const token = bearerToken[1];
            const secret = config<string>(environmentVariable.ACCESS_TOKEN_SECRET);

            jwt.verify(token, secret, async (err, payload: any) => {
                if (err || !payload?.id || !payload?.uuid) {
                    return reject('Invalid Token. Unauthorized Access');
                }
                const cache = await CacheClient.init();
                const value = await cache.get(
                    SpaceJwtSecurity.getTokenKeyName(`${payload.id.toString()}-${payload.uuid}`)
                );
                if (value)
                    return resolve(payload);
                else
                    return reject('Invalid Token. Unauthorized Access');

            })
        })
    }

    static async verifyRefreshToken(authHeader: string): Promise<JwtPayload> {
        return new Promise((resolve, reject) => {
            const bearerToken = authHeader.split(' ')
            const token = bearerToken[1];
            const secret = config<string>(environmentVariable.REFRESH_TOKEN_SECRET);
            jwt.verify(token, secret, async (err, payload: any) => {
                console.log('payload', payload)
                if (err || !payload?.email || !payload?.uuid) {
                    return reject('Invalid Token. Unauthorized Access');
                }
                const cache = new CacheRepository();
                const value = await cache.getRefreshToken(
                    payload.email,
                    payload.uuid,
                );
                if (value && value === token) {
                    return resolve(payload);
                }
                reject('Invalid Refresh Token. Unauthorized Access');

            })
        })
    }


    static invalidateRefreshToken(authHeader: string): Promise<string> {
        try {
            return new Promise((resolve, reject) => {
                const bearerToken = authHeader.split(' ')
                const token = bearerToken[1];
                const secret = config<string>(environmentVariable.REFRESH_TOKEN_SECRET);
                jwt.verify(token, secret, async (err, payload: any) => {
                    if (err || !payload?.id || !payload?.uuid) {
                        return reject('Invalid Token. Unauthorized Access');
                    }
                    const cache = await CacheClient.init();
                    await cache.delete(SpaceJwtSecurity.getTokenKeyName(`${payload.id.toString()}-${payload.uuid}`))
                    return resolve('DONE');
                })
            })
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return Promise.resolve('Something went wrong');
        }
    }

    static verifyNonAuthenticAccessToken<TokenType = JwtPayload>(authHeader: string): Promise<TokenType> {
        return new Promise((resolve, reject) => {
            // if (!req.headers['authorization']) return next()
            // const authHeader = req.headers['authorization']
            const bearerToken = authHeader.split(' ')
            const token = bearerToken[1];
            const secret = config<string>(environmentVariable.ACCESS_TOKEN_SECRET);

            jwt.verify(token, secret, async (err, payload: any) => {
                if (err || !payload?.id) {
                    return reject('Invalid Token. Unauthorized Access');
                }
                return resolve(payload);

            })
        })
    }

    static signNonAuthenticAccessToken(userID: ObjectID, payload: any = {}, expiresIn: number = 5 * 60): string {
        try {
            const jwtPayload: Partial<JwtPayload> = {
                id: userID.toString(),
                type: 0,
                ...payload,
            };
            const secret = config<string>(environmentVariable.ACCESS_TOKEN_SECRET);
            return this.signToken(secret, jwtPayload, expiresIn)
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return '';
        }
    }

    static signAccessToken(userID: ObjectID, email: string, userType: UserTypeEnum, uuid?: string): string {
        try {
            uuid = uuid || generateUniqueNumberFromMongoId(new Types.ObjectId());
            if (!uuid) Error('Error Occurs while generating a token.')
            const JWTPayload: Partial<JwtPayload> = {
                id: userID.toString(),
                type: 1,
                uuid,
                userType,
                email,
            };
            const secret = config<string>(environmentVariable.ACCESS_TOKEN_SECRET);
            const expiresIn = config<number>(environmentVariable.ACCESS_TOKEN_EXPIRY_HOUR);
            return this.signToken(secret, JWTPayload, expiresIn * 60 * 60)
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return '';
        }
    }

    static async signRefreshAccessToken(userID: ObjectID, userType: UserTypeEnum, email: string, uuid: string = generateUniqueNumberFromMongoId(new Types.ObjectId())): Promise<{
        accessToken: string,
        refreshToken: string,
    }> {
        try {
            if (!uuid) Error('Error Occurs while generating a token.')
            const refreshToken: NullString = await SpaceJwtSecurity.signRefreshToken(email, userType, uuid);
            const accessToken: NullString = SpaceJwtSecurity.signAccessToken(userID!, email, userType, uuid);
            return {accessToken, refreshToken};
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return {accessToken: '', refreshToken: ''};
        }
    }

    static async signRefreshToken(email: string, userType?: UserTypeEnum, uuid?: string): Promise<string> {
        try {
            uuid = uuid || generateUniqueNumberFromMongoId(new Types.ObjectId());
            if (!uuid) Error('Error Occurs while generating a token.')
            const JWTPayload: Partial<JwtPayload> = {
                type: 1,
                userType,
                email,
                uuid: uuid as string, // Generate a UUID and add it to the JWT payload
            };
            const secret = config<string>(environmentVariable.REFRESH_TOKEN_SECRET);
            const expiresIn = config<number>(environmentVariable.REFRESH_TOKEN_EXPIRY_DAY);
            const token = this.signToken(secret, JWTPayload, expiresIn * 60 * 60 * 24);
            const cache = new CacheRepository();
            await cache.setRefreshToken(email, JWTPayload.uuid!, token, REFRESH_TOKEN_TTL);
            return token;
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return '';
        }
    }

    static signOtpToken(id: CustomerInterface["_id"], email: string, hash: string, userType: UserTypeEnum, uuid?: string) {
        try {
            const secret = config<string>(environmentVariable.ACCESS_TOKEN_SECRET);
            const otpJwt: Partial<OtpJwtPayload> = {
                id: id.toString(),
                email,
                hash,
                userType,
            }
            if (uuid) otpJwt.uuid = uuid?.toString();

            return SpaceJwtSecurity.signToken(secret, otpJwt, 10 * 60);
        } catch (error) {
            console.log('error', error);
            ServerLogger.error(error);
            return '';
        }
    }

    static verifyOtpToken(token: string): Promise<OtpJwtPayload> {
        return new Promise((resolve, reject) => {
            const secret = config<string>(environmentVariable.ACCESS_TOKEN_SECRET);

            jwt.verify(token, secret, async (err, payload: any) => {
                console.log(payload, 'err', err);

                if (err || !payload?.email) {
                    return reject('Invalid Hash.');
                }
                return resolve(payload);

            })
        })
    }

    private static signToken(secret: string, payload: any, expiresInSeconds: number | null = 5 * 60) {
        const iat: number = Math.floor(Date.now() / 1000);
        const JWTPayload: Partial<JwtPayload> = payload;
        JWTPayload.iat = iat;
        const jwtOptions: any = {}
        if (expiresInSeconds) {
            JWTPayload.exp = Math.floor(Date.now() / 1000) + (expiresInSeconds);
            jwtOptions.expiresIn = 30;
        }

        return jwt.sign(JWTPayload, secret);
    }
}

export default SpaceJwtSecurity;
