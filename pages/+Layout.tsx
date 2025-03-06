import { SpriteProvider } from "@/lib/SpriteContext";
import getTitle from "@/utils/get-title";
import { type FlowProps } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

import "@/styles/app.css";

useMetadata.setGlobalDefaults({
  title: getTitle("Home"),
  description: "Demo showcasing Vike and Solid.",
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
