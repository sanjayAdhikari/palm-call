import {NextFunction, Request, Response} from "express";
import {formatError} from "../utils";
import {validationResult} from 'express-validator';

const parseValidation: (req: Request, res: Response, next: NextFunction) => void = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const validation = validationResult(req) || [];
    if (!validation.isEmpty()) {
        validation.array().forEach(({msg}: { msg: string }) => errors.push(msg));
        // http 406 is not acceptable error
        res.status(406).json(formatError('Some Fields are required', errors, validation.array()));
        return;
    }
    next();
    return;
};

export default parseValidation;
