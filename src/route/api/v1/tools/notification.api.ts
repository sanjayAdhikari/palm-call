import RouteURL from "@config/route_url.config";
import {notificationController} from "@controller/index";
import {authentication} from "@middleware/access.middleware";
import parseValidation from "@middleware/parseValidation.middleware";
import {idValidParam} from "@service/validation/validator.index";
import {Router} from "express";
import {query} from "express-validator";

export const initializeNotificationApi = (): Router => {
    const router = Router();

    // List and mark all as read
    router.get(
        RouteURL.notification.read_all,
        authentication,
        [
            query('page').optional().isInt({min: 1}),
            query('pageSize').optional().isInt({min: 1}),
        ],
        parseValidation,
        notificationController.readAll.bind(notificationController)
    );

    // Read detail
    router.get(
        RouteURL.notification.read_detail,
        authentication,
        idValidParam('notificationID', 'notification'),
        parseValidation,
        notificationController.readDetail.bind(notificationController)
    );

    // Delete notification
    router.delete(
        RouteURL.notification.delete,
        authentication,
        idValidParam('notificationID', 'notification'),
        parseValidation,
        notificationController.deleteNotification.bind(notificationController)
    );

    return router;
};

const notificationApi = initializeNotificationApi();

export default notificationApi;

