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
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    try {
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
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
        return '[DECRYPTION ERROR]';
    }
};
