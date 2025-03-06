import { createContext, createSignal, JSX, useContext } from "solid-js";
import { createStore } from "solid-js/store";

// Define types for our slices
export type SliceType = "manual" | "grid" | "pixel";
export type SliceRect = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Define state shape
type SpriteState = {
  image: File | null;
  imageUrl: string | null;
  sliceType: SliceType;
  gridRows: number;
  gridCols: number;
  pixelWidth: number;
  pixelHeight: number;
  slices: SliceRect[];
  zoom: number;
  pan: { x: number; y: number };
  showSlices: boolean;
  pixelated: boolean;
  showRulers: boolean;
  showGrid: boolean;
  gridSize: number;
  selectedSliceId: string | null;
  focusedSliceId: string | null;
};

// Define context functions
type SpriteContextValue = {
  state: SpriteState;
  setImage: (file: File) => void;
  clearImage: () => void;
  setSliceType: (type: SliceType) => void;
  setGridDimensions: (rows: number, cols: number) => void;
  setPixelDimensions: (width: number, height: number) => void;
  addSlice: (slice: Omit<SliceRect, "id" | "name">) => void;
  updateSlice: (id: string, slice: Partial<SliceRect>) => void;
  removeSlice: (id: string) => void;
  clearSlices: () => void;
  generateSlices: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleSliceVisibility: () => void;
  togglePixelated: () => void;
  toggleRulers: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  selectSlice: (id: string | null) => void;
  getSelectedSlice: () => SliceRect | null;
  selectedSlice: () => SliceRect | null;
  setSelectedSlice: (slice: SliceRect | null) => void;
  updateSliceDimensions: (id: string, width: number, height: number) => void;
  focusSlice: (id: string) => void;
  blurSlice: () => void;
  focusedSliceId: () => string | null;
};

// Create the context
const SpriteContext = createContext<SpriteContextValue>();

// Create the provider component
export function SpriteProvider(props: { children: JSX.Element }) {
  const [state, setState] = createStore<SpriteState>({
    image: null,
    imageUrl: null,
    sliceType: "grid",
    gridRows: 4,
    gridCols: 4,
    pixelWidth: 32,
    pixelHeight: 32,
    slices: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    showSlices: true,
    pixelated: true,
    showRulers: true,
    showGrid: false,
    gridSize: 16,
    selectedSliceId: null,
    focusedSliceId: null,
  });

  const [selectedSlice, setSelectedSlice] = createSignal<SliceRect | null>(null);
  const [focusedSliceId, setFocusedSliceId] = createSignal<string | null>(null);

  // Helper to generate a unique slice name
  const generateSliceName = () => {
    const index = state.slices.length;
    return `slice${index.toString().padStart(2, "0")}`;
  };

  // Action functions
  const setImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setState({
      image: file,
      imageUrl: url,
      slices: [],
    });
  };

  const clearImage = () => {
    if (state.imageUrl) {
      URL.revokeObjectURL(state.imageUrl);
    }
    setState({
      image: null,
      imageUrl: null,
      slices: [],
    });
  };

  const setSliceType = (type: SliceType) => {
    setState({ sliceType: type });
  };

  const setGridDimensions = (rows: number, cols: number) => {
    setState({ gridRows: rows, gridCols: cols });
    if (state.sliceType === "grid") {
      generateSlices();
    }
  };

  const setPixelDimensions = (width: number, height: number) => {
    setState({ pixelWidth: width, pixelHeight: height });
    if (state.sliceType === "pixel") {
      generateSlices();
    }
  };

  const addSlice = (slice: Omit<SliceRect, "id" | "name">) => {
    const id = crypto.randomUUID();
    const name = generateSliceName();
    setState("slices", (slices) => [...slices, { ...slice, id, name }]);
  };

  const updateSlice = (id: string, slice: Partial<SliceRect>) => {
    const index = state.slices.findIndex((item) => item.id === id);
    if (index >= 0) {
      setState("slices", index, (prev) => ({ ...prev, ...slice }));
    }
  };

  const removeSlice = (id: string) => {
    setState("slices", (slices) => slices.filter((s) => s.id !== id));
  };

  const clearSlices = () => {
    setState("slices", []);
  };

  const generateSlices = () => {
    if (!state.imageUrl || !state.image) return;

    clearSlices();

    const img = new Image();
    img.src = state.imageUrl;
    img.onload = () => {
      const { width, height } = img;

      if (state.sliceType === "grid") {
        const cellWidth = Math.floor(width / state.gridCols);
        const cellHeight = Math.floor(height / state.gridRows);

        for (let row = 0; row < state.gridRows; row++) {
          for (let col = 0; col < state.gridCols; col++) {
            const id = crypto.randomUUID();
            const name = `slice${(row * state.gridCols + col).toString().padStart(2, "0")}`;

            setState("slices", (slices) => [
              ...slices,
              {
                id,
                name,
                x: col * cellWidth,
                y: row * cellHeight,
                width: cellWidth,
                height: cellHeight,
              },
            ]);
          }
        }
      } else if (state.sliceType === "pixel") {
        const cols = Math.floor(width / state.pixelWidth);
        const rows = Math.floor(height / state.pixelHeight);

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const id = crypto.randomUUID();
            const name = `slice${(row * cols + col).toString().padStart(2, "0")}`;

            setState("slices", (slices) => [
              ...slices,
              {
                id,
                name,
                x: col * state.pixelWidth,
                y: row * state.pixelHeight,
                width: state.pixelWidth,
                height: state.pixelHeight,
              },
            ]);
          }
        }
      }
    };
  };

  const setZoom = (zoom: number) => {
    setState({ zoom });
  };

  const setPan = (pan: { x: number; y: number }) => {
    setState({ pan });
  };

  const toggleSliceVisibility = () => {
    setState("showSlices", (show) => !show);
  };

  const togglePixelated = () => {
    setState("pixelated", (pixelated) => !pixelated);
  };

  const toggleRulers = () => {
    setState("showRulers", (show) => !show);
  };

  const toggleGrid = () => {
    setState("showGrid", (show) => !show);
  };

  const setGridSize = (size: number) => {
    setState("gridSize", size);
  };

  const selectSlice = (id: string | null) => {
    setState("selectedSliceId", id);
  };

  const getSelectedSlice = () => {
    if (!state.selectedSliceId) return null;
    return state.slices.find((slice) => slice.id === state.selectedSliceId) || null;
  };

  const focusSlice = (id: string) => {
    setFocusedSliceId(id);
  };

  const blurSlice = () => {
    setFocusedSliceId(null);
  };

  const updateSliceDimensions = (id: string, width: number, height: number) => {
    setState("slices", (slices) =>
      slices.map((slice) => (slice.id === id ? { ...slice, width, height } : slice))
    );
  };

  return (
    <SpriteContext.Provider
      value={{
        state,
        setImage,
        clearImage,
        setSliceType,
        setGridDimensions,
        setPixelDimensions,
        addSlice,
        updateSlice,
        removeSlice,
        clearSlices,
        generateSlices,
        setZoom,
        setPan,
        toggleSliceVisibility,
        togglePixelated,
        toggleRulers,
        toggleGrid,
        setGridSize,
        selectSlice,
        getSelectedSlice,
        selectedSlice,
        setSelectedSlice,
        updateSliceDimensions,
        focusSlice,
        blurSlice,
        focusedSliceId,
      }}
    >
      {props.children}
    </SpriteContext.Provider>
  );
}

// Create a hook for using the context
export function useSpriteContext() {
  const context = useContext(SpriteContext);
  if (!context) {
    throw new Error("useSpriteContext must be used within a SpriteProvider");
  }
  return context;
}
