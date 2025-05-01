import {FilterQuery, PaginateResult} from "mongoose";
import {
    CustomerInterface,
    NotificationDocumentInterface,
    NotificationInterface,
    RoleInterface
} from "../../../interface/model";
import {ApiInterface} from "../../../interface/api.interface";
import {NotificationModel} from "../../model";
import {paginateModel} from "../../../utils/db.util";
import {formatAPI, formatError} from "../../../utils";
import ServerLogger from "../../../middleware/server_logging.middleware";
import ErrorStringConstant from "../../../config/error_string.config";
import {ActiveStatusEnum} from "../../../interface/repository.interface";

class NotificationRepository {
    private user!: CustomerInterface<RoleInterface>;

    private constructor() {
    }

    static async init(user?: CustomerInterface<RoleInterface>): Promise<NotificationRepository> {
        const instance: NotificationRepository = new NotificationRepository();
        if (user) {
            instance.user = user;
        }
        return instance;
    }


    async readAllNotificationCustomer(page?: number, pageSize?: number): Promise<ApiInterface<PaginateResult<NotificationInterface>>> {
        try {

            const notificationFilter: FilterQuery<NotificationInterface> = {
                isDeleted: false,
                broadcastToLaunch: false,
                user: this.user._id,
                validUntil: {$gt: new Date()}
            }
            const itemDetail: PaginateResult<NotificationInterface> = await paginateModel<NotificationInterface>(NotificationModel, notificationFilter, 'title body link photo category createdAt hasRead', [], false, page, pageSize, false)
            await NotificationModel.updateMany({
                ...notificationFilter,
                hasRead: false,
            }, {$set: {hasRead: true}})
            return formatAPI('', itemDetail);
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    async readNotificationDetail(itemID: NotificationInterface["_id"]): Promise<ApiInterface<NotificationInterface>> {
        try {
            const notificationFilter: FilterQuery<NotificationInterface> = {
                _id: itemID,
                isDeleted: false,
                user: this.user._id,
            }

            const itemDetail: NotificationDocumentInterface | null = await NotificationModel.findOne(notificationFilter, 'createdAt title body link photo category');
            if (!itemDetail) return formatError(ErrorStringConstant.NO_ITEMS_FOUND);
            itemDetail.hasRead = true;
            itemDetail.save().then();
            return formatAPI('', itemDetail?.toObject());
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    async deleteNotification(itemID: NotificationInterface['_id']): Promise<ApiInterface<boolean>> {
        try {
            if (!itemID) return formatError(ErrorStringConstant.REQUIRED('Notification ID'))

            const filter: any = {
                isDeleted: false,
                user: this.user._id,
                _id: itemID,
            };

            const existedItem: NotificationDocumentInterface | null = await NotificationModel.findOne(filter);
            if (!existedItem) return formatError('No Notification is found.');
            existedItem.isDeleted = true;
            const deletedData = await existedItem.save();
            if (deletedData) {
                return formatAPI(ErrorStringConstant.SUCCESS_DELETE('Notification'), true);
            }
            return formatError(ErrorStringConstant.UNABLE_TO_REMOVE)

        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return formatError(ErrorStringConstant.UNABLE_TO_REMOVE);
        }
    }

    async markNotificationReadUnread(itemID: NotificationInterface['_id'], toggleStatus: ActiveStatusEnum): Promise<ApiInterface<boolean>> {
        try {

            const filter: FilterQuery<NotificationInterface> = {
                isDeleted: false,
                _id: itemID,
                user: this.user._id
            };

            const existedItem: NotificationDocumentInterface | null = await NotificationModel.findOne(filter, 'hasRead');
            if (!existedItem) return formatError('No notification is found.');
            existedItem.hasRead = toggleStatus === ActiveStatusEnum.on;
            const updatedData = await existedItem.save();
            if (updatedData) {
                return formatAPI(`Notification is successfully marked as ${toggleStatus === ActiveStatusEnum.on ? 'read' : 'unread'}`, true);
            }
            return formatError('Cannot change read status of the notification.')

        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return formatError('Error while changing the read status.');
        }
    }

}

export default NotificationRepository;
