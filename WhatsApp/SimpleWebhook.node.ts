import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  IDataObject,
} from 'n8n-workflow';

export class SimpleWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Simple Test Webhook',
    name: 'simpleWebhook',
    icon: 'file:whatsapp.svg',
    group: ['trigger'],
    version: 1,
    description: 'Simple test webhook for debugging',
    defaults: {
      name: 'Simple Test Webhook',
      color: '#FF0000',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'GET',
        responseMode: 'onReceived',
        path: 'test',
      },
    ],
    properties: [],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    // Simplest possible implementation
    const req = this.getRequestObject();
    console.log('SimpleWebhook received request:', req.method);
    
    // If there's a challenge parameter, return it
    const challenge = req.query['hub.challenge'];
    if (challenge) {
      console.log('Returning challenge:', challenge);
      return {
        webhookResponse: {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
          body: challenge,
        },
        // Usar helpers.returnJsonArray para crear el formato correcto
        workflowData: [this.helpers.returnJsonArray({ received: true })],
      };
    }
    
    // Default response
    return {
      webhookResponse: {
        statusCode: 200,
        body: 'OK from SimpleWebhook',
      },
      // Usar helpers.returnJsonArray para crear el formato correcto
      workflowData: [this.helpers.returnJsonArray({ received: true })],
    };
  }
}
