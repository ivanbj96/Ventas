import json
import boto3
import logging
from datetime import datetime
from decimal import Decimal

# Custom JSON encoder for DynamoDB Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Clientes AWS
dynamodb = boto3.resource('dynamodb')
# API Gateway client se configurará dinámicamente

# Nombres de tablas
CONNECTIONS_TABLE = 'TillUpConnections'
USER_DATA_TABLE = 'TillUpUserData'

def lambda_handler(event, context):
    """Handler principal de Lambda"""
    try:
        route_key = event['requestContext']['routeKey']
        connection_id = event['requestContext']['connectionId']
        
        logger.info(f"Route: {route_key}, Connection: {connection_id}")
        
        if route_key == '$connect':
            return handle_connect(event)
        elif route_key == '$disconnect':
            return handle_disconnect(event)
        elif route_key == '$default':
            return handle_message(event)
        
        return {'statusCode': 200, 'body': 'OK'}
        
    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {'statusCode': 500, 'body': 'Internal server error'}

def handle_connect(event):
    """Manejar conexión WebSocket"""
    try:
        connection_id = event['requestContext']['connectionId']
        query_params = event['requestContext'].get('queryStringParameters', {}) or {}
        
        user_id = query_params.get('userId')
        device_id = query_params.get('deviceId')
        token = query_params.get('token')
        
        logger.info(f"Connect: {user_id}, {device_id}")
        
        # Validar token
        if token != 'tillup_test':
            return {'statusCode': 401, 'body': 'Invalid token'}
        
        if not user_id or not device_id:
            return {'statusCode': 400, 'body': 'Missing userId or deviceId'}
        
        # Guardar conexión
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        connections_table.put_item(
            Item={
                'connectionId': connection_id,
                'userId': user_id,
                'deviceId': device_id,
                'connectedAt': datetime.now().isoformat(),
                'ttl': int(datetime.now().timestamp()) + 86400
            }
        )
        
        # Enviar confirmación
        send_to_connection(connection_id, {
            'action': 'connection_confirmed',
            'data': {
                'message': 'Connected successfully',
                'userId': user_id,
                'deviceId': device_id
            }
        }, event)
        
        return {'statusCode': 200, 'body': 'Connected'}
        
    except Exception as e:
        logger.error(f"Connect error: {str(e)}")
        return {'statusCode': 500, 'body': 'Connection failed'}

def handle_disconnect(event):
    """Manejar desconexión WebSocket"""
    try:
        connection_id = event['requestContext']['connectionId']
        
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        connections_table.delete_item(Key={'connectionId': connection_id})
        
        return {'statusCode': 200, 'body': 'Disconnected'}
        
    except Exception as e:
        logger.error(f"Disconnect error: {str(e)}")
        return {'statusCode': 200, 'body': 'OK'}

def handle_message(event):
    """Manejar mensajes WebSocket"""
    try:
        connection_id = event['requestContext']['connectionId']
        body = json.loads(event['body'])
        action = body.get('action')
        data = body.get('data', {})
        
        logger.info(f"Message: {action}, Body: {body}")
        
        # Obtener información de conexión
        connection = get_connection(connection_id)
        if not connection:
            logger.error(f"Connection not found for {connection_id}")
            return {'statusCode': 404, 'body': 'Connection not found'}
        
        # Procesar según acción
        if action == 'upload_user_data':
            return handle_upload_user_data(connection, data, event)
        elif action == 'get_user_data':
            return handle_get_user_data(connection, data, event)
        elif action == 'input_change':
            return handle_input_change(connection, data, event)
        elif action == 'private_sync':
            return handle_private_sync(connection, data, event)
        elif action == 'test_message':
            return handle_test_message(connection, data, event)
        elif action == 'ping':
            return handle_ping(connection, data, event)
        
        return {'statusCode': 200, 'body': 'Message processed'}
        
    except Exception as e:
        logger.error(f"Message error: {str(e)}")
        send_to_connection(connection_id, {
            'action': 'error',
            'data': {'message': 'Error processing message'}
        }, event)
        return {'statusCode': 500, 'body': 'Message processing failed'}

