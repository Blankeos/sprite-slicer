import { SpriteProvider } from "@/lib/SpriteContext";
import getTitle from "@/utils/get-title";
import { type FlowProps } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

import "@/styles/app.css";
import "tippy.js/animations/shift-away-subtle.css";
import "tippy.js/dist/tippy.css";

useMetadata.setGlobalDefaults({
  title: getTitle("Home"),
  description:
    "A visual tool for slicing sprite atlas and tileset images into individual sprites. Upload an image and extract sprites automatically or manually for game development and pixel art projects.",
  authors: {
    name: "Carlo Taleon",
  },
  applicationName: "Sprite Slicer",
  otherJSX: () => (
    <>
      <link rel="icon" href="/logo.png" />
      {/* <link rel="apple-touch-icon" href="/logo.png" /> */}
    </>
  ),
});

export default function RootLayout(props: FlowProps) {
  return (
    <>
      <SpriteProvider>
        <div>{props.children}</div>
      </SpriteProvider>
    </>
  );
}
