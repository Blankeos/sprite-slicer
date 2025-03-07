import { SliceRect, useSpriteContext } from "@/lib/SpriteContext";
import { clamp } from "@/utils/clamp";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";

const RESIZE_HANDLE_SIZE = 8;

export default function SpriteCanvas() {
  const { state, addSlice, updateSlice, setZoom, setPan, focusSlice, focusedSliceId, blurSlice } =
    useSpriteContext();

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
    slice: SliceRect;
    corner: "nw" | "ne" | "sw" | "se";
  } | null>(null);

  const [imageWidth, setImageWidth] = createSignal(0);
  const [imageHeight, setImageHeight] = createSignal(0);

  createEffect(() => {
    if (imgRef()) {
      imgRef()!.onload = () => {
        setImageWidth(imgRef()!.naturalWidth);
        setImageHeight(imgRef()!.naturalHeight);
      };
    }
  });

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
      if (width > 5 && height > 5) {
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
      setResizeState({ slice, corner });
    };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeState(null);
  };

  const handleResize = (e: MouseEvent, slice: SliceRect, corner: "nw" | "ne" | "sw" | "se") => {
    e.stopPropagation();
    const pos = getScaledPosition(e.clientX, e.clientY);

    // Clamp position to image boundaries
    const clampedPos = {
      x: clamp(pos.x, 0, imageWidth()),
      y: clamp(pos.y, 0, imageHeight()),
    };

    let newX = slice.x;
    let newY = slice.y;
    let newWidth = slice.width;
    let newHeight = slice.height;

    // Calculate new dimensions based on the corner being dragged
    switch (corner) {
      case "nw":
        // Northwest: adjust x, y, width, and height
        newWidth = slice.x + slice.width - clampedPos.x;
        newHeight = slice.y + slice.height - clampedPos.y;
        newX = clampedPos.x;
        newY = clampedPos.y;
        break;

      case "ne":
        // Northeast: adjust y, width, and height
        newWidth = clampedPos.x - slice.x;
        newHeight = slice.y + slice.height - clampedPos.y;
        newY = clampedPos.y;
        break;

      case "sw":
        // Southwest: adjust x, width, and height
        newWidth = slice.x + slice.width - clampedPos.x;
        newHeight = clampedPos.y - slice.y;
        newX = clampedPos.x;
        break;

      case "se":
        // Southeast: adjust width and height
        newWidth = clampedPos.x - slice.x;
        newHeight = clampedPos.y - slice.y;
        break;
    }

    // Ensure minimum dimensions (at least 1px)
    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);

    // Ensure the slice stays within image boundaries
    // If x + width exceeds image width, adjust width
    if (newX + newWidth > imageWidth()) {
      newWidth = imageWidth() - newX;
    }

    // If y + height exceeds image height, adjust height
    if (newY + newHeight > imageHeight()) {
      newHeight = imageHeight() - newY;
    }

    // Maintain aspect ratio when Shift key is held
    if (e.shiftKey) {
      const aspectRatio = slice.width / slice.height;

      if (["ne", "sw"].includes(corner)) {
        // For corners where dragging direction is inverted,
        // use a different calculation approach
        if (Math.abs(newWidth / newHeight - aspectRatio) > 0.1) {
          if (newWidth / aspectRatio < imageHeight() - newY) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }
      } else {
        // For normal corners
        if (Math.abs(newWidth / newHeight - aspectRatio) > 0.1) {
          if (newWidth / aspectRatio < imageHeight() - newY) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }
      }
    }

    // Round dimensions to whole pixels
    newX = Math.round(newX);
    newY = Math.round(newY);
    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);

    // Update the slice
    updateSlice(slice.id, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMove = (e: MouseEvent) => {
    if (isResizing() && resizeState()) {
      handleResize(e, resizeState()!.slice, resizeState()!.corner);
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

  // Reset pan and zoom when the image changes
  createEffect(() => {
    if (state.imageUrl) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  });

  return (
    <div
      class="relative h-full w-full overflow-hidden bg-gray-800 select-none"
      // style={{
      //   "background-image":
      //     "linear-gradient(45deg, #666666 25%, transparent 25%), linear-gradient(-45deg, #666666 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #666666 75%), linear-gradient(-45deg, transparent 75%, #666666 75%)",
      //   "background-size": `${Math.max(16, 20 / state.zoom)}px ${Math.max(16, 20 / state.zoom)}px`,
      //   "background-position": `0 0, 0 ${Math.max(8, 10 / state.zoom)}px, ${Math.max(8, 10 / state.zoom)}px -${Math.max(8, 10 / state.zoom)}px, -${Math.max(8, 10 / state.zoom)}px 0px`,
      //   "background-color": "#888888",
      // }}
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
      <div class="absolute right-4 bottom-4 space-y-1 rounded bg-black/50 p-2 text-xs text-white">
        <p>
          🖱️ <b>Draw Rectangle:</b> Click and drag
        </p>
        <p>
          ⌨️ <b>Pan:</b> Ctrl/Cmd + Drag OR Middle-mouse + drag
        </p>
        <p>
          🖲️ <b>Zoom:</b> Mouse wheel
        </p>
        <p>
          🔍 <b>Mode:</b> {state.pixelated ? "Pixelated" : "Smooth"}
        </p>
        <p>
          👁️ <b>Slices:</b> {state.showSlices ? "Visible" : "Hidden"}
        </p>
        <p>
          📏 <b>Rulers:</b> {state.showRulers ? "Visible" : "Hidden"}
        </p>
        <p>
          #️⃣ <b>Grid:</b> {state.showGrid ? `${state.gridSize}px` : "Hidden"}
        </p>
      </div>
    </div>
  );
}
