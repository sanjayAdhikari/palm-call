import {ApiInterface} from '@interface/api.interface';
import {JwtPayload} from '@interface/config.interface';
import {SocketEventEnum} from '@interface/generic.enum';
import {
    CustomerInterface,
    MessageInterface,
    NotificationCategoryEnum,
    ThreadInterface,
    UserTypeEnum
} from '@interface/model';
import ServerLogger from '@middleware/server_logging.middleware';
import {ChatRepository, customerRepository, NotificationRepository} from '@repository/index';
import {callSessionService} from "@route/websocket/callSessionService";
import {
    addConsumer,
    addProducer,
    addTransport,
    closeRoom,
    createMediasoupWorker,
    createRoomIfNotExists,
    createWebRtcTransport, getRoom,
    getRouterRtpCapabilities
} from '@route/websocket/mediasoup';
import {toObjectID} from '@utils/db.util';
import JwtSecurity from '@utils/jwt/space_jwt.util';
import {NextFunction} from 'express';
import {Socket} from 'socket.io';

export default class SocketLogic {
    constructor() {
        (async () => {
            await createMediasoupWorker();
        })();
    }

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
            console.error('Error in middlewareImplementation socket', error);
            return next(new Error('Auth error'));
        }
    }

    async joinThread(socket: Socket, user: CustomerInterface, threadId: string) {
        try {
            const id = toObjectID(threadId);
            const chatRepo = new ChatRepository(user);
            const messagesRes = await chatRepo.getMessages(id, 0, 1) as ApiInterface<any>;
            if (!messagesRes.success) {
                socket.emit(SocketEventEnum.ERROR, {message: messagesRes.message});
                return;
            }
            socket.join(threadId);
            console.log(user._id, ' join thread', threadId);
        } catch (err: any) {
            ServerLogger.error(err);
            socket.emit(SocketEventEnum.ERROR, {message: 'Unable to join thread'});
        }
    }

    leaveThread(socket: Socket, user: CustomerInterface, threadId: string) {
        try {
            console.log(user._id, ' left thread', threadId);
            socket.leave(threadId);
        } catch (err: any) {
            ServerLogger.error(err);
            socket.emit(SocketEventEnum.ERROR, {message: 'Unable to leave thread'});
        }
    }

    getNotifyRoom(user: CustomerInterface) {
        return user.userType === UserTypeEnum.USER ? UserTypeEnum.AGENT : UserTypeEnum.USER;
    }

    async getOnlineUsers(socket: Socket, user: CustomerInterface) {
        try {
            const notifyRoom = this.getNotifyRoom(user);
            const roleSockets = await socket.nsp.in(notifyRoom).fetchSockets();
            const userIds = roleSockets.map(s => (s.data.user as CustomerInterface)._id.toString());
            socket.emit(SocketEventEnum.ONLINE_USERS, {role: notifyRoom, userIds});
        } catch (err: any) {
            ServerLogger.error(err);
            socket.emit(SocketEventEnum.ERROR, {message: 'Could not fetch online users'});
        }
    }

    async sendMessage(socket: Socket, user: CustomerInterface, threadId: string, text: string) {
        try {
            const chatRepo = new ChatRepository(user);
            const id = toObjectID(threadId);
            const msgRes: ApiInterface<{
                message: MessageInterface;
                otherParticipants: string[];
                thread: ThreadInterface;
            }> = await chatRepo.createMessage(id, text);

            if (!msgRes.success) {
                socket.emit(SocketEventEnum.ERROR, {message: msgRes.message});
                return;
            }

            const {message, otherParticipants, thread} = msgRes.data || {};
            socket.to(threadId).emit(SocketEventEnum.MESSAGE, message);

            for (const otherIdStr of (otherParticipants ?? [])) {
                const room = socket.nsp.adapter.rooms.get(otherIdStr);
                const isOnline = room ? room.size > 0 : false;
                if (!isOnline) {
                    await new NotificationRepository(socket.data.user)
                        .sendToUser(
                            otherIdStr,
                            NotificationCategoryEnum.CHAT,
                            `Message from ${user.name}`,
                            text,
                            `/chats/${threadId}`,
                            '',
                            {threadID: id}
                        );
                }
            }
        } catch (error: any) {
            ServerLogger.error(error);
            socket.emit(SocketEventEnum.ERROR, {message: 'Message send failed'});
        }
    }

    handleMediaSoup(socket: Socket, user: CustomerInterface, meetingId: string) {
        console.log('meetingID', meetingId);

        socket.on(SocketEventEnum.GET_RTP_CAPABILITIES, async () => {
            try {
                const room = await createRoomIfNotExists(meetingId);
                const rtpCapabilities = room.router.rtpCapabilities;
                socket.emit(SocketEventEnum.GET_RTP_CAPABILITIES, rtpCapabilities);
            } catch (err) {
                console.error("Failed to get RTP capabilities", err);
                socket.emit(SocketEventEnum.ERROR, { message: "Failed to get RTP capabilities" });
            }
        });

        socket.on(SocketEventEnum.CREATE_TRANSPORT, async () => {
            try {
                await createRoomIfNotExists(meetingId);

                const transport = await createWebRtcTransport(meetingId);
                addTransport(meetingId, socket.id, transport);

                (socket.data as any).sendTransport = transport;

                socket.emit(SocketEventEnum.CREATE_TRANSPORT, {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });

                socket.once(SocketEventEnum.CONNECT_TRANSPORT, async ({ dtlsParameters }) => {
                    try {
                        const sendTransport = (socket.data as any).sendTransport;
                        if (!sendTransport) throw new Error("Transport not available");
                        await sendTransport.connect({ dtlsParameters });
                        socket.emit(SocketEventEnum.CONNECT_TRANSPORT);
                    } catch (err) {
                        console.error("Transport connect failed", err);
                        socket.emit(SocketEventEnum.ERROR, { message: "Transport connect failed" });
                    }
                });
            } catch (err) {
                console.error("create-transport failed", err);
                socket.emit(SocketEventEnum.ERROR, { message: "Transport creation failed" });
            }
        });

        socket.on(SocketEventEnum.CREATE_RECV_TRANSPORT, async () => {
            try {
                await createRoomIfNotExists(meetingId);

                const recvTransport = await createWebRtcTransport(meetingId);
                addTransport(meetingId, socket.id, recvTransport);
                (socket.data as any).recvTransport = recvTransport;

                socket.emit(SocketEventEnum.CREATE_RECV_TRANSPORT, {
                    id: recvTransport.id,
                    iceParameters: recvTransport.iceParameters,
                    iceCandidates: recvTransport.iceCandidates,
                    dtlsParameters: recvTransport.dtlsParameters,
                });

                socket.once(SocketEventEnum.CONNECT_RECV_TRANSPORT, async ({ dtlsParameters }) => {
                    try {
                        const recvTransport = (socket.data as any).recvTransport;
                        if (!recvTransport) throw new Error("Recv transport not available");

                        // ✅ Prevent reconnecting an already connected transport
                        if (recvTransport.connectionState === "connected") {
                            console.log("🔁 Recv transport already connected.");
                            socket.emit(SocketEventEnum.CONNECT_RECV_TRANSPORT);
                            return;
                        }

                        await recvTransport.connect({ dtlsParameters });
                        console.log("✅ Recv transport successfully connected.");
                        socket.emit(SocketEventEnum.CONNECT_RECV_TRANSPORT);
                    } catch (err) {
                        console.error("Recv transport connect failed", err);
                        socket.emit(SocketEventEnum.ERROR, { message: "Recv transport connect failed" });
                    }
                });

            } catch (err) {
                console.error("create-recv-transport failed", err);
                socket.emit(SocketEventEnum.ERROR, { message: "Recv transport creation failed" });
            }
        });

        socket.on(SocketEventEnum.PRODUCE, async ({ kind, rtpParameters }) => {
            try {
                console.log("PRODUCE")
                const transport = (socket.data as any).sendTransport;
                if (!transport) throw new Error("Send transport not initialized");

                const producer = await transport.produce({ kind, rtpParameters });
                producer.enableTraceEvent(['rtp']);
                producer.on('trace', (trace) => {
                    if (trace.type === 'rtp') {
                        console.log(`📡 [Producer ${producer.id}] RTP packet sent at`, trace.timestamp);
                    }
                });

                addProducer(meetingId, socket.id, producer);
                socket.emit(SocketEventEnum.PRODUCE, { id: producer.id });
            } catch (err) {
                console.error("Error in produce", err);
                socket.emit(SocketEventEnum.ERROR, { message: "Producing media failed" });
            }
        });

        socket.on(SocketEventEnum.CONSUME, async ({ rtpCapabilities }) => {
            try {
                const room = await createRoomIfNotExists(meetingId);
                const router = room.router;
                const consumerTransport = (socket.data as any).recvTransport;
                if (!consumerTransport) throw new Error("Recv transport not available");

                const otherProducers = Array.from(room.producers.entries()).filter(([id]) => id !== socket.id);
                for (const [producerId, producer] of otherProducers) {
                    if (router.canConsume({ producerId: producer.id, rtpCapabilities })) {
                        const consumer = await consumerTransport.consume({
                            producerId: producer.id,
                            rtpCapabilities,
                            paused: false,
                        });
                        addConsumer(meetingId, socket.id, consumer);
                        console.log("Consumed", producer.id)
                        socket.emit(SocketEventEnum.CONSUME, {
                            id: consumer.id,
                            producerId: producer.id,
                            kind: consumer.kind,
                            rtpParameters: consumer.rtpParameters,
                        });
                    }
                }
            } catch (err) {
                console.error("Error in consume", err);
                socket.emit(SocketEventEnum.ERROR, { message: "Consuming media failed" });
            }
        });
    }

    async handleConnection(socket: Socket) {
        try {
            const user = socket.data.user as CustomerInterface;
            const roleRoom = user.userType;
            const notifyRoom = this.getNotifyRoom(user);
            const meetingId = "global-room-abc123" || (socket.handshake.query.meetingId as string);
            // const roomName = `room:${meetingId}`;
            const roomName = `global-room-abc123`;

            // Join rooms
            socket.join(roomName);
            socket.join(roleRoom);
            socket.join(user._id.toString());

            socket.nsp.to(notifyRoom).emit(SocketEventEnum.USER_ONLINE, {userId: user._id});
            console.log(`✅ ${user.name} joined ${roomName} as ${user.userType}`);

            this.handleMediaSoup(socket, user, meetingId);

            socket.on(SocketEventEnum.JOIN_THREAD, ({threadId}) => {
                this.joinThread(socket, user, threadId);

                const activeCall = callSessionService.getSession(threadId);
                if (activeCall) {
                    callSessionService.joinCall(threadId, user._id.toString());
                    socket.emit('call:active', {
                        threadId: activeCall.threadId,
                        callType: activeCall.callType,
                        initiatorId: activeCall.initiatorId,
                    });
                }
            });

            socket.on("call:end", ({ meetingID }) => {
                console.log('call:end-> meetingID', meetingID)

                const userId = socket.data.user._id.toString();
                const session = callSessionService.getSession(meetingID);

                if (!session || !session.participants.has(userId)) {
                    console.log(`[call:end] Skipped duplicate leave for user ${userId}`);
                    return;
                }

                socket.to(meetingID).emit("call:end");

                callSessionService.leaveCall(meetingID, userId);

                const updatedSession = callSessionService.getSession(meetingID);
                if (!updatedSession || updatedSession.participants.size === 0) {
                    console.log(`🧹 Last user left. Closing room ${meetingID}`);
                    closeRoom(meetingID);
                    callSessionService.endCall(meetingID);
                }
            });

            socket.on(SocketEventEnum.LEAVE_THREAD, ({threadId}) => {
                this.leaveThread(socket, user, threadId);
            });

            socket.on(SocketEventEnum.GET_ONLINE_USERS, () => {
                this.getOnlineUsers(socket, user);
            });

            socket.on(SocketEventEnum.MESSAGE, ({threadId, text}) => {
                this.sendMessage(socket, user, threadId, text);
            });

            socket.on(SocketEventEnum.START_TYPING, ({threadId}) => {
                socket.to(threadId).emit(SocketEventEnum.START_TYPING, {from: user._id});
            });

            socket.on(SocketEventEnum.STOP_TYPING, ({threadId}) => {
                socket.to(threadId).emit(SocketEventEnum.STOP_TYPING, {from: user._id});
            });

            // Signaling: call forwarding
            // [SocketEventEnum.OFFER, SocketEventEnum.ANSWER, SocketEventEnum.ICE_CANDIDATE, SocketEventEnum.END].forEach(eventName => {
            //     socket.on(eventName, (data: any & { to: string }) => {
            //         try {
            //             socket.to(data.to).emit(eventName, {...data, from: user});
            //         } catch (err: any) {
            //             ServerLogger.error(err);
            //             socket.emit(SocketEventEnum.ERROR, {message: `Failed to forward ${eventName}`});
            //         }
            //     });
            // });

            socket.on(SocketEventEnum.OFFER, ({to, offer, type, threadId}) => {
                try {
                    callSessionService.startCall(threadId, user._id.toString(), type);
                    socket.to(to).emit(SocketEventEnum.OFFER, {offer, type, from: user});
                } catch (err) {
                    ServerLogger.error(err);
                    socket.emit(SocketEventEnum.ERROR, {message: "Failed to send offer"});
                }
            });

            socket.on(SocketEventEnum.ANSWER, ({to, answer}) => {
                try {
                    socket.to(to).emit(SocketEventEnum.ANSWER, {answer, from: user});
                } catch (err) {
                    ServerLogger.error(err);
                    socket.emit(SocketEventEnum.ERROR, {message: "Failed to send answer"});
                }
            });

            socket.on(SocketEventEnum.ICE_CANDIDATE, ({to, candidate}) => {
                try {
                    socket.to(to).emit(SocketEventEnum.ICE_CANDIDATE, {candidate, from: user});
                } catch (err) {
                    ServerLogger.error(err);
                    socket.emit(SocketEventEnum.ERROR, {message: "Failed to send ICE candidate"});
                }
            });

            socket.on(SocketEventEnum.END, ({threadId}) => {
                try {
                    callSessionService.endCall(threadId);
                    socket.to(threadId).emit(SocketEventEnum.END, {from: user});
                } catch (err) {
                    ServerLogger.error(err);
                    socket.emit(SocketEventEnum.ERROR, {message: "Failed to end call"});
                }
            });

            // Push-to-talk
            socket.on(SocketEventEnum.PUSH_TO_TALK, ({enabled}: { enabled: boolean }) => {
                socket.to(roomName).emit(SocketEventEnum.USER_SPEAKING, {
                    socketId: socket.id,
                    userId: user._id,
                    isSpeaking: enabled,
                });
            });

            socket.emit(SocketEventEnum.INIT, {id: socket.id});

            socket.on(SocketEventEnum.DISCONNECT, () => {
                socket.leave(user._id.toString());
                socket.leave(notifyRoom);
                socket.leave(roomName);
                socket.nsp.to(notifyRoom).emit(SocketEventEnum.USER_OFFLINE, {userId: user._id});
                for (const session of callSessionService['sessions'].values()) {
                    if (session.participants.has(user._id.toString())) {
                        callSessionService.leaveCall(session.threadId, user._id.toString());
                    }
                }
                closeRoom(meetingId);
            });
        } catch (error: any) {
            console.error('Error at socket handleConnection', error);
        }
    }

}
