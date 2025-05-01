/* eslint-disable no-console */
import ServerLogger from "../middleware/server_logging.middleware";
import config from "../config";
import environmentVariable from "../config/custom-environment-variables";
import mongoose from 'mongoose';

function getDbConnection(): string {
    const HOST: string = config(environmentVariable.MONGODB_HOST);
    const DB: string = config(environmentVariable.MONGODB_DB);
    // const PARAM = config(environmentVariable.MONGODB_PARAMS);
    // let url = `${HOST}/${DB}`;
    // if (PARAM) {
    //     url += `?${PARAM}`
    // }
    return HOST.replace('MONGODB_DB', DB);
}
 export const connectDB = async () => {
     try {
         const systemDbUrl = getDbConnection();

         // mongoose.set('useNewUrlParser', true);
         // mongoose.set("useUnifiedTopology", true);
         return mongoose
             .connect(systemDbUrl, {
                 connectTimeoutMS: 5000
                 // useNewUrlParser: true,
                 // useUnifiedTopology: true,
             });
    } catch (error) {
        console.error(error);
    }
};
// .then(() => console.info('connected to database.'))
// .catch((error) => logger.error(error));

export const closeDB = () => mongoose.connection
    .close()
    .then(() => console.info('Connection Disconnected'))
    .catch((error: Error) => ServerLogger.error(error));

mongoose.connection.on('connected', () => {
    console.log('Mongo has connected successfully');
});
mongoose.connection.on('reconnected', () => {
    console.log('Mongo has reconnected');
});
mongoose.connection.on('error', async (error: Error) => {
    console.log('Mongo connection has an error', error);
    await mongoose.disconnect();
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongo connection is disconnected');
});
