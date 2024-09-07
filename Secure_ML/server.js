const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const app = express();
const PORT = 3000;

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
  
  return {
    iv: iv.toString('hex'),
    encryptedModel: encryptedModel.toString('hex'),
  };
}

// Function to decrypt the encrypted model file
function decryptModel(encryptedModelData, encryptionKey) {
  const iv = Buffer.from(encryptedModelData.iv, 'hex');
  const encryptedModel = Buffer.from(encryptedModelData.encryptedModel, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decryptedModel = decipher.update(encryptedModel);
  decryptedModel = Buffer.concat([decryptedModel, decipher.final()]);
  
  fs.writeFileSync('decrypted_model.onnx', decryptedModel);
  console.log('Model decrypted successfully.');
}

// Function to cache the encrypted model (optional, using in-memory cache)
const cache = {};  // Simple in-memory cache for demonstration

// Express route to handle GET request for encryption
app.get('/encrypt-model', (req, res) => {
  const modelFilePath = 'quantized_model.onnx';
  
  // Generate a random encryption key
  const encryptionKey = generateEncryptionKey();
  
  // Encrypt the model file using AES-256
  const encryptedModelData = encryptModel(modelFilePath, encryptionKey);
  
  // Optionally, cache the encrypted model
  cache['encryptedModel'] = encryptedModelData;

  // Send the encrypted JSON response
  res.json({
    message: 'Model encrypted successfully.',
    encryptedModelData: encryptedModelData
  });
});

// Decrypting on-demand (optional)
app.get('/decrypt-model', (req, res) => {
  const encryptionKey = generateEncryptionKey(); // In practice, you should retrieve the key used for encryption
  
  // Retrieve encrypted data from cache or source
  const encryptedModelData = cache['encryptedModel'];
  
  if (!encryptedModelData) {
    return res.status(404).json({ message: 'Encrypted model not found.' });
  }
  
  // Decrypt the model
  decryptModel(encryptedModelData, encryptionKey);
  
  res.json({ message: 'Model decrypted and saved as decrypted_model.onnx' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

