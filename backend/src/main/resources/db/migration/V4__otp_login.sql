-- One row per OTP sent by SMS. Only a BCrypt hash of the code is stored.
CREATE TABLE otp_challenges (
    id           BIGSERIAL PRIMARY KEY,
    phone        VARCHAR(20)  NOT NULL,
    purpose      VARCHAR(20)  NOT NULL,
    code_hash    VARCHAR(100) NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    attempts     INT          NOT NULL DEFAULT 0,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_otp_purpose CHECK (purpose IN ('LOGIN'))
);
CREATE INDEX idx_otp_challenges_phone ON otp_challenges (phone, purpose, created_at DESC);
CREATE INDEX idx_users_phone ON users (phone);
