import bodyParser from "body-parser";
import {Application, NextFunction, Request, Response} from "express";
import cors from 'cors';
import morgan from "morgan";
import ServerLogger from "./server_logging.middleware";
import ClientLogger from "./client_logging.middleware";
import passportMiddleware from './passport.middleware';
import passport from "passport";
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import path from "path";
import config from "../config";
import CustomEnvironmentVariables from "../config/custom-environment-variables";
import {getNumber} from "@utils/helper";
import helmet from 'helmet';
// @ts-ignore
import xss from 'xss-clean';

declare global {
    interface Number {
        getNumber(): number;
    }
}

Number.prototype.getNumber = function () {
    return getNumber((this as number) ?? 0);
}

const middleware = (app: Application) => {
    app.use(
        [
            helmet.contentSecurityPolicy({
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:"],
                    connectSrc: ["'self'"],
                },
            }),
            helmet.hsts({maxAge: 31536000})
        ]
    );

    app.use(
        fileUpload({
            useTempFiles: true,
            safeFileNames: false,
            preserveExtension: true,
            tempFileDir: path.join(__dirname, '../../public', 'files'),
        }),
    );

    console.log({
        origin: config(CustomEnvironmentVariables.FRONTEND_HOST),  // ← must be exact
        credentials: true,
    })
    app.use(cors({
        origin: config(CustomEnvironmentVariables.FRONTEND_HOST),  // ← must be exact
        credentials: true,
    }));
    app.use([
        xss(),
        cookieParser()
    ]);


    app.set('trust proxy', true);
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    // Delete all the req.body string field if they are empty
    app.use((req: Request, res: Response, next: NextFunction) => {
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === '') {
                delete req.body[key];
            }
        });
        next();
    })

    // passport middleware config
    app.use(passport.initialize());
    passportMiddleware();

    if (config(CustomEnvironmentVariables.NODE_ENV) === 'production') {
        // Two log files are created in logs folder-->
        // 1.app.log with all the recent logs and,
        // 2.application- date.log with date wise logs of application
        // streamed with ist and utc
        // @ts-ignore
        app.use(morgan('combined', {stream: ServerLogger.stream}));
        // @ts-ignore
        app.use(morgan('combined', {stream: ClientLogger.stream}));
    }

}
export default middleware;
