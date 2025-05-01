import {Application} from "express";
import v1Api from "./api/index.api";


const routes = (app: Application) => {
    app.use('/api/v1', v1Api);
};

export default routes;
