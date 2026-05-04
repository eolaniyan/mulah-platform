param(
  [string]$RepoPath,
  [int]$PopupSeconds = 8
)

$ErrorActionPreference = "Stop"

if (-not $RepoPath) {
  $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).ProviderPath
}

function Invoke-Git([string[]]$Args) {
  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = "git"
  $pinfo.Arguments = ($Args -join " ")
  $pinfo.WorkingDirectory = $RepoPath
  $pinfo.RedirectStandardOutput = $true
  $pinfo.RedirectStandardError = $true
  $pinfo.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $pinfo
  [void]$p.Start()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  return [pscustomobject]@{
    ExitCode = $p.ExitCode
    StdOut   = $stdout.Trim()
    StdErr   = $stderr.Trim()
  }
}

function Show-Nudge([string]$Title, [string]$Message) {
  try {
    $ws = New-Object -ComObject WScript.Shell
    # 0x0 = OK only, 0x40 = info icon
    [void]$ws.Popup($Message, $PopupSeconds, $Title, 0x40)
  } catch {
    # Fallback: write to console (Task Scheduler output may be discarded)
    Write-Output ("[{0}] {1} - {2}" -f (Get-Date).ToString("s"), $Title, $Message)
  }
}

if (-not (Test-Path $RepoPath)) {
  exit 0
}

$isRepo = Invoke-Git @("rev-parse", "--is-inside-work-tree")
if ($isRepo.ExitCode -ne 0 -or $isRepo.StdOut -ne "true") {
  exit 0
}

$dirty = Invoke-Git @("status", "--porcelain")
$dirtyCount = 0
if ($dirty.ExitCode -eq 0 -and $dirty.StdOut) {
  $dirtyCount = ($dirty.StdOut -split "`n").Count
}

# Determine unpushed commits (if upstream exists)
$aheadCount = 0
$upstream = Invoke-Git @("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
if ($upstream.ExitCode -eq 0 -and $upstream.StdOut) {
  $ahead = Invoke-Git @("rev-list", "--count", "@{u}..HEAD")
  if ($ahead.ExitCode -eq 0 -and $ahead.StdOut -match "^\d+$") {
    $aheadCount = [int]$ahead.StdOut
  }
}

if ($dirtyCount -eq 0 -and $aheadCount -eq 0) {
  exit 0
}

$branch = (Invoke-Git @("branch", "--show-current")).StdOut
if (-not $branch) { $branch = "(detached)" }

$lines = @()
if ($dirtyCount -gt 0) { $lines += "Uncommitted changes: $dirtyCount file(s)" }
if ($aheadCount -gt 0) { $lines += "Unpushed commits: $aheadCount" }
$lines += "Repo: $RepoPath"
$lines += "Branch: $branch"

Show-Nudge -Title "Mulah Git nudge" -Message ($lines -join "`r`n")

