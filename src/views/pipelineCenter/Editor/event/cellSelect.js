
import Emitter from "@pipeline/Editor/util/channel.js";
// import Operator from "@/api/operator";
// import { transformDataToGraph } from "@pipeline/Editor/common/graph.js";
// import { useGraph } from "@pipeline/Editor/store/index.js"

export default (graph) => {
  graph.on('cell:selected', ({ cell } = data) => {
    if (cell.isEdge()) {
      // 'skyblue   更深 7c68fc
      cell.attr('line', { stroke: '#1890ff', strokeWidth: 3 });
    }
    // if (cell.isNode()) {
    //   Emitter.emit('nodeSelected', cell, true)
    // }
    // 工具栏消费
    Emitter.emit('cellSelected', {
      cell,
      isSelected: true
    })
  });
  graph.on('cell:unselected', ({ cell }) => {
    if (cell.isEdge()) {
      cell.attr('line', { stroke: '#A2B1C3', strokeWidth: 2 });
    }
    // 工具栏消费
    Emitter.emit('cellSelected', {
      cell,
      isSelected: false
    })
  });

  // 这里处group的展开收起操作，后面如果不采用这种方式，则删除即可
  // graph.on('node:collapse', ({ node }) => {
  //   node.toggleCollapse()
  //   const collapsed = node.isCollapsed()
  //   const nodeId = node.getData().id
  //   if (!collapsed) {
  //     Operator.getOperatorGroupTemplateInfoById(node.getData().opGroupId).then(res => {
  //       const data = res.data?.graph
  //       const graph = useGraph().value
  //       const { nodes, edges } = transformDataToGraph(data, nodeId)
  //       nodes.forEach(item => {
  //         const child = graph.addNode({
  //           ...item,
  //           // parent: nodeId, // 将节点添加到 group 中
  //         });
  //         node.addChild(child)
  //       })
  //       edges.forEach(edge => {
  //         const child = graph.addEdge(edge);
  //         node.addChild(child)
  //       })
  //     })
  //   }
  //   const collapse = (parent) => {
  //     // 获取所有子节点
  //     const cells = parent.getChildren()
  //     if (cells) {
  //       // 子节点同步父节点显示隐藏状态
  //       cells.forEach((cell) => {
  //         if (collapsed) {
  //           cell.hide()
  //         } else {
  //           cell.show()
  //         }
  //         // 如果子节点没有被折叠，继续递归处理其子节点
  //         if (cell && cell.shape === "shapeGroup" && !cell.isCollapsed()) {
  //           collapse(cell);
  //         }
  //       })
  //     }
  //   }
  //   collapse(node) // 调用递归函数处理当前节点的子节点
  // })
  // 没有unembedded事件来监听拖出，需要自己监听embeding来实现
  // graph.on('node:embedded', (data) => {
  //   debugger
  // })
}
