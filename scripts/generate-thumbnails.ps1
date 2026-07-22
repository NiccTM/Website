<#
.SYNOPSIS
  Generates display thumbnails for every large image in public/.

.DESCRIPTION
  public/ holds full-resolution originals -- photography up to 16320x12240 /
  33 MB, hardware teardowns up to 21 MB -- but they are rendered into grid
  tiles only a few hundred pixels wide. This script writes width-capped
  derivatives next to each source in a thumbs/ subfolder:

      public/Remastered Photos/X.jpg  ->  public/Remastered Photos/thumbs/X.jpg
      public/ASUS_laptop.jpg          ->  public/thumbs/ASUS_laptop.jpg

  which is exactly the transform thumbSrc() in src/utils/thumbs.js applies:
  insert "thumbs/" before the filename.

  It also writes src/data/photoDimensions.json mapping each original's public
  URL to its intrinsic size, so tiles can reserve an aspect-ratio box and avoid
  layout shift.

  Originals are untouched and remain what the lightbox loads at full size.

  Re-run after adding images:  powershell -File scripts/generate-thumbnails.ps1
  Up-to-date thumbnails are skipped; -Force rebuilds everything.

.NOTES
  Uses System.Drawing, so no npm dependency is required. Format is preserved
  (JPEG stays JPEG, PNG stays PNG) -- re-encoding UI screenshots as JPEG would
  add ringing around text. Some sources emit "Corrupt JPEG data: N extraneous
  bytes" on decode; that is a benign warning from slightly non-conformant
  encoders and the images decode fine.
#>
param(
    [int]$MaxWidth = 800,
    [int]$Quality  = 82,
    [switch]$Force
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root    = Split-Path $PSScriptRoot -Parent
$pub     = Join-Path $root 'public'
$maniOut = Join-Path $root 'src\data\photoDimensions.json'

if (-not (Test-Path $pub)) { throw "public/ not found at $pub" }

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)

# Source sets: the photography folder, and the flat images at the public root.
$sets = @(
    @{ Dir = Join-Path $pub 'Remastered Photos'; UrlPrefix = '/Remastered Photos/' },
    @{ Dir = $pub;                               UrlPrefix = '/'                   }
)

$manifest = [ordered]@{}
$made = 0; $skipped = 0; $srcBytes = 0; $outBytes = 0

foreach ($set in $sets) {
    if (-not (Test-Path $set.Dir)) { continue }
    $outDir = Join-Path $set.Dir 'thumbs'
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

    # Non-recursive: each set owns only the files directly inside it, so the
    # root set never re-processes "Remastered Photos" or any thumbs/ output.
    Get-ChildItem (Join-Path $set.Dir '*') -File |
        Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } |
        Sort-Object Name | ForEach-Object {

        $src = $_
        $dst = Join-Path $outDir $src.Name
        $srcBytes += $src.Length

        $img = [System.Drawing.Image]::FromFile($src.FullName)
        try {
            $manifest["$($set.UrlPrefix)$($src.Name)"] = @{ w = $img.Width; h = $img.Height }

            $upToDate = (Test-Path $dst) -and ((Get-Item $dst).LastWriteTime -ge $src.LastWriteTime)
            if ($upToDate -and -not $Force) {
                $skipped++; $outBytes += (Get-Item $dst).Length
                return
            }

            # Never upscale: a source narrower than the cap keeps its own width.
            $w = [Math]::Min($MaxWidth, $img.Width)
            $h = [int][Math]::Round($img.Height * ($w / $img.Width))

            $bmp = New-Object System.Drawing.Bitmap($w, $h)
            $g   = [System.Drawing.Graphics]::FromImage($bmp)
            $g.CompositingQuality = 'HighQuality'
            $g.InterpolationMode  = 'HighQualityBicubic'
            $g.SmoothingMode      = 'HighQuality'
            $g.PixelOffsetMode    = 'HighQuality'
            $g.DrawImage($img, 0, 0, $w, $h)

            if ($src.Extension -match '^\.png$') { $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png) }
            else                                 { $bmp.Save($dst, $jpegCodec, $encParams) }

            $g.Dispose(); $bmp.Dispose()

            $made++; $outBytes += (Get-Item $dst).Length
            "  {0,-46} {1,5}x{2,-5} -> {3}x{4}  {5,7:N2} MB -> {6,6:N0} KB" -f `
                $src.Name, $img.Width, $img.Height, $w, $h, ($src.Length/1MB), ((Get-Item $dst).Length/1KB)
        }
        finally { $img.Dispose() }
    }
}

# WriteAllText with UTF8Encoding($false), not Set-Content -Encoding utf8:
# PowerShell 5.1 emits a BOM, and a leading U+FEFF makes JSON.parse throw.
[System.IO.File]::WriteAllText(
    $maniOut,
    ($manifest | ConvertTo-Json -Depth 3),
    (New-Object System.Text.UTF8Encoding($false)))

""
"generated: $made   skipped(up-to-date): $skipped   indexed: $($manifest.Count)"
"originals total : {0,8:N1} MB" -f ($srcBytes/1MB)
"thumbnails total: {0,8:N1} MB" -f ($outBytes/1MB)
"reduction       : {0,8:N1}x" -f ($srcBytes/[Math]::Max($outBytes,1))
"manifest        : $maniOut"
