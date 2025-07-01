<template>
  <div ref="customResize" class="custom-table-resize"></div>
</template>

<script>
export default {
  name: 'table-header-resize',
  data () {
    return {
      resizeDom: null,
      resizeParentDom: null,
      resize: false,
      resizeMax: 1000
    }
  },
  beforeDestroy () {
    if (this.resizeDom) this.deleteResize()
  },
  mounted () {
    this.$nextTick(() => {
      this.activeResize()
    })
  },
  methods: {
    mousedown(e) {
      // e.preventDefault()
      const domPosition = this.resizeDom.getBoundingClientRect()
      if (e.target.className === "custom-table-resize" ||
        ((e.clientX > domPosition.x - 8 && e.clientX < domPosition.x + 8) && (e.clientY > domPosition.top && e.clientY < domPosition.bottom))) {
        this.resize = true
      }
    },
    mouseup(e) {
      // e.preventDefault()
      this.resize = false
    },
    mousemove(e) {
      // e.preventDefault()
      const domPosition = this.resizeDom.getBoundingClientRect()
      if ((e.clientX > domPosition.x - 8 && e.clientX < domPosition.x + 8) && (e.clientY > domPosition.top && e.clientY < domPosition.bottom)) {
        e.target.style.cursor = 'col-resize'
      } else {
        e.target.style.cursor = ''
      }
      if (!this.resize) return false
      if (this.resizeDom.offsetLeft < 80) {
        this.resizeDom.style.left = '80px'
        this.resizeParentDom.style.width = '80px'
        return false
      }
      if (this.resizeDom.offsetLeft > this.resizeMax * 0.5) {
        this.resizeDom.style.left = this.resizeMax * 0.5 + 'px'
        this.resizeParentDom.style.width = this.resizeMax * 0.5 + 2 + 'px'
        return false
      }
      const _x = e.movementX
      this.resizeDom.style.left = this.resizeDom.offsetLeft + _x + 'px'
      this.resizeParentDom.style.width = this.resizeDom.offsetLeft + 2 + 'px'
    },
    activeResize () {
      this.resizeDom = this.$refs.customResize
      let index = 0
      this.resizeDom.parentElement.parentElement.children.forEach((el, _index) => {
        const key = el.getAttribute('key')
        if (key === this.resizeDom.parentElement.getAttribute('key')) {
          index = _index
        }
      })
      this.getParentNode(this.resizeDom, 'TABLE', index)
      if (!this.resizeDom) return false
      this.resizeDom.addEventListener('mousedown', this.mousedown, false)
      window.addEventListener('mousemove', this.mousemove, false)
      window.addEventListener('mouseup', this.mouseup, false)
    },
    deleteResize () {
      this.resizeDom = null
      this.resizeParentDom = null
      this.resizeDom.removeEventListener('mousedown', this.mousedown, false)
      window.removeEventListener('mousemove', this.mousemove, false)
      window.removeEventListener('mouseup', this.mouseup, false)
    },
    getParentNode (dom, name, index) {
      if (dom.tagName === name) {
        this.resizeParentDom = dom.children[0].children[index]
        this.resizeParentDom.setAttribute('key', index)
        this.resizeMax = dom.offsetWidth
        return dom
      } else {
        this.getParentNode(dom.parentElement, name, index)
      }
    }
  }
}
</script>