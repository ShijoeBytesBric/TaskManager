pipeline {
    agent any
    
    environment {
        DOCKER_CREDS = credentials('dockerhub-creds')
        
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

                    sh '''
cat <<EOF > docker-compose.yml
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
                    
                    sh 'docker compose up -d --pull always'
                    
                    sh 'docker image prune -f'
                }
            }
        }
    }
}