import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

export const generatePassword = (
    passwordLength = 8,
    useUpperCase = true,
    useNumbers = true,
    useSpecialChars = true,
) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    const numberChars = '0123456789'
    const specialChars = '!@#$%^&*()-_+='

    const usableChars = chars
        + (useUpperCase ? chars.toUpperCase() : '')
        + (useNumbers ? numberChars : '')
        + (useSpecialChars ? specialChars : '')

    let generatedPassword = ''

    for(let i = 0; i <= passwordLength; i++) {
        generatedPassword += usableChars[Math.floor(Math.random() * (usableChars.length))]
    }

    return generatedPassword
}