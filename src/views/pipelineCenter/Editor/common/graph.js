/**
 * X6实例化方法
 * 根据后台保存的graph数据反render方法
 * graph 数据导出方法
 * 动态添加节点方法
 */
import { Graph, Shape } from '@antv/x6'
import { Selection } from '@antv/x6-plugin-selection'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { History } from '@antv/x6-plugin-history'
import { Transform } from '@antv/x6-plugin-transform'
// import { MiniMap } from '@antv/x6-plugin-minimap'
import { useProvideGraph, useGraph, readOnly } from "@pipeline/Editor/store/index.js";
import trigger from "./trigger.js";
import registerListener from "../event/index.js";
import registerShape from "@pipeline/Editor/common/regiterShape.js";
import { uniqueNumericId, sequenceNumericId } from "@pipeline/Editor/util/index.js";
import { setBasePortAttrs, ports as PORTS, targetMarker } from "@pipeline/Editor/common/regiterShape.js";
import { setCondition } from "@pipeline/Editor/common/edge.js";
import { nodeWidth, nodeHeight } from "@pipeline/Editor/common/regiterShape.js";
import { addSwitchPort, isWhileNode, isStartOrEndNode, isPyNode } from "@pipeline/Editor/common/cell.js";
import { flattenHierarchy } from "@pipeline/Editor/util/transData.js";
// import { selectNodeById } from "@pipeline/Editor/common/cell";
import { instPyOperator } from "@pipeline/Editor/common/pyOperator.js";

import { message as Message } from '@/utils/resetMessgae';

/**
 * 注册自定义节点
 * 初始化graph对象，
 * 事件监听绑定
 * 挂载插件
 * 可触发事件，按键等绑定
 */
