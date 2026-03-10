# Portal Credentials Checklist

Source of truth: `backend/prisma/seed.ts`

## Common Login
- Password for all seeded users: `Password123!`
- Frontend URL: `http://localhost:3001`
- Backend API base: `http://localhost:3000/api/v1`
- If testing API login directly, include header: `X-Tenant-ID: demo`

## Platform Portal
- Route: `/dashboard/platform`
- Allowed role: `SUPER_ADMIN`
- Accounts:
- `superadmin@lamaniaga.local` can login
- `ops.lead@lamaniaga.local`   cannot login
- `finance.admin@lamaniaga.local` cannot login
- `security.admin@lamaniaga.local` cannot login
- Checklist:
- [ ] Can login
- [ ] Lands on platform dashboard
- [ ] Can access users/listings/partners pages

## Partner Portal
- Route: `/dashboard/partner`
- Allowed role: `PARTNER_ADMIN` (SUPER_ADMIN can also enter)
- Accounts:
- `admin@lamaniaga.local`
- Checklist:
- [ ] Can login
- [ ] Lands on partner dashboard
- [ ] Partner-scoped data loads

## Vendor Portal
- Route: `/dashboard/vendor`
- Allowed roles: `VENDOR_ADMIN`, `VENDOR_STAFF`
- Vendor admin accounts:
- `admin+sunrise-properties@lamaniaga.local`
- `admin+elite-realty-group@lamaniaga.local`
- `admin+premium-living@lamaniaga.local`
- `admin+budget-homes-pj@lamaniaga.local`
- `admin+urban-nest@lamaniaga.local`
- Vendor staff accounts:
- `siti.pm@lamaniaga.local`
- `ahmad.maint@lamaniaga.local`
- `lisa.leasing@lamaniaga.local`
- Checklist:
- [ ] Can login
- [ ] Lands on vendor dashboard
- [ ] Sees vendor-scoped records only

## Company Portal
- Route: `/dashboard/company`
- Allowed role: `COMPANY_ADMIN`
- Accounts:
- `owner@sunriserealty.local`
- `pic@sunriserealty.local`
- `owner@eliteproperty.local`
- Checklist:
- [ ] Can login
- [ ] Lands on company dashboard
- [ ] Company profile/agents pages load

## Agent Portal
- Route: `/dashboard/agent`
- Allowed role: `AGENT`
- Accounts:
- `solo.agent@lamaniaga.local`
- `alan.agent@sunriserealty.local`
- `bella.agent@sunriserealty.local`
- `charlie.agent@eliteproperty.local`
- `diana.agent@eliteproperty.local`
- Checklist:
- [ ] Can login
- [ ] Lands on agent dashboard
- [ ] Agent profile/referrals pages load

## Tenant Portal
- Route: `/dashboard/tenant`
- Allowed role: `TENANT`
- Accounts:
- `tenant@lamaniaga.local`
- Checklist:
- [ ] Can login
- [ ] Lands on tenant dashboard
- [ ] Bills/tenancy pages load

## Account Portal
- Route: `/dashboard/account`
- Allowed: any authenticated user
- Recommended account:
- `customer@lamaniaga.local`
- Checklist:
- [ ] Can login
- [ ] Lands on account dashboard
- [ ] Profile/settings pages load

## Affiliate Portal
- Route: `/dashboard/affiliate`
- Allowed: any authenticated user
- Example accounts:
- `customer@lamaniaga.local`
- `tenant@lamaniaga.local`
- `solo.agent@lamaniaga.local`
- Checklist:
- [ ] Can login
- [ ] Lands on affiliate dashboard
- [ ] Referrals/payouts pages load

## Quick Smoke Sequence
1. Login with one account per portal.
2. Verify route guard behavior (wrong role should redirect/deny).
3. Verify dashboard, listing page, and one detail page per portal.
4. Logout and switch to next account.
