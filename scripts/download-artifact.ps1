param(
    [Parameter(Mandatory)][string]$Repository,
    [Parameter(Mandatory)][string]$Run,
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][string]$Destination
)
$ErrorActionPreference = 'Stop'
$artifacts = gh api "repos/$Repository/actions/runs/$Run/artifacts" | ConvertFrom-Json
if ($LASTEXITCODE) { throw 'Cannot list source artifacts' }
$artifact = @($artifacts.artifacts | Where-Object name -EQ $Name)
if ($artifact.Count -ne 1) { throw "Expected one artifact: $Name" }
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [System.Net.Http.HttpClient]::new($handler)
try {
    $client.DefaultRequestHeaders.UserAgent.ParseAdd('WindCli-Publisher')
    $token = if ($env:SOURCE_GH_TOKEN) { $env:SOURCE_GH_TOKEN } else { (gh auth token).Trim() }
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token)
    $response = $client.GetAsync("https://api.github.com/repos/$Repository/actions/artifacts/$($artifact[0].id)/zip").GetAwaiter().GetResult()
    if ([int]$response.StatusCode -ne 302) { throw "Artifact redirect failed: $($response.StatusCode)" }
    $downloadUrl = $response.Headers.Location.AbsoluteUri
} finally { $client.Dispose() }
$cache = Join-Path (Split-Path $Destination) ".downloads/$($artifact[0].id)"
[System.IO.Directory]::CreateDirectory($cache) | Out-Null
$size = [long]$artifact[0].size_in_bytes
$chunkSize = 4MB
$count = [int][Math]::Ceiling($size / $chunkSize)
0..($count - 1) | ForEach-Object -Parallel {
    $start = [long]$_ * $using:chunkSize
    $end = [Math]::Min($start + $using:chunkSize - 1, $using:size - 1)
    $chunk = Join-Path $using:cache "$_.part"
    if ((Test-Path -LiteralPath $chunk) -and (Get-Item -LiteralPath $chunk).Length -eq ($end - $start + 1)) { return }
    & curl.exe --fail --silent --show-error --connect-timeout 20 --max-time 240 --retry 5 --retry-all-errors --range "$start-$end" --output $chunk $using:downloadUrl
    if ($LASTEXITCODE -or (Get-Item -LiteralPath $chunk).Length -ne ($end - $start + 1)) { throw "Invalid artifact chunk $_" }
    Write-Host "Downloaded $using:Name segment $($_ + 1)/$using:count"
} -ThrottleLimit 32
$archive = Join-Path $cache 'artifact.zip'
$output = [System.IO.File]::Create($archive)
try {
    for ($index = 0; $index -lt $count; $index++) {
        $chunk = Join-Path $cache "$index.part"
        $expected = [Math]::Min($chunkSize, $size - [long]$index * $chunkSize)
        if ((Get-Item -LiteralPath $chunk).Length -ne $expected) { throw "Incomplete artifact chunk $index" }
        $inputStream = [System.IO.File]::OpenRead($chunk)
        try { $inputStream.CopyTo($output) } finally { $inputStream.Dispose() }
    }
} finally { $output.Dispose() }
[System.IO.Directory]::CreateDirectory($Destination) | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($archive, $Destination, $true)
Write-Host "Extracted verified-length artifact $Name"
