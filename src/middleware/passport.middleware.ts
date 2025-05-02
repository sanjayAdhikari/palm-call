import {JwtPayload} from "@interface/config.interface";
import {CustomerInterface} from "@interface/model";
import {toObjectID} from "@utils/db.util";
import passport from "passport";
import {ExtractJwt, Strategy as JwtStrategy, StrategyOptions} from "passport-jwt";
import config from "@config/index";
import environmentVariable from "@config/custom-environment-variables";
import {customerRepository} from "@database/repository";
import CacheRepository from "@service/redis/repository.cache";
import ServerLogger from "./server_logging.middleware";

const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config<string>(environmentVariable.ACCESS_TOKEN_SECRET)
};

function passportMiddleware() {
    passport.use(
        new JwtStrategy(opts, async (jwtPayload: JwtPayload, done) => {
            if (parseInt(jwtPayload?.type?.toString() ?? 0) !== 1) {
                // access token not for login
                return done(null, false)
            }
            try {
                const cache = new CacheRepository();
                const value = await cache.getRefreshToken(
                    jwtPayload.id.toString(),
                    jwtPayload.uuid,
                );
                if (!value) {
                    return done(null, false);
                }
                const userData: CustomerInterface | null = await customerRepository.getUserFromUserID(toObjectID(jwtPayload.id));
                if (userData)
                    return done(null, userData);
                return done(null, false);
            } catch (error) {
                ServerLogger.error(error);
                return done(null, false);
            }
        }),
    );

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
        done(null, user);
    });
}

export default passportMiddleware;