export function initGraph() {
  // 注册自定义shape
  registerShape()
  // 配置开发者工具
  window.__x6_instances__ = []
  // 初始化画布
  const graph = new Graph({
    container: document.getElementById('graph-container'),
    grid: true,
    autoResize: true, //监听容器大小改变，并自动更新画布大小
    mousewheel: { //滚轮缩放
      enabled: true,
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
      minScale: 0.2,
      maxScale: 5,
    },
    panning: true, //拖拽平移
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: {
          radius: 8,
        },
      },
      sourceAnchor: {
        name: 'center', // 锚点会在节点中心往下偏移 3px
        args: {
          dy: 3,
        },
      },
      targetAnchor: {
        name: 'center', // 锚点会在节点中心往上偏移 3px
        args: {
          dy: -4,
        },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,    //禁止连接到空白
      allowMulti: false,  //是否允许在相同的起始节点和终止之间创建多条边，默认为 true
      allowLoop: false,  //是否允许创建循环连线，即边的起始节点和终止节点为同一节点，默认为 true
      snap: { //自动贴合连接
        radius: 20,
      },
      // 配置连线样式
      createEdge({ sourceCell, sourceMagnet }) {
        const edge = new Shape.Edge({
          id: uniqueNumericId(),
          zIndex: -1, //设置连线在最下层，避免hover时影响port连线操作
          attrs: {
            line: {
              // stroke: '#A2B1C3',
              // strokeWidth: 2,
              targetMarker: targetMarker,
              stroke: '#A2B1C3',
              strokeDasharray: 5,
              style: {
                animation: 'ant-line 30s infinite linear',
              },
            },
          },
        })
        // 必须先添加到 Graph
        graph.addEdge(edge);
        // 这里要异步，x6内部在组成组后，应该有一些判定并修改边 zIndex 的逻辑，不异步的话，修改zIndex会被X6内部的默认行为覆盖
        requestAnimationFrame(() => {
          const parent = sourceCell.getParent()
          const fromWhile = isWhileNode(sourceCell)
          if (parent) {
            const parentZIndex = parent.getZIndex()
            edge.setZIndex(parentZIndex);
          }
          if (fromWhile) {
            const whileZindex = sourceCell.getZIndex()
            edge.setZIndex(whileZindex);
          }
        })
        return edge;
      },
      // 在移动边的时候判断连接是否有效，如果返回 false，当鼠标放开的时候，不会连接到当前元素，否则会连接到当前元素。
      validateConnection({ sourceCell, targetCell, sourceMagnet, targetMagnet, sourcePort, targetPort }) {
        // 获取 sourceCell 和 targetCell 的父节点
        const sourceParent = sourceCell.getParent();
        const targetParent = targetCell.getParent();
        // target为 start节点不允许接入
        if (targetCell.getData().name === "start") return false
        // target为switch节点，只有上方（id为p_top）可以接入，下方port一律不允许接入连线
        if (targetCell.getData().name === "Switch" && targetPort !== "p_top") return false
        // target为IfElse/IfElseTO节点，只有上方（id为p_top）其他port一律不允许接入连线
        if (targetCell.getData().name === "IfElse" || targetCell.getData().name === "IfElseTO") {
          if (targetPort !== "p_top") return false
        }
        // target为While节点，只有下方（id为p_bottom）可以接入，内部port不允许接入连线
        if (isWhileNode(targetCell)) {
          if (targetPort == "p_in") return false
        }
        // while的p_bottom不允许主动与while内部节点创建连线
        if (isWhileNode(sourceCell) && sourcePort == "p_bottom" && isWhileNode(targetParent)) return false
        // while 的p_bottom不允许被while外部节点创建连线
        if (isWhileNode(targetCell) && targetPort == "p_bottom" && !targetCell.isParentOf(sourceCell)) return false
        // while内部节点不能与while的p_top创建连线
        if (isWhileNode(sourceParent) && isWhileNode(targetCell) && targetPort == "p_top") return false
        // while内部节点，不允许与while外部节点创建连接(目标节点不是while父节点本身，也不是while父节点的子节点)
        if (sourceParent && isWhileNode(sourceParent) && (!sourceParent.isParentOf(targetCell) && targetCell.id != sourceParent.id)) return false
        // 外部节点，不允许与while内部节点创建连线
        if (targetParent && !targetParent.isParentOf(sourceCell) && targetParent.id !== sourceCell.id) return false
        // while节点的p_bottom，只能有一个节点接入
        if (sourceParent && isWhileNode(sourceParent) && targetPort === 'p_bottom') {
          // 判断是否已经存在指向p_bottom的连线
          const childEdges = (sourceParent.getChildren() || []).filter(child => child.isEdge())
          // console.log(childEdges)
          const hasEdge = childEdges.find(edge => {
            const target = edge.getTarget()
            return target.cell === sourceParent.id && target.port === 'p_bottom'
          })
          if (hasEdge) {
            Message.warning('While节点已指定输出节点，请勿重复指定')
            return false
          }
        }

        //start ======= while节点内的节点，不允许与外部节点进行连线
        // 允许连接的条件：
        // 1. 起点和终点属于同一个父节点
        // 2. 起点的父节点是终点
        // 3. 起点是终点的父节点
        // const isSameGroup = sourceParent && targetParent && sourceParent.id === targetParent.id;
        // const isParentChildRelation =
        //   (sourceParent && sourceParent.id === targetCell.id) ||
        //   (targetParent && targetParent.id === sourceCell.id);

        // if (!isSameGroup || !isParentChildRelation) return false
        //end ======= while节点内的节点，不允许与外部节点进行连线
        return !!targetMagnet
      },
      // validateMagnet({ cell }) {

      // }
      // validateEdge(data) {
      //   // debugger
      // }
    },
    // highlight: true,//
    highlighting: {
      // 连接桩可以被连接时在连接桩外围围渲染一个包围框
      magnetAvailable: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#fff',
            stroke: '#A4DEB1',
            strokeWidth: 4,
          },
        },
      },
      // 连接桩吸附连线时在连接桩外围围渲染一个包围框
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#fff',
            stroke: '#31d0c6',
            strokeWidth: 4,
          },
        },
      },
    },
    // 配置冻结画布上的哪些交互行为,参见: https://x6.antv.antgroup.com/tutorial/basic/interacting#%E4%BA%A4%E4%BA%92%E9%99%90%E5%88%B6
    interacting: {
      nodeMovable(view) {
        // const node = view.cell
        // const { enableMove } = node.getData()
        // return enableMove
        return !readOnly.value
      },
    },
    // 处理组合嵌套
    embedding: {
      enabled: true,
      findParent({ node }) {
        const bbox = node.getBBox()
        // 如果当前节点是while 循环节点活开始结束节点，则不嵌入任何节点，即不支持嵌套
        if (isWhileNode(node) || isStartOrEndNode(node)) return []
        return this.getNodes().filter(iNode => {
          // return iNode.isNode() && iNode.getBBox().containsRect(bbox)
          const data = iNode.getData()
          if (data.asParentFlag) {
            const targetBBox = iNode.getBBox()
            // 是否相交
            return bbox.isIntersectWithRect(targetBBox)
          }
          return false
        })
      },
    },
  })
  // 将graph实例抛到全局store
  useProvideGraph(graph)
  // 挂载插件
  setupPlugin(graph)
  // 注入触发器
  trigger(graph);
  // 注册实践监听
  registerListener(graph);
  // 添加到全局变量，使开发者工具可用
  window.__x6_instances__.push(graph)
}
/**
 * 挂载插件到graph
 * @param {*} graph 
 */
