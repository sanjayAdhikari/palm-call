import {Request, Response} from "express";

export function serverRunController(req: Request, res: Response) {
    console.log('server is running ')
    res.send('perfect');
}
