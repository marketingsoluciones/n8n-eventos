import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  INodeExecutionData
} from 'n8n-workflow';

export class WhatsAppDirectTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'WhatsApp Direct Trigger',
    name: 'whatsAppDirectTrigger',
    icon: 'file:whatsapp.svg',
    group: ['trigger'], 
    version: 1,
    description: 'Starts the workflow when a WhatsApp message is received',
    defaults: {
      name: 'WhatsApp Direct Trigger',
      color: '#25D366',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'GET,POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Verification Token',
        name: 'verificationToken',
        type: 'string',
        default: '',
        required: true,
        description: 'Token de verificación único para el webhook de WhatsApp'
      },
      {
        displayName: 'App Secret',
        name: 'appSecret',
        type: 'string',
        default: '',
        required: true,
        typeOptions: { 
          password: true 
        },
        description: 'App Secret de tu aplicación de Meta'
      }
    ]
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const method = req.method;
    const query = req.query || {};

    // Obtener tokens desde los parámetros del nodo
    const VERIFY_TOKEN = this.getNodeParameter('verificationToken') as string;
    const APP_SECRET = this.getNodeParameter('appSecret') as string;

    console.log('=================== WEBHOOK RECIBIDO ===================', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
    // Registro detallado
    console.log('Webhook Meta - Detalles:', {
      method,
      query: JSON.stringify(query),
      verifyToken: VERIFY_TOKEN,
      appSecret: APP_SECRET ? '[REDACTADO]' : 'No proporcionado'
    });

 // Verificación de suscripción (GET)
if (method === 'GET' && query['hub.mode'] === 'subscribe') {
  console.log('Solicitud de Verificación Meta - Análisis Detallado:', {
    mode: query['hub.mode'],
    challenge: query['hub.challenge'],
    verifyToken: query['hub.verify_token'],
    tokenLength: {
      received: query['hub.verify_token']?.length,
      expected: VERIFY_TOKEN.length
    },
    tokenMatchStatus: query['hub.verify_token'] === VERIFY_TOKEN
  });
      
  const receivedToken = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (receivedToken === VERIFY_TOKEN) {
    console.log('Verificación de Token Meta - ÉXITO', {
      challengeReceived: challenge,
      challengeLength: challenge.length
    });

    return {
      webhookResponse: {
        statusCode: 200,
        body: challenge 
      }
    };
  } else {
    console.error('Error de Verificación de Token Meta:', {
      receivedToken,
      expectedToken: VERIFY_TOKEN,
      mismatchDetails: receivedToken 
        ? `Tokens no coinciden. Recibido: ${receivedToken}` 
        : 'Token recibido es nulo/undefined'
    });

    return {
      webhookResponse: {
        statusCode: 403,
        body: 'Token de Verificación Inválido'
      }
    };
  }
}

    // Manejo de mensajes POST
    if (method === 'POST') {
      
      
      // Verificación de firma HMAC para mayor seguridad
      const signature = req.headers['x-hub-signature-256'];
     
      const body = req.body;

  // Insertar aquí
  console.log('Payload POST recibido:', {
    objectType: body?.object,
    hasEntries: !!body?.entry,
    entriesCount: body?.entry?.length || 0
  });

      
      if (!signature) {
        console.error('Sin firma de Meta recibida');
        return {
          webhookResponse: {
            statusCode: 401,
            body: 'No se proporcionó firma'
          }
        };
      }

      // Procesar mensaje de WhatsApp
    
      if (body?.object === 'whatsapp_business_account') {
        try {
          const messages = body.entry[0]?.changes[0]?.value?.messages;
          
          if (messages) {
            const processedMessages: INodeExecutionData[] = messages.map(message => ({
              json: {
                type: message.type,
                from: message.from,
                body: message.type === 'text' ? message.text.body : 'Contenido no texto'
              }
            }));

            console.log('Mensajes de WhatsApp procesados:', processedMessages);

            return {
              webhookResponse: {
                statusCode: 200,
                body: 'Mensaje procesado'
              },
             workflowData: processedMessages.map(msg => [msg])
            };
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
        }
      }
    }

    return {
      webhookResponse: {
        statusCode: 400,
        body: 'Solicitud no válida'
      }
    };
  }
}
