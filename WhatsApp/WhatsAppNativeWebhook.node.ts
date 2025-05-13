import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  IDataObject,
  NodeOperationError,
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
    try { // Inicio del try-catch general
      const req = this.getRequestObject();
      const verificationToken = this.getNodeParameter('verificationToken') as string;
      const headerData = this.getHeaderData();
      const method = req.method;

      // depuracion a bajo nivel 
      try {
        console.log('Request headers:', JSON.stringify(req.headers));
        console.log('Request path:', req.path);
        console.log('Request originalUrl:', req.originalUrl || 'not available');
        console.log('Request protocol:', req.protocol || 'not available');
      } catch (error) {
        console.log('Error accessing request properties:', error);
      }
      
      console.log('WhatsApp Native Webhook - Request Received:', {
        method,
        headers: headerData,
        path: req.path,
        query: req.query,
      });

      if (method === 'GET') {
        // Handle webhook verification (Meta verification process)
        try {
          const query = req.query as IDataObject;
          
          console.log('GET Request Query Parameters:', query);
          
          const mode = query['hub.mode'] as string;
          const token = query['hub.verify_token'] as string;
          const challenge = query['hub.challenge'] as string;
          
          console.log('Verification Data:', { mode, token, verificationToken, challenge });
          
          if (mode === 'subscribe' && token === verificationToken) {
            console.log('Verification Successful! Returning challenge:', challenge);
            
            // Verificar el procesamiento de la respuesta
            const rawChallenge = challenge;
            console.log('Challenge raw type:', typeof rawChallenge);
            console.log('Challenge raw value:', rawChallenge);
            
            return [{
                   json: {
                      responseCode: 200,
                       responseContentType: 'text/plain',
                        responseBody: challenge
                    }
                   }];
            
          
           
          } else {
            console.log('Verification Failed! Token mismatch or mode incorrect');
               return [{
                      json: {
                        responseCode: 403,
                        responseContentType: 'text/plain',
                        responseBody: 'Forbidden'
                      }
                    }];
          }
        } catch (error) {
          console.error('Error in GET webhook handling:', error);
          // Respuesta segura sin referencias a this.getNode()
         // Simplemente procesar el mensaje
                return [{
                  json: {
                    responseCode: 200,
                    responseContentType: 'application/json',
                    responseBody: JSON.stringify({ success: true }),
                    messageData: body
                  }
                }];
        }
      } else if (method === 'POST') {
        // Handle incoming messages
        try {
          const body = req.body as IDataObject;
          
          console.log('POST Request Body:', body);
          
          if (body.object === 'whatsapp_business_account') {
            // Process the WhatsApp message data
           return [{
                json: {
                  responseCode: 200,
                  responseContentType: 'application/json',
                  responseBody: JSON.stringify({ success: true }),
                  messageData: body
                }
              }];
          } else {
            return {
              webhookResponse: {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Invalid webhook data' }),
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            };
          }
        } catch (error) {
          console.error('Error in POST webhook handling:', error);
          // Respuesta segura sin referencias a this.getNode()
         // Simplemente procesar el mensaje
            return [{
              json: {
                responseCode: 200,
                responseContentType: 'application/json',
                responseBody: JSON.stringify({ success: true }),
                messageData: body
              }
            }];
        }
      } else {
        // Handle unsupported methods
                    return [{
              json: {
                responseCode: 405,
                responseContentType: 'text/plain',
                responseBody: 'Method Not Allowed'
              }
            }];
      }
    } catch (error) { // Cierre del try-catch general
      console.error('General webhook error:', error);
      
      // Respuesta genérica para cualquier error
      return [{
              json: {
                responseCode: 200,
                responseContentType: 'application/json',
                responseBody: JSON.stringify({ success: true }),
                messageData: body
              }
            }];
    }
  }
}
