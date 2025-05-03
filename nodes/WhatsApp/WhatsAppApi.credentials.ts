import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class WhatsAppApi implements ICredentialType {
  name = 'whatsAppApi';
  displayName = 'WhatsApp API';
  documentationUrl = '';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    },
    {
      displayName: 'Phone Number ID',
      name: 'phoneNumberId',
      type: 'string',
      default: '',
    },
  ];
}
