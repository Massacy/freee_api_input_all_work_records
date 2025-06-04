require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 環境変数の検証
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required. Please check your .env file.');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required. Please check your .env file.');
}

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required. Please check your .env file.');
}

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long.');
}

// Supabaseクライアントの初期化
const supabase = createClient(supabaseUrl, supabaseKey);

const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encrypted = textParts[1];
    
    if (iv.length !== 16) {
      throw new Error('Invalid IV length');
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    console.error('Encrypted text:', encryptedText);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

module.exports = { supabase, encrypt, decrypt };
