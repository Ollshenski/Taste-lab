'use strict';

// Payment provider adapter.
//
// Online payments are not connected yet. When we integrate a provider
// (Bank of Georgia iPay, TBC Pay, Flitt, ...), implement createPayment() so it
// returns { redirectUrl } for the checkout page to send the customer to, and
// handleCallback() so it verifies the provider's signature and returns
// { orderNumber, paid }. Nothing else in the app needs to change.

function methods(settings) {
  return [
    { id: 'card', label: 'ბარათით ონლაინ', enabled: Boolean(settings.onlinePayments) },
    { id: 'cash', label: 'გადახდა მიტანისას', enabled: settings.cashOnDelivery !== false },
  ];
}

async function createPayment(order /*, settings */) {
  if (order.paymentMethod !== 'card') return null;
  // TODO: call the provider API here and return { redirectUrl }.
  return null;
}

function handleCallback(/* req */) {
  // TODO: verify provider signature, then return { orderNumber, paid: true|false }.
  return null;
}

module.exports = { methods, createPayment, handleCallback };
