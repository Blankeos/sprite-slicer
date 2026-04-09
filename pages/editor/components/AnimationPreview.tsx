import { IconPause, IconPlay } from "@/assets/icons";
import { useSpriteContext, SliceRect } from "@/lib/SpriteContext";
import { Show, createSignal, createEffect, onCleanup, createMemo } from "solid-js";

export default function AnimationPreview() {
  const { state, selectedSlicesOrdered } = useSpriteContext();

  const slices = createMemo(() => selectedSlicesOrdered());
  const showPreview = createMemo(() => slices().length >= 2);

  return (
    <Show when={showPreview()}>
      <AnimationPlayer slices={slices()} imageUrl={state.imageUrl} />
    </Show>
  );
}

function AnimationPlayer(props: { slices: SliceRect[]; imageUrl: string | null }) {
  let canvasRef: HTMLCanvasElement | undefined;
  const [frameIndex, setFrameIndex] = createSignal(0);
  const [fps, setFps] = createSignal(8);
  const [playing, setPlaying] = createSignal(true);

  // Determine canvas display size from the largest slice
  const maxDimensions = createMemo(() => {
    let maxW = 0;
    let maxH = 0;
    for (const s of props.slices) {
      if (s.width > maxW) maxW = s.width;
      if (s.height > maxH) maxH = s.height;
    }
    return { width: maxW, height: maxH };
  });

  // Scale to fit within preview box (max 128px)
  const displaySize = createMemo(() => {
    const { width, height } = maxDimensions();
    if (width === 0 || height === 0) return { width: 128, height: 128, scale: 1 };
    const maxDisplay = 128;
    const scale = Math.min(maxDisplay / width, maxDisplay / height, 4);
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      scale,
    };
  });

  // Animation loop
  createEffect(() => {
    const count = props.slices.length;
    const isPlaying = playing();
    const speed = fps();
    if (!isPlaying || count === 0) return;

    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % count);
    }, 1000 / speed);

    onCleanup(() => clearInterval(interval));
  });

  // Reset frame index when slices change
  createEffect(() => {
    const count = props.slices.length;
    setFrameIndex((i) => (count > 0 ? i % count : 0));
  });

  // Render current frame
  createEffect(() => {
    const slice = props.slices[frameIndex()];
    const imageUrl = props.imageUrl;
    if (!slice || !imageUrl || !canvasRef) return;

    const { width, height } = maxDimensions();
    const canvas = canvasRef;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      // Center the slice if it's smaller than the max
      const dx = Math.floor((width - slice.width) / 2);
      const dy = Math.floor((height - slice.height) / 2);
      ctx.drawImage(
        img,
        slice.x,
        slice.y,
        slice.width,
        slice.height,
        dx,
        dy,
        slice.width,
        slice.height
      );
    };
    img.src = imageUrl;
  });

  return (
    <div
      class="fixed right-4 top-4 z-50 flex flex-col items-center gap-2 rounded-lg border-2 border-black bg-white p-3 shadow-[4px_4px_0px_0px_black]"
      style={{ "min-width": "160px" }}
    >
      <div class="flex w-full items-center justify-between">
        <span class="font-mono-dm text-[10px] font-bold uppercase tracking-wider text-black/50">
          Preview
        </span>
        <span class="font-mono-dm text-[10px] text-black/40">
          {frameIndex() + 1}/{props.slices.length}
        </span>
      </div>

      {/* Checkerboard background behind the canvas */}
      <div
        class="flex items-center justify-center overflow-hidden border border-black"
        style={{
          width: `${displaySize().width}px`,
          height: `${displaySize().height}px`,
          background:
            "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 8px 8px",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${displaySize().width}px`,
            height: `${displaySize().height}px`,
            "image-rendering": "pixelated",
          }}
        />
      </div>

      {/* Controls */}
      <div class="flex w-full items-center gap-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-black bg-yellow-200 text-xs font-bold transition-colors hover:bg-yellow-300"
          title={playing() ? "Pause" : "Play"}
        >
          {playing() ? <IconPause class="h-3 w-3" /> : <IconPlay class="h-3 w-3" />}
        </button>

        <div class="flex flex-1 items-center gap-1.5">
          <input
            type="range"
            min="1"
            max="30"
            value={fps()}
            onInput={(e) => setFps(parseInt(e.target.value))}
            class="h-1 w-full cursor-pointer accent-violet-500"
          />
          <span class="font-mono-dm w-10 shrink-0 text-right text-[10px] font-medium text-black/60">
            {fps()} fps
          </span>
        </div>
      </div>
    </div>
  );
}
