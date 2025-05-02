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
        try {
            console.log("notification.photo", notification)
            const notificationPayload: admin.messaging.NotificationMessagePayload = {
                title: notification.title || "",
                body: notification.body || "",
            };


            const payload = {
                notification: notificationPayload,
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

            const response = await admin.messaging().sendEachForMulticast({ ...payload, tokens: list });
            response.responses.map(each => console.log(each.error, each.success, each.messageId))
            return response;
        }
        catch (error) {
            console.error("Error while dispatching notification", error);
            return { successCount: 0, failureCount: 0, responses: [] } as admin.messaging.BatchResponse;
        }
    }
}
