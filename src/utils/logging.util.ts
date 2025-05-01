import winston from "winston";
import {AppConstant} from "../config/constant";
import config from "../config";

// timezone function winston calls to get timezone(ASIA/KOLKATA)
const timeZoned = () => new Date().toLocaleString('en-US', {
    timeZone: AppConstant.defaultTimezone,
});
// options for logger object
const options = {
    file: {
        level: 'info',
        filename: '',
        // filename: `${logDirectory}/app.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

const getLoggingInstance = function (logDirectory: string,) {
    const transport = new winston.transports.DailyRotateFile({
        filename: `${logDirectory}/application-%DATE%.log`,
        datePattern: 'DD-MM-YYYY',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
    });
    options.file.filename = `${logDirectory}/app.log`;
    // logger object with above defined options
    const logger = winston.createLogger({
        transports: [
            new winston.transports.File(options.file),
            new winston.transports.Console(options.console),
            transport,
        ],
        format: winston.format.combine(
            winston.format.simple(),
            winston.format.errors({stack: true}),
            winston.format.timestamp({
                format: timeZoned,
            }),
            winston.format.printf(
                (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
            ),
        ),
        exitOnError: false,
    });
    // writing file
    logger.stream = {
        // @ts-ignore
        write(message: any) {
            logger.info(message);
        },
    };
    return logger;

}

export const debugLog = (...logs: any[]) => {
    if (!config.isProduction) {
        console.log(...logs)
    }
}
export default getLoggingInstance;
