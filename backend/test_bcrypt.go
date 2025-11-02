package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// The hash from the database
	hash := "$2a$10$rjVLXZ4WOFhxRmf4xYfB1OeZ9pW4WvHGzQ4VDcZfGWnJX5T8ZKzVm"

	// Test passwords
	passwords := []string{
		"Password123!",
		"password123",
		"admin",
		"Test123!",
		"admin123",
	}

	fmt.Println("Testing bcrypt hash verification:")
	fmt.Printf("Hash: %s\n\n", hash)

	for _, password := range passwords {
		err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
		if err == nil {
			fmt.Printf("✅ SUCCESS: '%s' matches the hash!\n", password)
		} else {
			fmt.Printf("❌ FAIL: '%s' does not match (error: %v)\n", password, err)
		}
	}

	// Also generate a new hash for "Password123!"
	fmt.Println("\n--- Generating new hash for 'Password123!' ---")
	newHash, err := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Error generating hash: %v\n", err)
	} else {
		fmt.Printf("New hash: %s\n", string(newHash))

		// Verify the new hash
		err = bcrypt.CompareHashAndPassword(newHash, []byte("Password123!"))
		if err == nil {
			fmt.Println("✅ New hash verification: SUCCESS")
		} else {
			fmt.Printf("❌ New hash verification: FAIL (%v)\n", err)
		}
	}
}
