#!/bin/bash

# Function to generate a secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

# Function to prompt for sensitive values
prompt_for_value() {
    read -p "Enter $1 (press Enter to generate random): " value
    if [ -z "$value" ]; then
        value=$(generate_secret)
    fi
    echo "$value"
}

# Create environment files if they don't exist
for env in development staging production; do
    if [ ! -f ".env.$env" ]; then
        cp .env.example ".env.$env"
        echo "Created .env.$env"
    fi
done

# Prompt for sensitive values
echo "Setting up environment variables..."
echo "Note: Press Enter to generate random values for sensitive data"

# Development environment
echo -e "\nDevelopment Environment:"
dev_token=$(prompt_for_value "development auth token")
dev_refresh=$(prompt_for_value "development refresh token")
dev_csrf=$(prompt_for_value "development CSRF token")

# Staging environment
echo -e "\nStaging Environment:"
staging_token=$(prompt_for_value "staging auth token")
staging_refresh=$(prompt_for_value "staging refresh token")
staging_csrf=$(prompt_for_value "staging CSRF token")

# Production environment
echo -e "\nProduction Environment:"
prod_token=$(prompt_for_value "production auth token")
prod_refresh=$(prompt_for_value "production refresh token")
prod_csrf=$(prompt_for_value "production CSRF token")

# Update environment files
sed -i '' "s/VITE_AUTH_TOKEN_KEY=.*/VITE_AUTH_TOKEN_KEY=$dev_token/" .env.development
sed -i '' "s/VITE_REFRESH_TOKEN_KEY=.*/VITE_REFRESH_TOKEN_KEY=$dev_refresh/" .env.development
sed -i '' "s/VITE_CSRF_TOKEN_KEY=.*/VITE_CSRF_TOKEN_KEY=$dev_csrf/" .env.development

sed -i '' "s/VITE_AUTH_TOKEN_KEY=.*/VITE_AUTH_TOKEN_KEY=$staging_token/" .env.staging
sed -i '' "s/VITE_REFRESH_TOKEN_KEY=.*/VITE_REFRESH_TOKEN_KEY=$staging_refresh/" .env.staging
sed -i '' "s/VITE_CSRF_TOKEN_KEY=.*/VITE_CSRF_TOKEN_KEY=$staging_csrf/" .env.staging

sed -i '' "s/VITE_AUTH_TOKEN_KEY=.*/VITE_AUTH_TOKEN_KEY=$prod_token/" .env.production
sed -i '' "s/VITE_REFRESH_TOKEN_KEY=.*/VITE_REFRESH_TOKEN_KEY=$prod_refresh/" .env.production
sed -i '' "s/VITE_CSRF_TOKEN_KEY=.*/VITE_CSRF_TOKEN_KEY=$prod_csrf/" .env.production

echo -e "\nEnvironment setup complete!"
echo "Please store the generated values securely and never commit them to version control." 