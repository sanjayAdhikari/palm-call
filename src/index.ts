import cluster, {Worker} from 'cluster';
import os from 'os';
import {debugLog} from './utils/debug.util';
import startServer from './app';

const enableCluster = process.argv.includes('--with-cluster');

if (enableCluster && cluster.isPrimary) {
    // getting maximum number of cpu for parallelism
    const cores = os.cpus().length;

    debugLog(`Total cores: ${cores}`);
    debugLog(`Primary process ${process.pid} is running`);

    for (let i = 0; i < cores; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker: Worker, code) => {
        debugLog(`Worker ${worker.process.pid} exited with code ${code}`);
        debugLog('Fork new worker!');
        cluster.fork();
    });
} else {
    // IIFE
    (() => startServer())()
}


