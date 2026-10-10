import type { Metadata } from "next";
import { Lab } from "./lab";

export const metadata: Metadata = { title: "Lab", robots: { index: false } };

export default function LabPage() {
  return <Lab />;
}
