import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Dokument wird automatisch gelöscht wenn expiresAt erreicht ist
    }
}, { collection: 'blacklistedTokens' });

export default mongoose.model('BlacklistedToken', tokenBlacklistSchema); 