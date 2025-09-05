#!/bin/bash

# Script de despliegue automatizado para WebSocket de TillUp POS
# Ejecutar con: bash deploy-websocket.sh

set -e

echo "🚀 Iniciando despliegue de WebSocket para TillUp POS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
REGION="us-east-1"
CONNECTIONS_TABLE="TillUpConnections"
USERDATA_TABLE="TillUpUserData"
LAMBDA_ROLE="TillUpWebSocketRole"

echo -e "${BLUE}📋 Configuración:${NC}"
echo "  Región: $REGION"
echo "  Tabla Conexiones: $CONNECTIONS_TABLE"
echo "  Tabla Datos: $USERDATA_TABLE"
echo ""

# Función para verificar si AWS CLI está instalado
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI no está instalado${NC}"
        echo "Instala AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI encontrado${NC}"
}

# Función para verificar credenciales AWS
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ Credenciales AWS no configuradas${NC}"
        echo "Ejecuta: aws configure"
        exit 1
    fi
    echo -e "${GREEN}✅ Credenciales AWS válidas${NC}"
}

# Función para crear tablas DynamoDB
create_dynamodb_tables() {
    echo -e "${YELLOW}📊 Creando tablas DynamoDB...${NC}"
    
    # Tabla de conexiones
    if aws dynamodb describe-table --table-name $CONNECTIONS_TABLE --region $REGION &> /dev/null; then
        echo -e "${YELLOW}⚠️  Tabla $CONNECTIONS_TABLE ya existe${NC}"
    else
        aws dynamodb create-table \
            --table-name $CONNECTIONS_TABLE \
            --attribute-definitions \
                AttributeName=connectionId,AttributeType=S \
            --key-schema \
                AttributeName=connectionId,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --time-to-live-specification \
                AttributeName=ttl,Enabled=true \
            --region $REGION
        echo -e "${GREEN}✅ Tabla $CONNECTIONS_TABLE creada${NC}"
    fi
    
    # Tabla de datos de usuario
    if aws dynamodb describe-table --table-name $USERDATA_TABLE --region $REGION &> /dev/null; then
        echo -e "${YELLOW}⚠️  Tabla $USERDATA_TABLE ya existe${NC}"
    else
        aws dynamodb create-table \
            --table-name $USERDATA_TABLE \
            --attribute-definitions \
                AttributeName=userId,AttributeType=S \
            --key-schema \
                AttributeName=userId,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region $REGION
        echo -e "${GREEN}✅ Tabla $USERDATA_TABLE creada${NC}"
    fi
}

# Función para crear rol IAM
create_iam_role() {
    echo -e "${YELLOW}🔐 Creando rol IAM...${NC}"
    
    # Política de confianza
    cat > trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

    # Política de permisos
    cat > lambda-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:$REGION:*:table/$CONNECTIONS_TABLE",
                "arn:aws:dynamodb:$REGION:*:table/$USERDATA_TABLE"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "execute-api:ManageConnections"
            ],
            "Resource": "arn:aws:execute-api:*:*:*"
        }
    ]
}
EOF

    # Crear rol si no existe
    if aws iam get-role --role-name $LAMBDA_ROLE &> /dev/null; then
        echo -e "${YELLOW}⚠️  Rol $LAMBDA_ROLE ya existe${NC}"
    else
        aws iam create-role \
            --role-name $LAMBDA_ROLE \
            --assume-role-policy-document file://trust-policy.json
        
        aws iam put-role-policy \
            --role-name $LAMBDA_ROLE \
            --policy-name TillUpWebSocketPolicy \
            --policy-document file://lambda-policy.json
        
        echo -e "${GREEN}✅ Rol IAM $LAMBDA_ROLE creado${NC}"
        
        # Esperar a que el rol se propague
        echo -e "${YELLOW}⏳ Esperando propagación del rol...${NC}"
        sleep 10
    fi
    
    # Limpiar archivos temporales
    rm -f trust-policy.json lambda-policy.json
}

# Función para crear funciones Lambda
create_lambda_functions() {
    echo -e "${YELLOW}⚡ Creando funciones Lambda...${NC}"
    
    # Obtener ARN del rol
    ROLE_ARN=$(aws iam get-role --role-name $LAMBDA_ROLE --query 'Role.Arn' --output text)
    
    # Función Connect
    if aws lambda get-function --function-name TillUpWebSocketConnect --region $REGION &> /dev/null; then
        echo -e "${YELLOW}⚠️  Función TillUpWebSocketConnect ya existe${NC}"
    else
        cd aws-lambda
        zip -r connect.zip index.py
        aws lambda create-function \
            --function-name TillUpWebSocketConnect \
            --runtime python3.12 \
            --role $ROLE_ARN \
            --handler index.handler \
            --zip-file fileb://connect.zip \
            --region $REGION
        rm connect.zip
        cd ..
        echo -e "${GREEN}✅ Función TillUpWebSocketConnect creada${NC}"
    fi
    
    # Función Disconnect
    if aws lambda get-function --function-name TillUpWebSocketDisconnect --region $REGION &> /dev/null; then
        echo -e "${YELLOW}⚠️  Función TillUpWebSocketDisconnect ya existe${NC}"
    else
        cd aws-lambda
        zip -r disconnect.zip disconnect.py
        aws lambda create-function \
            --function-name TillUpWebSocketDisconnect \
            --runtime python3.12 \
            --role $ROLE_ARN \
            --handler disconnect.lambda_handler \
            --zip-file fileb://disconnect.zip \
            --region $REGION
        rm disconnect.zip
        cd ..
        echo -e "${GREEN}✅ Función TillUpWebSocketDisconnect creada${NC}"
    fi
    
    # Función Message
    if aws lambda get-function --function-name TillUpWebSocketMessage --region $REGION &> /dev/null; then
        echo -e "${YELLOW}⚠️  Función TillUpWebSocketMessage ya existe${NC}"
    else
        cd aws-lambda
        zip -r message.zip lambda_function.py
        aws lambda create-function \
            --function-name TillUpWebSocketMessage \
            --runtime python3.12 \
            --role $ROLE_ARN \
            --handler lambda_function.lambda_handler \
            --zip-file fileb://message.zip \
            --region $REGION
        rm message.zip
        cd ..
        echo -e "${GREEN}✅ Función TillUpWebSocketMessage creada${NC}"
    fi
}

