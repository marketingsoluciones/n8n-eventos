
const { src, dest } = require('gulp');

function buildIcons() {
  return src('WhatsApp/*.svg')
    .pipe(dest('dist/WhatsApp/'));
}

exports.default = buildIcons;
exports['build:icons'] = buildIcons;
