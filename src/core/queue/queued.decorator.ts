import Queue from 'better-queue';

/**
 * Options cho @Queued() decorator
 */
export interface QueuedOptions {
  /**
   * Số job chạy đồng thời (mặc định: 1)
   */
  concurrency?: number;
  /**
   * Số lần retry khi job fail (mặc định: 0)
   */
  maxRetries?: number;
  /**
   * Thời gian chờ giữa các lần retry - ms (mặc định: 1000)
   */
  retryDelay?: number;
  /**
   * Timeout cho mỗi job - ms (mặc định: không giới hạn)
   */
  timeout?: number;
}

// Store các queue instances theo method
const queueMap = new WeakMap<object, Map<string, Queue<unknown>>>();

/**
 * Decorator để chạy method trong background queue.
 * Method sẽ return undefined ngay lập tức thay vì await kết quả.
 *
 * @example
 * ```typescript
 * // Không config
 * @Queued()
 * async sendEmail(to: string, subject: string) { ... }
 *
 * // Có config
 * @Queued({ concurrency: 2, maxRetries: 3 })
 * async processHeavyTask(data: any) { ... }
 * ```
 */
export function Queued(options: QueuedOptions = {}): MethodDecorator {
  const {
    concurrency = 1,
    maxRetries = 0,
    retryDelay = 1000,
    timeout,
  } = options;

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      return descriptor;
    }

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      // Lấy hoặc tạo queue cho method này
      let methodQueues = queueMap.get(target);
      if (!methodQueues) {
        methodQueues = new Map();
        queueMap.set(target, methodQueues);
      }

      const key = String(propertyKey);
      let queue = methodQueues.get(key);
      if (!queue) {
        // Tạo queue mới cho method này
        queue = new Queue<unknown>(
          async (job: { context: unknown; args: unknown[] }, cb) => {
            let retries = 0;
            const execute = async (): Promise<void> => {
              try {
                await originalMethod.apply(job.context, job.args);
                cb(null, undefined);
              } catch (error) {
                if (retries < maxRetries) {
                  retries++;
                  console.log(
                    `[Queue] Retrying ${key} (${retries}/${maxRetries})...`,
                  );
                  setTimeout(execute, retryDelay);
                } else {
                  console.error(
                    `[Queue] Job ${key} failed after ${retries} retries:`,
                    error,
                  );
                  cb(error as Error, undefined);
                }
              }
            };
            await execute();
          },
          {
            concurrent: concurrency,
            ...(timeout && { maxTimeout: timeout }),
          },
        );

        queue.on('task_failed', (taskId, error) => {
          console.error(`[Queue] Task ${taskId} in ${key} failed:`, error);
        });

        methodQueues.set(key, queue);
      }

      // Push job vào queue và return ngay
      queue.push({ context: this, args });

      // Return undefined ngay lập tức (fire-and-forget)
      return undefined;
    };

    return descriptor;
  };
}
