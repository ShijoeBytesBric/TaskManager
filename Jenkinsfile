pipeline {
    agent any
    
    environment {
        DOCKER_CREDS = credentials('dockerhub-creds')
        
        BACKEND_IMAGE = "shijoe/task-backend"
        FRONTEND_IMAGE = "shijoe/task-frontend"

        DB_PASSWORD = "postgres123"
        GRAFANA_PASSWORD = "admin123"
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

                    sh 'docker compose -f docker-compose.yml up -d --pull always'
                    sh 'docker image prune -f'
                }
            }
        }

        stage('Deploy Monitoring Stack') {
            steps {
                script {
                    echo "Deploying monitoring..."
                    
                    sh 'docker compose -f docker-compose.monitoring.yml up -d'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sleep 20
                    
                    sh '''
                        echo "Checking Backend..."
                        curl -f http://localhost:5000/health || echo "Backend not ready"
                        
                        echo "Checking Prometheus..."
                        curl -f http://localhost:9090/-/healthy || echo "Prometheus not ready"
                        
                        echo "Checking Grafana..."
                        curl -f http://localhost:3001/api/health || echo "Grafana not ready"
                        
                        echo "Checking Metrics..."
                        curl http://localhost:5000/metrics || echo "Metrics not available yet"
                    '''
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    sh 'docker image prune -f'
                }
            }
        }
    }
    
    post {
        success {
            echo '========================================='
            echo '✓ Deployment Successful!'
            echo '========================================='
            echo 'Access your services:'
            echo '  Frontend:    http://YOUR_EC2_IP:80'
            echo '  Backend:     http://YOUR_EC2_IP:5000'
            echo '  Prometheus:  http://YOUR_EC2_IP:9090'
            echo '  Grafana:     http://YOUR_EC2_IP:3001'
            echo ''
            echo 'Grafana login: admin / admin123'
            echo '========================================='
        }
        failure {
            echo 'Deployment failed!'
            sh 'docker compose -f docker-compose.prod.yml logs --tail=50 || true'
            sh 'docker compose -f docker-compose.monitoring.yml logs --tail=50 || true'
        }
    }
}