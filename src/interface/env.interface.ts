export interface EnvironmentLabelInterface {
    ACCESS_TOKEN_SECRET: string,
    REFRESH_TOKEN_SECRET: string,
    REFRESH_TOKEN_EXPIRY_DAY: string,
    ACCESS_TOKEN_EXPIRY_HOUR: string,

    PORT: string,
    NODE_ENV: string,
    CIPHER_SECRET_KEY: string,
    SEED_ADMIN_EMAIL: string,
    SEED_ADMIN_PASSWORD: string,

    EMAIL_SMTP_HOST: string,
    EMAIL_PASSWORD: string,
    EMAIL_SMTP_PORT: string,
    EMAIL_AUTH_ID: string,

    MONGODB_HOST: string,
    MONGODB_DB: string,
    MONGODB_PARAMS: string,

    REDIS_HOST: string,
    REDIS_PORT: string,
    REDIS_USERNAME: string,
    REDIS_PASSWORD: string,
}

export interface EnvironmentValueInterface {
    ACCESS_TOKEN_SECRET: string,
    REFRESH_TOKEN_SECRET: string,
    REFRESH_TOKEN_EXPIRY_DAY: number,
    ACCESS_TOKEN_EXPIRY_HOUR: number,

    PORT: number,
    NODE_ENV: string,
    CIPHER_SECRET_KEY: string,
    SEED_ADMIN_EMAIL: string,
    SEED_ADMIN_PASSWORD: string,

    EMAIL_SMTP_HOST: string,
    EMAIL_PASSWORD: string,
    EMAIL_SMTP_PORT: number,
    EMAIL_AUTH_ID: string,

    MONGODB_HOST: string,
    MONGODB_DB: string,
    MONGODB_PARAMS: string,

    REDIS_HOST: string,
    REDIS_PORT: number,
    REDIS_USERNAME: string,
    REDIS_PASSWORD: string,

    [key: string]: any;
}
