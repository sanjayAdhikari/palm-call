import {Server, Socket} from 'socket.io';
import {Server as HttpServer} from 'http';
import MySocketInterface from "./mySocketInterface";

const WEBSOCKET_CORS = {
    origin: "*",
    methods: ["GET", "POST"]
}

class Websocket extends Server {

    private static io: Websocket;

    constructor(httpServer: HttpServer) {
        super(httpServer, {
            cors: WEBSOCKET_CORS
        });
        //  socket implementation goes here
    }

    public static getInstance(httpServer?: HttpServer): Websocket {
        if (!Websocket.io && httpServer) {
            Websocket.io = new Websocket(httpServer);
        }
        console.log('Socket is ready to use')
        return Websocket.io;
    }

    public initializeHandlers(socketHandlers: Array<any>) {
        socketHandlers.forEach((element: { path: string, handler: MySocketInterface }) => {
            let namespace = Websocket.io.of(element.path, (socket: Socket) => {
                element.handler.handleConnection(socket);
            });

            if (element.handler.middlewareImplementation) {
                namespace.use(element.handler.middlewareImplementation);
            }
        });
    }
}

export default Websocket;
