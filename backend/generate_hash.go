package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "Password123!"

	fmt.Printf("Generating bcrypt hash for: '%s'\n\n", password)

	// Generate 3 hashes to show they're all different but all work
	for i := 1; i <= 3; i++ {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			continue
		}

		fmt.Printf("Hash %d: %s\n", i, string(hash))

		// Verify it works
		err = bcrypt.CompareHashAndPassword(hash, []byte(password))
		if err == nil {
			fmt.Printf("  ✅ Verification: SUCCESS\n\n")
		} else {
			fmt.Printf("  ❌ Verification: FAIL\n\n")
		}
	}

	// Generate one final hash for SQL update
	finalHash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	fmt.Println("--- SQL UPDATE STATEMENT ---")
	fmt.Printf("UPDATE users SET password_hash = '%s' WHERE username IN ('admin', 'manager', 'agent1', 'agent2');\n", string(finalHash))
}
