# Personal Loan LOS (Enterprise Starter)

Production-oriented backend foundation for the Personal Loan workflow from registration to repayment.

## Stack
- Java 17, Spring Boot 3
- PostgreSQL, Redis, Kafka
- Spring Security + JWT (RS256)
- Spring Data JPA + Validation + Actuator
- Docker Compose

## Implemented workflow modules
1. Auth (register, OTP verify, login, refresh token)
2. Loan Application draft + DTI/EMI feasibility
3. KYC mock orchestration (PAN/Aadhaar/CKYC flags)
4. Document entity/repository and schema ready
5. Credit engine (policy, risk grade, STP eligibility)
6. Underwriter review persistence model
7. Loan offer generation + acceptance
8. Agreement execution simulation
9. Disbursement simulation + UTR
10. LMS schedule generation + EMI payment tracking

## Enterprise hardening implemented
- JWT bearer authentication filter with role-based authorization
- Redis-based OTP send throttling and verify lockout
- Refresh token rotation with revocation and expiry checks
- Kafka workflow event publisher + consumer with retry and DLQ fallback
- Persistent audit logs for mutating APIs (`audit_logs` table)
- Admin/underwriter paginated endpoints

## Run
1. `docker compose up -d`
2. `mvn spring-boot:run`

## Sample API flow
1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/verify-otp`
3. `POST /api/v1/workflow/applications?userId=3`
4. `POST /api/v1/workflow/applications/{id}/kyc`
5. `POST /api/v1/workflow/applications/{id}/credit`
6. `POST /api/v1/workflow/applications/{id}/offer`
7. `POST /api/v1/workflow/applications/{id}/offer/accept`
8. `POST /api/v1/workflow/applications/{id}/agreement`
9. `POST /api/v1/workflow/applications/{id}/disbursement`
10. `POST /api/v1/workflow/applications/{id}/emi/pay`
