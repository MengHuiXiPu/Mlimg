<template>
  <div>
    <i
      v-tooltip.right="text"
      class="fa fa-x fa-trash-o"
      :class="{'disabled-style': isDisabled}"
      :style="{ color: iconColor, fontSize: '22px' }"
      @click="clickFunc"
    ></i
    ><br />
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      role="dialog"
      aria-hidden="true"
      data-backdrop="static"
      data-keyboard="false"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Are you sure to delete this item?</h5>
          </div>
          <!-- <div class="modal-body">Are you sure to delete this item?</div> -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-dismiss="modal"
            >
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="confirmDel">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JQuery from "jquery";
import button from "../../mixins/toolBar/button";
import axios from "axios";
import { mapMutations } from "vuex";
let $ = JQuery;
export default {
  name: "DeleteButton",
  mixins: [button],
  inject: ["modalInstance"],
  props: {
    image: {
      type: Object,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      name: "Delete Image",
      text: this.$t('dataCenter.delImage'),
      icon: "fa-trash-o",
    };
  },
  methods: {
    ...mapMutations(["setGroupLoading"]),
    clickFunc() {
      if (this.isDisabled) {
        return
      }
      this.click()
    },
    execute() {
      $("#exampleModal").modal({
        show: true,
        backdrop: false,
      });
    },
    confirmDel() {
      this.setGroupLoading(this.image.id);
      axios
        .delete(
          `/api/v1/datacenter/dataListFileDetail/removeMultiPicture?dlId=${this.$parent.dataset.id}&ids=${this.image.id}`
        )
        .then(() => {
          this.modalInstance.deleteImg(this.image.id);
          $("#exampleModal").modal("hide")
        });
    },
  },
};
</script>

<style scoped>
.disabled-style {
  cursor: not-allowed;
}
</style>
