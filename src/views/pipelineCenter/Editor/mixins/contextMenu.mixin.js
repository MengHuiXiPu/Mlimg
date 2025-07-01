
import { deleteCells, onPaste, selectAll } from "@pipeline/Editor/common/trigger.js";
import { setBreakpoint } from "@pipeline/Editor/common/cell.js";
import { readOnly } from "@pipeline/Editor/store/index.js";
import Emitter from "@pipeline/Editor/util/channel.js";

export default {
  provide() {
    return {
      handleMenuClick: this.contextMenuFn
    }
  },
  data() {
    return {
      contextMenuItem: {
        x: 0,
        y: 0,
        content: {}
      },
      contextMenuVisible: false
    }
  },
  mounted() {
    this.$nextTick(() => {
      // this.graph.on('edge:contextmenu', ({ e, edge }) => {
      //   const parentBoundingRect = this.$refs.pipelineEditorRef.$el.getBoundingClientRect()
      //   this.contextMenuItem = {
      //     x: e.clientX - parentBoundingRect.left,
      //     y: e.clientY - parentBoundingRect.top,
      //     content: { type: 'edge', item: edge }
      //   }
      //   this.contextMenuVisible = true
      // })

      this.graph.on('node:contextmenu', ({ e, node }) => {
        const parentBoundingRect = this.$refs.pipelineEditorRef.getBoundingClientRect()
        // console.log(parentBoundingRect)
        this.contextMenuItem = {
          x: e.clientX - parentBoundingRect.left,
          y: e.clientY - parentBoundingRect.top,
          content: { type: 'node', item: node }
        }
        // 判断增加右键菜单后，是否会超出父容器，超出则调整 y
        if (this.contextMenuItem.y + 200 > parentBoundingRect.height) {
          this.contextMenuItem.y = e.clientY - parentBoundingRect.top - 200; // 调整 y
        }
        this.contextMenuVisible = true
      })

      this.graph.bindKey('esc', () => {
        this.contextMenuVisible = false
      })
    })
  },
  methods: {
    /**
     * 右键菜单点击回调
     * @param {*} type 功能类型
     * @param {*} args 回调参数, 自行定义
     */
    contextMenuFn(type, args) {
      const targetCell = args.item
      const contextMenuState = {
        'remove': () => {
          deleteCells(this.graph, targetCell)
        },
        'copy': () => {
          onPaste(this.graph, targetCell)
        },
        'selectAll': () => {
          selectAll(this.graph)
        },
        'lock': () => {
          handleLock(this.graph, 'lock', targetCell)
        },
        'center': () => {
          this.graph.centerContent()
        },
        'breakpoint': () => {
          const flag = targetCell.getData()?._breakpoint
          setBreakpoint(args.item, !flag)
        },
        // 'config': () => {
        //   Emitter.emit('nodeDbClick', {
        //     cell: targetCell,
        //     isSelected: true
        //   })
        // },
        'viewGroup': () => {
          this.groupCellData = targetCell.getData()
          this.groupViewVisible = true
        }
        // 'unlock': () => {
        //   const targetCell = args.item
        //   handleLock(this.graph, 'unlock', targetCell)
        // },
        // 'match': () => {
        //   const matchType = args.type
        //   handleRectMatch(this.graph, matchType)
        // },
        // 'export': () => {
        //   const exportType = args.label
        //   if (exportType === 'PDF') exportPDF(this.graph)
        //   else exportChart(this.graph, exportType)
        // }
      }
      contextMenuState[type]()
      this.contextMenuVisible = false
    }
  }
}
