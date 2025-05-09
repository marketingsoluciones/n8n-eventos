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
    const authentication = this.getNodeParameter('authentication') as string;

    // Perform authentication check if needed
    if (authentication === 'token') {
      const headerToken = req.headers['x-webhook-token'];
      const configToken = this.getNodeParameter('token') as string;

      if (headerToken !== configToken) {
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

    // Process the incoming webhook data
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
