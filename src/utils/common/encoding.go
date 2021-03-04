package main

import (
	"bytes"
	"encoding/binary"
	"sort"

	"github.com/MixinNetwork/mixin/crypto"
)

var (
	magic = []byte{0x77, 0x77}
	null  = []byte{0x00, 0x00}
)

type Encoder struct {
	buf *bytes.Buffer
}

func NewEncoder() *Encoder {
	return &Encoder{buf: new(bytes.Buffer)}
}

func (enc *Encoder) EncodeTransaction(signed *SignedTransaction) []byte {
	if signed.Version != TxVersion {
		panic(signed)
	}
	if len(signed.SignaturesSliceV1) > 0 {
		panic(signed)
	}

	enc.Write(magic)
	enc.Write([]byte{0x00, signed.Version})
	enc.Write(signed.Asset[:])

	il := len(signed.Inputs)
	enc.WriteInt(il)
	for _, in := range signed.Inputs {
		enc.EncodeInput(in)
	}

	ol := len(signed.Outputs)
	enc.WriteInt(ol)
	for _, out := range signed.Outputs {
		enc.EncodeOutput(out)
	}

	el := len(signed.Extra)
	enc.WriteInt(el)
	enc.Write(signed.Extra)

	sl := len(signed.SignaturesMap)
	enc.WriteInt(sl)
	for _, sm := range signed.SignaturesMap {
		enc.EncodeSignatures(sm)
	}

	return enc.buf.Bytes()
}

func (enc *Encoder) EncodeInput(in *Input) {
	enc.Write(in.Hash[:])
	enc.WriteInt(in.Index)

	enc.WriteInt(len(in.Genesis))
	enc.Write(in.Genesis)

	if d := in.Deposit; d == nil {
		enc.Write(null)
	} else {
		enc.Write(magic)
		enc.Write(d.Chain[:])

		enc.WriteInt(len(d.AssetKey))
		enc.Write([]byte(d.AssetKey))

		enc.WriteInt(len(d.TransactionHash))
		enc.Write([]byte(d.TransactionHash))

		enc.WriteUint64(d.OutputIndex)
		enc.WriteInteger(d.Amount)
	}

	if m := in.Mint; m == nil {
		enc.Write(null)
	} else {
		enc.Write(magic)

		enc.WriteInt(len(m.Group))
		enc.Write([]byte(m.Group))

		enc.WriteUint64(m.Batch)
		enc.WriteInteger(m.Amount)
	}
}

func (enc *Encoder) EncodeOutput(o *Output) {
	enc.Write([]byte{0x00, o.Type})
	enc.WriteInteger(o.Amount)
	enc.WriteInt(len(o.Keys))
	for _, k := range o.Keys {
		enc.Write(k[:])
	}

	enc.Write(o.Mask[:])
	enc.WriteInt(len(o.Script))
	enc.Write(o.Script)

	if w := o.Withdrawal; w == nil {
		enc.Write(null)
	} else {
		enc.Write(magic)
		enc.Write(w.Chain[:])

		enc.WriteInt(len(w.AssetKey))
		enc.Write([]byte(w.AssetKey))

		enc.WriteInt(len(w.Address))
		enc.Write([]byte(w.Address))

		enc.WriteInt(len(w.Tag))
		enc.Write([]byte(w.Tag))
	}
}

func (enc *Encoder) EncodeSignatures(sm map[uint16]*crypto.Signature) {
	ss, off := make([]struct {
		Index uint16
		Sig   *crypto.Signature
	}, len(sm)), 0
	for j, sig := range sm {
		ss[off].Index = j
		ss[off].Sig = sig
		off += 1
	}
	sort.Slice(ss, func(i, j int) bool { return ss[i].Index < ss[j].Index })

	enc.WriteInt(len(ss))
	for _, sp := range ss {
		enc.WriteUint16(sp.Index)
		enc.Write(sp.Sig[:])
	}
}

func (enc *Encoder) Write(b []byte) {
	l, err := enc.buf.Write(b)
	if err != nil {
		panic(err)
	}
	if l != len(b) {
		panic(b)
	}
}

func (enc *Encoder) WriteInt(d int) {
	if d > 256 {
		panic(d)
	}
	b := uint16ToByte(uint16(d))
	enc.Write(b)
}

func (enc *Encoder) WriteUint16(d uint16) {
	if d > 256 {
		panic(d)
	}
	b := uint16ToByte(d)
	enc.Write(b)
}

func (enc *Encoder) WriteUint64(d uint64) {
	b := uint64ToByte(d)
	enc.Write(b)
}

func (enc *Encoder) WriteInteger(d Integer) {
	b := d.i.Bytes()
	enc.WriteInt(len(b))
	enc.Write(b)
}

func uint16ToByte(d uint16) []byte {
	b := make([]byte, 2)
	binary.BigEndian.PutUint16(b, d)
	return b
}

func uint64ToByte(d uint64) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, d)
	return b
}
