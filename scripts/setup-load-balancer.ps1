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
    "VPC_ID",
    "DOMAIN_NAME"
)

foreach ($var in $requiredVars) {
    if (-not (Get-Item env:$var -ErrorAction SilentlyContinue)) {
        Write-Error "Error: $var is not set"
        exit 1
    }
}

# Create security group for ALB
Write-Host "Creating security group for ALB..."
$securityGroupResponse = aws ec2 create-security-group `
    --group-name assignmentai-alb-sg `
    --description "Security group for AssignmentAI ALB" `
    --vpc-id $env:VPC_ID
$securityGroupId = ($securityGroupResponse | ConvertFrom-Json).GroupId

# Add inbound rules
aws ec2 authorize-security-group-ingress `
    --group-id $securityGroupId `
    --protocol tcp `
    --port 80 `
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress `
    --group-id $securityGroupId `
    --protocol tcp `
    --port 443 `
    --cidr 0.0.0.0/0

# Create target group for backend
Write-Host "Creating target group for backend..."
$backendTargetGroupResponse = aws elbv2 create-target-group `
    --name assignmentai-backend-tg `
    --protocol HTTP `
    --port 3000 `
    --vpc-id $env:VPC_ID `
    --health-check-path /health `
    --health-check-interval-seconds 30 `
    --health-check-timeout-seconds 5 `
    --healthy-threshold-count 2 `
    --unhealthy-threshold-count 2
$backendTargetGroupArn = ($backendTargetGroupResponse | ConvertFrom-Json).TargetGroups[0].TargetGroupArn

# Create target group for frontend
Write-Host "Creating target group for frontend..."
$frontendTargetGroupResponse = aws elbv2 create-target-group `
    --name assignmentai-frontend-tg `
    --protocol HTTP `
    --port 80 `
    --vpc-id $env:VPC_ID `
    --health-check-path / `
    --health-check-interval-seconds 30 `
    --health-check-timeout-seconds 5 `
    --healthy-threshold-count 2 `
    --unhealthy-threshold-count 2
$frontendTargetGroupArn = ($frontendTargetGroupResponse | ConvertFrom-Json).TargetGroups[0].TargetGroupArn

# Create ALB
Write-Host "Creating Application Load Balancer..."
$albResponse = aws elbv2 create-load-balancer `
    --name assignmentai-alb `
    --subnets $env:SUBNET_IDS `
    --security-groups $securityGroupId `
    --scheme internet-facing `
    --type application
$albArn = ($albResponse | ConvertFrom-Json).LoadBalancers[0].LoadBalancerArn

# Create listener for HTTP
Write-Host "Creating HTTP listener..."
$httpListenerResponse = aws elbv2 create-listener `
    --load-balancer-arn $albArn `
    --protocol HTTP `
    --port 80 `
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,Host=#{host},Path=/#{path},Query=#{query},StatusCode=HTTP_301}'
$httpListenerArn = ($httpListenerResponse | ConvertFrom-Json).Listeners[0].ListenerArn

# Create listener for HTTPS
Write-Host "Creating HTTPS listener..."
$httpsListenerResponse = aws elbv2 create-listener `
    --load-balancer-arn $albArn `
    --protocol HTTPS `
    --port 443 `
    --certificates CertificateArn=$env:ACM_CERTIFICATE_ARN `
    --default-actions Type=fixed-response,FixedResponseConfig='{ContentType=text/plain,MessageBody=Not Found,StatusCode=404}'
$httpsListenerArn = ($httpsListenerResponse | ConvertFrom-Json).Listeners[0].ListenerArn

# Create rules for backend
Write-Host "Creating rules for backend..."
aws elbv2 create-rule `
    --listener-arn $httpsListenerArn `
    --priority 1 `
    --conditions Field=host-header,Values="api.$env:DOMAIN_NAME" `
    --actions Type=forward,TargetGroupArn=$backendTargetGroupArn

# Create rules for frontend
Write-Host "Creating rules for frontend..."
aws elbv2 create-rule `
    --listener-arn $httpsListenerArn `
    --priority 2 `
    --conditions Field=host-header,Values=$env:DOMAIN_NAME `
    --actions Type=forward,TargetGroupArn=$frontendTargetGroupArn

# Update environment variables
Add-Content -Path .env -Value "`nALB_ARN=$albArn"
Add-Content -Path .env -Value "BACKEND_TARGET_GROUP_ARN=$backendTargetGroupArn"
Add-Content -Path .env -Value "FRONTEND_TARGET_GROUP_ARN=$frontendTargetGroupArn"

Write-Host "Load balancer setup completed successfully!"
Write-Host "ALB ARN: $albArn"
Write-Host "Backend Target Group ARN: $backendTargetGroupArn"
Write-Host "Frontend Target Group ARN: $frontendTargetGroupArn" 