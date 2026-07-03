#!powershell
# Gemini Free Tier API Usage Tracker
# Tracks remaining requests and time for Gemini 2.0 Flash, 2.5 Flash, 2.5 Pro, and 2.5 Flash Lite models
# Requires GEMINI_API_KEY environment variable
param(
    [switch]$Verbose,
    [string]$LogPath = (Join-Path $PSScriptRoot "logs" "gemini_api_tracker.log"),
    [int]$CacheHours = 1
)

function Start-GeminiFreeTierTracker {
    $apiKey = $env:GEMINI_API_KEY
    if (-not $apiKey) {
        Write-Host "ERROR: GEMINI_API_KEY environment variable not set" -ForegroundColor Red
        Write-Host "Please set it with: $env:GEMINI_API_KEY = \"your-api-key\"" -ForegroundColor Yellow
        exit 1
    }
    
    # Test API with a lightweight metadata request to verify key works
    $headers = @{
        "Content-Type" = "application/json"
        "x-goog-api-client" = "gemini-tracker/1.0"
    }
    
    $body = @{
        "contents" = @(
            @{ "parts" = @(@{ "text" = "test" }) }
        ) | ConvertTo-Json -Depth 3
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/google-test?\$key=$apiKey" `
            -Method Post -Headers $headers -Body $body -TimeoutSec 30 -ErrorAction Stop
        
        Write-Host "API Key is valid! Ready to track usage..." -ForegroundColor Green
        
        # Start tracking
        Track-ApiUsage -ApiKey $apiKey -LogPath $LogPath -Verbose:$Verbose -CacheHours $CacheHours
    }
    catch {
        Write-Host "ERROR: API key test failed" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor DarkGray
        exit 1
    }
}

