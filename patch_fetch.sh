#!/bin/bash
# This will overwrite the fetch routing section
sed -i "s|https://justicebot-backend-6pzy.onrender.com/api/petition|http://localhost:3000/api/petition|g" app.jsx
sed -i "s|Failed to fetch|Error reaching server|g" app.jsx
echo "Fetch routing patched successfully!"
