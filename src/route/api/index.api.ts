import {Router} from "express";
import {serverRunController} from "../server_run.api";
import customerApi from "./v1/user/user.api";
import fileUploadApi from "./v1/tools/file_upload.api";

const apiList: {[key:string]: Router} = {
    '/file': fileUploadApi,
    '/user': customerApi,
};


const initializeV1Api: () => Router = () => {
    const router = Router();
    for(const eachApi in apiList) {
        router.use(eachApi, apiList[eachApi]);
    }

    // Test Route
    router.use("/server-check", serverRunController);

    return router;
};
const v1Api: Router = initializeV1Api();
export default v1Api;
