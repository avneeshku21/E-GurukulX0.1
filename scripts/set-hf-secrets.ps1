param(
  [string]$Token = $env:HF_TOKEN,
  [string]$Space = "avneesh021/eduAi"
)
if (-not $Token) { Write-Error "HF_TOKEN not provided"; exit 1 }

$secrets = [ordered]@{
  DATABASE_URL          = "mongodb+srv://jrpsw01_db_user:jed3ffl132sdFXzR@cluster0.uxdd4qh.mongodb.net/edutrack?retryWrites=true&w=majority"
  JWT_SECRET            = "edutrack-local-development-secret-key-2026"
  JWT_EXPIRY            = "7d"
  REFRESH_TOKEN_EXPIRY  = "30d"
  NODE_ENV              = "production"
  ALLOWED_ORIGINS       = "*"
  YOUTUBE_API_KEY       = "AIzaSyATvBdVM9uV502WMDOQkk-lv0PbnObKIoU"
  VITE_YOUTUBE_API_KEY  = "AIzaSyATvBdVM9uV502WMDOQkk-lv0PbnObKIoU"
  CLOUDINARY_CLOUD_NAME = "dbncx8g6t"
  CLOUDINARY_API_KEY    = "866681851943511"
  CLOUDINARY_API_SECRET = "T0A8iGVxoTvW-AGLDOFRuXLQCUc"
}

$tmp = Join-Path $env:TEMP "hf-secret.json"
foreach ($k in $secrets.Keys) {
  @{ key = $k; value = $secrets[$k] } | ConvertTo-Json -Compress | Out-File -Encoding ascii -NoNewline $tmp
  $code = & curl.exe -s -o NUL -w "%{http_code}" -X POST "https://huggingface.co/api/spaces/$Space/secrets" `
    -H "Authorization: Bearer $Token" -H "Content-Type: application/json" -d "@$tmp"
  Write-Host "$code  $k"
}

# Trigger factory rebuild
$rebuildCode = & curl.exe -s -o NUL -w "%{http_code}" -X POST "https://huggingface.co/api/spaces/$Space/restart?factory=true" `
  -H "Authorization: Bearer $Token"
Write-Host "REBUILD: $rebuildCode"

Remove-Item $tmp -ErrorAction SilentlyContinue
