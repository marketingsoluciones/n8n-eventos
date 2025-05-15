import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class WhatsAppApi implements ICredentialType {
  name = 'whatsAppApi';
  displayName = 'WhatsApp API';
documentationUrl = 'https://developers.facebook.com/docs/whatsapp/cloud-api';

  // Añadir configuración de autenticación para HTTP
 authenticate: IAuthenticateGeneric = {
  type: 'generic',
  properties: {
    headers: {
      'Authorization': 'Bearer {{$credentials.apiKey}}',
    },
  },
};
properties: INodeProperties[] = [
  {
    displayName: 'API Version',
    name: 'apiVersion',
    type: 'string',
    default: 'v22.0',
    required: true,
    description: 'The Meta API version to use (e.g., v16.0)',
  },
  {
    displayName: 'Access Token /api Key',
    name: 'apiKey',
    type: 'string',
    typeOptions: {
      password: true,
    },
    default: '',
    required: true,
    description: 'The access token for the WhatsApp Business API',
  },
  {
    displayName: 'Phone Number ID',
    name: 'phoneNumberId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of your WhatsApp Business phone number',
  },
  {
    displayName: 'Business Account ID',
    name: 'businessAccountId',
    type: 'string',
    default: '',
    description: 'The ID of your WhatsApp Business Account (WABA)',
  },
  {
    displayName: 'API URL',
    name: 'apiUrl',
    type: 'string',
    default: 'https://graph.facebook.com/{{$credentials.apiVersion}}',
    required: true,
    description: 'The base URL for the WhatsApp Business Cloud API',
  },
];}
