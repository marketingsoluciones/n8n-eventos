module.exports = {
  // Exportar los nodos
  WhatsAppDirectNode: require('./dist/WhatsApp/WhatsAppDirectNode.node').WhatsAppDirectNode,
  WhatsAppDirectTrigger: require('./dist/WhatsApp/WhatsAppDirectTrigger.node').WhatsAppDirectTrigger,
   // Nuevo nodo
  WhatsAppNativeWebhook: require('./dist/WhatsApp/WhatsAppNativeWebhook.node').WhatsAppNativeWebhook,
  SimpleWebhook: require('./dist/WhatsApp/SimpleWebhook.node').SimpleWebhook,
  // Exportar las credenciales
  WhatsAppApi: require('./dist/credentials/WhatsAppApi.credentials').WhatsAppApi,
};
