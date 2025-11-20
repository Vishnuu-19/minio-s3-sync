**☁️ Hybrid Cloud Storage Manager (MERN + MinIO + AWS)**
A full-stack MERN application that provides a seamless interface for uploading files to a local object storage server (MinIO) with the option to replicate data to the public cloud (AWS S3) on-demand.
This project leverages Docker to containerize the local infrastructure (Database, Storage, and Caching).

**🚀 Features**
Local-First Storage: Files are uploaded immediately to a self-hosted MinIO server (S3 compatible) running in a Docker container.
On-Demand Replication: Users can choose specific files to replicate/sync to a live AWS S3 bucket.
Metadata Management: File details (size, type, upload date, replication status) are stored in MongoDB.
Responsive UI: Built with React.js for a clean user experience.
Containerized Infrastructure: Redis, MongoDB, and MinIO are orchestrated using Docker.

**🛠️ Tech Stack**
    FrontendReact.js (Create React App / Vite)Axios (API requests)CSS/Tailwind (Styling)
    BackendNode.js & Express.js
    AWS SDK (For interacting with S3)
    MinIO Client / SDK (For interacting with local storage) Infrastructure (Dockerized)
    MinIO: Local object storage server (S3 compatible).
    MongoDB: NoSQL database for metadata.
    Redis: Used for caching/session management or job queues.

**📋 Prerequisites**
Before running this project, ensure you have the following installed:
    Node.js (v14+ recommended)
    Docker Desktop (Must be running)
    AWS Account (With an S3 Bucket created and IAM credentials)

**⚙️ Environmental Setup1. **
AWS Configuration
Create an IAM User in AWS with AmazonS3FullAccess (or specific bucket permissions) and note down the:
    Access Key ID
    Secret Access Key
    Bucket Region
    Bucket Name2. 
.env File
Create a .env file in the server (backend) directory:# Server Config
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/file-manager

# MinIO (Local)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=local-uploads

# AWS S3 (Cloud)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_aws_bucket_name

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
📦 Installation & Run InstructionsStep 1: Start Infrastructure (Docker)Ensure Docker Desktop is open. Run the following command to spin up MinIO, MongoDB, and Redis:# If you have a docker-compose.yml file
docker-compose up -d

# OR, if running manually:
# Run MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest
# Run Redis
docker run -d -p 6379:6379 --name redis redis:latest
# Run MinIO
docker run -d -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
Step 2: Backend SetupNavigate to the server directory and install dependencies:
cd server
npm install
npm start
The server should now be running on port 5000.Step 3: Frontend SetupOpen a new terminal, navigate to the client directory:cd client
npm install
npm start
The React application should open at http://localhost:3000.

📖 Usage GuideUpload: 
Click the upload button to select an image/file. The file is instantly saved to your local MinIO bucket.
View: The file appears in the list with a "Local" status.
Replicate: Click the "Replicate to AWS" button next to a file.
The backend retrieves the file from MinIO.
It uploads the file to your AWS S3 bucket.
Database status updates to "Replicated".

🏗️ Architecture Overview
Client sends file to Node API.
Node API streams file to MinIO Container.Node API saves file metadata to MongoDB Container.
(On User Action) Node API fetches object from MinIO and streams it to AWS S3.

