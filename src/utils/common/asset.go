package main

import (
	"github.com/MixinNetwork/mixin/crypto"
)

var (
	XINAssetId crypto.Hash
)

type Asset struct {
	ChainId  crypto.Hash
	AssetKey string
}

func init() {
	XINAssetId = crypto.NewHash([]byte("c94ac88f-4671-3976-b60a-09064f1811e8"))
}

func (a *Asset) Verify() error {
	return nil
}

func (a *Asset) AssetId() crypto.Hash {
	return crypto.Hash{}
}

func (a *Asset) FeeAssetId() crypto.Hash {
	return crypto.Hash{}
}
