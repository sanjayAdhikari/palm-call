import {CustomerInterface, NotificationInterface} from "@interface/model";
import {PaginateResult} from "mongoose";
import {NotificationRepository} from "@database/repository";
import ServerLogger from "@middleware/server_logging.middleware";
import {Request, Response} from 'express';
import {ApiInterface, assertUserInRequest} from "@interface/api.interface";
import {formatError} from "@utils/index";
import ErrorStringConstant from "@config/error_string.config";
import {checkIfValidObjectID, dbEnum, toObjectID} from "@utils/db.util";
import {ActiveStatusEnum} from "@interface/repository.interface";

class NotificationController {
    // private readonly service: NotificationService;

    constructor() {
    }

    async readAllNotificationFan(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {page, pageSize} = req.query;
            const data: ApiInterface<PaginateResult<NotificationInterface>> = await (await this.getRepo(req.user))
                .readAllNotificationCustomer(
                    page ? parseInt(page.toString()) : undefined,
                    pageSize ? parseInt(pageSize.toString()) : undefined,
                );
            return res.status(data.success ? 200 : 400).json(data);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError(ErrorStringConstant.UNKNOWN_ERROR, error));
        }
    }

    async deleteNotification(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {notification} = req.params;
            const data: ApiInterface<boolean> = await (await this.getRepo(req.user))
                .deleteNotification(toObjectID(notification));
            return res.status(data.success ? 200 : 400).json(data);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError(ErrorStringConstant.UNKNOWN_ERROR, error));
        }
    }

    async readNotificationDetail(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {notification} = req.params;
            const data: ApiInterface<NotificationInterface | null> = await (await this.getRepo(req.user)).readNotificationDetail(
                toObjectID(notification),
            );
            return res.status(data?.success ? 200 : 400).json(data);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError(ErrorStringConstant.UNKNOWN_ERROR, error));
        }
    }

    async markNotificationReadUnread(req: Request, res: Response) {
        try {
            assertUserInRequest(req);
            const {toggleStatus, notification} = req.params;

            if (!dbEnum(ActiveStatusEnum).includes(toggleStatus)) {
                return res.status(400).json('Invalid status');
            }
            if (!checkIfValidObjectID(notification)) {
                return res.status(400).json(formatError(ErrorStringConstant.INVALID_OBJECT_ID('notification')));
            }
            const response: ApiInterface<boolean> = await (await this.getRepo(req.user)).markNotificationReadUnread(
                toObjectID(notification), toggleStatus?.toString() as ActiveStatusEnum
            );
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError(ErrorStringConstant.UNKNOWN_ERROR, error));
        }
    }

    private async getRepo(user: CustomerInterface): Promise<NotificationRepository> {
        return NotificationRepository.init(user);
    }

}

export default NotificationController;
