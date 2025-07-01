<template>
    <div class="page-content">
    <a-card :bordered="false" class="step-content">
        <div class="addModelStep-header-steps">
            <a-steps slot="extra" class="steps" :current="currentTab" size="small" progressDot>
                <a-step title="新建/修改算法模板" />
                <a-step title="原图Resize处理" />
                <a-step title="各部件标注" />
                <a-step title="制作彩图" />
                <a-step title="模板验证" />
            </a-steps>
        </div>
    </a-card>
    <a-card :bordered="false" style="flex: 1" class="card-content">
        <step2 v-if="currentTab === 0" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" />
        <step3 v-if="currentTab === 1" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" />
        <step4 v-if="currentTab === 2" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" />
        <step5 v-if="currentTab === 3" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" />
        <step6 v-if="currentTab === 4" @finish="finish" @prevStep="prevStep" @cancel="cancel" />
    </a-card>
    </div>
</template>

<script>
    import Step2 from './Step2'
    import Step3 from './Step3'
    import Step4 from './CanvasSelect'
    import Step5 from './Step5'
    import Step6 from './Step6'
    export default {
        name: 'Stepform',
        components: {//引用的其他组件
            Step2,
            Step3,
            Step4,
            Step5,
            Step6,
        },
        props: {//从父组件传来数据

        },
        data() {
            return {
                currentTab: 0,//当前步骤
                active: 0,
                loadData: false,
            }
        },
        computed:{

        },
        mounted() {

        },
        methods: {
            nextStep() {
                if (this.currentTab < 4) {
                    this.currentTab += 1;
                }
            },
            prevStep() {
                if (this.currentTab > 0) {
                    this.currentTab -= 1;
                }
                else if (this.currentTab == 0) {
                    this.$emit('returnlist');
                }
            },
            cancel() {
                this.$emit('returnlist');
            },
            finish() {
                this.currentTab = 0
                this.active = 0
            },
        }
    }
</script>

<style lang="less" scoped>
	.page-content {
		height: unset;
		flex: 1;
		border-radius: 16px;
		.step-content{
				/deep/ .ant-card-body{
						padding: 15px 20px 5px 20px;
						border-bottom: 2px solid #e6e7ea;
				}
				/deep/ .addModelStep-header-steps {
						margin: 0 auto;
				}
		}
		.card-content /deep/ .ant-card-body {
				padding: 0;
				height: 100%;
		}
		.steps {
				max-width: 80%;
				margin: 0 auto 15px auto;
		}
	}
</style>