const fs = require('fs');
const crypto = require('crypto');

// Function to generate a random encryption key
function generateEncryptionKey() {
  return crypto.randomBytes(32);
}

// Function to encrypt the model file using AES-256
function encryptModel(modelFilePath, encryptionKey) {
  const modelData = fs.readFileSync(modelFilePath);
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encryptedModel = cipher.update(modelData);
  encryptedModel = Buffer.concat([encryptedModel, cipher.final()]);
  
  const encryptedData = {
    iv: iv.toString('hex'),
    encryptedModel: encryptedModel.toString('hex'),
  };
  
  fs.writeFileSync('encrypted_model.json', JSON.stringify(encryptedData));
  console.log('Model encrypted successfully.');
}

// Function to decrypt the encrypted model file
function decryptModel(encryptedModelFilePath, encryptionKey) {
  const encryptedData = JSON.parse(fs.readFileSync(encryptedModelFilePath));
  
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const encryptedModel = Buffer.from(encryptedData.encryptedModel, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decryptedModel = decipher.update(encryptedModel);
  decryptedModel = Buffer.concat([decryptedModel, decipher.final()]);
  
  fs.writeFileSync('decrypted_model.onnx', decryptedModel);
  console.log('Model decrypted successfully.');
}

// Main function
function main() {
  const modelFilePath = 'quantized_model.onnx';
  
  // Generate a random encryption key
  const encryptionKey = generateEncryptionKey();
  
  // Encrypt the model file using AES-256
  encryptModel(modelFilePath, encryptionKey);
  
  // Decrypt the encrypted model file
  decryptModel('encrypted_model.json', encryptionKey);
}

main();