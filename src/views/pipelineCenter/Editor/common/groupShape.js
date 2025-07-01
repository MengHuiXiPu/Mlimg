import { Graph, Shape, Node } from '@antv/x6';

export class Group extends Node {
  constructor(metadata) {
    super(metadata);
    this.collapsed = false;
    this.expandSize = {
      width: nodeWidth,
      height: nodeHeight
    };
  }

  postprocess() {
    this.toggleCollapse(false)
  }

  isCollapsed() {
    return this.collapsed
  }

  toggleCollapse(collapsed) {
    const target = collapsed == null ? !this.collapsed : collapsed
    if (target) {
      this.attr('buttonSign', { d: 'M 1 5 9 5 M 5 1 5 9' })
      this.expandSize = this.getSize()
      this.resize(100, 32)
    } else {
      this.attr('buttonSign', { d: 'M 2 5 8 5' })
      if (this.expandSize) {
        this.resize(this.expandSize.width, this.expandSize.height)
      }
    }
    this.collapsed = target
  }
}
Group.config({
  width: 400,
  height: 300,
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'text',
      selector: 'label',
    },
    {
      tagName: 'g',
      selector: 'buttonGroup',
      children: [
        {
          tagName: 'rect',
          selector: 'button',
          attrs: {
            'pointer-events': 'visiblePainted',
          },
        },
        {
          tagName: 'path',
          selector: 'buttonSign',
          attrs: {
            fill: 'none',
            'pointer-events': 'none',
          },
        },
      ],
    },
  ],
  attrs: {
    body: {
      refWidth: '100%',
      refHeight: '100%',
      stroke: '#fff',
      strokeWidth: 1, // 边框宽度
      // fill: 'none',
      fill: 'rgba(0, 0, 0, 0)'
    },
    buttonGroup: {
      refX: 8,
      refY: 8,
    },
    button: {
      height: 14,
      width: 16,
      rx: 2,
      ry: 2,
      fill: '#f5f5f5',
      stroke: '#ccc',
      cursor: 'pointer',
      event: 'node:collapse',
    },
    buttonSign: {
      refX: 3,
      refY: 2,
      stroke: '#808080',
    },
    label: {
      fontSize: 12,
      fill: '#fff',
      refX: 32,
      refY: 10,
    },
  },
  ports: { ...ports }
})