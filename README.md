# CENSUS-CHAIN &nbsp;
-----
A block-chain web application created as a more transparent and accessible means for both submitting and recording US Census data. Powered by **Solidity** using **web3** via **Truffle** framework.

##### Table of contents
1. Getting Started
2. Usage
3. Files
4. Features (in-depth)

### Getting started
*Note: Census-Chain is not yet deployed on a public block-chain network. Installation instructions are intended to create and run a local block-chain for Census-Chain testing and usage.*

Install:
- [Node.js](https://nodejs.org/en/download/) and `npm` (included in the Node.js install).
- [Ganache](https://github.com/trufflesuite/ganache) to run a local block-chain.

Use the package manager `npm` to install lite-server and truffle suite.
```
npm install lite-server
npm install -g truffle
```

Navigate to project directory using native OS command prompt. Compile and migrate contracts with truffle:
``` 
$truffle compile 
$truffle migrate --reset
```
1. Launch Ganache and create a new workspace.
2. Add project's `truffle-config.js` to workspace.
3. Configure your browser's [Metamask](https://metamask.io/) to run on Ganache's default RPC server `HTTP://127.0.0.1:7545`
4. Import wallet with the (Ganache) mnemonic
5. Deploy project in test development mode with `$npm run dev`


#### Usage
##### Key Generator ![#F0F0F0](https://placehold.it/15/F0F0F0/000000?text=+)
Click [generate] to create a private key with the Oracle contract.
*Important note: The signer of Key Generator functions in this model is the end-user. In an ideal production setting with off-chain public-private key generation, a single 'Oracle' address would handle this, keeping end-user identity untied to private key traceability*
* Generation requires **signing twice** for (1) private-key dissimulation and (2) signed-hash generation.
* Registration requires **one confirm** transaction to write key on-chain.

##### Key Verifier ![#F0F0F0](https://placehold.it/15/F0F0F0/000000?text=+)
Enter private key and press [verify]

* Verification requires **signing once** for signed-hash generation.

##### House Registration ![#f0ad4e](https://placehold.it/15/f0ad4e/000000?text=+)
Complete form details and submit with [register house]
* Form only shows if user has not yet registered a House.
* Transaction will revert and alert user if private key fails verification
* User's House details will display when successful.

##### Adding a Person ![#337ab7](https://placehold.it/15/337ab7/000000?text=+)
Complete form details and submit with [add person]
* Form only shows if user has a registered House.
* Transaction will revert if user has no registered House.
* You cannot add a Person if House *max residents* is reached.

##### Pulling Data ![#F0F0F0](https://placehold.it/15/F0F0F0/000000?text=+)
* [Test-State] - Select a state and return a list of corresponding registered addresses
* [Test - House] - Enter an address and return JSON of desired House information.


#### Files
- **Census.sol** -  Main solidity contract responsible for handling the registration of homes, its residents, and other associated Census survey information. Also contains essential functions for retrieving aforementioned data.
- **Oracle.sol** - Oracle contract which stores mapped encrypted data to verify distributed private keys. Keys are not mapped to identifiable users in an effort to preserve anonymity and enforce the legitemacy of survey submissions.
- **app.js** - Manages all web3-based artifacts and functions to allow interaction between block-chain, contracts, and web-application.


#### Features
##### Oracle:
###### Private key generation `keyGen()`
*The creation of accounts producing an address-privatekey pair has been deprecated with web3 v0.2.0. An alterate method of creating an "off-chain key pair" has been replaced with a loose workaround for demonstration purposes.*
*Note: Use of external node-js libraries to create a key pair is not supported in this compiled truffle project 'box'*
1. Creates a random ETH account (address) using `web3.personal.newAccount()` as the *private key*.
2. Passes the private key as the string to be signed via `web3.personal.sign()`.
3. Output signed-hash is trimmed to ETH address format and passed again into `web3.personal.sign()`.
4. Hash output is formatted to *bytes32* for on-chain mapping.

###### Private key verification `keyVerify()`
*Using `web3.personal.sign()` produces the same output hash for the same string input, allowing the 'private key' to be a reliable means of verification in this model.*
1. Performs steps 2 & 3 in **Private key generation**
2. Formats output hash into *bytes32*
3. Passes hash through `keyVerify()` to ensure on-chain hash matches generated output.

###### Key limits `setKeyLimit()`
Limit is set to prevent excessive submissions in attack or private key generation compromise. Total allowed keys are set by owner, and not by constructor. This allows for adjustments if population is under-projected, and allows change transparency should this intel be useful for researchers.

##### Census:
###### Knowing your `House{}`
A struct which serves as a unique identifier mapped to the interacting user's ETH address. Contains official US Census parameters.

*Notable params:*
    - `id` as a unique identifier more digestable than a mapped address
    - `stateCode` for Census-related geo-mapping of data.
    - `residentList[]` to add accountability and trend parsing for residents' living situation.

###### Functions
* `addHouse()` -- Registers House on-chain with Census information. **Requires valid registered *private key*.**
* `getHouse()` -- Retrieves House information of a specified ETH address.

###### Introducing a `Person{}`
A struct which contains information of a registered resident.

*Notable params:*
    - `id` to identify resident uniqueness and stored in House `residentList[]`.
    - `home` for easier calling of all residents' details in a single House

###### Functions
* `addPerson()` -- Adds a new Person struct on-chain. **Requires interacting address to have a registered House.**
* `getPerson()` -- Retrieves resident info by Person ID.
* `getPeople()` -- Returns a information of multiple Person(s) info as a list of parameter lists.
* `getPersonMore() / getPeopleMore()` -- These `More()` variants return additional information of Person/People, namely *Reason for living in House* and *Relation to Person 1 of House* as a means to prevent stack overflow.

##### Use case:
###### Gather data with `getStateHouses()` to return a list of House addresses matching a given State code.
1. Addresses can then be used with `getHouse()` to retrieve more detailed info.
2. Call `getPeople()` passing in returned House address' `residentList[]` for more insight.
    *Future compounding of functions can be expanded to tailor to desired research.*

##### Final notes:
Thanks to the staff of CSCI E-118!































