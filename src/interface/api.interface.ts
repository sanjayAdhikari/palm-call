import {Request} from 'express';
import {CustomerInterface} from "./model";

export interface ApiInterface<Type = any> {
    success: boolean,
    status: number,
    data?: Type,
    message?: string,
    payload?: any
}

export type apiFormat = <Type = any>(message?: string, data?: Type, payload?: any, status?: number) => ApiInterface<Type>

export type RequestWithCustomer =
    Request
    & { user: CustomerInterface };


export function assertUserInRequest(req: Request): asserts req is RequestWithCustomer {
    if (!("user" in req)) {
        throw new Error("Request object without customer found unexpectedly");
    }
}
