import json
import boto3
import os

def lambda_handler(event, context):
    try:
        connection_id = event['requestContext']['connectionId']
        print(f"Desconexión: {connection_id}")
        
        # Eliminar conexión de DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'tillup-realtime-connections'))
        
        table.delete_item(Key={'connectionId': connection_id})
        
        return {'statusCode': 200, 'body': 'Disconnected'}
    except Exception as e:
        print(f"Error en desconexión: {e}")
        return {'statusCode': 500, 'body': str(e)}