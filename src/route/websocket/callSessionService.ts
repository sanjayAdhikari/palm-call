interface CallSession {
    threadId: string;
    callType: 'audio' | 'video';
    initiatorId: string;
    participants: Set<string>;
    startedAt: number;
}

export class CallSessionService {
    private sessions: Map<string, CallSession> = new Map();

    startCall(threadId: string, initiatorId: string, callType: 'audio' | 'video') {
        this.sessions.set(threadId, {
            threadId,
            callType,
            initiatorId,
            participants: new Set([initiatorId]),
            startedAt: Date.now(),
        });
    }

    joinCall(threadId: string, userId: string) {
        const session = this.sessions.get(threadId);
        if (session) session.participants.add(userId);
    }

    leaveCall(threadId: string, userId: string) {
        const session = this.sessions.get(threadId);
        if (session) {
            session.participants.delete(userId);
            if (session.participants.size === 0) this.sessions.delete(threadId);
        }
    }

    getSession(threadId: string): CallSession | undefined {
        return this.sessions.get(threadId);
    }

    endCall(threadId: string) {
        this.sessions.delete(threadId);
    }
}

export const callSessionService = new CallSessionService();
