import Vue from "vue"
import tableResize from "@/components/tableResize"

const resize = {
  bind: function (el) {
    console.log(el)
    const cell = el.querySelector('.tcl-table-thead').querySelector('tr')
    console.log(cell)
    cell.children.forEach((tr, index) => {
      if (index === 0 || index === 1) {
        const resizeDom = Vue.extend(tableResize)
        const content = new resizeDom().$mount()
        const dom = tr.querySelectorAll('.custom-table-resize')
        dom.forEach(item => {
          tr.removeChild(item)
        })
        tr.appendChild(content.$el)
      }
    })
  }
}

const install = function(Vue) {
  Vue.directive('resize', resize)
}

export default { install }