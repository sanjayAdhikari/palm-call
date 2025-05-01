import config from "../config";
import CustomEnvironmentVariables from "../config/custom-environment-variables";

export function debugLog(...args: any[]): void {
    if (config(CustomEnvironmentVariables.NODE_ENV) !== 'production') {
        console.log(...args);
    }
}
