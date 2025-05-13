import { } from 'n8n-core';
import {
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  IWebhookResponseData,
  IWebhookFunctions,
  NodeOperationError,
  IDataObject,
  ITriggerFunctions,
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
        httpMethod: 'GET,POST',
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
      {
        displayName: 'Only Messages',
        name: 'onlyMessages',
        type: 'boolean',
        default: true,
        description: 'Whether to trigger only on actual messages (not status updates, delivery reports, etc.)',
      },
      {
        displayName: 'Include Media',
        name: 'includeMedia',
        type: 'boolean',
        default: true,
        description: 'Whether to include media info in the output (images, documents, audio, etc.)',
      },
      {
        displayName: 'Message Types',
        name: 'messageTypes',
        type: 'multiOptions',
        displayOptions: {
          show: {
            onlyMessages: [true],
          },
        },
        options: [
          {
            name: 'Text',
            value: 'text',
          },
          {
            name: 'Image',
            value: 'image',
          },
          {
            name: 'Video',
            value: 'video',
          },
          {
            name: 'Audio',
            value: 'audio',
          },
          {
            name: 'Document',
            value: 'document',
          },
          {
            name: 'Location',
            value: 'location',
          },
          {
            name: 'Contact',
            value: 'contact',
          },
          {
            name: 'Button',
            value: 'button',
          },
          {
            name: 'List',
            value: 'list',
          },
        ],
        default: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'button', 'list'],
        description: 'The types of messages to trigger on',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    
    // Verificar si es una solicitud GET para verificación de webhook
    if (req.method === 'GET') {
      console.log('Recibida solicitud GET para verificación:', req.query);
      const query = req.query;
      
      // Verificación para WhatsApp Business API de Meta
      if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] !== undefined) {
        try {
          // Obtener el token configurado en el nodo
          const configToken = this.getNodeParameter('token') as string;
          const incomingToken = query['hub.verify_token'] as string;
          
          console.log(`Verificación de webhook - Token recibido: ${incomingToken}, Token configurado: ${configToken}`);
          
          // Verificar que el token coincida
          if (incomingToken === configToken) {
            // Si el token coincide, devolver el valor de challenge
            const challenge = query['hub.challenge'] as string;
            console.log(`Verificación exitosa, devolviendo challenge: ${challenge}`);
            
            return {
              webhookResponse: {
                statusCode: 200,
                body: challenge,
              },
            };
          } else {
            // Si el token no coincide, devolver error
            console.log('Error de verificación: token no coincide');
            
            return {
              webhookResponse: {
                statusCode: 403,
                body: {
                  error: 'Verification token mismatch',
                },
              },
            };
          }
        } catch (error) {
          console.error('Error durante verificación:', error);
          
          return {
            webhookResponse: {
              statusCode: 500,
              body: {
                error: 'Internal server error during verification',
              },
            },
          };
        }
      }
      
      // Para otras solicitudes GET no reconocidas
      return {
        webhookResponse: {
          statusCode: 400,
          body: {
            error: 'Invalid verification request',
          },
        },
      };
    }
    
    // Procesar solicitudes POST para mensajes
    const authentication = this.getNodeParameter('authentication') as string;
    const onlyMessages = this.getNodeParameter('onlyMessages', true) as boolean;
    const includeMedia = this.getNodeParameter('includeMedia', true) as boolean;
    let selectedMessageTypes: string[] = [];
    
    if (onlyMessages) {
      selectedMessageTypes = this.getNodeParameter('messageTypes', ['text']) as string[];
    }

    // Realizar verificación de autenticación si es necesario
    if (authentication === 'token') {
      const headerToken = req.headers['x-webhook-token'] || req.headers['x-api-key'];
      const configToken = this.getNodeParameter('token') as string;

      if (headerToken !== configToken) {
        console.error('WhatsApp webhook authentication failed');
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

    // Registrar los datos entrantes del webhook para depuración
    console.log('WhatsApp webhook received:', JSON.stringify(req.body).substring(0, 500) + '...');

    // Procesar los datos entrantes del webhook
    const body = req.body as IDataObject;
    
    try {
      // Verificar que tenemos un cuerpo válido
      if (!body || typeof body !== 'object') {
        return {
          webhookResponse: {
            statusCode: 400,
            body: {
              error: 'Invalid body format',
            },
          },
        };
      }
      
      // Formato genérico - procesar y devolver el payload directamente
      let processedData: IDataObject = {
        ...body,
        receivedAt: new Date().toISOString(),
        webhookSource: 'whatsapp',
      };
      
      // Procesar para Evolution API si aplica
      if (body.event === 'messages.upsert' || body.event === 'message') {
        const messages = body.messages as IDataObject[] || [];
        
        if (messages && messages.length > 0) {
          const message = messages[0] as IDataObject;
          const messageType = (message.type as string || '').toLowerCase();
          
          // Filtrar por tipo de mensaje si es necesario
          if (onlyMessages && !selectedMessageTypes.includes(messageType)) {
            // Tipo de mensaje no soportado, responder OK pero no activar workflow
            return {
              webhookResponse: {
                statusCode: 200,
                body: {
                  success: true,
                  message: 'Message received but filtered by type',
                },
              },
            };
          }
          
          // Extraer información clave para el workflow
          processedData = {
            messageId: message.id || body.id,
            from: message.from || body.from,
            fromName: message.pushName || body.pushName || '',
            to: message.to || body.to,
            type: messageType,
            timestamp: message.timestamp || body.timestamp || new Date().getTime(),
            isGroupMessage: message.isGroupMsg || body.isGroupMsg || false,
            body: message.body || body.body || '',
            rawData: body,
          };
          
          // Extraer información de medios si está presente y se solicita
          if (includeMedia && message.media) {
            processedData.media = message.media;
            
            if (message.media && typeof message.media === 'object' && (message.media as any).url) {
              processedData.mediaUrl = (message.media as any).url;
            }
          }
          
          // Extraer información de botones si es un mensaje de botón
          if (messageType === 'button' || messageType === 'interactive') {
            processedData.buttonText = message.selectedButtonId || body.selectedButtonId || '';
            processedData.buttonId = message.selectedButtonId || body.selectedButtonId || '';
          }
          
          // Extraer datos de ubicación si es un mensaje de ubicación
          if (messageType === 'location') {
            processedData.location = {
              latitude: message.lat || body.lat || 0,
              longitude: message.lng || body.lng || 0,
              address: message.loc || body.loc || '',
            };
          }
        }
      }
      
      // Procesar para WhatsApp Business API de Meta si aplica
      else if (body.object === 'whatsapp_business_account') {
        const entries = body.entry as IDataObject[] || [];
        
        if (entries && entries.length > 0) {
          const entry = entries[0] as IDataObject;
          const changes = entry.changes as IDataObject[] || [];
          
          if (changes && changes.length > 0) {
            const change = changes[0] as IDataObject;
            const value = change.value as IDataObject || {};
            const messages = value.messages as IDataObject[] || [];
            
            if (messages && messages.length > 0) {
              const message = messages[0] as IDataObject;
              const messageType = (message.type as string || '').toLowerCase();
              
              // Filtrar por tipo de mensaje si es necesario
              if (onlyMessages && !selectedMessageTypes.includes(messageType)) {
                // Tipo de mensaje no soportado, responder OK pero no activar workflow
                return {
                  webhookResponse: {
                    statusCode: 200,
                    body: {
                      success: true,
                      message: 'Message received but filtered by type',
                    },
                  },
                };
              }
              
              // Determinar si es un mensaje de grupo
              const metadata = value.metadata as IDataObject || {};
              const isGroup = metadata.phone_number_type === 'GROUP';
              
              // Extraer información clave para el workflow
              processedData = {
                messageId: message.id,
                from: message.from,
                to: metadata.display_phone_number || value.to,
                type: messageType,
                timestamp: message.timestamp || new Date().getTime(),
                isGroupMessage: isGroup,
                rawData: body,
              };
              
              // Extraer texto para mensajes de texto
              if (messageType === 'text') {
                const text = message.text as IDataObject || {};
                processedData.body = text.body || '';
              }
              
              // Extraer información de medios si está presente y se solicita
              if (includeMedia && messageType.match(/^(image|video|document|audio)$/)) {
                const media = message[messageType] as IDataObject || {};
                processedData.media = media;
                processedData.mediaId = media.id;
                
                if (media.caption) {
                  processedData.caption = media.caption;
                }
              }
              
              // Extraer respuesta de botón si es un mensaje interactivo
              if (messageType === 'interactive') {
                const interactive = message.interactive as IDataObject || {};
                
                if (interactive.type === 'button_reply') {
                  const buttonReply = interactive.button_reply as IDataObject || {};
                  processedData.buttonId = buttonReply.id;
                  processedData.buttonText = buttonReply.title;
                } else if (interactive.type === 'list_reply') {
                  const listReply = interactive.list_reply as IDataObject || {};
                  processedData.listId = listReply.id;
                  processedData.listTitle = listReply.title;
                }
              }
              
              // Extraer datos de ubicación si es un mensaje de ubicación
              if (messageType === 'location') {
                const location = message.location as IDataObject || {};
                processedData.location = {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  address: location.address,
                };
              }
            }
          }
        }
      }
      
      // Devolver los datos procesados para activar el workflow
      return {
        webhookResponse: {
          statusCode: 200,
          body: {
            success: true,
          },
        },
        workflowData: [this.helpers.returnJsonArray(processedData)],
      };
      
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      
      return {
        webhookResponse: {
          statusCode: 500,
          body: {
            error: 'Error processing webhook data',
            message: error.message,
          },
        },
      };
    }
  }
}
