<template>
    <div>
        <!-- 面包屑导航区域 -->
        <el-breadcrumb separator-class="el-icon-arrow-right">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/roles' }">权限管理</el-breadcrumb-item>
            <el-breadcrumb-item>权限列表</el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 卡片视图区域 -->
        <el-card>
            <!-- border是边框  stripe是表格数据隔行变色 -->
            <el-table :data="rightsList" border stripe>
                <el-table-column label="#" type="index" align="center"></el-table-column>
                <el-table-column label="权限名称" prop="auth_name" align="center"></el-table-column>
                <el-table-column label="路径" prop="path" align="center"></el-table-column>
                <el-table-column label="权限等级" prop="level" align="center">
                    <template slot-scope="scope">
                        <el-tag v-if="scope.row.level === 1">一级</el-tag>
                        <el-tag v-if="scope.row.level === 2" type="success">二级</el-tag>
                    </template> 
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                // 权限列表
                rightsList: []
            }
        },
        created() {
            // 获取所有的权限
            this.getRightsList();
        },
        methods: {
            // 获取权限列表
            async getRightsList() {
                const { data: res } = await this.$http.get('right/list');
                if(res.meta.status !== 200)   return this.$message.error('获取权限列表失败！');
                this.rightsList = res.data;
                this.$message.success('获取权限列表成功！');
                console.log(this.rightsList);
            }
        }
    }
</script>

<style lang="less" scoped>

</style>