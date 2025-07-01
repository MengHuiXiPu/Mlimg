import Emitter from "@pipeline/Editor/util/channel.js";
import { readOnly } from "@pipeline/Editor/store/index.js";

export default (graph) => {
  graph.on("cell:dblclick", ({ cell, node }) => {
    // if (cell.shape == 'shapeGroup') return
    if (readOnly.value) return
    Emitter.emit('nodeDbClick', {
      cell,
      isSelected: true
    })
    // console.log(cell);
    // console.log(cell.getData());
    // console.log(cell.getData().id);
    // console.log(cell.getData().name);
    // console.log(cell.getData().type);
    // console.log(cell.getData().data);
    // console.log(cell.getData().data.id);
  })
}