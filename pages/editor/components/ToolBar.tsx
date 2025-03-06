import { SliceType, useSpriteContext } from "@/lib/SpriteContext";
import { createSignal, Show } from "solid-js";

type ToolBarProps = {
  onExport: () => void;
  exportLoading: boolean;
};

export default function ToolBar(props: ToolBarProps) {
  const {
    state,
    setSliceType,
    setGridDimensions,
    setPixelDimensions,
    generateSlices,
    clearSlices,
    toggleSliceVisibility,
    togglePixelated,
    toggleRulers,
    toggleGrid,
    setGridSize,
    updateSlice,
  } = useSpriteContext();

  const [gridRows, setGridRows] = createSignal(state.gridRows);
  const [gridCols, setGridCols] = createSignal(state.gridCols);
  const [pixelWidth, setPixelWidth] = createSignal(state.pixelWidth);
  const [pixelHeight, setPixelHeight] = createSignal(state.pixelHeight);
  const [editorGridSize, setEditorGridSize] = createSignal(state.gridSize);
  const [selectedSlice, setSelectedSlice] = createSignal<SliceRect | null>(null);

  const handleSliceTypeChange = (type: SliceType) => {
    setSliceType(type);
    if (type === "grid") {
      setGridDimensions(gridRows(), gridCols());
    } else if (type === "pixel") {
      setPixelDimensions(pixelWidth(), pixelHeight());
    }
  };

  const handleGridRowsChange = (value: number) => {
    setGridRows(value);
    if (state.sliceType === "grid") {
      setGridDimensions(value, gridCols());
    }
  };

  const handleGridColsChange = (value: number) => {
    setGridCols(value);
    if (state.sliceType === "grid") {
      setGridDimensions(gridRows(), value);
    }
  };

  const handlePixelWidthChange = (value: number) => {
    setPixelWidth(value);
    if (state.sliceType === "pixel") {
      setPixelDimensions(value, pixelHeight());
    }
  };

  const handlePixelHeightChange = (value: number) => {
    setPixelHeight(value);
    if (state.sliceType === "pixel") {
      setPixelDimensions(pixelWidth(), value);
    }
  };

  const handleSliceClick = (slice: SliceRect) => {
    setSelectedSlice(slice);
  };

  return (
    <div class="bg-white border-b p-4 flex flex-wrap gap-4 items-center">
      {/* Slice Type Selection */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Slice Tool</label>
        <div class="flex">
          <button
            class={`px-3 py-1.5 text-sm rounded-l-md border border-r-0 ${
              state.sliceType === "manual"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => handleSliceTypeChange("manual")}
          >
            Rectangle
          </button>

          <button
            class={`px-3 py-1.5 text-sm border-y ${
              state.sliceType === "grid"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => handleSliceTypeChange("grid")}
          >
            Grid
          </button>

          <button
            class={`px-3 py-1.5 text-sm rounded-r-md border border-l-0 ${
              state.sliceType === "pixel"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => handleSliceTypeChange("pixel")}
          >
            Pixel
          </button>
        </div>
      </div>

      {/* Grid Controls - only shown when Grid is selected */}
      <Show when={state.sliceType === "grid"}>
        <div class="flex gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rows</label>
            <input
              type="number"
              min="1"
              value={gridRows()}
              onInput={(e) => handleGridRowsChange(parseInt(e.target.value) || 1)}
              class="w-16 h-9 py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Columns</label>
            <input
              type="number"
              min="1"
              value={gridCols()}
              onInput={(e) => handleGridColsChange(parseInt(e.target.value) || 1)}
              class="w-16 h-9 py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="self-end mb-0.5">
            <button
              onClick={generateSlices}
              class="h-9 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
            >
              Apply Grid
            </button>
          </div>
        </div>
      </Show>

      {/* Pixel Controls - only shown when Pixel is selected */}
      <Show when={state.sliceType === "pixel"}>
        <div class="flex gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
            <input
              type="number"
              min="1"
              value={pixelWidth()}
              onInput={(e) => handlePixelWidthChange(parseInt(e.target.value) || 1)}
              class="w-16 h-9 py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
            <input
              type="number"
              min="1"
              value={pixelHeight()}
              onInput={(e) => handlePixelHeightChange(parseInt(e.target.value) || 1)}
              class="w-16 h-9 py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="self-end mb-0.5">
            <button
              onClick={generateSlices}
              class="h-9 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
            >
              Apply Slices
            </button>
          </div>
        </div>
      </Show>

      {/* Spacer */}
      <div class="flex-grow"></div>

      {/* Action Buttons */}
      <div class="flex gap-2 items-center">
        {/* Clear Slices Button */}
        <button
          onClick={clearSlices}
          disabled={state.slices.length === 0}
          class={`px-3 py-1.5 rounded-md flex items-center ${
            state.slices.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
          title="Clear all slices"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear All
        </button>

        {/* Toggle Slice Visibility Button */}
        <button
          onClick={toggleSliceVisibility}
          class={`px-3 py-1.5 rounded-md flex items-center ${
            state.showSlices
              ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={state.showSlices ? "Hide slice rectangles" : "Show slice rectangles"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={
                state.showSlices
                  ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              }
            />
          </svg>
          {state.showSlices ? "Hide Slices" : "Show Slices"}
        </button>

        {/* Toggle Pixelation Button */}
        <button
          onClick={togglePixelated}
          class={`px-3 py-1.5 rounded-md flex items-center ${
            state.pixelated
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={state.pixelated ? "Disable pixelated rendering" : "Enable pixelated rendering"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4m4 4V4"
            />
          </svg>
          {state.pixelated ? "Smooth" : "Pixelated"}
        </button>

        {/* Toggle Rulers Button */}
        <button
          onClick={toggleRulers}
          class={`px-3 py-1.5 rounded-md flex items-center ${
            state.showRulers
              ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={state.showRulers ? "Hide rulers" : "Show rulers"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          {state.showRulers ? "Hide Rulers" : "Show Rulers"}
        </button>

        {/* Toggle Grid Button */}
        <button
          onClick={toggleGrid}
          class={`px-3 py-1.5 rounded-md flex items-center ${
            state.showGrid
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={state.showGrid ? "Hide grid" : "Show grid"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          {state.showGrid ? "Hide Grid" : "Show Grid"}
        </button>

        {/* Grid Size Control - only shown when Grid is enabled */}
        <Show when={state.showGrid}>
          <div class="flex items-center ml-2">
            <input
              type="number"
              min="1"
              max="64"
              value={editorGridSize()}
              onInput={(e) => {
                const value = parseInt(e.target.value) || 16;
                setEditorGridSize(value);
                setGridSize(value);
              }}
              class="w-14 h-8 py-1 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <span class="ml-1 text-xs text-gray-500">px</span>
          </div>
        </Show>
      </div>

      {/* Selected Slice Controls */}
      <Show when={selectedSlice()}>
        <div class="flex items-center gap-2">
          <div class="flex items-center">
            <label class="text-sm text-gray-700 mr-2">Width:</label>
            <input
              type="number"
              min="1"
              value={selectedSlice()?.width}
              onInput={(e) => {
                const width = parseInt(e.target.value);
                if (width > 0 && selectedSlice()) {
                  updateSlice(selectedSlice()!.id, { width });
                }
              }}
              class="w-16 h-8 py-1 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div class="flex items-center">
            <label class="text-sm text-gray-700 mr-2">Height:</label>
            <input
              type="number"
              min="1"
              value={selectedSlice()?.height}
              onInput={(e) => {
                const height = parseInt(e.target.value);
                if (height > 0 && selectedSlice()) {
                  updateSlice(selectedSlice()!.id, { height });
                }
              }}
              class="w-16 h-8 py-1 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </Show>

      {/* Export Button */}
      <div>
        <button
          onClick={props.onExport}
          disabled={props.exportLoading || state.slices.length === 0}
          class={`px-4 py-2 rounded-md flex items-center ${
            props.exportLoading || state.slices.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          <Show when={props.exportLoading}>
            <>
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Exporting...
            </>
          </Show>
          <Show when={!props.exportLoading}>
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="-ml-1 mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Slices
            </>
          </Show>
        </button>
      </div>
    </div>
  );
}
