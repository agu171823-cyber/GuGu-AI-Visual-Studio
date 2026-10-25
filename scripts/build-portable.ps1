param(
  [string]$NodeVersion = 'v24.21.0',
  [ValidateSet('x64', 'arm64')]
  [string]$Architecture = 'x64'
)

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$package = Get-Content -LiteralPath (Join-Path $projectDir 'package.json') -Raw | ConvertFrom-Json
$appVersion = [string]$package.version
$nodeFolderName = "node-$NodeVersion-win-$Architecture"
$archiveName = "$nodeFolderName.zip"
$downloadBase = "https://nodejs.org/dist/$NodeVersion"
$cacheDir = Join-Path $projectDir ".cache\portable-node\$NodeVersion-$Architecture"
$archivePath = Join-Path $cacheDir $archiveName
$checksumsPath = Join-Path $cacheDir 'SHASUMS256.txt'
$releaseDir = Join-Path $projectDir 'release'
$zipName = "GuGu-AI-Visual-Studio-Portable-$appVersion-win-$Architecture.zip"
$zipPath = Join-Path $releaseDir $zipName
$stageDir = Join-Path ([System.IO.Path]::GetTempPath()) ("gugu-portable-" + [Guid]::NewGuid().ToString('N'))
$payloadDir = Join-Path $stageDir 'GuGu AI Visual Studio Portable'

function Download-File([string]$Uri, [string]$Destination) {
  Write-Host "Downloading: $Uri"
  Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $Destination
}

function Test-NodeArchive {
  if (-not (Test-Path -LiteralPath $archivePath)) { return $false }
  $checksumLine = Get-Content -LiteralPath $checksumsPath |
    Where-Object { $_ -match ("\s+" + [Regex]::Escape($archiveName) + '$') } |
    Select-Object -First 1
  if (-not $checksumLine) { throw "Cannot find $archiveName in the official checksum file." }
  $expectedHash = ($checksumLine -split '\s+')[0].ToUpperInvariant()
  $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToUpperInvariant()
  return $actualHash -eq $expectedHash
}

try {
  New-Item -ItemType Directory -Force -Path $cacheDir, $releaseDir, $payloadDir | Out-Null
  Download-File "$downloadBase/SHASUMS256.txt" $checksumsPath

  if (-not (Test-Path -LiteralPath $archivePath)) {
    Download-File "$downloadBase/$archiveName" $archivePath
  }
  if (-not (Test-NodeArchive)) {
    Write-Host 'The cached Node.js archive failed verification. Downloading it again...' -ForegroundColor Yellow
    Remove-Item -LiteralPath $archivePath -Force
    Download-File "$downloadBase/$archiveName" $archivePath
    if (-not (Test-NodeArchive)) { throw 'Node.js archive SHA-256 verification failed. Packaging stopped.' }
  }
  Write-Host 'The official Node.js archive passed SHA-256 verification.' -ForegroundColor Green

  foreach ($directory in @('public', 'server')) {
    Copy-Item -LiteralPath (Join-Path $projectDir $directory) -Destination $payloadDir -Recurse
  }
  $privatePortraitSample = Join-Path $payloadDir 'public\assets\portrait-style-preview-atlas.png'
  if (Test-Path -LiteralPath $privatePortraitSample) {
    Remove-Item -LiteralPath $privatePortraitSample -Force
  }
  $payloadScripts = Join-Path $payloadDir 'scripts'
  New-Item -ItemType Directory -Force -Path $payloadScripts | Out-Null
  foreach ($scriptFile in @('quick-start.js', 'install-desktop.ps1', 'clean-project.ps1')) {
    Copy-Item -LiteralPath (Join-Path $projectDir "scripts\$scriptFile") -Destination $payloadScripts
  }
  $resolvedPayload = [System.IO.Path]::GetFullPath($payloadDir).TrimEnd('\') + '\'
  foreach ($cacheDirectory in Get-ChildItem -LiteralPath $payloadDir -Directory -Recurse -Filter '__pycache__') {
    $resolvedCache = [System.IO.Path]::GetFullPath($cacheDirectory.FullName)
    if (-not $resolvedCache.StartsWith($resolvedPayload, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw 'Refusing to remove a cache directory outside the portable staging folder.'
    }
    Remove-Item -LiteralPath $resolvedCache -Recurse -Force
  }
  Get-ChildItem -LiteralPath $payloadDir -File -Recurse |
    Where-Object { $_.Extension -in @('.pyc', '.pyo') } |
    Remove-Item -Force
  foreach ($file in @('quick-start.cmd', 'install-desktop.cmd', 'package.json', 'README.md', 'LICENSE', 'PORTABLE-README.txt', '.env.example')) {
    Copy-Item -LiteralPath (Join-Path $projectDir $file) -Destination $payloadDir
  }
  $verificationFile = Join-Path $projectDir "docs\verification-$appVersion.md"
  if (Test-Path -LiteralPath $verificationFile) {
    $payloadDocs = Join-Path $payloadDir 'docs'
    New-Item -ItemType Directory -Force -Path $payloadDocs | Out-Null
    Copy-Item -LiteralPath $verificationFile -Destination $payloadDocs
  }
  foreach ($manualName in @(
    'GuGu-AI-Visual-Studio-3.0.0-LAN-Deployment-Guide-CN.pdf',
    'GuGu-3.0.0-Computer-Name-Shared-Folder-Deployment-Guide-CN.pdf'
  )) {
    $manualPath = Join-Path $projectDir "output\pdf\$manualName"
    if (Test-Path -LiteralPath $manualPath) {
      $payloadDocs = Join-Path $payloadDir 'docs'
      New-Item -ItemType Directory -Force -Path $payloadDocs | Out-Null
      Copy-Item -LiteralPath $manualPath -Destination $payloadDocs
    }
  }

  $nodeExtractDir = Join-Path $stageDir 'node-extract'
  Expand-Archive -LiteralPath $archivePath -DestinationPath $nodeExtractDir
  $officialNodeDir = Join-Path $nodeExtractDir $nodeFolderName
  $runtimeDir = Join-Path $payloadDir 'runtime'
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  Copy-Item -LiteralPath (Join-Path $officialNodeDir 'node.exe') -Destination $runtimeDir
  Copy-Item -LiteralPath (Join-Path $officialNodeDir 'LICENSE') -Destination (Join-Path $runtimeDir 'NODE-LICENSE.txt')

  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  Compress-Archive -LiteralPath $payloadDir -DestinationPath $zipPath -CompressionLevel Optimal

  $sizeMb = [Math]::Round((Get-Item -LiteralPath $zipPath).Length / 1MB, 1)
  Write-Host ''
  Write-Host "Portable package created: $zipPath" -ForegroundColor Green
  Write-Host "Size: $sizeMb MB"
  Write-Host 'API keys, job history, and generated images were not included.'
} finally {
  if (Test-Path -LiteralPath $stageDir) {
    $resolvedStage = [System.IO.Path]::GetFullPath($stageDir)
    $resolvedTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolvedStage.StartsWith($resolvedTemp, [System.StringComparison]::OrdinalIgnoreCase) -or
        -not (Split-Path -Leaf $resolvedStage).StartsWith('gugu-portable-')) {
      throw 'Refusing to remove a staging directory outside the expected temporary folder.'
    }
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }
}
