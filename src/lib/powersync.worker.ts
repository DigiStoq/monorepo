// @ts-expect-error Worker types are not automatically resolved
import { PowerSyncDBWorker } from "@powersync/web/worker";

const worker = new PowerSyncDBWorker();
worker.init();
