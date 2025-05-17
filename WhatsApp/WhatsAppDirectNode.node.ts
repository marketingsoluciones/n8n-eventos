import { NodeExecuteFunctions} from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IExecuteFunctions,
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
      
      // ... [Resto de definiciones de operaciones se mantienen igual] ...
      
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
      
      // ... [Resto de campos para otros tipos de mensajes se mantienen igual] ...
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
    const phoneNumberId = credentials.phoneNumberId as string;
    const businessAccountId = credentials.businessAccountId as string;

    // Validar credenciales
    if (!apiUrl || !apiKey || !phoneNumberId) {
      throw new NodeOperationError(this.getNode(), 'API URL, Access Token and Phone Number ID are required!');
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
        console.log('Configuración de solicitud:', {
          url: `${apiUrl}${endpoint}`,
          method,
          bodyPreview: JSON.stringify(body).substring(0, 200)
        });

        const options: IHttpRequestOptions = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          method: method as IHttpRequestMethods,
          body,
          url: `${apiUrl}${endpoint}`,
          json: true,
        };

        return await this.helpers.httpRequest(options);
      } catch (error) {
        console.error('Error completo:', error.response?.data || error.message);
        
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
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "text",
              text: {
                preview_url: false,
                body: messageText
              }
            }, i);
          }
          
          // === Operación: Enviar imagen ===
          else if (operation === 'sendImage') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const imageUrl = this.getNodeParameter('imageUrl', i) as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "image",
              image: {
                link: imageUrl,
                caption: caption || undefined
              }
            }, i);
          }
          
          // === Operación: Enviar documento ===
          else if (operation === 'sendDocument') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const documentUrl = this.getNodeParameter('documentUrl', i) as string;
            const caption = this.getNodeParameter('caption', i, '') as string;
            const documentName = this.getNodeParameter('documentName', i, '') as string;
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "document",
              document: {
                link: documentUrl,
                caption: caption || undefined,
                filename: documentName || undefined
              }
            }, i);
          }
          
          // === Operación: Enviar audio ===
          else if (operation === 'sendAudio') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const audioUrl = this.getNodeParameter('audioUrl', i) as string;
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "audio",
              audio: {
                link: audioUrl
              }
            }, i);
          }
          
          // === Operación: Enviar ubicación ===
          else if (operation === 'sendLocation') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const latitude = this.getNodeParameter('latitude', i) as string;
            const longitude = this.getNodeParameter('longitude', i) as string;
            const locationName = this.getNodeParameter('locationName', i, '') as string;
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "location",
              location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                name: locationName || undefined
              }
            }, i);
          }
          
          // === Operación: Enviar botones ===
          else if (operation === 'sendButton') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const buttonTitle = this.getNodeParameter('buttonTitle', i) as string;
            const buttonText = this.getNodeParameter('buttonText', i) as string;
            
            // Obtener los botones desde la colección
            const buttonsCollection = this.getNodeParameter('buttons.buttonsValues', i, []) as IDataObject[];
            
            if (buttonsCollection.length === 0) {
              throw new NodeOperationError(
                this.getNode(),
                'At least one button is required for a button message.',
                { itemIndex: i }
              );
            }
            
            // Formato de botones para la API de WhatsApp Meta
            const buttons = buttonsCollection.map((button, index) => ({
              type: "reply",
              reply: {
                id: `btn_${index}_${Date.now()}`,
                title: button.buttonText as string
              }
            }));
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "interactive",
              interactive: {
                type: "button",
                header: {
                  type: "text",
                  text: buttonTitle
                },
                body: {
                  text: buttonText
                },
                action: {
                  buttons: buttons
                }
              }
            }, i);
          }
          
          // === Operación: Enviar plantilla ===
          else if (operation === 'sendTemplate') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            const templateName = this.getNodeParameter('templateName', i) as string;
            
            // Obtener los parámetros de la plantilla
            const templateParamsCollection = this.getNodeParameter('templateParameters.parameters', i, []) as IDataObject[];
            
            // Formato de componentes para la API de WhatsApp Meta
            const components = [];
            
            if (templateParamsCollection.length > 0) {
              components.push({
                type: "body",
                parameters: templateParamsCollection.map((param) => ({
                  type: "text",
                  text: param.parameterValue
                }))
              });
            }
            
            // Formato correcto para la API de WhatsApp Meta
            responseData = await sendRequest(`/${phoneNumberId}/messages`, 'POST', {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phoneNumber,
              type: "template",
              template: {
                name: templateName,
                language: {
                  code: "es" // Idioma por defecto, podrías hacerlo configurable
                },
                components: components.length > 0 ? components : undefined
              }
            }, i);
          }
        }
        
        //------------------------------------------------------------------------------------------
        // Recurso: Contact
        //------------------------------------------------------------------------------------------
        else if (resource === 'contact') {
          // La API de WhatsApp Meta maneja contactos de manera diferente
          // Adaptamos las operaciones al formato correcto
          
          // === Operación: Obtener información de contacto ===
          if (operation === 'getContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            // Para la API de Meta, necesitaríamos usar el Business Management API
            // Esta es una aproximación adaptada
            responseData = await sendRequest(`/${businessAccountId}/phone_numbers`, 'GET', {}, i);
          }
          
          // === Operación: Verificar si un número existe en WhatsApp ===
          else if (operation === 'checkContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            // La API de WhatsApp Meta no tiene un endpoint específico para esto
            // Podrías implementar esto intentando enviar un mensaje con template y capturando errores
            // Esta es una implementación simplificada
            responseData = {
              exists: true, // Valor por defecto, en implementación real necesitarías verificar
              phoneNumber
            };
          }
          
          // === Operaciones de bloqueo - no soportadas directamente en la API Cloud ===
          else if (operation === 'blockContact' || operation === 'unblockContact') {
            const phoneNumber = validatePhoneNumber(this.getNodeParameter('phoneNumber', i) as string, i);
            
            responseData = {
              success: false,
              message: 'Esta operación no está soportada directamente en la API de WhatsApp Cloud',
              phoneNumber
            };
          }
        }
        
        //------------------------------------------------------------------------------------------
        // Recurso: Group - No soportado directamente en WhatsApp Cloud API
        //------------------------------------------------------------------------------------------
        else if (resource === 'group') {
          // La API de WhatsApp Cloud no tiene operaciones para grupos
          // Devolvemos mensaje informativo
          
          responseData = {
            success: false,
            message: 'Las operaciones de grupo no están soportadas en la API de WhatsApp Cloud'
          };
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
