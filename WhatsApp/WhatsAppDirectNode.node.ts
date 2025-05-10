
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
    name: 'Send Template',
    value: 'sendTemplate',
    description: 'Send a template message',
  },
],        default: 'send',
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
  const phoneNumberId = credentials.phoneNumberId as string;

  // Implementación para enviar mensajes de WhatsApp
  if (resource === 'message') {
    try {
      for (let i = 0; i < items.length; i++) {
        const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
        
        // Preparar opciones de solicitud HTTP
        const options: IHttpRequestOptions = {
          url: `${apiUrl}/${phoneNumberId}/messages`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {},
        };

        // Construir el cuerpo de la solicitud según la operación
        if (operation === 'sendText') {
          const messageText = this.getNodeParameter('messageText', i) as string;
          
          options.body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneNumber,
            type: 'text',
            text: {
              preview_url: false,
              body: messageText,
            },
          };
        } 
        else if (operation === 'sendTemplate') {
          // Implementación para plantillas
          // Esta parte dependerá de cómo hayas configurado tus parámetros de plantilla
          // en la declaración de propiedades
        }
        
        // Realizar la llamada a la API
        try {
          console.log('Enviando solicitud a WhatsApp API:', JSON.stringify(options, null, 2));
          
          // Descomentar para hacer la llamada real a la API:
          // const response = await this.helpers.httpRequest(options);
          
          // Para fines de desarrollo, simulamos una respuesta:
          const response = {
            messaging_product: 'whatsapp',
            contacts: [
              {
                input: phoneNumber,
                wa_id: phoneNumber,
              },
            ],
            messages: [
              {
                id: 'wamid.' + Math.random().toString(36).substring(2, 15),
              },
            ],
          };
          
          returnData.push({
            json: {
              success: true,
              phoneNumber,
              ...response,
            },
            pairedItem: {
              item: i,
            },
          });
        } catch (error) {
          console.error('Error al llamar a la API de WhatsApp:', error);
          throw new NodeOperationError(this.getNode(), `Error al enviar mensaje: ${error.message}`);
        }
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
