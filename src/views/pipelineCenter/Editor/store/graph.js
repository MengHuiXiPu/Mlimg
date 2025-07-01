import { reactive, computed } from "vue";

const state = reactive({
    graph: null,
    nodeData: {}, //挂载在当前选中节点的业务数据 data对象
    cell: {}, //当前选中的cell
})

export function useProvideGraph(graph) {
    state.graph = graph
}

export function useGraph() {
    return computed(() => state.graph)
}
// 选中节点时更新，取消选中或选中连线时清空
export function useProvideNodeData(nodeData = {}) {
    state.nodeData = nodeData
}

export function useNodeData() {
    return computed(() => state.nodeData)
}

export function useProvideCell(cell = {}) {
    state.cell = cell
}

export function useCell() {
    return computed(() => state.cell)
}