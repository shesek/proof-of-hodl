# proof-of-hodl

proof-of-[hodl](https://bitcointalk.org/index.php?topic=375643.0) is a command line tool to time-lock and release bitcoin using [OP_CHECKSEQUENCEVERIFY](https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki) - and - a web voting system where votes are weighted by ```amount of coins``` * ```lock duration```.

**NOTE:** this is early [hackathon](http://hack.bitembassy.org/)-grade software, currently running on testnet.

## Install 

 ```bash
$ npm install -g hodl

$ hodl --help
```


## Why lock?
Proving the sacrifice of some limited resource is a common technique in a variety of cryptographic protocols. In the case of locking coins, the option to trade and invest them is being temporarily sacrificed.

However, unlike similar forms of sacrifice such as [sacrifice to miners fees](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki#proving-sacrifice-to-miners-fees) or [proof of burn](https://en.bitcoin.it/wiki/Proof_of_burn), the time-lock sacrifice leaves the coins under one's control and thus implying confident and skin in the future value of bitcoin. This property makes HODL voting especially interesting for questions relevant to the future of bitcoin such as protocol changes.


## cli
The ```lock``` command takes a lock-duration, a refund address and a message (which the lock commits to),
creates an address where funds to be locked can be deposited and once a payment was received,
present the redeeming transaction so it can be saved and broadcast when the time arrives.
It also provides a proof that can be shared and verified using the ```verify``` command.

 ```bash
$ hodl lock --duration 10 --refund [addr] 'I support SegWit'

$ hodl verify [proof]
 ```


## HODL voting

A live version is hosted here: [hodl.voting](https://hodl.voting)

Votes over multiple choice questions are weighted by Bitcoin Days Locked (DBL) - the amount of coins multiplied by the number of days locked. The voter is prompted for an amount, lock duration and a refund address and presented with a QR code of a deposit address. Once a payment is received, a refund transaction is presented to be kept and broadcast later, as well as kept on the server for backup, and the vote is cast. Keys never leave the browser.
 

### License (ISC)

Copyright (c) 2017, Nadav Ivgi

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

