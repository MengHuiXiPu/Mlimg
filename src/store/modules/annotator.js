export default {
  state: {
    process: [],
    undo: [],
    redo: [],
    dataset: "",
    taskId: '',
    GroupLoading: [],
    paperScope: null,
    annotatorOpacity: 0.2,
    selectedLabelArr: [],
    tempAnnotationSavedDataArr: [],
  },
  mutations: {
    setGroupLoading(state, loadingItem) {
      state.GroupLoading = state.GroupLoading.concat(loadingItem);
    },
    modifyGroupLoading(state, loadingList) {
      state.GroupLoading = loadingList
    },
    clearLoading(state) {
      state.GroupLoading.length = 0
      state.GroupLoading.splice(0)

    },
    cancelLoadingItem(state, imageId) {
      let index = state.GroupLoading.indexOf(imageId);
      if (index > -1) {
        state.GroupLoading.splice(index, 1);
      }
    },
    setDataset(state, dataset) {
      state.dataset = dataset;
    },
    setTaskId(state, taskId) {
      state.taskId = taskId;
    },
    addProcess(state, process) {
      state.process.push(process);
    },
    removeProcess(state, process) {
      let index = state.process.indexOf(process);
      if (index > -1) {
        state.process.splice(index, 1);
      }
    },
    resetUndo(state) {
      state.undo = [];
    },
    addUndo(state, action) {
      state.undo.push(action);
    },
    undo(state) {
      let action = state.undo.pop();
      state.redo.push(action);
      if (action != null) {
        action.undo();
      }
    },
    redo(state) {
      let action = state.redo.shift();
      state.undo.push(action);
      if (action != null) {
        action.undo();
      }
    },
    removeUndos(state, action) {
      state.undo = state.undo.filter(undo => undo.action !== action);
    },
    removeOneUndo(state, name) {
      state.undo = state.undo.filter(undo => undo.name !== name);
    },
    setPaperScope(state, paper) {
      state.paperScope = paper
    },
    setAnnotatorOpacity(state, opacity) {
      state.annotatorOpacity = opacity
    },
    setSelectedLabelId(state, { imageId, labelId }) {
      const { selectedLabelArr } = state
      const obj = selectedLabelArr.find(
        (item) => item.imageId === imageId
      );
      if (obj) {
        obj.labelId = labelId
      } else {
        state.selectedLabelArr.push({ imageId, labelId })
      }
    },
    delLabelId(state, imageId) {
      const { selectedLabelArr } = state
      state.selectedLabelArr = selectedLabelArr.filter(item => item.imageId !== imageId)
    },
    setTempAnnotationSavedDataArr(state, data) {
      state.tempAnnotationSavedDataArr.push(data)
    },
    clearTempAnnotationSavedDataArr(state, id) {
      if (id) {
        state.tempAnnotationSavedDataArr = state.tempAnnotationSavedDataArr.filter(item => item.annotationId !== id)
      } else {
        state.tempAnnotationSavedDataArr = []
      }
    }
  },
  actions: {
    doSetPaperScope({ commit }, paper) {
      commit('setPaperScope', paper)
    },
    doSetAnnotatorOpacity({ commit }, opacity) {
      commit('setAnnotatorOpacity', opacity)
    },
    doSetSelectedLabelId({ commit }, { imageId, labelId }) {
      commit('setSelectedLabelId', { imageId, labelId })
    },
    doDelLabelId({ commit }, imageId) {
      commit('delLabelId', imageId)
    },
    doSetTempAnnotationSavedDataArr({ commit }, data) {
      commit('setTempAnnotationSavedDataArr', data)
    },
    doClearTempAnnotationSavedDataArr({ commit }, id) {
      commit('clearTempAnnotationSavedDataArr', id)
    },
  }
}