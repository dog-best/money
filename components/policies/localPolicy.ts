export type LocalPolicy = {
  title: string;
  content: string;
};

export const LOCAL_POLICY: LocalPolicy = {
  title: "VAD Terms of Service & Mining Policy",
  content: `
Last updated: ${new Date().getFullYear()}
Welcome to VAD.

By accessing or using the VAD application, you agree to the following Terms of Service and Mining Policy. If you do not agree, you must decline and stop using the application.

────────────────────────────────────
1. PLATFORM OVERVIEW
────────────────────────────────────

VAD is a digital mining and rewards platform that allows users to participate in virtual mining activities through the application interface. Mining activity is virtual, simulated, and governed entirely by the platform.

No guarantee is made regarding uptime, availability, or future rewards.

────────────────────────────────────
2. MINING DISCLAIMER
────────────────────────────────────

Mining on VAD:
- Is not real-world mining
- Does not guarantee profit
- Does not represent financial advice or income
- Can be modified, paused, limited, or removed at any time

────────────────────────────────────
3. FAIR USE
────────────────────────────────────

You agree not to exploit bugs, automate actions, abuse referrals, or manipulate mining systems. Violations may result in account termination.

────────────────────────────────────
4. DATA & PRIVACY
────────────────────────────────────

VAD collects only data required for functionality, mining activity, and policy acceptance.

────────────────────────────────────
5. ACCEPTANCE
────────────────────────────────────

By tapping “Agree & Continue”, you confirm acceptance of these terms.
`,
};
