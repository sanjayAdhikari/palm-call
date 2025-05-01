import ErrorStringConstant from '@config/error_string.config';
import {ApiInterface} from '@interface/api.interface';
import {ChatStatusEnum, CustomerInterface, MessageInterface, ThreadInterface,} from '@interface/model';
import ServerLogger from '@middleware/server_logging.middleware';
import {MessageModel, ThreadModel} from '@model/index';
import {paginateModel} from '@utils/db.util';
import {formatAPI, formatError} from '@utils/index';
import {FilterQuery, PaginateResult} from 'mongoose';

export default class ChatRepository {
    private user: CustomerInterface;

    constructor(user: CustomerInterface) {
        this.user = user;
    }

    async getThread(
        participant: CustomerInterface['_id']
    ): Promise<ApiInterface<ThreadInterface>> {
        try {
            const me = this.user._id;
            const filter: FilterQuery<ThreadInterface> = {
                participants: {$all: [me, participant]},
                isDeleted: false,
            };
            let thread: ThreadInterface | null = await ThreadModel.findOne(filter).lean();
            if (!thread) {
                const created = await ThreadModel.create({
                    participants: [me, participant],
                    status: ChatStatusEnum.OPEN,
                    isDeleted: false,
                });
                thread = created.toObject() as ThreadInterface;
            }
            return formatAPI('', thread);
        } catch (err: any) {
            ServerLogger.error(err);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    async listThreads(
        page?: number,
        pageSize?: number
    ): Promise<ApiInterface<PaginateResult<ThreadInterface>>> {
        try {
            const filter: FilterQuery<ThreadInterface> = {
                participants: this.user._id,
                isDeleted: false,
            };
            const result = await paginateModel<ThreadInterface>(
                ThreadModel,
                filter,
                'participants status lastMessage lastMessageAt',
                ['lastMessage'],
                false,
                page,
                pageSize
            );
            return formatAPI('', result);
        } catch (err: any) {
            ServerLogger.error(err);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    async deleteThread(
        threadId: ThreadInterface['_id']
    ): Promise<ApiInterface<null>> {
        try {
            const filter: FilterQuery<ThreadInterface> = {
                _id: threadId,
                participants: this.user._id,
                isDeleted: false,
            };
            const res = await ThreadModel.updateOne(filter, {isDeleted: true});
            if (!res.modifiedCount) {
                return formatError('Thread not found or access denied');
            }
            return formatAPI('', null);
        } catch (err: any) {
            ServerLogger.error(err);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    async getMessages(
        threadId: ThreadInterface['_id'],
        page?: number,
        pageSize?: number
    ): Promise<ApiInterface<PaginateResult<MessageInterface>>> {
        try {
            const thread = await ThreadModel.findOne({
                _id: threadId,
                participants: this.user._id,
                isDeleted: false,
            }).lean();
            if (!thread) {
                return formatError('Thread not found or access denied');
            }

            const filter: FilterQuery<MessageInterface> = {thread: threadId};
            const result = await paginateModel<MessageInterface>(
                MessageModel,
                filter,
                'createdAt sender message attachments systemGenerated hasRead',
                [],
                false,
                page,
                pageSize
            );
            return formatAPI('', result);
        } catch (err: any) {
            ServerLogger.error(err);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }
}
