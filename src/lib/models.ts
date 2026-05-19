

import os from "os";
import path from "path";
import fs from "fs";

export const MODELS_DIR = path.join(os.homedir(), ".open-quizz", "models");

export type ModelDefinition = {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  downloadUrl: string;
  filename: string;
};

export const RECOMMENDED_MODELS: ModelDefinition[] = [
  {
    id: "qwen2.5-0.5b-instruct",
    name: "Qwen 2.5 (0.5B) - Ultra Fast",
    description: "Cực kỳ nhanh, ít hao RAM. Tốt cho máy cấu hình yếu.",
    sizeMB: 398,
    downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true",
    filename: "qwen2.5-0.5b-instruct-q4_k_m.gguf"
  },
  {
    id: "qwen2.5-1.5b-instruct",
    name: "Qwen 2.5 (1.5B) - Fast",
    description: "Cân bằng giữa tốc độ và khả năng suy luận tiếng Việt.",
    sizeMB: 1120,
    downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true",
    filename: "qwen2.5-1.5b-instruct-q4_k_m.gguf"
  },
  {
    id: "llama-3.2-1b-instruct",
    name: "Llama 3.2 (1B) - Fast",
    description: "Mô hình nhẹ của Meta. Tốc độ sinh text rất nhanh.",
    sizeMB: 880,
    downloadUrl: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf?download=true",
    filename: "Llama-3.2-1B-Instruct-Q4_K_M.gguf"
  },
  {
    id: "llama-3.2-3b-instruct",
    name: "Llama 3.2 (3B) - Standard",
    description: "Mô hình tiêu chuẩn của Meta. Suy luận tốt hơn, yêu cầu ~4GB RAM.",
    sizeMB: 2020,
    downloadUrl: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf?download=true",
    filename: "Llama-3.2-3B-Instruct-Q4_K_M.gguf"
  }
];

export async function getLocalModels() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(MODELS_DIR);
  return RECOMMENDED_MODELS.map(model => {
    const isDownloaded = files.includes(model.filename);
    const absolutePath = path.join(MODELS_DIR, model.filename);
    
    // Quick validation of file size to check if it's partially downloaded
    let isValid = isDownloaded;
    if (isDownloaded) {
       const stat = fs.statSync(absolutePath);
       if (stat.size < model.sizeMB * 1024 * 1024 * 0.9) { // At least 90% of expected size
         isValid = false;
       }
    }

    return {
      ...model,
      isDownloaded: isValid,
      absolutePath
    };
  });
}
