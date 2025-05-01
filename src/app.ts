import {Application} from 'express';
import http from "http";
import environmentVariable from "./config/custom-environment-variables";
import config from "./config";
import createServer from "./server";
import SocketLogic from "./route/websocket/socket";
import Websocket from "./route/websocket";

const startServer = async () => {
    const app: Application = await createServer();
    app.set('PORT', config<number>(environmentVariable.PORT));

    const httpServer: http.Server = http.createServer(app);
    const io = Websocket.getInstance(httpServer);
    io.initializeHandlers([
        {path: '/', handler: new SocketLogic()}
    ]);


    /** Listen on provided port, on all network interfaces. */
    httpServer.listen(Number(app.get<number>('PORT')), () => {
        console.log(`listening to port ${app.get<number>('PORT')}`);
    }).on('error', (err: any) => {
        console.log('ERROR', err)
        if (err.code === 'EADDRINUSE') {
            console.log(`server startup error: address ${app.get<number>('PORT')} already in use`);
        } else {
            console.log(err);
        }
        process.exit();
    });
    return app;
}

export default startServer;
