import { useSpriteContext } from "@/lib/SpriteContext";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { createEffect, createSignal } from "solid-js";
import { useMetadata } from "vike-metadata-solid";
import { navigate } from "vike/client/router";
import SliceSidebar from "./components/SliceSidebar";
import SpriteCanvas from "./components/SpriteCanvas";
import ToolBar from "./components/ToolBar";

export default function EditorPage() {
  useMetadata({});

  return <EditorContent />;
}

function EditorContent() {
  const { state, setImage } = useSpriteContext();
  const [exportLoading, setExportLoading] = createSignal(false);

  // Redirect if no image is loaded
  createEffect(() => {
    if (!state.image && !state.imageUrl) {
      navigate("/");
    }
  });

  const handleExport = async () => {
    if (!state.imageUrl || !state.slices.length) return;

    setExportLoading(true);

    try {
      // Create a temporary canvas to extract slices
      const img = new Image();
      img.src = state.imageUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const zip = new JSZip();

      // Process each slice
      for (const slice of state.slices) {
        // Set canvas size to slice dimensions
        canvas.width = slice.width;
        canvas.height = slice.height;

        // Draw the slice portion onto the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          slice.x,
          slice.y,
          slice.width,
          slice.height,
          0,
          0,
          slice.width,
          slice.height
        );

        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );

        if (blob) {
          // Add to zip
          zip.file(`${slice.name}.png`, blob);
        }
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });

      // Save the zip file
      const filename = state.image?.name
        ? `${state.image.name.split(".")[0]}_slices.zip`
        : "sprite_slices.zip";

      saveAs(content, filename);
    } catch (error) {
      console.error("Export error:", error);
      alert("An error occurred during export. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div class="flex h-screen overflow-hidden bg-gray-100">
      {/* Left sidebar - list of slices */}
      <SliceSidebar />

      {/* Main content area */}
      <div class="flex h-full flex-grow flex-col overflow-hidden">
        {/* Toolbar */}
        <ToolBar onExport={handleExport} exportLoading={exportLoading()} />

        {/* Canvas */}
        <div class="flex-grow overflow-hidden">
          <SpriteCanvas />
        </div>
      </div>
    </div>
  );
}
