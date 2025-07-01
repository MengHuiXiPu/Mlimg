<template>
  <div
    :class="{ 'border-add': isSelected, 'label-box': true }"
    @click="click"
    v-show="show"
  >
    {{ category.name }}
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "Label",
  props: {
    category: {
      type: Object,
      required: true,
    },
    search: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState({
      selectedLabelArr: (state) => state.annotator.selectedLabelArr,
    }),
    selectedLabelId() {
      const obj = this.selectedLabelArr.find(
        (item) => item.imageId === this.imageId
      );
      return obj?.labelId;
    },
    show() {
      let search = this.search.toLowerCase();
      if (search.length === 0) return true;
      return this.category.name.toLowerCase().includes(search);
    },
    isSelected() {
      return this.category.id === this.selectedLabelId;
    },
    isSelectedColor() {
      return this.isSelected ? "#1890ff" : "white";
    },
  },
  methods: {
    click() {
      this.$store.dispatch("doSetSelectedLabelId", {
        imageId: this.imageId,
        labelId: this.category.id,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.label-box {
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
  color: #fff;
  background-color: #1890ff;
  border-color: #1890ff;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  &:hover {
    background: #3d41ff;
  }
}
.border-add {
  background: #3d41ff;
}
</style>
