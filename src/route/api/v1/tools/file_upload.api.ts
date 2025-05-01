import {Router} from "express";
import RouteURL from "../../../../config/route_url.config";
import {authentication} from "../../../../middleware/access.middleware";
import {FileController} from "../../../../controller";

const initializeFileUploadApi: () => Router = () => {
    const router = Router();
    const fileController: FileController = new FileController();
    router
        .post(RouteURL.space.file.upload,
            authentication,
            fileController.addFile.bind(fileController))
        .get(RouteURL.space.file.detail,
            fileController.getFile.bind(fileController))
        .delete(RouteURL.space.file.delete,
            authentication,
            fileController.deleteFile.bind(fileController));
    return router;
}

const fileUploadApi = initializeFileUploadApi();

export default fileUploadApi;

