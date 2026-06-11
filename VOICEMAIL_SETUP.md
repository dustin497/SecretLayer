# Simple Phone Line for Messages & Callbacks

Family Testing Services can use **(205) 579-0707** (or a second number) as a voicemail-only line that takes messages and you return calls during business hours. You do **not** need a fake or confusing auto-attendant — a short greeting plus voicemail is professional and HIPAA-safe.

## Recommended setup (easiest)

### Option A: Google Voice (free)

1. Sign in at [https://voice.google.com](https://voice.google.com)
2. Choose a local **205** number (or port your existing GoDaddy number)
3. Set **Do not disturb** hours if needed; enable **voicemail**
4. Record this greeting:

   > "Thank you for calling Family Testing Services. We cannot discuss test results without written authorization from the donor. To verify a collection record, visit family-testing.com/verify or leave your name, Report ID, and callback number after the tone. We return messages during business hours."

5. Turn on **email transcripts** or check the Google Voice app for new messages
6. Return calls from the same number or your cell (caller ID can show the business line)

**Cost:** Free for US numbers  
**Best for:** Solo operator, low call volume

### Option B: Keep GoDaddy number → forward to Google Voice

If **(205) 579-0707** is on GoDaddy:

1. In GoDaddy phone settings, set **forward all calls** to your Google Voice number
2. Let Google Voice handle voicemail and transcripts
3. You answer callbacks manually when ready

### Option C: OpenPhone / RingCentral (paid, more business-like)

- [OpenPhone](https://www.openphone.com) (~$15/mo) — shared inbox, voicemail, business hours, SMS
- [RingCentral](https://www.ringcentral.com) — full phone system with IVR if you later want "Press 1 appointments, Press 2 verification"

**Best for:** Multiple staff, call logging, professional appearance

## Simple menu (optional, not required)

If you want a basic menu without frustrating callers:

| Key | Action |
|-----|--------|
| 1 | Hours & appointments (voicemail) |
| 2 | Result verification — states HIPAA policy, then voicemail |
| 0 | Operator / callback request |

Every path should end in **voicemail or a real callback** — never hang up or loop endlessly.

## HIPAA phone script (when you return a call)

**No authorization on file:**

> "I can confirm we are a licensed collection site, but I cannot discuss any individual's test information without a signed release from the donor or a court order. The donor may sign our Third-Party Release form at the office."

**Authorization on file (check Verification Log + release form):**

> "I have your Report ID matched. I can confirm collection on [date], test type [type], and result per our records: [negative/pending]."

## Link to your website tools

- Public verify: `https://family-testing.com/verify`
- Staff log: `https://family-testing.com/admin/verification-log.html`
- Release form: Admin → Third-Party Results Release

## Render note (verification data)

The verification log is stored in `data/verification-log.json` on the server. On Render's default disk, data may reset if the service is redeployed from scratch. For production:

1. Add a **Render Persistent Disk** mounted at `/opt/render/project/src/data`, or
2. Export records periodically from the admin log, or
3. Upgrade to a small database later

Register every test in the **Verification Log** before printing so back-checks always match.
