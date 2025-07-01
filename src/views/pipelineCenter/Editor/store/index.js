import {
  useProvideGraph,
  useGraph,
  useProvideNodeData,
  useNodeData,
  useProvideCell,
  useCell,
} from './graph';

import {
  readOnly,
  useSetState,
  useGetState,
  useSetSocketInstance,
  useSocketInstance,
  useInitWebsocket,

  useProvideDebugResult,
  useDebugResult,
} from "./pipeline"

export {
  useProvideGraph,
  useGraph,
  useProvideNodeData,
  useNodeData,
  useProvideCell,
  useCell,

  useProvideDebugResult,
  useDebugResult,

  // pipeline
  useSetState,
  useGetState,
  useSetSocketInstance,
  useSocketInstance,
  useInitWebsocket,

  // 
  readOnly,
}

/**
 * @description: reset state
 */
export function useResetState() {
  useSetSocketInstance(null);
  useProvideGraph(null);
  useProvideNodeData();
  useProvideCell();
  useDebugResult();
}