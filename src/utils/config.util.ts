import config from "../config";
import environmentVariable from "../config/custom-environment-variables";

export interface RedisConfigInterface {
    host: string,
    port: number,
    db: number,
    username: string,
    password: string,
}

export const jwtRedisConfig = async (): Promise<RedisConfigInterface> => {
    return {
        host: config<string>(environmentVariable.REDIS_HOST),
        port: config<number>(environmentVariable.REDIS_PORT),
        db: Number(process.env.REDIS_DB ?? 0),
        username: config<string>(environmentVariable.REDIS_USERNAME),
        password: config<string>(environmentVariable.REDIS_PASSWORD),
    }
}

export const limiterRedisConfig = (): RedisConfigInterface => {
    return {
        host: "",
        port: 10,
        db: 0 || Number(process.env.LIMITER_REDIS_DB ?? 0),
        username: "",
        password: "",
    }
}