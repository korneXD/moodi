import type { Metadata } from "next";
import { Moodi } from "moodi/react";

export const metadata: Metadata = { title: "Icon", robots: { index: false } };

/** 256×256 transparent source for app/icon.png and app/apple-icon.png. */
export default function IconCard() {
  return (
    <>
      <style>{`html,body{background:transparent!important}`}</style>
      <div className="size-[256px] overflow-hidden">
        <Moodi size={320} faceColor="#fff6ee" style={{ margin: "-44px 0 0 -32px" }} followCursor={false} interactive={false} shadow={false} speed={0} />
      </div>
    </>
  );
}
