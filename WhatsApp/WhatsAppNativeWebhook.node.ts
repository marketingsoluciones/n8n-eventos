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
        responseMode: 'onReceived',
        path: '={{$parameter["webhookPath"] || ""}}',
      },
    ],
    properties: [
      {
        displayName: 'Webhook Path',
        name: 'webhookPath',
        type: 'string',
        default: '',
        description: 'The path for the webhook (without /webhook/ prefix). Leave empty for root path.',
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
      // Get request object - simplify like SimpleWebhook
      const req = this.getRequestObject();
      console.log('WhatsAppNativeWebhook received request:', req.method);
      
      // GET request handling (for verification)
      if (req.method === 'GET') {
        console.log('Processing GET request (webhook verification)');
        
        // If there's a challenge parameter, check verification token and return challenge
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;
        
        // Get verification token from node parameters
        let verificationToken;
        try {
          verificationToken = this.getNodeParameter('verificationToken') as string;
        } catch (error) {
          console.error('Error getting verification token, using default:', error.message);
          verificationToken = 'token2022'; // Fallback
        }
        
        console.log('Verification params:', {
          mode,
          receivedToken: token,
          configuredToken: verificationToken,
          challenge
        });
        
        if (mode === 'subscribe' && token === verificationToken) {
          console.log('Verification successful, returning challenge:', challenge);
          
          // CRUCIAL: Devuelve SOLO el challenge como texto plano sin formato JSON
          return {
            webhookResponse: challenge,
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
        console.log('Body received:', JSON.stringify(body).substring(0, 200));
        
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
