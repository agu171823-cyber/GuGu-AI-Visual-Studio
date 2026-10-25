param(
  [switch]$IncludeDependencies
)

$ErrorActionPreference = 'Stop'
$projectDir = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))

function Assert-ProjectPath([string]$Path) {
  $resolved = [System.IO.Path]::GetFullPath($Path)
  $prefix = $projectDir.TrimEnd('\') + '\'
  if (-not $resolved.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clean a path outside the project: $resolved"
  }
  return $resolved
}

function Remove-ProjectDirectory([string]$RelativePath, [switch]$Recreate) {
  $target = Assert-ProjectPath (Join-Path $projectDir $RelativePath)
  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
  if ($Recreate) {
    New-Item -ItemType Directory -Path $target -Force | Out-Null
  }
}

# Rebuildable test/package caches and temporary verification copies.
Remove-ProjectDirectory '.cache' -Recreate
Remove-ProjectDirectory 'tmp' -Recreate

# Ordinary generation history only. Saved character projects and portrait albums
# under data/ are intentionally retained.
Remove-ProjectDirectory 'output' -Recreate
$jobsPath = Assert-ProjectPath (Join-Path $projectDir 'data\jobs.json')
New-Item -ItemType Directory -Path (Split-Path -Parent $jobsPath) -Force | Out-Null
[System.IO.File]::WriteAllText($jobsPath, "[]`n", [System.Text.UTF8Encoding]::new($false))

Get-ChildItem -LiteralPath $projectDir -File -Filter '*.log' -ErrorAction SilentlyContinue |
  Remove-Item -Force

if ($IncludeDependencies) {
  # The runtime uses the already-built bundles. These development dependencies
  # are restored with: npm --prefix modules/character-studio ci
  Remove-ProjectDirectory 'modules\character-studio\node_modules'
  Remove-ProjectDirectory 'node_modules'
}

Write-Host 'Project cleanup complete.' -ForegroundColor Green
Write-Host 'Kept: config/settings.json, data/character-studio, data/portrait-album, release.'
if ($IncludeDependencies) {
  Write-Host 'Removed rebuildable development dependencies.'
}
