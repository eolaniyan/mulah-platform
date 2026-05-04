param(
  [string]$RepoPath,
  [string]$TaskName = "Mulah Git Nudge",
  [int]$EveryMinutes = 120
)

$ErrorActionPreference = "Stop"

if (-not $RepoPath) {
  $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).ProviderPath
}

$nudgeScript = (Resolve-Path (Join-Path $PSScriptRoot "git-nudge.ps1")).Path

if (-not (Test-Path $nudgeScript)) {
  throw "Missing script: $nudgeScript"
}

if ($EveryMinutes -lt 15) {
  throw "EveryMinutes must be >= 15"
}

$psArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$nudgeScript`" -RepoPath `"$RepoPath`""

# Create or update the task using ScheduledTasks module (more reliable than schtasks quoting).
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $psArgs
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)
$principal = New-ScheduledTaskPrincipal -UserId $env:UserName -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null

Write-Output "Scheduled Task created/updated:"
Write-Output "  Name: $TaskName"
Write-Output "  Interval: every $EveryMinutes minutes"
Write-Output "  Action: powershell.exe $psArgs"

