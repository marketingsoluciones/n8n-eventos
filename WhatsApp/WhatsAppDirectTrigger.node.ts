import { IWebhookFunctions } from 'n8n-core';
import {
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  IDataObject,
  NodeOperationError,
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
    const authentication = this.getNodeParameter('authentication') as string;
    const onlyMessages = this.getNodeParameter('onlyMessages', true) as boolean;
    const includeMedia = this.getNodeParameter('includeMedia', true) as boolean;
    let selectedMessageTypes: string[] = [];
    
    if (onlyMessages) {
      selectedMessageTypes = this.getNodeParameter('messageTypes', ['text']) as string[];
    }

    // Perform authentication check if needed
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

    // Log the incoming webhook data for debugging
    console.log('WhatsApp webhook received:', JSON.stringify(req.body).substring(0, 500) + '...');

    // Process the incoming webhook data
    const body = req.body as IDataObject;
    
    try {
      // Format will depend on Evolution API or other WhatsApp APIs
      // Here we try to handle common formats
      
      // Check if this is valid webhook data
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
      
      // Check for Evolution API format
      if (body.event === 'messages.upsert' || body.event === 'message') {
        // Evolution API webhook format
        
        const processedData = this.processEvolutionApiWebhook(body, onlyMessages, selectedMessageTypes, includeMedia);
        
        if (processedData) {
          return {
            webhookResponse: {
              statusCode: 200,
              body: {
                success: true,
              },
            },
            workflowData: [this.helpers.returnJsonArray(processedData)],
          };
        }
      }
      
      // Handle Meta/WhatsApp Business API format
      else if (body.object === 'whatsapp_business_account') {
        const processedData = this.processMetaWebhook(body, onlyMessages, selectedMessageTypes, includeMedia);
        
        if (processedData) {
          return {
            webhookResponse: {
              statusCode: 200,
              body: {
                success: true,
              },
            },
            workflowData: [this.helpers.returnJsonArray(processedData)],
          };
        }
      }
      
      // Generic format - try our best to extract useful information
      else {
        // Pass through the data directly with some formatting
        const basicOutput = {
          ...body,
          receivedAt: new Date().toISOString(),
          webhookSource: 'whatsapp',
        };
        
        return {
          webhookResponse: {
            statusCode: 200,
            body: {
              success: true,
            },
          },
          workflowData: [this.helpers.returnJsonArray(basicOutput)],
        };
      }
      
      // Default response if no specific handler matched but request was valid
      return {
        webhookResponse: {
          statusCode: 200,
          body: {
            success: true,
            message: 'Webhook received but no actionable data found',
          },
        },
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
  
  // Process webhook data from Evolution API
  private processEvolutionApiWebhook(
    body: IDataObject,
    onlyMessages: boolean,
    selectedMessageTypes: string[],
    includeMedia: boolean,
  ): IDataObject | null {
    // Structure depends on exact Evolution API version
    const messages = body.messages as IDataObject[] || [];
    
    if (!messages || !messages.length) {
      // No messages in the webhook
      return null;
    }
    
    const message = messages[0] as IDataObject;
    const messageType = (message.type as string || '').toLowerCase();
    
    // Filter by message type if required
    if (onlyMessages && !selectedMessageTypes.includes(messageType)) {
      return null;
    }
    
    // Extract the key information for the workflow
    const processedData: IDataObject = {
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
    
    // Add the chat name if it's a group
    if (processedData.isGroupMessage) {
      processedData.chatName = message.chat?.name || body.chat?.name || '';
    }
    
    // Extract media information if present and requested
    if (includeMedia && message.media) {
      processedData.media = message.media;
      
      if (message.media.url) {
        processedData.mediaUrl = message.media.url;
      }
    }
    
    // Extract button info if it's a button message
    if (messageType === 'button' || messageType === 'interactive') {
      processedData.buttonText = message.selectedButtonId || body.selectedButtonId || '';
      processedData.buttonId = message.selectedButtonId || body.selectedButtonId || '';
    }
    
    // Extract location data if it's a location message
    if (messageType === 'location') {
      processedData.location = {
        latitude: message.lat || body.lat || 0,
        longitude: message.lng || body.lng || 0,
        address: message.loc || body.loc || '',
      };
    }
    
    return processedData;
  }
  
  // Process webhook data from Meta/WhatsApp Business API
  private processMetaWebhook(
    body: IDataObject,
    onlyMessages: boolean,
    selectedMessageTypes: string[],
    includeMedia: boolean,
  ): IDataObject | null {
    // Extract entries array
    const entries = body.entry as IDataObject[] || [];
    
    if (!entries || !entries.length) {
      return null;
    }
    
    // Get the first entry
    const entry = entries[0] as IDataObject;
    const changes = entry.changes as IDataObject[] || [];
    
    if (!changes || !changes.length) {
      return null;
    }
    
    // Get the first change
    const change = changes[0] as IDataObject;
    const value = change.value as IDataObject || {};
    const messages = value.messages as IDataObject[] || [];
    
    if (!messages || !messages.length) {
      return null;
    }
    
    // Get the first message
    const message = messages[0] as IDataObject;
    const messageType = (message.type as string || '').toLowerCase();
    
    // Filter by message type if required
    if (onlyMessages && !selectedMessageTypes.includes(messageType)) {
      return null;
    }
    
    // Determine if it's a group message
    const metadata = value.metadata as IDataObject || {};
    const isGroup = metadata.phone_number_type === 'GROUP';
    
    // Extract the key information for the workflow
    const processedData: IDataObject = {
      messageId: message.id,
      from: message.from,
      to: metadata.display_phone_number || value.to,
      type: messageType,
      timestamp: message.timestamp || new Date().getTime(),
      isGroupMessage: isGroup,
      rawData: body,
    };
    
    // Extract text for text messages
    if (messageType === 'text') {
      const text = message.text as IDataObject || {};
      processedData.body = text.body || '';
    }
    
    // Extract media information if present and requested
    if (includeMedia && messageType.match(/^(image|video|document|audio)$/)) {
      const media = message[messageType] as IDataObject || {};
      processedData.media = media;
      processedData.mediaId = media.id;
      
      if (media.caption) {
        processedData.caption = media.caption;
      }
    }
    
    // Extract button response if it's an interactive message
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
    
    // Extract location data if it's a location message
    if (messageType === 'location') {
      const location = message.location as IDataObject || {};
      processedData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      };
    }
    
    return processedData;
  }
}
