package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// The NEW hash from the database
	hash := "$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG"
	password := "Password123!"

	fmt.Printf("Testing hash: %s\n", hash)
	fmt.Printf("With password: %s\n\n", password)

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err == nil {
		fmt.Println("✅✅✅ SUCCESS! Password matches the hash! ✅✅✅")
	} else {
		fmt.Printf("❌ FAIL: %v\n", err)
	}
}
