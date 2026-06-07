[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$SUPABASE_URL = "https://prxagoffeoaggumqojdd.supabase.co"
$SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTg2MzksImV4cCI6MjA5NTczNDYzOX0.M-H7fnB0-9tegF-nP1j_-Mral-hOOBRJWFPomf1XuK4"
$IMAGES_ROOT  = "D:\CN8\Holamate_new\Data_GGMaps\images"

# Vendor ID map - build using Add() to avoid hash literal encoding issues
$VENDOR_IDS = New-Object 'System.Collections.Generic.Dictionary[string,string]'
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x56,0xc6,0xb0,0xe1,0xbb,0x9d,0x6e,0x20,0x42,0x69,0x61,0x20,0xc4,0x90,0xe1,0xbb,0x93,0x69,0x20,0x58,0x61,0x6e,0x68)), "2e87a872-0f14-4a39-8acb-ea467030c59b")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x48,0xe1,0xbb,0x93,0x20,0x53,0x65,0x6e)), "83077578-839f-4883-a153-476773e781ca")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x42,0xe1,0xba,0xa3,0x6f,0x20,0x54,0x72,0xc3,0xa2,0x6d,0x20,0x51,0x75,0xc3,0xa1,0x6e)), "87f33c9c-ce09-4595-98fa-b0704e28ba51")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x43,0x61,0x6e,0x68,0x20,0xc6,0xa0,0x69)), "ae67bff1-0e63-4c6d-b68e-a084fb1ee301")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x43,0xc4,0x83,0x6e,0x67,0x20,0x54,0x69,0x6e,0x20,0x56,0xc6,0xb0,0xe1,0xbb,0x9d,0x6e,0x20,0x55,0xc6,0xa1,0x6d)), "cfc3b960-a0ea-458d-8fe2-5ebbbcad4b7d")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x51,0x75,0xc3,0xa1,0x6e,0x20,0x54,0x68,0x75,0x20,0x48,0xc3,0xa0)), "eaa53106-6851-406b-862f-79fec93f0e4a")
$VENDOR_IDS.Add("Buk Bbq & Hotpot", "ecc6d736-f9e0-4166-85ea-06bee8cfca91")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x42,0x69,0x61,0x20,0x54,0x68,0xc3,0xa0,0x6e,0x68,0x20,0x51,0x75,0xc3,0xa1,0x6e)), "9d3fcbd9-8fca-4e83-bfc6-7c246e80a838")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x43,0xc6,0xa1,0x6d,0x20,0x48,0x75,0xe1,0xbb,0x87)), "c3149ed6-1506-4409-86b9-8deb84bfb1ba")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0xc6,0xb0,0xe1,0xbb,0x9b,0x6e,0x67,0x20,0x56,0x65,0x6e,0x20,0x48,0xe1,0xbb,0x93,0x20,0x48,0xc3,0xa0,0x20,0x51,0x75,0xc3,0xbd)), "ebc92852-7a21-4987-ba11-379e8bedce26")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x43,0x75,0x61,0x20,0xc4,0x90,0xe1,0xbb,0x93,0x6e,0x67,0x20,0x4b,0x68,0xc3,0xb4,0x6e,0x67,0x20,0x54,0xc3,0xaa,0x6e)), "80924cde-67dc-4f18-aa98-bf6cf6680399")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x54,0x68,0x61,0x6e,0x68,0x20,0x56,0xc5,0xa9,0x20,0x37,0x39)), "cd769e22-a2b6-4115-85f7-a7a137a39dae")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x47,0xc3,0xa0,0x20,0x52,0x69,0x20,0x50,0x68,0xc3,0xba,0x20,0x42,0xc3,0xac,0x6e,0x68,0x20,0x31)), "b00ef2e5-05eb-469f-83f8-383aaa8c879e")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x33,0x37,0x39,0x20,0x4d,0x69,0x6e,0x68,0x20,0x4e,0x67,0x61,0x20,0x31)), "782f0f44-f71f-4d64-b164-3553cd2b86a8")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x50,0x68,0xe1,0xbb,0x9f,0x20,0x4e,0x61,0x6d,0x20,0x4e,0x68,0xe1,0xba,0xa5,0x74)), "21d3f9c4-58cc-49e8-af1f-3cfc58b6758b")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x48,0xc3,0xb2,0x20,0x5a,0xc3,0xb4,0x20,0x54,0x61)), "2f005389-9768-4d00-becc-d74740549b3e")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x47,0xc3,0xa0,0x20,0x52,0x69,0x20,0x50,0x68,0xc3,0xba,0x20,0x42,0xc3,0xac,0x6e,0x68,0x20,0x32)), "8293bc85-4549-4c4b-8fc9-dfe4c99a7b2e"  )
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x56,0x75,0x61,0x20,0x47,0xc3,0xa0,0x20,0x51,0x75,0x61,0x6e,0x67,0x20,0x54,0x68,0xe1,0xbb,0x8d)), "bc400034-7587-4de9-9942-9a1091715488")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x50,0x68,0xe1,0xbb,0x9f,0x20,0x4e,0xc3,0xba,0x69)), "1d68a221-eb7a-43f0-ba6f-ebd6a5635dce")
$VENDOR_IDS.Add([System.Text.Encoding]::UTF8.GetString([byte[]](0x4e,0x68,0xc3,0xa0,0x20,0x48,0xc3,0xa0,0x6e,0x67,0x20,0x4e,0x67,0x75,0x79,0xe1,0xbb,0x85,0x6e,0x20,0x47,0x69,0x61)), "679bc3eb-86b2-4875-8eb7-eb0e510dc57b")

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
        Write-Host "    [ERROR] $storagePath : $_" -ForegroundColor Red
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
        Write-Host "    [WARN] cover patch: $_" -ForegroundColor Yellow
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
        Write-Host "    [WARN] vendor_media: $_" -ForegroundColor Yellow
    }
}

