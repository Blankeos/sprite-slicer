/* =========================================================================
   Drag-and-Drop API – Usage Guide
   =========================================================================
   1.  Wrap your tree once with `DragAndDropProvider`.
       - `instanceId`               : unique string for this provider
       - `onDrop`                   : (payload) => void – receives the drop

   2.  Make something draggable → `DraggableItem`
       - `id`                       : unique within this provider
       - `type`                     : string, defaults to "item"
       - `data`                     : any serialisable payload you need back
       - `children`                 : render prop (state, ref) => JSX
            * `state()`             : 'idle' | 'dragging' | 'over'
            * `ref(el)`             : attach the DOM node

   3.  Make something accept drops → `Droppable`
       - `id`                       : unique within this provider
       - `type`                     : string | string[], defaults to "item"
       - `data`                     : any payload you want back when you
                                      look up the target in `onDrop`
       - `canDrop(sourceData)`      : optional guard
       - `children`                 : same render prop signature as above
*/

import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import {
  type Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type FlowProps,
  type JSX,
  onCleanup,
  useContext,
} from "solid-js"

/* ---------- 1. Context ---------- */

export type OnDropEvent = {
  sourceId: string | number
  targetId: string | number
  sourceData: any
  targetData: any
  sourceInstanceId: string | null
  targetInstanceId: string | null
}

export type OnDropHandler = (event: OnDropEvent) => void

type DragAndDropContextValue = {
  instanceId: string
  registry: Map<string | number, { id: string | number; data: any }>
}

const DragAndDropContext = createContext<DragAndDropContextValue>()

export const useDragAndDropContext = () => {
  const ctx = useContext(DragAndDropContext)
  if (!ctx) throw new Error("useDragAndDropContext must be used within <DragAndDropProvider>")
  return ctx
}

type DragAndDropProviderProps = {
  instanceId?: string
  onDrop?: OnDropHandler
  onDropTargetChange?: OnDropHandler
}

export const DragAndDropProvider = (props: FlowProps<DragAndDropProviderProps>) => {
  const instanceId = createMemo(
    () => props.instanceId ?? `draginstance-${Math.random().toString(36).substring(2, 9)}`
  )

  const registry = new Map<string | number, { id: string | number; data: any }>()

  createEffect(() => {
    onCleanup(
      monitorForElements({
        canMonitor: ({ source }) => {
          const s = source.data as { instanceId: string }
          return s.instanceId === instanceId()
        },
        onDropTargetChange: ({ source, location }) => {
          if (!props.onDropTargetChange) return
          const target = location.current.dropTargets[0]
          if (!target) return

          const sourceId = (source.data as { id: string | number }).id
          const targetId = (target.data as { id: string | number }).id

          if (sourceId === undefined || targetId === undefined) return

          const sourceEntry = registry.get(sourceId)
          const targetEntry = registry.get(targetId)

          props.onDropTargetChange({
            sourceId,
            targetId,
            sourceData: sourceEntry?.data,
            targetData: targetEntry?.data,
            sourceInstanceId: (source.data as { instanceId: string }).instanceId,
            targetInstanceId: instanceId(),
          })
        },
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets[0]
          if (!target) return

          const sourceId = (source.data as { id: string | number }).id
          const targetId = (target.data as { id: string | number }).id

          if (sourceId === undefined || targetId === undefined) return

          const sourceEntry = registry.get(sourceId)
          const targetEntry = registry.get(targetId)

          props.onDrop?.({
            sourceId,
            targetId,
            sourceData: sourceEntry?.data,
            targetData: targetEntry?.data,
            sourceInstanceId: (source.data as { instanceId: string }).instanceId,
            targetInstanceId: instanceId(),
          })
        },
      })
    )
  })

  const contextValue: DragAndDropContextValue = {
    // eslint-disable-next-line solid/reactivity
    instanceId: instanceId(),
    registry: registry,
  }

  return (
    <DragAndDropContext.Provider value={contextValue}>{props.children}</DragAndDropContext.Provider>
  )
}

