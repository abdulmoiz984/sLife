# SLife API Issues — Backend Handoff

Notes from mobile integration testing against:

`https://pro-fixer.demoappprojects.com/slife/api`

Update this file when new mismatches appear. Mobile team will keep Module A+ notes here.

---

## Open issues

### 1. `POST /forgot-password` returns HTTP 500

| Field | Value |
|-------|--------|
| **Endpoint** | `POST /forgot-password` |
| **Auth** | Public |
| **Date seen** | 2026-08-13 |
| **Request body** | `{ "email": "slife.mobile.test+20260813000735@acmecorp.com" }` |
| **Observed** | HTTP `500` Internal Server Error |
| **Expected (doc)** | HTTP `200` with `{ success: true, message: "If an account exists..." }` or `422` if email invalid |
| **Doc reference** | `mobile-api-integration.md` § A5 |
| **Mobile impact** | Forgot-password flow cannot complete; app shows generic 500 toast. Reset screen is still reachable via “Already have a reset token?” |
| **Ask backend** | Confirm mailer/config for reset emails; return doc-shaped `500` body with `message` if send fails, or `200` when email queued |

---

## Verified working (Module A)

| Endpoint | Result |
|----------|--------|
| `POST /register` | `201` — creates user + Sanctum token |
| `POST /login` | `200` — returns `user` + `token` |
| `GET /me` | `200` with Bearer token |
| `POST /logout` | `200` — token revoked (`GET /me` then `401`) |

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

> Prefer rotating this password after shared use. Do not use production member accounts for automated probes.
