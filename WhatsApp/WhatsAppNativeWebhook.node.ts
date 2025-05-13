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
    console.error('General webhook error:', error);
    
    // Respuesta genérica para cualquier error
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
          
          //  Verificar el procesamiento de la respuesta
  const rawChallenge = challenge;
  console.log('Challenge raw type:', typeof rawChallenge);
  console.log('Challenge raw value:', rawChallenge);// Definir la respuesta primero
  
          
          
          const response = {
    webhookResponse: {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: challenge,
    },
  };
  
  // Registrar la respuesta antes de devolverla
  console.log('RESPUESTA FINAL ENVIADA:', JSON.stringify(response));
  
  // Devolver la respuesta
  return response;
        } else {
          console.log('Verification Failed! Token mismatch or mode incorrect');
          return {
            webhookResponse: {
              statusCode: 403,
              body: 'Forbidden',
            },
          };
        }
      } catch (error) {
  console.error('Error in GET webhook handling:', error);
  // En lugar de usar this.getNode() que es undefined
  / Respuesta segura sin referencias a this.getNode()
  return {
    webhookResponse: {
      statusCode: 200, // Usar 200 en lugar de 500 para aceptar la verificación
      body: 'Error handled', // Texto plano en lugar de JSON
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  };}
    } else if (method === 'POST') {
      // Handle incoming messages
      try {
        const body = req.body as IDataObject;
        
        console.log('POST Request Body:', body);
        
        if (body.object === 'whatsapp_business_account') {
          // Process the WhatsApp message data
          return {
            webhookResponse: {
              statusCode: 200,
              body: JSON.stringify({ success: true }),
              headers: {
                'Content-Type': 'application/json',
              },
            },
            workflowData: [this.helpers.returnJsonArray(body)],
          };
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
  // En lugar de usar this.getNode() que es undefined
   // Respuesta segura sin referencias a this.getNode()
  return {
    webhookResponse: {
      statusCode: 200, // Usar 200 incluso con error para no causar reintentos
      body: JSON.stringify({ success: true, message: 'Error handled' }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };
}
    } else {
      // Handle unsupported methods
      return {
        webhookResponse: {
          statusCode: 405,
          body: `Method Not Allowed: ${method}`,
        },
      };
    }
  }
}
