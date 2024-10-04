* Salt
    * Alias: 20240925-Salt1
* Public/Private key pairs
    * Alias: 20240925-Key1
    * Algo: Ed25519
    * If HD, then use Salt, otherwise use other logic
* AIDs
    * Alias: Device 1, Work group 1, etc.
    * Algo: Randy, Salty, Group, Extern, etc.
    * Set of current keys signature weights `isith`: ['1/2', '1/2'],
    * Set of Next keys weight `nsith`: ['1/2', '1/2'],
    * Witness threshold of acceptable duplicity `toad`: kargsAID.toad,
    * Set of `wits`: Identifiers who are non-transferable,
    * Set of signing keys `states`: Public/Private key pairs (one key is single-sig, multiple keys is multi-sig),
    * Set of rotation keys `rstates`: Public/Private key pairs (one key is single-rot, multiple keys is multi-rot),
    * Make this a delgatee of the delegator user `delpre`: A different Identifier who must approve the delegation,
* User
    * User configuration includes:
        * Alias
        * Identifiers
           * AIDs
           * Other (did:webs)?
        * Agents
* Agent serves the user.... could potentially have multiple agents?
    * Agent configuration includes:
        * Alias
        * Identifer that is the controller
        * Identifier of the agent
        * KERIA server for the agent
* Credentials
   * Credential configuration includes:
      * Schema oobi
      * Attributes (must be attributes 
         * ex. "rp" = "user1"
         * ex. "LEI" = "SOME LEI VALUE"
* Witness
    * Witness configuration includes:
        * Alias
        * Identifier that is non-transferable (no rotation keys)
        * Server address
* Watchers
    * Watcher configuration includes:
        * Alias
        * Server address
* OOBIs
    * OOBIs configuration includes:
        * Alias
        * Identifier
        * URLs = agent or witness urls
* Actions
   * Excplicit    
      * Issue a credential
         * Cred Alias
         * Issuer
         * Issuee
         * Optionally specify the registry alias to issue the credential on
   * Implicit
      * user select identifier
        * configure alias filter
      * user select credential
         * configure schema filter
         * configure value filter for diffreent fields
            * for instance the role name
            * for instance the issuer aid
        * filter by 'chain'? (i.e. the chain of schemas or issuers)
        * other filters? See filtering logic for keria
       * user fetch other user oobis (schemas, etc)
       * user creates other user contacts... this should map perfectly to the user names, etc. in the configuration file
       * user resolve contact oobis
       * Some users issue credentials
           * Same configurable attributes as the credential selection filter above
           * Should be the same regardless of multi-sig/single-sig
           * The configured issuer/issuee tells us which user issues the credential and which user to send it to
      * Some users accept credentials
      * Some users verify credentials
      * When issuing, if the optional regisry isn't specified, then create a one-to-one mapping to the registry and the credential being issued.
