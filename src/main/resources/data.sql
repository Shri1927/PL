INSERT INTO users (customer_id, mobile, email, password_hash, full_name, role, employment_type, city, dob)
VALUES
('CIF100001', '9999990001', 'admin@loan.local', '$2a$10$O0JQ25Bo8byC8a8Uv7f4je6YjB91QJSwUeOvPU8vYAiWPeIWQ6T6C', 'System Admin', 'ADMIN', 'SALARIED', 'Bengaluru', '1990-01-01'),
('CIF100002', '9999990002', 'underwriter@loan.local', '$2a$10$O0JQ25Bo8byC8a8Uv7f4je6YjB91QJSwUeOvPU8vYAiWPeIWQ6T6C', 'Credit Underwriter', 'UNDERWRITER', 'SALARIED', 'Mumbai', '1992-01-01'),
('CIF100003', '9999990003', 'customer@loan.local', '$2a$10$O0JQ25Bo8byC8a8Uv7f4je6YjB91QJSwUeOvPU8vYAiWPeIWQ6T6C', 'Demo Customer', 'CUSTOMER', 'SALARIED', 'Pune', '1995-03-10')
ON CONFLICT DO NOTHING;
