# SLife Mobile API — Integration Guide

Module-wise reference for the mobile app team.  
**Out of scope for this document:** Stripe, packages, and subscriptions (document later).

---

## Table of contents

1. [Base conventions](#1-base-conventions)
2. [Status codes & error shapes](#2-status-codes--error-shapes)
3. [Module A — Auth](#3-module-a--auth)
4. [Module B — Profile & onboarding](#4-module-b--profile--onboarding)
5. [Module C — Educations](#5-module-c--educations)
6. [Module D — Members (discovery & matches)](#6-module-d--members-discovery--matches)
7. [Module E — Connections](#7-module-e--connections)
8. [Module F — Reports](#8-module-f--reports)
9. [Suggested app flow](#9-suggested-app-flow)
10. [Enums & option values](#10-enums--option-values)

---

## 1. Base conventions

### Base URL

| Environment | URL |
|-------------|-----|
| Production (app / admin) | [`https://pro-fixer.demoappprojects.com/slife`](https://pro-fixer.demoappprojects.com/slife) |
| Production **API** | `https://pro-fixer.demoappprojects.com/slife/api` |
| Local | `http://localhost:8000/api` |

Mobile clients should use the **Production API** base:

```text
https://pro-fixer.demoappprojects.com/slife/api
```

All paths below are relative to that API base (e.g. `POST /login` → `https://pro-fixer.demoappprojects.com/slife/api/login`).

### Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}
```

- `Authorization` is required on all **protected** endpoints.
- For file uploads use `multipart/form-data` (do **not** set `Content-Type` manually; the client sets the boundary).

### Auth

- Token type: **Laravel Sanctum** personal access token.
- After login/register, store `token` and send as `Bearer {token}`.
- On logout, the current token is revoked.
- `401` → clear token and send user to login.

### Success envelope

Every success response looks like:

```json
{
  "success": true,
  "message": "Human readable message.",
  "...": "endpoint-specific payload fields"
}
```

### Error envelope

```json
{
  "success": false,
  "message": "Human readable message.",
  "errors": {}
}
```

`errors` is optional. For validation it is typically:

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field confirmation does not match."]
  }
}
```

### Rate limits

| Group | Limit | Applies to |
|-------|-------|------------|
| `api-auth` | 10 requests / 15 minutes / IP | register, login, forgot-password, reset-password |
| `api` | 60 requests / minute | everything else |
| Login lockout | Configurable (default **5** failed attempts → lock **15 minutes**) | login only |

---

## 2. Status codes & error shapes

| Code | When |
|------|------|
| `200` | Success |
| `201` | Created (register, connection request, education create, report create) |
| `401` | Missing / invalid / expired Sanctum token |
| `404` | Resource not found (member, connection, education, etc.) |
| `422` | Validation failed **or** business rule failure (duplicate report, already connected, etc.) |
| `429` | Rate limited / login lockout |
| `500` | Unexpected server error (e.g. password reset mail failure) |

### Common `401`

```json
{
  "message": "Unauthenticated."
}
```

### Common `422` (validation)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Error text."]
  }
}
```

> Note: Laravel’s default validation response may omit `success: false`. Always treat non-2xx as failure and prefer reading `errors` + `message`.

### Common `429` (throttle)

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "errors": {
    "retry_after": 42
  }
}
```

### Login lockout `429`

```json
{
  "success": false,
  "message": "Suspicious activity detected. Too many login attempts. Try again in 900 seconds.",
  "errors": {
    "retry_after": 900
  }
}
```

---

## 3. Module A — Auth

### Shared user object (`user`)

Returned by register, login, and `GET /me`:

```json
{
  "id": 1,
  "full_name": "Jane Founder",
  "email": "jane@acmecorp.com",
  "status": "pending",
  "is_subscribed": false,
  "is_profile_locked": true,
  "profile_completed": false,
  "email_verified_at": null,
  "created_at": "2026-08-06T10:00:00+00:00"
}
```

| Field | Values / notes |
|-------|----------------|
| `status` | `pending` \| `active` \| `rejected` |
| `is_subscribed` / `is_profile_locked` | Present on user object; **billing APIs are out of scope** for this doc — do not build checkout from this guide |
| `profile_completed` | `true` after onboarding is finished / submitted |

---

### A1. Register

`POST /register` — **Public**

**Body**

```json
{
  "full_name": "Jane Founder",
  "email": "jane@acmecorp.com",
  "password": "SecurePass1!",
  "password_confirmation": "SecurePass1!",
  "terms_accepted": true
}
```

| Field | Rules |
|-------|-------|
| `full_name` | required, string, max 255 |
| `email` | required, email, unique, **business email only** (gmail/yahoo/hotmail/etc. rejected) |
| `password` | required, min 10, confirmed |
| `password_confirmation` | must match `password` |
| `terms_accepted` | required, must be accepted (`true` / `1`) |

**Success `201`**

```json
{
  "success": true,
  "message": "Registration successful. Your application is under review.",
  "user": { "...": "see user object" },
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "token_type": "Bearer"
}
```

**Errors**

| Code | Case |
|------|------|
| `422` | Validation (weak password, personal email, duplicate email, terms not accepted) |
| `429` | Auth throttle |

Personal email example error:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["Please use your business email address."]
  }
}
```

---

### A2. Login

`POST /login` — **Public**

**Body**

```json
{
  "email": "jane@acmecorp.com",
  "password": "SecurePass1!"
}
```

**Success `200`**

```json
{
  "success": true,
  "message": "Login successful.",
  "user": { "...": "see user object" },
  "token": "2|yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "token_type": "Bearer"
}
```

**Errors**

| Code | Case | Message hint |
|------|------|--------------|
| `422` | Wrong credentials | `The provided credentials are incorrect.` |
| `422` | Rejected member | `Your membership application was not approved.` |
| `429` | Too many failed logins | lockout + `retry_after` |
| `429` | Auth IP throttle | too many auth requests |

> Previous tokens for that user are revoked on successful login (single active session model).

---

### A3. Me (current user)

`GET /me` — **Protected**

**Success `200`**

```json
{
  "success": true,
  "message": "Authenticated user retrieved.",
  "user": { "...": "see user object" }
}
```

**Errors:** `401`

---

### A4. Logout

`POST /logout` — **Protected**

**Success `200`**

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

**Errors:** `401`

---

### A5. Forgot password

`POST /forgot-password` — **Public**

**Body**

```json
{
  "email": "jane@acmecorp.com"
}
```

**Success `200`**

```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**Errors**

| Code | Case |
|------|------|
| `422` | Email missing / invalid / not found |
| `500` | Unable to send reset link |
| `429` | Auth throttle |

---

### A6. Reset password

`POST /reset-password` — **Public**

**Body**

```json
{
  "email": "jane@acmecorp.com",
  "token": "token-from-email-link",
  "password": "NewSecurePass1!",
  "password_confirmation": "NewSecurePass1!"
}
```

**Success `200`**

```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

**Errors**

| Code | Case |
|------|------|
| `422` | Validation **or** invalid/expired token (`Invalid or expired reset token.`) |
| `429` | Auth throttle |

---

## 4. Module B — Profile & onboarding

Onboarding is **6 steps**. Call options first; never hardcode dropdown values.

| Step | Endpoint | Method | Content-Type |
|------|----------|--------|--------------|
| Options | `/profile/options` | GET | — |
| Get profile | `/profile` | GET | — |
| 1 Basic info | `/profile/basic-info` | POST | `multipart/form-data` |
| 2 Professional | `/profile/professional-info` | PUT | JSON |
| 3 Organization | `/profile/organization` | PUT | JSON |
| 4 Verification docs | `/profile/verification-documents` | POST | `multipart/form-data` |
| 5 Bio & interests | `/profile/bio-interests` | PUT | JSON |
| 6 Networking goals | `/profile/networking-goals` | PUT | JSON |

All profile update endpoints (except options) are **Protected**.

---

### B1. Profile options (dropdowns)

`GET /profile/options` — **Public**

**Success `200`**

```json
{
  "success": true,
  "message": "Profile options retrieved.",
  "options": {
    "industries": [
      { "value": "saas", "label": "SaaS" }
    ],
    "professional_roles": [
      { "value": "founder", "label": "Founder" }
    ],
    "organization_sizes": [
      { "value": "11_50", "label": "11–50" }
    ],
    "interests": [
      { "value": "fundraising", "label": "Fundraising" }
    ],
    "networking_goals": [
      { "value": "find_investors", "label": "Find Investors" }
    ],
    "verification_document_types": [
      { "value": "professional_license", "label": "Professional License" },
      { "value": "educational_credential", "label": "Educational Credential" },
      { "value": "government_id", "label": "Government ID" },
      { "value": "employee_reference_letter", "label": "Employee Reference Letter" }
    ]
  }
}
```

> Always submit the `value` strings to write APIs. Show `label` in the UI.

---

### B2. Get own profile

`GET /profile` — **Protected**

**Success `200`**

```json
{
  "success": true,
  "message": "Profile retrieved.",
  "profile": {
    "basic_info": {
      "full_name": "Jane Founder",
      "phone_number": "+1 555 0100",
      "location": "New York, NY",
      "profile_photo_url": "https://.../profile-photos/1/photo.jpg"
    },
    "professional_info": {
      "professional_title": "CEO",
      "industry": "saas",
      "industry_label": "SaaS",
      "years_of_experience": 12,
      "professional_role": "founder",
      "professional_role_label": "Founder"
    },
    "organization": {
      "company_name": "Acme Corp",
      "organization_size": "11_50",
      "organization_size_label": "11–50",
      "website": "https://acme.example"
    },
    "verification": {
      "linkedin_or_portfolio_url": "https://linkedin.com/in/jane",
      "documents": [
        {
          "id": 1,
          "type": "government_id",
          "type_label": "Government ID",
          "file_url": "https://.../docs/id.pdf",
          "original_filename": "passport.pdf",
          "uploaded_at": "2026-08-06T10:00:00+00:00"
        }
      ]
    },
    "bio_interests": {
      "bio": "Building B2B tools for operators.",
      "interests": [
        { "value": "fundraising", "label": "Fundraising" }
      ]
    },
    "networking_goals": [
      { "value": "find_investors", "label": "Find Investors" }
    ],
    "educations": [],
    "onboarding_step": 6,
    "verification_submitted_at": "2026-08-06T12:00:00+00:00",
    "verification_badge": null,
    "verification_badge_label": null,
    "verification_reviewed_at": null,
    "profile_completed": true
  }
}
```

**Errors:** `401`

---

### B3. Step 1 — Basic info

`POST /profile/basic-info` — **Protected** — `multipart/form-data`

| Field | Rules |
|-------|-------|
| `full_name` | required, string, max 255 |
| `phone_number` | required, string, max 30 |
| `location` | required, string, max 255 |
| `profile_photo` | optional, image, max **5120 KB** (5 MB) |

**Success `200`**

```json
{
  "success": true,
  "message": "Basic information saved.",
  "profile": { "...": "full profile object" },
  "onboarding_step": 1
}
```

**Errors:** `401`, `422`

---

### B4. Step 2 — Professional info

`PUT /profile/professional-info` — **Protected**

```json
{
  "professional_title": "CEO",
  "industry": "saas",
  "years_of_experience": 12,
  "professional_role": "founder"
}
```

| Field | Rules |
|-------|-------|
| `professional_title` | required |
| `industry` | required, must be a value from options |
| `years_of_experience` | required, integer 0–80 |
| `professional_role` | required, must be a value from options |

**Success `200`** → `onboarding_step: 2`

---

### B5. Step 3 — Organization

`PUT /profile/organization` — **Protected**

```json
{
  "company_name": "Acme Corp",
  "organization_size": "11_50",
  "website": "https://acme.example"
}
```

All fields optional, but if sent must be valid (`organization_size` from options, `website` URL).

**Success `200`** → `onboarding_step: 3`

---

### B6. Step 4 — Verification documents

`POST /profile/verification-documents` — **Protected** — `multipart/form-data`

| Field | Rules |
|-------|-------|
| `linkedin_or_portfolio_url` | required, URL, max 255 |
| `professional_license` | optional file pdf/jpg/jpeg/png, max **10240 KB** |
| `educational_credential` | optional file, same rules |
| `government_id` | optional file, same rules |
| `employee_reference_letter` | optional file, same rules |

**Success `200`** → `onboarding_step: 4`

---

### B7. Step 5 — Bio & interests

`PUT /profile/bio-interests` — **Protected**

```json
{
  "bio": "Building B2B tools for operators.",
  "interests": ["fundraising", "partnerships"]
}
```

| Field | Rules |
|-------|-------|
| `bio` | optional, max 500 |
| `interests` | required array, **min 2**, each value from options |

**Success `200`** → `onboarding_step: 5`

---

### B8. Step 6 — Networking goals (+ optional submit)

`PUT /profile/networking-goals` — **Protected**

```json
{
  "networking_goals": ["find_investors", "mentorship"],
  "submit_for_verification": true
}
```

| Field | Rules |
|-------|-------|
| `networking_goals` | required array, min 1, values from options |
| `submit_for_verification` | optional boolean — when `true`, profile is submitted for admin verification |

**Success `200`**

- Without submit: `"Networking goals saved."`
- With submit: `"Profile submitted for verification."`
- Always returns `onboarding_step: 6` + full `profile`

---

## 5. Module C — Educations

All **Protected**. Education can be managed during/after onboarding.

### Shared education object

```json
{
  "id": 3,
  "institution": "MIT",
  "degree": "MBA",
  "field_of_study": "Entrepreneurship",
  "start_date": "2015-09-01",
  "end_date": "2017-06-01",
  "is_current": false,
  "description": null,
  "created_at": "2026-08-06T10:00:00+00:00",
  "updated_at": "2026-08-06T10:00:00+00:00"
}
```

---

### C1. List educations

`GET /profile/educations`

```json
{
  "success": true,
  "message": "Educations retrieved.",
  "educations": [ { "...": "education object" } ]
}
```

---

### C2. Add education

`POST /profile/educations` → **`201`**

```json
{
  "institution": "MIT",
  "degree": "MBA",
  "field_of_study": "Entrepreneurship",
  "start_date": "2015-09-01",
  "end_date": "2017-06-01",
  "is_current": false,
  "description": "Optional notes"
}
```

| Field | Rules |
|-------|-------|
| `institution` | required |
| `degree`, `field_of_study`, `description` | optional |
| `start_date`, `end_date` | optional dates; `end_date` ≥ `start_date` |
| `is_current` | optional boolean |

```json
{
  "success": true,
  "message": "Education added.",
  "education": { "...": "education object" }
}
```

---

### C3. Update education

`PUT /profile/educations/{education_id}`

Same fields as create (partial allowed via `sometimes`).

```json
{
  "success": true,
  "message": "Education updated.",
  "education": { "...": "education object" }
}
```

**Errors:** `401`, `404`, `422`

---

### C4. Delete education

`DELETE /profile/educations/{education_id}`

```json
{
  "success": true,
  "message": "Education removed."
}
```

---

### C5. Sync educations (replace all)

`PUT /profile/educations/sync`

Replaces the member’s full education list with the payload.

```json
{
  "educations": [
    {
      "institution": "MIT",
      "degree": "MBA",
      "field_of_study": "Entrepreneurship",
      "start_date": "2015-09-01",
      "end_date": "2017-06-01",
      "is_current": false
    }
  ]
}
```

```json
{
  "success": true,
  "message": "Educations synced.",
  "educations": [ { "...": "education object" } ]
}
```

---

## 6. Module D — Members (discovery & matches)

All **Protected**. Use this for browse / search / recommended matches / viewing another member.

### Shared member card

```json
{
  "id": 4,
  "full_name": "Alex Partner",
  "status": "active",
  "professional_title": "Partner",
  "company_name": "North Ventures",
  "location": "San Francisco, CA",
  "industry": "venture_capital",
  "industry_label": "Venture Capital",
  "professional_role": "investor",
  "professional_role_label": "Investor",
  "years_of_experience": 15,
  "organization_size": "11_50",
  "organization_size_label": "11–50",
  "profile_photo_url": "https://...",
  "verification_badge": "verified_professional",
  "verification_badge_label": "Verified Professional",
  "interests": [
    { "value": "fundraising", "label": "Fundraising" }
  ],
  "networking_goals": [
    { "value": "deal_flow", "label": "Deal Flow" }
  ],
  "connection": null
}
```

`connection` when a relationship exists:

```json
{
  "id": 12,
  "status": "pending",
  "direction": "outgoing"
}
```

| `status` | Meaning |
|----------|---------|
| `pending` | Request open |
| `accepted` | Connected |
| `declined` | Declined |
| `cancelled` | Cancelled / disconnected |

`direction`: `outgoing` (you sent) \| `incoming` (they sent).

---

### D1. Discover / search members

`GET /members` — **Protected**

**Query params**

| Param | Type | Notes |
|-------|------|-------|
| `q` | string | Name, title, company, location, bio |
| `industry` | string | From options |
| `professional_role` | string | From options |
| `organization_size` | string | From options |
| `location` | string | Partial match |
| `verification_badge` | string | See enums |
| `min_years` / `max_years` | int 0–80 | Experience range |
| `interests` | array or comma string | Must all match |
| `networking_goals` | array or comma string | Must all match |
| `exclude_connected` | bool | Hide accepted connections |
| `per_page` | int 1–50 | Default 20 |
| `page` | int | |

**Access rule**

- Text search (`q`) is always allowed for authenticated users.
- Using any **advanced filter** (`industry`, `professional_role`, `organization_size`, `location`, `verification_badge`, years, interests, goals) requires subscription access **or** business setting `trial.allow_advanced_search`.
- Otherwise → `422` with `filters: ["Advanced search filters require an active subscription."]`.

**Success `200`**

```json
{
  "success": true,
  "message": "Members retrieved.",
  "members": [ { "...": "member card" } ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 20,
    "total": 42
  }
}
```

**Errors:** `401`, `422`, `429`

---

### D2. Recommended matches

`GET /members/matches?limit=8` — **Protected**

Same scoring as Admin → User → **Matches** tab:

- Same `professional_role` → **+3**
- Each shared interest → **+2**

`limit`: 1–50 (default 8).

**Success `200`**

```json
{
  "success": true,
  "message": "Recommended matches retrieved.",
  "matches": [
    {
      "score": 7,
      "same_role": true,
      "shared_interests": ["fundraising", "partnerships"],
      "shared_interest_labels": ["Fundraising", "Partnerships"],
      "member": { "...": "member card" }
    }
  ]
}
```

Empty when the current user has no role/interests set, or no candidates:

```json
{
  "success": true,
  "message": "Recommended matches retrieved.",
  "matches": []
}
```

---

### D3. Public member profile

`GET /members/{user_id}` — **Protected**

Cannot request your own id (use `GET /profile`).

**Privacy**

- `email` and `phone_number` are **only** returned when `connection.status === "accepted"`.
- Otherwise those fields are `null`.

**Success `200`**

```json
{
  "success": true,
  "message": "Member profile retrieved.",
  "member": {
    "id": 4,
    "full_name": "Alex Partner",
    "email": null,
    "status": "active",
    "profile_completed": true,
    "basic_info": {
      "location": "San Francisco, CA",
      "profile_photo_url": "https://...",
      "phone_number": null
    },
    "professional_info": {
      "professional_title": "Partner",
      "industry": "venture_capital",
      "industry_label": "Venture Capital",
      "years_of_experience": 15,
      "professional_role": "investor",
      "professional_role_label": "Investor"
    },
    "organization": {
      "company_name": "North Ventures",
      "organization_size": "11_50",
      "organization_size_label": "11–50",
      "website": "https://north.example"
    },
    "verification": {
      "linkedin_or_portfolio_url": "https://linkedin.com/in/alex",
      "verification_badge": "verified_professional",
      "verification_badge_label": "Verified Professional"
    },
    "bio_interests": {
      "bio": "Early-stage B2B investor.",
      "interests": [
        { "value": "fundraising", "label": "Fundraising" }
      ]
    },
    "networking_goals": [
      { "value": "deal_flow", "label": "Deal Flow" }
    ],
    "educations": [],
    "connection": null
  }
}
```

**Errors**

| Code | Case |
|------|------|
| `401` | Unauthenticated |
| `404` | Member not found / rejected |
| `422` | Requested own profile (`Use the profile endpoint to view your own profile.`) |

---

## 7. Module E — Connections

All **Protected**.

### Shared connection object

```json
{
  "id": 12,
  "status": "pending",
  "status_label": "Pending",
  "message": "Would love to connect about fundraising.",
  "direction": "outgoing",
  "is_requester": true,
  "requester": { "...": "connection user" },
  "recipient": { "...": "connection user" },
  "other_user": { "...": "connection user (the other party)" },
  "responded_at": null,
  "created_at": "2026-08-06T10:00:00+00:00",
  "updated_at": "2026-08-06T10:00:00+00:00"
}
```

### Connection user (compact)

```json
{
  "id": 4,
  "full_name": "Alex Partner",
  "email": "alex@north.example",
  "status": "active",
  "professional_title": "Partner",
  "company_name": "North Ventures",
  "industry": "venture_capital",
  "industry_label": "Venture Capital",
  "profile_photo_url": "https://...",
  "verification_badge": "verified_professional",
  "verification_badge_label": "Verified Professional"
}
```

---

### E1. List connections

`GET /connections?filter=accepted` — **Protected**

| `filter` | Meaning |
|----------|---------|
| `accepted` | Default — your network |
| `pending_incoming` | Requests you received |
| `pending_outgoing` | Requests you sent |
| `declined` | Declined |
| `all` | Everything |

**Success `200`**

```json
{
  "success": true,
  "message": "Connections retrieved.",
  "connections": [ { "...": "connection object" } ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 3,
    "filter": "accepted"
  }
}
```

---

### E2. Send connection request

`POST /connections` → **`201`**

```json
{
  "user_id": 4,
  "message": "Would love to connect about fundraising."
}
```

| Field | Rules |
|-------|-------|
| `user_id` | required, exists in users |
| `message` | optional, max 500 |

**Success `201`**

```json
{
  "success": true,
  "message": "Connection request sent.",
  "connection": { "...": "connection object" }
}
```

**Business `422` examples**

| Message |
|---------|
| You cannot connect with yourself. |
| This member is not available for connections. |
| You are already connected with this member. |
| A connection request already exists between you and this member. |

> After decline/cancel, sending again is allowed (row is reused / direction flipped).

---

### E3. Accept

`POST /connections/{connection_id}/accept`

Only the **recipient** of a **pending** request.

```json
{
  "success": true,
  "message": "Connection request accepted.",
  "connection": { "...": "status accepted" }
}
```

---

### E4. Decline

`POST /connections/{connection_id}/decline`

Only the **recipient** of a **pending** request.

```json
{
  "success": true,
  "message": "Connection request declined.",
  "connection": { "...": "status declined" }
}
```

---

### E5. Cancel (outgoing pending)

`POST /connections/{connection_id}/cancel`

Only the **requester**, while **pending**.

```json
{
  "success": true,
  "message": "Connection request cancelled.",
  "connection": { "...": "status cancelled" }
}
```

---

### E6. Disconnect (remove accepted)

`DELETE /connections/{connection_id}`

Either party; only if status is **accepted**. Sets status to `cancelled`.

```json
{
  "success": true,
  "message": "Connection removed.",
  "connection": { "...": "status cancelled" }
}
```

**Errors for E3–E6:** `401`, `404`, `422` (wrong party / wrong status)

---

## 8. Module F — Reports

All **Protected**.

---

### F1. List report reasons

`GET /reports/reasons`

```json
{
  "success": true,
  "message": "Report reasons retrieved.",
  "reasons": [
    { "value": "harassment", "label": "Harassment" },
    { "value": "spam", "label": "Spam / Solicitation" },
    { "value": "fake_profile", "label": "Fake Profile" },
    { "value": "inappropriate_content", "label": "Inappropriate Content" },
    { "value": "misrepresentation", "label": "Misrepresentation" },
    { "value": "fraud", "label": "Fraud / Scam" },
    { "value": "impersonation", "label": "Impersonation" },
    { "value": "unsolicited_messages", "label": "Unsolicited Messages" },
    { "value": "policy_violation", "label": "Policy Violation" },
    { "value": "intellectual_property", "label": "Intellectual Property" },
    { "value": "other", "label": "Other" }
  ]
}
```

---

### F2. Submit report

`POST /reports` → **`201`**

```json
{
  "user_id": 4,
  "reason": "harassment",
  "details": "Repeated inappropriate messages after connecting."
}
```

| Field | Rules |
|-------|-------|
| `user_id` | required, exists |
| `reason` | required, one of reason values above |
| `details` | optional, max 2000 |

**Success `201`**

```json
{
  "success": true,
  "message": "Report submitted.",
  "report": {
    "id": 1,
    "reason": "harassment",
    "reason_label": "Harassment",
    "details": "Repeated inappropriate messages after connecting.",
    "created_at": "2026-08-06T10:00:00+00:00",
    "reporter": { "...": "connection user" },
    "reported_user": { "...": "connection user" }
  }
}
```

**Business `422` examples**

| Message |
|---------|
| You cannot report yourself. |
| This member is not available to report. |
| You have already reported this member. |

---

## 9. Suggested app flow

Use this order for the mobile AI / feature build:

```
1. Auth
   Register → store token
   Login → store token
   Me → bootstrap session
   Forgot / Reset password
   Logout

2. Profile options
   GET /profile/options → cache for dropdowns

3. Onboarding (gated by profile_completed / onboarding_step)
   Steps 1 → 6
   Educations anytime (add/sync)

4. Home / Discovery
   GET /members/matches        → “Recommended for you”
   GET /members?q=...          → search / browse
   GET /members/{id}           → profile detail

5. Connections
   POST /connections           → connect from profile
   GET /connections?filter=... → inbox / network
   accept / decline / cancel / disconnect

6. Safety
   GET /reports/reasons
   POST /reports
```

**Do not implement in this pass:** packages list, Stripe checkout, cancel/resume/portal, subscription status screens.

---

## 10. Enums & option values

### User status

| Value | Label |
|-------|-------|
| `pending` | Pending |
| `active` | Active |
| `rejected` | Rejected (cannot login) |

### Connection status

| Value | Label |
|-------|-------|
| `pending` | Pending |
| `accepted` | Accepted |
| `declined` | Declined |
| `cancelled` | Cancelled |

### Verification badges

| Value | Label |
|-------|-------|
| `verified_professional` | Verified Professional |
| `executive_member` | Executive Member |
| `elite_verified` | Elite Verified |
| `industry_leader` | Industry Leader |

### Verification document types

| Value | Label |
|-------|-------|
| `professional_license` | Professional License |
| `educational_credential` | Educational Credential |
| `government_id` | Government ID |
| `employee_reference_letter` | Employee Reference Letter |

### Dynamic options (from API)

`industries`, `professional_roles`, `organization_sizes`, `interests`, `networking_goals`  
→ always load from `GET /profile/options` (admin-managed; values change).

---

## Quick endpoint index (this doc)

| Module | Method | Path | Auth |
|--------|--------|------|------|
| Auth | POST | `/register` | No |
| Auth | POST | `/login` | No |
| Auth | POST | `/forgot-password` | No |
| Auth | POST | `/reset-password` | No |
| Auth | GET | `/me` | Yes |
| Auth | POST | `/logout` | Yes |
| Profile | GET | `/profile/options` | No |
| Profile | GET | `/profile` | Yes |
| Profile | POST | `/profile/basic-info` | Yes |
| Profile | PUT | `/profile/professional-info` | Yes |
| Profile | PUT | `/profile/organization` | Yes |
| Profile | POST | `/profile/verification-documents` | Yes |
| Profile | PUT | `/profile/bio-interests` | Yes |
| Profile | PUT | `/profile/networking-goals` | Yes |
| Educations | GET | `/profile/educations` | Yes |
| Educations | POST | `/profile/educations` | Yes |
| Educations | PUT | `/profile/educations/sync` | Yes |
| Educations | PUT | `/profile/educations/{id}` | Yes |
| Educations | DELETE | `/profile/educations/{id}` | Yes |
| Members | GET | `/members` | Yes |
| Members | GET | `/members/matches` | Yes |
| Members | GET | `/members/{id}` | Yes |
| Connections | GET | `/connections` | Yes |
| Connections | POST | `/connections` | Yes |
| Connections | POST | `/connections/{id}/accept` | Yes |
| Connections | POST | `/connections/{id}/decline` | Yes |
| Connections | POST | `/connections/{id}/cancel` | Yes |
| Connections | DELETE | `/connections/{id}` | Yes |
| Reports | GET | `/reports/reasons` | Yes |
| Reports | POST | `/reports` | Yes |

---

*Generated for SLife mobile integration. Billing / Stripe modules intentionally omitted.*
