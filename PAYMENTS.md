
# PAYMENTS.md

## Payment Provider
- Tap Payments only

## Supported Methods
- Visa
- Mastercard
- Apple Pay
- Google Pay

## Payment Flow

1. Student books lesson
2. Student pays through Tap Payments
3. Funds move into escrow state
4. Lesson completed
5. Funds released to tutor wallet
6. Tutor requests withdrawal
7. Admin approves withdrawal

## Escrow Rules
- Funds held until lesson completion
- Auto release after 24 hours if no dispute

## Commission Rules
- Single lesson: 15%
- 5 lesson package: 10%
- 10 lesson package: 8%

## Referral Rewards
Tutor referrals:
- 50 QAR activation reward
- 5% lifetime commission

Student referrals:
- Free lesson credit

## Withdrawal Rules
- Minimum withdrawal: 100 QAR
- Manual admin approval required

## Refund Rules
- 24+ hours cancellation: full refund
- 12-24 hours: 50% refund
- Less than 12 hours: no refund

## Security
- Webhook verification mandatory
- Payment audit logs mandatory
- Duplicate transaction prevention
