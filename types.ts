
export interface ProductDetails {
  name: string;
  description: string;
}

export interface GeneratedPrompts {
  imagePrompt: string;
  videoPrompt: string;
}

export interface MediaResults {
  imageUrl?: string;
  videoUrl?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_PROMPTS = 'GENERATING_PROMPTS',
  PROMPTS_READY = 'PROMPTS_READY',
  GENERATING_MEDIA = 'GENERATING_MEDIA',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

declare global {
  /**
   * The AIStudio interface is expected by the environment for API key management.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * aistudio is typically a read-only property provided by the platform context.
     * We use the 'readonly' modifier and 'AIStudio' type to match the expected global declaration.
     */
    readonly aistudio: AIStudio;
  }
}
