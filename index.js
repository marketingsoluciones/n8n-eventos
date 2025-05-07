module.exports = {
  // Exportar los nodos
  WhatsAppDirectNode: require('./dist/nodes/WhatsApp/WhatsAppDirectNode.node').WhatsAppDirectNode,
  WhatsAppDirectTrigger: require('./dist/nodes/WhatsApp/WhatsAppDirectTrigger.node').WhatsAppDirectTrigger,
  
  // Exportar las credenciales
  WhatsAppApi: require('./dist/credentials/WhatsAppApi.credentials').WhatsAppApi,
};
