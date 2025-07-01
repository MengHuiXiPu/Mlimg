import { uniqueId } from '../utils'
const _setUniqueId = Symbol('setUniqueId')
const _getIdList = Symbol('getIdList')
class command {
    editor = null;
    undoList = []
    redoList = []
    idList = null //当前graph上的所有edge/node的id Set
    constructor(editor) {
        this.editor = editor;
    }
    executeCommand(key, datas) {
        const list = []
        datas.map(data => {
            // 采集graph的id信息
            this[_getIdList]()
            let model = data
            if (key === 'add') {
                this[_setUniqueId](model)
                // model.id = uniqueId()
            }
            if (key === 'delete') {
                if (data.getType() === 'node') {
                    const edges = data.getEdges()
                    model = data.getModel()
                    model.type = data.getType()
                    model.id = data.get('id')
                    edges.forEach(edge => {
                        let edgeModel = edge.getModel()
                        edgeModel.type = 'edge'
                        edgeModel.id = edge.get('id')
                        list.push(edgeModel)
                    })
                } else if (data.getType() === 'edge') {
                    model = data.getModel()
                    model.type = data.getType()
                    model.id = data.get('id')
                }
            }
            list.push(model)

            this.doCommand(key, model)

        });
        this.undoList.push({ key, datas: list })
        if(key==='delete'){
            this.redoList =[]
        }
        this.editor.emit(key, { undoList: this.undoList, redoList: this.redoList })
    }
    doCommand(key, data) {
        switch (key) {
            case 'add':
                this.add(data.type, data)
                break;
            case "update":
                this.update(data.item, data.newModel)
                break
            case "delete":
                this.remove(data)
                break
        }
    }
    add(type, item) {
        this.editor.add(type, item)
    }
    update(item, model) {
        this.editor.update(item, model)
    }
    remove(item) {
        this.editor.remove(item)
    }
    undo() {
        const undoData = this.undoList.pop()
        const edgeList = []
        const list = []
        for (let i = 0; i < undoData.datas.length; i++) {
            const data = undoData.datas[i]
            if (data.type === 'edge') {
                edgeList.push(data)
                continue
            }
            list.push(data)
            this.doundo(undoData.key, data)
        }
        for (let i = 0; i < edgeList.length; i++) {
            const edge = edgeList[i]
            if (edge.source.destroyed) {
                edge.source = edge.sourceId

            }
            if (edge.target.destroyed) {
                edge.target = edge.targetId
            }
            list.push(edge)
            this.doundo(undoData.key, edge)
        }
        this.redoList.push({ key: undoData.key, datas: list })
        this.editor.emit(undoData.key, { undoList: this.undoList, redoList: this.redoList })
    }
    doundo(key, data) {
        switch (key) {
            case 'add':
                this.remove(data)
                break;
            case "update":
                this.update(data.item, data.oldModel)
                break
            case "delete":
                this.add(data.type, data)
                break
        }
    }
    redo() {
        const redoData = this.redoList.pop()
        const list = []
        const edgeList = []
        for (let i = 0; i < redoData.datas.length; i++) {
            const data = redoData.datas[i]
            if (data.type === 'edge') {
                edgeList.push(data)
                continue
            }
            list.push(data)
            this.doredo(redoData.key, data)
        }
        for (let i = 0; i < edgeList.length; i++) {
            const edge = edgeList[i]
            if (edge.source.destroyed) {
                edge.source = edge.sourceId

            }
            if (edge.target.destroyed) {
                edge.target = edge.targetId
            }
            list.push(edge)
            this.doredo(redoData.key, edge)
        }
        this.undoList.push({ key: redoData.key, datas: list })

        this.editor.emit(redoData.key, { undoList: this.undoList, redoList: this.redoList })
    }
    doredo(key, data) {
        switch (key) {
            case 'add':
                this.add(data.type, data)
                break;
            case "update":
                this.update(data.item, data.newModel)
                break
            case "delete":
                this.remove(data)
                break
        }
    }
    delete(item) {
        this.executeCommand('delete', [item])
    }
    // 获取graph上所有的edge和node的id
    [_getIdList]() {
        if(!this.editor.graph) { //是新建的编辑器
            this.idList = new Set()
        }else {
            const graph = this.editor.graph
            const allNodeIds = graph.getNodes().map(node => parseInt(node.getModel().id))
            const allEdgeIds = graph.getEdges().map(edge => parseInt(edge.getModel().id))
            this.idList = new Set([...allNodeIds, ...allEdgeIds])
            console.log(111111111,allEdgeIds)
        }
    }
    // check true set，false 则递归生成新的id set
    [_setUniqueId] (model) {
        const newId = uniqueId()
        if(this.idList.has(parseInt(newId))) {
            this[_setUniqueId](model)
        }else {
            model.id = newId
        }
    }
}

export default command;