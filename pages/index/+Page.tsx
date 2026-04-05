import { useSpriteContext } from "@/lib/SpriteContext";
import {
  IconCloudUpload,
  IconGridLayout,
  IconImagePixel,
  IconScissors,
  IconSelectObject,
  IconSparkle,
} from "@/assets/icons";
import { createDropzone } from "@soorria/solid-dropzone";
import { useHotkeys, useOs } from "bagon-hooks";
import { createSignal, For, type JSX, Show } from "solid-js";
import { useMetadata } from "vike-metadata-solid";
import { navigate } from "vike/client/router";

export default function Page() {
  useMetadata({});

  const { setImage } = useSpriteContext();
  const [fileError, setFileError] = createSignal("");

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload a valid image file");
      return;
    }

    setFileError("");
    setImage(file);

    setTimeout(() => {
      navigate("/editor");
    }, 100);
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) handleFile(file);
  };

  const dropzone = createDropzone({
    onDrop,
    accept: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    multiple: false,
    noClick: true,
  });

  return (
    <div {...dropzone.getRootProps()} class="landing-bg relative min-h-screen overflow-hidden">
      <input {...dropzone.getInputProps()} />

      {/* Full-screen drag overlay */}
      <Show when={dropzone.isDragActive}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            "backdrop-filter": "blur(4px)",
            "background-image":
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)",
          }}
        >
          {/* Animated marching-ants border inset */}
          <div
            class="absolute inset-4 sm:inset-8"
            style={{
              "background-image":
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 10px, transparent 10px, transparent 20px)," +
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 10px, transparent 10px, transparent 20px)," +
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 10px, transparent 10px, transparent 20px)," +
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 10px, transparent 10px, transparent 20px)",
              "background-size": "100% 3px, 100% 3px, 3px 100%, 3px 100%",
              "background-position": "0 0, 0 100%, 0 0, 100% 0",
              "background-repeat": "no-repeat",
              animation: "marching-ants 0.5s linear infinite",
            }}
          />

          {/* Floating pixel sprites in corners */}
          <div
            class="absolute left-6 top-6 sm:left-12 sm:top-12"
            style={{ animation: "float 2s ease-in-out infinite" }}
          >
            <div class="grid grid-cols-3 gap-0.5">
              <For each={[0, 1, 0, 1, 1, 1, 1, 0, 1]}>
                {(on) => (
                  <div
                    class="h-3 w-3 sm:h-4 sm:w-4"
                    style={{
                      background: on ? "#a3e635" : "transparent",
                      "box-shadow": on ? "0 0 6px rgba(163,230,53,0.6)" : "none",
                    }}
                  />
                )}
              </For>
            </div>
          </div>

          <div
            class="absolute right-6 top-6 sm:right-12 sm:top-12"
            style={{
              animation: "float 2s ease-in-out infinite",
              "animation-delay": "0.5s",
            }}
          >
            <div class="grid grid-cols-3 gap-0.5">
              <For each={[1, 1, 1, 1, 0, 1, 1, 1, 1]}>
                {(on) => (
                  <div
                    class="h-3 w-3 sm:h-4 sm:w-4"
                    style={{
                      background: on ? "#f472b6" : "transparent",
                      "box-shadow": on ? "0 0 6px rgba(244,114,182,0.6)" : "none",
                    }}
                  />
                )}
              </For>
            </div>
          </div>

          <div
            class="absolute bottom-6 left-6 sm:bottom-12 sm:left-12"
            style={{
              animation: "float 2s ease-in-out infinite",
              "animation-delay": "1s",
            }}
          >
            <div class="grid grid-cols-3 gap-0.5">
              <For each={[1, 0, 1, 0, 1, 0, 1, 0, 1]}>
                {(on) => (
                  <div
                    class="h-3 w-3 sm:h-4 sm:w-4"
                    style={{
                      background: on ? "#22d3ee" : "transparent",
                      "box-shadow": on ? "0 0 6px rgba(34,211,238,0.6)" : "none",
                    }}
                  />
                )}
              </For>
            </div>
          </div>

          <div
            class="absolute bottom-6 right-6 sm:bottom-12 sm:right-12"
            style={{
              animation: "float 2s ease-in-out infinite",
              "animation-delay": "1.5s",
            }}
          >
            <div class="grid grid-cols-3 gap-0.5">
              <For each={[1, 1, 0, 0, 1, 1, 1, 1, 0]}>
                {(on) => (
                  <div
                    class="h-3 w-3 sm:h-4 sm:w-4"
                    style={{
                      background: on ? "#facc15" : "transparent",
                      "box-shadow": on ? "0 0 6px rgba(250,204,21,0.6)" : "none",
                    }}
                  />
                )}
              </For>
            </div>
          </div>

          {/* Center content */}
          <div class="animate-fade-up flex flex-col items-center gap-5">
            {/* Bouncing icon with pixel glow */}
            <div
              class="border-4 border-white bg-lime-400 p-6"
              style={{
                "box-shadow":
                  "8px 8px 0px 0px rgba(255,255,255,0.4), 0 0 30px rgba(163,230,53,0.4), 0 0 60px rgba(163,230,53,0.2)",
                animation: "drop-bounce 1s ease-in-out infinite",
              }}
            >
              <IconCloudUpload class="h-14 w-14 text-black sm:h-16 sm:w-16" />
            </div>

            {/* Label with stacked neo-brutal layers */}
            <div class="relative">
              {/* Shadow layer */}
              <div
                class="absolute inset-0 translate-x-2 translate-y-2 border-4 border-white/30 bg-pink-400"
                aria-hidden="true"
              />
              <p
                class="font-display relative border-4 border-white bg-black px-8 py-3.5 text-2xl font-extrabold text-white sm:text-3xl"
                style={{
                  "text-shadow": "0 0 20px rgba(163,230,53,0.5)",
                }}
              >
                Drop it right here!
              </p>
            </div>

            {/* Pixel arrow hints */}
            <div class="flex items-center gap-3 opacity-70">
              <For each={[0, 1, 2]}>
                {(i) => (
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      background: "white",
                      animation: `drop-hint 1.2s ease-in-out infinite`,
                      "animation-delay": `${i * 0.15}s`,
                    }}
                  />
                )}
              </For>
              <span class="font-mono-dm text-sm font-medium text-white/80">
                PNG, JPG, GIF, WEBP
              </span>
              <For each={[0, 1, 2]}>
                {(i) => (
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      background: "white",
                      animation: `drop-hint 1.2s ease-in-out infinite`,
                      "animation-delay": `${i * 0.15}s`,
                    }}
                  />
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>

      {/* Decorative floating elements */}
      <DecoElements />

      <div class="relative z-10 flex min-h-screen flex-col items-center px-4 py-16 sm:py-24">
        {/* Hero */}
        <div class="animate-fade-up flex flex-col items-center" style={{ "animation-delay": "0s" }}>
          <div class="mb-4 inline-block border-4 border-black bg-black px-4 py-1.5">
            <span class="font-mono-dm text-sm font-medium tracking-widest text-yellow-300 uppercase">
              Free & Open Source
            </span>
          </div>

          <h1 class="font-display relative mb-2 text-center text-5xl leading-tight font-extrabold tracking-tight text-black sm:text-7xl md:text-8xl">
            <span class="relative">
              Sprite Atlas
              <IconSparkle class="absolute -right-4 -top-4 h-8 w-8 text-pink-400 sm:-right-6 sm:-top-6 sm:h-10 sm:w-10" />
            </span>
            <br />
            <span class="relative inline-block">
              <span class="relative z-10">Slicer</span>
              <span class="absolute bottom-1 left-0 -z-0 h-4 w-full -rotate-1 bg-pink-300 sm:bottom-2 sm:h-6" />
            </span>
          </h1>

          <p class="font-body mt-6 max-w-lg text-center text-lg font-medium text-gray-700 sm:text-xl">
            Upload a sprite atlas, slice it into individual sprites —{" "}
            <span class="font-semibold text-black">manually, by grid, or by pixel size.</span>
          </p>

          <div class="mt-5 flex items-center gap-2 text-gray-400">
            <span class="h-px w-8 bg-gray-300" />
            <IconScissors class="h-5 w-5" />
            <span class="h-px w-8 bg-gray-300" />
          </div>
        </div>

        {/* Upload Zone */}
        <div
          class="animate-fade-up mt-12 w-full max-w-xl sm:mt-16"
          style={{ "animation-delay": "0.15s" }}
        >
          <UploadBox handleFile={handleFile} fileError={fileError()} />
        </div>

        {/* Feature Cards */}
        <div
          class="animate-fade-up mt-16 grid w-full max-w-3xl grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-3"
          style={{ "animation-delay": "0.3s" }}
        >
          <For each={features}>
            {(feature, i) => (
              <div
                class={`border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ${feature.bg}`}
                style={{
                  transform: `rotate(${i() % 2 === 0 ? "-1" : "1"}deg)`,
                }}
              >
                <div class="mb-3">{feature.icon()}</div>
                <h3 class="font-display text-lg font-extrabold text-black">{feature.title}</h3>
                <p class="font-body mt-1 text-sm font-medium text-gray-800">{feature.desc}</p>
              </div>
            )}
          </For>
        </div>

        {/* Footer tagline */}
        <div
          class="animate-fade-up mt-16 flex flex-col items-center gap-3"
          style={{ "animation-delay": "0.45s" }}
        >
          <div class="flex items-center gap-2">
            <For each={["PNG", "JPG", "GIF", "WEBP"]}>
              {(fmt) => (
                <span class="font-mono-dm border-2 border-black bg-white px-2 py-0.5 text-xs font-medium">
                  {fmt}
                </span>
              )}
            </For>
          </div>
          <p class="font-body text-sm text-gray-500">
            Built for game devs & pixel artists
          </p>
        </div>
      </div>
    </div>
  );
}

