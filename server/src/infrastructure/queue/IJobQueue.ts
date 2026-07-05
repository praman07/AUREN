export interface IJobQueue<T> {
  add(name: string, payload: T, options?: any): Promise<void>;
}