function setupPlugin(graph) {
  graph.use(new Snapline())
    .use(new Selection({
      enabled: true,
      rubberband: true, //框选节点功能
      modifiers: 'alt',
      showNodeSelectionBox: true,
      pointerEvents: 'none', //如果打开 showNodeSelectionBox 时，会在节点上方盖一层元素，导致节点的事件无法响应，此时可以配置 pointerEvents: none 来解决，默认值是 auto
      showEdgeSelectionBox: false,
    }))
    .use(new Keyboard({
      enabled: true,
    }))
    .use(new Clipboard({
      enabled: true,
    }))
    .use(new History({
      enabled: true,
      ignoreChange: true, // 元素属性变化是否被记录到历史记录,这里设置记录（否则好像只有增删会被记录,连位置都不会被记录）
      beforeAddCommand(event, args) {
        // console.log(event, args)
        if (event === "cell:change:*" && args.key === "attrs") return false   //主要是选中连线，会设置加深显示，该动作不添加到history
        // /switch动态添加分支时，会设置立刻显示接线桩port，该动作不添加到history
        if (event === "cell:change:*" && args.key === "ports" && args.options?.propertyPath === "ports/items/0/attrs/circle/style/visibility") return false
        // ...
      }
    }))
  graph.use(new Transform({
    resizing: {
      enabled: (node) => {
        // 目前仅while节点支持resize大小
        return isWhileNode(node)
      },
      minWidth: 200,
      minHeight: 300,
    },
  }))
  // 小地图
  // graph.use(new MiniMap({
  //   container: document.getElementById('minimap'),
  //   width: 200,
  //   height: 180,
  //   padding: 10,
  //   // scalable: false,
  // }))
}
/**
 * 根据保存的pipeline json数据，渲染pipeline到画布
 * @param {*} data : JSON数据
 */
export function renderGraph(data = {}, graph) {
  // 先做数据格式转换
  const { nodes, edges } = transformDataToGraph(data)
  // console.log(nodes, edges)
  // 调用graph渲染方法
  graph = graph || useGraph().value
  graph.fromJSON({ nodes, edges })
}

/**
 * @description 将接口返回的数据转换为Graph数据
 * @param {*} data 
 * @returns 
 */
