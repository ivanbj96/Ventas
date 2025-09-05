import json
import boto3
import logging

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Clientes AWS
dynamodb = boto3.resource('dynamodb')

# Nombres de tablas
CONNECTIONS_TABLE = 'TillUpConnections'

def lambda_handler(event, context):
    """Handler para desconexiones WebSocket"""
    try:
        connection_id = event['requestContext']['connectionId']
        
        logger.info(f"Disconnect request - Connection: {connection_id}")
        
        # Eliminar conexión de DynamoDB
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        
        logger.info(f"Removing connection from DynamoDB: {connection_id}")
        
        connections_table.delete_item(Key={'connectionId': connection_id})
        
        logger.info(f"Connection removed successfully: {connection_id}")
        
        return {'statusCode': 200, 'body': 'Disconnected'}
        
    except Exception as e:
        logger.error(f"Disconnect error: {str(e)}")
        return {'statusCode': 200, 'body': 'OK'}  # Siempre devolver 200 para disconnect