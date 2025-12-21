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

        stage('Deploy Monitoring Stack') {
            steps {
                script {
                    echo "Deploying monitoring..."
                    
                    sh '''
                    cat <<EOF > docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus/alert.rules.yml:/etc/prometheus/alert.rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - devops_default

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    networks:
      - devops_default

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: always
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    networks:
      - devops_default

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: always
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker:/var/lib/docker:ro
    ports:
      - "8081:8080"
    networks:
      - devops_default

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    restart: always
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:password@task_db:5432/taskmanager?sslmode=disable
    ports:
      - "9187:9187"
    networks:
      - devops_default

networks:
  devops_default:
    external: true

volumes:
  prometheus_data:
  grafana_data:
EOF
                    '''
                    
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
        }
    }
}