import cellHover from "./cellHover";
// import cellRemove from "./cellRemove";
import cellSelect from "./cellSelect";
// import connectEdge from "./connectEdge";
// import nodeClick from "./nodeClick";
// import nodeDbClick from "./nodeDbClick";
import move from "./move.js";
import edge from "./edge.js";

// 统一注册 事件系统
export default function (graph) {
  cellHover(graph)
  // cellRemove(graph)
  cellSelect(graph)

  // nodeDbClick(graph)
  move(graph)
  edge(graph)
  // connectEdge(graph)
  // nodeClick(graph)
}