package main

import (
	"github.com/MixinNetwork/mixin/crypto"
)

type VersionedTransaction struct {
	SignedTransaction
}

func (tx *SignedTransaction) AsLatestVersion() *VersionedTransaction {
	if tx.Version != TxVersion {
		panic(tx.Version)
	}
	return &VersionedTransaction{
		SignedTransaction: *tx,
	}
}

func (tx *Transaction) AsLatestVersion() *VersionedTransaction {
	if tx.Version != TxVersion {
		panic(tx.Version)
	}
	return &VersionedTransaction{
		SignedTransaction: SignedTransaction{Transaction: *tx},
	}
}

func UnmarshalVersionedTransaction(val []byte) (*VersionedTransaction, error) {
	var ver VersionedTransaction
	err := MsgpackUnmarshal(val, &ver)
	return &ver, err
}

func (ver *VersionedTransaction) Marshal() []byte {
	return MsgpackMarshalPanic(ver.SignedTransaction)
}

func (ver *VersionedTransaction) PayloadMarshal() []byte {
	return MsgpackMarshalPanic(ver.SignedTransaction.Transaction)
}

func (ver *VersionedTransaction) PayloadHash() crypto.Hash {
	return crypto.NewHash(ver.PayloadMarshal())
}
