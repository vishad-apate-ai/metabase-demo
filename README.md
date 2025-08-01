> [!IMPORTANT]  
> **To use your own Metabase**, use the release branch that matches your Metabase Enterprise Edition's major version. For example, if you're using Metabase 1.53.x, use the `53-stable` branch. [More info](https://www.metabase.com/docs/latest/embedding/sdk/version).
> 
> **To spin up a new Metabase**, you can use any version branch and run the sample app in the Docker container with the corresponding version of Metabase. You'll need a Pro/Enterprise token, which you can get with a [free trial of Pro](https://www.metabase.com/pricing/).

# Sample React application for Metabase's Embedded analytics SDK

A quick app to kick the tires on the [Embedded analytics SDK](https://www.metabase.com/docs/latest/embedding/sdk/introduction).

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose (for Docker setup)
- kubectl (for Kubernetes setup)
- A Kubernetes cluster (local like Minikube, Docker Desktop, or cloud-based)
- Metabase Pro/Enterprise token

## Setup Options

This project supports two deployment methods:

### Option 1: Docker Compose (Recommended for Development)

#### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd metabase-nodejs-react-sdk-embedding-sample
   ```

2. **Create environment file**
   ```bash
   cp .env.docker.example .env.docker
   ```
   
   Edit `.env.docker` with your configuration:
   ```env
   MB_PORT=3000
   CLIENT_PORT=3100
   AUTH_PROVIDER_PORT=8080
   PREMIUM_EMBEDDING_TOKEN=your_metabase_pro_token_here
   METABASE_JWT_SHARED_SECRET=your_jwt_secret_here
   ```

3. **Start the application**
   ```bash
   npm start
   # or
   docker compose --env-file .env.docker up
   ```

4. **Access the application**
   - Metabase: http://localhost:3000
   - React Client: http://localhost:3100
   - Auth Provider: http://localhost:8080

#### Manual Setup

1. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   
   # Install server dependencies
   cd server && npm install && cd ..
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   MB_PORT=3000
   CLIENT_PORT=3100
   AUTH_PROVIDER_PORT=8080
   PREMIUM_EMBEDDING_TOKEN=your_metabase_pro_token_here
   METABASE_JWT_SHARED_SECRET=your_jwt_secret_here
   METABASE_INSTANCE_URL=http://localhost:3000
   ```

3. **Start services individually**
   ```bash
   # Terminal 1: Start Metabase
   docker run -p 3000:3000 \
     -e MB_CONFIG_FILE_PATH="./app/init-config.yml" \
     -e MB_JETTY_PORT=3000 \
     -e MB_EDITION=ee \
     -e MB_SITE_URL="http://localhost:3000/" \
     -e MB_JWT_SHARED_SECRET=your_jwt_secret_here \
     -e MB_SETUP_TOKEN=your_metabase_pro_token_here \
     -e MB_PREMIUM_EMBEDDING_TOKEN=your_metabase_pro_token_here \
     -e MB_JWT_IDENTITY_PROVIDER_URI="http://localhost:8080/sso/metabase" \
     metabase/metabase-enterprise:v1.55.x

   # Terminal 2: Start auth server
   cd server && npm start

   # Terminal 3: Start React client
   cd client && npm start
   ```

### Option 2: Kubernetes Deployment

#### Prerequisites

- kubectl configured to access your cluster
- A Kubernetes cluster (Minikube, Docker Desktop, or cloud-based)

#### Setup Instructions

1. **Create Kubernetes namespace**
   ```bash
   kubectl create namespace metabase-sdk-sample
   kubectl config set-context --current --namespace=metabase-sdk-sample
   ```

2. **Create ConfigMap for environment variables**
   ```bash
   kubectl create configmap app-config \
     --from-literal=METABASE_JWT_SHARED_SECRET=your_jwt_secret_here \
     --from-literal=PREMIUM_EMBEDDING_TOKEN=your_metabase_pro_token_here \
     --from-literal=MB_PORT=3000 \
     --from-literal=CLIENT_PORT=3100 \
     --from-literal=AUTH_PROVIDER_PORT=8080
   ```

3. **Deploy Metabase**
   ```bash
   kubectl apply -f k8s/metabase-deployment.yaml
   kubectl apply -f k8s/metabase-service.yaml
   ```

4. **Deploy Auth Server**
   ```bash
   kubectl apply -f k8s/auth-server-deployment.yaml
   kubectl apply -f k8s/auth-server-service.yaml
   ```

5. **Deploy React Client**
   ```bash
   kubectl apply -f k8s/client-deployment.yaml
   kubectl apply -f k8s/client-service.yaml
   ```

6. **Set up port forwarding to localhost:3000**
   ```bash
   # Forward Metabase to localhost:3000
   kubectl port-forward service/metabase-service 3000:3000 -n metabase-sdk-sample
   
   # Forward React client to localhost:3100
   kubectl port-forward service/client-service 3100:3100 -n metabase-sdk-sample
   
   # Forward Auth server to localhost:8080
   kubectl port-forward service/auth-server-service 8080:8080 -n metabase-sdk-sample
   ```

7. **Access the application**
   - Metabase: http://localhost:3000
   - React Client: http://localhost:3100
   - Auth Provider: http://localhost:8080

#### Kubernetes Manifests

Create the following files in a `k8s/` directory:

**k8s/metabase-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metabase
spec:
  replicas: 1
  selector:
    matchLabels:
      app: metabase
  template:
    metadata:
      labels:
        app: metabase
    spec:
      containers:
      - name: metabase
        image: metabase/metabase-enterprise:v1.55.x
        ports:
        - containerPort: 3000
        env:
        - name: MB_CONFIG_FILE_PATH
          value: "./app/init-config.yml"
        - name: MB_JETTY_PORT
          value: "3000"
        - name: MB_EDITION
          value: "ee"
        - name: MB_SITE_URL
          value: "http://localhost:3000/"
        - name: MB_JWT_SHARED_SECRET
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: METABASE_JWT_SHARED_SECRET
        - name: MB_SETUP_TOKEN
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: PREMIUM_EMBEDDING_TOKEN
        - name: MB_PREMIUM_EMBEDDING_TOKEN
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: PREMIUM_EMBEDDING_TOKEN
        - name: MB_JWT_IDENTITY_PROVIDER_URI
          value: "http://auth-server-service:8080/sso/metabase"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

**k8s/metabase-service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: metabase-service
spec:
  selector:
    app: metabase
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

**k8s/auth-server-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-server
  template:
    metadata:
      labels:
        app: auth-server
    spec:
      containers:
      - name: auth-server
        image: node:18-alpine
        workingDir: /app
        command: ["npm", "start"]
        ports:
        - containerPort: 8080
        env:
        - name: AUTH_PROVIDER_PORT
          value: "8080"
        - name: METABASE_INSTANCE_URL
          value: "http://metabase-service:3000"
        - name: METABASE_JWT_SHARED_SECRET
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: METABASE_JWT_SHARED_SECRET
        volumeMounts:
        - name: app-code
          mountPath: /app
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
      volumes:
      - name: app-code
        hostPath:
          path: ./server
          type: Directory
```

**k8s/auth-server-service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-server-service
spec:
  selector:
    app: auth-server
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
```

**k8s/client-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: client
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client
  template:
    metadata:
      labels:
        app: client
    spec:
      containers:
      - name: client
        image: node:18-alpine
        workingDir: /app
        command: ["npm", "start"]
        ports:
        - containerPort: 3100
        env:
        - name: CLIENT_PORT
          value: "3100"
        - name: VITE_METABASE_INSTANCE_URL
          value: "http://localhost:3000"
        volumeMounts:
        - name: app-code
          mountPath: /app
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
      volumes:
      - name: app-code
        hostPath:
          path: ./client
          type: Directory
```

**k8s/client-service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: client-service
spec:
  selector:
    app: client
  ports:
  - port: 3100
    targetPort: 3100
  type: ClusterIP
```

#### Troubleshooting Kubernetes Setup

1. **Check pod status**
   ```bash
   kubectl get pods -n metabase-sdk-sample
   kubectl describe pod <pod-name> -n metabase-sdk-sample
   ```

2. **Check logs**
   ```bash
   kubectl logs <pod-name> -n metabase-sdk-sample
   kubectl logs -f <pod-name> -n metabase-sdk-sample
   ```

3. **Check services**
   ```bash
   kubectl get services -n metabase-sdk-sample
   ```

4. **Access Metabase directly in cluster**
   ```bash
   kubectl exec -it <metabase-pod-name> -n metabase-sdk-sample -- curl http://localhost:3000/api/health
   ```

## Quickstart

For getting up and running, see the [Quickstart with sample app](https://www.metabase.com/docs/latest/embedding/sdk/quickstart-with-sample-app).

## Development

### Project Structure
```
├── client/                 # React frontend application
├── server/                 # Node.js authentication server
├── metabase/              # Metabase configuration
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml     # Docker Compose configuration
└── README.md             # This file
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MB_PORT` | Metabase port | 3000 |
| `CLIENT_PORT` | React client port | 3100 |
| `AUTH_PROVIDER_PORT` | Auth server port | 8080 |
| `PREMIUM_EMBEDDING_TOKEN` | Metabase Pro/Enterprise token | Required |
| `METABASE_JWT_SHARED_SECRET` | JWT signing secret | Required |
| `METABASE_INSTANCE_URL` | Metabase instance URL | http://localhost:3000 |

## Reporting issues

Please report bugs or feature requests as issues in this repository. Please do not report security vulnerabilities on the public GitHub issue tracker. Our Security Policy describes [the procedure](https://github.com/metabase/metabase/security#reporting-a-vulnerability) for disclosing security issues.

## Author

[Metabase](https://metabase.com)

## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more info.
