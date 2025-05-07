import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class WhatsAppApi implements ICredentialType {
  name = 'whatsAppApi';
  displayName = 'WhatsApp API';
  documentationUrl = '';

  // Añadir configuración de autenticación para HTTP
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-KEY': '={{$credentials.apiKey}}',
        'Authorization': 'Bearer {{$credentials.apiSecret}}',
      },
    },
  };  
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
       required: true,
      description: 'La clave de API proporcionada por tu proveedor de WhatsApp',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
        required: true,
      description: 'El secreto de API para autenticación segura',   
    },
    {
      displayName: 'Phone Number ID',
      name: 'phoneNumberId',
      type: 'string',
      default: '',
      description: 'ID del número de teléfono verificado en WhatsApp Business API',   
    },
     {
      displayName: 'API URL',
      name: 'apiUrl',
      type: 'string',
      default: 'https://api.whatsapp.com/v1',
      required: true,
      description: 'URL base del servicio de API de WhatsApp',
    },
  ];
}
