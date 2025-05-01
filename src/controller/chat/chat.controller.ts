import {CustomerInterface} from "@interface/model";
import { Request, Response } from 'express';
import { assertUserInRequest } from '@interface/api.interface';
import { formatError } from '@utils/index';
import ServerLogger from '@middleware/server_logging.middleware';
import { ChatRepository } from '@repository/index';
import { toObjectID } from '@utils/db.util';

class ChatController {
    async getThread(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const participantId = req.query.participant?.toString();
            if (!participantId) {
                return res.status(400).json(formatError('participant is required'));
            }
            const repo = new ChatRepository(req.user as CustomerInterface);
            const result = await repo.getThread(toObjectID(participantId));
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error fetching thread', error);
            return res.status(400).json(formatError('Error fetching thread'));
        }
    }

    async listThreads(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : undefined;
            const repo = new ChatRepository(req.user as CustomerInterface);
            const result = await repo.listThreads(page, pageSize);
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error listing threads', error);
            return res.status(400).json(formatError('Error listing threads'));
        }
    }

    async deleteThread(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const threadId = req.params.threadId;
            if (!threadId) {
                return res.status(400).json(formatError('threadId is required'));
            }
            const repo = new ChatRepository(req.user as CustomerInterface);
            const result = await repo.deleteThread(toObjectID(threadId));
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error deleting thread', error);
            return res.status(400).json(formatError('Error deleting thread'));
        }
    }

    async createMessage(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const { threadId, text } = req.body;
            if (!threadId || !text) {
                return res.status(400).json(formatError('threadId and text are required'));
            }
            const repo = new ChatRepository(req.user as CustomerInterface);
            const result = await repo.createMessage(toObjectID(threadId), text);
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error creating message', error);
            return res.status(400).json(formatError('Error creating message'));
        }
    }

    async getMessages(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const threadId = req.query.threadId?.toString();
            const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : undefined;
            if (!threadId) {
                return res.status(400).json(formatError('threadId is required'));
            }
            const repo = new ChatRepository(req.user as CustomerInterface);
            const result = await repo.getMessages(toObjectID(threadId), page, pageSize);
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error fetching messages', error);
            return res.status(400).json(formatError('Error fetching messages'));
        }
    }

    async markThreadRead(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const threadId = req.body.threadId;
            if (!threadId) {
                return res.status(400).json(formatError('threadId is required'));
            }
            const repo = new ChatRepository(req.user as CustomerInterface);
            const result = await repo.markThreadRead(toObjectID(threadId));
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error marking thread read', error);
            return res.status(400).json(formatError('Error marking thread read'));
        }
    }
}

export default new ChatController;
