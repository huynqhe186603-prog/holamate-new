# ============================================================
# HolaMate — Import 10 Facebook posts as online_sellers
# ============================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SUPABASE_URL = "https://prxagoffeoaggumqojdd.supabase.co"
$API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTg2MzksImV4cCI6MjA5NTczNDYzOX0.M-H7fnB0-9tegF-nP1j_-Mral-hOOBRJWFPomf1XuK4"
$STORAGE_BUCKET = "vendor-images"

# Get the actual images directory path (handles Unicode folder name)
$dataDir = "D:\CN8\Holamate_new\Data_phi_vat_li"
$imgBaseDir = (Get-ChildItem $dataDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1).FullName
Write-Host "Images base directory: $imgBaseDir"

# ============================================================
# Helper: Common REST headers
# ============================================================
function Get-Headers {
    return @{
        "apikey"        = $API_KEY
        "Authorization" = "Bearer $API_KEY"
        "Content-Type"  = "application/json"
        "Prefer"        = "return=representation"
    }
}

# ============================================================
# Helper: Parse price string → integer VND
# Returns $null if cannot parse
# Handles: "55k/1kg", "30-40k", "10-15-20k", "89K – 200K/ngày", "25k", "#149k"
# ============================================================
function Parse-Price {
    param([string]$priceStr)
    if ([string]::IsNullOrWhiteSpace($priceStr)) { return $null }

    # Remove # prefix, normalize dashes/spaces, strip after /
    $s = $priceStr.Trim()
    $s = $s -replace '#', ''
    # Take only part before "/" (e.g. "55k/1kg" -> "55k")
    $s = ($s -split '/')[0].Trim()
    # Replace em-dash/en-dash with regular dash
    $s = $s -replace '[–—]', '-'
    # Remove non-numeric/non-dash/non-k characters from start
    $s = $s.Trim()

    # Find all numbers before K/k
    $matches = [regex]::Matches($s, '(\d+(?:[.,]\d+)?)\s*[Kk]')
    if ($matches.Count -eq 0) { return $null }

    $nums = @()
    foreach ($m in $matches) {
        $num = $m.Groups[1].Value -replace ',', '' -replace '\.', ''
        $nums += [int]$num
    }
    return $nums
}

# ============================================================
# Helper: Get price range min/max from menu array
# ============================================================
function Get-PriceRange {
    param($menuItems)
    $allPrices = @()
    foreach ($item in $menuItems) {
        $parsed = Parse-Price -priceStr $item.price
        if ($parsed -ne $null) {
            foreach ($p in $parsed) {
                $allPrices += ($p * 1000)
            }
        }
    }
    if ($allPrices.Count -eq 0) { return @($null, $null) }
    return @(($allPrices | Measure-Object -Minimum).Minimum, ($allPrices | Measure-Object -Maximum).Maximum)
}

# ============================================================
# Helper: Determine food_categories from text
# ============================================================
function Get-FoodCategories {
    param([string]$text, [string]$userName)
    $combined = ($text + " " + $userName).ToLower()

    $hasDrink = ($combined -match 'hoa quả|trái cây|nước ép|sinh tố|nước mía|trà sữa|trà |nước cam|nước ép|bubble tea')
    $hasCom   = ($combined -match '\bcơm\b|\bcháo\b')
    $hasXoi   = ($combined -match '\bxôi\b')
    $hasBanh  = ($combined -match 'bánh mì|bánh bò|bánh|ăn vặt|kimbap|bún|mì trộn|indomie')
    $hasXe    = ($combined -match 'thuê xe|\bxe\b')

    $cats = @()

    # Pure drink/fruit post
    if ($hasDrink -and -not $hasCom -and -not $hasBanh) {
        $cats += "do_uong"
        return $cats
    }
    if ($hasCom) { $cats += "com" }
    if ($hasBanh) { $cats += "an_vat" }
    if ($hasXoi -and $cats.Count -eq 0) { $cats += "an_vat" }
    if ($cats.Count -eq 0) { $cats += "an_vat" }
    return $cats
}

