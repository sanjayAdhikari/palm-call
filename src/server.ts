import express, {Application} from "express";
import middleware from "./middleware";
import routes from "./route";
import addSwagger from "./swagger";
import {connectDB} from "./database/connection";

async function createServer(): Promise<Application> {
    const app: Application = express();

    // connect DB
    connectDB();

    // set redis
    // const cache = await redisCache();
    // cache.setEx('foo', 60, 'bartender').then();

    // set middleware
    middleware(app);

    // run swagger docs
    addSwagger(app);

    console.log('server')
    // set route
    routes(app);
    return app;
}

export default createServer;