def handle_upload_user_data(connection, data, event=None):
    """Subir datos de usuario - CON VALIDACIÓN DE SEGURIDAD"""
    user_id = data.get('userId')
    user_data = data.get('userData', {})
    
    logger.info(f"Upload request - User: {user_id}, Connection User: {connection['userId']}, Data keys: {list(user_data.keys())}")
    
    # CRÍTICO: Validar que solo puede subir sus propios datos
    if user_id != connection['userId']:
        logger.warning(f"Access denied: {connection['userId']} trying to upload for {user_id}")
        send_to_connection(connection['connectionId'], {
            'action': 'error',
            'data': {
                'message': 'Access denied: Cannot upload data for other users',
                'code': 403
            }
        }, event)
        return {'statusCode': 403, 'body': 'Access denied'}
    
    try:
        user_data_table = dynamodb.Table(USER_DATA_TABLE)
        
        # Asegurar que user_data no esté vacío
        if not user_data:
            logger.warning(f"Empty user data for {user_id}")
            user_data = {}
        
        item_to_save = {
            'userId': user_id,
            'userData': user_data,
            'timestamp': int(datetime.now().timestamp() * 1000),
            'updatedAt': datetime.now().isoformat()
        }
        
        logger.info(f"Saving to DynamoDB: {item_to_save}")
        
        user_data_table.put_item(Item=item_to_save)
        
        response_message = {
            'type': 'upload_success',
            'action': 'upload_success',
            'userId': user_id,
            'status': 'success',
            'message': 'Data uploaded successfully'
        }
        
        logger.info(f"Sending upload success response: {response_message}")
        
        send_to_connection(connection['connectionId'], response_message, event)
        
        return {'statusCode': 200, 'body': 'Data uploaded'}
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        send_to_connection(connection['connectionId'], {
            'action': 'error',
            'data': {
                'message': f'Upload failed: {str(e)}',
                'code': 500
            }
        }, event)
        return {'statusCode': 500, 'body': 'Upload failed'}

def handle_get_user_data(connection, data, event=None):
    """Obtener datos de usuario - CON VALIDACIÓN DE SEGURIDAD"""
    user_id = data.get('userId')
    
    logger.info(f"Getting data for user: {user_id}, connection user: {connection['userId']}")
    
    # CRÍTICO: Validar que solo puede acceder a sus propios datos
    if user_id != connection['userId']:
        logger.warning(f"Access denied: {connection['userId']} trying to access {user_id} data")
        send_to_connection(connection['connectionId'], {
            'action': 'error',
            'data': {
                'message': 'Access denied: Cannot access other user data',
                'code': 403
            }
        }, event)
        return {'statusCode': 403, 'body': 'Access denied'}
    
    try:
        user_data_table = dynamodb.Table(USER_DATA_TABLE)
        response = user_data_table.get_item(Key={'userId': user_id})
        
        logger.info(f"DynamoDB response: {response}")
        
        user_data = response.get('Item', {}).get('userData', {})
        timestamp = response.get('Item', {}).get('timestamp', int(datetime.now().timestamp() * 1000))
        
        # Convert Decimal to int/float for JSON serialization
        if isinstance(timestamp, Decimal):
            timestamp = int(timestamp)
        
        response_message = {
            'type': 'user_data_response',
            'action': 'user_data_response',
            'userId': user_id,
            'userData': user_data,
            'timestamp': timestamp
        }
        
        logger.info(f"Sending get_user_data response: {response_message}")
        logger.info(f"User data fields: {list(user_data.keys()) if user_data else 'No data'}")
        
        send_to_connection(connection['connectionId'], response_message, event)
        
        return {'statusCode': 200, 'body': 'Data sent'}
        
    except Exception as e:
        logger.error(f"Get data error: {str(e)}")
        send_to_connection(connection['connectionId'], {
            'action': 'error',
            'data': {
                'message': f'Error getting data: {str(e)}',
                'code': 500
            }
        }, event)
        return {'statusCode': 500, 'body': 'Get data failed'}

def handle_input_change(connection, data, event=None):
    """Manejar cambios de input - CON BROADCASTING"""
    input_id = data.get('inputId')
    value = data.get('value')
    user_id = data.get('userId')
    
    # Validar usuario
    if user_id != connection['userId']:
        send_to_connection(connection['connectionId'], {
            'action': 'error',
            'data': {
                'message': 'Cannot send changes for other users',
                'code': 403
            }
        }, event)
        return {'statusCode': 403, 'body': 'Access denied'}
    
    # Determinar si es público o privado
    public_inputs = ['realtime-input', 'realtime-textarea', 'realtime-number']
    is_public = input_id in public_inputs
    
    message_to_send = {
        'action': 'input_change',
        'data': {
            'inputId': input_id,
            'value': value,
            'userId': user_id,
            'deviceId': connection['deviceId'],
            'timestamp': int(datetime.now().timestamp() * 1000)
        }
    }
    
    try:
        if is_public:
            # Enviar a todos los usuarios
            broadcast_to_all_users(message_to_send, connection['connectionId'], event)
        else:
            # Enviar solo a otros dispositivos del mismo usuario
            broadcast_to_user_devices(user_id, message_to_send, connection['connectionId'], event)
        
        return {'statusCode': 200, 'body': 'Message broadcasted'}
        
    except Exception as e:
        logger.error(f"Broadcast error: {str(e)}")
        return {'statusCode': 500, 'body': 'Broadcast failed'}

