pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    environment {
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-credentials'
        IMAGE_NAME = 'ferdog96/bills-tracker-frontend'        
        PATH = "$WORKSPACE/bin:$PATH"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }        

        stage('Security Analysis') {
            parallel {
                stage('SCA Scanning (NPM)') {
                    steps {
                        sh '''
                            echo "Ejecutando escaneo de vulnerabilidades nativo..."
                            npm audit --audit-level=high || true
                        '''
                    }
                }
            }
        }

        stage('Lint & Format') {
            steps {
                sh 'npm run code:check'
            }
        }

        stage('Test Unit') {
            steps {
                sh 'npm run test'
            }
        }

        /* 
        // TODO: Descomentar cuando los tests de Playwright estén actualizados
        stage('Test E2E') {
            steps {
                withCredentials([
                    string(credentialsId: 'mapbox-token', variable: 'MAPBOX_ACCESS_TOKEN')
                ]) {
                    // Instalamos los navegadores requeridos Y sus dependencias del sistema operativo (--with-deps)
                    sh 'npx playwright install --with-deps chromium firefox'
                    sh 'npm run test:e2e:ci'
                }
            }
        }
        */

        stage('Docker Build and Push') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def commitSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    withCredentials([
                        usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME'),
                        string(credentialsId: 'mapbox-token', variable: 'MAPBOX_ACCESS_TOKEN')
                    ]) {
                        def apiBaseUrl = 'https://bills.fwabab.dev'
                        
                        // 1. Construir la imagen inyectando las variables
                        sh """
                            docker build \\
                            --build-arg MAPBOX_ACCESS_TOKEN=\"\$MAPBOX_ACCESS_TOKEN\" \\
                            --build-arg API_BASE_URL=\"${apiBaseUrl}\" \\
                            -t ${env.IMAGE_NAME}:${commitSha} -f Dockerfile .
                        """
                        
                        // 2. Escanear vulnerabilidades con Trivy
                        sh """
                            docker run --rm \\
                            -v /var/run/docker.sock:/var/run/docker.sock \\
                            aquasec/trivy image \\
                            --severity HIGH,CRITICAL \\
                            --ignore-unfixed \\
                            --exit-code 1 \\
                            ${env.IMAGE_NAME}:${commitSha}
                        """

                        // 3. Login y Push
                        sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin"
                        sh "docker push ${env.IMAGE_NAME}:${commitSha}"
                        
                        sh "docker tag ${env.IMAGE_NAME}:${commitSha} ${env.IMAGE_NAME}:latest"
                        sh "docker push ${env.IMAGE_NAME}:latest"
                    }
                }
            }
        }

        stage('Deploy to VPS (Production)') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def projectDir = '~/bills-tracker-frontend-prod'
                    
                    withCredentials([
                        string(credentialsId: 'vps-ip', variable: 'VPS_IP'),
                        string(credentialsId: 'vps-user', variable: 'VPS_USER')
                    ]) {
                        sshagent(['vps-ssh-key']) {
                            // 1. Preparar el directorio
                            sh """
                                ssh -o StrictHostKeyChecking=no \$VPS_USER@\$VPS_IP '
                                    mkdir -p ${projectDir} &&
                                    sudo chown -R \$USER:\$USER ${projectDir} || true
                                    chmod -R u+w ${projectDir} || true
                                    cd ${projectDir} && rm -rf docker-compose.prod.yml
                                '
                            """

                            // 2. Copiar docker-compose.prod.yml
                            sh "scp -o StrictHostKeyChecking=no docker-compose.prod.yml \$VPS_USER@\$VPS_IP:${projectDir}/"
                            
                            // 3. Actualizar la imagen y reiniciar
                            sh """
                                ssh -o StrictHostKeyChecking=no \$VPS_USER@\$VPS_IP '
                                    cd ${projectDir} &&
                                    docker compose -f docker-compose.prod.yml pull &&
                                    docker compose -f docker-compose.prod.yml up -d &&
                                    docker image prune -f
                                '
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            script {
                sh 'docker logout || true'
            }
        }
        success {
            echo 'Pipeline de Frontend completado exitosamente.'
        }
        failure {
            echo 'Error en el pipeline de Frontend.'
        }
    }
}
