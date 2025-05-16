import {
  ITriggerFunctions,
  IWebhookFunctions,
  IDataObject,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
} from 'n8n-workflow';

export class WhatsAppDirectTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'WhatsApp Direct Trigger',
    name: 'whatsAppDirectTrigger',
    icon: 'file:whatsapp.svg',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow when a WhatsApp message is received via proxy',
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
        path: '',
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
        description: 'The method to authenticate webhook requests from your proxy',
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
        description: 'The token to use for authentication between your proxy and n8n',
      },
      {
        displayName: 'Log Incoming Data',
        name: 'logIncomingData',
        type: 'boolean',
        default: true,
        description: 'Whether to log the incoming webhook data for debugging',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const authentication = this.getNodeParameter('authentication') as string;
    const logIncomingData = this.getNodeParameter('logIncomingData') as boolean;

    // Depuración mejorada
    if (logIncomingData) {
      console.log('WhatsAppDirectTrigger recibió solicitud del proxy:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 500) : req.body,
      });
    }

    // Perform authentication check if needed
    if (authentication === 'token') {
      const headerToken = req.headers['x-webhook-token'];
      const configToken = this.getNodeParameter('token') as string;

      if (headerToken !== configToken) {
        console.log('Falló la autenticación del webhook. Token esperado:', configToken, 'Token recibido:', headerToken);
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

    // Process the incoming webhook data from proxy
    const body = req.body;
    if (typeof body === 'object' && body !== null) {
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
