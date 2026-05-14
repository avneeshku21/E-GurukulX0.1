pipeline {
  agent {
    label 'linux'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    VERCEL_ORG_ID = credentials('VERCEL_ORG_ID')
    VERCEL_PROJECT_ID = credentials('VERCEL_PROJECT_ID')
    VERCEL_TOKEN = credentials('VERCEL_TOKEN')
    HF_TOKEN = credentials('HF_TOKEN')
    HF_SPACE_REPO = credentials('HF_SPACE_REPO')
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Frontend') {
      steps {
        dir('frontend') {
          sh 'npm ci'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    stage('Install Backend') {
      steps {
        dir('backend/server') {
          sh 'npm ci --omit=dev'
        }
      }
    }

    stage('Deploy Frontend To Vercel') {
      steps {
        dir('frontend') {
          sh '''
            mkdir -p .vercel
            cat > .vercel/project.json <<EOF
            {"projectId":"${VERCEL_PROJECT_ID}","orgId":"${VERCEL_ORG_ID}"}
            EOF
          '''
          sh 'npx vercel build --prod --token=$VERCEL_TOKEN'
          sh 'npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN'
        }
      }
    }

    stage('Deploy Backend To Hugging Face') {
      steps {
        sh '''
          rm -rf .hf-space-sync
          mkdir -p .hf-space-sync
          git clone https://oauth2:${HF_TOKEN}@huggingface.co/spaces/${HF_SPACE_REPO} .hf-space-sync
          rsync -a --delete backend/ .hf-space-sync/
          cd .hf-space-sync
          git config user.email "jenkins@local"
          git config user.name "Jenkins"
          git add .
          git diff --cached --quiet || git commit -m "Deploy backend from Jenkins ${BUILD_NUMBER}"
          git push origin main
        '''
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}