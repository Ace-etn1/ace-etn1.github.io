export const TreeState = {
  COLLAPSED: 'COLLAPSED',
  EXPANDED: 'EXPANDED'
} as const;

export type TreeState = typeof TreeState[keyof typeof TreeState];

export interface VisionState {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  detectedState: TreeState;
}

// Gemini Live API Types (Simplified for internal usage)
export interface ToolCall {
  functionCalls: {
    id: string;
    name: string;
    args: Record<string, any>;
  }[];
}
