const crypto = require('crypto')

// Transfer of funds between two wallets
class Transaction {
    constructor(
        amount,
        payer, // public key
        payee // public key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}

class Block {
    constructor(prevHash, transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
// The blockchain
class Chain {
    constructor() {
        this.chain = [
            new Block('', new Transaction(0, '', ''))
        ];
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(transaction, senderPublicKey, signature) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());
        const isValid = verify.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock);
        }
    }
}
// Singleton instance
Chain.instance = new Chain();

class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

// Example
const tmob = new Wallet();
const gg = new Wallet();
const pek = new Wallet();
tmob.sendMoney(50, gg.publicKey);
gg.sendMoney(23, pek.publicKey);
pek.sendMoney(5, gg.publicKey);
pek.sendMoney(5, tmob.publicKey);
console.log(Chain.instance);