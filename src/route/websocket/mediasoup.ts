import {createWorker} from "mediasoup";
import type {Consumer, Producer, Router, WebRtcTransport, Worker} from 'mediasoup/node/lib/types';

interface RoomData {
    router: Router;
    transports: Map<string, WebRtcTransport>;
    producers: Map<string, Producer>;
    consumers: Map<string, Consumer[]>;
}


const mediasoupConfig = {
    listenIps: [{ ip: '0.0.0.0', announcedIp: '143.110.247.247' }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
};

const rooms = new Map<string, RoomData>();

export function getRoom(roomId: string): RoomData | undefined {
    return rooms.get(roomId);
}

let worker: Worker;

export async function createMediasoupWorker() {
    worker = await createWorker();
    console.log("✅ Mediasoup worker created");
}

export async function createRoomIfNotExists(roomId: string): Promise<RoomData> {
    if (rooms.has(roomId)) return rooms.get(roomId)!;
    const router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: "audio",
                mimeType: "audio/opus",
                clockRate: 48000,
                channels: 2,
            },
        ],
    });

    const roomData: RoomData = {
        router,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
    };

    rooms.set(roomId, roomData);
    console.log(`🚪 Room created: ${roomId}`);
    return roomData;
}

export async function createWebRtcTransport(roomId: string): Promise<WebRtcTransport> {
    const room = rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    const transport = await room.router.createWebRtcTransport({
        listenIps: mediasoupConfig.listenIps,
        enableUdp: mediasoupConfig.enableUdp,
        enableTcp: mediasoupConfig.enableTcp,
        preferUdp: mediasoupConfig.preferUdp,
        initialAvailableOutgoingBitrate: 1000000,
    });

    return transport;
}

export function getRouterRtpCapabilities(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) throw new Error("Room not found");
    return room.router.rtpCapabilities;
}

export function addTransport(roomId: string, socketId: string, transport: WebRtcTransport) {
    rooms.get(roomId)?.transports.set(socketId, transport);
}

export function addProducer(roomId: string, socketId: string, producer: Producer) {
    rooms.get(roomId)?.producers.set(socketId, producer);
}

export function addConsumer(roomId: string, socketId: string, consumer: Consumer) {
    if (!rooms.get(roomId)?.consumers.has(socketId)) {
        rooms.get(roomId)?.consumers.set(socketId, []);
    }
    rooms.get(roomId)?.consumers.get(socketId)!.push(consumer);
}

export function closeRoom(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.transports.forEach(t => t.close());
    room.producers.forEach(p => p.close());
    room.consumers.forEach(cs => cs.forEach(c => c.close()));
    room.router.close();
    rooms.delete(roomId);
    console.log(`🧹 Room cleaned: ${roomId}`);
}

export function removeSocket(roomId: string, socketId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.transports.get(socketId)?.close();
    room.producers.get(socketId)?.close();
    room.consumers.get(socketId)?.forEach(c => c.close());

    room.transports.delete(socketId);
    room.producers.delete(socketId);
    room.consumers.delete(socketId);

    if (
        room.transports.size === 0 &&
        room.producers.size === 0 &&
        room.consumers.size === 0
    ) {
        closeRoom(roomId);
    }
}
