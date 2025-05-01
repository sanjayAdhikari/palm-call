import chatApi from "@route/api/v1/chat/chat.api";
import notificationApi from "@route/api/v1/tools/notification.api";
import {Router} from "express";
import {serverRunController} from "../server_run.api";
import customerApi from "./v1/user/user.api";

const apiList: { [key: string]: Router } = {
    '/user': customerApi,
    '/notification': notificationApi,
    '/chat': chatApi,
};


const initializeV1Api: () => Router = () => {
    const router = Router();
    for (const eachApi in apiList) {
        router.use(eachApi, apiList[eachApi]);
    }

    // Test Route
    router.use("/server-check", serverRunController);

    return router;
};
const v1Api: Router = initializeV1Api();
export default v1Api;
