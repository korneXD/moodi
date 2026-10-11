import type { Metadata } from "next";
import { Moodi } from "moodi/react";

export const metadata: Metadata = { title: "Icon", robots: { index: false } };

/** 256×256 transparent source for app/icon.png and app/apple-icon.png. */
export default function IconCard() {
  return (
    <>
      <style>{`html,body{background:transparent!important}`}</style>
      <div className="size-[256px] overflow-hidden">
        <Moodi
          mood="happy"
          faceColor="#121014"
          cheekColor="#ff3b4e"
          settle={1}
          size={320}
          style={{ margin: "-44px 0 0 -32px" }}
          followCursor={false}
          interactive={false}
          shadow={false}
          loading="eager"
        />
      </div>
    </>
  );
}
