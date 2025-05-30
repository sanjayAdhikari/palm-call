import fs from "fs";
import {parseInt} from "lodash";
import environmentVariable from "./custom-environment-variables";
import {EnvironmentValueInterface} from "@interface/env.interface";
import path from "path";
import dotEnv from "dotenv";

// configuring the config package
let filename = '.env';
const env = process.env.NODE_ENV || 'development';
if (env === 'test') filename = '.env.test'
else if (env === 'development') filename = '.env.dev'
const configFilePath = path.join(__dirname, '../../', filename);
console.log("env file loaded from: ", configFilePath);
dotEnv.config({path: configFilePath});
const isEnvExists = fs.existsSync(configFilePath);  // 'utf8' ensures text output
if (!isEnvExists) {
    console.log('env file not found. PATH  ---->', configFilePath);
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

console.log(isProduction, '<---- isProduction, environment --->', process.env.NODE_ENV)

const data: EnvironmentValueInterface = {
    API_GATEWAY_HOST: <string>process.env[environmentVariable.API_GATEWAY_HOST],
    FRONTEND_HOST: <string>process.env[environmentVariable.FRONTEND_HOST],

    PORT: parseInt(<string>process.env[environmentVariable.PORT], 10) || 5000,
    NODE_ENV: <string>process.env[environmentVariable.NODE_ENV] || 'development',
    ACCESS_TOKEN_SECRET: <string>process.env[environmentVariable.ACCESS_TOKEN_SECRET],
    REFRESH_TOKEN_SECRET: <string>process.env[environmentVariable.REFRESH_TOKEN_SECRET],
    REFRESH_TOKEN_EXPIRY_DAY: parseInt(<string>process.env[environmentVariable.REFRESH_TOKEN_EXPIRY_DAY] ?? '1'),
    ACCESS_TOKEN_EXPIRY_HOUR: parseInt(<string>process.env[environmentVariable.ACCESS_TOKEN_EXPIRY_HOUR] ?? '1'),
    CIPHER_SECRET_KEY: <string>process.env[environmentVariable.CIPHER_SECRET_KEY],
    SEED_ADMIN_EMAIL: <string>process.env[environmentVariable.SEED_ADMIN_EMAIL],
    SEED_ADMIN_PASSWORD: <string>process.env[environmentVariable.SEED_ADMIN_PASSWORD],
    EMAIL_SMTP_HOST: <string>process.env[environmentVariable.EMAIL_SMTP_HOST],
    EMAIL_SMTP_PORT: parseInt(<string>process.env[environmentVariable.EMAIL_SMTP_PORT] ?? '6379'),
    EMAIL_AUTH_ID: <string>process.env[environmentVariable.EMAIL_AUTH_ID],
    EMAIL_PASSWORD: <string>process.env[environmentVariable.EMAIL_PASSWORD],
    MONGODB_HOST: <string>process.env[environmentVariable.MONGODB_HOST],
    MONGODB_DB: <string>process.env[environmentVariable.MONGODB_DB],
    MONGODB_PARAMS: <string>process.env[environmentVariable.MONGODB_PARAMS],
    REDIS_HOST: <string>process.env[environmentVariable.REDIS_HOST],
    REDIS_PORT: parseInt(<string>process.env[environmentVariable.REDIS_PORT] ?? '6379'),
    REDIS_USERNAME: <string>process.env[environmentVariable.REDIS_USERNAME],
    REDIS_PASSWORD: <string>process.env[environmentVariable.REDIS_PASSWORD]

}

const config = function <Type>(key: string): Type {
    // const value : any = data[key as keyof typeof data];
    const value: any = data[key];
    return value as Type;
}
config.isProduction = isProduction;

export default config;
