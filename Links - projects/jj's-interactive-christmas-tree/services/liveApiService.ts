import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { TreeState } from '../types';
import { GEMINI_MODEL } from '../constants';

const API_KEY = process.env.API_KEY as string;

const setTreeStateTool: FunctionDeclaration = {
  name: 'setTreeState',
  parameters: {
    type: Type.OBJECT,
    description: 'Sets the state of the Christmas tree animation based on the user\'s hand gesture.',
    properties: {
      state: {
        type: Type.STRING,
        enum: ['OPEN', 'CLOSED'],
        description: 'OPEN if the user shows an OPEN PALM. CLOSED if the user shows a CLOSED FIST or NO HAND.',
      },
    },
    required: ['state'],
  },
};

export class LiveApiService {
  private ai: GoogleGenAI;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private onStateChange: (state: TreeState) => void;
  private onStatusChange: (connected: boolean, error: string | null) => void;
  private videoInterval: any = null;
  
  // Debouncing logic
  private recentStates: string[] = [];
  private readonly DEBOUNCE_THRESHOLD = 2; // Require 2 consecutive CLOSED to collapse, but 1 OPEN to expand

  constructor(
    onStateChange: (state: TreeState) => void,
    onStatusChange: (connected: boolean, error: string | null) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
    this.onStateChange = onStateChange;
    this.onStatusChange = onStatusChange;
  }

  async connect(videoElement: HTMLVideoElement) {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const config = {
        model: GEMINI_MODEL,
        config: {
          // CRITICAL: Must be TEXT to allow Tool Calling. 
          // Temperature 0 makes detection robotic and consistent.
          responseModalities: [Modality.TEXT], 
          temperature: 0,
          topP: 0.1,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `
            You are a high-speed Video Frame Classifier.
            
            INPUT:
            You will receive a stream of video frames.
            
            TASK:
            For EVERY SINGLE FRAME, you MUST output a tool call to \`setTreeState\`.
            
            CLASSIFICATION RULES:
            1. **OPEN**: If you see an OPEN HAND (fingers extended, palm visible) -> Call setTreeState('OPEN').
            2. **CLOSED**: If you see a FIST, a RELAXED HAND, or NO HAND -> Call setTreeState('CLOSED').
            
            CRITICAL RULES:
            - Do NOT output any text/chat.
            - Do NOT wait.
            - You MUST call the function for every image.
            - If unsure, default to 'CLOSED'.
          `,
          tools: [{ functionDeclarations: [setTreeStateTool] }],
        },
      };

      const sessionPromise = this.ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            this.onStatusChange(true, null);
            this.startVideoStreaming(videoElement, sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message, sessionPromise);
          },
          onclose: () => {
            console.log("Gemini Live Session Closed");
            this.onStatusChange(false, null);
            this.stopVideoStreaming();
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Live Error", e);
            this.onStatusChange(false, "Connection error");
            this.stopVideoStreaming();
          },
        }
      });

      this.session = await sessionPromise;

    } catch (error: any) {
      console.error("Failed to connect:", error);
      this.onStatusChange(false, error.message || "Failed to connect");
    }
  }

  private handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    // We only care about tool calls
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'setTreeState') {
            const rawState = fc.args['state'] as string;
            
            // --- Debouncing Logic ---
            // 1. Push new state
            this.recentStates.push(rawState);
            if (this.recentStates.length > this.DEBOUNCE_THRESHOLD) {
                this.recentStates.shift();
            }

            // 2. Determine effective state
            let effectiveState = TreeState.COLLAPSED;

            // Rule: If ANY recent state is OPEN, be OPEN (responsive expansion)
            // Rule: To be CLOSED, ALL recent states must be CLOSED (stable collapse)
            const hasOpenSignal = this.recentStates.includes('OPEN');

            if (hasOpenSignal) {
                effectiveState = TreeState.EXPANDED;
            } else {
                effectiveState = TreeState.COLLAPSED;
            }
            
            this.onStateChange(effectiveState);

            // 3. Send response back to keep the loop alive
            sessionPromise.then((session) => {
                session.sendToolResponse({
                    functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "ok" }
                    }
                });
            });
        }
      }
    }
  }

  private startVideoStreaming(videoEl: HTMLVideoElement, sessionPromise: Promise<any>) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure video is playing
    videoEl.play().catch(e => console.error("Video play failed", e));

    const FPS = 5; 
    
    this.videoInterval = setInterval(async () => {
      if (!this.session) return;
      if (videoEl.readyState < 2 || videoEl.videoWidth === 0) return;

      // Scale to ensure Gemini can see the gesture clearly (512px is ideal for Flash)
      const targetWidth = 512;
      const scale = targetWidth / videoEl.videoWidth;
      
      canvas.width = videoEl.videoWidth * scale;
      canvas.height = videoEl.videoHeight * scale;
      
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      sessionPromise.then(session => {
          session.sendRealtimeInput({
              media: {
                  mimeType: 'image/jpeg',
                  data: base64
              }
          });
      }).catch(e => {
          console.error("Failed to send frame", e);
          this.stopVideoStreaming();
      });
    }, 1000 / FPS);
  }

  private stopVideoStreaming() {
      if (this.videoInterval) {
          clearInterval(this.videoInterval);
          this.videoInterval = null;
      }
      this.recentStates = [];
  }

  disconnect() {
    this.stopVideoStreaming();
    if (this.session) {
      try {
        // @ts-ignore
        if (typeof this.session.close === 'function') this.session.close();
      } catch (e) {
        // ignore
      }
      this.session = null;
    }
    if (this.inputAudioContext) {
        this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    this.onStatusChange(false, null);
  }
}