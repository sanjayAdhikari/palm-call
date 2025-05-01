import {CustomerInterface} from "@interface/model";
import ServerLogger from "@middleware/server_logging.middleware";
import {getSlugFromLabel} from "@utils/helper";
import {formatAPI, formatError} from "@utils/index";
import crypto from 'crypto';
import {Request, Response} from 'express';
import {UploadedFile} from 'express-fileupload';
import fs from 'fs';
import path from 'path';



// FIXME: Future: Load upload and deleted directory from environment, with fallback
const uploadDir = path.resolve(__dirname, '../../../public/files')
const deletedDir = path.resolve(__dirname, '../../../public/deleted')

const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_LIMIT = 5; // 5 files at once, per image 10 MB

function toBytes(mbData: number) {
    return Math.floor(mbData / (1024 * 1024))
}

class FileController {
    constructor() {
    }

    private async addFileToStorage(file: UploadedFile, userId: string | null, imageTitle: string = "untitled"): Promise<string> {
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File too large. Max ${toBytes(MAX_FILE_SIZE)} allowed.`);
        }

        const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
        if (!allowedExts.includes(ext)) {
            throw new Error('Invalid file type.');
        }

        const randomId = crypto.randomUUID();
        const currentTimeStamp = Date.now();
        const baseFileName = `${getSlugFromLabel(imageTitle)}_${currentTimeStamp}_${randomId}`;
        const fileName = userId ? `${userId}_${baseFileName}.${ext}` : `${baseFileName}.${ext}`;

        const destination = path.join(uploadDir, fileName);

        await file.mv(destination);

        return fileName;
    }


    async addFile(req: Request, res: Response) {
        try {
            if (!req.files?.file) {
                return res.status(400).json(formatError('No file uploaded'));
            }

            const uploadFile = req.files.file as UploadedFile;
            const userId = (req.user as CustomerInterface)?._id ? String((req.user as CustomerInterface)?._id) : null;
            const {imageTitle = "untitled"} = req.body;

            const fileName = await this.addFileToStorage(uploadFile, userId, imageTitle);

            return res.status(200).json({success: true, name: fileName});
        } catch (error: any) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error.message || error));
        }
    }

    async addFiles(req: Request, res: Response) {
        try {
            if (!req.files?.file) {
                return res.status(400).json(formatError('No files uploaded'));
            }

            const uploadedFiles = req.files.file;
            const filesArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
            if (filesArray.length > MAX_FILE_LIMIT) {
                return res.status(400).json(formatError(`You cannot upload more than ${MAX_FILE_LIMIT} files at once.`));
            }
            const userId = (req.user as CustomerInterface)?._id ? String((req.user as CustomerInterface)?._id) : null;
            const {imageTitle = "untitled"} = req.body;

            const savedFiles: string[] = [];
            const errors: any[] = [];

            for (const file of filesArray) {
                try {
                    const fileName = await this.addFileToStorage(file, userId, imageTitle);
                    savedFiles.push(fileName);
                } catch (err: any) {
                    ServerLogger.error(err);
                    errors.push({file: file.name, error: err.message || 'Failed to upload'});
                }
            }

            if (savedFiles.length === 0) {
                return res.status(400).json(formatError('No files uploaded successfully', errors));
            }

            return res.status(200).json({
                success: true,
                uploaded: savedFiles,
                errors: errors.length > 0 ? errors : undefined
            });

        } catch (error: any) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error.message || error));
        }
    }


    async getFile(req: Request, res: Response) {
        try {
            const fileName = req.params.imageName?.trim();
            if (!fileName) {
                return res.status(400).json(formatError('No filename provided'));
            }

            const filePath = path.resolve(uploadDir, fileName);

            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }

            return res.status(404).json(formatError('No file found', null, {}, 404));
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!', error));
        }
    }

    async deleteFile(req: Request, res: Response) {
        try {
            const fileName = req.params.imageName?.trim();
            if (!fileName) {
                return res.status(400).json(formatError('No filename provided'));
            }

            const fromFilePath = path.resolve(uploadDir, fileName);
            const toFilePath = path.resolve(deletedDir, fileName);

            if (!fs.existsSync(deletedDir)) {
                fs.mkdirSync(deletedDir, {recursive: true});
            }

            if (fs.existsSync(fromFilePath)) {
                fs.renameSync(fromFilePath, toFilePath);
                return res.status(200).json(formatAPI('File is deleted'));
            }

            return res.status(404).json(formatError('No file found'));
        } catch (error) {
            ServerLogger.error(error);
            console.error(error);
            return res.status(400).json(formatError('Something went wrong!'));
        }
    }
}

export default new FileController();
