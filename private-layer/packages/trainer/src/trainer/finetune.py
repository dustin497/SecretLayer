"""
LoRA fine-tune on Windows with NVIDIA GPU.

Requires: CUDA, ~16GB VRAM for 7B QLoRA (adjust batch size if needed).
"""

import os
from pathlib import Path

from datasets import load_dataset
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import SFTTrainer


def run_finetune(
    base_model: str | None = None,
    dataset_path: Path | None = None,
    output_dir: Path | None = None,
) -> str:
    base_model = base_model or os.getenv("BASE_MODEL_FOR_FINETUNE", "Qwen/Qwen2.5-7B-Instruct")
    dataset_path = dataset_path or Path(os.getenv("TRAINING_DIR", "./training")) / "dataset.jsonl"
    output_dir = output_dir or Path(os.getenv("LORA_OUTPUT_DIR", "./training-output"))

    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}. Run: python -m trainer prepare")

    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        device_map="auto",
        load_in_4bit=True,
        trust_remote_code=True,
    )

    lora = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora)

    dataset = load_dataset("json", data_files=str(dataset_path), split="train")

    args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=100,
        fp16=True,
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        args=args,
        train_dataset=dataset,
        processing_class=tokenizer,
        dataset_text_field="text",
        max_seq_length=2048,
    )
    trainer.train()
    model.save_pretrained(output_dir / "adapter")
    tokenizer.save_pretrained(output_dir / "adapter")
    return str(output_dir / "adapter")
