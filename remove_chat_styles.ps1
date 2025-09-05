# PowerShell script to remove chat styles from style.css
$styleFile = "e:\New folder\CAnalyzerAI\style.css"
$content = Get-Content $styleFile -Raw

# Find the start and end of the chat section
$startPattern = "/\* ===================================\s+CHAT WINDOW COMPONENT STYLES\s+=================================== \*/"
$endPattern = "@media \(prefers-reduced-motion: reduce\) \{\s+\.chat-container,\s+\.chat-message,\s+\.chat-toggle-btn,\s+\.typing-dots span \{\s+animation: none;\s+transition: none;\s+\}\s+\.chat-messages \{\s+scroll-behavior: auto;\s+\}\s+\}"

# Use regex to find the positions
$startMatch = [regex]::Match($content, $startPattern)
$endMatch = [regex]::Match($content, $endPattern)

if ($startMatch.Success -and $endMatch.Success) {
    $startIndex = $startMatch.Index
    $endIndex = $endMatch.Index + $endMatch.Length
    
    # Remove the chat section
    $newContent = $content.Substring(0, $startIndex) + $content.Substring($endIndex)
    
    # Write back to file
    Set-Content $styleFile -Value $newContent -NoNewline
    Write-Host "Successfully removed chat styles from style.css"
} else {
    Write-Host "Could not find chat section boundaries"
}
