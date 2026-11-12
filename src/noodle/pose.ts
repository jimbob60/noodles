import type { Face } from "./face";
import type { Expression } from "../ui/photoMode";

/** Sets a face for a photo: a happy grin, a wide-eyed "wow", sleepy shut eyes, or as it is. */
export function pose(face: Face, expression: Expression): void {
  if (expression === "normal") return;
  face.droop = 0;
  if (expression === "happy") {
    // Big grin, happy "^ ^" eyes.
    face.mouthShape = "smile";
    face.asleep = false;
    face.pleading = false;
    face.blink = 1;
  } else if (expression === "wow") {
    // Wide shiny eyes and a grin.
    face.mouthShape = "smile";
    face.asleep = false;
    face.pleading = true;
    face.blink = 0;
  } else {
    // Sleepy: eyes shut, a little smile.
    face.mouthShape = "w";
    face.asleep = true;
    face.pleading = false;
    face.blink = 1;
  }
}
