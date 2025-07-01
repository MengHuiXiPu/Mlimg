<template>
  <!-- <div class="card" @click="click" v-show="show">
    <div class="card-header" :id="'heading' + category.id">
      <div :style="{ color: isSelected ? 'white' : 'gray' }">
        <div>
          <i v-if="isSelected" class="fa fa-check-square-o category-icon" />
          <i v-else class="fa fa-square-o category-icon" />
        </div>

        <span
          class="btn btn-link btn-sm collapsed category-text"
          style="color: inherit"
          aria-expanded="false"
        >
          {{ category.name }}
        </span>
      </div>
    </div>
  </div> -->
  <div :class="{'border-add': isSelected, 'label-box': true}" @click="click" v-show="show">
    <!-- :style="{ color: isSelectedColor, borderColor: isSelectedColor }" -->
    <!-- <div> -->
    <!-- <i v-if="isSelected" class="fa fa-check-square-o category-icon" /> -->
    <!-- <i v-else class="fa fa-square-o category-icon" /> -->
    <!-- </div> -->

    {{ category.name }}
    <!-- <span
      class="btn btn-link btn-sm collapsed category-text"
      style="color: inherit"
      aria-expanded="false"
    >
    </span> -->
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Label",
  model: {
    prop: "categoryIds",
    event: "update",
  },
  props: {
    imageId: {
      type: String,
      required: true,
    },
    category: {
      type: Object,
      required: true,
    },
    hasSelected: {
      type: Boolean,
      required: true,
    },
    annotationId: {
      type: String,
      required: true,
    },
    categoryIds: {
      type: Array,
      required: true,
    },
    search: {
      type: String,
      required: true,
    },
  },
  data() {
    return {};
  },
  computed: {
    show() {
      let search = this.search.toLowerCase();
      if (search.length === 0) return true;
      return this.category.name.toLowerCase().includes(search);
    },
    isSelected() {
      return this.category.annotations.some((item) => item.mode === 1);
      // return this.categoryIds.indexOf(this.category.id) > -1;
    },
    isSelectedColor() {
      return this.isSelected ? "#1890ff" : "white";
    },
  },
  methods: {
    click() {
      // to do
      if (this.hasSelected) {
        axios
          .put(
            `/api/v1/datacenter/dataListAnnotation/updateLabelById/${this.annotationId}`,
            { labelId: this.category.id }
          )
          .then(() => {
            this.$emit("on-selected");
          });
      } else {
        axios
          .post("/api/v1/datacenter/dataListAnnotation/create", {
            imageId: this.imageId,
            labelId: this.category.id,
            mode: 1,
          })
          .then(() => {
            this.$emit("on-selected");
          });
      }
      // let copy = this.categoryIds.slice();
      // if (!this.isSelected) {
      //   copy.push(this.category.id);
      // } else {
      //   copy.splice(copy.indexOf(this.category.id), 1);
      // }
      // this.$emit("update", copy);
    },
  },
};
</script>

<style scoped>
/* .list-group-item {
  height: 22px;
  font-size: 13px;
  padding: 2px;
  background-color: #404552;
} */
.label-box {
  /* width: 80px; */
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
}
.border-add {
  border: 2px solid #3d41ff;
}
/* .category-icon {
  display: block;
  float: left;
  margin: 0;
  padding: 5px 10px 5px 10px;
}

.btn-link {
  margin: 0;
  padding: 0;
} */

/* .card-header {
  display: block;
  margin: 0;
  padding: 0;
} */

/* .card {
  background-color: #4b5162;
} */
</style>