# ============================================================
# Helper: Normalize phone number
# ============================================================
function Normalize-Phone {
    param($phone)
    if ($phone -eq $null -or $phone -eq "") { return $null }
    $cleaned = ($phone -replace '[\s\-\.]', '').Trim()
    if ($cleaned -eq "") { return $null }
    return $cleaned
}

# ============================================================
# Helper: Clean menu item name (remove leading emoji/symbols)
# ============================================================
function Clean-MenuName {
    param([string]$name)
    # Remove emoji and special chars at start, keep Vietnamese text
    $cleaned = $name.Trim()
    # Remove common leading emoji/symbols using regex
    $cleaned = $cleaned -replace '^[☀-➿ἰ0-ᾯF✂-➰️‍✅🔥💸⏰💥🌙🧋🍹🥤🌮🥗🍜🦪🌾🥤🍮🌭🍚🍗🥦🍛💰🎨🪖🌦️⚡📄⏱📍📌🚗]+', ''
    # Remove ‼️ and other markers
    $cleaned = $cleaned -replace '^[‼️\*\•\-\+]+', ''
    # Remove emoji-like patterns (Unicode ranges)
    $cleaned = [regex]::Replace($cleaned, '[\p{So}\p{Sm}]', '')
    $cleaned = $cleaned.Trim()
    # Also remove leading special punctuation
    $cleaned = $cleaned -replace '^[^\w\p{L}]+', ''
    $cleaned = $cleaned.Trim()
    return $cleaned
}

# ============================================================
# Helper: Parse single menu item price → one integer (min price)
# ============================================================
function Parse-MenuItemPrice {
    param([string]$priceStr)
    $nums = Parse-Price -priceStr $priceStr
    if ($nums -eq $null -or $nums.Count -eq 0) { return $null }
    return ($nums | Measure-Object -Minimum).Minimum * 1000
}

# ============================================================
# Helper: POST to Supabase REST API
# ============================================================
function Invoke-SupabasePost {
    param([string]$table, [hashtable]$body)
    $uri = "$SUPABASE_URL/rest/v1/$table"
    $json = $body | ConvertTo-Json -Depth 10 -Compress
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method POST -Headers (Get-Headers) -Body $json -Encoding UTF8
        return $resp
    } catch {
        Write-Host "  ERROR POST $table : $_"
        return $null
    }
}

# ============================================================
# Helper: PATCH to Supabase REST API
# ============================================================
function Invoke-SupabasePatch {
    param([string]$table, [string]$id, [hashtable]$body)
    $uri = "$SUPABASE_URL/rest/v1/$table?id=eq.$id"
    $json = $body | ConvertTo-Json -Depth 10 -Compress
    $headers = Get-Headers
    $headers["Prefer"] = "return=minimal"
    try {
        Invoke-RestMethod -Uri $uri -Method PATCH -Headers $headers -Body $json -Encoding UTF8 | Out-Null
        return $true
    } catch {
        Write-Host "  ERROR PATCH $table : $_"
        return $false
    }
}

# ============================================================
# Helper: Upload file to Supabase Storage
# ============================================================
function Upload-StorageFile {
    param([string]$localPath, [string]$storagePath)
    if (-not (Test-Path $localPath)) {
        Write-Host "  WARNING: File not found: $localPath"
        return $null
    }
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $uri = "$SUPABASE_URL/storage/v1/object/$STORAGE_BUCKET/$storagePath"
    $headers = @{
        "apikey"        = $API_KEY
        "Authorization" = "Bearer $API_KEY"
        "Content-Type"  = "image/jpeg"
    }
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -Body $bytes
        $publicUrl = "$SUPABASE_URL/storage/v1/object/public/$STORAGE_BUCKET/$storagePath"
        return $publicUrl
    } catch {
        Write-Host "  ERROR upload $storagePath : $_"
        return $null
    }
}

# ============================================================
# Read JSON
# ============================================================
Write-Host "Reading JSON..."
$jsonContent = [System.IO.File]::ReadAllText("$dataDir\selected_10_posts.json", [System.Text.Encoding]::UTF8)
$posts = $jsonContent | ConvertFrom-Json
Write-Host "Loaded $($posts.Count) posts"

