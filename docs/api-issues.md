# SLife API Issues — Backend Handoff

Notes from mobile integration testing against:

`https://pro-fixer.demoappprojects.com/slife/api`

Update this file when new mismatches appear. Mobile team will keep Module A+ notes here.

---

## Open issues

### 1. `POST /forgot-password` returned HTTP 500 (legacy token path) — re-test after OTP deploy

| Field | Value |
|-------|--------|
| **Endpoint** | `POST /forgot-password` |
| **Auth** | Public |
| **Date seen** | 2026-08-13 |
| **Observed** | HTTP `500` on demo (old link/token reset path) |
| **Backend note (2026-08-13)** | Password reset is now **6-digit OTP**. Old `token` field removed; use `otp` + new `POST /verify-reset-otp`. Mobile app updated to OTP flow. |
| **Ask backend / mobile** | Re-test forgot → verify-reset-otp → reset-password on demo after deploy. If `500` persists, confirm mailer for OTP emails. |
| **Mobile behavior** | App does **not** navigate to OTP screen on forgot-password failure |

---

### 2. `GET /profile/options` returns empty dropdown lists (blocks onboarding)

| Field | Value |
|-------|--------|
| **Endpoint** | `GET /profile/options` |
| **Auth** | Public |
| **Date seen** | 2026-08-13 |
| **Observed** | HTTP `200`, but these arrays are **empty**: `industries`, `professional_roles`, `organization_sizes`, `interests`, `networking_goals` |
| **Populated** | Only `verification_document_types` has the 4 expected items |
| **Expected (doc)** | Non-empty `{ value, label }` arrays for industries, roles, org sizes, interests, networking goals (§ B1 / §10) |
| **Doc reference** | `mobile-api-integration.md` § B1 — “Always submit the `value` strings… never hardcode dropdown values” |
| **Mobile impact** | **Critical.** Module B steps 2, 5, and 6 cannot be completed in-app (Continue stays disabled / warns). Step 3 org-size chips also empty. Mobile correctly refuses to hardcode option values. |
| **Ask backend** | Seed admin option tables / config so `/profile/options` returns the documented option sets ASAP |

**Sample observed payload (trimmed):**

```json
{
  "success": true,
  "message": "Profile options retrieved.",
  "options": {
    "industries": [],
    "professional_roles": [],
    "organization_sizes": [],
    "interests": [],
    "networking_goals": [],
    "verification_document_types": [
      { "value": "professional_license", "label": "Professional License" },
      { "value": "educational_credential", "label": "Educational Credential" },
      { "value": "government_id", "label": "Government ID" },
      { "value": "employee_reference_letter", "label": "Employee Reference Letter" }
    ]
  }
}
```

---

## Verified working

### Module A — Auth

| Endpoint | Result |
|----------|--------|
| `POST /register` | `201` — creates user + Sanctum token |
| `POST /login` | `200` — returns `user` + `token` |
| `GET /me` | `200` with Bearer token |
| `POST /logout` | `200` — token revoked (`GET /me` then `401`) |

### Module B — Profile (partial)

| Endpoint | Result |
|----------|--------|
| `GET /profile/options` | `200` but **empty** option arrays (see issue #2) |
| `GET /profile` | `200` — profile object + `onboarding_step` |
| `POST /profile/basic-info` | `200` — saves name/phone/location, `onboarding_step: 1` |

Not fully exercised yet (blocked by empty options): professional-info, organization, verification-documents, bio-interests, networking-goals.

### Module C — Educations

| Endpoint | Result |
|----------|--------|
| `GET /profile/educations` | `200` |
| `POST /profile/educations` | `201` — creates education |
| `PUT /profile/educations/{id}` | `200` — updates education |
| `PUT /profile/educations/sync` | `200` — replace-all list |
| `DELETE /profile/educations/{id}` | `200` — removes education |

No Module C blockers found in live probes (2026-08-13).

### Module D — Members

| Endpoint | Result |
|----------|--------|
| `GET /members` | `200` — list + `meta` pagination |
| `GET /members?q=` | `200` — text search works without subscription |
| `GET /members?industry=saas` | `422` — advanced filters require subscription (as documented) |
| `GET /members/{id}` | `200` — detail profile |
| `GET /members/matches` | `200` — empty `matches` for incomplete test user (expected when no role/interests) |

No unexpected Module D blockers. Empty matches for QA account is data/profile completeness, not an API defect.

### Module E — Connections

| Endpoint | Result |
|----------|--------|
| `GET /connections?filter=accepted` | `200` |
| `POST /connections` | `201` — request created (`pending` / `outgoing`) |
| `POST /connections/{id}/cancel` | `200` — cancelled |

Accept / decline not exercised end-to-end (needs a second account as recipient). No unexpected blockers in create/list/cancel probes.

### Module F — Reports

| Endpoint | Result |
|----------|--------|
| `GET /reports/reasons` | `200` — full reason list matches doc |
| `POST /reports` | `201` — report created |

No Module F blockers found in live probes. Duplicate-report `422` behaves per doc when re-reporting the same member.

---

## Test account (mobile QA)

Created via `POST /register` for app testing:

| Field | Value |
|-------|--------|
| Email | `slife.mobile.test+20260813000735@acmecorp.com` |
| Password | `SecurePass1!` |
| User id | `28` |
| Status | `pending` |
| `profile_completed` | `false` |
| Notes | Basic info step already saved during API probe (`onboarding_step` ≥ 1) |

> Prefer rotating this password after shared use. Do not use production member accounts for automated probes.
