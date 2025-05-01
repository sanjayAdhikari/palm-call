// // this is server side logging
import path from 'path';
import 'winston-daily-rotate-file';
import getLoggingInstance from "../utils/logging.util";

const logDirectory = path.join(__dirname, '../../', 'server_log');

// logger object with above defined options
const ServerLogger = getLoggingInstance(logDirectory);


export default ServerLogger;
