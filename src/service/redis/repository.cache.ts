import {AppConstant} from "@config/constant";
import {ObjectID} from "@interface/generic.type";
import {CustomerInterface,} from "@interface/model";
import CacheClient from "./init_redis.service";

class CacheRepository {

    static getTokenKeyNamePrefix(userID: string, uuid?: string) {
        return `${AppConstant.refreshTokenPrefix}_${userID}_${uuid ?? ''}`
    }

    async setRefreshToken(email: string, uuid: string, token: string, cacheAliveTime: number = 60 * 60) {
        await (await CacheClient.init()).set(
            CacheRepository.getTokenKeyNamePrefix(
                email.toString(),
                uuid,),
            token,
            cacheAliveTime
        );
    }

    async getRefreshToken(email: string, uuid: string,): Promise<string> {
        return await (await CacheClient.init()).get(
            CacheRepository.getTokenKeyNamePrefix(
                email.toString(),
                uuid,
            ),
        ) as string;
    }

    async setSpaceUser(userID: CustomerInterface['_id'], values: CustomerInterface | null, expiredDate: number = AppConstant.cacheAliveTime) {
        if (!values) {
            (await CacheClient.init()).delete(`user_${userID}`);
            return null;
        }
        (await CacheClient.init()).set(`user_${userID}`, values, Math.floor(expiredDate));
    }

    async getSpaceUser(userID: CustomerInterface['_id']): Promise<CustomerInterface | null> {
        return await (await CacheClient.init()).get(`user_${userID}`) as CustomerInterface | null;
    }

    async setCacheValue<ValueType = any>(key: string | ObjectID, values: ValueType | null, expiredDate: number = AppConstant.cacheAliveTime) {
        key = key?.toString();
        if (!values) {
            (await CacheClient.init()).delete(`cache_${key}`);
            return null;
        }
        (await CacheClient.init()).set(`user_${key}`, values, Math.floor(expiredDate));
    }

    async getCacheValue<ValueType = any>(key: string | ObjectID): Promise<ValueType | null> {
        key = key?.toString();
        return await (await CacheClient.init()).get(`user_${key}`) as ValueType | null;
    }
}

export default CacheRepository;
