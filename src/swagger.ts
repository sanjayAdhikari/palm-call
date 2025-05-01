import config from "./config";
import environmentVariable from "./config/custom-environment-variables";
import {Application} from 'express';

function addSwagger(app: Application) {
    const expressSwagger = require('express-swagger-ui-generator')(app);
    let protocols = config(environmentVariable.NODE_ENV) ? ['http'] : ['https'];
    let options = {
        swaggerDefinition: {
            info: {
                description: 'PalmMind chat application',
                title: 'palm mind chat application System API Documentation'
            },
            produces: [
                "application/json",
                "application/xml"
            ],
            consumes: [
                "application/json",
                "application/xml",
                "application/x-www-form-urlencoded"
            ],
            // host: 'localhost:3000',
            // basePath: '/v1',
            schemes: protocols,
            securityDefinitions: {
                JWT: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                    description: ""
                }
            }
        },
        basedir: __dirname,
        files: ['./route/**/*.ts']
    };
    expressSwagger(options);
    console.log(`API Documentation is available @ http://localhost:${config(environmentVariable.PORT)}/api-docs`)
}

export default addSwagger;
