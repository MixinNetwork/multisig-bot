package main

import (
	"bytes"
	"encoding/hex"
	"fmt"

	"github.com/MixinNetwork/msgpack"
)

func init() {
	msgpack.RegisterExt(0, (*Integer)(nil))
}

var (
	CompressionVersionZero   = []byte{0, 0, 0, 0}
	CompressionVersionLatest = CompressionVersionZero
)

func CompressMsgpackMarshalPanic(val interface{}) []byte {
	return MsgpackMarshalPanic(val)
}

func DecompressMsgpackUnmarshal(data []byte, val interface{}) error {
	return MsgpackUnmarshal(data, val)
}

func MsgpackMarshalPanic(val interface{}) []byte {
	var buf bytes.Buffer
	enc := msgpack.NewEncoder(&buf).UseCompactEncoding(true)
	err := enc.Encode(val)
	if err != nil {
		panic(fmt.Errorf("MsgpackMarshalPanic: %#v %s", val, err.Error()))
	}
	return buf.Bytes()
}

func MsgpackUnmarshal(data []byte, val interface{}) error {
	err := msgpack.Unmarshal(data, val)
	if err == nil {
		return err
	}
	return fmt.Errorf("MsgpackUnmarshal: %s %s", hex.EncodeToString(data), err.Error())
}
