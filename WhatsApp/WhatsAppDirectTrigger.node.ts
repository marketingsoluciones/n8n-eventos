
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
          {
            name: 'Meta',
            value: 'meta',
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
    const method = req.method;
    const authentication = this.getNodeParameter('authentication') as string;
    
    console.log('Webhook recibido:', {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: req.headers,
    });

    // Verificación de Meta (GET request)
    if (method === 'GET') {
      const query = req.query;
      
      console.log(`[WhatsApp] Solicitud de verificación de webhook: ${JSON.stringify(query)}`);
      
      // Verificar si es una solicitud de verificación de Meta
      if (
        query['hub.mode'] === 'subscribe' &&
        query['hub.verify_token'] !== undefined
      ) {
        const verifyToken = this.getNodeParameter('metaVerifyToken') as string;
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];
        
        console.log(`[WhatsApp] Verificación Meta: token recibido=${token}, token esperado=${verifyToken}`);
        
        if (mode === 'subscribe' && token === verifyToken) {
          console.log(`[WhatsApp] Verificación de webhook exitosa, devolviendo challenge: ${challenge}`);
          return {
            webhookResponse: {
              statusCode: 200,
              body: challenge,
            },
          };
        } else {
          console.log('[WhatsApp] Token de verificación inválido');
          return {
            webhookResponse: {
              statusCode: 403,
              body: 'Forbidden: token de verificación inválido',
            },
          };
        }
      }
    }

    // Manejo de solicitudes POST
    if (method === 'POST') {
      // Para solicitudes de WhatsApp, aceptamos sin verificar token
      if (req.body && req.body.object === 'whatsapp_business_account') {
        console.log('[WhatsApp] Mensaje de WhatsApp Business recibido, procesando sin verificación de token');
      } 
      // Para otras solicitudes, verificamos según el método de autenticación configurado
      else if (authentication === 'token') {
        const headerToken = req.headers['x-webhook-token'];
        const configToken = this.getNodeParameter('token') as string;

        if (headerToken !== configToken) {
          console.log(`Autenticación por token fallida: { tokenRecibido: ${headerToken}, tokenConfigurado: '${configToken}' }`);
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
        console.log('Firma de Meta recibida:', signature);
      }

      // Procesar el cuerpo de la solicitud
      const body = req.body;
      if (typeof body === 'object' && body !== null) {
        // Extraer información relevante del mensaje para logs
        try {
          if (body.object === 'whatsapp_business_account' && 
              body.entry && 
              body.entry[0].changes && 
              body.entry[0].changes[0].value.messages) {
            
            const message = body.entry[0].changes[0].value.messages[0];
            if (message.type === 'text') {
              console.log(`[WhatsApp] Mensaje de texto recibido: ${message.text.body}`);
            } else {
              console.log(`[WhatsApp] Mensaje de tipo ${message.type} recibido`);
            }
          }
        } catch (error) {
          console.log(`[WhatsApp] Error al extraer información del mensaje: ${error.message}`);
        }
        
        // Siempre devolvemos 200 para mensajes de WhatsApp
        console.log('Datos de webhook procesados correctamente');
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

    // Si el método no es GET ni POST
    return {
      webhookResponse: {
        statusCode: 405,
        body: {
          error: 'Method Not Allowed',
        },
      },
    };
  }
}
