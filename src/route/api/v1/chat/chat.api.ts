import RouteURL from "@config/route_url.config";
import {chatController} from "@controller/index";
import {authentication} from "@middleware/access.middleware";
import parseValidation from "@middleware/parseValidation.middleware";
import {idValidParam} from "@service/validation/validator.index";
import {Router} from "express";
import {query} from "express-validator";

export const initializeChatApi = (): Router => {
    const router = Router();

    router
        .get(
            RouteURL.chat.read_thread,
            authentication,
            chatController.getThread.bind(chatController)
        )
        .get(
            RouteURL.chat.threads,
            authentication,
            [
                query('page').optional().isInt({min: 1}),
                query('pageSize').optional().isInt({min: 1}),
            ],
            parseValidation,
            chatController.listThreads.bind(chatController)
        )
        .delete(
            RouteURL.chat.delete_thread,
            authentication,
            idValidParam('threadID', 'thread'),
            parseValidation,
            chatController.deleteThread.bind(chatController)
        )
        .post(
            RouteURL.chat.messages,
            authentication,
            [
                idValidParam('threadID', 'thread'),
                query('page').optional().isInt({min: 1}),
                query('pageSize').optional().isInt({min: 1}),
            ],
            parseValidation,
            chatController.getMessages.bind(chatController)
        )
        .post(
            RouteURL.chat.messages,
            authentication,
            chatController.createMessage.bind(chatController)
        );

    return router;
};

const chatApi = initializeChatApi();

export default chatApi;

