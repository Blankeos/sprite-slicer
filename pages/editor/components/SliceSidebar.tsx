import { useSpriteContext } from "@/lib/SpriteContext";
import { For, createSignal } from "solid-js";

export default function SliceSidebar() {
  const { state, updateSlice, removeSlice, focusedSliceId } = useSpriteContext();
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

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      saveEditing(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div class="w-64 bg-white border-r overflow-y-auto flex flex-col h-full">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">Slices</h2>
        <p class="text-sm text-gray-500 mt-1">
          {state.slices.length} {state.slices.length === 1 ? "slice" : "slices"}
        </p>
      </div>

      <div class="flex-grow overflow-y-auto">
        {state.slices.length === 0 ? (
          <div class="p-4 text-center text-gray-500 text-sm">
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
                  class={`p-3 hover:bg-gray-50 group relative flex items-center ${
                    focusedSliceId() === slice.id ? "bg-blue-100" : ""
                  }`}
                >
                  <div class="w-8 h-8 flex-shrink-0 mr-3 bg-blue-100 rounded overflow-hidden">
                    {state.imageUrl && (
                      <div
                        style={{
                          background: `url(${state.imageUrl})`,
                          "background-position-x": `-${slice.x}px -${slice.y}px`,
                          width: "100%",
                          height: "100%",
                          "background-size": `${state.image ? state.image.width : 0}px ${state.image ? state.image.height : 0}px`,
                        }}
                      />
                    )}
                  </div>

                  <div class="flex-grow min-w-0">
                    {editingId() === slice.id ? (
                      <input
                        type="text"
                        value={tempName()}
                        onInput={(e) => setTempName(e.target.value)}
                        onBlur={() => saveEditing(slice.id)}
                        onKeyDown={(e) => handleKeyDown(e, slice.id)}
                        class="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autofocus
                      />
                    ) : (
                      <div class="flex items-center">
                        <span
                          class="text-sm text-gray-800 truncate"
                          onDblClick={() => startEditing(slice.id, slice.name)}
                        >
                          {slice.name}
                        </span>
                        <button
                          onClick={() => startEditing(slice.id, slice.name)}
                          class="ml-2 text-gray-400 hover:text-blue-500 p-1 -m-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    )}

                    <div class="text-xs text-gray-500 mt-0.5">
                      {slice.width} × {slice.height}px
                    </div>
                  </div>

                  <button
                    onClick={() => removeSlice(slice.id)}
                    class="ml-2 text-gray-400 hover:text-red-500 p-1.5 -m-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
