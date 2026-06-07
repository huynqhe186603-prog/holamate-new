# ============================================================
# HolaMate — Upload vendor images to Supabase Storage
# ============================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$SUPABASE_URL = "https://prxagoffeoaggumqojdd.supabase.co"
$SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTg2MzksImV4cCI6MjA5NTczNDYzOX0.M-H7fnB0-9tegF-nP1j_-Mral-hOOBRJWFPomf1XuK4"
$IMAGES_ROOT  = "D:\CN8\Holamate_new\Data_GGMaps\images"
$JSON_FILE    = "D:\CN8\Holamate_new\Data_GGMaps\database_ready.json"

# Vendor name → ID mapping (from inserts above)
$VENDOR_IDS = @{
    "Vườn Bia Đồi Xanh"       = "2e87a872-0f14-4a39-8acb-ea467030c59b"
    "Nhà Hàng Hồ Sen"          = "83077578-839f-4883-a153-476773e781ca"
    "Bảo Trâm Quán"            = "87f33c9c-ce09-4595-98fa-b0704e28ba51"
    "Canh Ơi"                  = "ae67bff1-0e63-4c6d-b68e-a084fb1ee301"
    "Căng Tin Vườn Uơm"        = "cfc3b960-a0ea-458d-8fe2-5ebbbcad4b7d"
    "Quán Thu Hà"              = "eaa53106-6851-406b-862f-79fec93f0e4a"
    "Buk Bbq & Hotpot"         = "ecc6d736-f9e0-4166-85ea-06bee8cfca91"
    "Bia Thành Quán"           = "9d3fcbd9-8fca-4e83-bfc6-7c246e80a838"
    "Cơm Huệ"                  = "c3149ed6-1506-4409-86b9-8deb84bfb1ba"
    "Nướng Ven Hồ Hà Quý"     = "ebc92852-7a21-4987-ba11-379e8bedce26"
    "Cua Đồng Không Tên"       = "80924cde-67dc-4f18-aa98-bf6cf6680399"
    "Nhà Hàng Thanh Vũ 79"    = "cd769e22-a2b6-4115-85f7-a7a137a39dae"
    "Nhà Hàng Gà Ri Phú Bình 1" = "b00ef2e5-05eb-469f-83f8-383aaa8c879e"
    "Nhà Hàng 379 Minh Nga 1"  = "782f0f44-f71f-4d64-b164-3553cd2b86a8"
    "Phở Nam Nhất"             = "21d3f9c4-58cc-49e8-af1f-3cfc58b6758b"
    "Nhà Hàng Hò Zô Ta"       = "2f005389-9768-4d00-becc-d74740549b3e"
    "Nhà Hàng Gà Ri Phú Bình 2" = "8293bc85-4549-4c4b-8fc9-dfe4c99a7b2e"
    "Vua Gà Quang Thọ"         = "bc400034-7587-4de9-9942-9a1091715488"
    "Phở Núi"                  = "1d68a221-eb7a-43f0-ba6f-ebd6a5635dce"
    "Nhà Hàng Nguyễn Gia"     = "679bc3eb-86b2-4875-8eb7-eb0e510dc57b"
}

