#!/bin/bash

# Generate TLS certificates for development
# For production, use proper SSL certificates from a CA

CERT_DIR="../certificates"
DAYS=365

# Create certificates directory if it doesn't exist
mkdir -p $CERT_DIR

echo "Generating TLS certificates for development..."

# Generate private key
openssl genrsa -out $CERT_DIR/private-key.pem 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/private-key.pem -out $CERT_DIR/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days $DAYS -in $CERT_DIR/csr.pem -signkey $CERT_DIR/private-key.pem -out $CERT_DIR/certificate.pem

# Set appropriate permissions
chmod 600 $CERT_DIR/private-key.pem
chmod 644 $CERT_DIR/certificate.pem

# Clean up CSR file
rm $CERT_DIR/csr.pem

echo "TLS certificates generated successfully!"
echo "Private key: $CERT_DIR/private-key.pem"
echo "Certificate: $CERT_DIR/certificate.pem"
echo ""
echo "Note: These are self-signed certificates for development only."
echo "For production, obtain proper SSL certificates from a Certificate Authority."
echo ""
echo "To trust the certificate in your browser:"
echo "1. Open https://localhost:3443"
echo "2. Click 'Advanced' or 'Show Details'"
echo "3. Click 'Proceed to localhost (unsafe)' or 'Accept the Risk and Continue'"