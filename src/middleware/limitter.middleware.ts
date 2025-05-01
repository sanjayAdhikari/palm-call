import {RedisStore} from 'rate-limit-redis'
import {limiterRedisConfig} from "../utils/config.util";
import RedisClient from 'ioredis'
import {NextFunction, Request, Response} from 'express';
import {CustomerInterface} from "../interface/model";

const limiterRedisCred = limiterRedisConfig();
const redisClient = new RedisClient(limiterRedisCred);
const allowList = ['']

const rateLimiterOption = () => ({
    store: new RedisStore({
        // @ts-ignore
        sendCommand: (...args: string[]) => redisClient.duplicate().call(...args),
    }),
    statusCode: 429,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req: Request): string => {
        const userID = (req.user as any as CustomerInterface)?._id;
        return userID ? (userID ?? '1').toString() : (req.ip ?? '1');
    },
    skip: (req: Request) => allowList.includes(req.ip ?? ''),
})

const bypassLimiter = (req: Request, res: Response, next: NextFunction) => {
    return next(); // Skip rate limiter

};


// Create a rate limiter using express-rate-limit
export const defaultLimiter = bypassLimiter
// rateLimit({
//     ...rateLimiterOption(),
//     windowMs: 5 * 60 * 1000, // 5 minutes
//     max: 500, // Limit each Users IP to 100 requests per `window` (here, per 15 minutes)
// });

export const uploadImageAdminLimiter = bypassLimiter;
// rateLimit({
//     ...rateLimiterOption(),
//     windowMs: 60 * 1000, // 1 minutes
//     max: 50, // Limit each Users IP to 100 requests per `window` (here, per 1 minutes)
// });

export const uploadImageCustomerLimiter = bypassLimiter;
// rateLimit({
//     ...rateLimiterOption(),
//     windowMs: 60 * 1000, // 1 minutes
//     max: 10, // Limit each Users IP to 100 requests per `window` (here, per 1 minutes)
// });

export const resentOtpLimiter = bypassLimiter;
// rateLimit({
//     ...rateLimiterOption(),
//     windowMs: 60 * 1000, // 1 minutes
//     max: 4, // Limit each Users IP to 10 requests per `window` (here, per 1 minutes)
// });
