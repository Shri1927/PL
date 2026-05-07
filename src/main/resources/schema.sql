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
    approval_limit NUMERIC(15,2),
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
    allowed_stage INT DEFAULT 1,
    father_name VARCHAR(120),
    mother_name VARCHAR(120),
    gender VARCHAR(20),
    marital_status VARCHAR(30),
    dependents INT,
    current_address VARCHAR(255),
    permanent_address VARCHAR(255),
    residential_stability VARCHAR(50),
    company_name VARCHAR(150),
    employee_id VARCHAR(50),
    designation VARCHAR(100),
    current_experience_months INT,
    total_experience_months INT,
    office_address VARCHAR(255),
    official_email VARCHAR(120),
    gross_monthly_income NUMERIC(15,2),
    net_take_home_salary NUMERIC(15,2),
    other_income NUMERIC(15,2),
    existing_loans_count INT,
    credit_card_outstanding NUMERIC(15,2),
    bank_name VARCHAR(120),
    bank_account_number VARCHAR(50),
    bank_account_type VARCHAR(30),
    bank_ifsc VARCHAR(20),
    mandate_status VARCHAR(30),
    outstanding_principal NUMERIC(15,2),
    next_emi_due_date DATE,
    submitted_at TIMESTAMP,
    tier VARCHAR(20),
    created_by BIGINT,
    current_assigned_to BIGINT,
    sla_deadline TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure allowed_stage exists in case table was already created
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS allowed_stage INT DEFAULT 1;
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS mandate_status VARCHAR(30);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS outstanding_principal NUMERIC(15,2);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS next_emi_due_date DATE;

-- Fix for enum constraint issues when new statuses are added (e.g., MAKER_CHECKED)
ALTER TABLE loan_applications DROP CONSTRAINT IF EXISTS loan_applications_status_check;
ALTER TABLE IF EXISTS loan_audit_logs DROP CONSTRAINT IF EXISTS loan_audit_logs_new_status_check;
ALTER TABLE IF EXISTS loan_audit_logs DROP CONSTRAINT IF EXISTS loan_audit_logs_previous_status_check;

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
CREATE TABLE IF NOT EXISTS tier_configs (
    id BIGSERIAL PRIMARY KEY,
    tier VARCHAR(20) UNIQUE NOT NULL,
    min_amount NUMERIC(15,2),
    max_amount NUMERIC(15,2),
    required_checker_role VARCHAR(32),
    dual_checker_required BOOLEAN DEFAULT FALSE,
    sla_working_days INT,
    auto_decision_enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS approval_tasks (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id),
    tier VARCHAR(20),
    level INT,
    assigned_to BIGINT,
    assigned_role VARCHAR(32),
    status VARCHAR(30),
    remarks TEXT,
    actioned_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    actor_id BIGINT,
    actor_role VARCHAR(32),
    action VARCHAR(64),
    previous_status VARCHAR(40),
    new_status VARCHAR(40),
    ip_address VARCHAR(45),
    device_id VARCHAR(100),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    previous_hash VARCHAR(64),
    current_hash VARCHAR(64)
);

-- View for submitted applications with all relevant details for makers
DROP VIEW IF EXISTS submitted_applications_view CASCADE;
CREATE OR REPLACE VIEW submitted_applications_view AS
SELECT
    la.id,
    la.application_ref,
    la.user_id,
    u.full_name as customer_name,
    u.mobile as customer_mobile,
    u.email as customer_email,
    la.status,
    la.loan_purpose,
    la.requested_amount,
    la.tenure_months,
    la.monthly_income,
    la.existing_emi,
    la.dti_ratio,
    la.tier,
    la.submitted_at,
    la.created_at,
    la.updated_at,
    la.sla_deadline,
    la.allowed_stage,
    la.company_name,
    la.designation,
    la.total_experience_months,
    la.bank_name,
    la.bank_account_number,
    la.bank_account_type,
    la.bank_ifsc,
    la.father_name,
    la.mother_name,
    la.gender,
    la.marital_status,
    la.dependents,
    la.current_address,
    la.permanent_address,
    la.residential_stability,
    la.employee_id,
    la.office_address,
    la.official_email,
    la.gross_monthly_income,
    la.net_take_home_salary,
    la.other_income,
    la.existing_loans_count,
    la.credit_card_outstanding,
    la.current_experience_months,
    la.sanctioned_amount,
    la.annual_interest_rate,
    u.employment_type,

    -- KYC Details
    kyc.pan,
    kyc.aadhaar_token,
    kyc.pan_verified,
    kyc.aadhaar_verified,
    kyc.ckyc_found,
    kyc.fraud_flag,
    kyc.aml_flag,
    kyc.status as kyc_status,
    kyc.remarks as kyc_remarks,

    -- Credit Assessment
    ca.bureau_score,
    ca.internal_score,
    ca.risk_grade,
    ca.policy_passed,
    ca.stp_eligible,
    ca.final_decision,
    ca.decision_reason,

    -- Document Count
    COUNT(DISTINCT ld.id) as document_count,
    COUNT(DISTINCT CASE WHEN ld.verification_status = 'VERIFIED' THEN ld.id END) as verified_document_count,

    -- Underwriter Reviews
    COUNT(DISTINCT ur.id) as review_count,
    MAX(ur.created_at) as last_review_date,

    -- Current Assignment
    la.current_assigned_to,
    assigned_user.full_name as assigned_to_name,
    assigned_user.role as assigned_to_role

FROM loan_applications la
LEFT JOIN users u ON la.user_id = u.id
LEFT JOIN kyc_details kyc ON la.id = kyc.application_id
LEFT JOIN credit_assessments ca ON la.id = ca.application_id
LEFT JOIN loan_documents ld ON la.id = ld.application_id
LEFT JOIN underwriter_reviews ur ON la.id = ur.application_id
LEFT JOIN users assigned_user ON la.current_assigned_to = assigned_user.id

WHERE la.status IN ('SUBMITTED', 'MAKER_CHECKED', 'UNDER_REVIEW', 'KYC_VERIFIED', 'DOCS_COMPLETE', 'RETURNED', 'APPROVED', 'ACCEPTED', 'AGREEMENT_EXECUTED')

GROUP BY
    la.id, la.application_ref, la.user_id, u.full_name, u.mobile, u.email,
    la.status, la.loan_purpose, la.requested_amount, la.tenure_months,
    la.monthly_income, la.existing_emi, la.dti_ratio, la.tier,
    la.submitted_at, la.created_at, la.updated_at, la.sla_deadline, la.allowed_stage,
    la.company_name, la.designation, la.total_experience_months,
    la.bank_name, la.bank_account_number, la.bank_account_type, la.bank_ifsc,
    la.father_name, la.mother_name, la.gender, la.marital_status, la.dependents,
    la.current_address, la.permanent_address, la.residential_stability,
    la.employee_id, la.office_address, la.official_email,
    la.gross_monthly_income, la.net_take_home_salary, la.other_income,
    la.existing_loans_count, la.credit_card_outstanding, la.current_experience_months,
    la.sanctioned_amount, la.annual_interest_rate,
    u.employment_type,
    kyc.pan, kyc.aadhaar_token, kyc.pan_verified, kyc.aadhaar_verified,
    kyc.ckyc_found, kyc.fraud_flag, kyc.aml_flag, kyc.status, kyc.remarks,
    ca.bureau_score, ca.internal_score, ca.risk_grade, ca.policy_passed,
    ca.stp_eligible, ca.final_decision, ca.decision_reason,
    la.current_assigned_to, assigned_user.full_name, assigned_user.role

ORDER BY la.submitted_at DESC;
