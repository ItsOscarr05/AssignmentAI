# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Check required environment variables
$requiredVars = @(
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "DOMAIN_NAME"
)

foreach ($var in $requiredVars) {
    if (-not (Get-Item env:$var -ErrorAction SilentlyContinue)) {
        Write-Error "Error: $var is not set"
        exit 1
    }
}

# Create CloudFront distribution
Write-Host "Creating CloudFront distribution..."

# Create OAI (Origin Access Identity)
$oaiConfig = @{
    CallerReference = (Get-Date).Ticks.ToString()
    Comment = "AssignmentAI CDN"
} | ConvertTo-Json

$oaiResponse = aws cloudfront create-cloud-front-origin-access-identity `
    --cloud-front-origin-access-identity-config $oaiConfig
$oaiId = ($oaiResponse | ConvertFrom-Json).CloudFrontOriginAccessIdentity.Id

# Create S3 bucket for CDN
$bucketName = "cdn.$env:DOMAIN_NAME"
aws s3 mb "s3://$bucketName" --region $env:AWS_REGION

# Configure bucket policy
$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "AllowCloudFrontServicePrincipal"
            Effect = "Allow"
            Principal = @{
                Service = "cloudfront.amazonaws.com"
            }
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$bucketName/*"
            Condition = @{
                StringEquals = @{
                    "AWS:SourceArn" = "arn:aws:cloudfront::${env:AWS_ACCOUNT_ID}:distribution/*"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$bucketPolicy | Out-File -FilePath "bucket-policy.json"
aws s3api put-bucket-policy --bucket $bucketName --policy file://bucket-policy.json

# Create CloudFront distribution
$distributionConfig = @{
    CallerReference = (Get-Date).Ticks.ToString()
    Aliases = @{
        Quantity = 1
        Items = @("cdn.$env:DOMAIN_NAME")
    }
    DefaultRootObject = "index.html"
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3-$bucketName"
                DomainName = "$bucketName.s3.amazonaws.com"
                S3OriginConfig = @{
                    OriginAccessIdentity = "origin-access-identity/cloudfront/$oaiId"
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-$bucketName"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods = @{
            Quantity = 2
            Items = @("GET", "HEAD")
            CachedMethods = @{
                Quantity = 2
                Items = @("GET", "HEAD")
            }
        }
        ForwardedValues = @{
            QueryString = $false
            Cookies = @{
                Forward = "none"
            }
        }
        MinTTL = 0
        DefaultTTL = 86400
        MaxTTL = 31536000
    }
    Enabled = $true
    PriceClass = "PriceClass_100"
    ViewerCertificate = @{
        ACMCertificateArn = $env:ACM_CERTIFICATE_ARN
        SSLSupportMethod = "sni-only"
        MinimumProtocolVersion = "TLSv1.2_2021"
    }
} | ConvertTo-Json -Depth 10

$distributionConfig | Out-File -FilePath "distribution-config.json"
$distributionResponse = aws cloudfront create-distribution --distribution-config file://distribution-config.json
$distributionId = ($distributionResponse | ConvertFrom-Json).Distribution.Id

# Update environment variables
Add-Content -Path .env -Value "`nCDN_DISTRIBUTION_ID=$distributionId"
Add-Content -Path .env -Value "CDN_DOMAIN=cdn.$env:DOMAIN_NAME"

# Cleanup
Remove-Item "bucket-policy.json"
Remove-Item "distribution-config.json"

Write-Host "CDN setup completed successfully!"
Write-Host "Distribution ID: $distributionId"
Write-Host "CDN Domain: cdn.$env:DOMAIN_NAME" 