import json
import boto3
import logging
from datetime import datetime

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Clientes AWS
dynamodb = boto3.resource('dynamodb')

# Nombres de tablas
CONNECTIONS_TABLE = 'TillUpConnections'

def handler(event, context):
    """Handler para conexiones WebSocket"""
    try:
        connection_id = event['requestContext']['connectionId']
        query_params = event.get('queryStringParameters', {}) or {}
        
        # Log completo del evento para debugging
        logger.info(f"Full event: {json.dumps(event, default=str)}")
        
        user_id = query_params.get('userId')
        device_id = query_params.get('deviceId')
        token = query_params.get('token')
        
        logger.info(f"Connect request - User: {user_id}, Device: {device_id}, Connection: {connection_id}")
        logger.info(f"Query params: {query_params}")
        
        # Validar token
        if token != 'tillup_test':
            logger.warning(f"Invalid token: {token}")
            return {'statusCode': 401, 'body': 'Invalid token'}
        
        if not user_id or not device_id:
            logger.warning(f"Missing parameters - User: {user_id}, Device: {device_id}")
            return {'statusCode': 400, 'body': 'Missing userId or deviceId'}
        
        # Guardar conexión en DynamoDB
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        
        item = {
            'connectionId': connection_id,
            'userId': user_id,
            'deviceId': device_id,
            'connectedAt': datetime.now().isoformat(),
            'ttl': int(datetime.now().timestamp()) + 86400  # 24 horas
        }
        
        logger.info(f"Saving connection to DynamoDB: {item}")
        
        connections_table.put_item(Item=item)
        
        logger.info(f"Connection saved successfully for {user_id}")
        
        return {'statusCode': 200, 'body': 'Connected'}
        
    except Exception as e:
        logger.error(f"Connect error: {str(e)}")
        return {'statusCode': 500, 'body': 'Connection failed'}