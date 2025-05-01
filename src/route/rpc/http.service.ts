import ServerLogger from "../../middleware/server_logging.middleware";
import axios from "axios";
import {formatError} from "../../utils";


export const getApiCall = async (url: string, headers: any = {}) => {
    try {
        const response = await axios.get(url,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            });
        return response?.data;
    } catch (error: any) {
        console.error('error?.response', error?.response);
        ServerLogger.error(error);
        // console.error(error);
        return formatError('Unable to process.');
    }
};

