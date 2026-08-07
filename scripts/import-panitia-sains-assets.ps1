param(
  [string]$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$SourceRoot = "H:\My Drive\1. PROJEK I-GALERI\3. 2026\1. SKPM KUALITI@SEKOLAH (SK@S) 2026\STANDARD 3.1  - PENGURUSAN KURIKULUM\3.1.2 PENGURUSAN MATA PELAJARAN\4. SAINS",
  [string]$PythonExe = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
)

$ErrorActionPreference = "Stop"

$folderMap = @(
  @{ Id = "sains-carta-organisasi"; Folder = "1. CARTA ORGANISASI (SK@S 3.1.2.1)" },
  @{ Id = "sains-perancangan-program"; Folder = "2. PERANCANGAN PROGRAM PANITIA (SK@S 3.1.2.1)" },
  @{ Id = "sains-biodata-guru"; Folder = "3. BIODATA GURU MATAPELAJARAN (SK@S 3.1.2.1)" },
  @{ Id = "sains-jadual-guru"; Folder = "4. JADUAL GURU MATA PELAJARAN (SK@S 3.1.2.1)" },
  @{ Id = "sains-spi-kurikulum-panitia"; Folder = "5. SPI BERKAITAN PENGURUSAN KURIKULUM DAN PANITIA (SK@S 3.1.2.1)" },
  @{ Id = "sains-perancangan-strategik"; Folder = "6. PERANCANGAN STRATEGIK PANITIA (SK@S 3.1.2.2)(SK@S 3.1.2.3)" },
  @{ Id = "sains-laporan-plc"; Folder = "7. LAPORAN PLC KMK MINIT CURAI (SK@S 3.1.2.2)" },
  @{ Id = "sains-anggaran-belanja"; Folder = "8. ANGGARAN BELANJA MENGURUS (SK@S 3.1.2.4)" },
  @{ Id = "sains-analisis-peperiksaan"; Folder = "9. ANALISIS PEPERIKSAAN" }
)

function New-Slug {
  param([string]$Value)

  $normalized = $Value.ToLowerInvariant().Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $slug = [regex]::Replace($builder.ToString(), "[^a-z0-9]+", "-").Trim("-")
  if ([string]::IsNullOrWhiteSpace($slug)) {
    return "dokumen"
  }

  return $slug
}

function Convert-WordToPdf {
  param(
    [string]$SourcePath,
    [string]$PdfPath
  )

  if ($null -eq $script:WordApp) {
    $script:WordApp = New-Object -ComObject Word.Application
    $script:WordApp.Visible = $false
    $script:WordApp.DisplayAlerts = 0
  }

  $localSource = Join-Path $tempRoot ("word-" + [Guid]::NewGuid().ToString("N") + [IO.Path]::GetExtension($SourcePath))
  Copy-Item -LiteralPath $SourcePath -Destination $localSource -Force

  $document = $script:WordApp.Documents.Open($localSource, $false, $true)
  if ($null -eq $document) {
    throw "Word tidak dapat membuka dokumen."
  }

  try {
    $document.ExportAsFixedFormat($PdfPath, 17)
  }
  finally {
    $document.Close($false)
  }
}

function Convert-ExcelToPdf {
  param(
    [string]$SourcePath,
    [string]$PdfPath
  )

  if ($null -eq $script:ExcelApp) {
    $script:ExcelApp = New-Object -ComObject Excel.Application
    $script:ExcelApp.Visible = $false
    $script:ExcelApp.DisplayAlerts = $false
  }

  $localSource = Join-Path $tempRoot ("excel-" + [Guid]::NewGuid().ToString("N") + [IO.Path]::GetExtension($SourcePath))
  Copy-Item -LiteralPath $SourcePath -Destination $localSource -Force

  $workbook = $script:ExcelApp.Workbooks.Open($localSource, 3, $true)
  if ($null -eq $workbook) {
    throw "Excel tidak dapat membuka dokumen."
  }

  try {
    $workbook.ExportAsFixedFormat(0, $PdfPath)
  }
  finally {
    $workbook.Close($false)
  }
}

$publicRoot = Join-Path $WorkspaceRoot "public\pengurusan\panitia-sains"
$tempRoot = Join-Path $env:TEMP ("codex-panitia-sains-import-" + (Get-Date -Format "yyyyMMddHHmmss"))
$configPath = Join-Path $tempRoot "render-config.json"
$manifestPath = Join-Path $publicRoot "manifest.json"
$rendererPath = Join-Path $WorkspaceRoot "scripts\render-panitia-sains-assets.py"

New-Item -ItemType Directory -Force -Path $publicRoot, $tempRoot | Out-Null

$supportedExtensions = @(".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".webp")
$config = [ordered]@{
  sourceRoot = $SourceRoot
  pages = @()
}

$script:WordApp = $null
$script:ExcelApp = $null

try {
  foreach ($folderInfo in $folderMap) {
    $folderPath = Join-Path $SourceRoot $folderInfo.Folder
    $pagePublicPath = Join-Path $publicRoot $folderInfo.Id
    New-Item -ItemType Directory -Force -Path $pagePublicPath | Out-Null

    $assets = @()
    $files = Get-ChildItem -LiteralPath $folderPath -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -ne "desktop.ini" -and $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
      Sort-Object FullName

    $index = 1
    foreach ($file in $files) {
      $baseSlug = New-Slug ([IO.Path]::GetFileNameWithoutExtension($file.Name))
      $docSlug = "{0:00}-{1}" -f $index, $baseSlug
      $extension = $file.Extension.ToLowerInvariant()

      $renderPath = $file.FullName
      $renderExtension = $extension
      $renderError = ""

      if ($extension -in @(".doc", ".docx", ".xls", ".xlsx")) {
        $pdfPath = Join-Path $tempRoot "$($folderInfo.Id)-$docSlug.pdf"
        try {
          if ($extension -in @(".doc", ".docx")) {
            Convert-WordToPdf -SourcePath $file.FullName -PdfPath $pdfPath
          }
          else {
            Convert-ExcelToPdf -SourcePath $file.FullName -PdfPath $pdfPath
          }

          $renderPath = $pdfPath
          $renderExtension = ".pdf"
        }
        catch {
          $renderPath = ""
          $renderExtension = $extension
          $renderError = "Gagal tukar Office kepada PDF: $($_.Exception.Message)"
        }
      }

      $outputDirAbs = Join-Path $pagePublicPath $docSlug
      $outputDirUrl = "/pengurusan/panitia-sains/$($folderInfo.Id)/$docSlug"

      $assets += [ordered]@{
        title = [IO.Path]::GetFileNameWithoutExtension($file.Name)
        sourceName = $file.Name
        fileType = $extension.TrimStart(".").ToUpperInvariant()
        renderPath = $renderPath
        renderExtension = $renderExtension
        outputDirAbs = $outputDirAbs
        outputDirUrl = $outputDirUrl
        originalHref = ""
        error = $renderError
      }

      $index++
    }

    $config.pages += [ordered]@{
      id = $folderInfo.Id
      folder = $folderInfo.Folder
      assets = $assets
    }
  }

  $config | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $configPath -Encoding UTF8
  & $PythonExe $rendererPath $configPath $manifestPath
  if ($LASTEXITCODE -ne 0) {
    throw "Renderer gagal dengan exit code $LASTEXITCODE"
  }
}
finally {
  if ($null -ne $script:WordApp) {
    $script:WordApp.Quit()
  }

  if ($null -ne $script:ExcelApp) {
    $script:ExcelApp.Quit()
  }
}
