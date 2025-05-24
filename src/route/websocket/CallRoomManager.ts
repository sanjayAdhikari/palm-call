import type {Consumer, Producer, Router, WebRtcTransport} from 'mediasoup/node/lib/types';


interface CallRoom {
    router: Router;
    producers: Map<string, Producer>; // socketId => producer
    consumers: Map<string, Consumer>; // socketId => consumer
    transports: Map<string, WebRtcTransport>; // socketId => transport
}

class CallRoomManager {
    private rooms: Map<string, CallRoom> = new Map();

    createRoom(meetingId: string, router: Router): void {
        if (!this.rooms.has(meetingId)) {
            this.rooms.set(meetingId, {
                router,
                producers: new Map(),
                consumers: new Map(),
                transports: new Map(),
            });
        }
    }

    getRoom(meetingId: string): CallRoom | undefined {
        return this.rooms.get(meetingId);
    }

    addProducer(meetingId: string, socketId: string, producer: Producer): void {
        const room = this.rooms.get(meetingId);
        if (room) room.producers.set(socketId, producer);
    }

    addConsumer(meetingId: string, socketId: string, consumer: Consumer): void {
        const room = this.rooms.get(meetingId);
        if (room) room.consumers.set(socketId, consumer);
    }

    addTransport(meetingId: string, socketId: string, transport: WebRtcTransport): void {
        const room = this.rooms.get(meetingId);
        if (room) room.transports.set(socketId, transport);
    }

    getRouter(meetingId: string): Router | undefined {
        return this.rooms.get(meetingId)?.router;
    }

    getProducer(meetingId: string, socketId: string): Producer | undefined {
        return this.rooms.get(meetingId)?.producers.get(socketId);
    }

    getTransport(meetingId: string, socketId: string): WebRtcTransport | undefined {
        return this.rooms.get(meetingId)?.transports.get(socketId);
    }

    closeRoom(meetingId: string): void {
        const room = this.rooms.get(meetingId);
        if (room) {
            room.transports.forEach(t => t.close());
            room.producers.forEach(p => p.close());
            room.consumers.forEach(c => c.close());
            this.rooms.delete(meetingId);
        }
    }

    removeSocket(meetingId: string, socketId: string): void {
        const room = this.rooms.get(meetingId);
        if (!room) return;

        room.transports.get(socketId)?.close();
        room.producers.get(socketId)?.close();
        room.consumers.get(socketId)?.close();

        room.transports.delete(socketId);
        room.producers.delete(socketId);
        room.consumers.delete(socketId);

        // Auto-clean empty room
        if (
            room.transports.size === 0 &&
            room.producers.size === 0 &&
            room.consumers.size === 0
        ) {
            this.rooms.delete(meetingId);
        }
    }
}

export const callRoomManager = new CallRoomManager();
