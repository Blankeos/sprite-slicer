import { useSpriteContext } from "@/lib/SpriteContext";
import { For, Show, createMemo, createSignal } from "solid-js";

export default function SliceSidebar() {
  const { state, updateSlice, removeSlice, focusedSliceId, focusSlice } = useSpriteContext();
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [tempName, setTempName] = createSignal("");

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const saveEditing = (id: string) => {
    const newName = tempName().trim();
    if (newName && newName !== "") {
      updateSlice(id, { name: newName });
    }
    setEditingId(null);
  };

  const handleNameChange = (id: string, newName: string) => {
    setTempName(newName);
    updateSlice(id, { name: newName });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div class="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r bg-white">
      <div class="border-b p-4">
        <h2 class="text-lg font-semibold text-gray-800">Slices</h2>
        <p class="mt-1 text-sm text-gray-500">
          {state.slices.length} {state.slices.length === 1 ? "slice" : "slices"}
        </p>
      </div>

      <div class="flex-grow overflow-y-auto">
        {state.slices.length === 0 ? (
          <div class="p-4 text-center text-sm text-gray-500">
            <p>No slices created yet.</p>
            <p class="mt-2">
              Use the rectangle tool to manually create slices, or use the grid/pixel options.
            </p>
          </div>
        ) : (
          <div class="divide-y">
            <For each={state.slices}>
              {(slice) => (
                <div
                  class={`group relative flex items-center border-b p-3 hover:bg-gray-50 ${
                    focusedSliceId() === slice.id ? "bg-blue-100" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    focusSlice(slice.id);
                  }}
                >
                  <div class="mr-3 h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-blue-100">
                    <Show when={state.imageUrl}>
                      <SliceThumbnail slice={slice} imageUrl={state.imageUrl} size={32} />
                    </Show>
                  </div>

                  <div class="min-w-0 flex-grow">
                    <Show
                      when={editingId() === slice.id}
                      fallback={
                        <div class="flex items-center">
                          <span
                            class="truncate text-sm text-gray-800"
                            onDblClick={() => startEditing(slice.id, slice.name)}
                          >
                            {slice.name}
                          </span>
                          <button
                            onClick={() => startEditing(slice.id, slice.name)}
                            class="-m-1 ml-2 p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-500"
                            title="Rename"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        </div>
                      }
                    >
                      <input
                        type="text"
                        value={tempName()}
                        onInput={(e) => handleNameChange(slice.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={handleKeyDown}
                        class="w-full rounded border border-blue-500 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        autofocus
                      />
                    </Show>

                    <div class="mt-0.5 text-xs text-gray-500">
                      {slice.width} × {slice.height}px
                    </div>
                  </div>

                  <button
                    onClick={() => removeSlice(slice.id)}
                    class="-m-1.5 ml-2 p-1.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
}

// Create a new SliceThumbnail component
import { SliceRect } from "@/lib/SpriteContext";
import { createEffect } from "solid-js";

type SliceThumbnailProps = {
  slice: SliceRect;
  imageUrl: string | null;
  size?: number;
};

function SliceThumbnail(props: SliceThumbnailProps) {
  let canvasRef: HTMLCanvasElement | undefined;

  const renderThumbnail = (
    imageUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (!canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw only the slice portion of the image
      ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageUrl;
  };

  // Render on mount and when slice or image changes
  createEffect(() => {
    if (props.imageUrl && props.slice) {
      renderThumbnail(
        props.imageUrl,
        props.slice.x,
        props.slice.y,
        props.slice.width,
        props.slice.height
      );
    }
  });

  const size = createMemo(() => props.size || 32);

  return (
    <canvas
      ref={canvasRef}
      width={size()}
      height={size()}
      class="rounded bg-blue-100"
      style={{
        "image-rendering": "pixelated", // For modern browsers
        "-ms-interpolation-mode": "nearest-neighbor", // For IE
        "-webkit-image-rendering": "pixelated", // For Safari
        "-moz-image-rendering": "pixelated", // For Firefox
      }}
    />
  );
}
