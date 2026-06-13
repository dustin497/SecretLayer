import { REFERRAL_GOAL, REFERRAL_REWARD_DAYS } from "@secretlayer/shared";
import { getUser, users } from "./store.js";
import { effectivePlan } from "./billing/plan.js";

export function generateReferralCode(userId: string): string {
  return `SL-${userId.slice(0, 8).toUpperCase()}`;
}

export function applyReferralOnSignup(newUserId: string, referralCode?: string): void {
  if (!referralCode) return;
  const referrer = [...users.values()].find((u) => u.referralCode === referralCode.toUpperCase());
  if (!referrer || referrer.id === newUserId) return;

  const newUser = getUser(newUserId);
  if (!newUser) return;
  newUser.referredBy = referrer.id;

  referrer.referralCount += 1;
  if (referrer.referralCount >= REFERRAL_GOAL && !referrer.referralRewardUntil) {
    const until = new Date();
    until.setDate(until.getDate() + REFERRAL_REWARD_DAYS);
    referrer.referralRewardUntil = until.toISOString();
    referrer.plan = "personal";
    referrer.subscriptionStatus = "referral_reward";
  }
}

export function getReferralStats(userId: string) {
  const user = getUser(userId);
  if (!user) return null;
  const remaining = Math.max(0, REFERRAL_GOAL - user.referralCount);
  const webOrigin = process.env.WEB_ORIGIN ?? "https://secretlayer.net";
  return {
    code: user.referralCode,
    count: user.referralCount,
    goal: REFERRAL_GOAL,
    remaining,
    rewardActive:
      Boolean(user.referralRewardUntil) && new Date(user.referralRewardUntil!) > new Date(),
    rewardUntil: user.referralRewardUntil ?? null,
    effectivePlan: effectivePlan(user),
    shareUrl: `${webOrigin}/signup?ref=${user.referralCode}`,
  };
}
