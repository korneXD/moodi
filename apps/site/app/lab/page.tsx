import type { Metadata } from "next";
import { Lab } from "./lab";

export const metadata: Metadata = { title: "moodi lab", robots: { index: false } };

export default function LabPage() {
  return <Lab />;
}
