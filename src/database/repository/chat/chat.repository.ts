import ErrorStringConstant from '@config/error_string.config';
import {ApiInterface} from '@interface/api.interface';
import {ChatStatusEnum, CustomerInterface, MessageInterface, ThreadInterface,} from '@interface/model';
import ServerLogger from '@middleware/server_logging.middleware';
import {MessageModel, ThreadModel} from '@model/index';
import {paginateModel, toObjectID} from '@utils/db.util';
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
                    unreadCount: [],

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

    async createMessage(
        threadId: ThreadInterface['_id'],
        text: string
    ): Promise<ApiInterface<{ message: MessageInterface; otherParticipants: string[]; thread: ThreadInterface }>> {
        try {
            // Validate thread and participation
            const thread = await ThreadModel.findOne({
                _id: threadId,
                participants: this.user._id,
                isDeleted: false,
            }).lean<ThreadInterface>();
            if (!thread) return formatError('Thread not found or access denied');

            // Persist message
            const msgDoc = await MessageModel.create({
                thread: threadId,
                sender: this.user._id,
                message: text,
                createdAt: new Date(),
            });
            const message = msgDoc.toObject() as MessageInterface;

            // Determine other participants
            const otherParticipants = thread.participants
                .filter(p => !p.equals(this.user._id))
                .map(p => p.toString());

            // Update thread metadata
            await ThreadModel.updateOne({ _id: threadId }, {
                lastMessage: message._id,
                lastMessageAt: message.createdAt,
            });

            // Increment unreadCount for each other participant
            for (const otherIdStr of otherParticipants) {
                const otherId = toObjectID(otherIdStr);
                const incResult = await ThreadModel.updateOne(
                    { _id: threadId, 'unreadCount.customer': otherId },
                    { $inc: { 'unreadCount.$.count': 1 } }
                );
                if (incResult.modifiedCount === 0) {
                    // No existing entry, push new
                    await ThreadModel.updateOne(
                        { _id: threadId },
                        { $push: { unreadCount: { customer: otherId, count: 1 } } }
                    );
                }
            }

            return formatAPI('', { message, otherParticipants, thread });
        } catch (err: any) {
            return formatError(err.message);
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

            // update count
            await ThreadModel.updateOne(
                { _id: threadId, 'unreadCount.customer': this.user._id },
                { $set: { 'unreadCount.$.count': 0 } }
            );

            return formatAPI('', result);
        } catch (err: any) {
            ServerLogger.error(err);
            return formatError(ErrorStringConstant.UNKNOWN_ERROR);
        }
    }

    async markThreadRead(
        threadId: ThreadInterface['_id']
    ): Promise<ApiInterface<null>> {
        try {
            await MessageModel.updateMany(
                { thread: threadId, sender: { $ne: this.user._id } },
                { hasRead: true }
            );
            // reset unread count for current user
            await ThreadModel.updateOne(
                { _id: threadId, 'unreadCount.customer': this.user._id },
                { $set: { 'unreadCount.$.count': 0 } }
            );
            return formatAPI('', null);
        } catch (err: any) {
            return formatError(err.message);
        }
    }
}
