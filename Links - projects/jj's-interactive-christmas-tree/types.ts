export enum TreeState {
  COLLAPSED = 'COLLAPSED',
  EXPANDED = 'EXPANDED'
}

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