def handle_private_sync(connection, data, event=None):
    """Sincronización privada entre dispositivos del mismo usuario"""
    user_id = data.get('userId')
    private_data = data.get('privateData', {})
    
    if user_id != connection['userId']:
        send_to_connection(connection['connectionId'], {
            'action': 'error',
            'data': {
                'message': 'Cannot sync data for other users',
                'code': 403
            }
        }, event)
        return {'statusCode': 403, 'body': 'Access denied'}
    
    message_to_send = {
        'action': 'private_sync',
        'data': {
            'userId': user_id,
            'deviceId': connection['deviceId'],
            'privateData': private_data,
            'timestamp': int(datetime.now().timestamp() * 1000)
        }
    }
    
    try:
        broadcast_to_user_devices(user_id, message_to_send, connection['connectionId'], event)
        return {'statusCode': 200, 'body': 'Private sync sent'}
        
    except Exception as e:
        logger.error(f"Private sync error: {str(e)}")
        return {'statusCode': 500, 'body': 'Private sync failed'}

def handle_test_message(connection, data, event=None):
    """Manejar mensaje de prueba"""
    message_to_send = {
        'action': 'test_message',
        'data': {
            'message': f"Echo: {data.get('message', '')}",
            'originalSender': connection['userId']
        }
    }
    
    try:
        broadcast_to_all_users(message_to_send, connection['connectionId'], event)
        return {'statusCode': 200, 'body': 'Test message sent'}
        
    except Exception as e:
        logger.error(f"Test message error: {str(e)}")
        return {'statusCode': 500, 'body': 'Test message failed'}

def handle_ping(connection, data, event=None):
    """Manejar ping"""
    try:
        send_to_connection(connection['connectionId'], {
            'type': 'pong',
            'action': 'pong',
            'timestamp': datetime.now().isoformat(),
            'connection_id': connection['connectionId'][:12] + '='
        }, event)
        return {'statusCode': 200, 'body': 'Pong sent'}
        
    except Exception as e:
        logger.error(f"Ping error: {str(e)}")
        return {'statusCode': 500, 'body': 'Ping failed'}

def get_connection(connection_id):
    """Obtener información de conexión"""
    try:
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        response = connections_table.get_item(Key={'connectionId': connection_id})
        return response.get('Item')
    except Exception as e:
        logger.error(f"Get connection error: {str(e)}")
        return None

def get_all_connections():
    """Obtener todas las conexiones activas"""
    try:
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        response = connections_table.scan()
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Get all connections error: {str(e)}")
        return []

def get_user_connections(user_id):
    """Obtener conexiones de un usuario específico"""
    try:
        connections_table = dynamodb.Table(CONNECTIONS_TABLE)
        response = connections_table.scan(
            FilterExpression='userId = :userId',
            ExpressionAttributeValues={':userId': user_id}
        )
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Get user connections error: {str(e)}")
        return []

def get_api_gateway_client(event):
    """Obtener cliente API Gateway con endpoint dinámico"""
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    endpoint_url = f"https://{domain_name}/{stage}"
    
    return boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)

def send_to_connection(connection_id, message, event=None):
    """Enviar mensaje a una conexión específica"""
    try:
        if event:
            apigateway = get_api_gateway_client(event)
        else:
            # Fallback al endpoint hardcodeado
            apigateway = boto3.client('apigatewaymanagementapi', 
                                    endpoint_url='https://yr9msnb5p6.execute-api.us-east-1.amazonaws.com/prod')
        
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(message, cls=DecimalEncoder)
        )
        logger.info(f"Message sent to {connection_id}")
    except Exception as e:
        logger.error(f"Send to connection error: {str(e)}")
        if 'GoneException' in str(e):
            # Conexión cerrada, eliminar de la tabla
            try:
                connections_table = dynamodb.Table(CONNECTIONS_TABLE)
                connections_table.delete_item(Key={'connectionId': connection_id})
            except:
                pass

def broadcast_to_all_users(message, exclude_connection_id=None, event=None):
    """Enviar mensaje a todos los usuarios conectados"""
    connections = get_all_connections()
    sent_count = 0
    
    for connection in connections:
        if connection['connectionId'] != exclude_connection_id:
            send_to_connection(connection['connectionId'], message, event)
            sent_count += 1
    
    logger.info(f"Broadcasted to {sent_count} connections")

def broadcast_to_user_devices(user_id, message, exclude_connection_id=None, event=None):
    """Enviar mensaje a todos los dispositivos de un usuario"""
    connections = get_user_connections(user_id)
    sent_count = 0
    
    for connection in connections:
        if connection['connectionId'] != exclude_connection_id:
            send_to_connection(connection['connectionId'], message, event)
            sent_count += 1
    
    logger.info(f"Sent to {sent_count} devices of user {user_id}")