import paper from "paper";

export default {
  model: {
    prop: "selected",
    event: "update"
  },
  props: {
    selected: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  // template:
  //   "<div><i v-tooltip.right='tooltip' class='fa fa-x' :class='icon' :style='{ color: iconColor }' @click='click'></i><br></div>",
  data() {
    return {
      tool: null,
      enabled: false,
      cursor: "default",
      color: {
        enabled: "#555",
        active: "#0000ff",
        disabled: "gray",
        toggle: "red"
      }
    };
  },
  methods: {
    onMouseMove() { },
    onMouseDown() { },
    onMouseDrag() { },
    onMouseUp() { },
    click() {
      this.update();
    },
    update() {
      if (this.isDisabled) return;

      this.$emit("update", this.name);
    },
    setPreferences() { },
    bindTool() {
      this.tool = new paper.Tool();

      this.tool.onMouseDown = this.onMouseDown;
      this.tool.onMouseDrag = this.onMouseDrag;
      this.tool.onMouseMove = this.onMouseMove;
      this.tool.onMouseUp = this.onMouseUp;
    }
  },
  computed: {
    isActive() {
      if (this.selected == this.name) {
        this.$emit("setcursor", this.cursor);
        return true;
      }
      return false;
    },
    iconColor() {
      if (this.isDisabled) return this.color.disabled;

      if (this.isToggled) return this.color.toggle;
      if (this.isActive) return this.color.active;

      return this.color.enabled;
    },
    isDisabled() {
      return this.disabled;
    },
    tooltip() {
      let str = this.text
      if (this.isDisabled) {
        str += `<span class="select-annotation-tip">(${this.$t('dataCenter.selectAnnotationTip')})</span>`
      }
      if (this.commands) {
        const command = this.commands.find(item => item.name.includes(this.name))
        if (Array.isArray(command?.default)) {
          const tpl = command.default.map(item => {
            return `<span class="shortcut-key">${item.slice(0, 1).toUpperCase()}${item.slice(1)}</span>`
          }).join('+')
          str += tpl
        }
      }
      return str
    }
  },
  watch: {
    isActive: {
      handler(active) {
        if (active) {
          this.bindTool();
          this.tool.activate();
          if (this.minDistance) {
            this.tool.minDistance = this.minDistance;
          }
        } else if (this.tool) {
          this.tool.remove();
          this.tool = null;
        }
      },
      immediate: true
    },
  },
  beforeDestroy() {
    if (this.tool) {
      this.tool.onMouseDrag = null;
      this.tool.onMouseMove = null;
      this.tool.onMouseUp = null;
      this.tool = null;
    }
  },
};
