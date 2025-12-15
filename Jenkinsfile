pipeline {
    agent any
    
    environment {
        // Your DockerHub credentials ID from Jenkins
        DOCKER_CREDS = credentials('dockerhub-creds')
        
        // Define image names here
        BACKEND_IMAGE = "<YOUR_DOCKERHUB_USERNAME>/task-backend"
        FRONTEND_IMAGE = "<YOUR_DOCKERHUB_USERNAME>/task-frontend"
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
                    echo 'Building Backend...'
                    sh "docker build -t ${BACKEND_IMAGE}:latest ./backend"
                    
                    echo 'Building Frontend...'
                    // Pass the backend URL as a build arg if needed
                    sh "docker build -t ${FRONTEND_IMAGE}:latest ./frontend"
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo 'Logging into Docker Hub...'
                    // This securely injects user/pass into the login command
                    sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
                    
                    echo 'Pushing images...'
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                }
            }
        }
        
        stage('Deploy (Local)') {
            steps {
                script {
                    echo 'Deploying with Docker Compose...'
                    
                    // Create the production compose file dynamically
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
      - DB_HOST=postgres
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
                    
                    // Run standard docker compose commands
                    sh 'docker compose -f docker-compose.prod.yml up -d --pull always'
                    
                    // Clean up dangling images to save space
                    sh 'docker image prune -f'
                }
            }
        }
    }
}