/* ---------- 2. Building Blocks ---------- */

export type DragState = "idle" | "dragging" | "over"

export const DraggableItem = (props: {
  id: string | number
  type?: string
  data?: any
  dropTargetType?: string | string[]
  dropTargetCanDrop?: (sourceData: any) => boolean
  /** @defaultValue true */
  enableDropTarget?: boolean
  children: (state: Accessor<DragState>, ref: (el: HTMLElement) => void) => JSX.Element
}) => {
  const [state, setState] = createSignal<DragState>("idle")
  let ref!: HTMLElement
  const { instanceId, registry } = useDragAndDropContext()

  createEffect(() => {
    registry.set(props.id, { id: props.id, data: props.data })
    onCleanup(() => registry.delete(props.id))
  })

  createEffect(() => {
    onCleanup(
      combine(
        draggable({
          element: ref,
          getInitialData: () => ({
            id: props.id,
            type: props.type || "item",
            instanceId,
            data: props.data,
          }),
          onDragStart: () => setState("dragging"),
          onDrag: () => setState("dragging"),
          onDrop: () => setState("idle"),
        }),
        ...(props.enableDropTarget !== false
          ? [
              dropTargetForElements({
                element: ref,
                getData: () => ({ id: props.id }),
                getIsSticky: () => true,
                canDrop: ({ source }) => {
                  const s = source.data as {
                    id: string | number
                    type: string
                    instanceId: string
                    data: any
                  }
                  if (s.instanceId !== instanceId) return false

                  const types = Array.isArray(props.dropTargetType)
                    ? props.dropTargetType
                    : [props.dropTargetType || "item"]
                  if (!types.includes(s.type)) return false

                  if (props.dropTargetCanDrop) return props.dropTargetCanDrop(s.data)
                  return true
                },
                onDragEnter: () => setState("over"),
                onDragLeave: () => setState("idle"),
                onDrop: () => setState("idle"),
              }),
            ]
          : [])
      )
    )
  })

  // eslint-disable-next-line solid/reactivity
  return props.children(state, (el) => (ref = el))
}

export const Droppable = (props: {
  id: string | number
  type?: string | string[]
  data?: any
  canDrop?: (sourceData: any) => boolean
  children: (state: Accessor<DragState>, ref: (el: HTMLElement) => void) => JSX.Element
}) => {
  const [state, setState] = createSignal<DragState>("idle")
  let ref!: HTMLElement
  const { instanceId, registry } = useDragAndDropContext()

  createEffect(() => {
    registry.set(props.id, { id: props.id, data: props.data })
    onCleanup(() => registry.delete(props.id))
  })

  createEffect(() => {
    onCleanup(
      combine(
        dropTargetForElements({
          element: ref,
          getData: () => ({ id: props.id }),
          getIsSticky: () => true,
          canDrop: ({ source }) => {
            const s = source.data as {
              id: string | number
              type: string
              instanceId: string
              data: any
            }
            if (s.instanceId !== instanceId) return false

            const types = Array.isArray(props.type) ? props.type : [props.type || "item"]
            if (!types.includes(s.type)) return false

            if (props.canDrop) return props.canDrop(s.data)
            return true
          },
          onDragEnter: () => setState("over"),
          onDragLeave: () => setState("idle"),
          onDrop: () => setState("idle"),
        })
      )
    )
  })

  // eslint-disable-next-line solid/reactivity
  return props.children(state, (el) => (ref = el))
}

/* ---------- 3. Auto-scroll helper ---------- */
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element"

type AutoScrollOptions = {
  canScroll?: (args: { source: any }) => boolean
}

export const useAutoScroll = (opts?: AutoScrollOptions) => {
  let ref: HTMLElement

  createEffect(() => {
    const { canScroll = () => true } = opts ?? { canScroll: () => true }
    if (!ref) return

    onCleanup(
      autoScrollForElements({
        element: ref,
        canScroll: canScroll,
      })
    )
  })

  return (el: HTMLElement) => (ref = el)
}
