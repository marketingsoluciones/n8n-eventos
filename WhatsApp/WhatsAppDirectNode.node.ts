
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
  NodeOperationError,
  IHttpRequestOptions,  
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
        name: 'Send Text',
        value: 'sendText',
        description: 'Send a text message',
      },
      {
        name: 'Send Image',
        value: 'sendImage',
        description: 'Send an image',
      },
      {
        name: 'Send Document',
        value: 'sendDocument',
        description: 'Send a document',
      },
      {
        name: 'Get Contact Info',
        value: 'getContactInfo',
        description: 'Get information about a contact',
      },
    ],
    default: 'sendText',
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

  // Obtener credenciales
  const credentials = await this.getCredentials('whatsAppApi');
  const apiUrl = credentials.apiUrl as string;
  const apiKey = credentials.apiKey as string;
  
  // Implementación para enviar mensajes de WhatsApp
  if (resource === 'message' && operation === 'send') {
    try {
      for (let i = 0; i < items.length; i++) {
        const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
        const messageText = this.getNodeParameter('messageText', i) as string;
        
        // Preparar la solicitud a la API de Evolution
        const options = {
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          method: 'POST',
          body: JSON.stringify({
            phone: phoneNumber,
            message: messageText,
            // Puedes añadir más parámetros según la documentación de la API
          }),
          uri: `${apiUrl}/message/text`,
          json: true,
        };
        
        // Realizar la solicitud HTTP
        const response = await this.helpers.request(options);
        
        returnData.push({
          json: response,
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