const features: { icon: () => JSX.Element; title: string; desc: string; bg: string }[] = [
  {
    icon: () => <IconSelectObject class="h-8 w-8" />,
    title: "Manual Slicing",
    desc: "Draw custom rectangles directly on your sprite sheet.",
    bg: "bg-violet-200",
  },
  {
    icon: () => <IconGridLayout class="h-8 w-8" />,
    title: "Grid Mode",
    desc: "Divide into rows & columns automatically.",
    bg: "bg-cyan-200",
  },
  {
    icon: () => <IconImagePixel class="h-8 w-8" />,
    title: "Pixel Mode",
    desc: "Slice by fixed pixel dimensions like 16×16 or 32×32.",
    bg: "bg-lime-200",
  },
];

function DecoElements() {
  return (
    <>
      <div
        class="animate-float absolute left-6 top-20 hidden border-4 border-black bg-pink-300 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:block"
        style={{ "--float-rot": "-6deg", "animation-delay": "0s" }}
      >
        <div class="grid grid-cols-3 gap-0.5">
          <For each={[1, 0, 1, 0, 1, 0, 1, 0, 1]}>
            {(on) => <div class={`h-2.5 w-2.5 ${on ? "bg-black" : "bg-pink-100"}`} />}
          </For>
        </div>
      </div>

      <div
        class="animate-float absolute right-10 top-32 hidden border-4 border-black bg-yellow-300 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:block"
        style={{ "--float-rot": "4deg", "animation-delay": "1s" }}
      >
        <div class="grid grid-cols-4 gap-0.5">
          <For each={[1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1]}>
            {(on) => <div class={`h-2 w-2 ${on ? "bg-black" : "bg-yellow-100"}`} />}
          </For>
        </div>
      </div>

      <div
        class="animate-float absolute bottom-24 left-16 hidden border-4 border-black bg-cyan-300 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:block"
        style={{ "--float-rot": "3deg", "animation-delay": "2s" }}
      >
        <div class="grid grid-cols-2 gap-0.5">
          <For each={[1, 0, 0, 1]}>
            {(on) => <div class={`h-3 w-3 ${on ? "bg-black" : "bg-cyan-100"}`} />}
          </For>
        </div>
      </div>

      <div
        class="animate-float absolute bottom-32 right-8 hidden border-4 border-black bg-green-300 p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:block"
        style={{ "--float-rot": "-3deg", "animation-delay": "0.5s" }}
      >
        <div class="grid grid-cols-3 gap-0.5">
          <For each={[0, 1, 0, 1, 1, 1, 0, 1, 0]}>
            {(on) => <div class={`h-2.5 w-2.5 ${on ? "bg-black" : "bg-green-100"}`} />}
          </For>
        </div>
      </div>
    </>
  );
}

