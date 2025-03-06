import { useSpriteContext } from "@/lib/SpriteContext";
import getTitle from "@/utils/get-title";
import { createDropzone } from "@soorria/solid-dropzone";
import { createSignal, Show } from "solid-js";
import { useMetadata } from "vike-metadata-solid";
import { navigate } from "vike/client/router";

export default function Page() {
  useMetadata({
    title: getTitle("Sprite Atlas Slicer"),
  });

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">Sprite Atlas Slicer</h1>
      <p class="text-gray-600 mb-8 max-w-xl text-center">
        Upload your sprite atlas image to slice it into individual sprites. You can slice manually
        or automatically using grid or pixel dimensions.
      </p>
      <UploadZone />
    </div>
  );
}

function UploadZone() {
  const { setImage } = useSpriteContext();
  const [dragActive, setDragActive] = createSignal(false);
  const [fileError, setFileError] = createSignal("");

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = createDropzone({
    onDrop,
    accept: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    multiple: false,
  });

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload a valid image file");
      return;
    }

    setFileError("");
    setImage(file);

    // Use timeout to ensure state is updated before navigation
    setTimeout(() => {
      navigate("/editor");
    }, 100);
  };

  return (
    <div class="w-full max-w-2xl">
      <div
        {...getRootProps()}
        class={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
        }`}
      >
        <input {...getInputProps()} />
        <div class="flex flex-col items-center justify-center space-y-4">
          <div class="p-4 bg-blue-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p class="text-lg font-medium text-gray-700">Drag and drop your sprite atlas here</p>
            <p class="text-sm text-gray-500 mt-1">or click to browse your files</p>
          </div>
          <p class="text-xs text-gray-400">Supported formats: PNG, JPG, GIF, WEBP</p>
        </div>
      </div>

      <Show when={fileError()}>
        <p class="text-red-500 text-center mt-2">{fileError()}</p>
      </Show>

      <div class="mt-6">
        <p class="text-sm text-gray-500 mb-2">Or upload from your computer:</p>
        <div class="flex items-center justify-center">
          <label
            for="file-upload"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
          >
            Select Image File
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              class="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
