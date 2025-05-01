import admin from 'firebase-admin';
import serviceAccount from '@config/firebase-adminsdk.json';
import { NotificationInterface } from '@interface/model';

/**
 * Generic FCM service to send push notifications.
 * Accepts a NotificationInterface and optional tokens. If tokens are provided,
 * sends to device(s). Otherwise publishes to 'all' topic.
 */
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount  as unknown as admin.ServiceAccount),
    });
}

export default class FCMService {
    static async send(
        notification: NotificationInterface,
        tokens?: string | string[]
    ): Promise<admin.messaging.BatchResponse | string> {
        const payload = {
            notification: {
                title: notification.title,
                body: notification.body,
                imageUrl: notification.photo,
            },
            data: {
                link: notification.link,
                photo: notification.photo || '',
                category: notification.category,
                payload: JSON.stringify(notification.payload),
            },
        };

        if (tokens === undefined) {
            return admin.messaging().send({ ...payload, topic: 'all' });
        }

        const list = Array.isArray(tokens) ? tokens : [tokens];
        if (!list.length) {
            return { successCount: 0, failureCount: 0, responses: [] } as admin.messaging.BatchResponse;
        }

        if (list.length === 1) {
            return admin.messaging().send({ ...payload, token: list[0] }).then(id => ({
                successCount: 1,
                failureCount: 0,
                responses: [{ success: true, messageId: id }],
            } as admin.messaging.BatchResponse));
        }

        return admin.messaging().sendEachForMulticast({ ...payload, tokens: list });
    }
}
