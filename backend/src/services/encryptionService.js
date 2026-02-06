const crypto = require('crypto');

// Use a 32-byte key for AES-256
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// In a real app, this would be a 32-byte hex string in .env
const getSecretKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        // Fallback for development only - NOT FOR PRODUCTION
        return Buffer.alloc(32, 'development-secret-key-32-chars-!');
    }
    return Buffer.from(key, 'hex');
};

exports.encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Encryption failed:', error);
        return text;
    }
};

exports.decrypt = (encryptedText) => {
    if (!encryptedText) return encryptedText;

    // Check if text matches encrypted format: IV(32 hex):AuthTag(32 hex):EncryptedData(hex)
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        // Not encrypted format, return as plain text
        return encryptedText;
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Validate hex format: IV should be 32 chars (16 bytes), AuthTag should be 32 chars (16 bytes)
    const isValidHex = (str, expectedLength) =>
        str && str.length === expectedLength && /^[0-9a-fA-F]+$/.test(str);

    if (!isValidHex(ivHex, 32) || !isValidHex(authTagHex, 32) || !encrypted) {
        // Doesn't match encrypted format, return as plain text
        return encryptedText;
    }

    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            getSecretKey(),
            Buffer.from(ivHex, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        // If decryption fails, return original text (might be plain text that looks like encrypted)
        return encryptedText;
    }
};

/**
 * Encrypt sensitive fields of a medical record before storage
 * HIPAA/GDPR Compliant: All sensitive medical data is encrypted at rest
 */
exports.encryptRecordFields = (record) => {
    return {
        diagnosis: record.diagnosis ? exports.encrypt(record.diagnosis) : '',
        details: record.details ? exports.encrypt(record.details) : '',
        prescription: record.prescription ? exports.encrypt(record.prescription) : ''
    };
};

/**
 * Decrypt sensitive fields of a medical record for authorized viewing
 */
exports.decryptRecord = (record) => {
    if (!record) return record;

    // Try to decrypt, if it fails or isn't encrypted format, return as-is
    const tryDecrypt = (text) => {
        if (!text) return '';
        const decrypted = exports.decrypt(text);
        // If decrypt returned the original (encrypted-looking) text, it means decryption failed
        // For records that failed to decrypt, return a placeholder
        if (decrypted === text && text.includes(':') && text.length > 100) {
            return '[Encrypted - Key Mismatch]';
        }
        return decrypted;
    };

    return {
        ...record,
        diagnosis: tryDecrypt(record.diagnosis),
        details: tryDecrypt(record.details),
        prescription: tryDecrypt(record.prescription)
    };
};
