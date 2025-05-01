import {Socket} from "socket.io";
import MySocketInterface from "./mySocketInterface";
import {NextFunction} from "express";

class SocketLogic implements MySocketInterface {

    handleConnection(socket: Socket) {

        socket.emit(socket.id, 'ping', 'Hi! I am a live socket connection');

    }

    middlewareImplementation(socket: Socket, next: NextFunction) {
        //Implement your middleware for orders here
        return next();
    }
}

export default SocketLogic;
