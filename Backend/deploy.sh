#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Deployment Process..."

# Navigate to the project root directory
cd ~/MedAssist

# Save the current git commit hash before fetching new code
OLD_COMMIT=$(git rev-parse HEAD)

echo "Fetching latest code from origin/main..."
git pull origin main

# Get the new commit hash
NEW_COMMIT=$(git rev-parse HEAD)

# Activate the Virtual Environment
echo "Activating virtual environment..."
source Backend/VE/bin/activate

# Check if requirements.txt changed using git diff
if git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -q 'Backend/requirements.txt'; then
    echo "Changes detected in requirements.txt. Installing dependencies..."
    pip install -r Backend/requirements.txt
else
    echo "No changes in requirements.txt. Skipping dependency installation."
fi

# Navigate to the Django backend directory
cd Backend/backend

# Check if any migration files changed
if git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -q -e 'migrations/' -e 'models.py'; then
    echo "Database schema changes detected. Running migrations..."
    python manage.py migrate
else
    echo "No schema changes detected. Skipping migrations."
fi

# Always collect static files just in case
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Restart Gunicorn to apply code changes
echo "Restarting Gunicorn service..."
sudo systemctl restart gunicorn

echo "Deployment completed successfully!"
