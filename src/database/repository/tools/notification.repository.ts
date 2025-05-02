import FCMService from "@service/firebase/fcm.service";
import { FilterQuery, PaginateResult } from 'mongoose';
import { NotificationModel, CustomerModel } from '@model/index';
import {
    NotificationInterface,
    NotificationCategoryEnum,
    CustomerInterface,
    ChatNotificationPayload
} from '@interface/model';
import { ApiInterface } from '@interface/api.interface';
import { formatAPI, formatError } from '@utils/index';
import { paginateModel, toObjectID } from '@utils/db.util';
import ErrorStringConstant from '@config/error_string.config';
import ServerLogger from '@middleware/server_logging.middleware';

export class NotificationRepository {
    private sender: CustomerInterface;

    constructor(sender: CustomerInterface) {
        this.sender = sender;
    }

    /**
     * Send notification to a specific user
     */
    async sendToUser(
        recipientId: string,
        category: NotificationCategoryEnum,
        title: string,
        body: string,
        link = '',
        photo = '',
        payload?: ChatNotificationPayload
    ): Promise<ApiInterface<NotificationInterface>> {
        try {
            const recipient = toObjectID(recipientId);
            const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const doc = await NotificationModel.create({
                user: recipient,
                validUntil,
                title,
                body,
                link,
                photo,
                category,
                hasRead: false,
                payload: payload as any,
            });

            const userDoc = await CustomerModel.findById(recipient).select('fcmToken').lean();
            const tokens = (userDoc?.fcmToken || []).map(t => t.token);
            const fcmResponse = await FCMService.send(doc.toObject(), tokens.length ? tokens : undefined);
            return formatAPI('', doc.toObject());
        } catch (err: any) {
            ServerLogger.error(err);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    /**
     * List all notifications for the current user, mark fetched as read
     */
    async readAll(
        page?: number,
        pageSize?: number
    ): Promise<ApiInterface<PaginateResult<NotificationInterface>>> {
        try {
            const filter: FilterQuery<NotificationInterface> = {
                user: toObjectID(this.sender._id),
                isDeleted: false,
                validUntil: { $gt: new Date() },
            };

            const result = await paginateModel<NotificationInterface>(
                NotificationModel,
                filter,
                'title body link photo category createdAt hasRead payload',
                [],
                false,
                page,
                pageSize,
                false
            );

            await NotificationModel.updateMany(
                { ...filter, hasRead: false },
                { $set: { hasRead: true } }
            );

            return formatAPI('', result);
        } catch (error: any) {
            ServerLogger.error(error);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    /**
     * Read a single notification detail, mark as read if unread
     */
    async readDetail(
        notificationId: string
    ): Promise<ApiInterface<NotificationInterface>> {
        try {
            const filter: FilterQuery<NotificationInterface> = {
                _id: toObjectID(notificationId),
                user: toObjectID(this.sender._id),
                isDeleted: false,
            };

            const doc = await NotificationModel.findOne(filter)
                .select('createdAt title body link photo category payload hasRead')
                .lean();
            if (!doc) return formatError(ErrorStringConstant.NO_ITEMS_FOUND);

            if (!doc.hasRead) {
                await NotificationModel.updateOne(filter, { $set: { hasRead: true } });
            }

            return formatAPI('', doc);
        } catch (error: any) {
            ServerLogger.error(error);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    /**
     * Soft-delete a notification
     */
    async delete(
        notificationId: string
    ): Promise<ApiInterface<boolean>> {
        try {
            if (!notificationId) return formatError(ErrorStringConstant.REQUIRED('Notification ID'));

            const filter: FilterQuery<NotificationInterface> = {
                _id: toObjectID(notificationId),
                user: toObjectID(this.sender._id),
                isDeleted: false,
            };

            const doc = await NotificationModel.findOne(filter);
            if (!doc) return formatError('Notification not found');

            doc.isDeleted = true;
            await doc.save();
            return formatAPI('', true);
        } catch (error: any) {
            ServerLogger.error(error);
            return formatError(ErrorStringConstant.UNABLE_TO_REMOVE);
        }
    }
}

export default NotificationRepository;