Write-Host "=== HolaMate Image Upload ===" -ForegroundColor Cyan

foreach ($entry in $VENDOR_IDS.GetEnumerator()) {
    $vendorName = $entry.Key
    $vendorId   = $entry.Value
    Write-Host ""
    Write-Host "[$vendorName]" -ForegroundColor White

    # Find folder - try exact match first
    $folderPath = $null
    $candidatePath = Join-Path $IMAGES_ROOT $vendorName
    if (Test-Path $candidatePath) {
        $folderPath = $candidatePath
    } else {
        # Scan all subdirs and compare
        $dirs = Get-ChildItem $IMAGES_ROOT -Directory
        foreach ($d in $dirs) {
            # Get name as UTF8 bytes from full path
            $dNameBytes = [System.Text.Encoding]::Default.GetBytes($d.Name)
            $dNameUtf8  = [System.Text.Encoding]::UTF8.GetString($dNameBytes)
            if ($dNameUtf8 -eq $vendorName -or $d.Name -eq $vendorName) {
                $folderPath = $d.FullName
                break
            }
        }
    }

    if (-not $folderPath -or -not (Test-Path $folderPath)) {
        Write-Host "  No image folder found." -ForegroundColor Yellow
        $noFolder += $vendorName
        continue
    }

    $imageFiles = Get-ChildItem $folderPath -File |
        Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' } |
        Sort-Object Name

    if ($imageFiles.Count -eq 0) {
        Write-Host "  0 images in folder." -ForegroundColor Yellow
        $noFolder += $vendorName
        continue
    }

    Write-Host "  $($imageFiles.Count) image(s) to upload" -ForegroundColor Cyan

    $idx = 1
    foreach ($imgFile in $imageFiles) {
        $ext = $imgFile.Extension.ToLower()
        $storagePath = if ($idx -eq 1) { "vendors/$vendorId/cover$ext" } else { "vendors/$vendorId/gallery_$idx$ext" }
        Write-Host "  [$idx] $($imgFile.Name) -> $storagePath" -NoNewline

        $ok = Upload-Image $imgFile.FullName $storagePath
        if ($ok) {
            $publicUrl = "$SUPABASE_URL/storage/v1/object/public/vendor-images/$storagePath"
            Write-Host " OK" -ForegroundColor Green
            $script:imageOk++
            if ($idx -eq 1) {
                Patch-VendorCover $vendorId $publicUrl
                Insert-VendorMedia $vendorId $publicUrl $storagePath "cover" $true 0
            } else {
                Insert-VendorMedia $vendorId $publicUrl $storagePath "food" $false $idx
            }
        } else {
            Write-Host " FAIL" -ForegroundColor Red
            $script:imageFail++
        }
        $idx++
    }
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Cyan
Write-Host "Images OK   : $imageOk"
Write-Host "Images FAIL : $imageFail"
if ($noFolder.Count -gt 0) {
    Write-Host "No folder   : $($noFolder.Count) vendors" -ForegroundColor Yellow
    $noFolder | ForEach-Object { Write-Host "  - $_" }
}