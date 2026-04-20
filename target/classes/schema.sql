CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(32) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL,
    employment_type VARCHAR(32),
    city VARCHAR(80),
    dob DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_applications (
    id BIGSERIAL PRIMARY KEY,
    application_ref VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(40) NOT NULL,
    loan_purpose VARCHAR(80),
    requested_amount NUMERIC(15,2),
    sanctioned_amount NUMERIC(15,2),
    tenure_months INT,
    annual_interest_rate NUMERIC(8,4),
    monthly_income NUMERIC(15,2),
    existing_emi NUMERIC(15,2),
    dti_ratio NUMERIC(8,4),
    stage VARCHAR(30),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_details (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    pan VARCHAR(10),
    aadhaar_token VARCHAR(100),
    pan_verified BOOLEAN DEFAULT FALSE,
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    ckyc_found BOOLEAN DEFAULT FALSE,
    video_kyc_required BOOLEAN DEFAULT FALSE,
    fraud_flag BOOLEAN DEFAULT FALSE,
    aml_flag BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) NOT NULL,
    remarks VARCHAR(400),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_documents (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id),
    document_type VARCHAR(60) NOT NULL,
    storage_url VARCHAR(400) NOT NULL,
    verification_status VARCHAR(30) NOT NULL,
    ocr_payload TEXT,
    quality_score NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_assessments (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    bureau_score INT,
    internal_score INT,
    risk_grade VARCHAR(5),
    policy_passed BOOLEAN,
    stp_eligible BOOLEAN,
    final_decision VARCHAR(30),
    decision_reason VARCHAR(400),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS underwriter_reviews (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id),
    underwriter_id BIGINT REFERENCES users(id),
    action VARCHAR(30) NOT NULL,
    comment_text VARCHAR(500),
    sla_due_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_offers (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    valid_till TIMESTAMP NOT NULL,
    processing_fee NUMERIC(12,2) NOT NULL,
    insurance_premium NUMERIC(12,2) NOT NULL DEFAULT 0,
    apr NUMERIC(8,4) NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_agreements (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    agreement_hash VARCHAR(100) NOT NULL,
    signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMP,
    signed_document_url VARCHAR(400),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disbursements (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    bank_account VARCHAR(30) NOT NULL,
    ifsc VARCHAR(11) NOT NULL,
    status VARCHAR(30) NOT NULL,
    utr VARCHAR(30),
    amount NUMERIC(15,2) NOT NULL,
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emi_schedules (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id),
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    principal_component NUMERIC(15,2) NOT NULL,
    interest_component NUMERIC(15,2) NOT NULL,
    emi_amount NUMERIC(15,2) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP,
    UNIQUE(application_id, installment_no)
);

CREATE TABLE IF NOT EXISTS loan_transactions (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id),
    transaction_type VARCHAR(40) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    gateway_ref VARCHAR(60),
    event_time TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(80),
    http_method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    success BOOLEAN NOT NULL,
    request_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
