import crypto from "crypto";
import config from "../config";
import environmentVariable from "../config/custom-environment-variables";
import {ObjectID} from "@interface/generic.type";

export type EncryptedFieldType = {
    iv: string,
    content: string,
}

const algorithm = 'aes-256-ctr';
const iv = crypto.randomBytes(16);

export const encrypt = (plainText: string): EncryptedFieldType => {
    const secretKey = config<string>(environmentVariable.CIPHER_SECRET_KEY).substring(0, 32);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
    };
};

export const decrypt = (cipherText: EncryptedFieldType): string => {
    if (!cipherText.iv || !cipherText.content) return '';
    const secretKey = config<string>(environmentVariable.CIPHER_SECRET_KEY).substring(0, 32);
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(cipherText.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherText.content, 'hex')), decipher.final()]);
    return decrypted.toString();
};

export const generateId = () => crypto.randomBytes(16).toString("hex")

export function generateUniqueNumberFromMongoId(mongoId: ObjectID, length: number = 16) {
    if (!mongoId) return '';
    const hexString = mongoId.toHexString().padStart(24, '0');
    const high32 = parseInt(hexString.substring(0, 8), 16);
    const low32 = parseInt(hexString.substring(8, 16), 16);
    const number = BigInt(high32) << 32n | BigInt(low32);
    const remainder = number % BigInt(10 ** length);
    return String(remainder).padStart(length, '0');
}

// Reuse the decryptObject function
export function decryptNestedObject(obj: any): any {
    // Iterate over all keys of the object
    for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
            // Check if the field is of type EncryptedFieldType
            if ('iv' in obj[key] && 'content' in obj[key]) {
                // Decrypt the encrypted field and assign the decrypted value back
                obj[key] = decrypt(obj[key] as EncryptedFieldType);
            } else {
                // If it's a nested object, recursively decrypt
                decryptNestedObject(obj[key]);
            }
        }
    }

    // Return the modified object
    return obj
}
