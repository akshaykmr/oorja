Package.describe({
  name: 'pauli:accounts-linkedin:custom',
  summary: "Login service for LinkedIn accounts, use with Meteor 1.6.1 & up",
  version: "3.1.0",
  git: "https://github.com/PoBuchi/meteor-accounts-linkedin.git"
});

Package.onUse(function(api) {
  api.versionsFrom('1.6.1')

  api.use('accounts-base', ['client', 'server']);
  api.imply('accounts-base', ['client', 'server']);

  api.use('accounts-oauth', ['client', 'server']);
  api.use('pauli:linkedin-oauth@3.1.0', ['client', 'server']);

  api.use('pauli:linkedin-oauth');
  api.imply('pauli:linkedin-oauth');

  api.addFiles("linkedin.js");
});
