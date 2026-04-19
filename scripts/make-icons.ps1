Add-Type -AssemblyName System.Drawing

function New-Icon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background: warm beige #f5f1e8
    $bg = [System.Drawing.Color]::FromArgb(255, 245, 241, 232)
    $g.Clear($bg)

    # Letter "A" — italic serif, dark brown #2b2820
    $brushColor = [System.Drawing.Color]::FromArgb(255, 43, 40, 32)
    $brush = New-Object System.Drawing.SolidBrush($brushColor)

    $fontSize = [int]($size * 0.62)
    # Try a serif font — Georgia ships with Windows; fallback to generic Serif
    $fontFamily = $null
    foreach ($name in @("Georgia", "Cambria", "Times New Roman")) {
        try {
            $candidate = New-Object System.Drawing.FontFamily($name)
            $fontFamily = $candidate
            break
        } catch {}
    }
    if ($null -eq $fontFamily) {
        $fontFamily = [System.Drawing.FontFamily]::GenericSerif
    }
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Italic, [System.Drawing.GraphicsUnit]::Pixel)

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    # Slight optical bump down (serif italics sit a bit high in the box)
    $rect = New-Object System.Drawing.RectangleF(0, [single]($size * 0.02), $size, $size)
    $g.DrawString("A", $font, $brush, $rect, $sf)

    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Wrote $outPath"
}

$publicDir = Join-Path $PSScriptRoot "..\public"
New-Icon -size 512 -outPath (Join-Path $publicDir "icon-512.png")
New-Icon -size 192 -outPath (Join-Path $publicDir "icon-192.png")
