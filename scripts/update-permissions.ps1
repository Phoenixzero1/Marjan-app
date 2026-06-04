# Update admin routes to use requirePermission instead of local requireAdmin

$base = "c:\Users\Nader\Desktop\marjan-app\src\app\api\admin"

function Update-Route {
    param([string]$relPath, [string]$defaultPerm)

    $path = Join-Path $base $relPath
    if (!(Test-Path $path)) { Write-Host "SKIP (not found): $relPath"; return }

    $content = Get-Content $path -Raw -Encoding UTF8

    # Replace the auth import if present
    $content = $content -replace [regex]::Escape('import { auth } from "@/lib/auth";'), ''

    # Replace import { auth } combined with other imports if needed
    # Add requirePermission import after the first import line if not already present
    if ($content -notmatch 'requirePermission') {
        $content = $content -replace '(import \{ NextRequest.*?\n)', "`$1import { requirePermission } from `"@/lib/permissions`";`n"
    }

    # Remove ADMIN_ROLES constant line
    $content = $content -replace 'const ADMIN_ROLES = \[.*?\];\r?\n\r?\n', ''

    # Remove requireAdmin function (multi-line) - try several patterns
    $content = $content -replace '(?s)async function requireAdmin\(\) \{.*?return session;\r?\n\}\r?\n\r?\n', ''

    # Replace pattern: if (!(await requireAdmin()))
    $content = $content -replace "if \(!\(await requireAdmin\(\)\)\)", "if (!(await requirePermission(`"$defaultPerm`")))"

    # Replace pattern: const session = await requireAdmin();
    $content = $content -replace "const session = await requireAdmin\(\);", "const session = await requirePermission(`"$defaultPerm`");"

    Set-Content $path $content -Encoding UTF8 -NoNewline
    Write-Host "Updated: $relPath"
}

# Simple: one permission for all handlers
Update-Route "categories\route.ts"       "MANAGE_CATEGORIES"
Update-Route "blog\route.ts"             "MANAGE_BLOG"
Update-Route "blog\[id]\route.ts"        "MANAGE_BLOG"
Update-Route "blog\categories\route.ts"  "MANAGE_BLOG"
Update-Route "media\route.ts"            "MANAGE_MEDIA"
Update-Route "media\cleanup\route.ts"    "MANAGE_MEDIA"
Update-Route "users\route.ts"            "MANAGE_USERS"
Update-Route "roles\route.ts"            "MANAGE_ROLES"
Update-Route "coupons\route.ts"          "MANAGE_COUPONS"
Update-Route "finance\route.ts"          "VIEW_FINANCE"
Update-Route "notifications\route.ts"    "SEND_NOTIFICATIONS"
Update-Route "comments\route.ts"         "VIEW_ADMIN"
Update-Route "newsletter\route.ts"       "VIEW_ADMIN"
Update-Route "returns\route.ts"          "MANAGE_RETURNS"
Update-Route "returns\[id]\route.ts"     "MANAGE_RETURNS"
Update-Route "trash\route.ts"            "VIEW_ADMIN"
Update-Route "stats\route.ts"            "VIEW_ADMIN"
Update-Route "brands\route.ts"           "EDIT_PRODUCTS"
Update-Route "backup\route.ts"           "MANAGE_BACKUP"
Update-Route "backup\[id]\route.ts"      "MANAGE_BACKUP"
Update-Route "backup\restore\route.ts"   "MANAGE_BACKUP"
Update-Route "logs\route.ts"             "VIEW_LOGS"
Update-Route "sessions\route.ts"         "VIEW_LOGS"
Update-Route "products\route.ts"         "EDIT_PRODUCTS"
Update-Route "products\[id]\route.ts"    "EDIT_PRODUCTS"
Update-Route "orders\route.ts"           "VIEW_ORDERS"
Update-Route "settings\route.ts"         "MANAGE_SETTINGS"

Write-Host "Done!"
