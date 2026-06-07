# ============================================================
# HolaMate — Import vendors from Google Maps scrape
# ============================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$SUPABASE_URL    = "https://prxagoffeoaggumqojdd.supabase.co"
$ANON_KEY        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTg2MzksImV4cCI6MjA5NTczNDYzOX0.M-H7fnB0-9tegF-nP1j_-Mral-hOOBRJWFPomf1XuK4"
$JSON_FILE       = "D:\CN8\Holamate_new\Data_GGMaps\database_ready.json"
$IMAGES_ROOT     = "D:\CN8\Holamate_new\Data_GGMaps\images"

# We use SERVICE_ROLE_KEY from env if available, else ANON_KEY
$SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $SERVICE_KEY) { $SERVICE_KEY = $ANON_KEY }

$AUTH_HEADERS = @{
    "apikey"        = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

$STORAGE_HEADERS = @{
    "apikey"        = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
}

# ---- Counters ----
$vendorOk    = 0
$vendorFail  = 0
$imageOk     = 0
$imageFail   = 0
$noFolder    = @()
$errors      = @()

# ============================================================
# Helper: convert Vietnamese day names to short keys
# ============================================================
function Convert-OpeningHours($ohArray) {
    if (-not $ohArray -or $ohArray.Count -eq 0) { return $null }
    $dayMap = @{
        "Thứ Hai"   = "mon"
        "Thứ Ba"    = "tue"
        "Thứ Tư"    = "wed"
        "Thứ Năm"   = "thu"
        "Thứ Sáu"   = "fri"
        "Thứ Bảy"   = "sat"
        "Chủ Nhật"  = "sun"
    }
    $result = @{}
    foreach ($entry in $ohArray) {
        $key = $dayMap[$entry.day]
        if (-not $key) { continue }
        # "10:00 to 22:00" → "10:00-22:00"
        $hours = $entry.hours -replace " to ", "-"
        $result[$key] = $hours
    }
    if ($result.Count -eq 0) { return $null }
    return $result
}

# ============================================================
# Helper: convert phone "+84978697961" → "0978697961"
# ============================================================
function Convert-Phone($raw) {
    if (-not $raw -or $raw.Trim() -eq "") { return $null }
    $p = $raw.Trim() -replace "\s",""
    if ($p.StartsWith("+84")) {
        $p = "0" + $p.Substring(3)
    }
    return $p
}

# ============================================================
# Helper: map categories → food_categories array
# ============================================================
function Convert-Categories($cats) {
    if (-not $cats) { return @("com") }
    $result = @()
    foreach ($c in $cats) {
        $c = "$c".Trim()
        if ($c -match "cà phê|cafe|coffee" -and $c -notmatch "trà sữa") {
            $result += "cafe"
        } elseif ($c -match "trà sữa|milk tea") {
            $result += "tra_sua"
        } elseif ($c -match "nhậu|bia|beer") {
            $result += "do_uong"
        } elseif ($c -match "bánh mì") {
            $result += "an_vat"
        } elseif ($c -match "bún|phở|mì|mỳ|noodle") {
            $result += "bun_pho_mi"
        } elseif ($c -match "lẩu|hotpot|bbq|nướng") {
            $result += "lau_nuong"
        } elseif ($c -match "nhà hàng|quán ăn|cơm|restaurant|food") {
            $result += "com"
        } else {
            $result += "com"
        }
    }
    $result = $result | Select-Object -Unique
    if ($result.Count -eq 0) { return @("com") }
    return $result
}

# ============================================================
# Helper: find image folder by title (fuzzy match)
# ============================================================
function Find-ImageFolder($title) {
    # Direct match first
    $path = Join-Path $IMAGES_ROOT $title
    if (Test-Path $path) { return $path }
    # Fallback: list all dirs and compare
    $dirs = Get-ChildItem $IMAGES_ROOT -Directory
    foreach ($d in $dirs) {
        # Compare after normalization
        if ($d.Name -eq $title) { return $d.FullName }
    }
    return $null
}

# ============================================================
# Helper: Upload a single file to Supabase Storage
# ============================================================
function Upload-Image($localPath, $storagePath) {
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
    $mime = switch ($ext) {
        ".jpg"  { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".png"  { "image/png" }
        ".webp" { "image/webp" }
        default { "image/jpeg" }
    }
    $uploadUrl = "$SUPABASE_URL/storage/v1/object/vendor-images/$storagePath"
    try {
        $resp = Invoke-RestMethod -Uri $uploadUrl -Method PUT -Headers @{
            "apikey"         = $SERVICE_KEY
            "Authorization"  = "Bearer $SERVICE_KEY"
            "Content-Type"   = $mime
        } -Body $bytes -ErrorAction Stop
        return $true
    } catch {
        Write-Host "    [ERROR] Upload failed for $storagePath`: $_" -ForegroundColor Red
        return $false
    }
}

# ============================================================
# Helper: Build vendor body from format-1 (Google Maps full)
# ============================================================
function Build-VendorBody-Format1($v) {
    $phone = Convert-Phone $v.phoneUnformatted
    $oh    = Convert-OpeningHours $v.openingHours
    $cats  = Convert-Categories $v.categories

    $body = @{
        name           = $v.title
        vendor_type    = "fixed_shop"
        status         = "active"
        source         = "google_maps"
        address        = $v.address
        area           = "Hòa Lạc"
        phone          = $phone
        zalo           = $phone
        latitude       = $v.location.lat
        longitude      = $v.location.lng
        opening_hours  = $oh
        food_categories = $cats
        has_delivery   = $false
        description    = $null
    }
    return $body
}

# ============================================================
# Helper: Build vendor body from format-2 (compact)
# ============================================================
function Build-VendorBody-Format2($v) {
    $phone = Convert-Phone $v.phone
    $cats  = if ($v.category) { @($v.category) } else { @() }
    $cats  = Convert-Categories $cats

    # opening_hours not available in format-2
    $lat = if ($v.latitude)  { [double]$v.latitude }  else { $null }
    $lng = if ($v.longitude) { [double]$v.longitude } else { $null }

    $body = @{
        name            = $v.name
        vendor_type     = "fixed_shop"
        status          = "active"
        source          = "google_maps"
        address         = $v.address
        area            = "Hòa Lạc"
        phone           = $phone
        zalo            = $phone
        latitude        = $lat
        longitude       = $lng
        opening_hours   = $null
        food_categories = $cats
        has_delivery    = $false
        description     = $null
    }
    return $body
}

# ============================================================
# Main: Insert a vendor and return its ID
# ============================================================
function Insert-Vendor($body) {
    # Remove null values to avoid sending them (let DB use defaults)
    $cleanBody = @{}
    foreach ($k in $body.Keys) {
        if ($null -ne $body[$k]) {
            $cleanBody[$k] = $body[$k]
        }
    }
    $json = $cleanBody | ConvertTo-Json -Depth 10 -Compress
    $url  = "$SUPABASE_URL/rest/v1/vendors"
    try {
        $resp = Invoke-RestMethod -Uri $url -Method POST `
            -Headers $AUTH_HEADERS `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
            -ContentType "application/json" `
            -ErrorAction Stop
        if ($resp -and $resp.Count -gt 0) {
            return $resp[0].id
        } elseif ($resp -and $resp.id) {
            return $resp.id
        }
        return $null
    } catch {
        return $null
    }
}

# ============================================================
# Helper: PATCH vendor cover_image_url
# ============================================================
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
        Write-Host "    [WARN] Could not patch cover_image_url: $_" -ForegroundColor Yellow
    }
}

# ============================================================
# Helper: Insert vendor_media row
# ============================================================
function Insert-VendorMedia($vendorId, $imageUrl, $storagePath, $mediaType, $isPrimary, $sortOrder) {
    $url = "$SUPABASE_URL/rest/v1/vendor_media"
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
        Write-Host "    [WARN] Could not insert vendor_media: $_" -ForegroundColor Yellow
    }
}

# ============================================================
# MAIN LOOP
# ============================================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " HolaMate — Vendor Import Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Load JSON with UTF-8
$rawJson = [System.IO.File]::ReadAllText($JSON_FILE, [System.Text.Encoding]::UTF8)
$vendors = $rawJson | ConvertFrom-Json

Write-Host "Total records in JSON: $($vendors.Count)"
Write-Host ""

$vendorResults = @()  # store {title, id}

for ($i = 0; $i -lt $vendors.Count; $i++) {
    $v = $vendors[$i]

    # Detect format
    $isFormat1 = $null -ne $v.title -and $v.title -ne ""
    $isFormat2 = -not $isFormat1 -and $null -ne $v.name -and $v.name -ne ""

    $displayName = if ($isFormat1) { $v.title } elseif ($isFormat2) { $v.name } else { "(unknown #$i)" }

    if (-not $isFormat1 -and -not $isFormat2) {
        Write-Host "[$i] SKIP — no name/title" -ForegroundColor Gray
        continue
    }

    Write-Host "[$i] Processing: $displayName" -ForegroundColor White

    # Build body
    $body = if ($isFormat1) { Build-VendorBody-Format1 $v } else { Build-VendorBody-Format2 $v }

    # Insert vendor
    $vendorId = Insert-Vendor $body
    if (-not $vendorId) {
        # Retry with anon key (in case service key isn't available)
        Write-Host "    First insert attempt failed, retrying..." -ForegroundColor Yellow

        # Try direct insert via different method
        $cleanBody = @{}
        foreach ($k in $body.Keys) {
            if ($null -ne $body[$k]) { $cleanBody[$k] = $body[$k] }
        }
        $json = $cleanBody | ConvertTo-Json -Depth 10 -Compress
        $url  = "$SUPABASE_URL/rest/v1/vendors"
        try {
            $resp = Invoke-WebRequest -Uri $url -Method POST `
                -Headers @{
                    "apikey"        = $SERVICE_KEY
                    "Authorization" = "Bearer $SERVICE_KEY"
                    "Content-Type"  = "application/json"
                    "Prefer"        = "return=representation"
                } `
                -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
                -UseBasicParsing -ErrorAction Stop
            $parsed = $resp.Content | ConvertFrom-Json
            if ($parsed -and $parsed.Count -gt 0) { $vendorId = $parsed[0].id }
            elseif ($parsed -and $parsed.id) { $vendorId = $parsed.id }
        } catch {
            $errMsg = $_.ToString()
            Write-Host "    [ERROR] Insert failed for '$displayName': $errMsg" -ForegroundColor Red
            $errors += "INSERT FAIL [$i] $displayName`: $errMsg"
            $vendorFail++
            continue
        }
    }

    if (-not $vendorId) {
        Write-Host "    [ERROR] No vendor ID returned for '$displayName'" -ForegroundColor Red
        $errors += "INSERT FAIL [$i] $displayName`: No ID returned"
        $vendorFail++
        continue
    }

    Write-Host "    Inserted vendor ID: $vendorId" -ForegroundColor Green
    $vendorOk++
    $vendorResults += [PSCustomObject]@{ Title = $displayName; VendorId = $vendorId; Format = if ($isFormat1) { 1 } else { 2 } }

    # ---- Handle images ----
    $imageList = @()
    if ($isFormat1 -and $v.images -and $v.images.Count -gt 0) {
        # Format 1: images array has relative paths like "images/VendorName/image_1.jpg"
        foreach ($imgRelPath in $v.images) {
            # Convert relative path to absolute
            $absPath = Join-Path "D:\CN8\Holamate_new\Data_GGMaps" $imgRelPath
            if (Test-Path $absPath) {
                $imageList += $absPath
            }
        }
    } elseif ($isFormat2 -and $v.images -and $v.images.Count -gt 0) {
        foreach ($imgRelPath in $v.images) {
            $absPath = Join-Path "D:\CN8\Holamate_new\Data_GGMaps" $imgRelPath
            if (Test-Path $absPath) {
                $imageList += $absPath
            }
        }
    }

    # Also check folder directly
    $folderPath = Find-ImageFolder $displayName
    if ($folderPath) {
        $folderImages = Get-ChildItem $folderPath -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' } | Sort-Object Name
        foreach ($fi in $folderImages) {
            if ($imageList -notcontains $fi.FullName) {
                $imageList += $fi.FullName
            }
        }
    } else {
        Write-Host "    [WARN] No image folder found for '$displayName'" -ForegroundColor Yellow
        $noFolder += $displayName
    }

    if ($imageList.Count -eq 0) {
        Write-Host "    No images to upload." -ForegroundColor Gray
        continue
    }

    Write-Host "    Uploading $($imageList.Count) image(s)..." -ForegroundColor Cyan

    $imgIndex = 1
    foreach ($imgPath in $imageList) {
        $ext = [System.IO.Path]::GetExtension($imgPath).ToLower()
        if ($ext -eq "") { $ext = ".jpg" }

        if ($imgIndex -eq 1) {
            $storagePath = "vendors/$vendorId/cover$ext"
        } else {
            $storagePath = "vendors/$vendorId/gallery_$imgIndex$ext"
        }

        Write-Host "    [$imgIndex] Uploading $([System.IO.Path]::GetFileName($imgPath)) → $storagePath" -NoNewline

        $ok = Upload-Image $imgPath $storagePath
        if ($ok) {
            $publicUrl = "$SUPABASE_URL/storage/v1/object/public/vendor-images/$storagePath"
            Write-Host " OK" -ForegroundColor Green
            $imageOk++

            if ($imgIndex -eq 1) {
                # Set cover
                Patch-VendorCover $vendorId $publicUrl
                Insert-VendorMedia $vendorId $publicUrl $storagePath "cover" $true 0
            } else {
                Insert-VendorMedia $vendorId $publicUrl $storagePath "food" $false $imgIndex
            }
        } else {
            Write-Host " FAIL" -ForegroundColor Red
            $imageFail++
        }

        $imgIndex++
    }

    Write-Host ""
}

# ============================================================
# REPORT
# ============================================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " IMPORT COMPLETE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Vendors inserted OK : $vendorOk"
Write-Host "Vendors FAILED      : $vendorFail"
Write-Host "Images uploaded OK  : $imageOk"
Write-Host "Images FAILED       : $imageFail"

if ($noFolder.Count -gt 0) {
    Write-Host ""
    Write-Host "Vendors with no image folder ($($noFolder.Count)):" -ForegroundColor Yellow
    $noFolder | ForEach-Object { Write-Host "  - $_" }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Errors ($($errors.Count)):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $_" }
}

Write-Host ""
Write-Host "Inserted vendors:" -ForegroundColor Cyan
$vendorResults | ForEach-Object { Write-Host "  [$($_.Format)] $($_.Title) → $($_.VendorId)" }
