import { SliceRect, useSpriteContext } from "@/lib/SpriteContext";
import { clamp } from "@/utils/clamp";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { useHotkeys } from "bagon-hooks";

export default function SpriteCanvas() {
  const {
    state,
    addSlice,
    removeSlice,
    updateSlice,
    setZoom,
    setPan,
    focusSlice,
    focusedSliceId,
    blurSlice,
  } = useSpriteContext();

  let canvasRef: HTMLDivElement | undefined;
  let [imgRef, setImgRef] = createSignal<HTMLImageElement | undefined>();

  const [isDrawing, setIsDrawing] = createSignal(false);
  const [startPos, setStartPos] = createSignal({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = createSignal({ x: 0, y: 0 });
  const [dragging, setDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const [draggedSlice, setDraggedSlice] = createSignal<{
    index: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [isResizing, setIsResizing] = createSignal(false);
  const [resizeState, setResizeState] = createSignal<{
    sliceId: string;
    corner: "nw" | "ne" | "sw" | "se";
    /** Fixed anchor point — the corner opposite to the one being dragged */
    anchorX: number;
    anchorY: number;
  } | null>(null);

  const [imageWidth, setImageWidth] = createSignal(0);
  const [imageHeight, setImageHeight] = createSignal(0);
  const [shouldCenter, setShouldCenter] = createSignal(false);

  createEffect(() => {
    if (imgRef()) {
      imgRef()!.onload = () => {
        setImageWidth(imgRef()!.naturalWidth);
        setImageHeight(imgRef()!.naturalHeight);

        // Center the image in the viewport on first load
        if (shouldCenter() && canvasRef) {
          const rect = canvasRef.getBoundingClientRect();
          const imgW = imgRef()!.naturalWidth;
          const imgH = imgRef()!.naturalHeight;
          setPan({
            x: (rect.width - imgW) / 2,
            y: (rect.height - imgH) / 2,
          });
          setShouldCenter(false);
        }
      };
    }
  });

  // Clipboard for copy/paste of slice dimensions
  const [clipboardSlice, setClipboardSlice] = createSignal<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useHotkeys([
    [
      "meta+x",
      (e) => {
        if (focusedSliceId()) {
          e.preventDefault();
          removeSlice(focusedSliceId()!);
          blurSlice();
        }
      },
    ],
    [
      "delete",
      (e) => {
        if (focusedSliceId()) {
          e.preventDefault();
          removeSlice(focusedSliceId()!);
          blurSlice();
        }
      },
    ],
    [
      "meta+c",
      (e) => {
        if (focusedSliceId()) {
          e.preventDefault();
          const slice = state.slices.find((s) => s.id === focusedSliceId());
          if (slice) {
            setClipboardSlice({ x: slice.x, y: slice.y, width: slice.width, height: slice.height });
          }
        }
      },
    ],
    [
      "meta+v",
      (e) => {
        const clip = clipboardSlice();
        if (clip) {
          e.preventDefault();
          // Paste with a small offset so it's visible
          const newSlice = addSlice({
            x: clip.x + 10,
            y: clip.y + 10,
            width: clip.width,
            height: clip.height,
          });
          if (newSlice) focusSlice(newSlice.id);
        }
      },
    ],
    [
      "meta+d",
      (e) => {
        if (focusedSliceId()) {
          e.preventDefault();
          const slice = state.slices.find((s) => s.id === focusedSliceId());
          if (slice) {
            const newSlice = addSlice({
              x: slice.x + 10,
              y: slice.y + 10,
              width: slice.width,
              height: slice.height,
            });
            if (newSlice) focusSlice(newSlice.id);
          }
        }
      },
    ],
  ]);

  // Create memos for tick calculations
  const horizontalTicks = createMemo(() => {
    if (!imgRef() || !state.showRulers) return [];
    const ticks = [];
    const majorTickInterval = 50;
    const step = state.zoom < 0.5 ? 100 : state.zoom < 1 ? 50 : 10;

    for (let x = 0; x <= imageWidth(); x += step) {
      const isMajor = x % majorTickInterval === 0;
      const tickHeight = isMajor ? 10 : 5;

      ticks.push({
        x,
        isMajor,
        tickHeight,
        label: isMajor ? x.toString() : null,
      });
    }

    return ticks;
  });

  const verticalTicks = createMemo(() => {
    if (!imgRef() || !state.showRulers) return [];
    const ticks = [];
    const majorTickInterval = 50;
    const step = state.zoom < 0.5 ? 100 : state.zoom < 1 ? 50 : 10;

    for (let y = 0; y <= imageHeight(); y += step) {
      const isMajor = y % majorTickInterval === 0;
      const tickWidth = isMajor ? 10 : 5;

      ticks.push({
        y,
        isMajor,
        tickWidth,
        label: isMajor ? y.toString() : null,
      });
    }

    return ticks;
  });

  // Calculate the actual scaled positions based on the zoom level and pan position
  const getScaledPosition = (clientX: number, clientY: number) => {
    if (!canvasRef || !imgRef()) return { x: 0, y: 0 };

    const rect = canvasRef.getBoundingClientRect();
    const scaleX = imgRef()!.naturalWidth / imgRef()!.width;
    const scaleY = imgRef()!.naturalHeight / imgRef()!.height;

    const x = ((clientX - rect.left - state.pan.x) / state.zoom) * scaleX;
    const y = ((clientY - rect.top - state.pan.y) / state.zoom) * scaleY;

    console.log(`Scaled Position: x=${x}, y=${y}`);

    return { x, y };
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(10, state.zoom + delta));

    setZoom(newZoom);
  };

  // Check if a point is inside a slice rectangle
  const isPointInSlice = (x: number, y: number, slice: SliceRect) => {
    return (
      x >= slice.x && x <= slice.x + slice.width && y >= slice.y && y <= slice.y + slice.height
    );
  };

  // Find the slice under the mouse pointer
  const findSliceUnderPoint = (x: number, y: number) => {
    for (let i = state.slices.length - 1; i >= 0; i--) {
      if (isPointInSlice(x, y, state.slices[i])) {
        return { slice: state.slices[i], index: i };
      }
    }
    return null;
  };

  // Mouse events for drawing selection rectangle
  const handleMouseDown = (e: MouseEvent) => {
    // Middle mouse button (wheel press) or Ctrl/Cmd + Left click for panning
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      setDragging(true);
      setDragStart({ x: e.clientX - state.pan.x, y: e.clientY - state.pan.y });
    } else if (e.button === 0) {
      // Left mouse button for drawing or selecting
      const pos = getScaledPosition(e.clientX, e.clientY);

      // Check if we're clicking on a resize handle
      // If we are, don't do anything here as the resize handlers have their own events
      const target = e.target as HTMLElement;
      const isResizeHandle = target.classList.contains("resize-handle");
      if (isResizeHandle) {
        return;
      }

      // Check if clicking on an existing slice
      if (state.showSlices) {
        const sliceHit = findSliceUnderPoint(pos.x, pos.y);
        if (sliceHit) {
          // Start dragging the slice
          setDraggedSlice({
            index: sliceHit.index,
            offsetX: pos.x - sliceHit.slice.x,
            offsetY: pos.y - sliceHit.slice.y,
          });
          return;
        }

        // If we clicked on an empty area and there's a focused slice, blur it
        if (focusedSliceId()) {
          blurSlice();
        }
      }

      // If not dragging a slice and in manual mode, start drawing a new slice
      if (state.sliceType === "manual") {
        setStartPos(pos);
        setCurrentPos(pos);
        setIsDrawing(true);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDrawing() && !focusedSliceId()) {
      const newPos = getScaledPosition(e.clientX, e.clientY);
      // Clamp the drawing position within image bounds
      newPos.x = clamp(newPos.x, 0, imageWidth());
      newPos.y = clamp(newPos.y, 0, imageHeight());
      setCurrentPos(newPos);
    } else if (dragging() && !isResizing()) {
      const newPan = {
        x: e.clientX - dragStart().x,
        y: e.clientY - dragStart().y,
      };
      setPan(newPan);
    } else if (draggedSlice() && !isResizing()) {
      const pos = getScaledPosition(e.clientX, e.clientY);
      const slice = state.slices[draggedSlice()!.index];

      // Calculate new position while keeping the slice within bounds
      const newX = clamp(
        Math.round(pos.x - draggedSlice()!.offsetX),
        0,
        imageWidth() - slice.width
      );
      const newY = clamp(
        Math.round(pos.y - draggedSlice()!.offsetY),
        0,
        imageHeight() - slice.height
      );

      updateSlice(slice.id, {
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isResizing()) {
      handleResizeEnd();
      setDragging(false);
      setDraggedSlice(null);
      return;
    }
    if (isDrawing()) {
      setIsDrawing(false);

      const start = startPos();
      const current = currentPos();

      // Calculate the rectangle properties
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const width = Math.abs(current.x - start.x);
      const height = Math.abs(current.y - start.y);

      // Add a new slice if the rectangle has a valid size
      if (width >= 1 && height >= 1) {
        // Ensure discrete pixel values
        const discreteX = Math.round(x);
        const discreteY = Math.round(y);
        const discreteWidth = Math.round(width);
        const discreteHeight = Math.round(height);

        addSlice({ x: discreteX, y: discreteY, width: discreteWidth, height: discreteHeight });
      }
    }

    // Clear dragged slice
    setDraggedSlice(null);
    setDragging(false);
  };

  const handleResizeStart =
    (slice: SliceRect, corner: "nw" | "ne" | "sw" | "se") => (e: MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);

      // Compute the fixed anchor — the corner opposite to the one being dragged
      let anchorX: number, anchorY: number;
      switch (corner) {
        case "nw":
          anchorX = slice.x + slice.width;
          anchorY = slice.y + slice.height;
          break;
        case "ne":
          anchorX = slice.x;
          anchorY = slice.y + slice.height;
          break;
        case "sw":
          anchorX = slice.x + slice.width;
          anchorY = slice.y;
          break;
        case "se":
          anchorX = slice.x;
          anchorY = slice.y;
          break;
      }

      setResizeState({ sliceId: slice.id, corner, anchorX, anchorY });
    };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeState(null);
  };

  const handleResize = (e: MouseEvent) => {
    const rs = resizeState();
    if (!rs) return;
    e.stopPropagation();

    const { sliceId, corner, anchorX, anchorY } = rs;
    const pos = getScaledPosition(e.clientX, e.clientY);

    // Clamp mouse position to image boundaries
    const mouseX = clamp(pos.x, 0, imageWidth());
    const mouseY = clamp(pos.y, 0, imageHeight());

    // Build the rect from the fixed anchor and the current mouse position.
    // min/max ensures correct rect even if the user drags past the anchor.
    let newX = Math.min(mouseX, anchorX);
    let newY = Math.min(mouseY, anchorY);
    let newWidth = Math.abs(mouseX - anchorX);
    let newHeight = Math.abs(mouseY - anchorY);

    // Ensure minimum dimensions (at least 1px)
    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);

    // Round dimensions to whole pixels
    newX = Math.round(newX);
    newY = Math.round(newY);
    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);

    // Update the slice
    updateSlice(sliceId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMove = (e: MouseEvent) => {
    if (isResizing() && resizeState()) {
      handleResize(e);
      return;
    }
    if (dragging()) {
      const newPan = {
        x: e.clientX - dragStart().x,
        y: e.clientY - dragStart().y,
      };
      setPan(newPan);
    } else if (draggedSlice()) {
      const pos = getScaledPosition(e.clientX, e.clientY);
      const slice = state.slices[draggedSlice()!.index];

      // Calculate new position, accounting for the offset within the slice where the drag started
      const newX = Math.round(pos.x - draggedSlice()!.offsetX);
      const newY = Math.round(pos.y - draggedSlice()!.offsetY);

      // Create an updated slice with the new position (maintaining the same width and height)
      const updatedSlice = {
        ...slice,
        x: newX,
        y: newY,
      };

      // Update the slice in the context
      updateSlice(slice.id, updatedSlice);
    }
  };

  const renderResizeHandles = (slice: SliceRect) => {
    if (focusedSliceId() !== slice.id) return null;

    // Make handle size responsive to zoom level, but with a minimum size

    // Base handle styles
    const handleStyle = createMemo(() => {
      const _size = Math.max(2, 4 / state.zoom);

      return {
        position: "absolute",
        width: `${_size}px`,
        height: `${_size}px`,
        "background-color": "#3b82f6",
        border: `${0.5 / state.zoom}px solid white`,
        "border-radius": "0", // Remove rounded corners for a pixelated look
        "image-rendering": "pixelated", // Add pixelated rendering
        "-webkit-image-rendering": "pixelated", // Safari support
        "-moz-image-rendering": "crisp-edges", // Firefox support
        "-ms-interpolation-mode": "nearest-neighbor", // IE support
        "box-shadow": `0 0 ${2 / state.zoom}px rgba(0,0,0,0.8)`, // Sharper shadow
        "z-index": "40",
      };
    });

    return (
      <>
        {/* NW handle - top left */}
        <div
          class="resize-handle"
          style={{
            ...handleStyle(),
            left: "0",
            top: "0",
            transform: `translate(-50%, -50%)`,
            cursor: "nwse-resize",
          }}
          onMouseDown={handleResizeStart(slice, "nw")}
          onMouseUp={handleResizeEnd}
        />

        {/* NE handle - top right */}
        <div
          class="resize-handle"
          style={{
            ...handleStyle(),
            right: "0",
            top: "0",
            transform: `translate(50%, -50%)`,
            cursor: "nesw-resize",
          }}
          onMouseDown={handleResizeStart(slice, "ne")}
          onMouseUp={handleResizeEnd}
        />

        {/* SW handle - bottom left */}
        <div
          class="resize-handle"
          style={{
            ...handleStyle(),
            left: "0",
            bottom: "0",
            transform: `translate(-50%, 50%)`,
            cursor: "nesw-resize",
          }}
          onMouseDown={handleResizeStart(slice, "sw")}
          onMouseUp={handleResizeEnd}
        />

        {/* SE handle - bottom right */}
        <div
          class="resize-handle"
          style={{
            ...handleStyle(),
            right: "0",
            bottom: "0",
            transform: `translate(50%, 50%)`,
            cursor: "nwse-resize",
          }}
          onMouseDown={handleResizeStart(slice, "se")}
          onMouseUp={handleResizeEnd}
        />
      </>
    );
  };

  const renderSlice = (slice: SliceRect) => {
    const isFocused = createMemo(() => focusedSliceId() === slice.id);

    return (
      <div
        class="absolute bg-blue-500/20"
        classList={{
          "border-2 border-blue-500 bg-blue-500/30": isFocused(),
        }}
        style={{
          left: `${slice.x}px`,
          top: `${slice.y}px`,
          width: `${slice.width}px`,
          height: `${slice.height}px`,
          "border-width": `${2 / state.zoom}px`,
          "border-style": "solid",
          "border-color": "rgb(59, 130, 246)",
          cursor: "move",
          "z-index": isFocused() ? 30 : 20, // Higher z-index for focused slices
        }}
        onClick={() => focusSlice(slice.id)}
      >
        {renderResizeHandles(slice)}
        <div
          class="absolute left-0 rounded bg-blue-600 px-1 py-0.5 text-white"
          style={{
            top: `${-24 / state.zoom}px`,
            "font-size": `${12 / state.zoom}px`,
            "line-height": `${16 / state.zoom}px`,
            padding: `${2 / state.zoom}px ${4 / state.zoom}px`,
            "border-radius": `${4 / state.zoom}px`,
          }}
        >
          {slice.name}
        </div>
      </div>
    );
  };

  const renderHorizontalRuler = () => {
    createEffect(() => {
      console.log("aowow", state.showRulers, imageWidth(), imageHeight());
    });
    return (
      <Show when={state.showRulers}>
        <div
          class="absolute bg-gray-900/80"
          style={{
            left: "0px",
            top: `-${20 / state.zoom}px`,
            width: `${imageWidth()}px`,
            height: `${20 / state.zoom}px`,
            "z-index": 10,
            "border-bottom": `${1 / state.zoom}px solid white`,
          }}
        >
          {/* Always show start position */}
          <div
            class="bg-white"
            style={{
              position: "absolute",
              left: "0px",
              bottom: "0px",
              width: `${1 / state.zoom}px`,
              height: `${10 / state.zoom}px`,
            }}
          />
          <div
            class="text-white"
            style={{
              position: "absolute",
              left: `${2 / state.zoom}px`,
              bottom: `${12 / state.zoom}px`,
              "font-size": `${8 / state.zoom}px`,
              "transform-origin": "left bottom",
            }}
          >
            0
          </div>

          <For each={horizontalTicks()}>
            {(tick) => (
              <>
                <div
                  class={tick.isMajor ? "bg-white" : "bg-gray-400"}
                  style={{
                    position: "absolute",
                    left: `${tick.x}px`,
                    bottom: "0px",
                    width: `${1 / state.zoom}px`,
                    height: `${tick.tickHeight / state.zoom}px`,
                  }}
                />
                {tick.label && (
                  <div
                    class="text-white"
                    style={{
                      position: "absolute",
                      left: `${tick.x + 2 / state.zoom}px`,
                      bottom: `${12 / state.zoom}px`,
                      "font-size": `${8 / state.zoom}px`,
                      "transform-origin": "left bottom",
                    }}
                  >
                    {tick.label}
                  </div>
                )}
              </>
            )}
          </For>

          {/* Always show end position */}
          <div
            class="bg-white"
            style={{
              position: "absolute",
              left: `${imageWidth()}px`,
              bottom: "0px",
              width: `${1 / state.zoom}px`,
              height: `${10 / state.zoom}px`,
            }}
          />
          <div
            class="text-white"
            style={{
              position: "absolute",
              left: `${imageWidth() + 2 / state.zoom}px`,
              bottom: `${12 / state.zoom}px`,
              "font-size": `${8 / state.zoom}px`,
              "transform-origin": "left bottom",
            }}
          >
            {imageWidth()}
          </div>
        </div>
      </Show>
    );
  };

  const renderVerticalRuler = () => {
    return (
      <Show when={state.showRulers}>
        <div
          class="absolute bg-gray-900/80"
          style={{
            left: `-${20 / state.zoom}px`,
            top: "0px",
            width: `${20 / state.zoom}px`,
            height: `${imageHeight()}px`,
            "z-index": 10,
            "border-right": `${1 / state.zoom}px solid white`,
          }}
        >
          {/* Always show start position */}
          <div
            class="bg-white"
            style={{
              position: "absolute",
              right: "0px",
              top: "0px",
              width: `${10 / state.zoom}px`,
              height: `${1 / state.zoom}px`,
            }}
          />
          <div
            class="text-white"
            style={{
              position: "absolute",
              right: `${12 / state.zoom}px`,
              top: `${2 / state.zoom}px`,
              "font-size": `${8 / state.zoom}px`,
              "transform-origin": "right top",
            }}
          >
            0
          </div>

          <For each={verticalTicks()}>
            {(tick) => (
              <>
                <div
                  class={tick.isMajor ? "bg-white" : "bg-gray-400"}
                  style={{
                    position: "absolute",
                    right: "0px",
                    top: `${tick.y}px`,
                    width: `${tick.tickWidth / state.zoom}px`,
                    height: `${1 / state.zoom}px`,
                  }}
                />
                {tick.label && (
                  <div
                    class="text-white"
                    style={{
                      position: "absolute",
                      right: `${12 / state.zoom}px`,
                      top: `${tick.y + 2 / state.zoom}px`,
                      "font-size": `${8 / state.zoom}px`,
                      "transform-origin": "right top",
                    }}
                  >
                    {tick.label}
                  </div>
                )}
              </>
            )}
          </For>

          {/* Always show end position */}
          <div
            class="bg-white"
            style={{
              position: "absolute",
              right: "0px",
              top: `${imageHeight()}px`,
              width: `${10 / state.zoom}px`,
              height: `${1 / state.zoom}px`,
            }}
          />
          <div
            class="text-white"
            style={{
              position: "absolute",
              right: `${12 / state.zoom}px`,
              top: `${imageHeight() + 2 / state.zoom}px`,
              "font-size": `${8 / state.zoom}px`,
              "transform-origin": "right top",
            }}
          >
            {imageHeight()}
          </div>
        </div>
      </Show>
    );
  };

  // Add this function near the top of your component
  const renderCheckerboard = () => {
    if (!imgRef()) return null;

    let [checkerboardRef, setCheckerboardRef] = createSignal<HTMLCanvasElement>();

    createEffect(() => {
      const canvas = checkerboardRef();
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = imageWidth();
      canvas.height = imageHeight();

      // Draw checkerboard pattern
      for (let y = 0; y < imageHeight(); y++) {
        for (let x = 0; x < imageWidth(); x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#ffffff" : "#d1d1d1";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    return (
      <canvas
        ref={setCheckerboardRef}
        class="absolute"
        style={{
          width: `${imageWidth()}px`,
          height: `${imageHeight()}px`,
          "z-index": -1,
          "pointer-events": "none",
          "image-rendering": "pixelated", // For modern browsers
          "-ms-interpolation-mode": "nearest-neighbor", // For IE
          "-webkit-image-rendering": "pixelated", // For Safari
          "-moz-image-rendering": "pixelated", // For Firefox
        }}
      />
    );
  };

  // Function to render the grid overlay
  const renderGrid = () => {
    if (!imgRef() || !state.showGrid) return null;

    const imageWidth = imgRef()!.naturalWidth;
    const imageHeight = imgRef()!.naturalHeight;
    const gridSize = state.gridSize;

    const verticalLines = [];
    const horizontalLines = [];

    // Vertical grid lines
    for (let x = gridSize; x < imageWidth; x += gridSize) {
      verticalLines.push(
        <div
          class="bg-purple-500/30"
          style={{
            position: "absolute",
            left: `${x}px`,
            top: "0px",
            width: `${1 / state.zoom}px`,
            height: `${imageHeight}px`,
          }}
        />
      );
    }

    // Horizontal grid lines
    for (let y = gridSize; y < imageHeight; y += gridSize) {
      horizontalLines.push(
        <div
          class="bg-purple-500/30"
          style={{
            position: "absolute",
            left: "0px",
            top: `${y}px`,
            width: `${imageWidth}px`,
            height: `${1 / state.zoom}px`,
          }}
        />
      );
    }

    return (
      <div class="absolute" style={{ "z-index": 5 }}>
        {verticalLines}
        {horizontalLines}
      </div>
    );
  };

  const handleEscapePress = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      blurSlice();
    }
  };

  // Add event listeners
  onMount(() => {
    if (canvasRef) {
      canvasRef.addEventListener("wheel", handleWheel, { passive: false });
      canvasRef.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("keydown", handleEscapePress);
    }
  });

  // Clean up event listeners
  onCleanup(() => {
    if (canvasRef) {
      canvasRef.removeEventListener("wheel", handleWheel);
      canvasRef.removeEventListener("mousedown", handleMouseDown);
    }
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("keydown", handleEscapePress);
    window.removeEventListener("keydown", handleEscapePress);
  });

  // Reset pan and zoom when the image changes, and flag for centering
  createEffect(() => {
    if (state.imageUrl) {
      setZoom(1);
      setShouldCenter(true);
    }
  });

  return (
    <div
      class="relative h-full w-full overflow-hidden select-none"
      style={{
        "background-color": "#2d2d2d",
        "background-image":
          "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
        "background-size": "20px 20px",
      }}
      ref={canvasRef}
    >
      <Show
        when={state.imageUrl}
        fallback={
          <div class="flex h-full w-full items-center justify-center text-gray-400">
            No image loaded
          </div>
        }
      >
        <div
          class="absolute origin-top-left"
          style={{
            transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
          }}
        >
          {/* Render checkerboard first */}
          {renderCheckerboard()}

          {/* Render grid overlay */}
          {renderGrid()}

          {/* Render rulers */}
          {renderHorizontalRuler()}
          {renderVerticalRuler()}
          <img
            ref={setImgRef}
            src={state.imageUrl!}
            alt="Sprite Atlas"
            class="max-w-none"
            style={{
              "image-rendering": state.pixelated ? "pixelated" : "auto",
            }}
            draggable={false}
          />

          {/* Display all existing slices */}
          {state.showSlices && <For each={state.slices}>{(slice) => renderSlice(slice)}</For>}

          {/* Display the selection rectangle while drawing */}
          <Show when={isDrawing()}>
            <div
              class="absolute bg-yellow-500/20"
              style={{
                left: `${Math.min(startPos().x, currentPos().x)}px`,
                top: `${Math.min(startPos().y, currentPos().y)}px`,
                width: `${Math.abs(currentPos().x - startPos().x)}px`,
                height: `${Math.abs(currentPos().y - startPos().y)}px`,
                "border-width": `${2 / state.zoom}px`,
                "border-style": "solid",
                "border-color": "rgb(234, 179, 8)",
              }}
            />
          </Show>
        </div>
      </Show>

      {/* Zoom and Pan Instructions */}
      <div class="font-mono-dm absolute right-3 bottom-3 border-2 border-black bg-white p-2.5 text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div class="mb-1.5 border-b-2 border-black pb-1 text-[10px] font-bold uppercase tracking-wider">Controls</div>
        <div class="space-y-0.5">
          <p><b>Draw:</b> Click + drag</p>
          <p><b>Pan:</b> Cmd + drag / Middle-mouse</p>
          <p><b>Zoom:</b> Scroll wheel</p>
        </div>
        <div class="mt-1.5 border-t border-gray-300 pt-1.5 space-y-0.5 text-gray-600">
          <p><b>Mode:</b> {state.pixelated ? "Pixelated" : "Smooth"}</p>
          <p><b>Slices:</b> {state.showSlices ? "Visible" : "Hidden"}</p>
          <p><b>Rulers:</b> {state.showRulers ? "Visible" : "Hidden"}</p>
          <p><b>Grid:</b> {state.showGrid ? `${state.gridSize}px` : "Hidden"}</p>
        </div>
      </div>
    </div>
  );
}
