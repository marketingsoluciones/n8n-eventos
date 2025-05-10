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
        httpMethod: 'GET,POST',
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
{
  displayName: 'Meta Verify Token',
  name: 'metaVerifyToken',
  type: 'string',
  default: '',
  required: true,
  description: 'The verification token for Meta/WhatsApp webhook validation',
}, 
  {
    displayName: 'App Secret',
    name: 'appSecret',
    type: 'string',
    default: '',
    required: true,
    typeOptions: {
      password: true,
    },
    displayOptions: {
      show: {
        authentication: ['meta'],
      },
    },
    description: 'The App Secret from your Facebook App Dashboard used to validate webhook signatures',
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

// Manejar solicitudes GET (verificación de webhook de Meta/WhatsApp)
if (req.method === 'GET') {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log('Solicitud de verificación de webhook:', { mode, token, challenge });

  // Obtener el token de verificación configurado
  const configToken = this.getNodeParameter('metaVerifyToken') as string;
  
  // Verificar que sea una solicitud de suscripción válida
  if (mode === 'subscribe' && token === configToken && challenge) {
    console.log('Verificación exitosa, respondiendo con challenge:', challenge);
    
    return {
      webhookResponse: {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: challenge,
      },
    };
  }
  
  console.log('Verificación fallida:', { 
    modo: mode, 
    tokenRecibido: token, 
    tokenConfigurado: configToken 
  });
  
  return {
    webhookResponse: {
      statusCode: 403,
      body: 'Verification failed',
    },
  };
}    
    // El resto del código se mantiene igual para manejar solicitudes POST
// Para solicitudes POST
if (req.method === 'POST') {
  const authentication = this.getNodeParameter('authentication') as string;

  if (authentication === 'token') {
    const headerToken = req.headers['x-webhook-token'];
    const configToken = this.getNodeParameter('token') as string;

    if (headerToken !== configToken) {
      console.log('Autenticación por token fallida:', {
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
  } else if (authentication === 'meta') {
    // Verificación de firma para Meta/Facebook
    const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];
    const appSecret = this.getNodeParameter('appSecret') as string;
    
    if (!signature) {
      console.log('Solicitud sin firma de Meta');
      return {
        webhookResponse: {
          statusCode: 401,
          body: {
            error: 'No signature provided',
          },
        },
      };
    }
    
    // En una implementación real, aquí verificarías la firma HMAC
    // utilizando el appSecret y el cuerpo de la solicitud
    // Por ahora, solo registraremos la firma recibida
    console.log('Firma de Meta recibida:', signature);
    
    // Aceptamos la solicitud para propósitos de prueba
    // En producción, validarías la firma contra el cuerpo de la solicitud
  }

  // Resto del código para procesar el cuerpo de la solicitud...
  const body = req.body;
  if (typeof body === 'object' && body !== null) {
    console.log('Datos de webhook procesados correctamente:', body);
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
}
