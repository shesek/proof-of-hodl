# proof-of-hodl


proof-of-[hodl](https://bitcointalk.org/index.php?topic=375643.0) is a command line tool to time-lock and release bitcoin using [OP_CHECKLOCKTIMEVERIFY](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki) - and - a web voting system where votes are weighted by ```amount of coins``` * ```lock duration```.


## Install 

 ```bash
$ npm install hodl
```


## Why lock?
Proving the sacrifice of some limited resource is a common technique in a variety of cryptographic protocols. In the case of locking coins, the option to trade and invest them is being temporarily sacrificed.

However, unlike similar forms of sacrifice such as [sacrifice to miners fees](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki#proving-sacrifice-to-miners-fees) or [proof of burn](https://en.bitcoin.it/wiki/Proof_of_burn), the time-lock sacrifice leaves the coins under one's control and thus implying confident and skin in the future value of bitcoin. This property makes HODL voting especially interesting for questions relevant to the future of bitcoin such as protocol changes.


## cli
The ```lock``` command takes a lock-duration, a refund address and an optional message, creates an address where funds to be locked can be deposited and once a payment was received, present the redeeming transaction so it can be saved and broadcast when the time arrives.  It also provides a proof that can be shared and verified using the ```verify``` command.

 ```bash
hodl lock --duration 10 --refund [addr] 'I support SegWit'
 ```
 ```bash
hodl verify [proof]
 ```


## HODL voting 
A live version is hosted here: [hodl.voting](https://hodl.voting)

Votes over multiple choice questions are weighted by Bitcoin Days Locked (DBL) - the amount of coins multiplied by the number of days locked. The voter is prompted for an amount, lock duration and a refund address and presented with a QR code of a deposit address. Once a payment is received, a refund transaction is presented to be kept and broadcast later, as well as kept on the server for backup, and the vote is cast. Keys never leave the browser.

TODO: additional install / run instructions for the web?
 

### License

[WTFPL](http://www.wtfpl.net/txt/copying)

