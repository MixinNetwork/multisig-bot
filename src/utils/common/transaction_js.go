package main

import (
	"encoding/hex"
	"encoding/json"

	"github.com/MixinNetwork/mixin/crypto"
	"github.com/gopherjs/gopherjs/js"
)

func main() {
	js.Global.Set("mixinGo", map[string]interface{}{
		"decodeTransaction": decodeTransaction,
		"buildTransaction":  buildTransaction,
	})
}

func decodeTransaction(input string) string {
	raw, err := hex.DecodeString(input)
	if err != nil {
		return err.Error()
	}
	ver, err := UnmarshalVersionedTransaction(raw)
	if err != nil {
		return err.Error()
	}
	tm := transactionToMap(ver)
	data, err := json.Marshal(tm)
	if err != nil {
		return err.Error()
	}
	return string(data)
}

func buildTransaction(data string) string {
	var raw signerInput
	err := json.Unmarshal([]byte(data), &raw)
	if err != nil {
		return err.Error()
	}

	tx := NewTransaction(raw.Asset)
	for _, in := range raw.Inputs {
		if in.Deposit != nil {
			return "invalid input with deposit"
		} else {
			tx.AddInput(in.Hash, in.Index)
		}
	}

	for _, out := range raw.Outputs {
		if out.Mask.HasValue() {
			tx.Outputs = append(tx.Outputs, &Output{
				Type:   out.Type,
				Amount: out.Amount,
				Keys:   out.Keys,
				Script: out.Script,
				Mask:   out.Mask,
			})
		}
	}

	extra, err := hex.DecodeString(raw.Extra)
	if err != nil {
		return err.Error()
	}
	tx.Extra = extra

	signed := tx.AsLatestVersion()
	return hex.EncodeToString(signed.Marshal())
}

type signerInput struct {
	Inputs []struct {
		Hash    crypto.Hash  `json:"hash"`
		Index   int          `json:"index"`
		Deposit *DepositData `json:"deposit,omitempty"`
		Keys    []crypto.Key `json:"keys"`
		Mask    crypto.Key   `json:"mask"`
	} `json:"inputs"`
	Outputs []struct {
		Type     uint8        `json:"type"`
		Mask     crypto.Key   `json:"mask"`
		Keys     []crypto.Key `json:"keys"`
		Amount   Integer      `json:"amount"`
		Script   Script       `json:"script"`
		Accounts []Address    `json:"accounts"`
	}
	Asset crypto.Hash `json:"asset"`
	Extra string      `json:"extra"`
	Node  string      `json:"-"`
}

func (raw signerInput) ReadUTXO(hash crypto.Hash, index int) (*UTXOWithLock, error) {
	utxo := &UTXOWithLock{}

	for _, in := range raw.Inputs {
		if in.Hash == hash && in.Index == index && len(in.Keys) > 0 {
			utxo.Keys = in.Keys
			utxo.Mask = in.Mask
			return utxo, nil
		}
	}

	return nil, nil
}

func (raw signerInput) CheckDepositInput(deposit *DepositData, tx crypto.Hash) error {
	return nil
}

func (raw signerInput) ReadLastMintDistribution(group string) (*MintDistribution, error) {
	return nil, nil
}

func transactionToMap(tx *VersionedTransaction) map[string]interface{} {
	var inputs []map[string]interface{}
	for _, in := range tx.Inputs {
		if in.Hash.HasValue() {
			inputs = append(inputs, map[string]interface{}{
				"hash":  in.Hash,
				"index": in.Index,
			})
		} else if len(in.Genesis) > 0 {
			inputs = append(inputs, map[string]interface{}{
				"genesis": hex.EncodeToString(in.Genesis),
			})
		} else if in.Deposit != nil {
			inputs = append(inputs, map[string]interface{}{
				"deposit": in.Deposit,
			})
		} else if in.Mint != nil {
			inputs = append(inputs, map[string]interface{}{
				"mint": in.Mint,
			})
		}
	}

	var outputs []map[string]interface{}
	for _, out := range tx.Outputs {
		output := map[string]interface{}{
			"type":   out.Type,
			"amount": out.Amount,
		}
		if len(out.Keys) > 0 {
			output["keys"] = out.Keys
		}
		if len(out.Script) > 0 {
			output["script"] = out.Script
		}
		if out.Mask.HasValue() {
			output["mask"] = out.Mask
		}
		if out.Withdrawal != nil {
			output["withdrawal"] = out.Withdrawal
		}
		outputs = append(outputs, output)
	}

	return map[string]interface{}{
		"version":    tx.Version,
		"asset":      tx.Asset,
		"inputs":     inputs,
		"outputs":    outputs,
		"extra":      hex.EncodeToString(tx.Extra),
		"hash":       tx.PayloadHash(),
		"signatures": tx.SignaturesMap,
	}
}
