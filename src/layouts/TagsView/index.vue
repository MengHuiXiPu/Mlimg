<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPane" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link v-for="tag in visitedViews" ref="tag" :key="tag.path" :class="isActive(tag) ? 'active' : ''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }" tag="span" class="tags-view-item"
        @click.middle.native="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent.native="openMenu(tag, $event)">
        {{ tag.title }}
        <span v-if="!isAffix(tag)" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)" />
      </router-link>
    </scroll-pane>
    <!-- <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">Refresh</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">Close</li>
      <li @click="closeOthersTags">Close Others</li>
      <li @click="closeAllTags(selectedTag)">Close All</li>
    </ul> -->
  </div>
</template>

<script>
import ScrollPane from './ScrollPane'
import path from 'path'
import Bus from "@/utils/bus"

export default {
  components: { ScrollPane },
  data() {
    return {
      visible: false,
      top: 0,
      left: 0,
      selectedTag: {},
      affixTags: []
    }
  },
  computed: {
    visitedViews() {
      return this.$store.state.tagsView.visitedViews
    },
    routes() {
      return []
      // return this.$store.state.permission.routes
    }
  },
  watch: {
    $route() {
      this.addTags()
      this.moveToCurrentTag()
    },
    visible(value) {
      if (value) {
        document.body.addEventListener('click', this.closeMenu)
      } else {
        document.body.removeEventListener('click', this.closeMenu)
      }
    }
  },
  mounted() {
    this.initTags()
    this.addTags()
    Bus.$on("closeTagView", this.emitCloseTagView)
  },
  beforeDestroy() {
    Bus.$off('closeTagView', this.emitCloseTagView)
  },
  methods: {
    isActive(route) {
      return route.path === this.$route.path
      // return route.fullPath === this.$route.fullPath
    },
    isAffix(tag) {
      return tag.meta && (tag.meta.affix || tag.meta.closeable === false)
    },

    filterAffixTags(routes, basePath = '/') {
      let tags = []
      routes.forEach(route => {
        if (route.meta && route.meta.affix) {
          const tagPath = path.resolve(basePath, route.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta }
          })
        }
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    },
    initTags() {
      const affixTags = this.affixTags = this.filterAffixTags(this.routes)
      for (const tag of affixTags) {
        // Must have tag name
        if (tag.name) {
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },
    addTags() {
      const { name, meta } = this.$route
      if (name === "HomeIndex") {  //首页特殊处理，不显示tagView
        this.$store.dispatch('tagsView/delAllViews')
        return
      }
      if (name) {
        this.$store.dispatch('tagsView/addTagViews', this.$route)
      }
      return false
    },
    moveToCurrentTag() {
      const tags = this.$refs.tag || []
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            this.$refs.scrollPane.moveToTarget(tag)
            // when query is different then update
            if (tag.to.fullPath !== this.$route.fullPath) {
              this.$store.dispatch('tagsView/updateVisitedView', this.$route)
            }
            break
          }
        }
      })
    },
    // refreshSelectedTag(view) {
    //   this.$store.dispatch('tagsView/delCachedView', view).then(() => {
    //     const { fullPath } = view
    //     this.$nextTick(() => {
    //       this.$router.replace({
    //         path: '/redirect' + fullPath
    //       })
    //     })
    //   })
    // },
    closeSelectedTag(view) {
      this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
        if (this.isActive(view)) {
          this.toLastView(visitedViews, view)
        }
      })
      // /**
      //  * @public
      //  * @description 消息通知到业务组件内部,业务组件可以异步改变messager的状态来决定是否关闭
      //  */
      // const messenger = new Promise((resolve, reject) => {
      //   Bus.$emit("closeTagView", {
      //     view,
      //     resolve,
      //     reject
      //   });

      // }).then(() => {
      //   this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
      //     if (this.isActive(view)) {
      //       this.toLastView(visitedViews, view)
      //     }
      //   })
      // }).catch(() => {  //取消关闭

      // })
    },
    // closeOthersTags() {
    //   this.$router.push(this.selectedTag)
    //   this.$store.dispatch('tagsView/delOthersViews', this.selectedTag).then(() => {
    //     this.moveToCurrentTag()
    //   })
    // },
    // closeAllTags(view) {
    //   this.$store.dispatch('tagsView/delAllViews').then(({ visitedViews }) => {
    //     if (this.affixTags.some(tag => tag.path === view.path)) {
    //       return
    //     }
    //     this.toLastView(visitedViews, view)
    //   })
    // },
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push(latestView.fullPath)
      } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard') {
          // to reload home page
          this.$router.replace({ path: '/redirect' + view.fullPath })
        } else {
          this.$router.push('/')
        }
      }
    },
    openMenu(tag, e) {
      const menuMinWidth = 105
      const offsetLeft = this.$el.getBoundingClientRect().left // container margin left
      const offsetWidth = this.$el.offsetWidth // container width
      const maxLeft = offsetWidth - menuMinWidth // left boundary
      const left = e.clientX - offsetLeft + 15 // 15: margin right

      if (left > maxLeft) {
        this.left = maxLeft
      } else {
        this.left = left
      }

      this.top = e.clientY
      this.visible = true
      this.selectedTag = tag
    },
    closeMenu() {
      this.visible = false
    },
    handleScroll() {
      this.closeMenu()
    },
    /**
     * @description 响应业务页面内的关闭tagView事件，如果存在新的路径，则在关闭后跳转至新路由
     * @param {Object} view
     * @param {String} newPath
     */
    emitCloseTagView(view, newPath) {
      if (newPath) {
        this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
          this.$router.push(newPath)
        })
      } else {
        this.closeSelectedTag(view)
      }
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";

.tags-view-container {
  height: 40px;
  width: 100%;
  background: @baseLayoutBgColor;
  // border-bottom: 1px solid #d8dce5;
  // box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .12), 0 0 3px 0 rgba(0, 0, 0, .04);
  border-radius: 8px 8px 0 0;

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 36px;
      line-height: 36px;
      // border: 1px solid #d8dce5;
      color: #495060;
      background: #ffffff;
      padding: 0 15px;
      font-size: 14px;
      margin-left: 1px;
      border-radius: 10px 10px 0 0;
      border-bottom: 1px solid @baseLayoutBgColor;
      // border-left: 1px solid @baseLayoutBgColor;
      // border-right: 1px solid @baseLayoutBgColor;

      // margin-top: 4px;
      &:first-of-type {
        margin-left: 0px;
      }

      &:last-of-type {
        // margin-right: 0px;
      }

      &.active {
        // background-color: #42b983;
        // background-color: #fff;
        // color: #fff;
        color: @modelActiveTabsBgc;
        // border-color: #42b983;
        border-color: @modelActiveTabsBgc;
        border-bottom: unset;
        font-weight: 500;

        &::before {
          content: "";
          background: @modelActiveTabsBgc;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;

      &:hover {
        background: #eee;
      }
    }
  }
}
</style>

<style lang="less">
//reset element css of el-icon-close
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 1px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transform-origin: 100% 50%;

      &:before {
        transform: scale(0.6);
        display: inline-block;
        vertical-align: -2px;
      }

      &:hover {
        background-color: #b4bccc;
        color: #fff;
      }
    }
  }
}
</style>
