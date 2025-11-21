<template>
  <view class="page">
    <view class="top-area">
      <!-- 平台标题区 -->
      <view class="hero-section">
        <view class="hero-badge">DEMO VERSION</view>
        <text class="hero-title">重庆机电职业技术大学缴费平台</text>
        <text class="hero-subtitle">
          Chongqing Electromechanical University Payment Platform
        </text>
        <view class="hero-user" v-if="userInfo.nickname">
          <image
            class="hero-avatar"
            :src="userInfo.avatarUrl || '/static/default-avatar.png'"
            mode="aspectFill"
          />
          <view class="hero-greeting">
            <text class="hero-hello">你好，</text>
            <text class="hero-nickname">{{ userInfo.nickname }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="content">
      <!-- 资料完成提示 -->
      <view class="profile-alert" v-if="!profileCompleted">
        <view class="alert-content">
          <view class="alert-icon">!</view>
          <view class="alert-text">
            <text class="alert-title">请完善个人信息</text>
            <text class="alert-desc">完善信息后才能进行缴费</text>
          </view>
        </view>
        <button class="alert-btn" @click="goToProfile">去完善</button>
      </view>

      <!-- 工种列表 -->
      <view class="job-types-section">
        <view class="loading-state" v-if="loading">
          <text class="loading-text">加载中...</text>
        </view>

        <view class="empty-state" v-else-if="jobTypes.length === 0">
          <text class="empty-text">暂无可缴费项目</text>
        </view>

        <view class="job-list" v-else>
          <view class="job-card" v-for="job in jobTypes" :key="job.id">
            <view class="job-header">
              <text class="job-name">{{ job.jobName }}</text>
              <view class="job-level">{{ job.level }}</view>
            </view>

            <view class="job-detail" v-if="job.software">
              <text class="detail-label">软件：</text>
              <text class="detail-value">{{ job.software }}</text>
            </view>

            <view class="job-footer">
              <view class="price-section">
                <text class="price-label">缴费金额</text>
                <view class="price-wrapper">
                  <text class="price-symbol">¥</text>
                  <text class="price-value">{{ formatFee(job) }}</text>
                </view>
              </view>
              <button
                class="pay-btn"
                @click="handlePayClick(job)"
                :disabled="paying"
              >
                {{ paying ? "处理中..." : "立即缴费" }}
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 缴费信息弹窗 -->
    <view class="modal-mask" v-if="showOrderModal" @click="closeOrderModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">填写缴费信息</text>
          <text class="modal-close" @click="closeOrderModal">×</text>
        </view>
        <view class="modal-body">
          <view class="modal-field">
            <text class="field-label">批次名称</text>
            <input
              class="field-input"
              v-model="orderForm.batchName"
              placeholder="请输入批次名称，如：2024年春季"
              placeholder-class="input-placeholder"
            />
          </view>
          <view class="modal-field">
            <text class="field-label">学期</text>
            <input
              class="field-input"
              v-model="orderForm.semester"
              placeholder="请输入学期，如：2023-2024学年第二学期"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeOrderModal">
            取消
          </button>
          <button
            class="modal-btn confirm-btn"
            @click="confirmOrder"
            :disabled="
              paying || !orderForm.batchName || !orderForm.semester
            "
          >
            {{ paying ? "处理中..." : "确认缴费" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { miniLogin } from "@/services/auth.js";
import { getJobTypeList } from "@/services/jobType.js";
import { createOrder } from "@/services/order.js";
import { getProfile } from "@/services/student.js";
import {
  buildOAuthUrl,
  getQueryParam,
  removeQueryParam,
} from "@/utils/oauth.js";

export default {
  data() {
    return {
      userInfo: {
        nickname: "",
        avatarUrl: "",
      },
      profileCompleted: false,
      jobTypes: [],
      loading: false,
      paying: false,
      showOrderModal: false,
      selectedJob: null,
      orderForm: {
        batchName: "",
        semester: "",
      },
    };
  },
  onLoad() {
    this.initPage();
  },
  onShow() {
    // 每次显示页面时刷新资料完成状态
    this.checkProfileStatus();
  },
  methods: {
    async initPage() {
      try {
        const loggedIn = await this.performLogin();
        if (!loggedIn) return;
        await this.loadJobTypes();
      } catch (err) {
        console.error("初始化页面失败:", err);
      }
    },
    formatFee(job) {
      const fee = job?.feeAmount ?? job?.fee;
      if (fee === null || fee === undefined || fee === "") {
        return "0.00";
      }
      const amount = Number(fee);
      if (!Number.isNaN(amount)) {
        return amount.toFixed(2);
      }
      const parsed = parseFloat(fee);
      return Number.isNaN(parsed) ? "0.00" : parsed.toFixed(2);
    },
    async performLogin() {
      try {
        uni.showLoading({ title: "登录中..." });

        const cachedToken = uni.getStorageSync("token");
        if (cachedToken) {
          this.loadUserInfoFromStorage();
          return true;
        }

        const code = getQueryParam("code");
        if (!code) {
          this.redirectToOAuth();
          return false;
        }

        const nickname = uni.getStorageSync("nickname") || "";
        const avatarUrl = uni.getStorageSync("avatarUrl") || "";

        const authInfo = await miniLogin(code, nickname, avatarUrl);

        const finalNickname = authInfo.nickname || nickname;
        const finalAvatar = authInfo.avatarUrl || avatarUrl;

        uni.setStorageSync("token", authInfo.token);
        uni.setStorageSync("openId", authInfo.openId);
        if (finalNickname) uni.setStorageSync("nickname", finalNickname);
        if (finalAvatar) uni.setStorageSync("avatarUrl", finalAvatar);

        this.userInfo.nickname = finalNickname;
        this.userInfo.avatarUrl = finalAvatar;

        removeQueryParam("code");

        if (authInfo.profileCompleted !== undefined) {
          this.profileCompleted = authInfo.profileCompleted;
          uni.setStorageSync("profileCompleted", authInfo.profileCompleted);
        } else {
          await this.checkProfileStatus();
        }

        return true;
      } catch (err) {
        console.error("登录失败:", err);
        uni.showToast({ title: err?.message || "登录失败", icon: "none" });
        this.loadUserInfoFromStorage();
        return false;
      } finally {
        uni.hideLoading();
      }
    },
    redirectToOAuth() {
      if (typeof window === "undefined") return;
      if (!this.isWeChatBrowser()) {
        uni.showModal({
          title: "提示",
          content: "请在微信内打开以完成登录",
          showCancel: false,
        });
        return;
      }
      const oauthUrl = buildOAuthUrl();
      if (oauthUrl) {
        window.location.replace(oauthUrl);
      }
    },
    isWeChatBrowser() {
      if (typeof window === "undefined" || !window.navigator) return false;
      const ua = window.navigator.userAgent || "";
      return /micromessenger/i.test(ua);
    },
    loadUserInfoFromStorage() {
      const nickname = uni.getStorageSync("nickname");
      const avatarUrl = uni.getStorageSync("avatarUrl");
      const profileCompleted = uni.getStorageSync("profileCompleted");

      if (nickname) this.userInfo.nickname = nickname;
      if (avatarUrl) this.userInfo.avatarUrl = avatarUrl;
      if (profileCompleted !== undefined)
        this.profileCompleted = profileCompleted;
    },
    async checkProfileStatus() {
      const token = uni.getStorageSync("token");
      if (!token) return;
      try {
        const profile = await getProfile();
        // 检查必填字段是否都已填写
        const isCompleted = !!(
          profile.name &&
          profile.idCard &&
          profile.studentNo &&
          profile.gender &&
          profile.department &&
          profile.major &&
          profile.phone
        );
        this.profileCompleted = isCompleted;
        uni.setStorageSync("profileCompleted", isCompleted);
      } catch (err) {
        // 如果获取失败，认为未完成
        this.profileCompleted = false;
        console.error("检查资料状态失败:", err);
      }
    },
    async loadJobTypes() {
      try {
        this.loading = true;
        const data = await getJobTypeList();
        this.jobTypes = data || [];
      } catch (err) {
        const message = err?.message || "加载失败";
        uni.showToast({ title: message, icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    goToProfile() {
      uni.navigateTo({ url: "/pages/profile/profile" });
    },
    async handlePayClick(job) {
      // 再次检查资料是否完成
      if (!this.profileCompleted) {
        uni.showModal({
          title: "提示",
          content: "请先完善个人信息后再进行缴费",
          showCancel: true,
          confirmText: "去完善",
          success: (res) => {
            if (res.confirm) {
              this.goToProfile();
            }
          },
        });
        return;
      }

      // 显示缴费信息弹窗
      this.selectedJob = job;
      this.showOrderModal = true;
    },
    closeOrderModal() {
      this.showOrderModal = false;
      this.orderForm.batchName = "";
      this.orderForm.semester = "";
      this.selectedJob = null;
    },
    async confirmOrder() {
      if (!this.selectedJob || this.paying) return;

      const { batchName, semester } = this.orderForm;
      if (!batchName || !semester) {
        uni.showToast({ title: "请填写完整信息", icon: "none" });
        return;
      }

      try {
        this.paying = true;
        uni.showLoading({ title: "创建订单中..." });

        // 创建订单
        const order = await createOrder({
          jobId: this.selectedJob.id,
          batchName,
          semester,
        });

        this.closeOrderModal();
        uni.showToast({ title: "订单已创建", icon: "success" });

        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/cashier/cashier?orderNo=${order.orderNo}`,
          });
        }, 600);
      } catch (err) {
        const message = err?.message || "操作失败";
        uni.showToast({ title: message, icon: "none" });
      } finally {
        this.paying = false;
        uni.hideLoading();
      }
    },
  },
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7fb;
  padding-bottom: 120rpx;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top-area {
  padding: 40rpx 32rpx 160rpx;
  background: linear-gradient(180deg, #1b57ff 0%, #0f62fe 100%);
  border-bottom-left-radius: 48rpx;
  border-bottom-right-radius: 48rpx;
}

.hero-section {
  padding: 40rpx 36rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #3d7bff, #5aa2ff);
  box-shadow: 0 20rpx 48rpx rgba(10, 70, 255, 0.35);
  border: 2rpx solid rgba(255, 255, 255, 0.25);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  letter-spacing: 4rpx;
  color: #0f62fe;
  background: #ffffff;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.hero-title {
  display: block;
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.hero-subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2rpx;
}

.hero-user {
  margin-top: 36rpx;
  padding-top: 32rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.hero-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
}

.hero-greeting {
  flex: 1;
}

.hero-hello {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 6rpx;
}

.hero-nickname {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
}

.content {
  margin-top: -120rpx;
  padding: 0 32rpx 40rpx;
}

/* 资料提醒 */
.profile-alert {
  margin: 0 0 32rpx;
  background: linear-gradient(135deg, #fff5e6 0%, #fff9f0 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 24rpx rgba(255, 159, 67, 0.15);
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.alert-icon {
  width: 48rpx;
  height: 48rpx;
  background: #ff9f43;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.alert-text {
  flex: 1;
}

.alert-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #d35400;
  margin-bottom: 4rpx;
}

.alert-desc {
  display: block;
  font-size: 24rpx;
  color: #e67e22;
}

.alert-btn {
  padding: 12rpx 32rpx;
  background: #ff9f43;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #fff;
  border: none;
  height: auto;
  line-height: 1.5;
}

/* 工种列表 */
.job-types-section {
  padding: 0;
}

.section-header {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2a44;
  margin-bottom: 8rpx;
}

.section-subtitle {
  display: block;
  font-size: 26rpx;
  color: #ffffff;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: #8a8ea3;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.job-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 98, 254, 0.08);
}

.job-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.job-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2a44;
}

.job-level {
  padding: 8rpx 20rpx;
  background: linear-gradient(135deg, #e3f2ff 0%, #f0f7ff 100%);
  border-radius: 32rpx;
  font-size: 24rpx;
  color: #0f62fe;
}

.job-detail {
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #f0f2f7;
}

.detail-label {
  font-size: 26rpx;
  color: #8a8ea3;
}

.detail-value {
  font-size: 26rpx;
  color: #4f566b;
}

.job-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-section {
  flex: 1;
}

.price-label {
  display: block;
  font-size: 24rpx;
  color: #8a8ea3;
  margin-bottom: 8rpx;
}

.price-wrapper {
  display: flex;
  align-items: flex-end;
}

.price-symbol {
  font-size: 28rpx;
  color: #ff5c5c;
  margin-right: 4rpx;
}

.price-value {
  font-size: 48rpx;
  font-weight: 600;
  color: #ff5c5c;
}

.pay-btn {
  padding: 0 40rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #fff;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(15, 98, 254, 0.25);
}

.pay-btn[disabled] {
  opacity: 0.6;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  padding: 32rpx;
  border-bottom: 2rpx solid #f0f2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2a44;
}

.modal-close {
  font-size: 48rpx;
  color: #8a8ea3;
  line-height: 1;
  padding: 0 8rpx;
}

.modal-body {
  padding: 32rpx;
}

.modal-field {
  margin-bottom: 32rpx;
}

.modal-field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2a44;
  margin-bottom: 16rpx;
}

.field-input {
  width: 100%;
  height: 88rpx;
  background: #f6f8ff;
  border: 2rpx solid #e5e8f0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1f2a44;
  box-sizing: border-box;
}

.input-placeholder {
  color: #a8aec0;
}

.modal-footer {
  display: flex;
  border-top: 2rpx solid #f0f2f7;
}

.modal-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 30rpx;
  border: none;
  border-radius: 0;
}

.cancel-btn {
  background: #f6f8ff;
  color: #8a8ea3;
}

.confirm-btn {
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  color: #fff;
}

.confirm-btn[disabled] {
  opacity: 0.5;
}
</style>