function Get-FreeTierUsage {
    param(
        [string]$ApiKey,
        [hashtable]$RateLimits
    )
    
    # Target models for the free tier (newer models likely have more quota)
    $models = @(
        "gemini-2-0-flash",
        "gemini-2-0-flash-exp",
        "gemini-2-5-flash-exp",
        "gemini-2-5-flash",
        "gemini-2-5-pro",
        "gemini-2-5-flash-lite"
    )
    
    $currentTime = [datetime]::UtcNow.ToUnixTimeSeconds()
    $dailyLimit = 1500
    $minuteLimit = 15
    $monthlyLimit = 1000000
    
    $totalRequestsUsed = 0
    $totalTokensUsed = 0
    $minuteUsageSummary = @()  # Track requests per last 60 seconds
    $hourRequests = @()  # Track requests per last hour
    $dayRequests = @()   # Track requests per day
    $projectedDailyUsage = 0
    $projectedMonthlyUsage = 0
    $minuteUsageMap = @{ }
    $hourUsageMap = @{ }
    $dayUsageMap = @{ }
    $queriesByModel = @{ }
    $tokensByModel = @{ }
    $bodyCacheByModel = @{ }
    $timeUsedByModel = @{ }
    $currentKeyInfo = @{ }
    
    $timestamp = Get-DateTimeStamp
    
    foreach ($model in $models) {
        try {
            $modelUsage = Get-ModelUsage -ApiKey $ApiKey -Model $model
            $queriesByModel[$model] = $modelUsage.queriesUsed
            $tokensByModel[$model] = $modelUsage.tokensUsed
            $bodyCacheByModel[$model] = $modelUsage.cacheHits
            $timeUsedByModel[$model] = $modelUsage.timeUsed
            $totalRequestsUsed += $modelUsage.queriesUsed
            $totalTokensUsed += $modelUsage.tokensUsed
            $currentKeyInfo[$model] = $modelUsage.keyInfo
            
            # Get current timestamp for logging
            $currentDateTime = Get-DateTimeStamp
            
            $minuteUsageSummary += @{
                "timestamp" = $currentDateTime
                "model" = $model
                "requests" = $modelUsage.queriesUsed
                "tokens" = $modelUsage.tokensUsed
                "cache_hits" = $modelUsage.cacheHits
                "time_seconds" = $modelUsage.timeUsed
            }
            
            if ($Verbose) {
                Write-Host "[$currentDateTime] Model: $model - Queries: $($modelUsage.queriesUsed) - Tokens: $($modelUsage.tokensUsed) - Cache Hits: $($modelUsage.cacheHits) - Time Used: $($modelUsage.timeUsed) seconds" -ForegroundColor Cyan
            }
            
            $dateKey = $currentDateTime.Substring(0, 10)
            if (-not $dayUsageMap.ContainsKey($dateKey)) { $dayUsageMap[$dateKey] = @() }
            $dayUsageMap[$dateKey] += $modelUsage.queriesUsed
            
            $hourKey = $currentDateTime.Substring(0, 13)
            if (-not $hourUsageMap.ContainsKey($hourKey)) { $hourUsageMap[$hourKey] = @() }
            $hourUsageMap[$hourKey] += $modelUsage.queriesUsed
            
            $minuteKey = $currentDateTime.Substring(0, 16) + ":" + $currentDateTime.Substring(17, 2)
            if (-not $minuteUsageMap.ContainsKey($minuteKey)) { $minuteUsageMap[$minuteKey] = @() }
            $minuteUsageMap[$minuteKey] += $modelUsage.queriesUsed
            
        } catch {
            Write-Host "WARNING: Failed to get usage for model $model : $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Calculate residuals
    $remainingMinuteRequests = $minuteLimit - $totalRequestsUsed
    $remainingDailyRequests = $dailyLimit - $totalRequestsUsed
    $remainingMonthlyRequests = $monthlyLimit - $totalRequestsUsed
    
    # Calculate projected usage
    $minuteProjection = if ($totalRequestsUsed -gt 0) { [math]::Floor(($totalRequestsUsed / $currentTime % 60) * 60) } else { 0 }
    $hourProjection = if ($hourUsageMap.Count -gt 0) { [math]::Round(($hourUsageMap.Values | Measure-Average), 2) } else { 0 }
    $dayProjection = if ($dayUsageMap.Count -gt 0) { [math]::Round(($dayUsageMap.Values | Measure-Average), 2) } else { 0 }
    
    # Display results
    Write-Host "`n=== Gemini Free Tier Usage Report ===" -ForegroundColor Green
    Write-Host "Timestamp: $(Get-DateTimeStamp)" -ForegroundColor White
    Write-Host "Total Requests Used: $totalRequestsUsed / $minuteLimit per minute, $dailyLimit per day, $monthlyLimit per month" -ForegroundColor White
    
    if ($remainingMinuteRequests -gt 0) {
        Write-Host "Requests Remaining This Minute: $remainingMinuteRequests" -ForegroundColor Green
    } else {
        Write-Host "Requests Remaining This Minute: $remainingMinuteRequests (You have reached the per-minute limit)" -ForegroundColor Red
    }
    
    if ($remainingDailyRequests -gt 0) {
        Write-Host "Requests Remaining Today: $remainingDailyRequests" -ForegroundColor Green
    } else {
        Write-Host "Requests Remaining Today: $remainingDailyRequests (You have reached the daily limit)
" -ForegroundColor Red
    }
    
    if ($remainingMonthlyRequests -gt 0) {
        Write-Host "Requests Remaining This Month: $remainingMonthlyRequests" -ForegroundColor Green
    } else {
        Write-Host "Requests Remaining This Month: $remainingMonthlyRequests (You have reached the monthly limit)" -ForegroundColor Red
    }
    
    Write-Host "Total Tokens Used: $($totalTokensUsed.ToString('N0'))" -ForegroundColor White
    Write-Host "Projected Hourly Usage: $hourProjection requests" -ForegroundColor Gray
    Write-Host "Projected Daily Usage: $dayProjection requests" -ForegroundColor Gray
    Write-Host ""
    
    # Display breakdown by model
    Write-Host "Breakdown by Model:" -ForegroundColor Yellow
    $modelsList = $models | Sort-Object
    foreach ($model in $modelsList) {
        if ($queriesByModel.ContainsKey($model) -and $tokensByModel.ContainsKey($model)) {
            $modelColor = if ($queriesByModel[$model] -gt 0) { "Red" } else { "Gray" }
            $modelRequests = $queriesByModel[$model]
            $modelTokens = $tokensByModel[$model]
            $cacheInfo = if ($bodyCacheByModel.ContainsKey($model)) { " (Cache: $($bodyCacheByModel[$model]))" } else { "" }
            Write-Host "  $model`:$modelRequests requests, $modelTokens tokens$cacheInfo" -ForegroundColor $modelColor
        }
    }
    
    # Log the usage
    $logEntry = @{
        "timestamp" = Get-DateTimeStamp
        "total_requests_used" = $totalRequestsUsed
        "total_tokens_used" = $totalTokensUsed
        "minute_remaining" = $remainingMinuteRequests
        "day_remaining" = $remainingDailyRequests
        "month_remaining" = $remainingMonthlyRequests
        "hour_projection" = $hourProjection
        "day_projection" = $dayProjection
        "usage_by_model" = $queriesByModel
        "tokens_by_model" = $tokensByModel
        "current_key_info" = $currentKeyInfo
        "minute_usage_summary" = $minuteUsageSummary
    }
    
    $logJson = $logEntry | ConvertTo-Json -Depth 10
    Add-Content -Path $LogPath -Value "$logEntry" -Force
    
    Write-Host "Usage logged to: $LogPath" -ForegroundColor DarkGray
    
    # Alert if approaching limits
    if ($remainingMinuteRequests -lt 2) {
        Write-Host "URGENT: Only $remainingMinuteRequests requests remaining this minute!" -ForegroundColor Red -BackgroundColor DarkRed
    } elseif ($remainingDailyRequests -lt 100) {
        Write-Host "CAUTION: Only $remainingDailyRequests requests remaining today." -ForegroundColor Yellow
    }
    
    return $logEntry
}

function Get-ModelUsage {
    param(
        [string]$ApiKey,
        [string]$Model
    )
    
    $url = "https://generativelanguage.googleapis.com/v1beta/models/$model\$usageStats"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{"x-goog-api-client" = "gemini-tracker/1.0"} -TimeoutSec 30 -ErrorAction Stop
        
        $usage = $response.usageStats
        $cacheHits = if ($response.usageStats.ContainsKey("cacheHitCount")) { $response.usageStats.cacheHitCount } else { 0 }
        $quotaLimit = if ($response.usageStats.ContainsKey("quotaLimit")) { $response.usageStats.quotaLimit } else { 0 }
        $quotaRemaining = if ($response.usageStats.ContainsKey("quotaRemaining")) { $response.usageStats.quotaRemaining } else { 0 }
        $dailyQuota = if ($response.usageStats.ContainsKey("dailyQuota")) { $response.usageStats.dailyQuota } else { 0 }
        $dailyRemaining = if ($response.usageStats.ContainsKey("dailyQuotaRemaining")) { $response.usageStats.dailyQuotaRemaining } else { 0 }
        
        $result = [ordereddictionary]@{
            "queriesUsed" = $usage.queriesUsed
            "tokensUsed" = $usage.tokens
            "cacheHits" = $cacheHits
            "timeUsed" = $usage.timeUsed
            "quotaLimit" = $quotaLimit
            "quotaRemaining" = $quotaRemaining
            "dailyQuota" = $dailyQuota
            "dailyRemaining" = $dailyRemaining
            "keyInfo" = @{
                "source" = "environment"
                "set_time" = (Get-DateTimeStamp)
            }
        }
        
        return $result
        
    } catch {
        $error = $_.Exception
        Write-Host "API call failed for model $model : $($error.Message)" -ForegroundColor Yellow
        
        # Return 0 values as fallback
        $result = [ordereddictionary]@{
            "queriesUsed" = 0
            "tokensUsed" = 0
            "cacheHits" = 0
            "timeUsed" = 0
            "quotaLimit" = 0
            "quotaRemaining" = 0
            "dailyQuota" = 0
            "dailyRemaining" = 0
            "keyInfo" = @{
                "source" = "error"
                "error" = $error.Message
                "set_time" = (Get-DateTimeStamp)
            }
        }
        
        return $result
    }
}

function Track-ApiUsage {
    param(
        [string]$ApiKey,
        [string]$LogPath,
        [switch]$Verbose,
        [int]$CacheHours
    )
    
    # Test key first
    $testUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2-0-flash?\$key=$ApiKey"
    try {
        $null = Invoke-RestMethod -Uri $testUrl -Method Head -TimeoutSec 30 -ErrorAction Stop
        Write-Host "API Key validated successfully" -ForegroundColor Green
    } catch {
        Write-Host "Invalid API Key: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
    # Main tracking loop
    $currentDate = (Get-DateTimeStamp).Substring(0, 10)
    $runNumber = 1
    
    while ($true) {
        Write-Host "`n--- Start of Usage Report $(Get-DateTimeStamp) ---" -ForegroundColor Cyan
        $usageReport = Get-FreeTierUsage -ApiKey $ApiKey -RateLimits @{ }
        
        # Add run number to log for tracking
        $logEntry = @{ "run" = $runNumber }
        Add-Content -Path $LogPath -Value (ConvertTo-Json -InputObject $logEntry -Depth 3) -Force
        
        $runNumber++
        
        # Wait for the next check (1 hour)
        Write-Host "Waiting 1 hour for next check..." -ForegroundColor Gray
        Start-Sleep -Seconds (3600)
    }
}

function Get-DateTimeStamp {
    return [datetime]::UtcNow.ToString("yyyy-MM-dd HH:mm:ss", [system.globalization.cultureinfo]::InvariantCulture)
}

function Append-ToLog {
    param(
        [string]$Path,
        [hashtable]$Entry
    )
    $jsonEntry = $Entry | ConvertTo-Json -Depth 10
    Add-Content -Path $Path -Value $jsonEntry -Force
}

# Support for PowerShell arrays and Measure-Average if not available
if (-not ([system.management.automation] efficiently? "Microsoft.PowerShell.Commands.Measure-ObjectCmdlet")) {
    function Measure-Object {
        param(
            [object]$InputObject,
            [string]$Property
        )
        $array = @($InputObject)
        $count = $array.Count
        $average = if ($count -gt 0) { [math]::Round(($array | Measure-Average), 2) } else { 0 }
        $max = if ($count -gt 0) { $array | Measure-Max } else { 0 }
        $min = if ($count -gt 0) { $array | Measure-Min } else { 0 }
        
        return [ordereddictionary]@{
            "Count" = $count
            "Average" = $average
            "Max" = $max
            "Min" = $min
        }
    }
}

# Execute main function
function Main {
    $logDir = Split-Path -Parent $LogPath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Start-GeminiFreeTierTracker
}

Main