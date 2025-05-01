import {assertUserInRequest} from '@interface/api.interface';
import {ChatNotificationPayload, CustomerInterface, NotificationCategoryEnum} from '@interface/model';
import ServerLogger from '@middleware/server_logging.middleware';
import {NotificationRepository} from '@repository/index';
import {formatError} from '@utils/index';
import {Request, Response} from 'express';

class NotificationController {
    async sendToUser(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const sender = req.user as CustomerInterface;
            const {
                recipientId,
                category,
                title,
                body,
                link,
                photo,
                payload,
            } = req.body;

            if (!recipientId || !category || !title || !body) {
                return res.status(400).json(
                    formatError('recipientId, category, title and body are required')
                );
            }

            const repo = new NotificationRepository(sender);
            const result = await repo.sendToUser(
                recipientId,
                category as NotificationCategoryEnum,
                title,
                body,
                link || '',
                photo || '',
                payload as ChatNotificationPayload
            );

            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error sending notification', error);
            return res.status(400).json(formatError('Error sending notification'));
        }
    }

    async readAll(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const sender = req.user as CustomerInterface;
            const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : undefined;

            const repo = new NotificationRepository(sender);
            const result = await repo.readAll(page, pageSize);
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error reading notifications', error);
            return res.status(400).json(formatError('Error reading notifications'));
        }
    }

    async readDetail(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const sender = req.user as CustomerInterface;
            const notificationId = req.params.notificationId;
            if (!notificationId) {
                return res.status(400).json(formatError('notificationId is required'));
            }

            const repo = new NotificationRepository(sender);
            const result = await repo.readDetail(notificationId);
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error reading notification detail', error);
            return res.status(400).json(formatError('Error reading notification detail'));
        }
    }

    async deleteNotification(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const sender = req.user as CustomerInterface;
            const notificationId = req.params.notificationId;
            if (!notificationId) {
                return res.status(400).json(formatError('notificationId is required'));
            }

            const repo = new NotificationRepository(sender);
            const result = await repo.delete(notificationId);
            return res.status(result.status).json(result);
        } catch (error) {
            ServerLogger.error('Error deleting notification', error);
            return res.status(400).json(formatError('Error deleting notification'));
        }
    }
}

export default new NotificationController();
