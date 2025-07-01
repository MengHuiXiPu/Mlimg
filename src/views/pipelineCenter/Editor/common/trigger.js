
// 可操作事件
import { Message } from "element-ui";
import { uniqueNumericId, sequenceNumericId } from "@pipeline/Editor/util/index.js";
// import { readOnly } from "@pipeline/Editor/store/index.js";
export default (graph) => {
    bindKey(graph)
}

const State = {
    offset: 50,
    useLocalStorage: true
}

// https://x6.antv.vision/zh/docs/api/graph/keyboard/#bindkey
function bindKey(graph) {
    // 复制
    graph.bindKey(['ctrl+c', 'command+c'], () => {
        const cells = graph.getSelectedCells()
        if (cells.length) {
            graph.copy(cells)
        }
        // 判断一个键盘事件是否应该被处理，返回 false 时对应的键盘事件被忽略。
        return false
    })
    // 粘贴
    graph.bindKey(['ctrl+v', 'command+v'], () => {
        if (!graph.isClipboardEmpty()) {
            // const cells = graph.paste({ offset: 32 })
            // graph.cleanSelection()
            // graph.select(cells)
            onPaste(graph)
        }
        return false
    })
    // 全选
    graph.bindKey(['ctrl+a', 'command+a'], () => {
        const cells = graph.getCells();
        if (cells.length) {
            graph.select(cells);
        }
        return false
    })
    // 删除
    graph.bindKey(['delete', 'backspace'], () => {
        const cells = graph.getSelectedCells();
        if (cells.length) {
            // 删除前移除所有包含工具
            // cells.forEach(currentCell => {
            //     currentCell.removeTools()
            // });
            graph.removeCells(cells);
        }
        return false
    }, 'keydown')
    // 撤销
    graph.bindKey(['ctrl+z', 'command+z'], () => {
        graph?.undo();
        return false
    })
    // 重做
    graph.bindKey(['ctrl+y', 'shift+command+z'], () => {
        graph?.redo();
        return false
    })
    // Esc 取消所有选中单元 & 关闭提示
    graph.bindKey('esc', () => {
        graph.cleanSelection()
        // Channel.dispatchEvent(CustomEventTypeEnum.HELP, 'close')
        return false
    })
    // // help
    // graph.bindKey(['alt+h', 'option+h'], () => {
    //     Channel.dispatchEvent(CustomEventTypeEnum.HELP)
    //     return false
    // })
    // 居中
    graph.bindKey(['alt+f', 'option+f'], () => {
        // graph.zoomToFit()
        graph.centerContent();   //将画布内容中心与视口中心对齐
        // graph.center()  //将画布中心与视口中心对齐
        return false
    })
}

/**
 * @description 复制目标cell并粘贴，无targetCell复制选中cell粘贴，后续要处理复制的cell的id重复问题
 * @param {*} graph 
 * @param {*} targetCell 
 */
export function onPaste(graph, targetCell) {
    if (targetCell) {
        if (['start', 'end'].includes(targetCell.getData()?.name)) {
            return Message.warning('不能复制start、end节点')
        }
        graph.copy([targetCell], State)
    } else {
        const cells = graph?.getSelectedCells()
        // 选择的节点存在start，end节点，则不允许复制
        if (cells.find(cell => ['start', 'end'].includes(cell.getData()?.name))) {
            return Message.warning('不能复制start、end节点')
        }
        if (cells && cells.length) {
            graph.copy(cells, State)
        } else {
            Message.warning('请选择要复制的单元')
        }
    }

    if (!graph.isClipboardEmpty()) {
        const cells = graph.paste(State)
        const nodes = cells.filter(cell => cell.isNode())
        const edges = cells.filter(cell => cell.isEdge())
        // 执行完paste后，复制的cell已经被添加到graph，即graph.getNodes()已经能拿到新粘贴的节点
        const newNodes = nodes.map((node, nodeIndex) => {
            // const newId = String(sequenceNumericId(graph, nodes.length - nodeIndex))
            const newId = uniqueNumericId()
            // const newLabel = `${newId}：${node.getData().label}` //弃用带有序号的label
            const newLabel = `${node.getData().label}`
            const newNode = graph.updateCellId(node, newId)    //更新node id，并记录到data(该方法也是只支持字符串)，直接赋值又无效，恶心
            // newNode.setAttrByPath("label/text", newLabel)
            newNode.setData({ id: newId, _label: newLabel })
            return newNode
        });
        const newEdges = edges.map(edge => {
            const newCell = graph.updateCellId(edge, uniqueNumericId())
            return newCell
        });
        // console.log('copy', graph.getNodes())
        graph.cleanSelection()
        graph.select([...newNodes, ...newEdges])
    }
}
// 删除cell
export function deleteCells(graph, targetCell) {
    if (targetCell) {
        graph.removeCell(targetCell)
        return
    }
    const cells = graph.getSelectedCells();
    if (cells.length) {
        // 删除前移除所有包含工具
        // cells.forEach(currentCell => {
        //     currentCell.removeTools()
        // });
        graph.removeCells(cells);
    }
}

// 全选
export function selectAll(graph) {
    const cells = graph.getCells();
    if (cells.length) {
        graph.select(cells);
    }
}

/**
 * 冻结画布
 */
export function freezeGraph(graph) {
    // const cells = graph.getCells();
    // if (cells.length) {
    //     cells.forEach(cell => {
    //         cell.removeTools()
    //         cell.setData({ disableMove: true })  //与new graph时的interacting选项配合使用，来禁用节点的移动
    //     });
    // }
    // 剪切板
    graph.disableClipboard()
    // 历史记录
    graph.disableHistory()
    // 对齐线
    graph.disableSnapline()
    // 快捷键
    graph.disableKeyboard()
    // 禁用拖拽和缩放
    // graph.disablePanning()
}

/**
 * 解冻
 */
export function unfreezeGraph(graph) {
    // graph.enableSelection()
    // graph.enableMultipleSelection()
    graph.enableClipboard()
    graph.enableHistory()
    graph.enableSnapline()
    graph.enableKeyboard()
    // graph.enablePanning()
}