import {
  IExecuteFunctions,
  IWebhookFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  IWebhookResponseData,
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
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
         {
        name: 'default',
        httpMethod: 'GET',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          {
            name: 'None',
            value: 'none',
          },
          {
            name: 'Token',
            value: 'token',
          },
        ],
        default: 'none',
        description: 'The method to authenticate webhook requests',
      },
      {
        displayName: 'Token',
        name: 'token',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            authentication: ['token'],
          },
        },
        description: 'The token to use for authentication',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const req = this.getRequestObject();
  console.log('Webhook recibido:', {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
  });

  // Manejar solicitudes GET (verificación de webhook de Facebook/Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Solicitud de verificación de webhook:', {
      mode,
      token,
      challenge,
    });

  // Si es una solicitud de verificación
if (mode === 'subscribe' && token && challenge) {
  // Durante la verificación inicial, simplemente devolvemos el challenge sin verificar el token
  console.log('Verificación de webhook, devolviendo challenge:', challenge);

    const data = Buffer.from(challenge as string);
  
  return {
    webhookResponse: {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': data.length.toString(),
      },
      body: data,
    },
  };
  
}    
    // Si no es una solicitud de verificación pero es GET
    return {
      webhookResponse: {
        statusCode: 400,
        body: 'Bad Request - Invalid GET request',
      },
    };
  }

  // El resto del código se mantiene igual para manejar solicitudes POST
  const authentication = this.getNodeParameter('authentication') as string;

  if (authentication === 'token') {
    const headerToken = req.headers['x-webhook-token'];
    const configToken = this.getNodeParameter('token') as string;

    if (headerToken !== configToken) {
      console.log('Autenticación fallida para solicitud POST:', {
        tokenRecibido: headerToken,
        tokenConfigurado: configToken,
      });
      return {
        webhookResponse: {
          statusCode: 401,
          body: {
            error: 'Unauthorized',
          },
        },
      };
    }
  }

  const body = req.body;
  if (typeof body === 'object' && body !== null) {
    console.log('Procesando datos de webhook:', body);
    return {
      webhookResponse: {
        statusCode: 200,
        body: {
          success: true,
        },
      },
      workflowData: [this.helpers.returnJsonArray(body)],
    };
  }

  console.log('Formato de cuerpo inválido:', body);
  return {
    webhookResponse: {
      statusCode: 400,
      body: {
        error: 'Invalid body format',
      },
    },
  };
}
}
