# Personal Loan LOS Architecture

## Clean Architecture Layers
- `controller`: REST endpoints for auth and loan workflow stages.
- `service`: business orchestration per stage (Auth, KYC, Credit, Offer, Agreement, Disbursement, LMS).
- `domain/*`: entity models and repository interfaces.
- `common/dto`: input/output DTOs.
- `common/exception`: global error handling.
- `security`: JWT + Spring Security configuration.

## Logical Components
- Auth Service
- Loan Origination Service
- KYC Service (mock API integrations)
- Document Service (schema + repository ready)
- Credit Engine
- Underwriter Queue
- Offer & Pricing Engine
- Agreement Service
- Disbursement Service
- LMS Service

## Async and Integration Readiness
- Kafka dependency added for async events (`KYC_COMPLETED`, `DISBURSEMENT_SUCCESS`, `EMI_PAID`).
- Redis integrated for OTP/session/rate-limit counters.
- PostgreSQL as system-of-record.

## Security Baseline
- JWT RS256 token issuance.
- Refresh token persistence with SHA-256 hash.
- Password hashing via BCrypt.
- Validation + centralized exception responses.
