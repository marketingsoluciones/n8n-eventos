import { IExecuteFunctions } from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
 // NodeExecuteFunctions, 
  IDataObject,
  IHttpRequestOptions,
   IHttpRequestMethods,
} from 'n8n-workflow';

export class WhatsAppDirectNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'WhatsApp Direct',
    name: 'whatsAppDirect',
    icon: 'file:whatsapp.svg',
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Send messages and interact via WhatsApp',
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
      // Recursos disponibles
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
          {
            name: 'Contact',
            value: 'contact',
          },
          {
            name: 'Group',
            value: 'group',
          },
        ],
        default: 'message',
      },
      
      // Operaciones para mensajes
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
            action: 'Send a text message',
          },
          {
            name: 'Send Image',
            value: 'sendImage',
            description: 'Send an image',
            action: 'Send an image',
          },
          {
            name: 'Send Document',
            value: 'sendDocument',
            description: 'Send a document',
            action: 'Send a document',
          },
          {
            name: 'Send Audio',
            value: 'sendAudio',
            description: 'Send an audio message',
            action: 'Send an audio message',
          },
          {
            name: 'Send Location',
            value: 'sendLocation',
            description: 'Send a location',
            action: 'Send a location',
          },
          {
            name: 'Send Button',
            value: 'sendButton',
            description: 'Send a message with buttons',
            action: 'Send a message with buttons',
          },
          {
            name: 'Send Template',
            value: 'sendTemplate',
            description: 'Send a template message',
            action: 'Send a template message',
          },
        ],
        default: 'sendText',
      },
      
      // Operaciones para contactos
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['contact'],
          },
        },
        options: [
          {
            name: 'Get Contact',
            value: 'getContact',
            description: 'Get contact information',
            action: 'Get contact information',
          },
          {
            name: 'Check If Exists',
            value: 'checkContact',
            description: 'Check if a number exists on WhatsApp',
            action: 'Check if a number exists on WhatsApp',
          },
          {
            name: 'Block Contact',
            value: 'blockContact',
            description: 'Block a contact',
            action: 'Block a contact',
          },
          {
            name: 'Unblock Contact',
            value: 'unblockContact',
            description: 'Unblock a contact',
            action: 'Unblock a contact',
          },
        ],
        default: 'getContact',
      },
      
      // Operaciones para grupos
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['group'],
          },
        },
        options: [
          {
            name: 'Create Group',
            value: 'createGroup',
            description: 'Create a new group',
            action: 'Create a new group',
          },
          {
            name: 'Add Participant',
            value: 'addParticipant',
            description: 'Add participant to a group',
            action: 'Add participant to a group',
          },
          {
            name: 'Remove Participant',
            value: 'removeParticipant',
            description: 'Remove participant from a group',
            action: 'Remove participant from a group',
          },
          {
            name: 'Leave Group',
            value: 'leaveGroup',
            description: 'Leave a group',
            action: 'Leave a group',
          },
        ],
        default: 'createGroup',
      },
      
      // Campos comunes
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message', 'contact'],
            operation: ['sendText', 'sendImage', 'sendDocument', 'sendAudio', 'sendLocation', 'sendButton', 'sendTemplate', 'getContact', 'checkContact', 'blockContact', 'unblockContact'],
          },
        },
        description: 'Phone number of the recipient (with country code, numbers only)',
      },
      
      // Campos específicos para mensajes de texto
      {
        displayName: 'Message Text',
        name: 'messageText',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendText'],
          },
        },
        description: 'Text of the message to send',
      },
      
      // Campos específicos para imágenes
      {
        displayName: 'Image URL',
        name: 'imageUrl',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendImage'],
          },
        },
        description: 'URL of the image to send',
      },
      {
        displayName: 'Caption',
        name: 'caption',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendImage', 'sendDocument'],
          },
        },
        description: 'Caption for the image or document',
      },
      
      // Campos específicos para documentos
      {
        displayName: 'Document URL',
        name: 'documentUrl',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendDocument'],
          },
        },
        description: 'URL of the document to send',
      },
      {
        displayName: 'Document Name',
        name: 'documentName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendDocument'],
          },
        },
        description: 'Name of the document (optional)',
      },
      
      // Campos específicos para audio
      {
        displayName: 'Audio URL',
        name: 'audioUrl',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendAudio'],
          },
        },
        description: 'URL of the audio to send',
      },
      
      // Campos específicos para ubicación
      {
        displayName: 'Latitude',
        name: 'latitude',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLocation'],
          },
        },
        description: 'Latitude of the location',
      },
      {
        displayName: 'Longitude',
        name: 'longitude',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLocation'],
          },
        },
        description: 'Longitude of the location',
      },
      {
        displayName: 'Location Name',
        name: 'locationName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendLocation'],
          },
        },
        description: 'Name of the location (optional)',
      },
      
      // Campos específicos para botones
      {
        displayName: 'Button Title',
        name: 'buttonTitle',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendButton'],
          },
        },
        description: 'Title of the button message',
      },
      {
        displayName: 'Button Text',
        name: 'buttonText',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendButton'],
          },
        },
        description: 'Text of the button message',
      },
      {
        displayName: 'Buttons',
        name: 'buttons',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        default: {},
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendButton'],
          },
        },
        options: [
          {
            name: 'buttonsValues',
            displayName: 'Buttons',
            values: [
              {
                displayName: 'Button Text',
                name: 'buttonText',
                type: 'string',
                default: '',
                description: 'Text of the button',
              },
            ],
          },
        ],
        description: 'Buttons to include in the message',
      },
      
      // Campos específicos para templates
      {
        displayName: 'Template Name',
        name: 'templateName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendTemplate'],
          },
        },
        description: 'Name of the template',
      },
      {
        displayName: 'Template Parameters',
        name: 'templateParameters',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        default: {},
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['sendTemplate'],
          },
        },
        options: [
          {
            name: 'parameters',
            displayName: 'Parameters',
            values: [
              {
                displayName: 'Parameter Value',
                name: 'parameterValue',
                type: 'string',
                default: '',
                description: 'Value of the template parameter',
              },
            ],
          },
        ],
        description: 'Parameters to include in the template',
      },
      
      // Campos específicos para grupos
      {
        displayName: 'Group ID',
        name: 'groupId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['addParticipant', 'removeParticipant', 'leaveGroup'],
          },
        },
        description: 'ID of the WhatsApp group',
      },
      {
        displayName: 'Group Name',
        name: 'groupName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['createGroup'],
          },
        },
        description: 'Name of the WhatsApp group to create',
      },
      {
        displayName: 'Participant Phone Numbers',
        name: 'participants',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['createGroup', 'addParticipant', 'removeParticipant'],
          },
        },
        description: 'Phone numbers of participants (comma separated, with country code)',
      },
    ],
  };

  async execute(this:  NodeExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    // Obtener credenciales
    const credentials = await this.getCredentials('whatsAppApi');
    const apiUrl = credentials.apiUrl as string;
    const apiKey = credentials.apiKey as string;
    const phoneNumberId = credentials.phoneNumberId as string;

    // Validar credenciales
    if (!apiUrl || !apiKey) {
      throw new NodeOperationError(this.getNode(), 'API URL and API Key are required!');
    }

    // Funciones auxiliares para validación y envío de solicitudes
    const validatePhoneNumber = (phone: string, itemIndex: number): string => {
      // Limpiar el número: eliminar espacios, guiones, paréntesis, etc.
      const cleanedPhone = phone.replace(/[^0-9]/g, '');
      
      // Verificar que solo contiene dígitos y tiene una longitud razonable
      if (!cleanedPhone.match(/^\d+$/) || cleanedPhone.length < 10 || cleanedPhone.length > 15) {
        throw new NodeOperationError(
          this.getNode(),
          `Invalid phone number format: ${phone}. Use only digits including country code.`,
          { itemIndex }
        );
      }
      
      return cleanedPhone;
    };

    const sendRequest = async (
      endpoint: string,
      method: string,
      body: IDataObject,
      itemIndex: number
    ): Promise<IDataObject> => {
      try {
        const options: IHttpRequestOptions = {
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${credentials.apiSecret}`,
          },
         method: method as IHttpRequestMethods,
          body,
          url: `${apiUrl}${endpoint}`,
          json: true,
        };

        return await this.helpers.httpRequest(options);
      } catch (error) {
        // Mejorar mensajes de error específicos
        if (error.statusCode === 401) {
          throw new NodeOperationError(
            this.getNode(),
            'Authentication failed. Please check your API credentials.',
            { itemIndex }
          );
        } else if (error.statusCode === 404) {
          throw new NodeOperationError(
            this.getNode(),
            'Resource not found. Please verify the endpoint or WhatsApp number.',
            { itemIndex }
          );
        } else if (error.statusCode === 400) {
          throw new NodeOperationError(
            this.getNode(),
            `Bad request: ${error.message || 'Unknown error'}`,
            { itemIndex }
          );
        }
        
        // Para otros errores, re-lanzar con un mensaje claro
        throw new NodeOperationError(
          this.getNode(),
          `WhatsApp API error: ${error.message || 'Unknown error'}`,
          { itemIndex }
        );
      }
    };

    try {
      // Procesar cada elemento de entrada
      for (let i = 0; i < items.length; i++) {
        let responseData: IDataObject = {};
        
        //------------------------------------------------------------------------------------------
        // Recurso: Message
        //------------------------------------------------------------------------------------------
        if (resource === 'message') {
          // === Operación: Enviar mensaje de texto ===
          if (operation === 'sendText') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const messageText = this.getNodeParameter('messageText', i) as string;
            
            responseData = await sendRequest('/message/text', 'POST', {
              phone: phoneNumber,
              message: messageText,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Enviar imagen ===
          else if (operation === 'sendImage') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const imageUrl = this.getNodeParameter('imageUrl', i) as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            
            responseData = await sendRequest('/message/image', 'POST', {
              phone: phoneNumber,
              image: imageUrl,
              caption: caption || undefined,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Enviar documento ===
          else if (operation === 'sendDocument') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const documentUrl = this.getNodeParameter('documentUrl', i) as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            const documentName = this.getNodeParameter('documentName', i, '') as string;
            
            responseData = await sendRequest('/message/document', 'POST', {
              phone: phoneNumber,
              document: documentUrl,
              caption: caption || undefined,
              fileName: documentName || undefined,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Enviar audio ===
          else if (operation === 'sendAudio') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const audioUrl = this.getNodeParameter('audioUrl', i) as string;
            
            responseData = await sendRequest('/message/audio', 'POST', {
              phone: phoneNumber,
              audio: audioUrl,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Enviar ubicación ===
          else if (operation === 'sendLocation') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const latitude = this.getNodeParameter('latitude', i) as string;
            const longitude = this.getNodeParameter('longitude', i) as string;
            const locationName = this.getNodeParameter('locationName', i, '') as string;
            
            responseData = await sendRequest('/message/location', 'POST', {
              phone: phoneNumber,
              lat: latitude,
              lng: longitude,
              name: locationName || undefined,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Enviar botones ===
          else if (operation === 'sendButton') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const buttonTitle = this.getNodeParameter('buttonTitle', i) as string;
            const buttonText = this.getNodeParameter('buttonText', i) as string;
            
            // Obtener los botones desde la colección
            const buttonsCollection = this.getNodeParameter('buttons.buttonsValues', i, []) as IDataObject[];
            const buttons = buttonsCollection.map((button) => ({
              buttonText: button.buttonText,
              buttonId: `btn_${Math.random().toString(36).substring(2, 10)}`, // ID aleatorio para el botón
            }));
            
            if (buttons.length === 0) {
              throw new NodeOperationError(
                this.getNode(),
                'At least one button is required for a button message.',
                { itemIndex: i }
              );
            }
            
            responseData = await sendRequest('/message/buttons', 'POST', {
              phone: phoneNumber,
              title: buttonTitle,
              text: buttonText,
              buttons,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Enviar plantilla ===
          else if (operation === 'sendTemplate') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const templateName = this.getNodeParameter('templateName', i) as string;
            
            // Obtener los parámetros de la plantilla
            const templateParamsCollection = this.getNodeParameter('templateParameters.parameters', i, []) as IDataObject[];
            const parameters = templateParamsCollection.map((param) => param.parameterValue);
            
            responseData = await sendRequest('/message/template', 'POST', {
              phone: phoneNumber,
              template: templateName,
              parameters,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
        }
        
        //------------------------------------------------------------------------------------------
        // Recurso: Contact
        //------------------------------------------------------------------------------------------
        else if (resource === 'contact') {
          // === Operación: Obtener información de contacto ===
          if (operation === 'getContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            responseData = await sendRequest(`/contact/info?phone=${phoneNumber}`, 'GET', {}, i);
          }
          
          // === Operación: Verificar si un número existe en WhatsApp ===
          else if (operation === 'checkContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            responseData = await sendRequest(`/contact/check?phone=${phoneNumber}`, 'GET', {}, i);
          }
          
          // === Operación: Bloquear contacto ===
          else if (operation === 'blockContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            responseData = await sendRequest('/contact/block', 'POST', {
              phone: phoneNumber,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Desbloquear contacto ===
          else if (operation === 'unblockContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            responseData = await sendRequest('/contact/unblock', 'POST', {
              phone: phoneNumber,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
        }
        
        //------------------------------------------------------------------------------------------
        // Recurso: Group
        //------------------------------------------------------------------------------------------
        else if (resource === 'group') {
          // === Operación: Crear grupo ===
          if (operation === 'createGroup') {
            const groupName = this.getNodeParameter('groupName', i) as string;
            const participantsString = this.getNodeParameter('participants', i) as string;
            
            // Dividir y validar los números de teléfono
            const participants = participantsString.split(',').map(phone => {
              return validatePhoneNumber(phone.trim(), i);
            });
            
            responseData = await sendRequest('/group/create', 'POST', {
              name: groupName,
              participants,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Añadir participante ===
          else if (operation === 'addParticipant') {
            const groupId = this.getNodeParameter('groupId', i) as string;
            const participantsString = this.getNodeParameter('participants', i) as string;
            
            // Dividir y validar los números de teléfono
            const participants = participantsString.split(',').map(phone => {
              return validatePhoneNumber(phone.trim(), i);
            });
            
            responseData = await sendRequest('/group/add-participant', 'POST', {
              groupId,
              participants,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Eliminar participante ===
          else if (operation === 'removeParticipant') {
            const groupId = this.getNodeParameter('groupId', i) as string;
            const participantsString = this.getNodeParameter('participants', i) as string;
            
            // Dividir y validar los números de teléfono
            const participants = participantsString.split(',').map(phone => {
              return validatePhoneNumber(phone.trim(), i);
            });
            
            responseData = await sendRequest('/group/remove-participant', 'POST', {
              groupId,
              participants,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
          
          // === Operación: Salir del grupo ===
          else if (operation === 'leaveGroup') {
            const groupId = this.getNodeParameter('groupId', i) as string;
            
            responseData = await sendRequest('/group/leave', 'POST', {
              groupId,
              instanceName: phoneNumberId || 'default',
            }, i);
          }
        }
        
        // Añadir el resultado al array de datos de retorno
        returnData.push({
          json: responseData,
          pairedItem: {
            item: i,
          },
        });
      }
    } catch (error) {
      // Si está configurado para continuar en caso de error, devolver el error como un elemento más
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
        // De lo contrario, propagar el error
        throw error;
      }
    }

    return [returnData];
  }
}