# ============================================================
# Build lookup: available image folders on disk
# ============================================================
$imgFolders = @{}
Get-ChildItem $imgBaseDir | Where-Object { $_.PSIsContainer } | ForEach-Object {
    $imgFolders[$_.Name] = $_.FullName
}
Write-Host "Found $($imgFolders.Count) image folders on disk"

# ============================================================
# STATS
# ============================================================
$statsVendors  = 0
$statsMenuItems= 0
$statsImages   = 0
$errorsLog     = @()
$missingImages = @()

# ============================================================
# MAIN LOOP
# ============================================================
foreach ($post in $posts) {
    Write-Host ""
    Write-Host "========================================================"
    Write-Host "Processing: $($post.user.name) — $($post.id.Substring(0, [Math]::Min(40, $post.id.Length)))..."

    # --- Extract folder ID from images array ---
    $folderId = $null
    if ($post.images -and $post.images.Count -gt 0) {
        $imgPath = $post.images[0]
        # images_đã_lọc/{folderId}/{n}.jpg
        $parts = $imgPath -split '/'
        if ($parts.Count -ge 2) {
            $folderId = $parts[1]
        }
    }

    # --- Normalize phone ---
    $phone = Normalize-Phone -phone $post.phone_number
    $zalo  = $phone

    # --- Description: first 200 chars of text ---
    $desc = $null
    if ($post.text -and $post.text.Length -gt 0) {
        $desc = $post.text.Substring(0, [Math]::Min(200, $post.text.Length))
    }

    # --- Food categories ---
    $foodCats = Get-FoodCategories -text $post.text -userName $post.user.name

    # --- Price range ---
    $priceRange = Get-PriceRange -menuItems $post.menu
    $priceMin = $priceRange[0]
    $priceMax = $priceRange[1]

    # --- Build vendor payload ---
    $vendorPayload = @{
        name            = "$($post.user.name) (Online)"
        vendor_type     = "online_seller"
        status          = "active"
        source          = "manual"
        area            = "Hòa Lạc"
        has_delivery    = $true
        food_categories = $foodCats
        description     = $desc
    }
    if ($phone)    { $vendorPayload["phone"]           = $phone }
    if ($zalo)     { $vendorPayload["zalo"]            = $zalo }
    if ($priceMin) { $vendorPayload["price_range_min"] = $priceMin }
    if ($priceMax) { $vendorPayload["price_range_max"] = $priceMax }

    # --- INSERT vendor ---
    Write-Host "  Inserting vendor: $($vendorPayload['name'])"
    $vendorResp = Invoke-SupabasePost -table "vendors" -body $vendorPayload
    if ($vendorResp -eq $null) {
        $errorsLog += "VENDOR INSERT FAILED: $($post.user.name)"
        continue
    }
    $vendorId = $vendorResp[0].id
    if (-not $vendorId) { $vendorId = $vendorResp.id }
    Write-Host "  Vendor ID: $vendorId"
    $statsVendors++

    # --- INSERT menu_items ---
    $sortIdx = 0
    foreach ($menuItem in $post.menu) {
        $cleanName = Clean-MenuName -name $menuItem.name
        # Skip items with name too short
        if ($cleanName.Length -lt 3) {
            Write-Host "  Skipping menu item (too short): '$($menuItem.name)'"
            continue
        }

        $itemPrice = Parse-MenuItemPrice -priceStr $menuItem.price
        if ($itemPrice -eq $null) {
            # Try to get at least some price: default to 0 is not useful, skip if no price
            Write-Host "  Skipping menu item (no valid price): '$cleanName' / '$($menuItem.price)'"
            continue
        }

        # Determine item_type
        $itemType = "food"
        $lowerName = $cleanName.ToLower()
        if ($lowerName -match 'nước|trà|sữa|ép|sinh tố|café|cafe|cà phê|coca|sting|twister|bò húc|nước đậu|rau má|chè') {
            $itemType = "drink"
        }

        $menuPayload = @{
            vendor_id  = $vendorId
            name       = $cleanName
            price      = $itemPrice
            item_type  = $itemType
            is_available = $true
            sort_order = $sortIdx
        }
        $menuResp = Invoke-SupabasePost -table "menu_items" -body $menuPayload
        if ($menuResp -ne $null) {
            $statsMenuItems++
            $sortIdx++
        } else {
            $errorsLog += "MENU ITEM INSERT FAILED: $cleanName (vendor: $($post.user.name))"
        }
    }
    Write-Host "  Menu items inserted: $sortIdx"

    # --- Upload images ---
    if ($folderId -eq $null) {
        Write-Host "  No images path found in JSON"
        $missingImages += $post.user.name
        continue
    }

    # Find matching folder on disk (exact match or URL-decode)
    $localFolderPath = $null
    if ($imgFolders.ContainsKey($folderId)) {
        $localFolderPath = $imgFolders[$folderId]
    } else {
        Write-Host "  WARNING: Image folder not found on disk for: $folderId"
        $missingImages += $post.user.name
        continue
    }

    $imgFiles = Get-ChildItem $localFolderPath -Filter "*.jpg" | Sort-Object Name
    if ($imgFiles.Count -eq 0) {
        Write-Host "  WARNING: No .jpg files in folder: $localFolderPath"
        $missingImages += $post.user.name
        continue
    }

    Write-Host "  Uploading $($imgFiles.Count) images..."
    $firstImage = $true
    $imgCounter = 2

    foreach ($imgFile in $imgFiles) {
        $localPath = $imgFile.FullName
        if ($firstImage) {
            $storagePath = "vendors/$vendorId/cover.jpg"
        } else {
            $storagePath = "vendors/$vendorId/gallery_$imgCounter.jpg"
            $imgCounter++
        }

        $publicUrl = Upload-StorageFile -localPath $localPath -storagePath $storagePath
        if ($publicUrl -ne $null) {
            $statsImages++
            if ($firstImage) {
                # PATCH vendor cover_image_url
                Invoke-SupabasePatch -table "vendors" -id $vendorId -body @{ cover_image_url = $publicUrl } | Out-Null
                Write-Host "  Cover uploaded: $publicUrl"

                # INSERT vendor_media (cover)
                $mediaPayload = @{
                    vendor_id    = $vendorId
                    image_url    = $publicUrl
                    storage_path = $storagePath
                    media_type   = "cover"
                    status       = "visible"
                    is_primary   = $true
                    sort_order   = 0
                }
                Invoke-SupabasePost -table "vendor_media" -body $mediaPayload | Out-Null
                $firstImage = $false
            } else {
                # INSERT vendor_media (gallery)
                $sortOrd = $imgCounter - 2
                $mediaPayload = @{
                    vendor_id    = $vendorId
                    image_url    = $publicUrl
                    storage_path = $storagePath
                    media_type   = "food"
                    status       = "visible"
                    is_primary   = $false
                    sort_order   = $sortOrd
                }
                Invoke-SupabasePost -table "vendor_media" -body $mediaPayload | Out-Null
                Write-Host "  Gallery uploaded: $storagePath"
            }
        }
    }
}

# ============================================================
# REPORT
# ============================================================
Write-Host ""
Write-Host "========================================================"
Write-Host "IMPORT COMPLETE"
Write-Host "========================================================"
Write-Host "Vendors inserted   : $statsVendors"
Write-Host "Menu items inserted: $statsMenuItems"
Write-Host "Images uploaded    : $statsImages"

if ($errorsLog.Count -gt 0) {
    Write-Host ""
    Write-Host "ERRORS ($($errorsLog.Count)):"
    foreach ($e in $errorsLog) { Write-Host "  - $e" }
} else {
    Write-Host "No errors."
}

if ($missingImages.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing/skipped images for:"
    foreach ($m in $missingImages) { Write-Host "  - $m" }
} else {
    Write-Host "All vendors had images."
}
