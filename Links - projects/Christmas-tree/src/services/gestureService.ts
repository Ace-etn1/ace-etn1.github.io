
// @ts-ignore
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";

let handLandmarker: any = undefined;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

export const initializeHandLandmarker = async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numHands: 1
    });
    return true;
  } catch (e) {
    console.error("Error initializing hand landmarker:", e);
    return false;
  }
};

export const detectGesture = (video: HTMLVideoElement): { isOpen: boolean, isDetected: boolean } => {
  if (!handLandmarker) return { isOpen: false, isDetected: false };

  let startTimeMs = performance.now();
  // Safe check to prevent crash if video is not ready
  if (video.readyState < 2) return { isOpen: false, isDetected: false };

  const results = handLandmarker.detectForVideo(video, startTimeMs);

  if (results.landmarks && results.landmarks.length > 0) {
    const landmarks = results.landmarks[0];
    
    // Simple heuristic: Compare finger tips to wrist distance vs knuckle to wrist distance
    // Wrist is index 0
    // Finger tips: 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
    // Knuckles (MCP): 1 (Thumb), 5 (Index), 9 (Middle), 13 (Ring), 17 (Pinky)

    const wrist = landmarks[0];
    
    // Helper to calc distance 3D
    const dist = (p1: any, p2: any) => Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
    );

    const checkFinger = (tipIdx: number, mcpIdx: number) => {
      const tipDist = dist(landmarks[tipIdx], wrist);
      const mcpDist = dist(landmarks[mcpIdx], wrist);
      // If tip is significantly further than knuckle, it's open
      return tipDist > mcpDist * 1.5; // Threshold
    };

    let openFingers = 0;
    // Thumb (4) vs CMC (2) - roughly
    if (checkFinger(4, 2)) openFingers++; 
    if (checkFinger(8, 5)) openFingers++;
    if (checkFinger(12, 9)) openFingers++;
    if (checkFinger(16, 13)) openFingers++;
    if (checkFinger(20, 17)) openFingers++;

    // If 4 or 5 fingers are open, we consider it an Open Palm
    const isOpen = openFingers >= 4;
    
    return { isOpen, isDetected: true };
  }

  return { isOpen: false, isDetected: false };
};
