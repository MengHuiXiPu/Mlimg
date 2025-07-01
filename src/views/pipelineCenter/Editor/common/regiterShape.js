/**
 * @description 定义自定义节点配置
 * @description 注册自定义节点
 */
import { Graph, Shape } from '@antv/x6';
// 接线桩半径
export const protR = 6;
// 节点宽高
export const nodeWidth = 160;
export const nodeHeight = 36;

const runStatusIconWidth = 20
const runStatusIconHeight = 20
const runStatusIconX = nodeWidth * 7 / 8 - 5
const runStatusIconY = nodeHeight * 1 / 4

//设置接线桩层级最高（fix： 存在连线后，连线与prot重合，导致从接线桩拉出连线困难问题）
export const portzIndex = '1000'  //auto
export const targetMarker = {
  name: 'classic',
  width: 6,  // 默认宽度
  height: 6,  // 默认高度
}

// 节点圆角
const rx = 0
const ry = 0
// label文本样式属性
const labelTextAttr = {
  textAnchor: 'middle', //start
  textVerticalAnchor: 'middle', //top
  // fontWeight: 'bold',
  fontFamily: '微软雅黑 Bold',
  fill: '#444',
  fontSize: 13,
}
/**
 * @description 定义基础接线桩属性
 */
export const setBasePortAttrs = ({ magnet = true } = {}) => {
  // magnet: true:可以拉出和接入edge  false 不能拉出不能接入  passive：只能接入edge
  return {
    circle: {
      r: protR,
      magnet,   //是否可以从该出拉出连线
      stroke: '#5F95FF',
      strokeWidth: 1,
      fill: '#fff',
      style: {
        visibility: 'hidden'
      }
    }
  }
}
export const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: setBasePortAttrs(),
    },
    right: {
      position: 'right',
      attrs: setBasePortAttrs(),
    },
    bottom: {
      position: 'bottom',
      attrs: setBasePortAttrs(),
    },
    left: {
      position: 'left',
      attrs: setBasePortAttrs(),
    }
  },
  items: [
    { group: 'top', id: 'p_top' },
    { group: 'bottom', id: 'p_bottom' },
    { group: 'left', id: 'p_left' },
    { group: 'right', id: 'p_right' },
  ]
}
// IfElse、IfElseTO的attrs
const diamondAttrs = {
  body: {
    strokeWidth: 1,
    stroke: '#5F95FF',
    // "fill": "#7D7671"
    fill: '#E6A23C',
    refPoints: '0,10 10,0 20,10 10,20',
  },
  leftDesc: {
    fontSize: 12,
    x: -nodeWidth / 2,
    y: -10,
    textAnchor: 'middle',
    textVerticalAnchor: 'middle',
    fill: '#9254de',
    text: 'false',
  },
  rightDesc: {
    x: nodeWidth / 2,
    y: -10,
    fontSize: 12,
    fill: 'green',
    text: 'true',
  },
  runStatus: {
    refX: nodeWidth * 3 / 4 - 5,
    refY: runStatusIconY - 8,
    width: runStatusIconWidth,
    height: runStatusIconHeight,
  },
  debug: {
    refX: 15,
    refY: nodeHeight / 3 - 1,
    width: 15,
    height: 15,
    'xlink:href': require("../assets/debug.svg"),
    style: {
      visibility: 'hidden',
    }
  },
  label: {
    ...labelTextAttr,
    fontSize: 11,
  }
}
// IfElse、IfElseTO的markup
const diamondMarkup = [{
  tagName: 'polygon',
  selector: 'body',
}, {
  tagName: 'text',
  selector: 'leftDesc',
}, {
  tagName: 'image',
  selector: 'debug',
}, {
  tagName: 'text',
  selector: 'rightDesc',
}, {
  tagName: 'text',
  selector: 'label',
}, {
  tagName: 'image',
  selector: 'runStatus',
}]
// 矩形节点配置，适用于开始 结束 普通算子节点(ifelse switch除外)
const baseNodeConfig = {
  width: nodeWidth,
  height: nodeHeight,
  markup: [{
    tagName: 'rect',
    selector: 'body',
  }, { //调试断点标识
    tagName: 'image',
    selector: 'debug',
  }, { //算子名称label
    tagName: 'text',
    selector: 'label',
  }],
  attrs: {
    body: {
      stroke: '#ced4d9',
      strokeWidth: 1,
      fill: '#fff',
      width: nodeWidth,
      height: nodeHeight,
      rx,
      ry,
    },
    debug: {
      refX: 4,
      refY: nodeHeight / 3 - 1,
      width: 15,
      height: 15,
      'xlink:href': require("../assets/debug.svg"),
      style: {
        visibility: 'hidden',
      }
    },
    label: {
      x: nodeWidth / 2,
      y: nodeHeight * 1 / 2,
      ...labelTextAttr,
    },
  },
}

