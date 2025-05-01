import {Router} from "express";
import RouteURL from "@config/route_url.config";
import {authentication} from "@middleware/access.middleware";
import {fileController} from "@controller/index";

const initializeFileUploadApi: () => Router = () => {
    const router = Router();
    router
        .post(RouteURL.file.upload,
            authentication,
            fileController.addFile.bind(fileController))
        .get(RouteURL.file.detail,
            fileController.getFile.bind(fileController))
        .delete(RouteURL.file.delete,
            authentication,
            fileController.deleteFile.bind(fileController));
    return router;
}

const fileUploadApi = initializeFileUploadApi();

export default fileUploadApi;

