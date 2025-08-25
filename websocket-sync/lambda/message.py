import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        connection_id = event['requestContext']['connectionId']
        domain_name = event['requestContext']['domainName']
        stage = event['requestContext']['stage']
        
        body = json.loads(event.get('body', '{}'))
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'tillup-realtime-connections'))
        apigw = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{domain_name}/{stage}')
        
        # Obtener info del remitente
        sender_info = table.get_item(Key={'connectionId': connection_id})
        if 'Item' not in sender_info:
            return {'statusCode': 400, 'body': 'Connection not found'}
        
        sender_user_id = sender_info['Item']['userId']
        
        # Obtener todas las conexiones del mismo usuario (excepto el remitente)
        user_connections = get_user_connections(table, sender_user_id, connection_id)
        
        # Retransmitir el mensaje a todos los dispositivos del usuario
        sent_count = broadcast_to_user(apigw, table, user_connections, body)
        print(f"Mensaje retransmitido a {sent_count} dispositivos del usuario {sender_user_id}")
        
        return {'statusCode': 200, 'body': 'Message broadcasted'}
        
    except Exception as e:
        print(f"Error procesando mensaje: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}

def get_user_connections(table, user_id, exclude_connection_id):
    try:
        response = table.scan(
            FilterExpression='userId = :uid AND connectionId <> :cid',
            ExpressionAttributeValues={
                ':uid': user_id,
                ':cid': exclude_connection_id
            }
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"Error obteniendo conexiones del usuario: {e}")
        return []

def broadcast_to_user(apigw, table, connections, message):
    sent_count = 0
    for conn in connections:
        if send_to_connection(apigw, table, conn['connectionId'], message):
            sent_count += 1
    return sent_count

def send_to_connection(apigw, table, connection_id, message):
    try:
        apigw.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(message)
        )
        return True
    except apigw.exceptions.GoneException:
        table.delete_item(Key={'connectionId': connection_id})
        print(f"Conexión eliminada: {connection_id}")
        return False
    except Exception as e:
        print(f"Error enviando a {connection_id}: {str(e)}")
        return False