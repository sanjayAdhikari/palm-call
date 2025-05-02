import { ApiInterface } from '@interface/api.interface';
import { JwtPayload } from '@interface/config.interface';
import {SocketEventEnum} from "@interface/generic.enum";
import {
    CustomerInterface,
    MessageInterface,
    NotificationCategoryEnum,
    ThreadInterface,
    UserTypeEnum
} from '@interface/model';
import { ChatRepository, customerRepository, NotificationRepository } from '@repository/index';
import { toObjectID } from '@utils/db.util';
import JwtSecurity from '@utils/jwt/space_jwt.util';
import { NextFunction } from 'express';
import { Socket } from 'socket.io';
import ServerLogger from '@middleware/server_logging.middleware';

export default class SocketLogic {
    async middlewareImplementation(socket: Socket, next: NextFunction) {
        const token = socket.handshake.auth.token as string;
        try {
            const jwtPayload = await JwtSecurity.verifyAccessToken(token) as JwtPayload;
            const userData = await customerRepository.getUserFromUserID(toObjectID(jwtPayload.id));
            if (!userData) throw new Error('User not found');
            socket.data.jwt = jwtPayload;
            socket.data.user = userData as CustomerInterface;
            return next();
        } catch (error: any) {
            console.error("Error in middlewareImplementation socket", error)
            return next(new Error('Auth error'));
        }
    }

    async handleConnection(socket: Socket) {
        const user = socket.data.user as CustomerInterface;
        const roleRoom = user.userType;
        const notifyRoom = user.userType === UserTypeEnum.USER ? UserTypeEnum.AGENT : UserTypeEnum.USER;

        // join the socket to its own role room
        socket.join(roleRoom);

        // notify the opposite role room that “someone” is online
        socket.nsp.to(notifyRoom).emit(SocketEventEnum.USER_ONLINE, { userId: user._id });

        const chatRepo = new ChatRepository(user);

        socket.on(SocketEventEnum.JOIN_THREAD, async ({ threadId }: { threadId: string }) => {
            try {
                const id = toObjectID(threadId);
                const messagesRes = await chatRepo.getMessages(id, 0, 1) as ApiInterface<any>;
                if (!messagesRes.success) {
                    socket.emit('error', { message: messagesRes.message });
                    return;
                }
                socket.join(threadId);
                console.log(user._id, ' join thread', threadId)
            } catch (err: any) {
                ServerLogger.error(err);
                socket.emit('error', { message: 'Unable to join thread' });
            }
        });
        socket.on(SocketEventEnum.LEAVE_THREAD, async ({threadId}: { threadId: string }) => {
            try {
                console.log(user._id, ' left thread', threadId)
                socket.leave(threadId);
            } catch (err: any) {
                ServerLogger.error(err);
                socket.emit('error', {message: 'Unable to join thread'});
            }
        });


        // Client asks for online users in the "users" room:
        socket.on(SocketEventEnum.GET_ONLINE_USERS, async ({ role }: { role: 'users' | 'agents' }) => {
            try {
                // Fetch all Socket instances in the given role-room
                const roleSockets = await socket.nsp.in(notifyRoom).fetchSockets();
                // Extract the user IDs attached to each socket
                const userIds = roleSockets.map(s => (s.data.user as CustomerInterface)._id.toString());
                socket.emit(SocketEventEnum.ONLINE_USERS, { role: notifyRoom, userIds });
            } catch (err: any) {
                ServerLogger.error(err);
                socket.emit('error', { message: 'Could not fetch online users' });
            }
        });


        socket.on(SocketEventEnum.MESSAGE, async ({ threadId, text }: { threadId: string; text: string }) => {
            try {
                const id = toObjectID(threadId);
                const msgRes: ApiInterface<{
                    message: MessageInterface;
                    otherParticipants: string[];
                    thread: ThreadInterface;
                }> = await chatRepo.createMessage(id, text);
                if (!msgRes.success) {
                    socket.emit(SocketEventEnum.ERROR, { message: msgRes.message });
                    return;
                }

                const { message, otherParticipants, thread } = msgRes.data || {};
                // broadcast the new message to everyone in the room
                socket.to(threadId).emit(SocketEventEnum.MESSAGE, message);

                // for each other participant, send push only if they aren't in the room
                for (const otherIdStr of (otherParticipants??[])) {
                    const room = socket.nsp.adapter.rooms.get(otherIdStr);
                    const isOnline = room ? room.size > 0 : false;

                    if (!isOnline) {
                        await new NotificationRepository(socket.data.user)
                            .sendToUser(
                                otherIdStr,
                                NotificationCategoryEnum.CHAT,
                                'New message',
                                text,
                                `/chats/${threadId}`,
                                '',
                                { threadID: id }
                            );
                    }
                }

            } catch (error: any) {
                ServerLogger.error(error);
                socket.emit(SocketEventEnum.ERROR, { message: 'Message send failed' });
            }
        });

        socket.on(SocketEventEnum.START_TYPING, ({ threadId }: { threadId: string }) => {
                console.log(user._id, " started typing in ", threadId)
                socket.to(threadId).emit(SocketEventEnum.START_TYPING, {from: user._id})
            }
        );

        socket.on(SocketEventEnum.STOP_TYPING, ({ threadId }: { threadId: string }) => {
            console.log(user._id, " stopped typing in ", threadId)
            socket.to(threadId).emit(SocketEventEnum.STOP_TYPING, {from: user._id})
            }
        );

        // socket.on('read', async ({ threadId }: { threadId: string }) => {
        //     try {
        //         await chatRepo.markThreadRead(toObjectID(threadId));
        //         socket.to(threadId).emit('read', { from: user._id, threadId });
        //     } catch (err: any) {
        //         ServerLogger.error(err);
        //         socket.emit('error', { message: 'Failed to mark read' });
        //     }
        // });

        [SocketEventEnum.OFFER, SocketEventEnum.ANSWER, SocketEventEnum.ICE_CANDIDATE].forEach(eventName => {
            socket.on(eventName, (data: any & { to: string }) => {
                try {
                    socket.to(data.to).emit(eventName, { ...data, from: user._id });
                } catch (err: any) {
                    ServerLogger.error(err);
                    socket.emit(SocketEventEnum.ERROR, { message: `Failed to forward ${eventName}` });
                }
            });
        });

        // Initial ping
        socket.emit(SocketEventEnum.INIT, { id: socket.id });

        socket.on(SocketEventEnum.DISCONNECT, () => {
            socket.leave(user._id.toString());
            socket.nsp.to(notifyRoom).emit(SocketEventEnum.USER_OFFLINE, { userId: user._id });
        });
    }
}
