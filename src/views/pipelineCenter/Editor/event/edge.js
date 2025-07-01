import { isWhileNode } from "@pipeline/Editor/common/cell.js";
// import Emitter from "@pipeline/Editor/util/channel.js";
import { selectNodeById } from "@pipeline/Editor/common/cell";

export default (graph) => {
  /**
   * previousCell?: Cell | null // 交互前连接到的节点/边
   * previousPort?: string | null // 交互前连接到的连接桩 ID
   * currentCell?: Cell | null // 交互后连接到的节点/边
   * currentPort?: string | null // 交互后连接到的连接桩 ID
   */
  graph.on("edge:connected", ({ edge, isNew, previousCell, previousPort, currentCell, currentPort }) => {
    // console.log(edge, isNew, previousCell, previousPort, currentCell, currentPort)
    const parent = edge.getParent()
    if (!isWhileNode(parent)) return
    const source = edge.getSource()
    const target = edge.getTarget()

    // 如果source的port是p_in，且是从while算子拉出的edge
    if (source.cell == parent.id && source.port == "p_in") {
      // 将该edge的target 节点的输入作为while算子的输入
      const targetNode = graph.getCellById(target.cell)
      parent.setData({
        items: targetNode.getData().items
      })
      selectNodeById(parent.id)
    }
    // 如果target的port是p_bottom，且是连接到while算子的edge
    if (target.cell == parent.id && target.port == "p_bottom") {
      // 将该edge的source节点的输出作为while算子的输出
      const sourceNode = graph.getCellById(source.cell)
      parent.setData({
        outputs: sourceNode.getData().outputs
      })
      selectNodeById(parent.id)
    }
  })
  graph.on("edge:removed", ({ cell, edge }) => {
    // 此时无法通过edge获取到parent了
    const source = edge.getSource()
    const target = edge.getTarget()
    const sourceNode = graph.getCellById(source.cell)
    const targetNode = graph.getCellById(target.cell)

    // 如果source的port是p_in，且是从while算子拉出的edge, 需要删除了while算子的输入
    if (source.port == "p_in" && isWhileNode(sourceNode)) {
      // 删除while算子的输入
      sourceNode.getData().items = []
      selectNodeById(sourceNode.id)
    }
    // 如果target的port是p_bottom，且是连接到while的edge, 需要删除了while算子的输出
    if (target.port == "p_bottom" && isWhileNode(targetNode)) {
      // targetNode.setData({
      //   outputs: []
      // })
      targetNode.getData().outputs = []
      selectNodeById(targetNode.id)
    }
  })
}