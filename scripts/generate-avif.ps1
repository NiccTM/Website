<#
.SYNOPSIS
  Writes an .avif sibling for every derivative in public/**/thumbs and
  public/**/display.

.DESCRIPTION
  generate-thumbnails.ps1 produces the two JPEG/PNG tiers this site actually
  serves. This script adds an AVIF copy beside each one:

      public/thumbs/ASUS_laptop.jpg  ->  public/thumbs/ASUS_laptop.avif

  Nothing is replaced. The JPEG/PNG stays exactly where it was and remains the
  <img src>, so a browser without AVIF support is unaffected; the AVIF is
  offered through a <source type="image/avif"> in components/ui/Picture.jsx and
  is used only by browsers that advertise it.

  WHY AVIF AND NOT WEBP
  Measured on public/thumbs/Zotac_RTX3090_v2.jpg, a 196 KB grid tile:

      AVIF crf 28   100 KB   51% of the JPEG   SSIM 0.971
      AVIF crf 32    82 KB   42%               SSIM 0.960
      AVIF crf 36    65 KB   33%               SSIM 0.947
      WebP q80      154 KB   79%

  WebP saves too little here to be worth a second file. crf 32 is the default
  for thumbs: grid tiles render at a few hundred CSS pixels, so SSIM 0.96 is
  not visible at display size.

  ONLY THE THUMBS TIER BY DEFAULT
  The display tier is opt-in behind -IncludeDisplay, because the trade is bad.
  Measured across all 153 images in each tier:

      thumbs    4.8 MB of .avif   saves ~58% on bytes that load on EVERY page
      display  80.6 MB of .avif   saves ~36%, and only inside the lightbox

  A 4000px source is already carrying real optical detail rather than JPEG
  overhead, so it compresses far less well. Paying 80 MB of deploy and git
  history -- in a repository that is already too large -- to make one
  full-screen photo smaller is not worth it. Grid tiles are the bytes that
  decide page weight.

  Re-run after adding images:  powershell -File scripts/generate-avif.ps1
  Up-to-date .avif files are skipped; -Force re-encodes everything.

.NOTES
  Needs ffmpeg on PATH (or -FfmpegPath). Uses libaom-av1 with -still-picture,
  which is the AVIF still-image profile rather than a one-frame video.

  cpu-used 6 is the speed/size knob. Lower is smaller and much slower; at 6 a
  4000px display-tier image takes about 1.4 s, which keeps a full rebuild of
  every tier in the low minutes rather than the high tens.
#>
param(
    [int]$ThumbCrf   = 32,
    [int]$DisplayCrf = 28,
    [int]$CpuUsed    = 6,
    [string]$FfmpegPath = 'ffmpeg',
    [switch]$IncludeDisplay,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$ffmpeg = (Get-Command $FfmpegPath -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg) { throw "ffmpeg not found. Pass -FfmpegPath 'C:\path\to\ffmpeg.exe'." }

$root = Split-Path $PSScriptRoot -Parent
$pub  = Join-Path $root 'public'
if (-not (Test-Path $pub)) { throw "public/ not found at $pub" }

# Every thumbs/ folder anywhere under public/, so the project-shots galleries
# and any set added later are picked up without editing this list.
$wanted = if ($IncludeDisplay) { @('thumbs', 'display') } else { @('thumbs') }
$dirs = Get-ChildItem $pub -Directory -Recurse |
        Where-Object { $_.Name -in $wanted }

$made = 0; $skipped = 0; $failed = 0; $srcBytes = 0; $outBytes = 0

foreach ($dir in $dirs) {
    $crf = if ($dir.Name -eq 'display') { $DisplayCrf } else { $ThumbCrf }

    Get-ChildItem (Join-Path $dir.FullName '*') -File -Include *.jpg, *.jpeg, *.png | ForEach-Object {
        $src = $_
        $out = Join-Path $src.DirectoryName ($src.BaseName + '.avif')

        # Skip when the .avif is already newer than its source, so re-running
        # after adding a handful of photos costs seconds rather than minutes.
        if (-not $Force -and (Test-Path $out) -and
            (Get-Item $out).LastWriteTimeUtc -ge $src.LastWriteTimeUtc) {
            $skipped++
            $srcBytes += $src.Length
            $outBytes += (Get-Item $out).Length
            return
        }

        # -pix_fmt yuv420p: 4:2:0 is what every AVIF decoder handles and it is
        # what makes the format worth using at all. 2>&1 is captured rather than
        # shown because libaom writes progress to stderr on every frame.
        & $ffmpeg -y -hide_banner -loglevel error `
            -i $src.FullName `
            -c:v libaom-av1 -still-picture 1 -crf $crf -cpu-used $CpuUsed `
            -pix_fmt yuv420p $out 2>&1 | Out-Null

        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $out)) {
            Write-Warning "failed: $($src.FullName)"
            $failed++
            return
        }

        $made++
        $srcBytes += $src.Length
        $outBytes += (Get-Item $out).Length
        Write-Host ("  {0,6:N0} KB -> {1,6:N0} KB  {2}" -f `
            ($src.Length / 1KB), ((Get-Item $out).Length / 1KB), $src.Name)
    }
}

$pct = if ($srcBytes -gt 0) { [math]::Round(100 * $outBytes / $srcBytes) } else { 0 }
Write-Host ""
Write-Host ("encoded {0}, skipped {1}, failed {2}" -f $made, $skipped, $failed)
Write-Host ("source {0:N1} MB -> avif {1:N1} MB  ({2}% of original)" -f `
    ($srcBytes / 1MB), ($outBytes / 1MB), $pct)
