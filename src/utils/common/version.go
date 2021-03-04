package main

import (
	"bytes"
	"encoding/hex"
	"fmt"

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
	ver, err := unmarshalVersionedTransaction(val)
	if err != nil {
		return nil, err
	}
	ret := ver.marshal()
	if !bytes.Equal(val, ret) {
		return nil, fmt.Errorf("malformed %d %d", len(ret), len(val))
	}
	return ver, nil
}

func (ver *VersionedTransaction) Marshal() []byte {
	val := ver.marshal()
	ret, err := unmarshalVersionedTransaction(val)
	if err != nil {
		panic(err)
	}
	retv := ret.marshal()
	if !bytes.Equal(retv, val) {
		panic(fmt.Errorf("malformed %s %s", hex.EncodeToString(val), hex.EncodeToString(retv)))
	}
	return val
}

func (ver *VersionedTransaction) PayloadMarshal() []byte {
	val := ver.payloadMarshal()
	ret, err := unmarshalVersionedTransaction(val)
	if err != nil {
		panic(err)
	}
	retv := ret.payloadMarshal()
	if !bytes.Equal(retv, val) {
		panic(fmt.Errorf("malformed %s %s", hex.EncodeToString(val), hex.EncodeToString(retv)))
	}
	return val
}

func (ver *VersionedTransaction) PayloadHash() crypto.Hash {
	return crypto.NewHash(ver.PayloadMarshal())
}

func unmarshalVersionedTransaction(val []byte) (*VersionedTransaction, error) {
	signed, err := NewDecoder(val).DecodeTransaction()
	if err != nil {
		return nil, err
	}
	ver := &VersionedTransaction{SignedTransaction: *signed}
	return ver, nil
}

func (ver *VersionedTransaction) marshal() []byte {
	switch ver.Version {
	case TxVersion:
		return NewEncoder().EncodeTransaction(&ver.SignedTransaction)
	default:
		panic(ver.Version)
	}
}

func (ver *VersionedTransaction) payloadMarshal() []byte {
	switch ver.Version {
	case TxVersion:
		signed := &SignedTransaction{Transaction: ver.Transaction}
		return NewEncoder().EncodeTransaction(signed)
	default:
		panic(ver.Version)
	}
}

func checkTxVersion(val []byte) bool {
	if len(val) < 4 {
		return false
	}
	v := append(magic, 0, TxVersion)
	return bytes.Equal(v, val[:4])
}
