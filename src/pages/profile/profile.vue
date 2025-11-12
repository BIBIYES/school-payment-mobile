<template>
  <view class="profile-page">
    <view class="form-container">
      <view class="form-item required">
        <view class="form-label">姓名</view>
        <input
          class="form-input"
          v-model="formData.name"
          placeholder="请输入姓名"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item required">
        <view class="form-label">身份证号</view>
        <input
          class="form-input"
          v-model="formData.idCard"
          placeholder="请输入身份证号"
          placeholder-class="input-placeholder"
          maxlength="18"
        />
      </view>

      <view class="form-item required">
        <view class="form-label">学号</view>
        <input
          class="form-input"
          v-model="formData.studentNo"
          placeholder="请输入学号"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item required">
        <view class="form-label">性别</view>
        <radio-group class="radio-group" @change="handleGenderChange">
          <label class="radio-item">
            <radio
              :value="'男'"
              :checked="formData.gender === '男'"
              color="#0f62fe"
            />
            <text>男</text>
          </label>
          <label class="radio-item">
            <radio
              :value="'女'"
              :checked="formData.gender === '女'"
              color="#0f62fe"
            />
            <text>女</text>
          </label>
        </radio-group>
      </view>

      <view class="form-item required">
        <view class="form-label">院系</view>
        <input
          class="form-input"
          v-model="formData.department"
          placeholder="请输入院系"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item required">
        <view class="form-label">专业</view>
        <input
          class="form-input"
          v-model="formData.major"
          placeholder="请输入专业"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item required">
        <view class="form-label">手机号</view>
        <input
          class="form-input"
          v-model="formData.phone"
          type="number"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
          maxlength="11"
        />
      </view>

      <view class="form-item">
        <view class="form-label">年级</view>
        <input
          class="form-input"
          v-model="formData.grade"
          placeholder="请输入年级"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item">
        <view class="form-label">班级</view>
        <input
          class="form-input"
          v-model="formData.className"
          placeholder="请输入班级"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item">
        <view class="form-label">民族</view>
        <input
          class="form-input"
          v-model="formData.nation"
          placeholder="请输入民族"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item">
        <view class="form-label">政治面貌</view>
        <input
          class="form-input"
          v-model="formData.politicalStatus"
          placeholder="请输入政治面貌"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item">
        <view class="form-label">学历</view>
        <input
          class="form-input"
          v-model="formData.education"
          placeholder="请输入学历"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item">
        <view class="form-label">户籍地址</view>
        <input
          class="form-input"
          v-model="formData.address"
          placeholder="请输入户籍地址"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-item">
        <view class="form-label">户籍性质</view>
        <radio-group class="radio-group" @change="handleHouseholdChange">
          <label class="radio-item">
            <radio
              :value="'农村'"
              :checked="formData.householdType === '农村'"
              color="#0f62fe"
            />
            <text>农村</text>
          </label>
          <label class="radio-item">
            <radio
              :value="'城市'"
              :checked="formData.householdType === '城市'"
              color="#0f62fe"
            />
            <text>城市</text>
          </label>
        </radio-group>
      </view>

      <view class="form-item">
        <view class="form-label">辅导员</view>
        <input
          class="form-input"
          v-model="formData.instructor"
          placeholder="请输入辅导员姓名"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-actions">
        <button
          class="submit-btn"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? "提交中..." : "保存信息" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { getProfile, updateProfile } from "@/services/student.js";

