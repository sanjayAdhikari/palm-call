import {ConstantInterface} from "@interface/config.interface";

export const AppConstant: ConstantInterface = {
    collectionName: {
        CUSTOMER: 'customer',
        THREAD: 'thread',
        MESSAGE: 'message',
        NOTIFICATION: 'notification',
    },
    defaultTimezone: 'Asia/Kathmandu',
    defaultCountryCode: '+977',
    dateFormat: 'DD/MM/YYYY hh:mm a',
    refreshTokenPrefix: 'r_token',
    cacheAliveTime: (1.1 * 60 * 60), // seconds i.e 1 hour
}
