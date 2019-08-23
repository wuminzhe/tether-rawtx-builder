# A Tether Omni Raw Transaction Builder

```
const TetherRawtxBuilder = require("tether-rawtx-builder");
const bitcore = require('bitcore-explorers').bitcore;

async function main() {
  const insight_url = "https://insight.bitpay.com";
  const network = bitcore.Networks.livenet;
  const builder = new TetherRawtxBuilder(insight_url, network);

  const fromAddressPrivateKey = "";
  const fromAddress = "";
  const toAddress = "";
  const property = 31;
  const amount = 10000;
  const fee = 0.00002;
  const transaction = await builder.buildTetherRawTransaction(fromAddressPrivateKey, fromAddress, toAddress, property, amount, fee);
  console.log(transaction);
}

main()
```