export default {
  data() {
    return {
      formData: {
        name: "",
        idCard: "",
        studentNo: "",
        gender: "",
        department: "",
        major: "",
        phone: "",
        grade: "",
        className: "",
        nation: "",
        politicalStatus: "",
        education: "",
        address: "",
        householdType: "",
        instructor: "",
      },
      submitting: false,
      loading: false,
    };
  },
  onLoad() {
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      try {
        this.loading = true;
        uni.showLoading({ title: "加载中..." });
        const profile = await getProfile();
        if (profile) {
          this.formData = {
            name: profile.name || "",
            idCard: profile.idCard || "",
            studentNo: profile.studentNo || "",
            gender: profile.gender || "",
            department: profile.department || "",
            major: profile.major || "",
            phone: profile.phone || "",
            grade: profile.grade || "",
            className: profile.className || "",
            nation: profile.nation || "",
            politicalStatus: profile.politicalStatus || "",
            education: profile.education || "",
            address: profile.address || "",
            householdType: profile.householdType || "",
            instructor: profile.instructor || "",
          };
        }
      } catch (err) {
        console.error("加载个人信息失败:", err);
        // 不显示错误提示，允许用户填写新信息
      } finally {
        this.loading = false;
        uni.hideLoading();
      }
    },
    handleGenderChange(e) {
      this.formData.gender = e.detail.value;
    },
    handleHouseholdChange(e) {
      this.formData.householdType = e.detail.value;
    },
    validateForm() {
      const { name, idCard, studentNo, gender, department, major, phone } =
        this.formData;

      if (!name || !name.trim()) {
        uni.showToast({ title: "请输入姓名", icon: "none" });
        return false;
      }
      if (!idCard || !idCard.trim()) {
        uni.showToast({ title: "请输入身份证号", icon: "none" });
        return false;
      }
      if (
        !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(
          idCard
        )
      ) {
        uni.showToast({ title: "身份证号格式不正确", icon: "none" });
        return false;
      }
      if (!studentNo || !studentNo.trim()) {
        uni.showToast({ title: "请输入学号", icon: "none" });
        return false;
      }
      if (!gender) {
        uni.showToast({ title: "请选择性别", icon: "none" });
        return false;
      }
      if (!department || !department.trim()) {
        uni.showToast({ title: "请输入院系", icon: "none" });
        return false;
      }
      if (!major || !major.trim()) {
        uni.showToast({ title: "请输入专业", icon: "none" });
        return false;
      }
      if (!phone || !phone.trim()) {
        uni.showToast({ title: "请输入手机号", icon: "none" });
        return false;
      }
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        uni.showToast({ title: "手机号格式不正确", icon: "none" });
        return false;
      }

      return true;
    },
    async handleSubmit() {
      if (!this.validateForm()) {
        return;
      }

      try {
        this.submitting = true;
        uni.showLoading({ title: "提交中..." });

        await updateProfile(this.formData);

        // 更新本地存储的资料完成状态
        uni.setStorageSync("profileCompleted", true);

        uni.showToast({ title: "保存成功", icon: "success" });

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } catch (err) {
        const message = err?.message || "保存失败，请重试";
        uni.showToast({ title: message, icon: "none" });
      } finally {
        this.submitting = false;
        uni.hideLoading();
      }
    },
  },
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f6f7fb;
  box-sizing: border-box;
}

.form-container {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 98, 254, 0.06);
}

.form-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2a44;
  margin-bottom: 40rpx;
  text-align: center;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-item.required .form-label::after {
  content: "*";
  color: #ff5c5c;
  margin-left: 8rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2a44;
  margin-bottom: 16rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f6f8ff;
  border: 2rpx solid #e5e8f0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1f2a44;
  box-sizing: border-box;
  transition: all 0.3s;
}

.form-input:focus {
  background: #fff;
  border-color: #0f62fe;
}

.input-placeholder {
  color: #a8aec0;
  font-size: 28rpx;
}

.radio-group {
  display: flex;
  gap: 40rpx;
  padding: 16rpx 0;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #1f2a44;
}

.form-actions {
  margin-top: 64rpx;
  padding-top: 32rpx;
  border-top: 2rpx solid #f0f2f7;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  border: none;
  box-shadow: 0 12rpx 32rpx rgba(15, 98, 254, 0.25);
}

.submit-btn[disabled] {
  opacity: 0.6;
}
</style>
