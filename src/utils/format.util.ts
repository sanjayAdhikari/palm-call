import {apiFormat} from "../interface/api.interface";

export const formatError: apiFormat = (message = 'Something went wrong', data: any = null, payload: any = {}, status: number = 400) => ({
    success: false,
    status: status,
    data,
    message,
    payload,
});

export const formatNotFound: apiFormat = (message = 'Something went wrong', data: any = null, payload: any = {}) => formatError(message, data, payload, 404);

export const formatAPI: apiFormat = (message: string = '', data: any = null, payload: any = {}, status: number = 200) => ({
    success: true,
    data,
    status: status,
    message,
    payload,
});

export const formatRepoError: apiFormat = formatError;
