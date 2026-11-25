param([switch]$FullArchive)
$ErrorActionPreference = 'Stop'
$folder = Join-Path $PSScriptRoot '../tmp/bodyparts3d'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$names = @('partof_parts_list_e.txt', 'partof_inclusion_relation_list.txt', 'partof_element_parts.txt')
if ($FullArchive) { $names += 'partof_BP3D_4.0_obj_99.zip' }
foreach ($name in $names) {
  $dest = Join-Path $folder $name
  $url = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/$name"
  Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 300
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $dest).Hash
  Write-Output "$name $((Get-Item -LiteralPath $dest).Length) bytes SHA256 $hash"
}
