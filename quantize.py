import onnx
from onnxruntime.quantization import quantize_dynamic

# Paths to your ONNX models
model_fp32 = 'model.onnx'
model_quant = 'quantized_model.onnx'

# Optional: Run shape inference separately if needed
inferred_model_path = 'inferred_model.onnx'
model = onnx.load(model_fp32)
inferred_model = onnx.shape_inference.infer_shapes(model)
onnx.save(inferred_model, inferred_model_path)

# Run dynamic quantization
quantized_model = quantize_dynamic(inferred_model_path, model_quant)
print(f'Quantized model saved to {model_quant}')
