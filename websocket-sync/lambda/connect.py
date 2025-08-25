import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        connection_id = event['requestContext']['connectionId']
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('userId', 'default_user')
        device_id = query_params.get('deviceId', connection_id)
        
        print(f"Nueva conexión: {connection_id}, Usuario: {user_id}, Dispositivo: {device_id}")
        
        # Guardar conexión en DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'tillup-realtime-connections'))
        
        table.put_item(Item={
            'connectionId': connection_id,
            'userId': user_id,
            'deviceId': device_id,
            'connectedAt': datetime.utcnow().isoformat()
        })
        
        return {'statusCode': 200, 'body': 'Connected'}
    except Exception as e:
        print(f"Error en conexión: {e}")
        return {'statusCode': 500, 'body': str(e)}