export function transformDataToGraph(data) {
  // 先将树状结构扁平化为x6 fromGraph需要的格式（平铺）
  const { nodes, edges } = flattenHierarchy(data.nodes, data.edges)
  // 转换edges格式
  const _edges = edges.map(edge => {
    return {
      id: edge.id,
      shape: 'edge',
      zIndex: edge.zIndex,
      source: {
        cell: edge.sourceId,
        port: edge.startVar
      },
      target: {
        cell: edge.targetId,
        port: edge.endVar
      },
      attrs: {
        line: {
          stroke: '#A2B1C3',
          strokeDasharray: 5,
          targetMarker: targetMarker,
          // strokeDashoffset: 0, // 初始偏移量  #1890ff
          style: {
            animation: 'ant-line 30s infinite linear',
          },
        },
      },
      parent: edge.parent || null,
    }
  })
  const _nodes = nodes.map(node => {
    // const label = `${node.id}：${node.label}`  //不再需要显示id
    const label = node.label
    const nodeDesc = {
      id: node.id,
      shape: node.shape,
      zIndex: node.zIndex,
      position: {
        x: node.x,
        y: node.y,
      },
      // children: node.children || null,
      parent: node.parent || null,
      ports: node.ports,
      label, //该label对"IfElse", "IfElseTO"两种类型的有效
      attrs: ["IfElse", "IfElseTO"].includes(node.name) ? {} : {
        // label: '开始',
        body: {},
        desc: {
          text: node.description,
        },
        label: {
          text: label,
          fontSize: getLabelFontSize(node.label),
        },
      },
      // 参照算子列表frontendSetting里的取，很多都是没用的属性也不删除
      data: {
        id: node.id,
        name: node.name,
        label: node.label,
        typeName: node.typeName,
        remark: node.remark,
        _label: label,  //包含id+节点label的仅用于前端显示的label
        group: node.group,
        operatorType: node.operatorType,
        opGroupId: node.opGroupId,
        operatorId: node.operatorId,
        rpaLabelingId: node.rpaLabelingId,
        inits: node.inits || [],
        items: node.items,
        outputs: node.outputs,
        // 以下4个是while算子特有的属性
        asParentFlag: isWhileNode(node),
        dynamicGroupName: node.dynamicGroupName || null,
        conditions: node.conditions,

        recordId: node.recordId, //python算子才有,后端用该id关联了实例化的python算子表
        codeContent: node.codeContent || null, //python算子才有
        dynamicOperatorName: node.dynamicOperatorName || null, //python算子才有
        // conditionDataSetting
      }
    }
    // 业务上 新增special和supportRemote配置项
    if ('special' in node || 'supportRemote' in node) {
      nodeDesc.data.special = node.special || null;  // 特殊配置项（当前为远程调用）
      nodeDesc.data.supportRemote = node.supportRemote || false; // 是否支持远程调用
    }
    //switch节点需根据返回的inits中structs的数量来渲染port
    if (node.name === 'Switch') {
      let structs = node.inits[0]?.structs
      if (!structs?.length) { //fix: 拖过来就保存，并没有点击switch节点配置，即灭有经过switch.vue组件处理数据
        structs = [node.inits[0]?.struct || []]
      }
      const ports = (node.ports || []).filter(p => p.group === "bottom")  //ports与structs按照索引对应
      const items = structs.map((s, idx) => ({
        id: ports[idx].id,  //为switch的port写入id，这样才能还原连线位置
        group: 'bottom',
        attrs: {
          ...setBasePortAttrs(),
          text: {
            text: idx + 1,
            fill: '#666666',
          },
        },
        data: {
          struct: s
        }
      }))
      items.unshift(PORTS.items[0])
      nodeDesc.ports = {
        items
      }
    }
    if (isWhileNode(node)) { //整理while算子以符合前端需要
      //处理conditionDataSetting的数据结构和默认值
      nodeDesc.data.conditionDataSetting = (node.conditionDataSetting || [{
        "type": 1,
        "valueLow": "",
        "compareValue": "",
        "logic": 1
      }]).map(item => ({
        ...item,
        _compareValue: item.compareValue ? item.compareValue.split("_") : []
      }))
      // 添加宽高
      nodeDesc.size = {
        width: node.width || nodeWidth * 1.5,
        height: node.height || nodeHeight * 8,
      }
    }
    // 存在子节点，则添加children属性（否则无法渲染出嵌套关系）
    if (node.children && node.children.length) {
      nodeDesc.children = node.children
    }
    return nodeDesc
  })
  return { nodes: _nodes, edges: _edges }
}
/**
 * 获取格式化后的graph 数据
 * @returns {nodes, edges}
 */
export function exportData() {
  const graph = useGraph().value
  const edges = [], nodes = []
  // edgesJSON = [], nodesJSON = []
  const cells = graph.getCells()
  if (cells.length) {
    for (const cell of cells) {
      const cellData = cell.toJSON()
      if (cell.isEdge()) {
        // 如果是条件分支edge，需要配置condition字段
        setCondition(cell, cellData)
        edges.push(cellData)
      }
      if (cell.isNode()) {
        nodes.push(cellData)
      }
    }
  }
  return { nodes, edges }
}
/**
 * @description 添加节点, 用于拖拽添加节点和复制添加节点
 * @param {*} event 事件对象或者包含clientX, clientY的对象，据此来确定要添加的节点的坐标
 * @param {*} item  节点的data对象
 */
