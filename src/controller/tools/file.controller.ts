import {Request, Response} from 'express';
import ServerLogger from "@middleware/server_logging.middleware";
import {formatAPI, formatError} from "@utils/format.util";
import {UploadedFile} from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import {getSlugFromLabel} from "@utils/helper";

class FileController {
    constructor() {
    }

    async addFile(req: Request, res: Response) {
        try {
            const dir = `${__dirname}/../../../public/files`;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {recursive: true});
            }
            const uploadFile: UploadedFile = req.files?.file as UploadedFile;
            let {imageTitle} = req.body;
            const currentTimeStamp = Math.floor(Date.now() / 1000); // in seconds
            const ext = uploadFile.name.substring(uploadFile.name.lastIndexOf('.') + 1);
            let fileName = `${getSlugFromLabel(imageTitle)}_${currentTimeStamp}.${ext}`;
            const name = fileName;
            uploadFile.mv(`${__dirname}/../../../public/files/${fileName}`, (err) => {
                if (err) {
                    return res.status(500).json({success: false, err});
                }
                return res.status(200).json({success: true, name});
            });
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error));
        }
    }

    async getFile(req: Request, res: Response) {
        try {
            const directory = `${__dirname}/../../../../public/files`;
            const checkFileAndSend = (fileName: string): boolean => {
                let filePath = path.resolve(`${directory}/${fileName}`);
                if (fs.existsSync(filePath)) {
                    res.sendFile(filePath);
                    return true;
                }
                return false;
            }
            const file = req.params.imageName?.trim();

            const sent = checkFileAndSend(file);
            if (sent) return true;
            return res.status(404).json(formatError('No file found'));

        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error));
        }
    }

    async deleteFile(req: Request, res: Response) {
        try {
            const dir = `${__dirname}/../../../../public/deleted`;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {recursive: true});
            }
            const directory = `${__dirname}/../../../../public/files`;
            const checkFileAndDelete = async (fileName: string): Promise<boolean> => {
                let fromFilePath = path.resolve(`${directory}/${fileName}`);
                const toFilePath = path.resolve(
                    `${__dirname}/../../../../public/deleted/${fileName}`,
                );
                if (fs.existsSync(fromFilePath)) {
                    await fs.renameSync(fromFilePath, toFilePath);
                    res.json(formatAPI('File is deleted'));
                    return true;
                }
                return false;
            }
            const file = req.params.imageName?.trim();
            // @ts-ignore
            const tenantID = req?.user?.tenantID;

            let fileName = file;
            if (tenantID) {
                // check for private file with logged-in user's tenantID
                fileName = `${tenantID}_${fileName}`;
                const sent = await checkFileAndDelete(fileName);
                if (sent) return true;
            } else {
                console.log('file', file);
                const sent = await checkFileAndDelete(file);
                if (sent) return true;
                // else {
                //     const sent = await checkFileAndDelete('no-image-found.jpeg');
                //     if(sent) return;
                // }
            }
            return res.status(404).json(formatError('No file found'));

        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!'));
        }
    }

}

export default FileController;
