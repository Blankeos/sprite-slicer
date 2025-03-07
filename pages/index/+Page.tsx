import { useSpriteContext } from "@/lib/SpriteContext";
import { createDropzone } from "@soorria/solid-dropzone";
import { createSignal, Show } from "solid-js";
import { useMetadata } from "vike-metadata-solid";
import { navigate } from "vike/client/router";

export default function Page() {
  useMetadata({});

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-yellow-100 p-4">
      <h1 class="mb-8 rotate-1 transform border-4 border-black bg-pink-300 px-6 py-3 text-5xl font-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        Sprite Atlas Slicer
      </h1>
      <p class="mb-8 max-w-xl -rotate-1 transform border-4 border-black bg-cyan-200 p-4 text-center font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        Upload your sprite atlas image to slice it into individual sprites. You can slice manually
        or automatically using grid or pixel dimensions.
      </p>
      <UploadZone />
    </div>
  );
}

function UploadZone() {
  const { setImage } = useSpriteContext();
  const [_dragActive, _setDragActive] = createSignal(false);
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
        class={`transform cursor-pointer border-4 border-black bg-white p-10 text-center ${
          isDragActive ? "rotate-1 bg-lime-200" : "rotate-0 hover:rotate-1 hover:bg-orange-100"
        } shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200`}
      >
        <input {...getInputProps()} />
        <div class="flex flex-col items-center justify-center space-y-6">
          <div class="rotate-3 transform border-4 border-black bg-purple-300 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-black text-black">Drag and drop your sprite atlas here</p>
            <p class="mt-2 inline-block -rotate-1 transform bg-yellow-200 px-2 text-lg font-bold text-gray-700">
              or click to browse your files
            </p>
          </div>
          <p class="text-md border-2 border-black bg-blue-100 px-3 py-1 font-bold text-gray-600">
            Supported formats: PNG, JPG, GIF, WEBP
          </p>
        </div>
      </div>

      <Show when={fileError()}>
        <p class="mt-4 rotate-1 transform border-2 border-red-500 bg-white p-2 text-center font-bold text-red-500 shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]">
          {fileError()}
        </p>
      </Show>

      <div class="mt-8">
        <p class="mb-3 -rotate-1 transform text-center font-bold text-black">
          Or upload from your computer:
        </p>
        <div class="flex items-center justify-center">
          <label
            for="file-upload"
            class="rotate-1 transform cursor-pointer border-4 border-black bg-green-400 px-6 py-3 text-lg font-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-y-[-4px] hover:rotate-2"
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
