import { readOnly } from "@pipeline/Editor/store/index.js";
export default (graph) => {
  // 控制连接桩显示/隐藏
  const showPorts = (ports, show) => {
    for (let i = 0, len = ports.length; i < len; i = i + 1) {
      ports[i].style.visibility = show ? 'visible' : 'hidden'
    }
  }
  graph.on('cell:mouseenter', () => {
    if (readOnly.value) return
    const container = document.getElementById('graph-container')
    const ports = container.querySelectorAll('.x6-port-body')
    showPorts(ports, true)
  })
  graph.on('cell:mouseleave', ({ node }) => {
    if (readOnly.value) return
    // const isSelected = graph.isSelected(node)
    const container = document.getElementById('graph-container')
    const ports = container.querySelectorAll('.x6-port-body')
    showPorts(ports, false)
  })
}