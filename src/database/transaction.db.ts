import {ClientSession, Model} from "mongoose";
import {AppConstant} from "../config/constant";
import {debugLog} from "../utils/debug.util";

class Transaction {
    private session: ClientSession | undefined;

    async startTransaction(ModelName: Model<any>) {
        debugLog('startTransaction called')
        if (AppConstant.dbSupportTransaction) {
            if (!this.session) {
                this.session = await ModelName?.startSession();
                this.session?.startTransaction();
            }
            return {session: this.session}
        }
        return {};

    }

    async commitTransaction(): Promise<boolean> {
        debugLog('commitTransaction called')
        if (AppConstant.dbSupportTransaction && this.session) {
            await this.session.commitTransaction();
            await this.session.endSession();
            this.session = undefined;
            return true;
        }
        return false;

    }

    async abortTransaction(): Promise<boolean> {
        debugLog('abortTransaction called')
        if (AppConstant.dbSupportTransaction && this.session) {
            await this.session.abortTransaction();
            await this.session.endSession();
            this.session = undefined;
            return true;
        }
        return false;
    }
}

export default Transaction;