export function addNodeToGraph(event, item) {
  let newNode = null;  //存储新添加的节点
  const graph = useGraph()
  // 转换坐标
  const { x, y } = graph.value.clientToLocal(event.clientX, event.clientY)
  // 使得拖拽的节点的中心点落在鼠标拖拽位置
  const centerX = x - nodeWidth / 2
  const centerY = y - nodeHeight / 2
  // 生成id(该id仅用于前端展示)，节点id仍然是默认的uuid，否则无法处理复制带来的问题
  // const _incrementId = sequenceNumericId(graph.value)
  const uniqueId = uniqueNumericId()
  // const label = `${_incrementId}：${item.label}` //需求又不需要显示id了
  const label = item.label
  const data = {  //业务数据
    ...item,
    // _incrementId,
    id: uniqueId,
    _label: label, //包含id+节点label的仅用于前端显示的label
    _breakpoint: false,  //是否设置为调试断点
    // operatorId: item.id
    asParentFlag: isWhileNode(item), //标识该节点是否可以作为父节点容器(即子节点能否拖入)
  }
  const commonNodeConf = {
    x: centerX,
    y: centerY,
    // _incrementId,
    id: uniqueId,
    label,
    data
  }
  // 添加group到graph
  if (item.operatorType == 1) {
    newNode = graph.value.addNode({
      shape: 'shapeGroup',
      ...commonNodeConf,
      attrs: {
        label: {
          text: label,
          fontSize: getLabelFontSize(item.label),
        }
      }
    })
    // graph.value.createTransformWidget(newNode)
    return
  }
  if (item.name === "IfElse") {
    newNode = graph.value.addNode({
      shape: 'shapeIfElse',
      ...commonNodeConf
    })
  } else if (item.name === "IfElseTO") {
    newNode = graph.value.addNode({
      shape: 'shapeIfElseTo',
      ...commonNodeConf
    })
  } else if (item.name === "Switch") {
    newNode = graph.value.addNode({
      shape: 'shapeSwitch',
      ...commonNodeConf
    })
    // 添加第一个分支port
    addSwitchPort(newNode, {
      text: 1,
      data: { //暂时不会使用该数据，后续如果做撤销时，如果修改swicth.vue组价中的实现方式可能会用到
        struct: item.inits[0].struct
      }
    })
  } else if (isWhileNode(item)) {  //while循环算子
    newNode = graph.value.addNode({
      shape: 'shapeWhile',
      ...commonNodeConf,
      width: nodeWidth * 1.5,
      height: nodeHeight * 8
    })
    // 将while节点放在最底层，即zIndex最低，否则会导致看不到子节点的情况
    newNode.toBack()
  } else {  //普通节点,包含start  end
    const shapeName = item.name === 'start' ? 'shapeStart' : item.name === 'end' ? 'shapeEnd' : 'customNode'
    newNode = graph.value.addNode({
      shape: shapeName,
      attrs: {
        body: {},
        desc: {
          text: item.description,
        },
        label: {
          text: label,
          fontSize: getLabelFontSize(item.label),
        },
      },
      ...commonNodeConf
    })
  }
  /**
   * 检查当前节点是否为非while算子。
   * 获取所有while节点。
   * 判断当前鼠标落点是否在某个while节点内部。
   * 如果在内部，则将当前节点添加为该while节点的子节点
  */
  if (!isWhileNode(item) && !isStartOrEndNode(item)) {
    // 获取所有while节点
    const whileNodes = graph.value.getNodes().filter(node => isWhileNode(node.getData()));
    // const whileNode = graph.value.getNodes().find(node => node.data.name === 'While' && node.containsPoint(x, y))
    // 判断落点是否在某个while节点内部
    const targetWhileNode = whileNodes.find(whileNode => {
      const bbox = whileNode.getBBox(); // 获取while节点的边界框
      return (
        centerX >= bbox.x &&
        centerX <= bbox.x + bbox.width &&
        centerY >= bbox.y &&
        centerY <= bbox.y + bbox.height
      );
    });
    if (targetWhileNode) {
      // 如果落点在某个while节点内部，使用 addChild 将新节点添加为 while 节点的子节点
      targetWhileNode.addChild(newNode);
    }
  }
  // 如果添加的是python算子,需要调用接口,实例化python算子数据
  if (isPyNode(item)) {
    instPyOperator(newNode)
  }
}
/**
 * 渲染只能查看的graph(会少很多的交互支持)，用于方案详情/算子组详情页的graph渲染
 * @param {*} mountDom 挂载元素
 * @param {*} graphData 
 * @param {*} options 画布参数配置
 */
export function initGroupView(mountDom, graphData, options = {}) {
  registerShape()
  const graph = new Graph({
    container: mountDom,
    autoResize: options.autoResize || false,
    interacting: false, // 全局禁用交互
    mousewheel: { //滚轮缩放
      enabled: true,
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
    },
    panning: true, //拖拽平移
    connecting: {
      router: 'manhattan',
    }
  })
  renderGraph(graphData, graph)
  // 如果需要支持选中节点
  if (options.canSelect) {
    graph.use(new Selection({
      enabled: true,
      showNodeSelectionBox: true,
      pointerEvents: 'none', //如果打开 showNodeSelectionBox 时，会在节点上方盖一层元素，导致节点的事件无法响应，此时可以配置 pointerEvents: none 来解决，默认值是 auto
      // showEdgeSelectionBox: false,
    }))
  }
  return graph
}

// 根据label长度匹配字体大小
export const getLabelFontSize = (label) => {
  return label.length > 15 ? 10 : label.length > 11 ? 11 : 12
}
/**
 * @description 调整画布大小，目前仅全屏后调用
 * @param {*} graph 
 * @param {*} options  指定宽高
 */
export const resizeGraph = (graph, { width, height } = {}) => {
  graph = graph || useGraph().value
  width = width || document.getElementById('pipeline-container').offsetWidth
  height = height || document.getElementById('pipeline-container').offsetHeight
  graph.resize(width, height)
}