function UploadBox(props: { handleFile: (file: File) => void; fileError: string }) {
  const os = useOs();

  // Handle clipboard paste
  useHotkeys([
    [
      "meta+v",
      (e: KeyboardEvent) => {
        e.preventDefault();
        navigator.clipboard
          .read()
          .then(async (clipboardItems) => {
            for (const clipboardItem of clipboardItems) {
              for (const type of clipboardItem.types) {
                if (type.startsWith("image/")) {
                  try {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], "clipboard-image." + type.split("/")[1], {
                      type,
                    });
                    props.handleFile(file);
                    break;
                  } catch (err) {
                    console.error("Failed to get image from clipboard:", err);
                  }
                }
              }
            }
          })
          .catch((err) => {
            console.error("Clipboard error:", err);
          });
      },
    ],
  ]);

  return (
    <div class="w-full">
      <div class="neo-btn border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10">
        <div class="flex flex-col items-center justify-center gap-5">
          <div class="border-4 border-black bg-pink-300 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <IconCloudUpload class="h-10 w-10 text-black" />
          </div>

          <div>
            <p class="font-display text-xl font-extrabold text-black sm:text-2xl">
              Drop your sprite atlas anywhere
            </p>
            <p class="font-body mt-2 text-sm font-medium text-gray-600">
              or{" "}
              <span class="font-mono-dm inline-block border-2 border-black bg-yellow-200 px-2 py-0.5 text-xs font-medium">
                {os() === "macos" ? "⌘V" : "Ctrl+V"}
              </span>{" "}
              to paste from clipboard
            </p>
          </div>

          <label
            for="file-upload-main"
            class="neo-btn font-display cursor-pointer border-4 border-black bg-green-400 px-6 py-2.5 text-base font-extrabold text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
          >
            Browse Files
            <input
              id="file-upload-main"
              type="file"
              accept="image/*"
              class="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) props.handleFile(file);
              }}
            />
          </label>
        </div>
      </div>

      <Show when={props.fileError}>
        <div class="mt-4 border-4 border-red-500 bg-red-50 p-3 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
          <p class="font-body text-center text-sm font-semibold text-red-600">{props.fileError}</p>
        </div>
      </Show>
    </div>
  );
}
