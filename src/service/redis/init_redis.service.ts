import ServerLogger from "../../middleware/server_logging.middleware";
import Redis, {RedisOptions} from 'ioredis';
import {AppConstant} from "../../config/constant";
import {isJson} from "../../utils/helper";
import {jwtRedisConfig} from "../../utils/config.util";
import CustomEnvironmentVariables from "../../config/custom-environment-variables";
import config from "../../config";

const getImplicitKey = (key: string) => {
    const prefixEnv = config<string>(CustomEnvironmentVariables.NODE_ENV);
    return `${prefixEnv}_${key}`
}

class CacheClient {
    private static redisClient: Redis;

    private constructor() {
    }

    public static async init(credentials?: RedisOptions): Promise<CacheClient> {
        if (!this.redisClient) {
            if (!credentials) {
                credentials = await jwtRedisConfig();
            }
            const options: RedisOptions = {
                ...credentials,
                enableReadyCheck: true,
                connectTimeout: 3000,
                keepAlive: 1,
                retryStrategy: (times: number) => {
                    const maxAttempts = 5;
                    if (times <= maxAttempts) {
                        console.error('?', 'Redis error encountered! Trying to reconnect (Attempt ' + times + ' of ' + maxAttempts + ')');
                        return Math.min(times * 100, 3000);
                    } else {
                        console.error('?', 'Redis error encountered! Maximum retry attempts reached, giving up.');
                        return null;
                    }
                }
            }
            this.redisClient = new Redis(options);

            let errorCounter = 0
            this.redisClient
                .on('error', (error: any) => {
                    errorCounter++
                    ServerLogger.error(error)
                    if (errorCounter > 5) {
                        console.error('?', 'Redis error encountered! Enough of this, I quit!\n', error)
                        // killGracefully()
                    } else {
                        console.error('?', 'Redis error encountered! Trying to reconnect...\n', error)
                    }
                });

            this.redisClient
                .on('ready', () => {
                    console.info('Redis is ready to use.!')
                });


            this.redisClient.on('connect', () => {
                console.log('✅', 'Client is connected to redis');
            })

            this.redisClient.on('error', (error: any) => {
                console.log('Error while connecting to Redis', error.message);
            })

            this.redisClient.on('end', () => {
                console.log('Client is disconnected from redis');
            })

            process.on('SIGINT', () => {
                this.redisClient.quit().then();
            });
            await this.redisClient.info();
        }
        return new CacheClient();

    }

    getCacheMiddleware(): Redis {
        return CacheClient.redisClient;
    }

    // Add Pub/Sub methods
    public async publish(channel: string, message: any) {
        return CacheClient.redisClient.publish(channel, JSON.stringify(message));
    }

    async deleteKeysWithPattern(pattern: string): Promise<boolean> {
        try {
            // Retrieve keys that match the pattern
            const keysToDelete = await CacheClient.redisClient.keys(pattern);
            // Check if there are keys to delete
            if (keysToDelete.length > 0) {
                // Delete the keys
                await CacheClient.redisClient.del(...keysToDelete);
            } else {
            }
            return !!keysToDelete.length;
        } catch (error) {
            console.error('Error deleting keys:', error);
            return false;
        }
    }

    async checkIfKeyExists(pattern: string): Promise<boolean> {
        try {
            // Retrieve keys that match the pattern
            const foundKeys = await CacheClient.redisClient.keys(pattern);
            // Check if there are keys to delete
            return !!foundKeys.length;
        } catch (error) {
            console.error('Error deleting keys:', error);
            return false;
        }
    }

    hSet(key: string, field: string, value: any) {
        // return CacheClient.redisClient.set(key, value);
        CacheClient.redisClient.hset(`dynamic_list`, field, JSON.stringify(value));
    }

    async hGet(key: string, field: string,): Promise<any> {
        const data = await CacheClient.redisClient.hget(key, field);
        return data ? JSON.parse(data) : null
    }

    set(key: string, value: any, cacheAliveTime: number = AppConstant.cacheAliveTime) {
        return CacheClient.redisClient.set(getImplicitKey(key), typeof value === 'string' ? value : JSON.stringify(value), 'EX', cacheAliveTime);
    }

    async get(key: string): Promise<any> {
        const data = await CacheClient.redisClient.get(getImplicitKey(key));
        if (!data) return null;
        return isJson(data) ? JSON.parse(data) : data;
    }

    delete(key: string) {
        return CacheClient.redisClient.del(getImplicitKey(key));
    }

}

export default CacheClient;
