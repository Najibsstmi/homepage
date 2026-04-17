param(
	[string]$slug,
	[string]$title,
	[string]$description,
	[string]$target,
	[string]$image,
	[string]$ogDescription,
	[string]$twitterDescription
)

$appPath = Join-Path $PSScriptRoot "..\src\App.tsx"
$publicPath = Join-Path $PSScriptRoot "..\public"

function Show-HelperList {
	param(
		[string]$Title,
		[string[]]$Items,
		[int]$MaxItems = 12
	)

	if (-not $Items -or $Items.Count -eq 0) {
		return
	}

	Write-Host ""
	Write-Host $Title -ForegroundColor Cyan
	$Items | Select-Object -First $MaxItems | ForEach-Object {
		Write-Host ("- " + $_)
	}

	if ($Items.Count -gt $MaxItems) {
		Write-Host ("... dan " + ($Items.Count - $MaxItems) + " lagi") -ForegroundColor DarkGray
	}
}

function Read-RequiredValue {
	param(
		[string]$Label,
		[string]$CurrentValue = ""
	)

	$prompt = if ($CurrentValue) {
		"$Label [$CurrentValue]"
	} else {
		$Label
	}

	do {
		$value = Read-Host $prompt
		if ([string]::IsNullOrWhiteSpace($value)) {
			$value = $CurrentValue
		}
	} while ([string]::IsNullOrWhiteSpace($value))

	return $value.Trim()
}

if (Test-Path $appPath) {
	$appContent = Get-Content $appPath -Raw
	$anchorMatches = [regex]::Matches($appContent, 'id="([^"]+)"')
	$anchors = $anchorMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
	Show-HelperList "Anchor yang dikesan dalam App.tsx:" $anchors
}

if (Test-Path $publicPath) {
	$publicImages = Get-ChildItem $publicPath -File | Where-Object {
		$_.Extension -match '^\.(jpg|jpeg|png|webp)$'
	} | Select-Object -ExpandProperty Name
	Show-HelperList "Imej dalam folder public:" $publicImages
}

$slug = Read-RequiredValue "Slug post" $slug
$title = Read-RequiredValue "Tajuk post" $title
$description = Read-RequiredValue "Meta description" $description
$target = Read-RequiredValue "Anchor target dalam App.tsx" $target
$image = Read-RequiredValue "Nama imej OG dalam folder public" $image

if ($slug -notmatch '^[a-z0-9-]+$') {
	Write-Warning "Slug sebaiknya guna huruf kecil, nombor dan dash sahaja. Contoh: post-baharu"
}

if ($target -notmatch '^[a-z0-9-]+$') {
	Write-Warning "Anchor target sebaiknya guna huruf kecil, nombor dan dash sahaja. Contoh: post-baharu"
}

if ([string]::IsNullOrWhiteSpace($ogDescription)) {
	$ogDescription = $description
}
if ([string]::IsNullOrWhiteSpace($twitterDescription)) {
	$twitterDescription = $ogDescription
}

$ogDescription = Read-RequiredValue "OG description" $ogDescription
$twitterDescription = Read-RequiredValue "Twitter description" $twitterDescription

$imagePath = Join-Path $PSScriptRoot "..\public\$image"
if (-not (Test-Path $imagePath)) {
	Write-Warning "Imej '$image' belum dijumpai dalam folder public. Pastikan fail itu wujud sebelum deploy."
}

$shareOutputPath = Join-Path $publicPath ("share-" + $slug + ".html")
if (Test-Path $shareOutputPath) {
	$overwrite = Read-Host "Fail share untuk slug ini sudah wujud. Mahu overwrite? (y/n)"
	if ($overwrite -notin @("y", "Y")) {
		Write-Host "Dibatalkan. Tiada fail diubah." -ForegroundColor Yellow
		exit 0
	}

	& npm run create:share -- "--slug=$slug" "--title=$title" "--description=$description" "--ogDescription=$ogDescription" "--twitterDescription=$twitterDescription" "--target=$target" "--image=$image" "--force=true"
	exit $LASTEXITCODE
}

& npm run create:share -- "--slug=$slug" "--title=$title" "--description=$description" "--ogDescription=$ogDescription" "--twitterDescription=$twitterDescription" "--target=$target" "--image=$image"