# Función para crear API Gateway WebSocket
create_api_gateway() {
    echo -e "${YELLOW}🌐 Creando API Gateway WebSocket...${NC}"
    
    # Crear API
    API_ID=$(aws apigatewayv2 create-api \
        --name TillUpWebSocketAPI \
        --protocol-type WEBSOCKET \
        --route-selection-expression '$request.body.action' \
        --region $REGION \
        --query 'ApiId' \
        --output text)
    
    echo -e "${GREEN}✅ API Gateway creado con ID: $API_ID${NC}"
    
    # Obtener ARNs de las funciones Lambda
    CONNECT_ARN=$(aws lambda get-function --function-name TillUpWebSocketConnect --region $REGION --query 'Configuration.FunctionArn' --output text)
    DISCONNECT_ARN=$(aws lambda get-function --function-name TillUpWebSocketDisconnect --region $REGION --query 'Configuration.FunctionArn' --output text)
    MESSAGE_ARN=$(aws lambda get-function --function-name TillUpWebSocketMessage --region $REGION --query 'Configuration.FunctionArn' --output text)
    
    # Crear integraciones
    CONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$CONNECT_ARN/invocations" \
        --region $REGION \
        --query 'IntegrationId' \
        --output text)
    
    DISCONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$DISCONNECT_ARN/invocations" \
        --region $REGION \
        --query 'IntegrationId' \
        --output text)
    
    MESSAGE_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$MESSAGE_ARN/invocations" \
        --region $REGION \
        --query 'IntegrationId' \
        --output text)
    
    # Crear rutas
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key '$connect' \
        --target "integrations/$CONNECT_INTEGRATION_ID" \
        --region $REGION
    
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key '$disconnect' \
        --target "integrations/$DISCONNECT_INTEGRATION_ID" \
        --region $REGION
    
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key '$default' \
        --target "integrations/$MESSAGE_INTEGRATION_ID" \
        --region $REGION
    
    # Dar permisos a API Gateway para invocar Lambda
    aws lambda add-permission \
        --function-name TillUpWebSocketConnect \
        --statement-id websocket-connect \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*" \
        --region $REGION
    
    aws lambda add-permission \
        --function-name TillUpWebSocketDisconnect \
        --statement-id websocket-disconnect \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*" \
        --region $REGION
    
    aws lambda add-permission \
        --function-name TillUpWebSocketMessage \
        --statement-id websocket-message \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*" \
        --region $REGION
    
    # Crear deployment
    aws apigatewayv2 create-deployment \
        --api-id $API_ID \
        --region $REGION
    
    # Crear stage
    aws apigatewayv2 create-stage \
        --api-id $API_ID \
        --stage-name prod \
        --region $REGION
    
    # URL final
    WEBSOCKET_URL="wss://$API_ID.execute-api.$REGION.amazonaws.com/prod"
    
    echo -e "${GREEN}✅ API Gateway WebSocket configurado${NC}"
    echo -e "${BLUE}🔗 URL WebSocket: $WEBSOCKET_URL${NC}"
    
    # Actualizar archivo de configuración
    cat > websocket-config.json << EOF
{
    "apiId": "$API_ID",
    "region": "$REGION", 
    "stage": "prod",
    "url": "$WEBSOCKET_URL"
}
EOF
    
    echo -e "${GREEN}✅ Configuración guardada en websocket-config.json${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}🔄 Verificando prerrequisitos...${NC}"
    check_aws_cli
    check_aws_credentials
    
    echo -e "${BLUE}📊 Creando infraestructura...${NC}"
    create_dynamodb_tables
    create_iam_role
    create_lambda_functions
    create_api_gateway
    
    echo ""
    echo -e "${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Próximos pasos:${NC}"
    echo "1. Actualiza la URL en websocket-sync-client.js con la URL generada"
    echo "2. Prueba la conexión con test-sync.html"
    echo "3. Configura un usuario en la aplicación principal"
    echo ""
    echo -e "${BLUE}📄 Archivos generados:${NC}"
    echo "- websocket-config.json (configuración de la API)"
    echo ""
    echo -e "${YELLOW}⚠️  Recuerda:${NC}"
    echo "- Las tablas DynamoDB están en modo PAY_PER_REQUEST"
    echo "- Las funciones Lambda tienen logs en CloudWatch"
    echo "- Puedes monitorear las conexiones en la consola de AWS"
}

# Ejecutar función principal
main "$@"