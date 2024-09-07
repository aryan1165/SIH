const ort = require('onnxruntime-node');
const sharp = require('sharp');

// Helper function for padding (letterboxing)
async function letterboxImage(imagePath, size) {
  const { width: iw, height: ih } = await sharp(imagePath).metadata();
  const [w, h] = size;

  // Calculate new width and height, keeping aspect ratio
  const scale = Math.min(w / iw, h / ih);
  const nw = Math.floor(iw * scale);
  const nh = Math.floor(ih * scale);

  // Resize the image
  const resizedImage = await sharp(imagePath)
    .resize(nw, nh)
    .toBuffer();

  // Create padded image with a gray (128,128,128) background
  const paddedImage = await sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
    }
  })
    .composite([{ input: resizedImage, left: Math.floor((w - nw) / 2), top: Math.floor((h - nh) / 2) }])
    .raw()
    .toBuffer({ resolveWithObject: true });

  return paddedImage;
}

// Preprocess function to normalize and reshape the image
async function preprocessImage(imagePath) {
  const modelImageSize = [416, 416]; // Target size for YOLO input

  // Get the padded image
  const { data, info } = await letterboxImage(imagePath, modelImageSize);

  // Normalize pixel values and convert to Float32Array
  const float32Image = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    float32Image[i] = data[i] / 255.0; // Normalize pixel values to [0, 1]
  }

  // Reshape to [channels, height, width] (transpose)
  const channels = 3;
  const height = info.height;
  const width = info.width;
  const transposedImage = new Float32Array(channels * height * width);

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      transposedImage[0 * height * width + h * width + w] = float32Image[h * width * channels + w * channels + 0]; // Red channel
      transposedImage[1 * height * width + h * width + w] = float32Image[h * width * channels + w * channels + 1]; // Green channel
      transposedImage[2 * height * width + h * width + w] = float32Image[h * width * channels + w * channels + 2]; // Blue channel
    }
  }

  // Return the transposed image
  return {
    imageData: transposedImage, // Return the data directly
    imageSize: [info.height, info.width] // Image dimensions
  };
}

// Post-processing to filter the outputs
function postProcess(indices, scores, boxes) {
    const outClasses = [];
    const outScores = [];
    const outBoxes = [];
  
    // Debugging: Check if indices is defined
    if (!indices || !indices[0]) {
      console.error('Indices are undefined or have an unexpected structure:', indices);
      return {
        outClasses,
        outScores,
        outBoxes
      };
    }
  
    // Iterate over the indices array (assuming indices[0] contains the relevant data)
    indices[0].forEach(idx_ => {
      // Extract class index from idx_
      const classIndex = idx_[1];
      outClasses.push(classIndex);
  
      // Get the score from the corresponding position
      const score = scores[idx_[0]][idx_[1]][idx_[2]]; // equivalent to scores[tuple(idx_)] in Python
      outScores.push(score);
  
      // Get the bounding box using idx_[0] and idx_[2] (assuming boxes is a multi-dimensional array)
      const box = boxes[idx_[0]][idx_[2]]; // equivalent to boxes[idx_1] in Python
      outBoxes.push(box);
    });
  
    return {
      outClasses,
      outScores,
      outBoxes
    };
  }
  
  // Function to run inference on the ONNX model
  async function runInference(imagePath) {
    try {
      // Preprocess the image
      const { imageData, imageSize } = await preprocessImage(imagePath);
  
      // Load the ONNX model
      const session = await ort.InferenceSession.create('model.onnx');
  
      // Prepare the input tensor
      const inputTensor = new ort.Tensor('float32', imageData, [1, 3, 416, 416]); // Shape: [1, channels, height, width]
      const imageShapeTensor = new ort.Tensor('float32', new Float32Array(imageSize), [1, 2]); // Shape: [1, 2] for image size (height, width)
  
      // Define the feeds (input names to corresponding tensors)
      const feeds = {
        input_1: inputTensor,         // Assuming the input name is 'input_1'
        image_shape: imageShapeTensor // Assuming the input name is 'image_shape'
      };
  
      // Run the inference
      const results = await session.run(feeds);
  
      // Debugging: Log the model outputs to inspect structure
      console.log('Model inference results:', results);
  
      // Extract results from model outputs
      const yolonmsLayer1 = results['yolonms_layer_1']; // This should be indices
      const yolonmsLayer1_1 = results['yolonms_layer_1:1']; // This should be scores
      const yolonmsLayer1_2 = results['yolonms_layer_1:2']; // This should be boxes
  
      // Check if the outputs are defined
      if (!yolonmsLayer1 || !yolonmsLayer1_1 || !yolonmsLayer1_2) {
        console.error('One or more of the model outputs are undefined.');
        return;
      }
  
      // Post-process the outputs
      const processedResults = postProcess(yolonmsLayer1, yolonmsLayer1_1, yolonmsLayer1_2);
  
      // Output the processed results
      console.log('Processed Results:', processedResults);
      return processedResults;
  
    } catch (err) {
      console.error('Error during inference:', err);
    }
  }
  
  // Example usage
  (async () => {
    const imagePath = './image.jpg'; // Path to the input image
    await runInference(imagePath);
  })();
  