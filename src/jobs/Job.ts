/**
 * A single asyncronous Job.
 */
export interface Job {
  perform: (data?: Record<string, any>) => Promise<void>;
}
