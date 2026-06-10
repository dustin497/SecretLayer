# Detect GPU on Windows and recommend a local model size for PrivateLayer
# ASCII-only for Windows PowerShell 5.1
# Run: powershell -ExecutionPolicy Bypass -File scripts\detect-gpu.ps1

Write-Host ""
Write-Host "=== PrivateLayer GPU Check ===" -ForegroundColor Cyan
Write-Host ""

$gpus = @()

try {
    $gpus = Get-CimInstance Win32_VideoController | Where-Object {
        $_.Name -and $_.Name -notmatch "Microsoft Basic"
    }
} catch {
    Write-Host "Could not query GPU via WMI." -ForegroundColor Yellow
}

if (-not $gpus) {
    Write-Host "No dedicated GPU detected (or drivers not installed)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommendation:" -ForegroundColor Green
    Write-Host "  - Use CPU-only Ollama with a small model: ollama pull qwen2.5:1.5b"
    Write-Host "  - Training (LoRA): not recommended without NVIDIA GPU"
    Write-Host "  - PrivateLayer desktop + agent still work; responses will be slower"
    exit 0
}

foreach ($gpu in $gpus) {
    Write-Host "GPU: $($gpu.Name)" -ForegroundColor White
    if ($gpu.AdapterRAM -and $gpu.AdapterRAM -gt 0) {
        $vramGb = [math]::Round($gpu.AdapterRAM / 1GB, 1)
        Write-Host "  Reported VRAM: ~${vramGb} GB (Windows estimate - may be wrong on some cards)"
    }
    Write-Host "  Driver: $($gpu.DriverVersion)"
    Write-Host ""
}

$nvidia = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if ($nvidia) {
    Write-Host "NVIDIA driver (nvidia-smi):" -ForegroundColor Green
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    Write-Host ""
}

$name = ($gpus | Select-Object -First 1).Name
$recommend = "qwen2.5:7b"

if ($name -match "NVIDIA") {
    if ($name -match "4090|4080|3090|3080|A100|6000|5000") { $recommend = "qwen2.5:14b or dolphin-mistral" }
    elseif ($name -match "4060|3070|3060|2070|2060|3050") { $recommend = "qwen2.5:7b or dolphin-mistral" }
    elseif ($name -match "1660|1650|1050|MX") { $recommend = "qwen2.5:3b or qwen2.5:1.5b" }
    Write-Host "Recommendation (NVIDIA):" -ForegroundColor Green
    Write-Host "  ollama pull $recommend"
    Write-Host "  Training: LoRA on 7B needs ~16GB VRAM; use qwen2.5:3b LoRA if you have 8GB"
} elseif ($name -match "AMD|Radeon") {
    Write-Host "Recommendation (AMD):" -ForegroundColor Green
    Write-Host "  ollama pull qwen2.5:7b (ROCm if configured) or qwen2.5:3b for CPU fallback"
    Write-Host "  Training: AMD on Windows is harder - consider CPU training or smaller models"
} elseif ($name -match "Intel") {
    Write-Host "Recommendation (Intel iGPU):" -ForegroundColor Green
    Write-Host "  ollama pull qwen2.5:1.5b or qwen2.5:3b"
} else {
    Write-Host "Recommendation:" -ForegroundColor Green
    Write-Host "  ollama pull qwen2.5:7b - if slow, try qwen2.5:3b"
}

Write-Host ""
Write-Host "Save result: copy the model name into .env as DEFAULT_MODEL=..." -ForegroundColor Gray
Write-Host ""
