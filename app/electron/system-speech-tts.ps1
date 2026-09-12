param(
  [string]$InputJsonPath,
  [switch]$ListVoices
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

if ($ListVoices) {
  $voiceSynthesizer = [System.Speech.Synthesis.SpeechSynthesizer]::new()
  try {
    $voices = @($voiceSynthesizer.GetInstalledVoices() | ForEach-Object {
      [pscustomobject]@{
        id = $_.VoiceInfo.Name
        name = $_.VoiceInfo.Name
        culture = $_.VoiceInfo.Culture.Name
        gender = $_.VoiceInfo.Gender.ToString()
      }
    })
    [Console]::Out.Write((ConvertTo-Json -InputObject @($voices) -Compress))
  }
  finally {
    $voiceSynthesizer.Dispose()
  }
  exit 0
}

if ([string]::IsNullOrWhiteSpace($InputJsonPath) -or -not (Test-Path -LiteralPath $InputJsonPath -PathType Leaf)) {
  throw 'A valid InputJsonPath is required.'
}

$config = Get-Content -LiteralPath $InputJsonPath -Raw | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace([string]$config.text)) { throw 'Narration text is required.' }
if ([string]::IsNullOrWhiteSpace([string]$config.outputWavPath)) { throw 'Output WAV path is required.' }
if ([string]::IsNullOrWhiteSpace([string]$config.timingJsonPath)) { throw 'Timing JSON path is required.' }

$synthesizer = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$words = [System.Collections.ArrayList]::new()
$handler = [System.EventHandler[System.Speech.Synthesis.SpeakProgressEventArgs]]{
  param($sender, $eventArgs)
  [void]$words.Add([pscustomobject]@{
    text = $eventArgs.Text
    startMs = [math]::Round($eventArgs.AudioPosition.TotalMilliseconds)
  })
}

try {
  if (-not [string]::IsNullOrWhiteSpace([string]$config.voiceId)) {
    $synthesizer.SelectVoice([string]$config.voiceId)
  }
  $synthesizer.Rate = [math]::Max(-10, [math]::Min(10, [int]$config.rate))
  $synthesizer.Volume = [math]::Max(0, [math]::Min(100, [int]$config.volume))
  $selectedVoice = $synthesizer.Voice.Name
  $synthesizer.add_SpeakProgress($handler)
  $synthesizer.SetOutputToWaveFile([string]$config.outputWavPath)
  $synthesizer.Speak([string]$config.text)
  $synthesizer.SetOutputToNull()
  $result = [pscustomobject]@{
    voice = $selectedVoice
    words = @($words)
  }
  $result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath ([string]$config.timingJsonPath) -Encoding UTF8
}
finally {
  $synthesizer.remove_SpeakProgress($handler)
  $synthesizer.Dispose()
}
