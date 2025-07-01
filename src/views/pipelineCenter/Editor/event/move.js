export default (graph) => {
  const recordMap = new Map()
  // 节点开始移动时
  graph.on("node:move", ({ node }) => {
    // console.log("开始移动", node)
    if (node.getParent()) {    //移动前在父节点内，需要记录
      recordMap.set(node.id, node.getParent().id)
    }
  })
  // 停止移动时
  graph.on("node:moved", ({ node }) => {
    // console.log("停止移动", node)
    const parent = node.getParent()
    if (!parent && recordMap.has(node.id)) { //说明被移除出了父节点
      // 要将当前节点的所有连线清除
      const edges = graph.getEdges()
      edges.forEach(edge => {
        // {cell: 2,port: "p_bottom"}
        const source = edge.getSource()
        const target = edge.getTarget()
        // console.log(source, target)
        if (source.cell == node.id || target.cell == node.id) {
          graph.removeEdge(edge)
        }
      })
    }
    // 清空recordMap
    recordMap.clear()
  })
}