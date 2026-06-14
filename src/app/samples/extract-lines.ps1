$files = Get-ChildItem -Filter *.json
$rows = @()

foreach ($file in $files) {
    $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
    $lines = $json.lines

    # Normalize to 4 lines
    if ($lines.Count -eq 3) {
        # Move line 4 → line 3, line 3 → null
        $lines += $lines[2]
        $lines[2] = $null
    }
    elseif ($lines.Count -lt 4) {
        $lines += @( $null ) * (4 - $lines.Count)
    }
    elseif ($lines.Count -gt 4) {
        $lines = $lines[0..3]
    }

    $rows += [PSCustomObject]@{
        filename = $file.Name
        line1    = $lines[0]
        line2    = $lines[1]
        line3    = $lines[2]
        line4    = $lines[3]
    }
}

$rows | Export-Csv -Path "extracted_lines.csv" -NoTypeInformation -Encoding UTF8

Write-Host "Done. Exported $($rows.Count) rows to extracted_lines.csv"
