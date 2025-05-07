module.exports = {
  // Exportar los nodos
  WhatsAppDirectNode: require('./dist/WhatsApp/WhatsAppDirectNode.node').WhatsAppDirectNode,
  WhatsAppDirectTrigger: require('./dist/WhatsApp/WhatsAppDirectTrigger.node').WhatsAppDirectTrigger,
  
  // Exportar las credenciales
  WhatsAppApi: require('./dist/credentials/WhatsAppApi.credentials').WhatsAppApi,
};