// 注册自定义节点形状 样式
const registerShape = () => {
  Graph.registerNode(
    'customNode',
    {
      // inherit: 'rect',
      width: nodeWidth,
      height: nodeHeight,
      markup: [
        ...baseNodeConfig.markup,
        {
          tagName: 'image',
          selector: 'runStatus',
        }
      ],
      attrs: {
        ...baseNodeConfig.attrs,
        runStatus: {
          refX: runStatusIconX,
          refY: runStatusIconY,
          width: runStatusIconWidth,
          height: runStatusIconHeight,
          // 'xlink:href': require("../assets/runing.svg"), // 右侧图标路径
        },
      },
      ports: { ...ports }
    },
    true
  )
  // 自定义ifElse节点
  Graph.registerNode(
    'shapeIfElse',
    {
      inherit: 'polygon',
      width: nodeWidth,
      height: nodeHeight * 2 / 3,
      markup: diamondMarkup,
      attrs: diamondAttrs,
      ports: {
        groups: ports.groups,
        items: [
          ports.items[0],
          ports.items[2],
          ports.items[3],
        ],
      },
    },
    true
  )
  // 自定义ifElseTo节点
  Graph.registerNode(
    'shapeIfElseTo',
    {
      inherit: 'polygon',
      width: nodeWidth,
      height: nodeHeight * 2 / 3,
      markup: [
        ...diamondMarkup,
        {
          tagName: 'text',
          selector: 'bottomDesc',
        },
      ],
      attrs: {
        ...diamondAttrs,
        bottomDesc: {
          x: 0,
          y: nodeHeight / 3,
          fontSize: 10,
          fill: 'red',
          text: 'TimeOut',
        },
      },
      ports: { ...ports },
    },
    true
  )
  // 自定义switch节点
  Graph.registerNode(
    'shapeSwitch',
    {
      inherit: 'rect',
      width: nodeWidth,
      height: nodeHeight,
      markup: [{
        tagName: 'rect',
        selector: 'body',
      }, {
        tagName: 'text',
        selector: 'label',
      }, { //调试断点标识
        tagName: 'image',
        selector: 'debug',
      }, {
        tagName: 'image',
        selector: 'runStatus',
      }],
      attrs: {
        body: {
          stroke: '#9254de',
          strokeWidth: 1,
          fill: '#efdbff',
          rx,
          ry,
        },
        runStatus: {
          refX: runStatusIconX,
          refY: runStatusIconY,
          width: runStatusIconWidth,
          height: runStatusIconHeight,
          // 'xlink:href': , // 右侧图标路径
        },
        label: {
          ...labelTextAttr,
          fill: '#666666',
        },
        debug: {
          refX: 4,
          refY: nodeHeight / 3 - 1,
          width: 15,
          height: 15,
          'xlink:href': require("../assets/debug.svg"),
          style: {
            visibility: 'hidden',
          }
        },
      },
      ports: {
        groups: {
          top: {
            position: 'top',
            attrs: { ...setBasePortAttrs() },

          },
          bottom: {
            position: 'bottom',
            attrs: {
              ...setBasePortAttrs({ magnet: true }),
            },

            label: {  // label样式和位置
              position: 'bottom',
            },
          },
        },
        items: [
          ports.items[0], //默认上,下各添加一个port
        ],
      },
    },
    true
  )
  Graph.registerNode(
    "shapeStart",
    {
      ...baseNodeConfig,
      ports: {
        groups: {
          bottom: {
            position: 'bottom',
            attrs: setBasePortAttrs({ magnet: true }),
          },
        },
        items: [
          ports.items[1]
        ],
      },
    },
    true
  )
  Graph.registerNode(
    "shapeEnd",
    {
      ...baseNodeConfig,
      ports: {
        groups: {
          top: {
            position: 'top',
            // 只能接入连线，不能拉出连线
            attrs: setBasePortAttrs({ magnet: "passive" }),
          },
        },
        items: [
          ports.items[0]
        ],
      },
    },
    true
  )
  // group节点
  // Graph.registerNode('shapeGroup', Group, true);
  Graph.registerNode('shapeGroup', {
    width: nodeWidth,
    height: nodeHeight,
    markup: [
      ...baseNodeConfig.markup, {
        tagName: 'image',
        selector: 'runStatus',
      }],
    attrs: {
      ...baseNodeConfig.attrs,
      // iconLeft: {
      //   refX: 6,
      //   refY: 10,
      //   width: 26,
      //   height: 26,
      //   'xlink:href': require("../assets/group.svg"),
      // },
      runStatus: {
        refX: runStatusIconX,
        refY: runStatusIconY,
        width: runStatusIconWidth,
        height: runStatusIconHeight,
      },
    },
    ports: { ...ports }
  }, true)
  // while节点
  Graph.registerNode(
    'shapeWhile',
    {
      inherit: 'rect',
      // 因为while节点是可以调整尺寸的，定义shape时不做设置，分别在拖拽添加到画布时设置默认尺寸，和在接口加载render时，设置已保存的尺寸
      // width: nodeWidth * 1.5,
      // height: nodeHeight * 8,
      markup: [{
        tagName: 'rect',
        selector: 'body',
      }, {
        tagName: 'rect',
        selector: 'topRect',
      }, { //调试断点标识
        tagName: 'image',
        selector: 'debug',
      }, { //算子名称label
        tagName: 'text',
        selector: 'label',
      }],
      attrs: {
        body: {
          stroke: '#d7d7d7',
          strokeWidth: 0.5,
          fill: '#f2f2f2',
          rx,
          ry,
        },
        topRect: {
          fill: '#fff',
          stroke: '#d7d7d7',
          strokeWidth: 0.5,
          refWidth: "100%",
          height: 40,
          x: 0,
          y: 0,
        },
        debug: {
          refX: 10,
          refY: nodeHeight / 3,
          width: 15,
          height: 15,
          'xlink:href': require("../assets/debug.svg"),
          style: {
            visibility: 'hidden',
          }
        },
        label: {
          refY: 20,
          fontFamily: '微软雅黑 Bold',
          fill: '#444',
          fontSize: 13,
        },
      },
      ports: {
        groups: {
          top: {
            position: 'top',
            attrs: setBasePortAttrs({ magnet: "passive" }), //只能接入，不能拉出edge

          },
          in: {
            attrs: setBasePortAttrs(),
            position: {
              name: 'absolute',
              args: { x: 0, y: 0 },
            },

          },
          bottom: {
            position: 'bottom',
            attrs: setBasePortAttrs(),

          },
        },
        items: [
          { group: 'top', id: 'p_top' },
          { group: 'bottom', id: 'p_bottom' },
          {
            group: 'in',
            id: 'p_in',
            // attrs: {
            //   text: {
            //     text: '输入', // 标签文本
            //     fontSize: 10,
            //     fill: "#888888"
            //   },
            // },
            args: {
              x: "50%",
              y: 40,
            },
          },
        ]
      }
    }, true)
}
export default registerShape
