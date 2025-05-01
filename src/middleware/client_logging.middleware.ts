// this is client side logging
import path from 'path';
import getLoggingInstance from "../utils/logging.util";

const logDirectory = path.join(__dirname, '../../', 'server_log');

// logger object with above defined options
const ClientLogger = getLoggingInstance(logDirectory);

export default ClientLogger;
