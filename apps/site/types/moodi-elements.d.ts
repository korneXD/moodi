import type { DetailedHTMLProps, HTMLAttributes } from "react";

type MoodiElementAttrs = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  shape?: string;
  mood?: string;
  color?: string;
  "face-color"?: string;
  "cheek-color"?: string;
  size?: string | number;
  speed?: string | number;
  "follow-cursor"?: "true" | "false";
  interactive?: "true" | "false";
  shadow?: "true" | "false";
  sound?: "true" | "false";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      /** the npm package's Web Component */
      "moodi-buddy": MoodiElementAttrs;
      /** the same element registered from the esm.sh CDN under another tag (/test) */
      "moodi-cdn": MoodiElementAttrs;
    }
  }
}
