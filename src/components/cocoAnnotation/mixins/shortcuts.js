import { mapMutations } from "vuex";

export default {
  data() {
    return {
      commands: []
    };
  },
  methods: {
    ...mapMutations(["undo"]),
    annotator() {
      return [
        {
          title: "General",
          default: ["arrowup"],
          function: () => {
            this.moveCanvas('up');
          },
          name: "Move Up Annotations"
        },
        {
          default: ["arrowdown"],
          function: () => {
            this.moveCanvas('down');
          },
          name: "Move Down Annotations"
        },
        {
          default: ["arrowright"],
          function: () => {
            this.moveCanvas('right');
          },
          name: "Expand Category"
        },
        {
          default: ["arrowleft"],
          function: () => {
            this.moveCanvas('left');
          },
          name: "Collapse Category"
        },
        {
          default: ["space"],
          name: "New Annotation",
          function: () => {
            if (this.currentCategory) {
              this.currentCategory.createAnnotation();
            }
          }
        },
        {
          default: ["delete"],
          name: "Delete Current Annotation",
          function: () => {
            const currentAnnotation = this.getCurrentAnnotation()
            if (currentAnnotation) {
              let currentKeypoint = currentAnnotation.currentKeypoint;
              if (currentKeypoint) {
                currentAnnotation.keypoints.deleteKeypoint(
                  currentKeypoint
                );
                currentAnnotation.tagRecomputeCounter++;
                currentAnnotation.currentKeypoint = null;
              } else {
                currentAnnotation.deleteAnnotation();
              }
            }
          }
        },
        {
          default: ["control", "z"],
          name: "Undo Last Action",
          function: this.undo
        },
        {
          default: ["q"],
          name: "Select Tool",
          function: () => {
            this.activeTool = "Select";
          }
        },
        {
          default: ["w"],
          name: "BBox Tool",
          function: () => {
            if (!this.$refs.bbox?.isDisabled && this.mode === 'detect') this.activeTool = "BBox";
          }
        },
        // {
        //   default: ["n"],
        //   name: "Next Image",
        //   function: this.nextImage
        // },
        // {
        //   default: ["p"],
        //   name: "Previous Image",
        //   function: this.previousImage
        // },
        {
          default: ["r"],
          name: "Polygon Tool",
          function: () => {
            if (!this.$refs.polygon?.isDisabled) this.activeTool = "Polygon";
          }
        },

        {
          default: ["e"],
          name: "Magic Wand Tool",
          function: () => {
            if (!this.$refs.magicwand.isDisabled)
              this.activeTool = "Magic Wand";
          }
        },
        // {
        //   default: ["k"],
        //   name: "Keypoints Tool",
        //   function: () => {
        //     if (!this.$refs.magicwand.isDisabled) this.activeTool = "Keypoints";
        //   }
        // },
        {
          default: ["t"],
          name: "Brush Tool",
          function: () => {
            if (!this.$refs.brush?.isDisabled) this.activeTool = "Brush";
          }
        },
        {
          default: ["a"],
          name: "Line Tool",
          function: () => {
            // 智能标注工具栏显示时可用
            if (!this.$refs.line?.isDisabled && this.isShow) this.activeTool = "Line";
          }
        },
        {
          default: ["y"],
          name: "Eraser Tool",
          function: () => {
            if (!this.$refs.eraser?.isDisabled) this.activeTool = "Eraser";
          }
        },
        {
          default: ["shift", "c"],
          name: "Center Image",
          function: this.fit
        },
        {
          default: ["a"],
          name: "Previous Photo",
          function: this.preFunc
        },
        {
          default: ["d"],
          name: "Next Photo",
          function: this.nextFunc
        },
        {
          default: ["s"],
          name: "Save",
          function: this.$refs.refSaveBtn?.execute
        },
        {
          title: "BBox Tool Shortcuts",
          default: ["escape"],
          name: "Remove Current BBox",
          function: () => {
            this.$refs.bbox?.isModalOpen ? null : this.$refs.bbox?.deleteBbox();
          }
        },
        {
          title: "Polygon Tool Shortcuts",
          default: ["escape"],
          name: "Remove Current Polygon",
          function: () => {
            this.$refs.polygon?.isModalOpen ? null : this.$refs.polygon?.deletePolygon();
          }
        },
        {
          title: "Eraser Tool Shortcuts",
          default: ["1"],
          name: "Increase Radius",
          function: this.$refs.eraser?.increaseRadius
        },
        {
          default: ["2"],
          name: "Decrease Radius",
          function: this.$refs.eraser?.decreaseRadius
        },
        {
          title: "Brush Tool Shortcuts",
          default: ["1"],
          name: "Increase Radius",
          function: this.$refs.brush?.increaseRadius
        },
        {
          default: ["2"],
          name: "Decrease Radius",
          function: this.$refs.brush?.decreaseRadius
        },
        {
          title: "Magic Tool Shortcuts",
          default: ["shift", "click"],
          name: "Subtract Selection",
          readonly: true
        },
        {
          default: ["c"],
          name: "ShowOrHideAnnotations",
          function: () => {
            if (this.isShowAllAnnotations) {
              this.hideAll();
            } else {
              this.showAll();
            }
          }
        },
      ];
    }
  },
  mounted() {
    // if (this.$route.name === "annotate") {
    //   this.commands = this.annotator();
    // }
    this.commands = this.annotator();
  }
};
