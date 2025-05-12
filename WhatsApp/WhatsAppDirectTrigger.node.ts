export class WhatsAppDirectTrigger implements INodeType {
  description: INodeTypeDescription = {
    // ... configuración existente ...
    properties: [
      {
        displayName: 'Meta Verify Token',
        name: 'metaVerifyToken',
        type: 'string',
        default: '',
        required: true,
        description: 'Token de verificación único generado por ti'
      },
      {
        displayName: 'App Secret',
        name: 'appSecret',
        type: 'string',
        default: '',
        required: true,
        typeOptions: { password: true },
        description: 'App Secret de tu aplicación de Meta'
      }
    ]
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const method = req.method;
    const query = req.query || {};

    // Obtener tokens desde los parámetros del nodo
    const VERIFY_TOKEN = this.getNodeParameter('metaVerifyToken') as string;
    const APP_SECRET = this.getNodeParameter('appSecret') as string;

    // Registro detallado
    console.log('Webhook Meta - Detalles:', {
      method,
      query: JSON.stringify(query),
      verifyToken: VERIFY_TOKEN,
      appSecret: APP_SECRET ? '[REDACTADO]' : 'No proporcionado'
    });

    // Verificación de suscripción (GET)
    if (method === 'GET' && query['hub.mode'] === 'subscribe') {
      const receivedToken = query['hub.verify_token'];
      const challenge = query['hub.challenge'];

      console.log('Verificación de Suscripción Meta:', {
        receivedToken,
        expectedToken: VERIFY_TOKEN,
        challenge
      });

      if (receivedToken === VERIFY_TOKEN) {
        return {
          webhookResponse: {
            statusCode: 200,
            body: challenge 
          }
        };
      } else {
        console.error('Error de Verificación de Token Meta:', {
          receivedToken,
          expectedToken: VERIFY_TOKEN
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
      
      if (!signature) {
        console.error('Sin firma de Meta recibida');
        return {
          webhookResponse: {
            statusCode: 401,
            body: 'No se proporcionó firma'
          }
        };
      }

      // Implementar verificación de firma HMAC con APP_SECRET
      // (código de verificación de firma aquí)

      // Procesar mensaje de WhatsApp
      const body = req.body;
      if (body?.object === 'whatsapp_business_account') {
        try {
          const messages = body.entry[0]?.changes[0]?.value?.messages;
          
          if (messages) {
            messages.forEach(message => {
              console.log(`Mensaje de WhatsApp recibido:`, {
                type: message.type,
                from: message.from,
                body: message.type === 'text' ? message.text.body : 'Contenido no texto'
              });
            });

            return {
              webhookResponse: {
                statusCode: 200,
                body: 'Mensaje procesado'
              },
              workflowData: [this.helpers.returnJsonArray(body)]
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
