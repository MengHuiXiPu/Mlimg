<!-- TODO 菜单抽像成无限层级, start 激活菜单, 功能根据config 配置 -->
<script lang="jsx">
import SubMenu from './subMenu'
import { readOnly } from "@pipeline/Editor/store/index.js";

export default {
  name: 'ContextMenu',
  inject: ['handleMenuClick'],
  props: {
    contextMenuItem: {
      type: Object,
      default: () => {
        return {
          x: 0,
          y: 0,
          zIndex: 10,
          content: {}
        }
      }
    }
  },
  computed: {
    curCell() {
      return this.contextMenuItem?.content?.item || {}
    },
    // 当前节点是否是断点状态
    isBreakpointing() {
      return this.curCell.getData()?._breakpoint || false
    },
    cellData() {
      return this.curCell.getData()
    }
  },
  data() {
    return {
      subMenuExportVisible: false,
      subMenuMatchVisible: false,
      style: {
        width: 0,
        height: 0
      }
    }
  },
  mounted() {
    const menuDOM = document.querySelector('.context-menu')
    const width = window.getComputedStyle(menuDOM).width
    const height = window.getComputedStyle(menuDOM).height
    this.style = {
      width: Number(width.replace('px', '')),
      height: Number(height.replace('px', ''))
    }
    // console.log('style', this.style)
  },
  methods: {
    handleRadioVisible(type) {
      const menuVisibleList = ['subMenuExportVisible', 'subMenuMatchVisible']
      menuVisibleList.forEach(el => {
        if (el === type) this[el] = !this[el]
        else this[el] = false
      })
    }
  },
  render() {
    return (
      <div
        class="context-menu"
        style={{
          left: this.contextMenuItem.x + 20 + 'px',
          top: this.contextMenuItem.y + 'px',
          'z-index': this.contextMenuItem.zIndex
        }}
      >
        {
          this.contextMenuItem.content.type === 'edge' ?
            <div class="item" vOn:click_stop={() => this.handleMenuClick('remove', this.contextMenuItem.content)}>删除</div>
            :
            <div>
              {!['start', 'end'].includes(this.cellData?.name) ?
                <div class={readOnly.value ? 'item disabled' : 'item'}
                  vOn:click_stop={() => this.handleMenuClick('copy', this.contextMenuItem.content)}
                > 复制</div> : null
              }

              <div class="item" vOn:click_stop={() => this.handleMenuClick('selectAll', this.contextMenuItem.content)}>全选</div>
              <div class="item" vOn:click_stop={() => this.handleMenuClick('center', this.contextMenuItem.content)}>画布居中</div>
              <div class="horizontal-line" ></div>
              {/* {!['start', 'end'].includes(this.cellData?.name) ?
                <div class={readOnly.value ? 'item disabled' : 'item'} vOn:click_stop={() => this.handleMenuClick('config', this.contextMenuItem.content)}>配置
                </div> : null
              } */}
              {this.curCell.shape === "shapeGroup" ? <div class="item" vOn:click_stop={() => this.handleMenuClick('viewGroup', this.contextMenuItem.content)}>组视图</div> : null}
              {!['start', 'end'].includes(this.cellData?.name) ? <div class="item" vOn:click_stop={() => this.handleMenuClick('breakpoint', this.contextMenuItem.content)}>{this.isBreakpointing ? '取消断点' : '设为断点'}</div> : null}
              <div class={readOnly.value ? 'item disabled' : 'item'}
                vOn:click_stop={() => this.handleMenuClick('remove', this.contextMenuItem.content)}> 删除 </div>
              {/* <div
                class="item"
                vOn:click_stop={() => this.handleMenuClick('lock', this.contextMenuItem.content)}>
                锁定
              </div>
              <div
                class="item"
                vOn:click_stop={() => this.handleMenuClick('unlock', this.contextMenuItem.content)}>
                解锁
              </div>
              <div
                class="item"
                vOn:click_stop={() => this.handleRadioVisible('subMenuMatchVisible')}>
                匹配
                <svg-icon icon-class="arrow_right" />
              </div> */}
            </div>
        }
        {/* <SubMenu
          subMenuVisible={this.subMenuExportVisible}
          on={{ 'update:subMenuVisible': visible => this.subMenuExportVisible = visible }}
          contextMenuItem={{
            ...this.contextMenuItem,
            x: this.style.width,
            y: this.style.height - 57
          }}
          subMenuOptions={[{ label: 'PNG' }, { label: 'JPEG' }]}
          action="export"
        />
        <SubMenu
          subMenuVisible={this.subMenuMatchVisible}
          on={{ 'update:subMenuVisible': visible => this.subMenuMatchVisible = visible }}
          contextMenuItem={{
            ...this.contextMenuItem,
            x: this.style.width,
            y: this.style.height - 57
          }}
          subMenuOptions={[{ label: '宽度匹配', type: 'width' }, { label: '高度匹配', type: 'height' }, { label: '宽高匹配', type: 'widthAndHeight' }]}
          action="match"
        /> */}
      </div>
    )
  }
}
</script>


<style lang="scss" scoped>
@import "~@pipeline/Editor/layout/contextMenu/style.scss";
</style>
