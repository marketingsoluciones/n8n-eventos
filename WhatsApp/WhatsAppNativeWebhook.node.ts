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
        path: '',
      },
    ],
    properties: [
      {
        displayName: 'Verification Token',
        name: 'verificationToken',
        type: 'string',
        default: '',
        required: true,
        description: 'The token to verify webhook subscription from Meta',
      },
    ],
  };

  // This is the function that will be called when the webhook gets triggered
  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    try {
      const req = this.getRequestObject();
      const verificationToken = this.getNodeParameter('verificationToken') as string;
      const method = req.method;

      console.log(`[META-DEBUG] Request method: ${method}`);
      
      if (method === 'GET') {
        // Procesamiento de verificación de webhook
        try {
          const query = req.query as IDataObject;
          
          console.log(`[META-DEBUG] GET query parameters: ${JSON.stringify(query)}`);
          
          const mode = query['hub.mode'] as string;
          const token = query['hub.verify_token'] as string;
          const challenge = query['hub.challenge'] as string;
          
          console.log(`[META-DEBUG] Verification mode: ${mode}`);
          console.log(`[META-DEBUG] Verification token received: ${token}`);
          console.log(`[META-DEBUG] Verification token configured: ${verificationToken}`);
          console.log(`[META-DEBUG] Challenge value: ${challenge}`);
          
          if (mode === 'subscribe' && token === verificationToken) {
            console.log(`[META-DEBUG] Verification successful, returning challenge: ${challenge}`);
            
            // IMPORTANTE: Devolver el challenge como texto plano directamente,
            // no como un objeto JSON o estructura compleja
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
            console.log(`[META-DEBUG] Verification failed`);
            
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
        } catch (error) {
          console.error(`[META-DEBUG] Error in GET handler: ${error.message}`);
          return {
            webhookResponse: {
              statusCode: 500,
              headers: {
                'Content-Type': 'text/plain',
              },
              body: 'Error: ' + error.message,
            },
          };
        }
      } else if (method === 'POST') {
        // Procesamiento de mensajes entrantes
        try {
          const body = req.body as IDataObject;
          
          console.log(`[META-DEBUG] POST body: ${JSON.stringify(body).substring(0, 200)}...`);
          
          if (body.object === 'whatsapp_business_account') {
            console.log(`[META-DEBUG] Valid WhatsApp message received`);
            
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
          } else {
            console.log(`[META-DEBUG] Invalid object type: ${body.object}`);
            
            return {
              webhookResponse: {
                statusCode: 200, 
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: true }),
              },
            };
          }
        } catch (error) {
          console.error(`[META-DEBUG] Error in POST handler: ${error.message}`);
          
          return {
            webhookResponse: {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ success: true }),
            },
          };
        }
      } else {
        console.log(`[META-DEBUG] Unsupported method: ${method}`);
        
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
      console.error(`[META-DEBUG] Global error: ${error.message}`);
      
      return {
        webhookResponse: {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
          body: 'OK',
        },
      };
    }
  }
}
