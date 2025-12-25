export type ProgressStage =
  | 'data_collection'
  | 'signal_generation'
  | 'category_merge'
  | 'final_synthesis';

export interface ProgressUpdate {
  stage: ProgressStage;
  progress: number; // 0-100
  message: string;
  currentTask?: string;
  details?: {
    current?: number;
    total?: number;
    categoryId?: string;
    signalId?: string;
  };
}

export type ProgressCallback = (update: ProgressUpdate) => void;

export class ProgressTracker {
  private totalSignals: number;
  private totalCategories: number;
  private completedSignals = 0;
  private completedCategories = 0;
  private callback: ProgressCallback;

  constructor(totalSignals: number, totalCategories: number, callback: ProgressCallback) {
    this.totalSignals = totalSignals;
    this.totalCategories = totalCategories;
    this.callback = callback;
  }

  /**
   * Emit data collection progress
   */
  emitDataCollection(message: string) {
    this.callback({
      stage: 'data_collection',
      progress: 10,
      message,
      currentTask: message,
    });
  }

  /**
   * Emit signal generation start
   */
  emitSignalStart(categoryId: string, signalId: string, signalName: string) {
    this.callback({
      stage: 'signal_generation',
      progress: 20 + Math.floor((this.completedSignals / this.totalSignals) * 50),
      message: `Analyzing: ${signalName}`,
      currentTask: signalName,
      details: {
        current: this.completedSignals + 1,
        total: this.totalSignals,
        categoryId,
        signalId,
      },
    });
  }

  /**
   * Emit signal generation complete
   */
  emitSignalComplete(categoryId: string, signalId: string) {
    this.completedSignals++;
    this.callback({
      stage: 'signal_generation',
      progress: 20 + Math.floor((this.completedSignals / this.totalSignals) * 50),
      message: `Completed ${this.completedSignals}/${this.totalSignals} signals`,
      details: {
        current: this.completedSignals,
        total: this.totalSignals,
        categoryId,
        signalId,
      },
    });
  }

  /**
   * Emit category merge start
   */
  emitCategoryStart(categoryId: string, categoryName: string) {
    this.callback({
      stage: 'category_merge',
      progress: 70 + Math.floor((this.completedCategories / this.totalCategories) * 20),
      message: `Merging category: ${categoryName}`,
      currentTask: categoryName,
      details: {
        current: this.completedCategories + 1,
        total: this.totalCategories,
        categoryId,
      },
    });
  }

  /**
   * Emit category merge complete
   */
  emitCategoryComplete(categoryId: string) {
    this.completedCategories++;
    this.callback({
      stage: 'category_merge',
      progress: 70 + Math.floor((this.completedCategories / this.totalCategories) * 20),
      message: `Completed ${this.completedCategories}/${this.totalCategories} categories`,
      details: {
        current: this.completedCategories,
        total: this.totalCategories,
        categoryId,
      },
    });
  }

  /**
   * Emit final synthesis progress
   */
  emitFinalSynthesis(message: string, progress: number) {
    this.callback({
      stage: 'final_synthesis',
      progress: 90 + progress,
      message,
      currentTask: message,
    });
  }

  /**
   * Get current progress percentage
   */
  getCurrentProgress(): number {
    if (this.completedSignals < this.totalSignals) {
      return 20 + Math.floor((this.completedSignals / this.totalSignals) * 50);
    }
    if (this.completedCategories < this.totalCategories) {
      return 70 + Math.floor((this.completedCategories / this.totalCategories) * 20);
    }
    return 90;
  }
}
