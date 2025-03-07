import { IconHideSlices, IconPixelated, IconRuler } from "@/assets/icons";
import { Tippy } from "@/lib/solid-tippy";
import { SliceRect, SliceType, useSpriteContext } from "@/lib/SpriteContext";
import { createMemo, createSignal, Show } from "solid-js";
import { navigate } from "vike/client/router";

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
    focusedSliceId,
    updateSliceDimensions,
  } = useSpriteContext();

  const [gridRows, setGridRows] = createSignal(state.gridRows);
  const [gridCols, setGridCols] = createSignal(state.gridCols);
  const [pixelWidth, setPixelWidth] = createSignal(state.pixelWidth);
  const [pixelHeight, setPixelHeight] = createSignal(state.pixelHeight);
  const [editorGridSize, setEditorGridSize] = createSignal(state.gridSize);
  const [selectedSlice, setSelectedSlice] = createSignal<SliceRect | null>(null);

  const focusedSlice = createMemo(() =>
    state.slices?.find((slice) => slice.id === focusedSliceId())
  );

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
  };

  const handleGridColsChange = (value: number) => {
    setGridCols(value);
  };

  const handlePixelWidthChange = (value: number) => {
    setPixelWidth(value);
  };

  const handlePixelHeightChange = (value: number) => {
    setPixelHeight(value);
  };

  const handleSliceClick = (slice: SliceRect) => {
    setSelectedSlice(slice);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div class="flex flex-wrap items-center gap-4 border-2 border-b border-black bg-white p-4">
      <Tippy
        content="Back to home page"
        props={{ animation: "shift-away-subtle", placement: "bottom" }}
      >
        <button
          onClick={handleBackToHome}
          class="flex cursor-pointer items-center border-2 border-black bg-gray-700 px-2 py-1 text-xs font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      </Tippy>
      {/* Slice Type Selection */}
      <div>
        <label class="mb-1.5 block text-sm font-bold text-black">Slice Tool</label>
        <div class="flex">
          <Tippy
            content="Draw rectangle slices manually"
            props={{ animation: "shift-away-subtle", placement: "bottom" }}
          >
            <button
              class={`border-2 border-black px-2 py-1 text-xs font-bold transition-colors ${
                state.sliceType === "manual"
                  ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
              }`}
              onClick={() => handleSliceTypeChange("manual")}
            >
              Rectangle
            </button>
          </Tippy>

          <Tippy
            content="Divide sprite into a grid"
            props={{ animation: "shift-away-subtle", placement: "bottom" }}
          >
            <button
              class={`border-2 border-l-0 border-black px-2 py-1 text-xs font-bold transition-colors ${
                state.sliceType === "grid"
                  ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
              }`}
              onClick={() => handleSliceTypeChange("grid")}
            >
              Grid
            </button>
          </Tippy>

          <Tippy
            content="Slice by pixel dimensions"
            props={{ animation: "shift-away-subtle", placement: "bottom" }}
          >
            <button
              class={`border-2 border-l-0 border-black px-2 py-1 text-xs font-bold transition-colors ${
                state.sliceType === "pixel"
                  ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
              }`}
              onClick={() => handleSliceTypeChange("pixel")}
            >
              Pixel
            </button>
          </Tippy>
        </div>
      </div>

      {/* Grid Controls - only shown when Grid is selected */}
      <Show when={state.sliceType === "grid"}>
        <div class="flex gap-3">
          <div>
            <label class="mb-1.5 block text-sm font-bold text-black">Rows</label>
            <input
              type="number"
              min="1"
              value={gridRows()}
              onInput={(e) => handleGridRowsChange(parseInt(e.target.value) || 1)}
              class="h-8 w-16 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-bold text-black">Columns</label>
            <input
              type="number"
              min="1"
              value={gridCols()}
              onInput={(e) => handleGridColsChange(parseInt(e.target.value) || 1)}
              class="h-8 w-16 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>
          <div class="mb-0.5 self-end">
            <Tippy
              content="Apply grid dimensions to the sprite"
              props={{ animation: "shift-away-subtle", placement: "bottom" }}
            >
              <button
                onClick={() => {
                  setGridDimensions(gridRows(), gridCols());
                  generateSlices();
                }}
                class="h-8 border-2 border-black bg-blue-500 px-2 py-1 text-xs font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Grid
              </button>
            </Tippy>
          </div>
        </div>
      </Show>

      {/* Pixel Controls - only shown when Pixel is selected */}
      <Show when={state.sliceType === "pixel"}>
        <div class="flex gap-3">
          <div>
            <label class="mb-1.5 block text-sm font-bold text-black">Width (px)</label>
            <input
              type="number"
              min="1"
              value={pixelWidth()}
              onInput={(e) => handlePixelWidthChange(parseInt(e.target.value) || 1)}
              class="h-8 w-16 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-bold text-black">Height (px)</label>
            <input
              type="number"
              min="1"
              value={pixelHeight()}
              onInput={(e) => handlePixelHeightChange(parseInt(e.target.value) || 1)}
              class="h-8 w-16 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>
          <div class="mb-0.5 self-end">
            <Tippy
              content="Slice sprite into frames of this size"
              props={{ animation: "shift-away-subtle", placement: "bottom" }}
            >
              <button
                onClick={() => {
                  setPixelDimensions(pixelWidth(), pixelHeight());
                  generateSlices();
                }}
                class="h-8 border-2 border-black bg-blue-500 px-2 py-1 text-xs font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Slices
              </button>
            </Tippy>
          </div>
        </div>
      </Show>

      {/* Spacer */}
      <div class="flex-grow" />

      {/* Action Buttons */}
      <div class="flex items-center gap-2">
        {/* Clear Slices Button */}
        <Tippy
          content="Remove all slice rectangles"
          props={{ animation: "shift-away-subtle", placement: "bottom" }}
        >
          <button
            onClick={clearSlices}
            disabled={state.slices.length === 0}
            class={`flex items-center border-2 border-black px-2 py-1 text-xs font-bold transition-colors ${
              state.slices.length === 0
                ? "cursor-not-allowed opacity-50"
                : "bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mr-1 h-3 w-3"
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
        </Tippy>

        {/* Toggle Slice Visibility Button */}
        <Tippy
          content={state.showSlices ? "Hide slice rectangles" : "Show slice rectangles"}
          props={{ animation: "shift-away-subtle", placement: "bottom" }}
        >
          <button
            onClick={toggleSliceVisibility}
            class={`flex items-center gap-x-1 border-2 border-black px-2 py-1 text-xs font-bold transition-all ${
              state.showSlices
                ? "bg-indigo-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <IconHideSlices class="h-3 w-3" />
            {state.showSlices ? "Hide Slices" : "Show Slices"}
          </button>
        </Tippy>

        {/* Toggle Pixelation Button */}
        <Tippy
          content="Toggle between pixelated and smooth rendering (does not affect output)"
          props={{ animation: "shift-away-subtle", placement: "bottom" }}
        >
          <button
            onClick={togglePixelated}
            class={`flex items-center gap-x-1 border-2 border-black px-2 py-1 text-xs font-bold transition-all ${
              state.pixelated
                ? "bg-amber-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-amber-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <IconPixelated class="h-3 w-3" />
            {state.pixelated ? "Smooth" : "Pixelated"}
          </button>
        </Tippy>

        {/* Toggle Rulers Button */}
        <Tippy
          content={state.showRulers ? "Hide pixel rulers" : "Show pixel rulers"}
          props={{ animation: "shift-away-subtle", placement: "bottom" }}
        >
          <button
            onClick={toggleRulers}
            class={`flex items-center gap-x-1 border-2 border-black px-2 py-1 text-xs font-bold transition-all ${
              state.showRulers
                ? "bg-teal-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-teal-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <IconRuler class="h-3 w-3" />
            {state.showRulers ? "Hide Rulers" : "Show Rulers"}
          </button>
        </Tippy>

        {/* Toggle Grid Button */}
        {/* <button
          onClick={toggleGrid}
          class={`px-3 py-1.5 rounded-lg shadow-sm flex items-center transition-colors font-medium ${
            state.showGrid
              ? "bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100"
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
          }`}
          title={state.showGrid ? "Hide grid" : "Show grid"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1.5"
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
        </button> */}

        {/* Grid Size Control - only shown when Grid is enabled */}
        <Show when={state.showGrid}>
          <div class="ml-2 flex items-center">
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
              class="h-8 w-14 border-2 border-black px-2 py-1 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
            <span class="ml-1 text-xs font-bold text-black">px</span>
          </div>
        </Show>
      </div>

      {/* Selected Slice Controls */}
      <Show when={focusedSlice()}>
        <div class="flex items-center gap-3 border-2 border-black bg-blue-100 p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-1">
            <label class="text-xs font-bold text-black">Width:</label>
            <input
              type="number"
              value={focusedSlice()!.width}
              onInput={(e) =>
                updateSliceDimensions(
                  focusedSlice()!.id,
                  Number(e.target.value),
                  focusedSlice()!.height
                )
              }
              class="w-16 border-2 border-black px-2 py-1 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>
          <div class="flex items-center gap-1">
            <label class="text-xs font-bold text-black">Height:</label>
            <input
              type="number"
              value={focusedSlice()?.height}
              onInput={(e) =>
                updateSliceDimensions(
                  focusedSlice()!.id,
                  focusedSlice()!.width,
                  Number(e.target.value)
                )
              }
              class="w-16 border-2 border-black px-2 py-1 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>
        </div>
      </Show>

      {/* Export Button */}
      <div>
        <Tippy
          content="Export all slices as individual images"
          props={{ animation: "shift-away-subtle", placement: "bottom" }}
        >
          <button
            onClick={() => props.onExport()}
            disabled={props.exportLoading || state.slices.length === 0}
            class={`flex items-center border-2 border-black px-3 py-1 text-xs font-bold transition-all ${
              props.exportLoading || state.slices.length === 0
                ? "cursor-not-allowed opacity-50"
                : "bg-green-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <Show when={props.exportLoading}>
              <>
                <svg
                  class="mr-1 -ml-1 h-3 w-3 animate-spin text-white"
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
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exporting...
              </>
            </Show>
            <Show when={!props.exportLoading}>
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mr-1 -ml-1 h-4 w-4"
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
        </Tippy>
      </div>
    </div>
  );
}
