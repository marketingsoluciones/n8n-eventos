import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  IDataObject,
} from 'n8n-workflow';

export class WhatsAppNativeWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'WhatsApp Native Webhook',
    name: 'whatsAppNativeWebhook',
    icon: 'file:whatsapp.svg',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow when a WhatsApp webhook is called',
    defaults: {
      name: 'WhatsApp Native Webhook',
      color: '#25D366',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'GET,POST',
        responseMode: 'immediateResponse', // Cambiado de 'onReceived' a 'immediateResponse'
        path: '={{$parameter["webhookPath"]}}',
        isFullPath: true, // Añadido para evitar que n8n añada prefijos
      },
    ],
    properties: [
      {
        displayName: 'Webhook Path',
        name: 'webhookPath',
        type: 'string',
        default: 'appmeta', // Un valor por defecto más claro
        required: true,
        description: 'The path for the webhook (e.g. "appmeta" will be accessible at /webhook/appmeta)',
      },
      {
        displayName: 'Verification Token',
        name: 'verificationToken',
        type: 'string',
        default: 'token2022',
        required: true,
        description: 'The token to verify webhook subscription from Meta',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    try {
      const req = this.getRequestObject();
      console.log('WhatsAppNativeWebhook received request:', req.method, 'URL:', req.url);
      
      // GET request handling (for verification)
      if (req.method === 'GET') {
        console.log('Processing GET request (webhook verification)');
        
        // Meta/WhatsApp verificación específica
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        const verificationToken = this.getNodeParameter('verificationToken') as string;
        
        console.log('Verification params:', {
          mode,
          receivedToken: token,
          configuredToken: verificationToken,
          challenge
        });
        
        if (mode === 'subscribe' && token === verificationToken) {
          console.log('Verification successful, returning challenge:', challenge);
          
          // Devolver exactamente el challenge como pide Meta
          return {
            webhookResponse: {
              statusCode: 200,
              headers: {
                'Content-Type': 'text/plain',
              },
              body: challenge,
            },
          };
        } else {
          console.log('Verification failed');
          return {
            webhookResponse: {
              statusCode: 403,
              headers: {
                'Content-Type': 'text/plain',
              },
              body: 'Forbidden',
            },
          };
        }
      }
      // POST request handling (for receiving messages)
      else if (req.method === 'POST') {
        console.log('Processing POST request (incoming webhook)');
        const body = req.body as IDataObject;
        
        // Log solo parte del cuerpo para evitar logs demasiado grandes
        console.log('Body type:', typeof body);
        console.log('Body preview:', JSON.stringify(body).substring(0, 200) + '...');
        
        return {
          webhookResponse: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ success: true }),
          },
          workflowData: [this.helpers.returnJsonArray(body)],
        };
      } 
      // Default response for other methods
      else {
        console.log('Unsupported method:', req.method);
        return {
          webhookResponse: {
            statusCode: 405,
            headers: {
              'Content-Type': 'text/plain',
            },
            body: 'Method Not Allowed',
          },
        };
      }
    } catch (error) {
      console.error('Error in WhatsAppNativeWebhook:', error.message, error.stack);
      return {
        webhookResponse: {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: true,
            message: error.message,
          }),
        },
      };
    }
  }
}
