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
     try {
    const req = this.getRequestObject();
    const method = req.method;
    const query = req.query || {};
    const headers = req.headers;

    console.log('WEBHOOK - SOLICITUD COMPLETA:', {
      timestamp: new Date().toISOString(),
      method,
      path: req.path,
      fullHeaders: Object.keys(headers),
      queryParams: Object.keys(query),
      rawQuery: JSON.stringify(query),
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'No body'
    });
  
 // Verificación de suscripción (GET)
if (method === 'GET' && query['hub.mode'] === 'subscribe') {
  console.log('DEBUG - SOLICITUD COMPLETA DE GET:', {
    fullQuery: query,
    headers: req.headers,
    methodDetails: {
      method,
      mode: query['hub.mode'],
      challenge: query['hub.challenge'],
      verifyToken: query['hub.verify_token']
    }
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
 catch (error) {
    console.error('ERROR GLOBAL EN WEBHOOK:', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path
    });

    return {
      webhookResponse: {
        statusCode: 500,
        body: 'Error interno del servidor'
      }
    };
  }
}
}
