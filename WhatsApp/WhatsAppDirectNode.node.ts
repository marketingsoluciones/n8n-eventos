
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
  NodeOperationError,
  
} from 'n8n-workflow';

export class WhatsAppDirectNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'WhatsApp Direct',
    name: 'whatsAppDirect',
    icon: 'file:whatsapp.svg',
  
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Send messages via WhatsApp',
    defaults: {
      name: 'WhatsApp Direct',
      color: '#25D366',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'whatsAppApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Message',
            value: 'message',
          },
        ],
        default: 'message',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['message'],
          },
        },
        options: [
          {
            name: 'Send',
            value: 'send',
            description: 'Send a WhatsApp message',
          },
        ],
        default: 'send',
      },
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['send'],
            resource: ['message'],
          },
        },
        description: 'Phone number of the recipient (with country code)',
      },
      {
        displayName: 'Message Text',
        name: 'messageText',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['send'],
            resource: ['message'],
          },
        },
        description: 'Text of the message to send',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    // Implementation for sending WhatsApp messages
    if (resource === 'message' && operation === 'send') {
      try {
        for (let i = 0; i < items.length; i++) {
          const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
          const messageText = this.getNodeParameter('messageText', i) as string;
          
          // Here would go the actual API call to WhatsApp
          // For now we'll just simulate a successful response
          
          const responseData = {
            success: true,
            phoneNumber,
            message: messageText,
            timestamp: new Date().toISOString(),
          };
          
          returnData.push({
            json: responseData,
            pairedItem: {
              item: i,
            },
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
            pairedItem: {
              item: 0,
            },
          });
        } else {
          throw new NodeOperationError(this.getNode(), error);
        }
      }
    }

    return [returnData];
  }
}
