'use strict';
const Decimal = require('decimal.js');
const util = require('util');
const pad = require('pad');
const explorers = require('bitcore-explorers');
const bitcore = explorers.bitcore;

toSatoshi(btc) {
  return parseInt(new Decimal(btc).times(100000000).toFixed(0));
}

var Output = require('./node_modules/bitcore-explorers/node_modules/bitcore-lib/lib/transaction/output.js');
bitcore.Transaction.prototype.addData2 = function(hex) {
  this.addOutput(new Output({
    script: bitcore.Script.buildDataOut(hex, 'hex'),
    satoshis: 0,
  }));
  return this;
};

class InsightClient {
  constructor(insight_url, network) {
    this.insight = new explorers.Insight(insight_url, network);
  }

  async oil(tankPriv, tankAddress, address, amount) {
    const utxos = await this.getEnoughUtxos(tankAddress, amount);
    const transaction = new bitcore.Transaction();
    utxos.forEach(utxo => transaction.from(utxo));
    const key = new bitcore.PrivateKey(tankPriv);
    transaction
      .to(address, amount)
      .change(tankAddress) // charge
      .sign(key);
    console.log(transaction);
    return await this.broadcast(transaction);
  }

  async broadcast(transaction) {
    const broadcast_p = util.promisify(this.insight.broadcast).bind(this.insight);
    const txid = await broadcast_p(transaction);
    return txid;
  }

  async getEnoughUtxos(fromAddress, levelAmount) {
    const getUtxos = util.promisify(this.insight.getUtxos).bind(this.insight);
    const utxos = await getUtxos(fromAddress);
    utxos.sort(function(a, b) {
      return a.satoshis - b.satoshis;
    });
    const utxosNeed = [];
    let total = 0;
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      total = total + utxo.satoshis;
      utxosNeed.push(utxo);
      if (total == levelAmount) {
        break;
      } else if (total > levelAmount && (total - levelAmount) >= 546) {
        break;
      }
    }
    return utxosNeed;
  }

  async buildTetherRawTransaction(fromPriv, fromAddress, toAddress, property, amount, fee_in_btc) {
    const privateKey = new bitcore.PrivateKey(fromPriv);

    const levelAmount = toSatoshi(fee_in_btc) + 546 // fee + waste
    const utxos = await this.getEnoughUtxos(fromAddress, levelAmount);

    const amountHex = toSatoshi(amount).toString(16);

    const transaction = new bitcore.Transaction();
    utxos.forEach(utxo => transaction.from(utxo));
    transaction
      .fee(toSatoshi(fee_in_btc)) // fee
      .to(toAddress, 546) // waste  
      .change(fromAddress) // charge to from(self)
      .addData2(`6f6d6e69${pad(16, property.toString(16), '0')}${pad(16, amountHex, '0')}`)
      .sign(privateKey);
    return transaction;
  }

  async omniSend(fromPriv, from, to, amount) {
    const transaction = await this.buildTetherRawTransaction(fromPriv, from, to, amount, this.property);

    console.log(transaction);
    return await this.broadcast(transaction);
  }
}

module.exports = InsightClient;