$AUTH_HEADERS = @{
    "apikey"        = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

$imageOk   = 0
$imageFail = 0
$noFolder  = @()

function Upload-Image($localPath, $storagePath) {
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $ext   = [System.IO.Path]::GetExtension($localPath).ToLower()
    $mime  = switch ($ext) {
        ".jpg"  { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".png"  { "image/png"  }
        ".webp" { "image/webp" }
        default { "image/jpeg" }
    }
    $uploadUrl = "$SUPABASE_URL/storage/v1/object/vendor-images/$storagePath"
    try {
        Invoke-RestMethod -Uri $uploadUrl -Method PUT -Headers @{
            "apikey"        = $SERVICE_KEY
            "Authorization" = "Bearer $SERVICE_KEY"
            "Content-Type"  = $mime
        } -Body $bytes -ErrorAction Stop | Out-Null
        return $true
    } catch {
        Write-Host "    [ERROR] $storagePath`: $_" -ForegroundColor Red
        return $false
    }
}

function Patch-VendorCover($vendorId, $coverUrl) {
    $url  = "$SUPABASE_URL/rest/v1/vendors?id=eq.$vendorId"
    $body = @{ cover_image_url = $coverUrl } | ConvertTo-Json -Compress
    try {
        Invoke-RestMethod -Uri $url -Method PATCH `
            -Headers $AUTH_HEADERS `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
            -ContentType "application/json" `
            -ErrorAction Stop | Out-Null
    } catch {
        Write-Host "    [WARN] Could not patch cover: $_" -ForegroundColor Yellow
    }
}

function Insert-VendorMedia($vendorId, $imageUrl, $storagePath, $mediaType, $isPrimary, $sortOrder) {
    $url  = "$SUPABASE_URL/rest/v1/vendor_media"
    $body = @{
        vendor_id    = $vendorId
        image_url    = $imageUrl
        storage_path = $storagePath
        media_type   = $mediaType
        status       = "visible"
        is_primary   = $isPrimary
        sort_order   = $sortOrder
    } | ConvertTo-Json -Compress
    try {
        Invoke-RestMethod -Uri $url -Method POST `
            -Headers $AUTH_HEADERS `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
            -ContentType "application/json" `
            -ErrorAction Stop | Out-Null
    } catch {
        Write-Host "    [WARN] vendor_media insert: $_" -ForegroundColor Yellow
    }
}

# Load JSON to get image lists
$rawJson = [System.IO.File]::ReadAllText($JSON_FILE, [System.Text.Encoding]::UTF8)
$vendors = $rawJson | ConvertFrom-Json

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " HolaMate — Image Upload" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

foreach ($entry in $VENDOR_IDS.GetEnumerator()) {
    $vendorName = $entry.Key
    $vendorId   = $entry.Value

    Write-Host ""
    Write-Host "[$vendorName]" -ForegroundColor White

    # Find image folder
    $folderPath = Join-Path $IMAGES_ROOT $vendorName
    if (-not (Test-Path $folderPath)) {
        # Try to find by matching folder name (UTF8 vs ANSI mismatch)
        $dirs = Get-ChildItem $IMAGES_ROOT -Directory
        $matched = $null
        foreach ($d in $dirs) {
            # Read the dir name as UTF8 by using the full path
            $dName = [System.IO.Path]::GetFileName($d.FullName)
            if ($dName -eq $vendorName) {
                $matched = $d.FullName
                break
            }
        }
        if ($matched) { $folderPath = $matched }
        else {
            Write-Host "  No image folder found." -ForegroundColor Yellow
            $noFolder += $vendorName
            continue
        }
    }

    $imageFiles = Get-ChildItem $folderPath -File |
        Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' } |
        Sort-Object Name

    if ($imageFiles.Count -eq 0) {
        Write-Host "  Folder exists but 0 images." -ForegroundColor Yellow
        $noFolder += $vendorName
        continue
    }

    Write-Host "  Found $($imageFiles.Count) image(s)" -ForegroundColor Cyan

    $idx = 1
    foreach ($imgFile in $imageFiles) {
        $ext = $imgFile.Extension.ToLower()
        $storagePath = if ($idx -eq 1) { "vendors/$vendorId/cover$ext" } else { "vendors/$vendorId/gallery_$idx$ext" }

        Write-Host "  [$idx] $($imgFile.Name) → $storagePath" -NoNewline

        $ok = Upload-Image $imgFile.FullName $storagePath
        if ($ok) {
            $publicUrl = "$SUPABASE_URL/storage/v1/object/public/vendor-images/$storagePath"
            Write-Host " OK" -ForegroundColor Green
            $imageOk++

            if ($idx -eq 1) {
                Patch-VendorCover $vendorId $publicUrl
                Insert-VendorMedia $vendorId $publicUrl $storagePath "cover" $true 0
            } else {
                Insert-VendorMedia $vendorId $publicUrl $storagePath "food" $false $idx
            }
        } else {
            Write-Host " FAIL" -ForegroundColor Red
            $imageFail++
        }
        $idx++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " IMAGE UPLOAD COMPLETE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Images uploaded OK : $imageOk"
Write-Host "Images FAILED      : $imageFail"
if ($noFolder.Count -gt 0) {
    Write-Host "No folder found    : $($noFolder -join ', ')" -ForegroundColor Yellow
}
