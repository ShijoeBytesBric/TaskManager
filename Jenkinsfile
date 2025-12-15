pipeline {
    agent any
    
    environment {
        // Your Docker Credentials ID from Phase 2
        DOCKER_CREDS = credentials('dockerhub-creds')
        
        // Define your Docker Hub image names
        // REPLACE <YOUR_USER> WITH YOUR DOCKERHUB USERNAME
        BACKEND_IMAGE = "shijoe/task-backend"
        FRONTEND_IMAGE = "shijoe/task-frontend"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    echo "Building Backend..."
                    sh "docker build -t ${BACKEND_IMAGE}:latest ./backend"
                    
                    echo "Building Frontend..."
                    sh "docker build -t ${FRONTEND_IMAGE}:latest ./frontend"
                }
            }
        }
        
        stage('Push to Hub') {
            steps {
                script {
                    echo "Logging in..."
                    sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
                    
                    echo "Pushing images..."
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    echo "Deploying..."
                    
                    // 1. Generate a production compose file dynamically
                    // We connect to the network 'devops_default' so we can talk to the Postgres DB
                    // that is already running alongside Jenkins.
                    sh '''
                    cat <<EOF > docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: ${BACKEND_IMAGE}:latest
    container_name: task-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=task_db
      - DB_USER=postgres
      - DB_PASSWORD=password
      - DB_NAME=taskmanager
      - PORT=5000
    networks:
      - devops_default

  frontend:
    image: ${FRONTEND_IMAGE}:latest
    container_name: task-frontend
    restart: always
    ports:
      - "80:80"
    networks:
      - devops_default

networks:
  devops_default:
    external: true
EOF
                    '''
                    
                    // 2. Stop old containers and start new ones
                    // The "|| true" ensures the pipeline doesn't fail if containers don't exist yet
                    sh 'docker compose -f docker-compose.prod.yml down || true'
                    sh 'docker compose -f docker-compose.prod.yml up -d'
                    
                    // 3. Cleanup space
                    sh 'docker image prune -f'
                }
            }
        }
    }
}