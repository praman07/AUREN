// Worker registration entrypoint
export class WorkerManager {
  start() {
    console.log('[WorkerManager] Started waiting for jobs...');
    // Future: instantiate DocumentProcessingWorker, OCRWorker, etc.
  }
}
