import { SliceRect, useSpriteContext } from "@/lib/SpriteContext";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";

const RESIZE_HANDLE_SIZE = 8;

export default function SpriteCanvas() {
  const { state, addSlice, updateSlice, setZoom, setPan, focusSlice, focusedSliceId } =
    useSpriteContext();

  let canvasRef: HTMLDivElement | undefined;
  let imgRef: HTMLImageElement | undefined;

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

  // Calculate the actual scaled positions based on the zoom level and pan position
  const getScaledPosition = (clientX: number, clientY: number) => {
    if (!canvasRef || !imgRef) return { x: 0, y: 0 };

    const rect = canvasRef.getBoundingClientRect();
    const scaleX = imgRef.naturalWidth / imgRef.width;
    const scaleY = imgRef.naturalHeight / imgRef.height;

    const x = ((clientX - rect.left - state.pan.x) / state.zoom) * scaleX;
    const y = ((clientY - rect.top - state.pan.y) / state.zoom) * scaleY;

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
    if (e.button === 0) {
      // Left mouse button
      if (e.ctrlKey || e.metaKey) {
        // Pan mode with Ctrl/Cmd key
        setDragging(true);
        setDragStart({ x: e.clientX - state.pan.x, y: e.clientY - state.pan.y });
      } else {
        const pos = getScaledPosition(e.clientX, e.clientY);

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
        }

        // If not dragging a slice and in manual mode, start drawing a new slice
        if (state.sliceType === "manual") {
          setStartPos(pos);
          setCurrentPos(pos);
          setIsDrawing(true);
        }
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDrawing()) {
      setCurrentPos(getScaledPosition(e.clientX, e.clientY));
    } else if (dragging()) {
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

    const canvasRect = canvasRef!.getBoundingClientRect();
    const maxX = canvasRect.width - slice.x;
    const maxY = canvasRect.height - slice.y;

    let newWidth = slice.width;
    let newHeight = slice.height;
    let deltaWidth = 0;
    let deltaHeight = 0;

    // Calculate new dimensions with boundary constraints
    switch (corner) {
      case "nw":
        newWidth = Math.max(1, Math.min(slice.width + (slice.x - pos.x), maxX));
        newHeight = Math.max(1, Math.min(slice.height + (slice.y - pos.y), maxY));
        deltaWidth = slice.width - newWidth;
        deltaHeight = slice.height - newHeight;

        updateSlice(slice.id, {
          x: slice.x + Math.round(deltaWidth),
          y: slice.y + Math.round(deltaHeight), // Keep y position fixed
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
        break;
      case "ne":
        newWidth = Math.max(1, Math.min(slice.width + (pos.x - (slice.x + slice.width)), maxX));
        newHeight = Math.max(1, Math.min(slice.height + (slice.y - pos.y), maxY));
        deltaWidth = newWidth - slice.width;
        deltaHeight = slice.height - newHeight;

        updateSlice(slice.id, {
          x: slice.x, // Keep x position fixed
          y: slice.y + Math.round(deltaHeight),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
        break;
      case "sw":
        newWidth = Math.max(1, Math.min(slice.width + (slice.x - pos.x), maxX));
        newHeight = Math.max(1, Math.min(slice.height + (pos.y - (slice.y + slice.height)), maxY));
        deltaWidth = slice.width - newWidth;
        updateSlice(slice.id, {
          x: slice.x + Math.round(deltaWidth),
          y: slice.y, // Keep y position fixed
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
        break;
      case "se":
        newWidth = Math.max(1, Math.min(slice.width + (pos.x - (slice.x + slice.width)), maxX));
        newHeight = Math.max(1, Math.min(slice.height + (pos.y - (slice.y + slice.height)), maxY));
        updateSlice(slice.id, {
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
        break;
    }

    // Maintain aspect ratio when Shift key is held
    if (e.shiftKey) {
      const aspectRatio = slice.width / slice.height;
      if (Math.abs(pos.x - slice.x) > Math.abs(pos.y - slice.y)) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    // Update slice dimensions
    updateSlice(slice.id, {
      width: Math.max(1, Math.round(newWidth)),
      height: Math.max(1, Math.round(newHeight)),
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

    const handleStyle = {
      position: "absolute",
      width: `${RESIZE_HANDLE_SIZE / state.zoom}px`,
      height: `${RESIZE_HANDLE_SIZE / state.zoom}px`,
      backgroundColor: "#3b82f6",
      border: "1px solid white",
      borderRadius: "50%",
      transform: "translate(-50%, -50%)",
    };

    return (
      <>
        {/* NW handle */}
        <div
          style={{
            ...handleStyle,
            left: `-${RESIZE_HANDLE_SIZE / 2 / state.zoom}px`,
            top: `-${RESIZE_HANDLE_SIZE / 2 / state.zoom}px`,
            cursor: "nwse-resize",
          }}
          onMouseDown={handleResizeStart(slice, "nw")}
          onMouseUp={handleResizeEnd}
        />
        {/* NE handle */}
        <div
          style={{
            ...handleStyle,
            left: `calc(100% - ${RESIZE_HANDLE_SIZE / 2 / state.zoom}px)`,
            top: `-${RESIZE_HANDLE_SIZE / 2 / state.zoom}px`,
            cursor: "nesw-resize",
          }}
          onMouseDown={handleResizeStart(slice, "ne")}
          onMouseUp={handleResizeEnd}
        />
        {/* SW handle */}
        <div
          style={{
            ...handleStyle,
            left: `-${RESIZE_HANDLE_SIZE / 2 / state.zoom}px`,
            top: `calc(100% - ${RESIZE_HANDLE_SIZE / 2 / state.zoom}px)`,
            cursor: "nesw-resize",
          }}
          onMouseDown={handleResizeStart(slice, "sw")}
          onMouseUp={handleResizeEnd}
        />
        {/* SE handle */}
        <div
          style={{
            ...handleStyle,
            left: `calc(100% - ${RESIZE_HANDLE_SIZE / 2 / state.zoom}px)`,
            top: `calc(100% - ${RESIZE_HANDLE_SIZE / 2 / state.zoom}px)`,
            cursor: "nwse-resize",
          }}
          onMouseDown={handleResizeStart(slice, "se")}
          onMouseUp={handleResizeEnd}
        />
      </>
    );
  };

  const renderSlice = (slice: SliceRect) => (
    <div
      class="absolute bg-blue-500/20"
      classList={{
        "border-2 border-blue-500": focusedSliceId() === slice.id,
        "bg-blue-500/30": focusedSliceId() === slice.id,
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
      }}
      onClick={() => focusSlice(slice.id)}
    >
      {renderResizeHandles(slice)}
      <div
        class="absolute left-0 bg-blue-600 text-white px-1 py-0.5 rounded"
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

  // Add event listeners
  onMount(() => {
    if (canvasRef) {
      canvasRef.addEventListener("wheel", handleWheel, { passive: false });
      canvasRef.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  });

  // Clean up event listeners
  onCleanup(() => {
    if (canvasRef) {
      canvasRef.removeEventListener("wheel", handleWheel);
      canvasRef.removeEventListener("mousedown", handleMouseDown);
    }
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleMouseUp);
  });

  // Reset pan and zoom when the image changes
  createEffect(() => {
    if (state.imageUrl) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  });

  // Function to render horizontal ruler markings
  const renderHorizontalRuler = () => {
    if (!imgRef || !state.showRulers) return null;

    const imageWidth = imgRef.naturalWidth;
    const rulerHeight = 20;
    const majorTickInterval = 50; // Major tick every 50 pixels
    const minorTickInterval = 10; // Minor tick every 10 pixels

    const ticks = [];

    // Determine a good interval based on zoom level
    const step = state.zoom < 0.5 ? 100 : state.zoom < 1 ? 50 : 10;

    for (let x = 0; x <= imageWidth; x += step) {
      const isMajor = x % majorTickInterval === 0;
      const tickHeight = isMajor ? rulerHeight / 2 : rulerHeight / 4;

      ticks.push(
        <div
          class={isMajor ? "bg-white" : "bg-gray-400"}
          style={{
            position: "absolute",
            left: `${x}px`,
            top: "0px",
            width: `${1 / state.zoom}px`,
            height: `${tickHeight / state.zoom}px`,
          }}
        />
      );

      if (isMajor && state.zoom >= 0.5) {
        ticks.push(
          <div
            class="text-white"
            style={{
              position: "absolute",
              left: `${x + 2 / state.zoom}px`,
              top: "0px",
              "font-size": `${8 / state.zoom}px`,
              "transform-origin": "left top",
            }}
          >
            {x}
          </div>
        );
      }
    }

    return (
      <div
        class="absolute bg-gray-900/80"
        style={{
          left: "0px",
          top: "0px",
          width: `${imageWidth}px`,
          height: `${rulerHeight / state.zoom}px`,
          "z-index": 10,
        }}
      >
        {ticks}
      </div>
    );
  };

  // Function to render vertical ruler markings
  const renderVerticalRuler = () => {
    if (!imgRef || !state.showRulers) return null;

    const imageHeight = imgRef.naturalHeight;
    const rulerWidth = 20;
    const majorTickInterval = 50; // Major tick every 50 pixels
    const minorTickInterval = 10; // Minor tick every 10 pixels

    const ticks = [];

    // Determine a good interval based on zoom level
    const step = state.zoom < 0.5 ? 100 : state.zoom < 1 ? 50 : 10;

    for (let y = 0; y <= imageHeight; y += step) {
      const isMajor = y % majorTickInterval === 0;
      const tickWidth = isMajor ? rulerWidth / 2 : rulerWidth / 4;

      ticks.push(
        <div
          class={isMajor ? "bg-white" : "bg-gray-400"}
          style={{
            position: "absolute",
            left: "0px",
            top: `${y}px`,
            width: `${tickWidth / state.zoom}px`,
            height: `${1 / state.zoom}px`,
          }}
        />
      );

      if (isMajor && state.zoom >= 0.5) {
        ticks.push(
          <div
            class="text-white"
            style={{
              position: "absolute",
              left: "0px",
              top: `${y + 2 / state.zoom}px`,
              "font-size": `${8 / state.zoom}px`,
              "transform-origin": "left top",
            }}
          >
            {y}
          </div>
        );
      }
    }

    return (
      <div
        class="absolute bg-gray-900/80"
        style={{
          left: "0px",
          top: "0px",
          width: `${rulerWidth / state.zoom}px`,
          height: `${imageHeight}px`,
          "z-index": 10,
        }}
      >
        {ticks}
      </div>
    );
  };

  // Function to render the grid overlay
  const renderGrid = () => {
    if (!imgRef || !state.showGrid) return null;

    const imageWidth = imgRef.naturalWidth;
    const imageHeight = imgRef.naturalHeight;
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

  return (
    <div class="relative h-full w-full overflow-hidden bg-gray-800 select-none" ref={canvasRef}>
      <Show
        when={state.imageUrl}
        fallback={
          <div class="h-full w-full flex items-center justify-center text-gray-400">
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
          {/* Render grid overlay */}
          {renderGrid()}

          {/* Render rulers */}
          {renderHorizontalRuler()}
          {renderVerticalRuler()}
          <img
            ref={imgRef}
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
      <div class="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded text-xs space-y-1">
        <p>
          🖱️ <b>Draw Rectangle:</b> Click and drag
        </p>
        <p>
          ⌨️ <b>Pan:</b> Ctrl/Cmd + Click and drag
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
