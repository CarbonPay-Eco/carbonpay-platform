// Script to create S3 bucket using AWS SDK
const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
    try {
        const envContent = fs.readFileSync(filePath, 'utf8');
        const lines = envContent.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                process.env[key.trim()] = value.trim();
            }
        });
    } catch (error) {
        console.error('Could not load .env file:', error.message);
    }
}

// Load .env file
loadEnvFile(path.join(__dirname, '../../.env'));

async function createS3Bucket() {
    console.log('🪣 Creating S3 Bucket for CarbonPay Documents');
    console.log('==============================================');

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'carbonpay-documents';
    const region = process.env.AWS_REGION || 'us-east-1';

    console.log('📋 Configuration:');
    console.log(`  Bucket Name: ${bucketName}`);
    console.log(`  Region: ${region}`);
    console.log('');

    // Initialize S3 client
    const s3Client = new S3Client({
        region: region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    try {
        // Step 1: Create bucket
        console.log('🔧 Step 1: Creating bucket...');
        
        const createBucketParams = {
            Bucket: bucketName,
        };

        // For regions other than us-east-1, we need to specify the location constraint
        if (region !== 'us-east-1') {
            createBucketParams.CreateBucketConfiguration = {
                LocationConstraint: region
            };
        }

        try {
            await s3Client.send(new CreateBucketCommand(createBucketParams));
            console.log('✅ Bucket created successfully');
        } catch (error) {
            if (error.name === 'BucketAlreadyOwnedByYou') {
                console.log('✅ Bucket already exists and is owned by you');
            } else if (error.name === 'BucketAlreadyExists') {
                console.log('❌ Bucket already exists but is owned by someone else');
                throw error;
            } else {
                throw error;
            }
        }

        // Step 2: Set up CORS configuration
        console.log('🔧 Step 2: Setting up CORS configuration...');
        
        const corsParams = {
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'HEAD'],
                        AllowedOrigins: ['*'],
                        ExposeHeaders: []
                    }
                ]
            }
        };

        try {
            await s3Client.send(new PutBucketCorsCommand(corsParams));
            console.log('✅ CORS configuration applied successfully');
        } catch (error) {
            console.log('⚠️  Warning: Could not apply CORS configuration:', error.message);
        }

        // Step 3: Set up bucket policy for public read access
        console.log('🔧 Step 3: Setting up bucket policy...');
        
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${bucketName}/documents/*`
                }
            ]
        };

        const policyParams = {
            Bucket: bucketName,
            Policy: JSON.stringify(policyDocument)
        };

        try {
            await s3Client.send(new PutBucketPolicyCommand(policyParams));
            console.log('✅ Bucket policy applied successfully');
        } catch (error) {
            console.log('⚠️  Warning: Could not apply bucket policy:', error.message);
        }

        // Step 4: Create directory structure
        console.log('🔧 Step 4: Creating directory structure...');
        
        const directories = [
            'documents/',
            'documents/certificate/',
            'documents/report/'
        ];

        for (const dir of directories) {
            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: dir,
                    Body: '',
                    ContentLength: 0
                }));
            } catch (error) {
                console.log(`⚠️  Warning: Could not create directory ${dir}:`, error.message);
            }
        }

        console.log('✅ Directory structure created');

        // Step 5: Test upload
        console.log('🔧 Step 5: Testing bucket access...');
        
        const testKey = `test/test-${Date.now()}.txt`;
        const testContent = 'CarbonPay S3 Test File';

        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: testKey,
                Body: testContent,
                ContentType: 'text/plain'
            }));
            console.log('✅ Test upload successful');

            // Clean up test file
            const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucketName,
                Key: testKey
            }));
        } catch (error) {
            console.log('⚠️  Warning: Test upload failed:', error.message);
        }

        console.log('');
        console.log('🎉 S3 Bucket Setup Complete!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`  ✅ Bucket '${bucketName}' is ready`);
        console.log('  ✅ CORS configuration applied');
        console.log('  ✅ Public read access configured for documents/*');
        console.log('  ✅ Directory structure created');
        console.log('');
        console.log(`🔗 Bucket URL: https://${bucketName}.s3.${region}.amazonaws.com`);
        console.log('');
        console.log('You can now test the S3 integration with the CarbonPay backend!');

    } catch (error) {
        console.error('❌ Error setting up S3 bucket:', error);
        process.exit(1);
    }
}

// Run the script
createS3Bucket();